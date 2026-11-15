import { environment } from './bridge.mjs';
export default { env: { LEDGER_DATA_DIR: environment.dataRoot, HOST: '127.0.0.1', PORT: '4173' }, pid: 'android', cwd: () => '/app', platform: 'android' };

