// HTTP-only protections for the hosted workspace. Keep the private Android
// runtime independent of Node modules; the hosting wrapper installs this hook.
export function createHttpGuard({ publicOrigin, corsOrigins = [] }) {
  const normalizedOrigin = value => {
    try { const u = new URL(value); return ['http:', 'https:'].includes(u.protocol) && !u.username && !u.password ? u.origin : ''; }
    catch { return ''; }
  };
  const origin = normalizedOrigin(publicOrigin);
  if (!origin) throw new Error('The public app origin must be an HTTP or HTTPS origin.');
  const trusted = new Set([origin, ...corsOrigins.map(normalizedOrigin).filter(Boolean)]);
  const connect = [...trusted].join(' ');
  const policy = ["default-src 'self'", "script-src 'self'", "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "font-src 'self' https://fonts.gstatic.com", "img-src 'self' data: blob:", `connect-src 'self' ${connect}`,
    "object-src 'none'", "base-uri 'none'", "frame-ancestors 'none'", "frame-src 'self' blob:",
    "form-action 'self'", "worker-src 'self' blob:"].join('; ') + ';';
  return (req, res, url) => {
    res.setHeader('content-security-policy', policy);
    res.setHeader('x-content-type-options', 'nosniff');
    res.setHeader('x-frame-options', 'DENY');
    res.setHeader('referrer-policy', 'strict-origin-when-cross-origin');
    res.setHeader('permissions-policy', 'camera=(), microphone=(), geolocation=()');
    if (origin.startsWith('https:')) res.setHeader('strict-transport-security', 'max-age=31536000');
    if (!url.pathname.startsWith('/api/')) return false;
    res.setHeader('cache-control', 'no-store');
    const reject = (status, error) => { res.writeHead(status, { 'content-type': 'application/json; charset=utf-8' }); res.end(JSON.stringify({ error })); return true; };
    if (!['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method)) return false;
    const source = String(req.headers.origin || '');
    if (source && !trusted.has(source)) return reject(403, 'This request origin is not allowed.');
    if (!source && req.headers.referer && !trusted.has(normalizedOrigin(String(req.headers.referer)))) return reject(403, 'This request origin is not allowed.');
    if (!source && String(req.headers['sec-fetch-site'] || '') === 'cross-site') return reject(403, 'Cross-site changes are not allowed.');
    const binaryBackupRestore = req.method === 'POST' && url.pathname === '/api/backup/restore-upload';
    if (binaryBackupRestore && !/^application\/octet-stream(?:\s*;|$)/i.test(String(req.headers['content-type'] || ''))) return reject(415, 'Upload the private account backup as an octet-stream.');
    if (!binaryBackupRestore && ['POST', 'PUT', 'PATCH'].includes(req.method) && url.pathname !== '/api/restore' && !/^application\/json(?:\s*;|$)/i.test(String(req.headers['content-type'] || ''))) return reject(415, 'Use application/json for this request.');
    return false;
  };
}

