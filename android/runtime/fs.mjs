import { nativeCall } from './bridge.mjs';
import { Buffer } from './buffer.mjs';
export const constants = { W_OK: 2 };
export function existsSync(path) { return nativeCall('fs.exists', { path }); }
export function mkdirSync(path, options = {}) { return nativeCall('fs.mkdir', { path, recursive: !!options.recursive }); }
export function readFileSync(path, options) { const bytes = Buffer.from(nativeCall('fs.read', { path }), 'base64'); const encoding = typeof options === 'string' ? options : options?.encoding; return encoding ? bytes.toString(encoding) : bytes; }
export function writeFileSync(path, data, options = {}) { const encoding = typeof options === 'string' ? options : options.encoding || 'utf8'; return nativeCall('fs.write', { path, data: Buffer.from(data, encoding).toString('base64'), flag: options.flag || 'w' }); }
export function renameSync(from, to) { return nativeCall('fs.rename', { from, to }); }
export function unlinkSync(path) { return nativeCall('fs.unlink', { path }); }
export function readdirSync(path) { return nativeCall('fs.readdir', { path }); }
export function copyFileSync(from, to) { return nativeCall('fs.copy', { from, to }); }
export function realpathSync(path) { return nativeCall('fs.realpath', { path }); }
export function accessSync(path, mode) { return nativeCall('fs.access', { path, mode }); }
export function statSync(path) { const stat = nativeCall('fs.stat', { path }); return { ...stat, mtime: new Date(stat.modifiedAt || 0), mtimeMs: stat.modifiedAt || 0, isFile: () => !stat.isDirectory, isDirectory: () => !!stat.isDirectory }; }
export function createReadStream(path) { return { pipe(response) { response.end(readFileSync(path)); } }; }


