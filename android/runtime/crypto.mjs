import { nativeCall } from './bridge.mjs';
import { Buffer } from './buffer.mjs';
import { scrypt } from '@noble/hashes/scrypt.js';
import { sha256 } from '@noble/hashes/sha2.js';
export function randomBytes(length) { const bytes = new Uint8Array(length); globalThis.crypto.getRandomValues(bytes); return Buffer.from(bytes); }
export function randomUUID() { const bytes = randomBytes(16); bytes[6] = bytes[6] & 15 | 64; bytes[8] = bytes[8] & 63 | 128; const hex = bytes.toString('hex'); return hex.slice(0, 8) + '-' + hex.slice(8, 12) + '-' + hex.slice(12, 16) + '-' + hex.slice(16, 20) + '-' + hex.slice(20); }
export function timingSafeEqual(a, b) { if (a.length !== b.length) throw new Error('Input buffers must have the same byte length.'); let difference = 0; for (let i = 0; i < a.length; i++) difference |= a[i] ^ b[i]; return difference === 0; }
export function scryptSync(password, salt, length) {
  const p = Buffer.from(password), s = Buffer.from(salt);
  try { return Buffer.from(nativeCall('crypto.scrypt', { password: p.toString('base64'), salt: s.toString('base64'), length }), 'base64'); }
  catch (error) { if (!/unsupported|unknown operation/i.test(error.message)) throw error; return Buffer.from(scrypt(p, s, { N: 16384, r: 8, p: 1, dkLen: length })); }
}
export function createHash(algorithm) {
  if (algorithm !== 'sha256') throw new Error('Unsupported hash algorithm: ' + algorithm);
  const parts = [];
  return { update(value, encoding) { parts.push(Buffer.from(value, encoding)); return this; }, digest(encoding) { const result = Buffer.from(sha256(Buffer.concat(parts))); return encoding ? result.toString(encoding) : result; } };
}


