import { Buffer as BrowserBuffer } from 'buffer/';
const originalToString = BrowserBuffer.prototype.toString;
const originalFrom = BrowserBuffer.from;
BrowserBuffer.prototype.toString = function(encoding, ...rest) {
  if (encoding === 'base64url') return originalToString.call(this, 'base64', ...rest).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
  return originalToString.call(this, encoding, ...rest);
};
BrowserBuffer.from = function(value, encoding, ...rest) {
  return originalFrom.call(this, value, encoding === 'base64url' ? 'base64' : encoding, ...rest);
};
export const Buffer = BrowserBuffer;


