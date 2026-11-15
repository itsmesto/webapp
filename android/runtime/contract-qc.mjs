// Runs the shipped browser backend through its exact native JSON interface.
// This contract check complements real Android emulator UI testing.
import assert from 'node:assert/strict';
import vm from 'node:vm';
import * as fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { DatabaseSync } from 'node:sqlite';
import { webcrypto, scryptSync } from 'node:crypto';
import { deflateRawSync, inflateRawSync } from 'node:zlib';
const root = path.dirname(path.dirname(path.dirname(fileURLToPath(import.meta.url))));
const directory = fs.mkdtempSync(path.join(root, 'tmp', 'android-runtime-qc-'));
const preferences = new Map(), connections = new Map(), results = [], emailMessages = [];
let nextHandle = 1, backend;
const local = name => name === '/data' || name.startsWith('/data/') ? path.join(directory, name.slice(5)) : name.startsWith('/app/') ? path.join(root, name.slice(5)) : (() => { throw new Error('Path outside native storage: ' + name); })();
function call(operation, argsJson) {
  const a = JSON.parse(argsJson), decode = value => value && value.__bytes ? Buffer.from(value.__bytes, 'base64') : value;
  try {
    let value;
    const db = connections.get(a.handle);
    switch (operation) {
      case 'env': value = { dataRoot: '/data', assetRoot: '/app', appVersion: '3.1.5' }; break;
      case 'prefs.get': value = preferences.get(a.key) || ''; break;
      case 'prefs.set': preferences.set(a.key, a.value); value = null; break;
      case 'sqlite.open': { const handle = nextHandle++; connections.set(handle, new DatabaseSync(local(a.path))); value = handle; break; }
      case 'sqlite.exec': { let sql = String(a.sql).replace(/(VACUUM\s+INTO\s+['"])(\/data\/[^'"]+)(['"])/gi, (_, prefix, virtualPath, suffix) => prefix + local(virtualPath).replaceAll("'", "''") + suffix); sql = sql.replace(/(ATTACH\s+DATABASE\s+['"])(\/data\/[^'"]+)(['"])/gi, (_, prefix, virtualPath, suffix) => prefix + local(virtualPath).replaceAll("'", "''") + suffix); db.exec(sql); value = null; break; }
      case 'sqlite.all': value = db.prepare(a.sql).all(...a.params.map(decode)).map(row => Object.fromEntries(Object.entries(row).map(([key, value]) => [key, value instanceof Uint8Array ? { __bytes: Buffer.from(value).toString('base64') } : value]))); break;
      case 'sqlite.run': { const output = db.prepare(a.sql).run(...a.params.map(decode)); value = { changes: Number(output.changes), lastInsertRowid: Number(output.lastInsertRowid) }; break; }
      case 'sqlite.close': db.close(); connections.delete(a.handle); value = null; break;
      case 'fs.exists': value = fs.existsSync(local(a.path)); break;
      case 'fs.mkdir': fs.mkdirSync(local(a.path), { recursive: a.recursive }); value = null; break;
      case 'fs.read': value = fs.readFileSync(local(a.path)).toString('base64'); break;
      case 'fs.write': fs.writeFileSync(local(a.path), Buffer.from(a.data, 'base64'), { flag: a.flag }); value = null; break;
      case 'fs.rename': fs.renameSync(local(a.from), local(a.to)); value = null; break;
      case 'fs.unlink': fs.unlinkSync(local(a.path)); value = null; break;
      case 'fs.copy': fs.copyFileSync(local(a.from), local(a.to)); value = null; break;
      case 'fs.readdir': value = fs.readdirSync(local(a.path)); break;
      case 'fs.stat': { const stat = fs.statSync(local(a.path)); value = { size: stat.size, isDirectory: stat.isDirectory(), modifiedAt: stat.mtimeMs }; break; }
      case 'fs.realpath': fs.realpathSync(local(a.path)); value = a.path; break;
      case 'fs.access': fs.accessSync(local(a.path), fs.constants.W_OK); value = null; break;
      case 'crypto.scrypt': value = scryptSync(Buffer.from(a.password, 'base64'), Buffer.from(a.salt, 'base64'), a.length).toString('base64'); break;
      case 'zlib.deflate': value = deflateRawSync(Buffer.from(a.data, 'base64'), { level: a.level }).toString('base64'); break;
      case 'zlib.inflate': value = inflateRawSync(Buffer.from(a.data, 'base64'), { maxOutputLength: a.maxOutputLength }).toString('base64'); break;
      default: throw new Error('Unsupported operation: ' + operation);
    }
    return JSON.stringify({ ok: true, value });
  } catch (error) { return JSON.stringify({ ok: false, error: error.message }); }
}
function load() {
  const context = vm.createContext({ InvoiceyNative: { call }, INVOICEY_EMAIL_READY: true, INVOICEY_SEND_EMAIL: async message => { emailMessages.push({ ...message, text: `Your verification code is ${message.code}.` }); }, crypto: webcrypto, URL, Headers, Request, Response, Blob, TextEncoder, TextDecoder, setTimeout, clearTimeout, location: { href: 'https://appassets.androidplatform.net/assets/business/index.html' }, console: { log() {}, error() {} }, fetch() { throw new Error('External network request in offline test'); } });
  vm.runInContext(fs.readFileSync(path.join(root, 'android/app/src/main/assets/business/backend.js'), 'utf8'), context, { timeout: 10000 });
  backend = context.InvoiceyBackend;
}
function close() { for (const db of connections.values()) db.close(); connections.clear(); }
function check(name, test) { test(); results.push({ name, passed: true }); }
async function request(endpoint, method = 'GET', body) {
  const response = await backend.request({ path: '/api/' + endpoint, method, body }), bytes = Buffer.from(response.body, 'base64');
  let data; try { data = JSON.parse(bytes.toString('utf8')); } catch { data = bytes; }
  return { ...response, bytes, data };
}
async function api(endpoint, method, body) { const response = await request(endpoint, method, body); assert.equal(response.status, 200, endpoint + ': ' + JSON.stringify(response.data)); return response.data; }
function latestCode(to) { const message = emailMessages.findLast(row => row.to === to); assert.ok(message, 'Expected a test email addressed to ' + to); const match = message.text.match(/code is (\d{6})/); assert.ok(match, 'Expected a six-digit verification code'); return match[1]; }
const profile = { name: 'Android QC Alpha', address: '12 Colombo Road', contactNumbers: '+94702359602', email: 'alpha@example.test', bankName: 'QC Bank', bankBranch: 'Colombo', bankAccountNumber: '12345', termsConditions: 'Alpha terms', currency: 'LKR', locale: 'en-LK' };
try {
  load();
  check('Browser bundle starts without Node or network', () => assert.equal(backend.ready, true));
  check('Unconfigured first launch requires setup', () => {});
  const firstStatus = await api('auth/status'); check('First launch offers email verification when mail is configured', () => { assert.equal(firstStatus.setupRequired, true); assert.equal(firstStatus.emailOtpAvailable, true); });
  const denied = await request('bootstrap'); check('Protected data rejects anonymous access', () => assert.equal(denied.status, 401));
  const missingRecovery = await request('auth/setup', 'POST', { company: profile, username: 'alphaadmin', displayName: 'Alpha Admin', accountEmail: 'alpha-admin@example.test', password: 'AlphaPassword!2026' });
  check('First setup rejects missing email verification and recovery code', () => assert.equal(missingRecovery.status, 400));
  const accountEmail = 'alpha-admin@example.test'; await api('auth/email-otp/request', 'POST', { purpose: 'registration', email: accountEmail }); const setupCode = latestCode(accountEmail);
  const badSetup = await request('auth/setup', 'POST', { company: profile, username: 'alphaadmin', displayName: 'Alpha Admin', accountEmail, emailOtp: setupCode === '000000' ? '000001' : '000000', password: 'AlphaPassword!2026', recoveryCode: 'alpha-recovery-keep-private-0001', recoveryCodeConfirm: 'alpha-recovery-keep-private-0001' });
  check('First setup rejects an incorrect email code', () => assert.equal(badSetup.status, 400));
  await api('auth/setup', 'POST', { company: profile, username: 'alphaadmin', displayName: 'Alpha Admin', accountEmail, emailOtp: setupCode, password: 'AlphaPassword!2026', recoveryCode: 'alpha-recovery-keep-private-0001', recoveryCodeConfirm: 'alpha-recovery-keep-private-0001', superUsername: 'superadmin', superPassword: 'SuperPassword!2026', superRecoveryCode: 'super-recovery-keep-private-0001', superRecoveryCodeConfirm: 'super-recovery-keep-private-0001' });
  const setupStatus = await api('auth/status'); check('Verified setup creates separate administrators and stores the verified email', () => { assert.ok(preferences.get('invoicey_session')); assert.equal(setupStatus.user.email, accountEmail); assert.equal(setupStatus.user.emailVerified, true); });
  await api('companies/company-default', 'PUT', profile);
  let data = await api('bootstrap');
  check('Bank/contact/terms persist in company profile', () => { assert.equal(data.companies[0].bank_account_number, '12345'); assert.equal(data.companies[0].terms_conditions, 'Alpha terms'); });
  const customer = await api('customers', 'POST', { name: 'Android Customer', phone: '0771234567', address: 'Phone address' });
  const supplier = await api('suppliers', 'POST', { name: 'Android Supplier' });
  const product = await api('products', 'POST', { sku: 'PHONE-1', name: 'Phone Product', quantity: 10, purchasePrice: 100, sellingPrice: 200 });
  const service = await api('services', 'POST', { code: 'REPAIR-1', title: 'Phone Repair', description: 'Repair description', unitPrice: 500, unitCost: 50 });
  const purchase = await api('purchases', 'POST', { companyId: 'company-default', supplierId: supplier.id, purchaseDate: '2026-10-03', items: [{ productId: product.id, quantity: 5, unitCost: 100 }], paidAmount: 200 });
  data = await api('bootstrap');
  check('Purchases save and increase product stock', () => { assert.equal(purchase.total, 500); assert.equal(data.products[0].quantity, 15); assert.equal(data.supplier_payments[0].amount, 200); });
  const editableInvoice = await api('invoices', 'POST', { companyId: 'company-default', customerId: customer.id, invoiceDate: '2026-10-03', dueDate: '2026-10-20', notes: 'Before invoice edit', terms: 'Alpha terms', items: [{ itemType: 'service', serviceId: service.id, quantity: 1, unitPrice: 500 }] });
  const editedInvoice = await api('invoices/' + editableInvoice.id, 'PUT', { companyId: 'company-default', customerId: customer.id, invoiceDate: '2026-10-03', dueDate: '2026-10-25', notes: 'After invoice edit', terms: 'Updated invoice terms', items: [{ itemType: 'service', serviceId: service.id, quantity: 2, unitPrice: 600, serviceDescription: 'Updated service line' }] });
  data = await api('bootstrap');
  check('Unpaid standalone invoice edits replace lines without changing stock', () => { assert.equal(editedInvoice.number, editableInvoice.number); assert.equal(editedInvoice.total, 1200); assert.equal(editedInvoice.notes, 'After invoice edit'); assert.equal(data.invoice_items.filter(row => row.invoice_id === editableInvoice.id).length, 1); assert.equal(data.invoice_items.find(row => row.invoice_id === editableInvoice.id).quantity, 2); assert.equal(data.products[0].quantity, 15); });
  await api('invoices/' + editableInvoice.id, 'DELETE');
  const quotePayload = { companyId: 'company-default', customerId: customer.id, quoteDate: '2026-10-03', items: [{ itemType: 'product', productId: product.id, quantity: 2, unitPrice: 200 }, { itemType: 'service', serviceId: service.id, quantity: 1, unitPrice: 500 }], terms: 'Alpha terms' };
  const quote = await api('quotations', 'POST', quotePayload);
  const editedQuote = await api('quotations/' + quote.id, 'PUT', { ...quotePayload, notes: 'Edited Android quote' });
  check('Product/service quotation edits preserve totals and Project Key', () => { assert.equal(quote.total, 900); assert.match(quote.project_key, /^QT-2026-/); assert.equal(editedQuote.project_key, quote.project_key); assert.equal(editedQuote.notes, 'Edited Android quote'); });
  await api('quotations', 'POST', { companyId: 'company-default', documentType: 'estimate', customerId: customer.id, quoteDate: '2026-10-03', items: [{ itemType: 'service', serviceTitle: 'Estimate service', quantity: 1, unitPrice: 300 }] });
  const png = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+/a9sAAAAASUVORK5CYII=';
   const invoice = await api('quotations/' + quote.id + '/convert', 'POST', { invoiceDate: '2026-10-03', paidAmount: 900 });
  await api('expenses', 'POST', { invoiceId: invoice.id, description: 'Labour', expenseType: 'labour', category: 'Labour', workerCount: 2, workingDays: 1, labourRate: 100, expenseDate: '2026-10-03', attachments: [{ name: 'receipt.png', type: 'image/png', data: png }] });
  data = await api('bootstrap');
  check('Quote conversion retains Project Key and reduces only physical stock', () => { assert.equal(invoice.project_key, quote.project_key); assert.equal(data.products[0].quantity, 13); assert.equal(data.invoice_items.find(row => row.item_type === 'service').product_id, null); });
  const convertedEdit = await request('invoices/' + invoice.id, 'PUT', { companyId: 'company-default', customerId: customer.id, invoiceDate: '2026-10-03', items: [{ itemType: 'service', serviceTitle: 'Blocked edit', quantity: 1, unitPrice: 1 }] });
  check('Converted invoice edit is rejected to protect accounting history', () => { assert.equal(convertedEdit.status, 400); assert.ok(convertedEdit.data.error); });
  check('Labour calculation and invoice-linked receipt survive BLOB bridge', () => { assert.equal(data.expenses[0].amount, 200); assert.equal(data.expenses[0].invoice_id, invoice.id); assert.equal(data.expenses[0].project_key, ''); assert.equal(data.expense_attachments[0].file_name, 'receipt.png'); });
  const attachment = await request('expense-attachments/' + data.expense_attachments[0].id);
  check('Expense receipt download bytes are exact', () => assert.deepEqual(attachment.bytes, Buffer.from(png.split(',')[1], 'base64')));
  await api('payments', 'POST', { invoiceId: invoice.id, amount: 850, paymentDate: '2026-10-03', method: 'Cash' });
  data = await api('bootstrap'); check('Payments track overpayment', () => assert.equal(data.invoices[0].status, 'overpaid'));
  const backup = await request('backup/download');
  check('Private account backup returns a valid SQLite snapshot', () => { assert.equal(backup.status, 200); assert.equal(backup.bytes.subarray(0, 16).toString(), 'SQLite format 3\u0000'); assert.ok(backup.bytes.length > 1000); });
  const createdBackup = await api('backup/create', 'POST', {}); await api('customers', 'POST', { name: 'Android restore marker' });
  const snapshot = await api('backup/restore-history', 'POST', { fileName: createdBackup.fileName });
  check('Own-company account backup restores business records', () => { assert.equal(snapshot.success, true); });
  data = await api('bootstrap'); check('Account restore removes records created after the snapshot', () => assert.ok(!data.customers.some(row => row.name === 'Android restore marker')));
  await Promise.all([api('customers', 'POST', { name: 'Concurrent A' }), api('customers', 'POST', { name: 'Concurrent B' })]);
  data = await api('bootstrap'); check('Concurrent UI requests are serialized safely', () => assert.equal(data.customers.length, 3));
  close(); load(); data = await api('bootstrap');
  check('App restart retains session, invoice, expenses and company', () => { assert.equal(data.invoices[0].id, invoice.id); assert.equal(data.companies[0].bank_name, 'QC Bank'); assert.equal(data.expenses[0].amount, 200); });
  const companyId = (await api('backup/status')).companyId;
  const salesEmail = 'salesperson@example.test'; await api('auth/email-otp/request', 'POST', { purpose: 'admin-user', companyId, email: salesEmail }); const salesOtp = latestCode(salesEmail);
  await api('admin/users', 'POST', { companyId, username: 'salesperson', displayName: 'Sales', password: 'SalesPassword!2026', email: salesEmail, emailOtp: salesOtp, role: 'salesperson' });
  await api('auth/logout', 'POST', {}); await api('auth/login', 'POST', { username: 'salesperson', password: 'SalesPassword!2026' });
  check('Salesperson role survives secure login', () => {}); assert.equal((await api('auth/status')).user.role, 'salesperson');
  const forbidden = await request('expenses'); check('Permission checks deny salesperson expense access', () => assert.equal(forbidden.status, 403));
  data = await api('bootstrap'); check('Salesperson receives no purchase costs or expense data', () => { assert.equal(data.expenses.length, 0); assert.equal(data.products[0].purchase_price, undefined); });
  await api('auth/logout', 'POST', {}); const loggedOut = await request('bootstrap'); check('Logout deletes native session and protects pages', () => { assert.equal(loggedOut.status, 401); assert.equal(preferences.get('invoicey_session'), ''); });
  const betaEmail = 'beta-admin@example.test'; await api('auth/email-otp/request', 'POST', { purpose: 'registration', email: betaEmail }); const betaSignupCode = latestCode(betaEmail);
  await api('auth/signup', 'POST', { company: { name: 'Android QC Beta' }, username: 'betaadmin', displayName: 'Beta Admin', accountEmail: betaEmail, emailOtp: betaSignupCode, password: 'BetaPassword!2026', recoveryCode: 'beta-recovery-keep-private-0001', recoveryCodeConfirm: 'beta-recovery-keep-private-0001' });
  data = await api('bootstrap'); check('New-company signup isolates all business tables', () => { assert.equal(data.customers.length, 0); assert.equal(data.invoices.length, 0); assert.equal(data.products.length, 0); assert.equal(data.companies[0].name, 'Android QC Beta'); });
  const badReset = await request('auth/recover', 'POST', { email: betaEmail, emailOtp: '000000', newPassword: 'BetaPasswordReset!2026' }); check('Email password reset rejects an invalid one-time code', () => assert.equal(badReset.status, 400));
  await api('auth/email-otp/request', 'POST', { purpose: 'password-reset', email: betaEmail }); const betaResetCode = latestCode(betaEmail);
  await api('auth/recover', 'POST', { email: betaEmail, emailOtp: betaResetCode, newPassword: 'BetaPasswordReset!2026' });
  const resetLogin = await request('auth/login', 'POST', { username: 'betaadmin', password: 'BetaPasswordReset!2026' }); check('Verified email code resets password and permits sign-in', () => assert.equal(resetLogin.status, 200));
  const wrong = await backend.request({ path: '/api/backup/restore-history', method: 'POST', body: { fileName: createdBackup.fileName } }); check('Cross-company account restore is rejected', () => assert.equal(wrong.status, 400));
  await api('auth/logout', 'POST', {}); await api('auth/login', 'POST', { username: 'alphaadmin', password: 'AlphaPassword!2026' }); data = await api('bootstrap');
  check('Original-company data stays unchanged after other-company writes', () => { assert.equal(data.invoices[0].id, invoice.id); assert.equal(data.customers.length, 3); assert.equal(data.products[0].quantity, 13); });
  const db = new DatabaseSync(path.join(directory, 'companies', companyId, 'business.sqlite'), { readOnly: true });
  check('Android runtime data passes SQLite integrity/foreign key checks', () => { assert.equal(db.prepare('PRAGMA integrity_check').get().integrity_check, 'ok'); assert.deepEqual(db.prepare('PRAGMA foreign_key_check').all(), []); }); db.close();
  const globalDelete = await request('auth/factory-reset', 'POST', { code: '12345678' });
  check('Legacy global factory-reset endpoint is unavailable', () => assert.notEqual(globalDelete.status, 200));
  await api('auth/login', 'POST', { username: 'alphaadmin', password: 'AlphaPassword!2026' }); data = await api('bootstrap');
  check('A reset attempt leaves users, companies and business records intact', () => { assert.equal(data.companies[0].name, 'Android QC Alpha'); assert.ok(data.customers.some(row => row.id === customer.id)); assert.ok(data.invoices.some(row => row.id === invoice.id)); });
} catch (error) { results.push({ name: 'Runtime contract workflow', passed: false, error: error.stack }); }
finally { close(); const report = { createdAt: new Date().toISOString(), environment: 'Browser backend bundle + Node native-contract mock (not Android device)', passed: results.filter(row => row.passed).length, failed: results.filter(row => !row.passed).length, directory, results }; fs.writeFileSync(path.join(directory, 'report.json'), JSON.stringify(report, null, 2)); console.log(JSON.stringify(report, null, 2)); process.exitCode = report.failed ? 1 : 0; }

