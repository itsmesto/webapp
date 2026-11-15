import { nativeCall } from './bridge.mjs';
import { Buffer } from './buffer.mjs';
const encode = value => value instanceof Uint8Array ? { __bytes: Buffer.from(value).toString('base64') } : value;
const decode = value => value && typeof value === 'object' && typeof value.__bytes === 'string' ? Buffer.from(value.__bytes, 'base64') : value;
export class DatabaseSync {
  constructor(path) { this.handle = nativeCall('sqlite.open', { path }); }
  exec(sql) { return nativeCall('sqlite.exec', { handle: this.handle, sql }); }
  prepare(sql) {
    const handle = this.handle;
    return {
      all(...params) { return nativeCall('sqlite.all', { handle, sql, params: params.map(encode) }).map(row => Object.fromEntries(Object.entries(row).map(([key, value]) => [key, decode(value)]))); },
      get(...params) { return this.all(...params)[0]; },
      run(...params) { return nativeCall('sqlite.run', { handle, sql, params: params.map(encode) }); }
    };
  }
  close() { nativeCall('sqlite.close', { handle: this.handle }); }
}


