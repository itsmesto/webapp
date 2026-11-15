import assert from 'node:assert/strict';
import { DatabaseSync } from 'node:sqlite';
import { createHash } from 'node:crypto';
import { inflateRawSync } from 'node:zlib';
import { readFileSync, writeFileSync, mkdtempSync, mkdirSync, rmSync } from 'node:fs';
import path from 'node:path';
import os from 'node:os';

const [archivePath, sourceDataRoot] = process.argv.slice(2);
assert(archivePath && sourceDataRoot, 'Usage: node android/qa/check-workspace-export.mjs migration.invoicey.zip source-data-dir');
const bytes = readFileSync(archivePath), entries = new Map();
let offset = 0;
while (offset + 4 <= bytes.length && bytes.readUInt32LE(offset) === 0x04034b50) {
  const flags = bytes.readUInt16LE(offset + 6), method = bytes.readUInt16LE(offset + 8), packedSize = bytes.readUInt32LE(offset + 18), size = bytes.readUInt32LE(offset + 22), nameLength = bytes.readUInt16LE(offset + 26), extraLength = bytes.readUInt16LE(offset + 28);
  assert.equal(flags & 8, 0, 'No data descriptor expected');
  const name = bytes.subarray(offset + 30, offset + 30 + nameLength).toString('utf8');
  assert(!entries.has(name), 'Duplicate ZIP entry');
  assert(!name.includes('..') && !name.includes('\\') && !name.startsWith('/'), 'Unsafe ZIP entry');
  const packed = bytes.subarray(offset + 30 + nameLength + extraLength, offset + 30 + nameLength + extraLength + packedSize);
  const value = method === 8 ? inflateRawSync(packed) : method === 0 ? packed : null;
  assert(value, 'Unsupported ZIP method'); assert.equal(value.length, size, 'ZIP entry size'); entries.set(name, value);
  offset += 30 + nameLength + extraLength + packedSize;
}
const manifest = JSON.parse(entries.get('manifest.json').toString('utf8'));
assert.equal(manifest.format, 'invoicey-workspace-v1');
assert.equal(manifest.registry, 'access.sqlite');
assert.equal(entries.size, manifest.files.length + 1);
for (const file of manifest.files) {
  const data = entries.get(file.path); assert(data, 'Every declared entry exists'); assert.equal(data.length, file.size); assert.equal(createHash('sha256').update(data).digest('hex'), file.sha256, 'Exact SHA256');
}
assert.equal(manifest.totalBytes, manifest.files.reduce((sum, item) => sum + item.size, 0));
const temporary = mkdtempSync(path.join(os.tmpdir(), 'invoicey-transfer-check-'));
const results = [];
const tableRows = (db, name) => db.prepare('SELECT * FROM "' + name.replaceAll('"', '""') + '"').all().map(row => JSON.stringify(row, (_, value) => typeof value === 'bigint' ? value.toString() : value)).sort();
try {
  for (const [name, data] of entries) {if (name === 'manifest.json') continue; const target = path.join(temporary, ...name.split('/')); mkdirSync(path.dirname(target), {recursive: true}); writeFileSync(target, data);}
  const registry = new DatabaseSync(path.join(temporary, 'access.sqlite'), {readOnly: true});
  const source = new DatabaseSync(path.join(sourceDataRoot, 'access.sqlite'), {readOnly: true});
  try {
    assert.equal(registry.prepare('PRAGMA integrity_check').get().integrity_check, 'ok'); assert.deepEqual(registry.prepare('PRAGMA foreign_key_check').all(), []);
    assert.equal(registry.prepare('SELECT count(*) n FROM sessions').get().n, 0);
    for (const table of ['users', 'memberships', 'audit']) assert.deepEqual(tableRows(registry, table), tableRows(source, table), 'Preserved registry ' + table);
    results.push('registry integrity, users/password hashes, memberships/permissions, audit and cleared sessions');
    const companies = registry.prepare('SELECT * FROM companies ORDER BY id').all();
    assert.deepEqual(companies.map(row => row.id), manifest.companies.map(row => row.id));
    for (const company of companies) {
      assert.equal(company.data_path, 'companies/' + company.id + '/business.sqlite'); assert.equal(company.backup_dir, 'companies/' + company.id + '/backups');
      const original = source.prepare('SELECT * FROM companies WHERE id=?').get(company.id);
      assert.deepEqual({...company, data_path: original.data_path, backup_dir: original.backup_dir}, {...original});
      const business = new DatabaseSync(path.join(temporary, ...company.data_path.split('/')), {readOnly: true}), sourceBusiness = new DatabaseSync(original.data_path, {readOnly: true});
      try {
        assert.equal(business.prepare('PRAGMA integrity_check').get().integrity_check, 'ok'); assert.deepEqual(business.prepare('PRAGMA foreign_key_check').all(), []);
        const tables = business.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' ORDER BY name").all();
        for (const {name} of tables) assert.deepEqual(tableRows(business, name), tableRows(sourceBusiness, name), 'Exact saved table ' + name);
      } finally {business.close(); sourceBusiness.close();}
      results.push('exact saved tables, integrity and portable paths: ' + company.name);
    }
  } finally {registry.close(); source.close();}
  console.log(JSON.stringify({passed: true, archive: path.resolve(archivePath), companyCount: manifest.companies.length, fileCount: manifest.files.length, uncompressedBytes: manifest.totalBytes, checks: ['ZIP entries, declared file sizes and SHA256 hashes', ...results]}, null, 2));
} finally {
  const target = path.resolve(temporary), systemTemp = path.resolve(os.tmpdir());
  if (target.startsWith(systemTemp + path.sep) && path.basename(target).startsWith('invoicey-transfer-check-')) rmSync(target, {recursive: true, force: true});
}

