import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { once } from 'node:events';
import { mkdirSync, mkdtempSync, writeFileSync, readFileSync, readdirSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { DatabaseSync } from 'node:sqlite';

const root=path.dirname(path.dirname(fileURLToPath(import.meta.url)));
mkdirSync(path.join(root,'tmp'),{recursive:true});
const directory=mkdtempSync(path.join(root,'tmp','tenant-qc-'));
const emailOutbox=path.join(directory,'email-outbox.jsonl');
const results=[];let child,base,stderr='',activeCookie='';
const check=(name,fn)=>{try{fn();results.push({name,passed:true});}catch(error){results.push({name,passed:false,error:error.message});}};
async function start(){
  child=spawn(process.execPath,[path.join(root,'hosting','server.mjs')],{cwd:root,windowsHide:true,env:{...process.env,NODE_ENV:'test',INVOICEY_TEST_EMAIL_OUTBOX:emailOutbox,HOST:'127.0.0.1',PORT:'0',LEDGER_DATA_DIR:directory,LEDGER_DB:path.join(directory,'ledgerly.sqlite')},stdio:['ignore','pipe','pipe']});
  child.stderr.on('data',chunk=>stderr+=chunk);
  base=await new Promise((resolve,reject)=>{let output='';const timer=setTimeout(()=>reject(new Error('Server startup timed out. '+stderr)),15000);child.stdout.on('data',chunk=>{output+=chunk;const match=output.match(/http:\/\/127\.0\.0\.1:\d+/);if(match){clearTimeout(timer);resolve(match[0]);}});child.once('exit',code=>{clearTimeout(timer);reject(new Error('Server exited '+code+': '+stderr));});});
}
async function stop(){if(child&&child.exitCode===null){const done=once(child,'exit');child.kill();await done;}}
async function request(endpoint,method='GET',body,options={}){
  const headers={};if(body!==undefined&&typeof body!=='string')headers['content-type']='application/json';
  const cookie=options.cookie===undefined?activeCookie:options.cookie;if(cookie)headers.cookie=cookie;
  const response=await fetch(base+'/api/'+endpoint,{method,headers,body:body===undefined?undefined:typeof body==='string'?body:JSON.stringify(body)});
  const setCookie=response.headers.get('set-cookie');if(options.adopt!==false&&setCookie)activeCookie=setCookie.split(';')[0];
  const text=await response.text();let data;try{data=JSON.parse(text);}catch{data={unparseable:text};}
  return {status:response.status,data,response};
}
async function api(endpoint,method='GET',body){const r=await request(endpoint,method,body);assert.equal(r.status,200,endpoint+': '+JSON.stringify(r.data));assert.equal(r.data.unparseable,undefined,endpoint+' must return JSON');return r.data;}
async function rejects(name,endpoint,method,body,expected=400){const r=await request(endpoint,method,body);check(name,()=>{assert.equal(r.status,expected,JSON.stringify(r));assert.ok(r.data.error);});}
function latestEmailCode(to){const rows=readFileSync(emailOutbox,'utf8').trim().split(/\r?\n/).filter(Boolean).map(row=>JSON.parse(row)),message=rows.findLast(row=>row.to===to);if(!message)throw new Error('No test email was captured for '+to);const match=message.text.match(/code is (\d{6})/);if(!match)throw new Error('The test email did not contain a six-digit code.');return match[1];}
const png='data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+/a9sAAAAASUVORK5CYII=';
const date='2026-10-02',aProfile={name:'QC Alpha Engineering',address:'12 Alpha Lane, Colombo',contactNumbers:'+94 77 123 4567',email:'alpha@example.test',website:'https://alpha.example.test',logoData:'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+/a9sAAAAASUVORK5CYII=',bankName:'Alpha Bank',bankBranch:'Colombo',bankAccountNumber:'0000123456',accountHolder:'Alpha Account Holder',taxNumber:'ALPHA-123',additionalInfo:'Company details',termsConditions:'Alpha terms only\nPayment within 7 days.',currency:'LKR',locale:'en-LK'};
try{
  // Seed a disposable legacy v1 database so setup must migrate customer and stock records.
  const legacyPath=path.join(directory,'ledgerly.sqlite'),legacy=new DatabaseSync(legacyPath);legacy.exec(readFileSync(path.join(root,'database','schema.sql'),'utf8'));
  const oldDate='2025-12-01T12:00:00.000Z';legacy.prepare('UPDATE settings SET company_name=?,address=?,phone=?,email=? WHERE id=1').run('Legacy Alpha Ltd','Old Road, Colombo','011 234 5678','old@example.test');
  legacy.prepare('UPDATE companies SET name=?,address=?,contact_numbers=?,email=? WHERE id=?').run('Legacy Alpha Ltd','Old Road, Colombo','011 234 5678','old@example.test','company-default');
  legacy.prepare('INSERT INTO customers(id,name,phone,email,address,created_at,updated_at) VALUES (?,?,?,?,?,?,?)').run('legacy-customer','Legacy Preserved Customer','077 765 4321','legacy-customer@example.test','Old Customer Road',oldDate,oldDate);
  legacy.prepare('INSERT INTO products(id,sku,name,category,unit,quantity,reorder_level,purchase_price,selling_price,description,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?)').run('legacy-product','OLD-001','Legacy Preserved Stock','Parts','each',7,2,50,100,'migrated',oldDate,oldDate);
  legacy.close();
  await start();
  const brandLogo=await fetch(base+'/assets/invoicey-badge.png'),brandLogoBytes=Buffer.from(await brandLogo.arrayBuffer());
  check('Hosted app logo is served as a valid PNG asset',()=>{assert.equal(brandLogo.status,200);assert.ok((brandLogo.headers.get('content-type')||'').startsWith('image/png'));assert.deepEqual(brandLogoBytes.subarray(0,8),Buffer.from([137,80,78,71,13,10,26,10]));});
  check('Unauthenticated requests cannot read business records',()=>{});
  const anonymous=await request('bootstrap');check('Unauthenticated bootstrap is rejected',()=>assert.equal(anonymous.status,401));
  const status=await api('auth/status');check('First launch shows setup wizard and email-code readiness',()=>{assert.equal(status.setupRequired,true);assert.equal(status.emailOtpAvailable,true);});
  const accountEmail='alpha-admin@example.test';await api('auth/email-otp/request','POST',{purpose:'registration',email:accountEmail});let setupOtp=latestEmailCode(accountEmail);
  const setupPayload={company:aProfile,username:'alphaadmin',displayName:'Alpha Admin',accountEmail,emailOtp:setupOtp,password:'AlphaPassword!2026',superUsername:'softwareadmin',superDisplayName:'Software Admin',superPassword:'SuperPassword!2026'};
  const badSetup=await request('auth/setup','POST',{...setupPayload,emailOtp:setupOtp==='000000'?'000001':'000000'});check('First setup rejects an incorrect email code without creating a user',()=>assert.equal(badSetup.status,400));
  const setup=await api('auth/setup','POST',setupPayload);
  const adminCookie=activeCookie,setupStatus=await api('auth/status');check('First setup verifies the administrator email and creates both accounts without recovery codes',()=>{assert.equal(setup.authenticated,true);assert.equal(setup.company.name,aProfile.name);assert.equal('recoveryCode' in setup,false);assert.equal('superAdminRecoveryCode' in setup,false);assert.equal(setupStatus.user.email,accountEmail);assert.equal(setupStatus.user.emailVerified,true);});
  let data=await api('bootstrap');
  check('Legacy customer and inventory migrate into first company',()=>{assert.ok(data.customers.some(x=>x.id==='legacy-customer'));assert.equal(data.products.find(x=>x.id==='legacy-product').quantity,7);assert.equal(data.companies.length,1);});
  await api('companies/company-default','PUT',aProfile);await api('settings','PUT',{currency:'LKR',locale:'en-LK'});
  data=await api('bootstrap');check('Company profile details and terms save and reload',()=>{const c=data.companies[0];assert.equal(c.name,aProfile.name);assert.equal(c.bank_account_number,aProfile.bankAccountNumber);assert.equal(c.terms_conditions,aProfile.termsConditions);assert.equal(c.email,aProfile.email);});
  const changedProfile={...aProfile,bankName:'Updated Alpha Bank',bankAccountNumber:'0000654321'};
  await api('auth/email-otp/request','POST',{purpose:'bank-change',currentPassword:'AlphaPassword!2026',bankDetails:changedProfile});
  const bankChangeOtp=latestEmailCode(accountEmail);
  await api('companies/company-default','PUT',{...changedProfile,currentPassword:'AlphaPassword!2026',bankOtp:bankChangeOtp});data=await api('bootstrap');
  check('Edited bank details and company logo persist after profile save',()=>{const c=data.companies[0];assert.equal(c.bank_name,changedProfile.bankName);assert.equal(c.bank_account_number,changedProfile.bankAccountNumber);assert.equal(c.logo_data,changedProfile.logoData);});
  const customer=await api('customers','POST',{name:'QC Customer Perera',phone:'+94 77 998 7766',email:'customer@example.test',address:'85 Mango Avenue, Galle'});
  const supplier=await api('suppliers','POST',{name:'QC Parts Vendor',phone:'071 444 8899',email:'supplier@example.test',address:'4 Supplier Road'});
  const product=await api('products','POST',{sku:'QC-PRODUCT',name:'Repair part',description:'Genuine replacement part',quantity:10,purchasePrice:100,sellingPrice:200,reorderLevel:2});
  const service=await api('services','POST',{code:'QC-SERVICE',title:'Computer Repair Service',description:'Diagnose, repair and test the computer.',unitPrice:500,unitCost:50});
  await api('services/'+service.id,'PUT',{...service,unitPrice:550});
  const purchase=await api('purchases','POST',{companyId:'company-default',supplierId:supplier.id,purchaseDate:date,items:[{productId:product.id,quantity:10,unitCost:120}],paidAmount:200,terms:aProfile.termsConditions});
  data=await api('bootstrap');check('Purchase receipts raise stock and record supplier payment',()=>{assert.equal(data.products.find(x=>x.id===product.id).quantity,20);assert.equal(data.products.find(x=>x.id===product.id).purchase_price,110);assert.equal(purchase.total,1200);assert.equal(purchase.status,'partial');assert.equal(data.supplier_payments.filter(x=>x.purchase_id===purchase.id).reduce((s,x)=>s+x.amount,0),200);});
  const items=[{itemType:'product',productId:product.id,quantity:2,unitPrice:200,discountPercent:10},{itemType:'service',serviceId:service.id,quantity:1,unitPrice:550,unitCost:50,discountPercent:20}];
  const editableInvoice=await api('invoices','POST',{companyId:'company-default',customerId:customer.id,invoiceDate:date,dueDate:'2026-10-20',notes:'Before invoice edit',terms:aProfile.termsConditions,items:[{itemType:'service',serviceId:service.id,quantity:1,unitPrice:550,unitCost:50}]});
  const editedInvoice=await api('invoices/'+editableInvoice.id,'PUT',{companyId:'company-default',customerId:customer.id,invoiceDate:date,dueDate:'2026-10-25',notes:'After invoice edit',terms:'Updated invoice terms',items:[{itemType:'service',serviceId:service.id,quantity:2,unitPrice:600,unitCost:50,serviceDescription:'Updated service line'}]});
  data=await api('bootstrap');check('Unpaid invoice edits replace lines once and preserve stock for services',()=>{assert.equal(editedInvoice.number,editableInvoice.number);assert.equal(editedInvoice.total,1200);assert.equal(editedInvoice.notes,'After invoice edit');assert.equal(data.invoice_items.filter(x=>x.invoice_id===editableInvoice.id).length,1);assert.equal(data.invoice_items.find(x=>x.invoice_id===editableInvoice.id).quantity,2);assert.equal(data.products.find(x=>x.id===product.id).quantity,20);});
  const quotePayload={companyId:'company-default',customerId:customer.id,quoteDate:date,validUntil:'2026-10-31',status:'sent',projectName:'Computer workshop',discountPercent:10,taxRate:18,terms:aProfile.termsConditions,items};
  const quote=await api('quotations','POST',quotePayload);data=await api('bootstrap');
  check('Quotation totals, unique Project Key, services, and unchanged stock are correct',()=>{assert.equal(quote.subtotal,950);assert.equal(quote.discount_amount,230);assert.equal(quote.tax_amount,129.6);assert.equal(quote.total,849.6);assert.match(quote.project_key,/^QT-2026-\d{6}$/);assert.equal(data.products.find(x=>x.id===product.id).quantity,20);});
  const edited=await api('quotations/'+quote.id,'PUT',{...quotePayload,notes:'Edited quote'});check('Quotation edits retain its reference key',()=>{assert.equal(edited.project_key,quote.project_key);assert.equal(edited.notes,'Edited quote');});
  const allocationQuote=await api('quotations','POST',{companyId:'company-default',customerId:customer.id,quoteDate:date,projectName:'Invoice reference test',terms:aProfile.termsConditions,items:[{itemType:'service',serviceTitle:'Field installation',serviceDescription:'Invoice reference test',quantity:1,unitPrice:100000,unitCost:0}]});
   const linkedInvoiceA=await api('invoices','POST',{companyId:'company-default',customerId:customer.id,invoiceDate:date,paidAmount:1000,paymentMethod:'Bank transfer',items:[{itemType:'service',serviceTitle:'Invoice reference A',quantity:1,unitPrice:1000,unitCost:0}]});
   const linkedInvoiceB=await api('invoices','POST',{companyId:'company-default',customerId:customer.id,invoiceDate:date,paidAmount:2000,paymentMethod:'Bank transfer',items:[{itemType:'service',serviceTitle:'Invoice reference B',quantity:1,unitPrice:2000,unitCost:0}]});
  const splitExpense=await api('expenses','POST',{customerId:customer.id,description:'Shared transport for several invoices',category:'Transport',amount:300,expenseDate:date,invoiceIds:[linkedInvoiceA.id,linkedInvoiceB.id]});
  data=await api('bootstrap');
   check('One expense can reference multiple paid invoices and persists after reload without double-counting',()=>{const rows=data.expense_invoices.filter(x=>x.expense_id===splitExpense.id);assert.deepEqual(rows.map(x=>x.invoice_id).sort(),[linkedInvoiceA.id,linkedInvoiceB.id].sort());assert.equal(data.expenses.find(x=>x.id===splitExpense.id).amount,300);assert.equal(data.expenses.filter(x=>x.id===splitExpense.id).reduce((sum,x)=>sum+x.amount,0),300);});
   const unpaidInvoice=await api('invoices','POST',{companyId:'company-default',customerId:customer.id,invoiceDate:date,items:[{itemType:'service',serviceTitle:'Unpaid reference',quantity:1,unitPrice:400,unitCost:0}]});
   await rejects('Unpaid invoices are rejected from expense links','expenses','POST',{customerId:customer.id,description:'Unpaid invoice link',category:'Transport',amount:50,expenseDate:date,invoiceIds:[unpaidInvoice.id]});
  await rejects('Quotation links are rejected for expenses','expenses','POST',{customerId:customer.id,description:'Quotation must not be linked',category:'Transport',amount:300,expenseDate:date,quotationId:quote.id});
  await rejects('Project allocation links are removed from expenses','expenses','POST',{customerId:customer.id,description:'Project allocation must not be linked',category:'Transport',amount:300,expenseDate:date,projectAllocations:[{projectKey:quote.project_key,amount:300}]});
  await rejects('Invoice edits are blocked when an expense references the invoice','invoices/'+linkedInvoiceA.id,'PUT',{companyId:'company-default',customerId:customer.id,invoiceDate:date,items:[{itemType:'service',serviceTitle:'Blocked edit',quantity:1,unitPrice:1200,unitCost:0}]});
  const allocationInvoice=await api('quotations/'+allocationQuote.id+'/convert','POST',{invoiceDate:date,paidAmount:0});
  data=await api('bootstrap');check('Quotation conversion still creates a normal invoice while expenses remain invoice-only',()=>{assert.equal(allocationInvoice.project_key,allocationQuote.project_key);assert.ok(data.invoices.some(x=>x.id===allocationInvoice.id));});
  await rejects('Documents require the active company id','invoices','POST',{customerId:customer.id,items});
  const estimate=await api('quotations','POST',{companyId:'company-default',customerId:customer.id,documentType:'estimate',quoteDate:date,terms:aProfile.termsConditions,items:[{itemType:'service',serviceTitle:'Consultation',serviceDescription:'Service detail',quantity:1,unitPrice:300,unitCost:20}]});
  const editedEstimate=await api('quotations/'+estimate.id,'PUT',{companyId:'company-default',customerId:customer.id,documentType:'estimate',quoteDate:date,validUntil:'2026-11-30',status:'sent',notes:'Updated estimate',terms:aProfile.termsConditions,items:[{itemType:'service',serviceTitle:'Consultation',serviceDescription:'Updated service detail',quantity:2,unitPrice:350,unitCost:20}]});
  check('Estimate uses its own document number and supports safe edits',()=>{assert.match(estimate.number,/^EST-/);assert.equal(estimate.terms,aProfile.termsConditions);assert.equal(editedEstimate.number,estimate.number);assert.equal(editedEstimate.total,700);assert.equal(editedEstimate.notes,'Updated estimate');});
  const receipt={name:'labour-receipt.png',type:'image/png',data:png};
  const labour=await api('expenses','POST',{customerId:customer.id,description:'Workshop labour',category:'Labour',expenseType:'labour',workerCount:2,workerNames:'Technician One, Technician Two',workingDays:2,labourRate:1000,additionalLabour:500,expenseDate:date,attachments:[receipt]});
  const materials=await api('expenses','POST',{supplierId:supplier.id,description:'Consumable materials',category:'Materials',amount:3000,expenseDate:date});
  await api('expenses','POST',{description:'Transport cost',category:'Transport',amount:500,expenseDate:date});
  data=await api('bootstrap');const attachment=data.expense_attachments.find(x=>x.expense_id===labour.id);
  const attachmentResponse=await fetch(base+'/api/expense-attachments/'+attachment.id,{headers:{cookie:adminCookie}});const attachmentBytes=Buffer.from(await attachmentResponse.arrayBuffer());
  check('Labour formula, linked expense and uploaded receipt are preserved',()=>{assert.equal(labour.amount,4500);assert.equal(labour.customer_id,customer.id);assert.equal(materials.supplier_id,supplier.id);assert.equal(attachment.file_name,'labour-receipt.png');assert.deepEqual(attachmentBytes,Buffer.from(png.split(',')[1],'base64'));});
  const invoice=await api('quotations/'+quote.id+'/convert','POST',{invoiceDate:date,paidAmount:100,paymentMethod:'Bank transfer'});data=await api('bootstrap');
  check('Quotation conversion preserves Project Key and only product stock changes',()=>{assert.equal(invoice.project_key,quote.project_key);assert.equal(invoice.company_id,'company-default');assert.equal(invoice.terms,aProfile.termsConditions);assert.equal(invoice.total,quote.total);const line=data.invoice_items.find(x=>x.invoice_id===invoice.id&&x.item_type==='service');assert.equal(line.product_id,null);assert.equal(line.service_title,service.title);assert.equal(line.service_description,service.description);assert.equal(data.products.find(x=>x.id===product.id).quantity,18);assert.equal(data.stock_movements.filter(x=>x.movement_type==='Sale').length,1);});
  await rejects('Converted invoice edits are blocked to protect quotation history','invoices/'+invoice.id,'PUT',{companyId:'company-default',customerId:customer.id,invoiceDate:date,items:[{itemType:'service',serviceTitle:'Blocked edit',quantity:1,unitPrice:1}]});
  const payment=await api('payments','POST',{invoiceId:invoice.id,amount:800,paymentDate:date,method:'Cash'});data=await api('bootstrap');check('Customer payment balance and overpayment update',()=>{assert.equal(data.invoices.find(x=>x.id===invoice.id).status,'overpaid');assert.ok(payment.id);});
  await api('expenses/'+materials.id,'PUT',{supplierId:supplier.id,description:'Updated materials',category:'Materials',amount:3000,expenseDate:date});
  data=await api('bootstrap');const totalExpenses=data.expenses.filter(x=>x.expense_date>=date).reduce((sum,x)=>sum+Number(x.amount),0);check('Expense totals count each expense once regardless of invoice links',()=>{assert.equal(totalExpenses,8300);assert.equal(data.expense_invoices.filter(x=>x.expense_id===splitExpense.id).length,2);});
  const partner=await api('partners','POST',{name:'Partner One',sharePercent:50});const profit=await api('profit-shares/generate','POST',{periodStart:'2026-10-01',periodEnd:'2026-10-31'});check('Profit sharing uses the single company expense total without project allocation',()=>{assert.ok(partner.id);assert.ok(Number.isFinite(profit.totalNetProfit));assert.equal(profit.profitBasis,Math.max(0,Math.round((profit.totalNetProfit-profit.companyRetained)*100)/100));assert.equal(profit.shares[0].partner_id,partner.id);});
  await rejects('Searchable edits validate missing service ids','services/not-found','PUT',{title:'Missing service'});
  await rejects('Searchable edits validate missing partner ids','partners/not-found','PUT',{name:'Missing partner',sharePercent:10});
  const backupResponse=await fetch(base+'/api/backup/download',{headers:{cookie:adminCookie}}),backupBytes=Buffer.from(await backupResponse.arrayBuffer());
  check('Company account backup is a private SQLite snapshot',()=>{assert.equal(backupResponse.status,200);assert.equal(backupResponse.headers.get('content-type'),'application/octet-stream');assert.equal(backupBytes.subarray(0,16).toString(),'SQLite format 3\u0000');assert.ok(backupBytes.length>1000);});
  const tenantId=data.companies[0]&& (await api('backup/status')).companyId,downloadedBackup=path.join(directory,'downloaded-account-backup.invoicey');writeFileSync(downloadedBackup,backupBytes);const connection=new DatabaseSync(downloadedBackup,{readOnly:true});
  check('Account backup contains this company records and attachments',()=>{assert.ok(connection.prepare('SELECT id FROM invoices WHERE id=?').get(invoice.id));assert.ok(connection.prepare('SELECT expense_id FROM expense_attachments WHERE expense_id=?').get(labour.id));assert.equal(connection.prepare("SELECT value FROM app_metadata WHERE key='tenant_id'").get().value,tenantId);});connection.close();
  const createdBackup=await api('backup/create','POST',{}),backupStatus=await api('backup/status'),history=await api('backup/history');
  check('Manual and automatic account backups produce stable private restore points',()=>{assert.ok(backupStatus.available);assert.ok(backupStatus.fileName.endsWith('_Account_Backup.invoicey'));assert.ok(createdBackup.fileName.endsWith('.invoicey-backup'));assert.ok(history.length>=1);});
  await api('customers','POST',{name:'Restore marker only'});const validRestore=await request('backup/restore-history','POST',{fileName:createdBackup.fileName},{cookie:adminCookie});
  check('Account backup restore request succeeds',()=>assert.equal(validRestore.status,200,JSON.stringify(validRestore.data)));
  const restored=await request('bootstrap','GET',undefined,{cookie:adminCookie});check('Account backup restores only the selected company database',()=>assert.ok(!restored.data.customers.some(x=>x.name==='Restore marker only')));

  // A separately authenticated software administrator provisions an empty company B.
  const superLogin=await request('auth/login','POST',{username:'softwareadmin',password:'SuperPassword!2026'});assert.equal(superLogin.status,200);const superCookie=activeCookie;
  const betaAdminEmail='beta-admin@example.test';await api('auth/email-otp/request','POST',{purpose:'company-admin',email:betaAdminEmail});const betaAdminOtp=latestEmailCode(betaAdminEmail);
  const companyB=await request('admin/companies','POST',{company:{name:'QC Beta Services'},userLimit:1,admin:{username:'betaadmin',displayName:'Beta Admin',password:'BetaPassword!2026',email:betaAdminEmail,emailOtp:betaAdminOtp}});assert.equal(companyB.status,200,JSON.stringify(companyB.data));
  await request('auth/select-company','POST',{companyId:companyB.data.id},{cookie:superCookie});activeCookie=superCookie;
  data=await api('bootstrap');check('Second company starts with separate business records',()=>{assert.equal(data.customers.length,0);assert.equal(data.products.length,0);assert.equal(data.invoices.length,0);});
  const wrongRestore=await request('backup/restore-history','POST',{fileName:createdBackup.fileName},{cookie:superCookie});
  check('Company A backup cannot be restored into Company B',()=>assert.equal(wrongRestore.status,400));
  await rejects('Company user limit prevents an extra account','admin/users','POST',{companyId:companyB.data.id,username:'betaextra',displayName:'Extra',password:'ExtraBetaPassword!2026',role:'salesperson'},409);
  const betaCustomer=await api('customers','POST',{name:'Only in Beta',phone:'07000112233'});check('Company B writes remain separate',()=>assert.equal(betaCustomer.name,'Only in Beta'));
  const bData=await api('bootstrap');check('Company B remains independent after writes',()=>{assert.equal(bData.customers.length,1);assert.equal(bData.customers[0].name,'Only in Beta');});
  const signupEmail='signup-admin@example.test';await api('auth/email-otp/request','POST',{purpose:'registration',email:signupEmail});const signupOtp=latestEmailCode(signupEmail);
  const signup=await request('auth/signup','POST',{company:{name:'QC Signup Business',email:'signup@example.test'},username:'signupadmin',displayName:'Signup Administrator',accountEmail:signupEmail,emailOtp:signupOtp,password:'SignupPassword!2026'});assert.equal(signup.status,200,JSON.stringify(signup.data));const signupCookie=activeCookie,signupStatus=await request('auth/status','GET',undefined,{cookie:signupCookie}),signupData=await request('bootstrap','GET',undefined,{cookie:signupCookie});
  check('Sign up creates an isolated company admin account, verifies its email and exposes no recovery code',()=>{assert.equal(signup.data.authenticated,true);assert.equal(signup.data.company.name,'QC Signup Business');assert.equal('recoveryCode' in signup.data,false);assert.equal(signupStatus.data.user.username,'signupadmin');assert.equal(signupStatus.data.user.email,signupEmail);assert.equal(signupStatus.data.user.emailVerified,true);assert.equal(signupData.data.companies[0].name,'QC Signup Business');assert.equal(signupData.data.customers.length,0);});
  await api('auth/email-otp/request','POST',{purpose:'email-change',email:'signup-admin-updated@example.test',currentPassword:'SignupPassword!2026'});const changedEmailOtp=latestEmailCode('signup-admin-updated@example.test');
  await api('auth/email/confirm','POST',{email:'signup-admin-updated@example.test',emailOtp:changedEmailOtp});
  const updatedSignupStatus=await request('auth/status','GET',undefined,{cookie:signupCookie});check('Signed-in user can verify and save an updated recovery email',()=>{assert.equal(updatedSignupStatus.data.user.email,'signup-admin-updated@example.test');assert.equal(updatedSignupStatus.data.user.emailVerified,true);});
  const resetRequest=await request('auth/email-otp/request','POST',{purpose:'password-reset',email:'  SIGNUP-ADMIN-UPDATED@example.test '},{adopt:false});check('Password reset accepts email only and ignores username lookup',()=>assert.equal(resetRequest.status,200));const signupResetOtp=latestEmailCode('signup-admin-updated@example.test');
  const wrongSignupReset=await request('auth/recover','POST',{email:'signup-admin-updated@example.test',emailOtp:signupResetOtp==='000000'?'000001':'000000',newPassword:'SignupPasswordReset!2026'},{adopt:false});check('Email password reset rejects an incorrect OTP',()=>assert.equal(wrongSignupReset.status,400));
  const signupReset=await request('auth/recover','POST',{email:'signup-admin-updated@example.test',emailOtp:signupResetOtp,newPassword:'SignupPasswordReset!2026'},{adopt:false});check('Email password reset succeeds with the verified account email',()=>assert.equal(signupReset.status,200));
  const signupResetLogin=await request('auth/login','POST',{username:'signupadmin',password:'SignupPasswordReset!2026'});check('New password works after an email-code recovery',()=>assert.equal(signupResetLogin.status,200));
  await rejects('Sign up rejects an already registered username','auth/signup','POST',{company:{name:'Duplicate Signup Company'},username:'signupadmin',displayName:'Duplicate',accountEmail:signupEmail,password:'SignupPassword!2026'},409);
  const databaseFolders=readdirSync(path.join(directory,'companies'));check('Each company receives a separate database folder',()=>assert.equal(databaseFolders.length,3));

  // Return to A and verify both authorization and persistence.
  activeCookie=adminCookie;const forbidden=await request('admin/companies');check('Company admins cannot enumerate or administer other companies',()=>assert.equal(forbidden.status,403));
  const salesEmail='alpha-sales@example.test';await api('auth/email-otp/request','POST',{purpose:'admin-user',companyId:tenantId,email:salesEmail});const salesEmailOtp=latestEmailCode(salesEmail);
  const salesperson=await api('admin/users','POST',{companyId:tenantId,username:'alpha-sales',displayName:'Alpha Sales',password:'SalesPassword!2026',email:salesEmail,emailOtp:salesEmailOtp,role:'salesperson'});
  check('New administrator-created accounts require a verified email address',()=>assert.equal(salesperson.existingUser,false));
  const salesLogin=await request('auth/login','POST',{username:'alpha-sales',password:'SalesPassword!2026'});assert.equal(salesLogin.status,200);const salesCookie=activeCookie;
  const deniedExpenses=await request('expenses', 'GET',undefined,{cookie:salesCookie});check('Salesperson permissions deny access to expenses',()=>assert.equal(deniedExpenses.status,403));
  const salesStatus=await api('auth/status');check('Salesperson login is assigned its company role',()=>assert.equal(salesStatus.user.role,'salesperson'));
  await api('auth/logout','POST',{});const loggedOut=await request('bootstrap');check('Logout blocks access to protected business data',()=>assert.equal(loggedOut.status,401));
  await request('auth/login','POST',{username:'alphaadmin',password:'AlphaPassword!2026'});activeCookie=adminCookie;
  const recovered=await request('auth/recover-code','POST',{username:'alpha-sales',recoveryCode:'legacy-code-should-not-work',newPassword:'SalesPasswordReset!2026'});check('Recovery-code password reset endpoint is removed',()=>assert.equal(recovered.status,410));
  const salesResetOtpRequest=await request('auth/email-otp/request','POST',{purpose:'password-reset',email:salesEmail},{adopt:false});assert.equal(salesResetOtpRequest.status,200);const salesResetOtp=latestEmailCode(salesEmail);
  const salesResetResult=await request('auth/recover','POST',{email:salesEmail,emailOtp:salesResetOtp,newPassword:'SalesPasswordReset!2026'},{adopt:false});check('A verified administrator-created user can recover by email OTP',()=>assert.equal(salesResetResult.status,200));
  const salesReset=await request('auth/login','POST',{username:'alpha-sales',password:'SalesPasswordReset!2026'});check('Reset password is accepted by login',()=>assert.equal(salesReset.status,200));
  await stop();await start();activeCookie=adminCookie;const restartData=await api('bootstrap');check('Tenant, bank account and uploaded logo persist after server restart',()=>{assert.ok(restartData.invoices.some(x=>x.id===invoice.id));assert.ok(restartData.expenses.some(x=>x.id===labour.id));assert.equal(restartData.companies[0].bank_name,changedProfile.bankName);assert.equal(restartData.companies[0].bank_account_number,changedProfile.bankAccountNumber);assert.equal(restartData.companies[0].logo_data,changedProfile.logoData);});
  const tenantDb=new DatabaseSync(path.join(directory,'companies',tenantId,'business.sqlite'),{readOnly:true});const registry=new DatabaseSync(path.join(directory,'access.sqlite'),{readOnly:true});
  check('Company and user databases pass SQLite integrity and relationship checks',()=>{assert.equal(tenantDb.prepare('PRAGMA integrity_check').get().integrity_check,'ok');assert.deepEqual(tenantDb.prepare('PRAGMA foreign_key_check').all(),[]);assert.equal(registry.prepare('PRAGMA integrity_check').get().integrity_check,'ok');});tenantDb.close();registry.close();
}catch(error){results.push({name:'Workflow execution',passed:false,error:error.stack});}
finally{await stop();const report={createdAt:new Date().toISOString(),directory,passed:results.filter(x=>x.passed).length,failed:results.filter(x=>!x.passed).length,results,stderr};writeFileSync(path.join(directory,'report.json'),JSON.stringify(report,null,2));console.log(JSON.stringify(report,null,2));process.exitCode=report.failed?1:0;}

