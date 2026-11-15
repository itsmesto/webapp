import './buffer.mjs';
import '../../server.mjs';
import { internalRequest } from './http.mjs';
import { Buffer } from './buffer.mjs';
const originalFetch = globalThis.fetch.bind(globalThis);
async function localFetch(url, options = {}) {
  const target = url instanceof Request ? url.url : String(url);
  const parsed = new URL(target, globalThis.location.href);
  if (!parsed.pathname.startsWith('/api/') || parsed.origin !== globalThis.location.origin) return originalFetch(url, options);
  if (url instanceof Request) options = { method: url.method, headers: url.headers, body: ['GET', 'HEAD'].includes(url.method) ? undefined : await url.arrayBuffer(), ...options };
  const result = await internalRequest(target, options);
  return new Response(result.body, { status: result.status, headers: result.headers });
}
globalThis.fetch = localFetch;
globalThis.InvoiceyBackend = {
  ready: true,
  fetch: localFetch,
  async request({ method = 'GET', path, body, bodyBase64, headers = {} }) {
    const result = await internalRequest(path, { method, headers, body: bodyBase64 ? Buffer.from(bodyBase64, 'base64') : body === undefined ? undefined : typeof body === 'string' ? body : JSON.stringify(body) });
    return { ...result, body: result.body.toString('base64') };
  }
};


