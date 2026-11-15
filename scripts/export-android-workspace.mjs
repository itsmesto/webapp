import { DatabaseSync } from 'node:sqlite';
import { createHash } from 'node:crypto';
import { deflateRawSync } from 'node:zlib';
import { existsSync, mkdirSync, mkdtempSync, readFileSync, writeFileSync, readdirSync, lstatSync, rmSync } from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { fileURLToPath } from 'node:url';

// Run with the desktop app closed. Never copies user data into the APK/source.
// Android import must validate this manifest, remap paths, clear sessions and
// use a recovery archive before replacing an existing environment.
const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const MAX_BYTES = 512 * 1024 * 1024;
const MAX_FILES = 50_000;
const FORMAT = 'invoicey-workspace-v1';
const crcTable = Array.from({length: 256}, (_, n) => {
  let value = n; for (let k = 0; k < 8; k++) value = value & 1 ? 0xedb88320 ^ value >>> 1 : value >>> 1;
  return value >>> 0;
});
const sha = bytes => createHash('sha256').update(bytes).digest('hex');
const crc32 = bytes => {let crc = 0xffffffff; for (const byte of bytes) crc = crcTable[(crc ^ byte) & 255] ^ crc >>> 8; return (crc ^ 0xffffffff) >>> 0;};
const safeCompanyId = id => typeof id === 'string' && /^[a-zA-Z0-9][a-zA-Z0-9._-]{0,127}$/.test(id) && !id.includes('..');
const args = process.argv.slice(2);
const options = {};
for (let i = 0; i < args.length; i++) {
  if (args[i] === '--help' || args[i] === '-h') { console.log('Usage: node scripts/export-android-workspace.mjs --data-dir "path to desktop data" --output "migration.invoicey.zip"\nClose itsme invoicey before exporting. --data-dir defaults to %APPDATA%/Ledgerly Business Operations.'); process.exit(0); }
  if (!['--data-dir', '--output'].includes(args[i]) || !args[i + 1]) throw new Error('Unknown or incomplete option: ' + args[i]);
  options[args[i].slice(2)] = args[++i];
}
if (!options.output) throw new Error('Choose --output "migration.invoicey.zip". No existing file will be overwritten.');
const dataRoot = path.resolve(options['data-dir'] || path.join(process.env.APPDATA || os.homedir(), 'Ledgerly Business Operations'));
const output = path.resolve(options.output);
if (existsSync(output)) throw new Error('The export file already exists. Choose a new output filename.');
if (!existsSync(path.join(dataRoot, 'access.sqlite'))) throw new Error('No configured itsme invoicey workspace was found at: ' + dataRoot);
const temporary = mkdtempSync(path.join(os.tmpdir(), 'invoicey-android-transfer-'));
let byteTotal = 0;
const files = new Map();

function addFile(name, bytes) {
  if (!/^(access\.sqlite|companies\/[a-zA-Z0-9._-]+\/.+)$/.test(name) || name.includes('..') || name.includes('\\')) throw new Error('Unsafe archive entry: ' + name);
  if (files.has(name)) return;
  const value = Buffer.from(bytes); byteTotal += value.length;
  if (byteTotal > MAX_BYTES || files.size >= MAX_FILES) throw new Error('Workspace exceeds the 512 MB / 50,000-file migration limit.');
  files.set(name, value);
}

function snapshotDatabase(source, name) {
  const target = path.join(temporary, name.replaceAll('/', path.sep));
  mkdirSync(path.dirname(target), {recursive: true});
  const sourceDb = new DatabaseSync(source, {readOnly: true});
  try {
    const integrity = sourceDb.prepare('PRAGMA integrity_check').all();
    if (integrity.length !== 1 || integrity[0].integrity_check !== 'ok') throw new Error('Database integrity failure: ' + name);
    if (sourceDb.prepare('PRAGMA foreign_key_check').all().length) throw new Error('Database has invalid relationships: ' + name);
    sourceDb.prepare('VACUUM INTO ?').run(target);
  } finally { sourceDb.close(); }
  return target;
}

function copyExtras(directory, prefix, skipBusiness = true) {
  if (!existsSync(directory)) return;
  const entries = readdirSync(directory, {withFileTypes: true}).sort((a, b) => a.name.localeCompare(b.name));
  for (const entry of entries) {
    if (entry.name === '.' || entry.name === '..' || /[\\/\x00-\x1f]/.test(entry.name)) throw new Error('Unsafe source filename.');
    const full = path.join(directory, entry.name), name = prefix + '/' + entry.name;
    if (entry.isSymbolicLink() || lstatSync(full).isSymbolicLink()) throw new Error('Symbolic links are not supported in migration: ' + name);
    if (entry.isDirectory()) copyExtras(full, name, false);
    else if (entry.isFile() && !/\.(?:sqlite|db)-(?:wal|shm)$/i.test(entry.name) && !(skipBusiness && entry.name === 'business.sqlite')) addFile(name, readFileSync(full));
  }
}

