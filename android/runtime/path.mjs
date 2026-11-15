function normalize(value) {
  const segments = String(value).replace(/\\/g, '/').split('/'), result = [];
  for (const segment of segments) { if (!segment || segment === '.') continue; if (segment === '..') result.pop(); else result.push(segment); }
  return (String(value).startsWith('/') ? '/' : '') + result.join('/') || '.';
}
const path = {
  sep: '/',
  normalize,
  resolve(...parts) {
    let value = '/app';
    for (const part of parts) if (part) value = String(part).startsWith('/') ? String(part) : value + '/' + part;
    return normalize(value);
  },
  join(...parts) { return normalize(parts.filter(Boolean).join('/')); },
  dirname(value) { const p = normalize(value), i = p.lastIndexOf('/'); return i < 0 ? '.' : i === 0 ? '/' : p.slice(0, i); },
  basename(value, suffix) { const b = normalize(value).split('/').pop(); return suffix && b.endsWith(suffix) ? b.slice(0, -suffix.length) : b; },
  extname(value) { const b = this.basename(value), i = b.lastIndexOf('.'); return i <= 0 ? '' : b.slice(i); },
  relative(from, to) { const a = this.resolve(from).split('/').filter(Boolean), b = this.resolve(to).split('/').filter(Boolean); let index = 0; while (index < a.length && index < b.length && a[index] === b[index]) index++; return [...a.slice(index).map(() => '..'), ...b.slice(index)].join('/'); },
  isAbsolute(value) { return String(value).startsWith('/'); }
};
export default path;

