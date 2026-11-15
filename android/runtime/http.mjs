import { nativeCall } from './bridge.mjs';
import { Buffer } from './buffer.mjs';
let handler, queue = Promise.resolve();
let sessionCookie = nativeCall('prefs.get', { key: 'invoicey_session' }) || '';
export default { createServer(callback) { handler = callback; return { listen(port, host, ready) { ready?.(); }, address() { return { port: 4173 }; } }; } };

async function dispatch(url, options = {}) {
  const path = new URL(url, globalThis.location?.href || 'https://appassets.androidplatform.net').pathname + new URL(url, globalThis.location?.href || 'https://appassets.androidplatform.net').search;
  const payload = options.body instanceof Blob ? Buffer.from(await options.body.arrayBuffer()) : options.body instanceof ArrayBuffer || options.body instanceof Uint8Array ? Buffer.from(options.body) : Buffer.from(options.body || '');
  const headers = Object.fromEntries(new Headers(options.headers || {}).entries());
  if (sessionCookie) headers.cookie = sessionCookie;
  const request = { url: path, method: String(options.method || 'GET').toUpperCase(), headers, socket: { remoteAddress: 'android-local' }, async *[Symbol.asyncIterator]() { if (payload.length) yield payload; } };
  let status = 200, responseHeaders = {}, responseBytes, ended = false;
  const response = {
    setHeader(name, value) { responseHeaders[name.toLowerCase()] = String(value); },
    writeHead(code, extra = {}) { status = code; for (const [name, value] of Object.entries(extra)) this.setHeader(name, value); },
    end(body = '') { responseBytes = Buffer.from(body); ended = true; }
  };
  await handler(request, response);
  if (!ended) throw new Error('The local data service did not finish the request.');
  const cookie = responseHeaders['set-cookie'];
  if (cookie) {
    sessionCookie = /Max-Age=0(?:;|$)/i.test(cookie) ? '' : cookie.split(';')[0];
    nativeCall('prefs.set', { key: 'invoicey_session', value: sessionCookie });
    delete responseHeaders['set-cookie'];
  }
  return { status, headers: responseHeaders, body: responseBytes };
}
export function internalRequest(url, options) {
  const operation = queue.then(() => dispatch(url, options));
  queue = operation.catch(() => {});
  return operation;
}


