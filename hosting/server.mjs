import path from 'node:path';
import fs from 'node:fs';
import { DatabaseSync } from 'node:sqlite';
import { scryptSync } from 'node:crypto';
import { deflateRawSync, inflateRawSync } from 'node:zlib';
import { fileURLToPath } from 'node:url';
import * as nodeHttp from 'node:http';
import nodemailer from 'nodemailer';
import { createHttpGuard } from './http-security.mjs';

// The tested Android bundle contains the complete API, SQLite tenancy model,
// authentication, backup/restore and business rules. This wrapper starts the
// same backend for a shared HTTPS host instead of maintaining a second server.
const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const physicalDataRoot = path.resolve(process.env.LEDGER_DATA_DIR || path.join(projectRoot, 'data'));
// The bundled runtime uses /app and /data virtual roots. The bridge below
// maps them to the real hosting filesystem paths, avoiding Windows path
// semantics leaking into the portable runtime.
process.env.INVOICEY_ROOT = '/app';
process.env.LEDGER_DATA_DIR = '/data';
process.env.LEDGER_DB = '/data/ledgerly.sqlite';
process.env.INVOICEY_HOSTED = '1';

const dataRoot = physicalDataRoot;
const appRoot = projectRoot;
const preferences = new Map();
const connections = new Map();
let nextHandle = 1;
let emailTransporter;
const smtpPort = Number(process.env.SMTP_PORT || 465);
const testEmailOutbox = process.env.NODE_ENV === 'test' ? process.env.INVOICEY_TEST_EMAIL_OUTBOX : '';
const smtpReady = Boolean(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASSWORD && (process.env.SMTP_FROM || process.env.SMTP_USER));
globalThis.INVOICEY_EMAIL_READY = Boolean(testEmailOutbox || smtpReady);
globalThis.INVOICEY_SEND_EMAIL = async ({to, code, purpose}) => {
  const message = {
    to,
    subject: purpose === 'password-reset' ? 'itsme invoicey password reset code' : purpose === 'email-change' ? 'Verify your itsme invoicey email address' : purpose === 'bank-change' ? 'Approve bank detail changes in itsme invoicey' : 'Verify your itsme invoicey account',
    text: `Your itsme invoicey verification code is ${code}. It expires in 10 minutes. If you did not request this, you can ignore this email.`,
    html: `<p>Your itsme invoicey verification code is:</p><p style="font-size:24px;font-weight:700;letter-spacing:5px">${code}</p><p>It expires in 10 minutes. If you did not request this, you can ignore this email.</p>`
  };
  if (testEmailOutbox) {
    fs.appendFileSync(testEmailOutbox, JSON.stringify(message) + '\n', {encoding:'utf8'});
    return;
  }
  if (!smtpReady) throw new Error('Email sending is not configured.');
  if (!emailTransporter) {
    const secure = process.env.SMTP_SECURE === 'true' || (process.env.SMTP_SECURE !== 'false' && smtpPort === 465);
    emailTransporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: smtpPort,
      secure,
      auth: {user:process.env.SMTP_USER, pass:process.env.SMTP_PASSWORD},
      connectionTimeout: 15000,
      greetingTimeout: 10000,
      socketTimeout: 20000
    });
  }
  await emailTransporter.sendMail({from:process.env.SMTP_FROM || process.env.SMTP_USER, ...message});
};
const nativePath = value => {
  const name = String(value || '');
  if (name === '/data' || name.startsWith('/data/')) return path.join(dataRoot, name.slice(5));
  if (name === '/app' || name.startsWith('/app/')) return path.join(appRoot, name.slice(5));
  return name;
};
globalThis.INVOICEY_VALIDATE_BACKUP_PATH = virtualPath => {
  const target = path.resolve(nativePath(virtualPath));
  const relative = path.relative(dataRoot, target);
  if (relative.startsWith('..') || path.isAbsolute(relative)) throw Object.assign(new Error('Hosted backups must remain inside private app storage.'), {status:400});
  let current = dataRoot;
  for (const segment of relative.split(path.sep)) {
    current = path.join(current, segment);
    if (fs.existsSync(current) && fs.lstatSync(current).isSymbolicLink()) throw Object.assign(new Error('Symbolic links cannot be used for hosted company backup folders.'), {status:400});
  }
};
const decode = value => value && value.__bytes ? Buffer.from(value.__bytes, 'base64') : value;
function nativeCall(operation, argsJson) {
  const args = JSON.parse(argsJson);
  try {
    let value;
    const db = connections.get(args.handle);
    switch (operation) {
      case 'env': value = {dataRoot:'/data', assetRoot:'/app', appVersion:'3.1.5'}; break;
      case 'prefs.get': value = preferences.get(args.key) || ''; break;
      case 'prefs.set': preferences.set(args.key, args.value); value = null; break;
      case 'sqlite.open': { const handle=nextHandle++; connections.set(handle, new DatabaseSync(nativePath(args.path))); value=handle; break; }
      case 'sqlite.exec': {
        // The portable backend uses /data paths. SQLite's VACUUM INTO receives
        // the path inside SQL, so translate that one filesystem operation too.
        let sql = String(args.sql).replace(/(VACUUM\s+INTO\s+['"])(\/data\/[^'"]+)(['"])/gi, (_, prefix, virtualPath, suffix) => {
          const physicalPath = nativePath(virtualPath).replaceAll("'", "''");
          return prefix + physicalPath + suffix;
        });
        sql = sql.replace(/(ATTACH\s+DATABASE\s+['"])(\/data\/[^'"]+)(['"])/gi, (_, prefix, virtualPath, suffix) => {
          const physicalPath = nativePath(virtualPath).replaceAll("'", "''");
          return prefix + physicalPath + suffix;
        });
        db.exec(sql); value=null; break;
      }
      case 'sqlite.all': value=db.prepare(args.sql).all(...args.params.map(decode)).map(row=>Object.fromEntries(Object.entries(row).map(([key,item])=>[key,item instanceof Uint8Array?{__bytes:Buffer.from(item).toString('base64')}:item]))); break;
      case 'sqlite.run': { const result=db.prepare(args.sql).run(...args.params.map(decode)); value={changes:Number(result.changes),lastInsertRowid:Number(result.lastInsertRowid)}; break; }
      case 'sqlite.close': try {db.close();} catch {} connections.delete(args.handle); value=null; break;
      case 'fs.exists': value=fs.existsSync(nativePath(args.path)); break;
      case 'fs.mkdir': fs.mkdirSync(nativePath(args.path),{recursive:args.recursive}); value=null; break;
      case 'fs.read': value=process.env.NODE_ENV==='test'&&process.env.INVOICEY_TEST_BROWSER==='1'&&args.path==='/app/public/api-config.js'?Buffer.from("globalThis.INVOICEY_API_BASE_URL = '';\n").toString('base64'):fs.readFileSync(nativePath(args.path)).toString('base64'); break;
      case 'fs.write': fs.mkdirSync(path.dirname(nativePath(args.path)),{recursive:true}); fs.writeFileSync(nativePath(args.path),Buffer.from(args.data,'base64'),{flag:args.flag}); value=null; break;
      case 'fs.rename': fs.renameSync(nativePath(args.from),nativePath(args.to)); value=null; break;
      case 'fs.unlink': fs.unlinkSync(nativePath(args.path)); value=null; break;
      case 'fs.copy': fs.copyFileSync(nativePath(args.from),nativePath(args.to)); value=null; break;
      case 'fs.readdir': value=fs.readdirSync(nativePath(args.path)); break;
      case 'fs.stat': { const stat=fs.statSync(nativePath(args.path)); value={size:stat.size,isDirectory:stat.isDirectory(),modifiedAt:stat.mtimeMs}; break; }
      case 'fs.realpath': fs.realpathSync(nativePath(args.path)); value=args.path; break;
      case 'fs.access': fs.accessSync(nativePath(args.path),fs.constants.W_OK); value=null; break;
      case 'crypto.scrypt': value=scryptSync(Buffer.from(args.password,'base64'),Buffer.from(args.salt,'base64'),args.length).toString('base64'); break;
      case 'zlib.deflate': value=deflateRawSync(Buffer.from(args.data,'base64'),{level:args.level}).toString('base64'); break;
      case 'zlib.inflate': value=inflateRawSync(Buffer.from(args.data,'base64'),{maxOutputLength:args.maxOutputLength}).toString('base64'); break;
      default: throw new Error('Unsupported native operation: '+operation);
    }
    return JSON.stringify({ok:true,value});
  } catch (error) { return JSON.stringify({ok:false,error:error.message}); }
}
globalThis.InvoiceyNative = {call:nativeCall};
globalThis.INVOICEY_NODE_HTTP = nodeHttp;
globalThis.INVOICEY_NODE_DATA_DIR = '/data';
globalThis.INVOICEY_NODE_DB = '/data/ledgerly.sqlite';
globalThis.INVOICEY_NODE_ROOT = '/app';
globalThis.INVOICEY_NODE_HOST = process.env.HOST || '0.0.0.0';
globalThis.INVOICEY_NODE_PORT = process.env.PORT || '8080';
globalThis.INVOICEY_NODE_HOSTED = '1';
// Android WebView uses the packaged asset origin. Keep an explicit override for
// production, while making a fresh shared-host install usable before its panel
// environment variables have been configured.
globalThis.INVOICEY_NODE_CORS = (process.env.INVOICEY_CORS_ORIGIN || 'https://appassets.androidplatform.net').split(',').map(value => value.trim()).filter(value => {
  try { const url = new URL(value); return ['http:', 'https:'].includes(url.protocol) && url.origin === value && !url.username && !url.password; }
  catch { return false; }
}).join(',');
globalThis.INVOICEY_NODE_COOKIE_SECURE = process.env.INVOICEY_COOKIE_SECURE || '';
globalThis.INVOICEY_HTTP_GUARD = createHttpGuard({
  publicOrigin: process.env.INVOICEY_PUBLIC_ORIGIN || 'https://api.primeenergy.lk',
  corsOrigins: String(globalThis.INVOICEY_NODE_CORS).split(',').map(value => value.trim()).filter(Boolean)
});
await import('../android/app/src/main/assets/business/backend.js');

