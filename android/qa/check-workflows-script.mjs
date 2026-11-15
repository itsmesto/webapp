// Checks that the portable Android QA scenario agrees with the reference Node
// implementation. This result is not evidence of Android device behavior.
import { spawn } from 'node:child_process';
import { once } from 'node:events';
import { mkdtempSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';
const root = path.dirname(path.dirname(path.dirname(fileURLToPath(import.meta.url))));
mkdirSync(path.join(root, 'tmp'), {recursive: true});
const data = mkdtempSync(path.join(root, 'tmp', 'android-qa-reference-'));
const emailOutbox = path.join(data, 'email-outbox.jsonl');
const child = spawn(process.execPath, [path.join(root, 'hosting', 'server.mjs')], {cwd: root, windowsHide: true, env: {...process.env, NODE_ENV: 'test', INVOICEY_TEST_EMAIL_OUTBOX: emailOutbox, PORT: '0', HOST: '127.0.0.1', LEDGER_DATA_DIR: data, LEDGER_DB: path.join(data, 'ledgerly.sqlite')}, stdio: ['ignore', 'pipe', 'pipe']});
let stderr = '', cookie = '';
child.stderr.on('data', chunk => stderr += chunk);
try {
  const base = await new Promise((resolve, reject) => {let output = ''; const timer = setTimeout(() => reject(new Error('Server startup timeout: ' + stderr)), 15000); child.stdout.on('data', chunk => {output += chunk; const match = output.match(/http:\/\/127\.0\.0\.1:\d+/); if (match) {clearTimeout(timer); resolve(match[0]);}}); child.once('exit', code => {clearTimeout(timer); reject(new Error('Server exit ' + code + ': ' + stderr));});});
  const storage = new Map(), browser = {console, navigator: {userAgent: 'QA script verifier against reference Node server (not Android)'}, localStorage: {getItem: key => storage.get(key), setItem: (key, value) => storage.set(key, value)}, testEmailCode: email => {const rows=readFileSync(emailOutbox,'utf8').trim().split(/\r?\n/).filter(Boolean).map(line=>JSON.parse(line)),message=rows.findLast(item=>item.to===email),match=message?.text?.match(/code is (\d{6})/);if(!match)throw new Error('No test email code was captured for '+email);return match[1];}, Uint8Array, ArrayBuffer, TextEncoder, TextDecoder, btoa: value => Buffer.from(value, 'binary').toString('base64'), fetch: async (url, options = {}) => {
    const response = await fetch(base + url, {...options, headers: {...options.headers, cookie}});
    const setCookie = response.headers.get('set-cookie'); if (setCookie) cookie = setCookie.split(';')[0];
    return response;
  }};
  browser.window = browser;
  const context = vm.createContext(browser);
  vm.runInContext(readFileSync(path.join(root, 'android', 'qa', 'workflows.js'), 'utf8'), context);
  const report = await browser.runInvoiceyQA();
  const persistence = report.failed ? null : await browser.runInvoiceyPersistenceQA();
  writeFileSync(path.join(data, 'reference-report.json'), JSON.stringify({report, persistence}, null, 2));
  console.log(JSON.stringify({directory: data, referenceOnly: true, passed: report.passed, failed: report.failed, persistencePassed: persistence?.passed, persistenceFailed: persistence?.failed}, null, 2));
  process.exitCode = report.failed || persistence?.failed ? 1 : 0;
} finally {if (child.exitCode === null) {const stopped = once(child, 'exit'); child.kill(); await stopped;}}

