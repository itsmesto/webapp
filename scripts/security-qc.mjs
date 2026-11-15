import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { once } from 'node:events';
import { mkdirSync, mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { DatabaseSync } from 'node:sqlite';

// Uses only a fresh disposable database and a local email outbox. No production
// credentials, records, email recipients or external email transport are used.
const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
mkdirSync(path.join(root, 'tmp'), { recursive: true });
const directory = mkdtempSync(path.join(root, 'tmp', 'security-qc-'));
const outbox = path.join(directory, 'test-email.jsonl');
const results = [];
let child, base, cookie = '', stderr = '';
const check = async (name, fn) => {
  try { await fn(); results.push({ name, passed: true }); }
  catch (error) { results.push({ name, passed: false, error: error.message }); }
};
async function request(route, method = 'GET', body, options = {}) {
  const headers = { ...options.headers };
  if (body !== undefined && !headers['content-type']) headers['content-type'] = 'application/json';
  if (options.cookie ?? cookie) headers.cookie = options.cookie ?? cookie;
  const response = await fetch(base + route, { method, headers,
    body: body === undefined ? undefined : typeof body === 'string' ? body : JSON.stringify(body) });
  if (options.adopt !== false && response.headers.get('set-cookie')) cookie = response.headers.get('set-cookie').split(';')[0];
  const text = await response.text();
  let data; try { data = JSON.parse(text); } catch { data = text; }
  return { status: response.status, data, response };
}
async function api(route, method = 'GET', body, options) {
  const r = await request('/api/' + route, method, body, options);
  assert.equal(r.status, 200, route + ': expected 200, got ' + r.status);
  return r.data;
}
function codeFor(email) {
  const messages = readFileSync(outbox, 'utf8').trim().split(/\r?\n/).map(JSON.parse);
  return messages.findLast(m => m.to === email).text.match(/code is (\d{6})/)[1];
}
async function register(email, username, company, initial = false) {
  await api('auth/email-otp/request', 'POST', { purpose: 'registration', email });
  return api(initial ? 'auth/setup' : 'auth/signup', 'POST', {
    company: { name: company }, username, displayName: username,
    accountEmail: email, emailOtp: codeFor(email), password: 'SandboxPassword!2026'
  });
}
try {
  child = spawn(process.execPath, [path.join(root, 'hosting/server.mjs')], {
    cwd: root, windowsHide: true, env: { ...process.env, NODE_ENV: 'test',
      INVOICEY_TEST_EMAIL_OUTBOX: outbox, HOST: '127.0.0.1', PORT: '0',
      INVOICEY_CORS_ORIGIN: 'https://appassets.androidplatform.net,https://approved.example.test,null',
      LEDGER_DATA_DIR: directory }, stdio: ['ignore', 'pipe', 'pipe']
  });
  child.stderr.on('data', d => stderr += d);
  base = await new Promise((resolve, reject) => {
    let output = ''; const timer = setTimeout(() => reject(new Error('Sandbox startup timed out')), 15000);
    child.stdout.on('data', d => { output += d; const m = output.match(/http:\/\/127\.0\.0\.1:\d+/); if (m) { clearTimeout(timer); resolve(m[0]); } });
    child.once('exit', () => { clearTimeout(timer); reject(new Error('Sandbox server exited before startup')); });
  });
  const home = await request('/');
  for (const header of ['content-security-policy', 'strict-transport-security', 'x-content-type-options', 'x-frame-options', 'referrer-policy', 'permissions-policy']) {
    await check('Security header: ' + header, () => assert.ok(home.response.headers.get(header)));
  }
  await check('CSP blocks inline scripts and framing', () => {
    assert.match(home.response.headers.get('content-security-policy') || '', /script-src 'self';/);
    assert.match(home.response.headers.get('content-security-policy') || '', /frame-ancestors 'none'/);
  });
  await check('Initial HTML hides the workspace until authentication completes', () => assert.match(home.data, /<body class="access-locked">/));
  await check('Initial HTML does not advertise a sample company', () => assert.ok(!home.data.includes('Meridian Supply Co.')));
  for (const route of ['bootstrap', 'customers', 'invoices', 'quotations', 'admin/users', 'backup/status', 'backup.xlsx', 'expense-attachments/not-found']) {
    await check('Anonymous request denied: ' + route, async () => assert.equal((await request('/api/' + route, 'GET', undefined, { cookie: '', adopt: false })).status, 401));
  }
  await check('Unapproved CORS preflight rejected', async () => assert.equal((await request('/api/customers', 'OPTIONS', undefined, { headers: { origin: 'https://attacker.example.test' } })).status, 403));
  await check('Android asset origin CORS retained', async () => {
    const r = await request('/api/customers', 'OPTIONS', undefined, { headers: { origin: 'https://appassets.androidplatform.net' } });
    assert.equal(r.status, 204); assert.equal(r.response.headers.get('access-control-allow-origin'), 'https://appassets.androidplatform.net');
  });
  await check('Opaque null origin CORS preflight rejected', async () => assert.equal((await request('/api/customers', 'OPTIONS', undefined, { headers: { origin: 'null' } })).status, 403));
  const accountA = await register('alpha-security@example.test', 'securityalpha', 'Security Sandbox Alpha', true);
  const alphaCookie = cookie, alphaId = accountA.company.id;
  const loginOtpMessagesBefore = readFileSync(outbox, 'utf8').trim().split(/\r?\n/).filter(Boolean).length;
  for (let i = 0; i < 4; i++) await request('/api/auth/login', 'POST', { username: 'securityalpha', password: 'WrongPassword!2026' }, { cookie: '', adopt: false });
  await check('Four failed login attempts trigger verified-email password recovery', async () => {
    const messages = readFileSync(outbox, 'utf8').trim().split(/\r?\n/).filter(Boolean).slice(loginOtpMessagesBefore).map(JSON.parse);
    assert.ok(messages.some(message => message.to === 'alpha-security@example.test' && message.subject.includes('password reset')));
  });
  await check('Session cookie is HttpOnly, Secure and has no Domain attribute', async () => {
    const r = await request('/api/auth/login', 'POST', { username: 'securityalpha', password: 'SandboxPassword!2026' });
    const value = r.response.headers.get('set-cookie');
    assert.match(value, /HttpOnly/); assert.match(value, /; Secure/); assert.ok(!/Domain=/i.test(value));
  });
  cookie = alphaCookie;
  await check('Hosted signup cannot assign another company backup folder', async () => assert.equal((await request('/api/auth/signup', 'POST', {backupDir:'/data/companies/another-company/backups'})).status, 400));
  await check('Cross-site JSON mutation rejected', async () => assert.equal((await request('/api/customers', 'POST', { name: 'Forbidden CSRF' }, { headers: { origin: 'https://attacker.example.test' } })).status, 403));
  await check('Cross-site simple text/plain mutation rejected', async () => assert.equal((await request('/api/customers', 'POST', JSON.stringify({ name: 'Forbidden simple CSRF' }), { headers: { origin: 'https://attacker.example.test', 'content-type': 'text/plain' } })).status, 403));
  await check('Cross-site request with no Origin rejected using Fetch Metadata', async () => assert.equal((await request('/api/customers', 'POST', { name: 'Forbidden metadata CSRF' }, { headers: { 'sec-fetch-site': 'cross-site' } })).status, 403));
  await check('Hostile Referer rejected when Origin is absent', async () => assert.equal((await request('/api/customers', 'POST', { name: 'Forbidden referer CSRF' }, { headers: { referer: 'https://attacker.example.test/attack' } })).status, 403));
  await check('Simple content types cannot be used for JSON APIs', async () => assert.equal((await request('/api/customers', 'POST', JSON.stringify({ name: 'Forbidden media' }), { headers: { 'content-type': 'text/plain' } })).status, 415));
  const customerA = await api('customers', 'POST', { name: 'Alpha customer' });
  await check('Explicitly approved browser origin can submit JSON changes', async () => assert.equal((await request('/api/customers', 'POST', {name:'Approved origin customer'}, {headers:{origin:'https://approved.example.test'}})).status, 200));
  const invoicePayload = { companyId: 'company-default', customerId: customerA.id, invoiceDate: '2026-10-12', items: [{ itemType: 'service', serviceTitle: 'Sandbox service', quantity: 1, unitPrice: 100, unitCost: 25 }] };
  const invoiceA = await api('invoices', 'POST', invoicePayload);
  const quotePayload = { ...invoicePayload, quoteDate: '2026-10-12', status: 'sent' };
  const quoteA = await api('quotations', 'POST', quotePayload);
  await api('auth/email-otp/request', 'POST', { purpose: 'admin-user', companyId: alphaId, email: 'sales-security@example.test' });
  await api('admin/users', 'POST', { companyId: alphaId, username: 'securitysales', displayName: 'Sandbox sales', role: 'salesperson', password: 'SandboxSales!2026', email: 'sales-security@example.test', emailOtp: codeFor('sales-security@example.test') });
  await api('auth/login', 'POST', { username: 'securitysales', password: 'SandboxSales!2026' });
  const salesCookie = cookie;
  await check('Salesperson cannot administer users', async () => assert.equal((await request('/api/admin/users')).status, 403));
  await check('Salesperson cannot read expenses', async () => assert.equal((await request('/api/expenses')).status, 403));
  await check('Salesperson cannot change company profile or bank details', async () => assert.equal((await request('/api/companies/company-default', 'PUT', {name:'Unauthorized profile',bankAccountNumber:'unauthorized'})).status, 403));
  await check('Salesperson bootstrap hides other users invoices', async () => assert.ok(!(await api('bootstrap')).invoices.some(i => i.id === invoiceA.id)));
  await check('Salesperson bootstrap hides other users project metadata', async () => assert.ok(!(await api('bootstrap')).projects.some(p => p.project_key === invoiceA.project_key)));
  await check('Salesperson cannot attach an invoice to another users project', async () => assert.equal((await request('/api/invoices','POST',{...invoicePayload,projectKey:invoiceA.project_key,projectName:'Unauthorized rename'})).status,403));
  await check('Salesperson cannot edit another users hidden invoice by ID', async () => assert.equal((await request('/api/invoices/' + invoiceA.id, 'PUT', { ...invoicePayload, notes: 'Unauthorized edit' })).status, 403));
  await check('Salesperson cannot edit another users hidden quotation by ID', async () => assert.equal((await request('/api/quotations/' + quoteA.id, 'PUT', { ...quotePayload, notes: 'Unauthorized edit' })).status, 403));
  const ownInvoice = await api('invoices', 'POST', invoicePayload);
  await check('Salesperson can edit their own invoice', async () => assert.equal((await request('/api/invoices/' + ownInvoice.id, 'PUT', { ...invoicePayload, notes: 'Own permitted edit' })).status, 200));
  cookie = alphaCookie;
  const adminSnapshot = await api('bootstrap');
  await check('Denied company profile edit leaves the account name unchanged', async () => assert.equal((await api('auth/status')).company.name, 'Security Sandbox Alpha'));
  await check('Denied invoice edits have no side effects', () => assert.notEqual(adminSnapshot.invoices.find(i => i.id === invoiceA.id).notes, 'Unauthorized edit'));
  await check('User-selected backup directories are removed', async () => assert.equal((await request('/api/backup/directory', 'POST', { path: path.join(directory, 'outside-company') })).status, 404));
  const expenseBase = { description: 'Sandbox receipt', category: 'General', amount: 5, expenseDate: '2026-10-12' };
  await check('Executable receipt upload rejected', async () => assert.equal((await request('/api/expenses', 'POST', { ...expenseBase, attachments: [{ name: 'malicious.php', type: 'application/pdf', data: 'data:application/pdf;base64,' + Buffer.from('%PDF-<?php echo 1; ?>').toString('base64') }] })).status, 400));
  await check('Spoofed PNG receipt upload rejected', async () => assert.equal((await request('/api/expenses', 'POST', { ...expenseBase, attachments: [{ name: 'fake.png', type: 'image/png', data: 'data:image/png;base64,' + Buffer.from('<script>alert(1)</script>').toString('base64') }] })).status, 400));
  const injection = "Literal name'); DROP TABLE customers; -- <img src=x onerror=alert(1)>";
  const literal = await api('customers', 'POST', { name: injection });
  await check('SQL-looking names remain literal data and do not damage tables', async () => {
    const d = await api('bootstrap'); assert.equal(d.customers.find(c => c.id === literal.id).name, injection); assert.ok(d.customers.some(c => c.id === customerA.id));
  });
  await register('beta-security@example.test', 'securitybeta', 'Security Sandbox Beta');
  const betaCookie = cookie;
  await check('Company B sees none of Company A records', async () => { const d = await api('bootstrap'); assert.equal(d.customers.length, 0); assert.equal(d.invoices.length, 0); });
  await check('Company B cannot edit Company A invoice by ID', async () => assert.equal((await request('/api/invoices/' + invoiceA.id, 'PUT', invoicePayload)).status, 400));
  await check('Company B cannot select Company A', async () => assert.equal((await request('/api/auth/select-company', 'POST', { companyId: alphaId })).status, 403));
  await check('Company B cannot enumerate Company A users', async () => assert.equal((await request('/api/admin/users?companyId=' + alphaId)).status, 403));
  cookie = alphaCookie;
  await api('auth/email-otp/request', 'POST', { purpose: 'email-change', email: 'alpha-security@example.test',currentPassword:'SandboxPassword!2026' });
  await check('Email-change OTP cannot be used for password reset', async () => assert.equal((await request('/api/auth/recover', 'POST', {email:'alpha-security@example.test',emailOtp:codeFor('alpha-security@example.test'),newPassword:'SandboxReset!2026'},{cookie:'',adopt:false})).status,400));
  await api('auth/email-otp/request', 'POST', {purpose:'email-change',email:'changed-security@example.test',currentPassword:'SandboxPassword!2026'});
  const changeCode = codeFor('changed-security@example.test');
  await check('Email verification code is locked after five incorrect guesses', async () => {
    const wrong = changeCode === '000000' ? '000001' : '000000';
    for(let i=0;i<5;i++) assert.equal((await request('/api/auth/email/confirm','POST',{email:'changed-security@example.test',emailOtp:wrong})).status,400);
    assert.equal((await request('/api/auth/email/confirm','POST',{email:'changed-security@example.test',emailOtp:changeCode})).status,400);
  });
  await api('auth/email-otp/request', 'POST', { purpose: 'password-reset', email: 'alpha-security@example.test' });
  const resetCode = codeFor('alpha-security@example.test');
  await api('auth/recover', 'POST', { email: 'alpha-security@example.test', emailOtp: resetCode, newPassword: 'SandboxReset!2026' }, { adopt: false });
  await check('Password reset invalidates the old login session', async () => assert.equal((await request('/api/bootstrap', 'GET', undefined, { cookie: alphaCookie, adopt: false })).status, 401));
  await check('Used password-reset code cannot be replayed', async () => assert.equal((await request('/api/auth/recover', 'POST', { email: 'alpha-security@example.test', emailOtp: resetCode, newPassword: 'SandboxReset!2027' }, { cookie: '', adopt: false })).status, 400));
  await api('auth/email-otp/request', 'POST', { purpose: 'password-reset', email: 'beta-security@example.test' }, { cookie: '', adopt: false });
  const betaCode = codeFor('beta-security@example.test'), registry = new DatabaseSync(path.join(directory, 'access.sqlite'));
  registry.prepare("UPDATE auth_email_otps SET expires_at='2000-01-01T00:00:00.000Z' WHERE email=?").run('beta-security@example.test'); registry.close();
  await check('Expired password-reset code is rejected', async () => assert.equal((await request('/api/auth/recover', 'POST', { email: 'beta-security@example.test', emailOtp: betaCode, newPassword: 'SandboxReset!2026' }, { cookie: '', adopt: false })).status, 400));
  await check('Password-reset requests do not reveal whether email exists', async () => {
    const r = await request('/api/auth/email-otp/request', 'POST', { purpose: 'password-reset', email: 'missing-security@example.test' }, { cookie: '', adopt: false });
    assert.equal(r.status, 200); assert.equal(r.data.message, 'If the account has a verified email, a code has been sent.');
  });
  await check('Login attempts are rate limited', async () => {
    let r; for (let i = 0; i < 9; i++) r = await request('/api/auth/login', 'POST', { username: 'unknown-rate-user', password: 'WrongPassword!2026' }, { cookie: '', adopt: false }); assert.equal(r.status, 429);
  });
  await check('OTP requests are rate limited', async () => {
    let r; for (let i = 0; i < 4; i++) r = await request('/api/auth/email-otp/request', 'POST', { purpose: 'registration', email: 'rate-security@example.test' }, { cookie: '', adopt: false }); assert.equal(r.status, 429);
  });
  await check('Malformed URL does not crash the server', async () => { assert.equal((await request('/%ZZ', 'GET', undefined, { cookie: '' })).status, 400); assert.equal((await request('/api/auth/status')).status, 200); });
  await check('Static directory requests do not crash the server', async () => { assert.equal((await request('/assets/')).status, 404); assert.equal((await request('/api/auth/status')).status, 200); });
} catch (error) { results.push({ name: 'Security workflow', passed: false, error: error.stack || error.message, stderr }); }
finally {
  if (child && child.exitCode === null) { const done = once(child, 'exit'); child.kill(); await done; }
  const report = { createdAt: new Date().toISOString(), sandboxOnly: true, directory,
    passed: results.filter(r => r.passed).length, failed: results.filter(r => !r.passed).length,
    results, serverExitedUnexpectedly: child?.exitCode !== null && child?.exitCode !== 0 && child?.signalCode === null };
  writeFileSync(path.join(directory, 'security-report.json'), JSON.stringify(report, null, 2));
  console.log(JSON.stringify({ ...report, results: report.results.filter(r => !r.passed) }, null, 2));
  process.exitCode = report.failed ? 1 : 0;
}