function zip(entries) {
  const local = [], central = []; let offset = 0;
  const date = new Date(), year = Math.max(1980, date.getFullYear()), dosDate = (year - 1980) << 9 | (date.getMonth() + 1) << 5 | date.getDate(), dosTime = date.getHours() << 11 | date.getMinutes() << 5 | Math.floor(date.getSeconds() / 2);
  for (const [name, data] of entries) {
    const nameBytes = Buffer.from(name), packed = deflateRawSync(data, {level: 6}), crc = crc32(data);
    const head = Buffer.alloc(30); head.writeUInt32LE(0x04034b50); head.writeUInt16LE(20, 4); head.writeUInt16LE(0x0800, 6); head.writeUInt16LE(8, 8); head.writeUInt16LE(dosTime, 10); head.writeUInt16LE(dosDate, 12); head.writeUInt32LE(crc, 14); head.writeUInt32LE(packed.length, 18); head.writeUInt32LE(data.length, 22); head.writeUInt16LE(nameBytes.length, 26);
    local.push(head, nameBytes, packed);
    const c = Buffer.alloc(46); c.writeUInt32LE(0x02014b50); c.writeUInt16LE(20, 4); c.writeUInt16LE(20, 6); c.writeUInt16LE(0x0800, 8); c.writeUInt16LE(8, 10); c.writeUInt16LE(dosTime, 12); c.writeUInt16LE(dosDate, 14); c.writeUInt32LE(crc, 16); c.writeUInt32LE(packed.length, 20); c.writeUInt32LE(data.length, 24); c.writeUInt16LE(nameBytes.length, 28); c.writeUInt32LE(offset, 42); central.push(c, nameBytes);
    offset += head.length + nameBytes.length + packed.length;
  }
  const directory = Buffer.concat(central), end = Buffer.alloc(22); end.writeUInt32LE(0x06054b50); end.writeUInt16LE(entries.length, 8); end.writeUInt16LE(entries.length, 10); end.writeUInt32LE(directory.length, 12); end.writeUInt32LE(offset, 16);
  return Buffer.concat([...local, directory, end]);
}

try {
  const registryPath = snapshotDatabase(path.join(dataRoot, 'access.sqlite'), 'access.sqlite');
  const registry = new DatabaseSync(registryPath);
  let companies;
  try {
    companies = registry.prepare('SELECT id,name,data_path,backup_dir,enabled FROM companies ORDER BY id').all();
    if (!companies.length) throw new Error('Create the first company before exporting.');
    for (const company of companies) {
      if (!safeCompanyId(company.id)) throw new Error('Unsupported company identity in registry.');
      const prefix = 'companies/' + company.id, businessPath = path.resolve(company.data_path);
      if (!existsSync(businessPath)) throw new Error('Company database is missing: ' + company.name);
      const businessCopy = snapshotDatabase(businessPath, prefix + '/business.sqlite');
      const business = new DatabaseSync(businessCopy, {readOnly: true});
      try { const info = business.prepare('SELECT name FROM sqlite_master WHERE type=?').all('table').map(row => row.name); for (const table of ['companies', 'customers', 'products', 'invoices', 'quotations', 'expenses', 'payments']) if (!info.includes(table)) throw new Error('Incompatible business database: missing ' + table); }
      finally { business.close(); }
      addFile(prefix + '/business.sqlite', readFileSync(businessCopy));
      copyExtras(path.dirname(businessPath), prefix);
      if (company.backup_dir && path.resolve(company.backup_dir) !== path.join(path.dirname(businessPath), 'backups')) copyExtras(path.resolve(company.backup_dir), prefix + '/backups', false);
      registry.prepare('UPDATE companies SET data_path=?,backup_dir=? WHERE id=?').run(prefix + '/business.sqlite', prefix + '/backups', company.id);
    }
    // Imported environments must require login; portable files carry no sessions.
    registry.exec('DELETE FROM sessions; PRAGMA wal_checkpoint(TRUNCATE);');
  } finally { registry.close(); }
  addFile('access.sqlite', readFileSync(registryPath));
  const version = JSON.parse(readFileSync(path.join(root, 'package.json'), 'utf8')).version;
  const manifest = {format: FORMAT, schemaVersion: 1, appVersion: version, createdAt: new Date().toISOString(), registry: 'access.sqlite', companies: companies.map(({id, name, enabled}) => ({id, name, enabled: !!enabled})), files: [...files].map(([name, bytes]) => ({path: name, size: bytes.length, sha256: sha(bytes)})), totalBytes: byteTotal};
  const archive = zip([['manifest.json', Buffer.from(JSON.stringify(manifest, null, 2))], ...files]);
  mkdirSync(path.dirname(output), {recursive: true});
  writeFileSync(output, archive, {flag: 'wx'});
  console.log(JSON.stringify({success: true, output, companies: companies.map(({id, name}) => ({id, name})), bytes: archive.length, format: FORMAT}, null, 2));
} finally {
  // This is an explicitly created system-temp directory, never the workspace or dataRoot.
  const resolvedTemp = path.resolve(temporary), systemTemp = path.resolve(os.tmpdir());
  if (resolvedTemp.startsWith(systemTemp + path.sep) && path.basename(resolvedTemp).startsWith('invoicey-android-transfer-')) rmSync(resolvedTemp, {recursive: true, force: true});
}

