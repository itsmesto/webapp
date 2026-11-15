import { nativeCall } from './bridge.mjs';
import { Buffer } from './buffer.mjs';
export function deflateRawSync(data, options = {}) { return Buffer.from(nativeCall('zlib.deflate', { data: Buffer.from(data).toString('base64'), level: options.level ?? 6 }), 'base64'); }
export function inflateRawSync(data, options = {}) { return Buffer.from(nativeCall('zlib.inflate', { data: Buffer.from(data).toString('base64'), maxOutputLength: options.maxOutputLength || 384 * 1024 * 1024 }), 'base64'); }


