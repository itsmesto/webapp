import { DatabaseSync } from 'node:sqlite';
import { randomBytes, scryptSync, timingSafeEqual, createHash, randomUUID } from 'node:crypto';
import { mkdirSync, realpathSync, accessSync, constants, existsSync } from 'node:fs';
import path from 'node:path';

const stamp=()=>new Date().toISOString();
const scopes=['dashboard','customers','suppliers','products','company_properties','services','inventory','quotations','estimates','invoices','purchases','payments','expenses','profit','reports','partners','companies','users','backup','records'];
const actions=['view','create','edit','delete','adjust','export','restore','manage','view_own'];
const emptyPermissions=()=>Object.fromEntries(scopes.map(scope=>[scope,Object.fromEntries(actions.map(action=>[action,false]))]));
function rolePermissions(role){
 const p=emptyPermissions(),allow=(scope,...acts)=>acts.forEach(action=>p[scope][action]=true);
 if(role==='company_admin'){for(const scope of scopes)for(const action of actions)p[scope][action]=true;p.companies.create=false;p.companies.delete=false;p.users.manage=true;p.backup.restore=true;p.records.delete=true;}
 if(role==='accountant'){for(const scope of ['dashboard','customers','suppliers','company_properties','invoices','purchases','payments','expenses','profit','reports','backup','partners'])allow(scope,'view');for(const scope of ['payments','expenses','partners','company_properties'])allow(scope,'create','edit');allow('backup','create','export','restore');}
 if(role==='salesperson'){for(const scope of ['dashboard','customers','products','services','quotations','estimates','invoices'])allow(scope,'view','view_own');for(const scope of ['customers'])allow(scope,'create','edit');for(const scope of ['quotations','estimates','invoices'])allow(scope,'create','edit');}
 if(role==='storekeeper'){for(const scope of ['dashboard','products','company_properties','inventory','purchases','suppliers'])allow(scope,'view');allow('inventory','adjust');allow('purchases','create','edit');for(const action of ['create','edit'])allow('company_properties',action);}
 if(role==='manager'){for(const scope of scopes)for(const action of ['view','create','edit','adjust','export'])p[scope][action]=!['companies','users','records'].includes(scope);allow('users','view');allow('backup','view','export');}
 return p;
}
const scrypt=(value,salt)=>scryptSync(value,salt,64).toString('hex');
const safeName=value=>String(value||'Business').normalize('NFKD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-zA-Z0-9._-]+/g,'_').replace(/^\.+|\.+$/g,'').slice(0,80)||'Business';
const validPassword=value=>typeof value==='string'&&value.length>=12&&value.length<=128;
const validUsername=value=>typeof value==='string'&&value.length>=3&&value.length<=120&&(/^[a-z0-9._-]{3,40}$/.test(value)||/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value));
export class AccessControl {
 constructor({registryPath,dataRoot,onCompanyCreate=()=>{},onCompanyUpdate=()=>{},legacyProfile=null}){
  this.dataRoot=path.resolve(dataRoot);mkdirSync(this.dataRoot,{recursive:true});this.onCompanyCreate=onCompanyCreate;this.onCompanyUpdate=onCompanyUpdate;this.legacyProfile=legacyProfile;
  this.db=new DatabaseSync(registryPath);this.db.exec('PRAGMA journal_mode=WAL; PRAGMA foreign_keys=ON');
  this.db.exec(`CREATE TABLE IF NOT EXISTS companies(id TEXT PRIMARY KEY,name TEXT NOT NULL,profile_json TEXT NOT NULL,data_path TEXT NOT NULL,backup_dir TEXT NOT NULL,enabled INTEGER NOT NULL DEFAULT 1,user_limit INTEGER NOT NULL DEFAULT 15,role_limits_json TEXT NOT NULL,modules_json TEXT NOT NULL,created_at TEXT NOT NULL,updated_at TEXT NOT NULL);
  CREATE TABLE IF NOT EXISTS users(id TEXT PRIMARY KEY,username TEXT NOT NULL UNIQUE,display_name TEXT NOT NULL,password_salt TEXT NOT NULL,password_hash TEXT NOT NULL,recovery_salt TEXT NOT NULL,recovery_hash TEXT NOT NULL,active INTEGER NOT NULL DEFAULT 1,is_super INTEGER NOT NULL DEFAULT 0,created_at TEXT NOT NULL,updated_at TEXT NOT NULL);
  CREATE TABLE IF NOT EXISTS memberships(company_id TEXT NOT NULL REFERENCES companies(id),user_id TEXT NOT NULL REFERENCES users(id),role TEXT NOT NULL,active INTEGER NOT NULL DEFAULT 1,permissions_json TEXT NOT NULL,created_at TEXT NOT NULL,updated_at TEXT NOT NULL,PRIMARY KEY(company_id,user_id));
  CREATE TABLE IF NOT EXISTS sessions(token_hash TEXT PRIMARY KEY,user_id TEXT NOT NULL REFERENCES users(id),active_company_id TEXT,expires_at TEXT NOT NULL,created_at TEXT NOT NULL,last_seen TEXT NOT NULL);
  CREATE TABLE IF NOT EXISTS audit(id TEXT PRIMARY KEY,user_id TEXT,company_id TEXT,username TEXT NOT NULL,company_name TEXT NOT NULL,action TEXT NOT NULL,details TEXT NOT NULL,created_at TEXT NOT NULL);
  CREATE INDEX IF NOT EXISTS idx_sessions_user ON sessions(user_id);CREATE INDEX IF NOT EXISTS idx_audit_company_date ON audit(company_id,created_at);`);
 this.rate=new Map();
 for(const membership of this.db.prepare('SELECT company_id,user_id,role,permissions_json FROM memberships').all()){
  let permissions={};try{permissions=JSON.parse(membership.permissions_json||'{}')}catch{}
  if(!Object.prototype.hasOwnProperty.call(permissions,'company_properties')){permissions.company_properties=rolePermissions(membership.role).company_properties;this.db.prepare('UPDATE memberships SET permissions_json=?,updated_at=? WHERE company_id=? AND user_id=?').run(JSON.stringify(permissions),this.now(),membership.company_id,membership.user_id);}
 }
 }
 close(){this.db.close()}
 now(){return stamp()}
 scalar(sql,...args){return this.db.prepare(sql).get(...args)}
 all(sql,...args){return this.db.prepare(sql).all(...args)}
 run(sql,...args){return this.db.prepare(sql).run(...args)}
 txn(fn){this.db.exec('BEGIN IMMEDIATE');try{const r=fn();this.db.exec('COMMIT');return r}catch(e){this.db.exec('ROLLBACK');throw e}}
 cookie(token){return 'invoicey_session='+encodeURIComponent(token)+'; Path=/; HttpOnly; SameSite=Strict; Max-Age=43200'}
 clearCookie(){return 'invoicey_session=; Path=/; HttpOnly; SameSite=Strict; Max-Age=0'}
 parseCookie(req){const value=String(req.headers.cookie||'').split(';').map(x=>x.trim()).find(x=>x.startsWith('invoicey_session='));if(!value)return '';try{return decodeURIComponent(value.slice(17))}catch{return ''}}
 allowedRate(req,key){const ip=String(req.socket?.remoteAddress||'local')+':'+key,now=Date.now(),entry=this.rate.get(ip)||{start:now,count:0};if(now-entry.start>900000){entry.start=now;entry.count=0}entry.count++;this.rate.set(ip,entry);return entry.count<=8}
 auditRow(actor,companyId,action,details=''){
   const company=companyId?this.scalar('SELECT name FROM companies WHERE id=?',companyId):null;
   this.run('INSERT INTO audit(id,user_id,company_id,username,company_name,action,details,created_at) VALUES(?,?,?,?,?,?,?,?)',randomUUID(),actor?.userId||null,companyId||null,actor?.username||'System',company?.name||'',action,String(details||'').slice(0,1000),this.now());
 }
 status(actor=null){
  const n=this.scalar('SELECT count(*) n FROM users').n;
  if(!n){let legacyCompany=null;try{legacyCompany=typeof this.legacyProfile==='function'?this.legacyProfile():this.legacyProfile}catch{}return {setupRequired:true,authenticated:false,legacyCompany};}
  if(!actor)return {setupRequired:false,authenticated:false};
  const companies=actor.isSuper?this.all('SELECT id,name,enabled,user_limit AS userLimit,modules_json FROM companies WHERE enabled=1 ORDER BY name').map(c=>({...c,modules:JSON.parse(c.modules_json),modules_json:undefined})):this.userCompanies(actor.userId),active=companies.find(c=>c.id===actor.activeCompanyId)||null;
  const membership=active?this.scalar('SELECT role,permissions_json FROM memberships WHERE company_id=? AND user_id=? AND active=1',active.id,actor.userId):null;
  const permissions=actor.isSuper?Object.fromEntries(scopes.map(scope=>[scope,Object.fromEntries(actions.map(a=>[a,true]))])):membership?JSON.parse(membership.permissions_json):emptyPermissions();
  return {setupRequired:false,authenticated:true,user:{id:actor.userId,username:actor.username,displayName:actor.displayName,isSuper:!!actor.isSuper,role:membership?.role|| (actor.isSuper?'super_admin':null)},company:active,companies:actor.isSuper?this.all('SELECT id,name,enabled,user_limit AS userLimit,modules_json FROM companies ORDER BY name').map(c=>({...c,modules:JSON.parse(c.modules_json),modules_json:undefined})):companies,permissions};
 }
 userCompanies(userId){return this.all('SELECT c.id,c.name,c.enabled,c.user_limit AS userLimit,c.modules_json FROM companies c JOIN memberships m ON m.company_id=c.id WHERE m.user_id=? AND m.active=1 AND c.enabled=1 ORDER BY c.name',userId).map(c=>({...c,modules:JSON.parse(c.modules_json),modules_json:undefined}))}
 companyConfig(id){const row=this.scalar('SELECT * FROM companies WHERE id=? AND enabled=1',id);if(!row)return null;return {id:row.id,name:row.name,profile:JSON.parse(row.profile_json),dataPath:row.data_path,backupDir:row.backup_dir,userLimit:row.user_limit,roleLimits:JSON.parse(row.role_limits_json),modules:JSON.parse(row.modules_json),enabled:!!row.enabled}}
 updateBackupDirectory(actor,companyId,directory){if(!actor.isSuper&&!this.scalar("SELECT 1 FROM memberships WHERE company_id=? AND user_id=? AND active=1 AND role='company_admin'",companyId,actor.userId))throw Object.assign(new Error('Company administrator access is required.'),{status:403});this.run('UPDATE companies SET backup_dir=?,updated_at=? WHERE id=?',directory,this.now(),companyId);return {success:true,backupDirectory:directory}}
 updateProfile(actor,companyId,profile){if(!actor.isSuper&&!this.scalar("SELECT 1 FROM memberships WHERE company_id=? AND user_id=? AND active=1 AND role='company_admin'",companyId,actor.userId))throw Object.assign(new Error('Company administrator access is required.'),{status:403});const row=this.scalar('SELECT profile_json FROM companies WHERE id=?',companyId);if(!row)throw new Error('Company not found.');this.run('UPDATE companies SET name=?,profile_json=?,updated_at=? WHERE id=?',profile.name,JSON.stringify(profile),this.now(),companyId);return {success:true}}
 authenticate(req){
  const token=this.parseCookie(req);if(!token||token.length<32)return null;const hash=createHash('sha256').update(token).digest('hex');
  const session=this.scalar('SELECT s.*,u.username,u.display_name,u.active,u.is_super FROM sessions s JOIN users u ON u.id=s.user_id WHERE s.token_hash=?',hash);
  if(!session||!session.active||session.expires_at<this.now()){if(session)this.run('DELETE FROM sessions WHERE token_hash=?',hash);return null}
  this.run('UPDATE sessions SET expires_at=?,last_seen=? WHERE token_hash=?',new Date(Date.now()+12*3600000).toISOString(),this.now(),hash);
  const membership=session.active_company_id?this.scalar('SELECT active,role FROM memberships WHERE company_id=? AND user_id=?',session.active_company_id,session.user_id):null;
  if(session.active_company_id&&!session.is_super&&(!membership?.active||!this.scalar('SELECT enabled FROM companies WHERE id=?',session.active_company_id)?.enabled))return null;
  return {userId:session.user_id,username:session.username,displayName:session.display_name,isSuper:!!session.is_super,role:membership?.role||(session.is_super?'super_admin':null),activeCompanyId:session.active_company_id,sessionHash:hash};
 }
 createSession(userId,companyId){const token=randomBytes(32).toString('base64url'),hash=createHash('sha256').update(token).digest('hex'),at=this.now();this.run('INSERT INTO sessions VALUES(?,?,?,?,?,?)',hash,userId,companyId,new Date(Date.now()+12*3600000).toISOString(),at,at);return {token,hash}}
 actorUser(id){return this.scalar('SELECT id AS userId,username,display_name AS displayName,is_super AS isSuper FROM users WHERE id=?',id)}
 async handleApi(req,url,body){
  const p=url.pathname,m=req.method;
  if(m==='GET'&&p==='/api/auth/status')return {body:this.status(this.authenticate(req))};
  if(m==='POST'&&p==='/api/auth/setup'){
   if(this.scalar('SELECT id FROM users LIMIT 1'))throw Object.assign(new Error('Initial setup is already complete.'),{status:409});
   if(!this.allowedRate(req,'setup'))throw Object.assign(new Error('Too many setup attempts. Try again shortly.'),{status:429});
   const profile=body.company||{},name=String(profile.name||'').trim(),username=String(body.username||'').trim().toLowerCase(),displayName=String(body.displayName||'').trim(),password=body.password,superUsername=String(body.superUsername||'').trim().toLowerCase(),superPassword=body.superPassword,superDisplayName=String(body.superDisplayName||'Super Administrator').trim(),recoveryCode=String(body.recoveryCode||'').trim(),recoveryCodeConfirm=String(body.recoveryCodeConfirm||'').trim(),superRecoveryCode=String(body.superRecoveryCode||'').trim(),superRecoveryCodeConfirm=String(body.superRecoveryCodeConfirm||'').trim(),hasSeparateSuper=!!(superUsername||superPassword||superRecoveryCode||body.superDisplayName);
   if(!name||!username||!displayName||!validPassword(password)||!validUsername(username))throw new Error('Enter a company name, administrator name, valid username or email, and a password of at least 12 characters.');
   if(recoveryCode.length<20||recoveryCode!==recoveryCodeConfirm)throw new Error('Enter a recovery code of at least 20 characters and confirm it exactly.');
   if(hasSeparateSuper){
    if(username===superUsername||!validUsername(superUsername)||!validPassword(superPassword)||superRecoveryCode.length<20||superRecoveryCode!==superRecoveryCodeConfirm)throw new Error('The optional software administrator details require matching recovery codes of at least 20 characters.');
   }
   const companyId=randomUUID(),userId=randomUUID(),superUserId=hasSeparateSuper?randomUUID():userId,at=this.now(),passwordSalt=randomBytes(16).toString('hex'),recoverySalt=randomBytes(16).toString('hex'),superSalt=hasSeparateSuper?randomBytes(16).toString('hex'):passwordSalt,superRecoverSalt=hasSeparateSuper?randomBytes(16).toString('hex'):recoverySalt;
   const backupDir=path.resolve(String(body.backupDir||path.join(this.dataRoot,companyId,'backups')));this.validatePath(backupDir);
   const company={id:companyId,name,enabled:1,user_limit:15,role_limits:{company_admin:2,accountant:3,salesperson:10,storekeeper:10,manager:10,custom:10},modules:Object.fromEntries(scopes.map(s=>[s,true])),profile:{...profile,name},dataPath:path.join(this.dataRoot,companyId,'business.sqlite'),backupDir};
   mkdirSync(path.dirname(company.dataPath),{recursive:true});mkdirSync(backupDir,{recursive:true});
   try{this.onCompanyCreate(company,{isInitial:true});this.txn(()=>{
    this.run('INSERT INTO companies VALUES(?,?,?,?,?,?,?,?,?,?,?)',company.id,company.name,JSON.stringify(company.profile),company.dataPath,company.backupDir,1,15,JSON.stringify(company.role_limits),JSON.stringify(company.modules),at,at);
    this.run('INSERT INTO users VALUES(?,?,?,?,?,?,?,?,?,?,?)',userId,username,displayName,passwordSalt,scrypt(password,passwordSalt),recoverySalt,scrypt(recoveryCode,recoverySalt),1,hasSeparateSuper?0:1,at,at);
    this.run('INSERT INTO memberships VALUES(?,?,?,?,?,?,?)',companyId,userId,'company_admin',1,JSON.stringify(rolePermissions('company_admin')),at,at);
    if(hasSeparateSuper){this.run('INSERT INTO users VALUES(?,?,?,?,?,?,?,?,?,?,?)',superUserId,superUsername,superDisplayName,superSalt,scrypt(superPassword,superSalt),superRecoverSalt,scrypt(superRecoveryCode,superRecoverSalt),1,1,at,at);}
    const actor={userId,username,displayName,isSuper:!hasSeparateSuper};this.auditRow(actor,companyId,'setup.completed');if(hasSeparateSuper)this.auditRow({userId:superUserId,username:superUsername,displayName:superDisplayName,isSuper:true},companyId,'super_admin.created');
   })}catch(error){throw error}
   const session=this.createSession(userId,companyId);return {body:{success:true,setupRequired:false,authenticated:true,user:{id:userId,username,displayName,isSuper:!hasSeparateSuper,role:'company_admin'},company:{id:companyId,name},companies:[{id:companyId,name}],permissions:rolePermissions('company_admin'),recoveryCode,superUsername:hasSeparateSuper?superUsername:'',superAdminRecoveryCode:hasSeparateSuper?superRecoveryCode:''},cookie:this.cookie(session.token)};
  }
  if(m==='POST'&&p==='/api/auth/signup'){
   if(!this.scalar('SELECT id FROM users LIMIT 1'))throw Object.assign(new Error('Complete first-time setup before creating another account.'),{status:409});
   if(!this.allowedRate(req,'signup'))throw Object.assign(new Error('Too many account creation attempts. Try again shortly.'),{status:429});
   const profile=body.company||{},name=String(profile.name||'').trim(),username=String(body.username||'').trim().toLowerCase(),displayName=String(body.displayName||'').trim(),password=body.password,recoveryCode=String(body.recoveryCode||'').trim(),recoveryCodeConfirm=String(body.recoveryCodeConfirm||'').trim();
   if(!name||name.length>160||!displayName||displayName.length>120||!/^[a-z0-9._-]{3,40}$/.test(username)||!validPassword(password)||recoveryCode.length<20||recoveryCode!==recoveryCodeConfirm)throw new Error('Enter a company name, your full name, a valid username, a password of at least 12 characters, and matching recovery codes of at least 20 characters.');
   if(this.scalar('SELECT id FROM users WHERE username=?',username))throw Object.assign(new Error('That username is already in use. Choose another username.'),{status:409});
   if(this.scalar('SELECT id FROM companies WHERE lower(name)=lower(?)',name))throw Object.assign(new Error('A business with that name already exists. Choose another name.'),{status:409});
   const companyId=randomUUID(),userId=randomUUID(),at=this.now(),passwordSalt=randomBytes(16).toString('hex'),recoverySalt=randomBytes(16).toString('hex'),backupDir=path.join(this.dataRoot,companyId,'backups'),dataPath=path.join(this.dataRoot,companyId,'business.sqlite'),roleLimits={company_admin:2,accountant:3,salesperson:10,storekeeper:10,manager:10,custom:10},modules=Object.fromEntries(scopes.map(s=>[s,true])),company={id:companyId,name,profile:{...profile,name},dataPath,backupDir,user_limit:15,role_limits:roleLimits,modules,enabled:1};
   mkdirSync(path.dirname(dataPath),{recursive:true});mkdirSync(backupDir,{recursive:true});this.onCompanyCreate(company,{isInitial:false});
   this.txn(()=>{this.run('INSERT INTO companies VALUES(?,?,?,?,?,?,?,?,?,?,?)',companyId,name,JSON.stringify(company.profile),dataPath,backupDir,1,15,JSON.stringify(roleLimits),JSON.stringify(modules),at,at);this.run('INSERT INTO users VALUES(?,?,?,?,?,?,?,?,?,?,?)',userId,username,displayName,passwordSalt,scrypt(password,passwordSalt),recoverySalt,scrypt(recoveryCode,recoverySalt),1,0,at,at);this.run('INSERT INTO memberships VALUES(?,?,?,?,?,?,?)',companyId,userId,'company_admin',1,JSON.stringify(rolePermissions('company_admin')),at,at);const actor={userId,username,displayName,isSuper:false};this.auditRow(actor,companyId,'auth.signup');this.auditRow(actor,companyId,'company.created',name)});
   const session=this.createSession(userId,companyId);return {body:{success:true,setupRequired:false,authenticated:true,user:{id:userId,username,displayName,isSuper:false,role:'company_admin'},company:{id:companyId,name},companies:[{id:companyId,name}],permissions:rolePermissions('company_admin'),recoveryCode},cookie:this.cookie(session.token)};
  }
  if(m==='POST'&&p==='/api/auth/login'){
   if(!this.allowedRate(req,'login:'+String(body.username||'').toLowerCase()))throw Object.assign(new Error('Too many login attempts. Wait 15 minutes before trying again.'),{status:429});
   const username=String(body.username||'').trim().toLowerCase(),user=this.scalar('SELECT * FROM users WHERE username=?',username);
   const dummySalt='0123456789abcdef0123456789abcdef';const matches=user&&user.active&&timingSafeEqual(Buffer.from(scrypt(String(body.password||''),user.password_salt),'hex'),Buffer.from(user.password_hash,'hex'));
   if(!matches){scrypt(String(body.password||''),dummySalt);throw Object.assign(new Error('Username or password is incorrect.'),{status:401})}
   let companies=this.userCompanies(user.id);if(user.is_super)companies=this.all('SELECT id,name,enabled,user_limit AS userLimit FROM companies WHERE enabled=1 ORDER BY name');
   const company=companies.find(c=>c.id===body.companyId)||companies[0]||null,actor={userId:user.id,username:user.username,displayName:user.display_name,isSuper:!!user.is_super};
   const ses=this.createSession(user.id,company?.id||null);this.auditRow(actor,company?.id,'auth.login');return {body:{...this.status({...actor,activeCompanyId:company?.id||null}),success:true},cookie:this.cookie(ses.token)};
  }
  const actor=this.authenticate(req);
  if(m==='POST'&&p==='/api/auth/recover'){
   if(!this.allowedRate(req,'recover:'+String(body.username||'').toLowerCase()))throw Object.assign(new Error('Too many recovery attempts. Wait 15 minutes before trying again.'),{status:429});
   const username=String(body.username||'').trim().toLowerCase(),recovery=String(body.recoveryCode||''),password=body.newPassword,user=this.scalar('SELECT * FROM users WHERE username=?',username);
   const isValid=user&&timingSafeEqual(Buffer.from(scrypt(recovery,user.recovery_salt),'hex'),Buffer.from(user.recovery_hash,'hex'));
   if(!isValid||!validPassword(password))throw Object.assign(new Error('Account or recovery details could not be verified. Enter the correct recovery code and a new password of at least 12 characters.'),{status:400});
   const salt=randomBytes(16).toString('hex');this.txn(()=>{this.run('UPDATE users SET password_salt=?,password_hash=?,updated_at=? WHERE id=?',salt,scrypt(password,salt),this.now(),user.id);this.run('DELETE FROM sessions WHERE user_id=?',user.id);this.auditRow({userId:user.id,username:user.username},null,'auth.password_recovered')});return {body:{success:true,message:'Password reset. Sign in with the new password.'},cookie:this.clearCookie()};
  }
  if(m==='POST'&&p==='/api/auth/logout'){
   if(actor){this.auditRow(actor,actor.activeCompanyId,'auth.logout');this.run('DELETE FROM sessions WHERE token_hash=?',actor.sessionHash)}return {body:{success:true},cookie:this.clearCookie()};
  }
  if(!actor)throw Object.assign(new Error('Sign in to continue.'),{status:401});
  if(m==='POST'&&p==='/api/auth/change-password'){
   const user=this.scalar('SELECT * FROM users WHERE id=?',actor.userId);if(!timingSafeEqual(Buffer.from(scrypt(String(body.currentPassword||''),user.password_salt),'hex'),Buffer.from(user.password_hash,'hex')))throw Object.assign(new Error('Current password is incorrect.'),{status:400});if(!validPassword(body.newPassword))throw new Error('New password must contain at least 12 characters.');
   const salt=randomBytes(16).toString('hex');this.txn(()=>{this.run('UPDATE users SET password_salt=?,password_hash=?,updated_at=? WHERE id=?',salt,scrypt(body.newPassword,salt),this.now(),actor.userId);this.run('DELETE FROM sessions WHERE user_id=? AND token_hash<>?',actor.userId,actor.sessionHash);this.auditRow(actor,actor.activeCompanyId,'auth.password_changed')});return {body:{success:true}};
  }
  if(m==='POST'&&p==='/api/auth/select-company'){
   const companyId=String(body.companyId||''),company=this.scalar('SELECT * FROM companies WHERE id=? AND enabled=1',companyId);
   const member=company&&(actor.isSuper||this.scalar('SELECT 1 FROM memberships WHERE company_id=? AND user_id=? AND active=1',companyId,actor.userId));if(!member)throw Object.assign(new Error('You do not have access to that company.'),{status:403});
   this.run('UPDATE sessions SET active_company_id=? WHERE token_hash=?',companyId,actor.sessionHash);this.auditRow(actor,companyId,'company.switched');return {body:this.status({...actor,activeCompanyId:companyId})};
  }
  if(m==='GET'&&p==='/api/admin/companies'){
   this.requireSuper(actor);return {body:this.all('SELECT c.id,c.name,c.enabled,c.user_limit AS userLimit,(SELECT count(*) FROM memberships m WHERE m.company_id=c.id AND m.active=1) AS userCount,c.role_limits_json,c.modules_json,c.created_at,c.updated_at FROM companies c ORDER BY c.created_at').map(c=>({...c,roleLimits:JSON.parse(c.role_limits_json),modules:JSON.parse(c.modules_json),role_limits_json:undefined,modules_json:undefined}))};
  }
  if(m==='POST'&&p==='/api/admin/companies'){
   this.requireSuper(actor);const profile=body.company||{},name=String(profile.name||'').trim(),admin=body.admin||{};if(!name)throw new Error('Company name is required.');if(this.scalar('SELECT id FROM companies WHERE lower(name)=lower(?)',name))throw Object.assign(new Error('A business with that name already exists.'),{status:409});const adminUsername=String(admin.username||'').trim().toLowerCase(),adminPassword=String(admin.password||''),adminRecovery=String(admin.recoveryCode||'').trim(),adminRecoveryConfirm=String(admin.recoveryCodeConfirm||'').trim();if(!/^[a-z0-9._-]{3,40}$/.test(adminUsername)||!validPassword(adminPassword)||adminRecovery.length<20||adminRecovery!==adminRecoveryConfirm)throw new Error('Add a company administrator with a valid username, password and matching recovery codes of at least 20 characters.');const companyId=randomUUID(),at=this.now(),backupDir=path.resolve(String(body.backupDir||path.join(this.dataRoot,companyId,'backups')));this.validatePath(backupDir);const dataPath=path.join(this.dataRoot,companyId,'business.sqlite'),limits=body.roleLimits||{company_admin:2,accountant:3,salesperson:10,storekeeper:10,manager:10,custom:10},modules=body.modules||Object.fromEntries(scopes.map(s=>[s,true])),userLimit=Math.min(500,Math.max(1,Math.floor(Number(body.userLimit||15))));if(Number(body.userLimit||15)>500||Number(body.userLimit||15)<1)throw new Error('Maximum users must be between 1 and 500.');if(Number(limits.company_admin??2)<1)throw new Error('Allow at least one company administrator.');
   mkdirSync(path.dirname(dataPath),{recursive:true});mkdirSync(backupDir,{recursive:true});const company={id:companyId,name,profile:{...profile,name},dataPath,backupDir,role_limits:limits,modules,enabled:1,user_limit:userLimit};this.onCompanyCreate(company,{isInitial:false});
   const user=this.scalar('SELECT * FROM users WHERE username=?',adminUsername),userId=user?.id||randomUUID();if(user?.is_super)throw new Error('A super administrator account cannot also be a company administrator.');if(user&&this.scalar('SELECT 1 FROM memberships WHERE company_id=? AND user_id=?',companyId,userId))throw new Error('That user already belongs to this business.');
   this.txn(()=>{this.run('INSERT INTO companies VALUES(?,?,?,?,?,?,?,?,?,?,?)',companyId,name,JSON.stringify(company.profile),dataPath,backupDir,1,userLimit,JSON.stringify(limits),JSON.stringify(modules),at,at);if(!user){const salt=randomBytes(16).toString('hex'),rs=randomBytes(16).toString('hex');this.run('INSERT INTO users VALUES(?,?,?,?,?,?,?,?,?,?,?)',userId,adminUsername,String(admin.displayName||adminUsername),salt,scrypt(adminPassword,salt),rs,scrypt(adminRecovery,rs),1,0,at,at)}this.run('INSERT INTO memberships VALUES(?,?,?,?,?,?,?)',companyId,userId,'company_admin',1,JSON.stringify(rolePermissions('company_admin')),at,at);this.auditRow(actor,companyId,'company.created',name);this.auditRow(actor,companyId,'company.admin_created',adminUsername)});return {body:{id:companyId,name,enabled:1,userLimit,roleLimits:limits,modules,administrator:{username:adminUsername,recoveryCode:user?'':adminRecovery,existingUser:!!user}}};
  }
  if(m==='PUT'&&p.startsWith('/api/admin/companies/')){
   this.requireSuper(actor);const companyId=p.split('/').pop(),existing=this.scalar('SELECT * FROM companies WHERE id=?',companyId);if(!existing)throw new Error('Company not found.');const name=String(body.name||existing.name).trim(),profile=body.profile||JSON.parse(existing.profile_json),userLimit=body.userLimit===undefined?existing.user_limit:Math.floor(Number(body.userLimit)),roleLimits=body.roleLimits||JSON.parse(existing.role_limits_json),modules=body.modules||JSON.parse(existing.modules_json),enabled=body.enabled===undefined?existing.enabled:(body.enabled?1:0);
   if(!name)throw new Error('Company name is required.');if(userLimit<1||userLimit>500||!Number.isFinite(userLimit))throw new Error('Maximum users must be between 1 and 500.');if(this.scalar('SELECT id FROM companies WHERE lower(name)=lower(?) AND id<>?',name,companyId))throw Object.assign(new Error('A business with that name already exists.'),{status:409});if(this.scalar('SELECT count(*) n FROM memberships WHERE company_id=? AND active=1',companyId).n>userLimit)throw Object.assign(new Error('The new user limit is below this company’s active user count.'),{status:409});if(existing.enabled&&!enabled&&this.scalar('SELECT count(*) n FROM companies WHERE enabled=1').n<=1)throw new Error('Keep at least one active company so the software administrators can continue managing the system.');
   this.run('UPDATE companies SET name=?,profile_json=?,user_limit=?,role_limits_json=?,modules_json=?,enabled=?,updated_at=? WHERE id=?',name,JSON.stringify({...profile,name}),userLimit,JSON.stringify(roleLimits),JSON.stringify(modules),enabled,this.now(),companyId);this.onCompanyUpdate({id:companyId,name,profile:{...profile,name}});this.auditRow(actor,companyId,enabled?'company.updated':'company.disabled');return {body:{success:true}};
  }
  if(m==='GET'&&p==='/api/admin/users'){
   const companyId=String(url.searchParams.get('companyId')||actor.activeCompanyId||''),company=this.requireCompanyAdmin(actor,companyId);return {body:this.all(`SELECT u.id,u.username,u.display_name AS displayName,CASE WHEN u.active=1 AND m.active=1 THEN 1 ELSE 0 END AS active,m.role,m.permissions_json,m.created_at FROM memberships m JOIN users u ON u.id=m.user_id WHERE m.company_id=? ORDER BY u.username`,companyId).map(u=>({...u,permissions:JSON.parse(u.permissions_json),permissions_json:undefined,created_at:undefined,companyId}))};
  }
  if(m==='POST'&&p==='/api/admin/users'){
   const companyId=String(body.companyId||actor.activeCompanyId||''),company=this.requireCompanyAdmin(actor,companyId),role=String(body.role||'custom');if(!['company_admin','accountant','salesperson','storekeeper','manager','custom'].includes(role))throw new Error('Choose a supported user role.');
   const total=this.scalar('SELECT count(*) n FROM memberships WHERE company_id=? AND active=1',companyId).n;if(total>=company.user_limit)throw Object.assign(new Error('This company has reached its user limit.'),{status:409});const roleLimits=JSON.parse(company.role_limits_json),used=this.scalar('SELECT count(*) n FROM memberships WHERE company_id=? AND role=? AND active=1',companyId,role).n;if(used>=(roleLimits[role]??company.user_limit))throw Object.assign(new Error('This role has reached its user limit.'),{status:409});
   const username=String(body.username||'').trim().toLowerCase(),password=body.password;if(!/^[a-z0-9._-]{3,40}$/.test(username))throw new Error('Enter a valid username.');const existing=this.scalar('SELECT * FROM users WHERE username=?',username),userId=existing?.id||randomUUID();if(!existing&&!validPassword(password))throw new Error('A new user password must contain at least 12 characters.');if(existing&&this.scalar('SELECT 1 FROM memberships WHERE company_id=? AND user_id=?',companyId,userId))throw Object.assign(new Error('This user already belongs to the selected company.'),{status:409});const salt=randomBytes(16).toString('hex'),recoverSalt=randomBytes(16).toString('hex'),recoveryCode=existing?'':String(body.recoveryCode||'').trim(),recoveryCodeConfirm=existing?'':String(body.recoveryCodeConfirm||'').trim();if(!existing&&(recoveryCode.length<20||recoveryCode!==recoveryCodeConfirm))throw new Error('Enter and confirm a recovery code of at least 20 characters.');const at=this.now(),permissions=role==='custom'?body.permissions||emptyPermissions():{...rolePermissions(role),...(body.permissions||{})};
   this.txn(()=>{if(!existing)this.run('INSERT INTO users VALUES(?,?,?,?,?,?,?,?,?,?,?)',userId,username,String(body.displayName||username),salt,scrypt(password,salt),recoverSalt,scrypt(recoveryCode,recoverSalt),1,0,at,at);this.run('INSERT INTO memberships VALUES(?,?,?,?,?,?,?)',companyId,userId,role,body.active===false?0:1,JSON.stringify(permissions),at,at);this.auditRow(actor,companyId,existing?'user.added_to_company':'user.created',username)});return {body:{id:userId,username,displayName:existing?.display_name||String(body.displayName||username),role,active:true,recoveryCode,existingUser:!!existing}};
  }
  const userMatch=p.match(/^\/api\/admin\/users\/([^/]+)$/);
  if(userMatch&&m==='PUT'){
   const userId=userMatch[1],companyId=String(body.companyId||actor.activeCompanyId||''),company=this.requireCompanyAdmin(actor,companyId),membership=this.scalar('SELECT m.*,u.username FROM memberships m JOIN users u ON u.id=m.user_id WHERE m.company_id=? AND m.user_id=?',companyId,userId);if(!membership)throw new Error('User not found.');if(body.resetPassword&&!validPassword(body.newPassword))throw new Error('The new password must contain at least 12 characters.');
   if(body.permissions){membership.permissions_json=JSON.stringify(body.permissions)}if(body.role){if(!['company_admin','accountant','salesperson','storekeeper','manager','custom'].includes(body.role))throw new Error('Choose a supported user role.');membership.role=String(body.role)}if(body.active!==undefined)membership.active=body.active?1:0;
   const roleLimits=JSON.parse(company.role_limits_json);if(membership.active){const total=this.scalar('SELECT count(*) n FROM memberships WHERE company_id=? AND active=1 AND user_id<>?',companyId,userId).n;if(total>=company.user_limit)throw Object.assign(new Error('This company has reached its active user limit.'),{status:409});const used=this.scalar('SELECT count(*) n FROM memberships WHERE company_id=? AND active=1 AND role=? AND user_id<>?',companyId,membership.role,userId).n;if(used>=(roleLimits[membership.role]??company.user_limit))throw Object.assign(new Error('This role has reached its active user limit.'),{status:409});}
   const remainingAdmins=this.scalar("SELECT count(*) n FROM memberships WHERE company_id=? AND role='company_admin' AND active=1 AND user_id<>?",companyId,userId).n;if(remainingAdmins+(membership.active&&membership.role==='company_admin'?1:0)<1)throw new Error('Keep at least one active company administrator.');this.run('UPDATE memberships SET role=?,active=?,permissions_json=?,updated_at=? WHERE company_id=? AND user_id=?',membership.role,membership.active,membership.permissions_json,this.now(),companyId,userId);if(body.resetPassword){const salt=randomBytes(16).toString('hex');this.run('UPDATE users SET password_salt=?,password_hash=?,updated_at=? WHERE id=?',salt,scrypt(body.newPassword,salt),userId);this.run('DELETE FROM sessions WHERE user_id=?',userId)}this.auditRow(actor,companyId,'user.updated',membership.username);return {body:{success:true}};
  }
  if(userMatch&&m==='DELETE'){
   const userId=userMatch[1],companyId=String(body.companyId||actor.activeCompanyId||''),company=this.requireCompanyAdmin(actor,companyId),membership=this.scalar('SELECT m.*,u.username FROM memberships m JOIN users u ON u.id=m.user_id WHERE company_id=? AND user_id=?',companyId,userId);if(!membership)throw new Error('User not found.');if(membership.role==='company_admin')throw new Error('Deactivate the administrator or promote another first.');this.txn(()=>{this.run('DELETE FROM memberships WHERE company_id=? AND user_id=?',companyId,userId);this.auditRow(actor,companyId,'user.removed',membership.username);if(!this.scalar('SELECT user_id FROM memberships WHERE user_id=? LIMIT 1',userId)){this.run('DELETE FROM sessions WHERE user_id=?',userId);this.run('DELETE FROM users WHERE id=?',userId)}});return {body:{success:true}};
  }
  if(m==='GET'&&p==='/api/admin/audit'){
   if(!actor.isSuper&&!this.isAdmin(actor,actor.activeCompanyId))throw Object.assign(new Error('Administrator access is required.'),{status:403});const requested=url.searchParams.get('companyId')||actor.activeCompanyId||null;if(!actor.isSuper&&requested!==actor.activeCompanyId)throw Object.assign(new Error('You can only view your company activity.'),{status:403});return {body:this.all('SELECT username,company_name AS companyName,action,details,created_at AS date FROM audit WHERE (? IS NULL OR company_id=?) ORDER BY created_at DESC LIMIT 1000',requested,requested)};
  }
  return null;
 }
 can(actor,scope,action='view'){
  if(actor?.isSuper)return true;const c=this.scalar('SELECT * FROM companies WHERE id=? AND enabled=1',actor?.activeCompanyId||'');if(!c||JSON.parse(c.modules_json)[scope]===false)return false;const m=this.scalar('SELECT permissions_json FROM memberships WHERE company_id=? AND user_id=? AND active=1',c.id,actor.userId);return !!m&&JSON.parse(m.permissions_json)?.[scope]?.[action]===true;
 }
 requireCompanyAdmin(actor,companyId){const c=this.scalar('SELECT * FROM companies WHERE id=? AND enabled=1',companyId);if(!c||(!actor.isSuper&&!this.scalar('SELECT 1 FROM memberships WHERE company_id=? AND user_id=? AND active=1 AND role=\'company_admin\'',companyId,actor.userId)))throw Object.assign(new Error('Company administrator access is required.'),{status:403});return c}
 isAdmin(actor,companyId){return !!actor?.isSuper||!!this.scalar('SELECT 1 FROM memberships WHERE company_id=? AND user_id=? AND active=1 AND role IN (\'company_admin\',\'manager\')',companyId,actor?.userId)}
 requireSuper(actor){if(!actor.isSuper)throw Object.assign(new Error('Super administrator access is required.'),{status:403})}
 validatePath(dir){if(!path.isAbsolute(dir))throw new Error('Choose a full backup folder path.');mkdirSync(dir,{recursive:true});const full=realpathSync(dir);accessSync(full,constants.W_OK);return full}
}
export { scopes, actions, rolePermissions, emptyPermissions, safeName };

