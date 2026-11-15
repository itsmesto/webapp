import { createHash, randomUUID } from 'node:crypto';
import { deflateRawSync, inflateRawSync } from 'node:zlib';

const MAX_XLSX_BYTES = 128 * 1024 * 1024;
const MAX_UNPACKED_BYTES = 384 * 1024 * 1024;
const MAX_SHEET_ROWS = 1_048_576;
const CELL_TEXT_LIMIT = 30_000;
const ASSET_CHUNK_SIZE = 20_000;
const FORMAT_ID = 'itsme-invoicey-sqlite-xlsx-v1';

export const BACKUP_TABLES = [
  'settings','app_metadata','sequences','companies','customers','suppliers','products','company_properties','services','projects',
  'invoices','invoice_items','payments','quotations','quotation_items','purchases','purchase_items',
  'supplier_payments','expenses','expense_categories','expense_attachments','stock_movements','partners','profit_shares'
];

const crcTable = (() => {
  const table = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let value = n;
    for (let k = 0; k < 8; k++) value = value & 1 ? (0xedb88320 ^ (value >>> 1)) : value >>> 1;
    table[n] = value >>> 0;
  }
  return table;
})();

function crc32(bytes) {
  let crc = 0xffffffff;
  for (const byte of bytes) crc = crcTable[(crc ^ byte) & 0xff] ^ (crc >>> 8);
  return (crc ^ 0xffffffff) >>> 0;
}

function xmlEscape(value) {
  return String(value).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&apos;').replace(/\r/g,'&#13;');
}

function xmlUnescape(value) {
  return String(value).replace(/&#x([0-9a-f]+);/gi,(_,hex)=>String.fromCodePoint(parseInt(hex,16)))
    .replace(/&#([0-9]+);/g,(_,number)=>String.fromCodePoint(Number(number)))
    .replace(/&lt;/g,'<').replace(/&gt;/g,'>').replace(/&quot;/g,'"').replace(/&apos;/g,"'").replace(/&amp;/g,'&');
}

function colName(index) {
  let result = '';
  while (index > 0) {
    const remainder = (index - 1) % 26;
    result = String.fromCharCode(65 + remainder) + result;
    index = Math.floor((index - 1) / 26);
  }
  return result;
}

function attr(source, name) {
  const match = String(source).match(new RegExp('(?:^|\\s)' + name + '=\"([^\"]*)\"'));
  return match ? xmlUnescape(match[1]) : '';
}

function canonicalValue(value) {
  if (value === null || value === undefined) return ['null',''];
  if (Buffer.isBuffer(value) || value instanceof Uint8Array) return ['binary',Buffer.from(value).toString('base64')];
  if (typeof value === 'number') {
    if (!Number.isFinite(value)) throw new Error('The database contains a non-finite number and cannot be backed up.');
    return ['number',value];
  }
  if (typeof value === 'bigint') return ['number',Number(value)];
  if (typeof value === 'boolean') return ['boolean',value];
  return ['text',String(value)];
}

function schemaHash(schema) {
  const description = schema.map(table => table.name + ':' + table.columns.map(column => column.name + ':' + column.type).join(',')).join('|');
  return createHash('sha256').update(description).digest('hex');
}

function dataHash(tables, schema) {
  const serial = schema.map(table => [
    table.name,
    (tables[table.name] || []).map(row => table.columns.map(column => canonicalValue(row[column.name])))
  ]);
  return createHash('sha256').update(JSON.stringify(serial)).digest('hex');
}

function workbookCell(address, value, nullMarker, assetPrefix, assets) {
  let current = value;
  if (current === null || current === undefined) current = nullMarker;
  else if (Buffer.isBuffer(current) || current instanceof Uint8Array) {
    current = addAsset(Buffer.from(current).toString('base64'),'base64',assetPrefix,assets);
  } else if (typeof current === 'number' || typeof current === 'bigint') {
    const number = Number(current);
    if (!Number.isFinite(number)) throw new Error('The database contains an invalid number.');
    return '<c r=\"' + address + '\"><v>' + String(number) + '</v></c>';
  } else if (typeof current === 'boolean') {
    return '<c r=\"' + address + '\" t=\"b\"><v>' + (current ? '1' : '0') + '</v></c>';
  } else {
    current = String(current);
    if (current.length > CELL_TEXT_LIMIT || /[\u0000-\u0008\u000b\u000c\u000e-\u001f\ufffe\uffff]/.test(current) || current === nullMarker) {
      current = addAsset(current,'utf8-base64',assetPrefix,assets);
    }
  }
  return '<c r=\"' + address + '\" t=\"inlineStr\"><is><t xml:space=\"preserve\">' + xmlEscape(current) + '</t></is></c>';
}

function addAsset(text, encoding, prefix, assets) {
  const token = prefix + randomUUID() + '__';
  const encoded = encoding === 'base64' ? text : Buffer.from(text,'utf8').toString('base64');
  for (let offset = 0, part = 1; offset < encoded.length; offset += ASSET_CHUNK_SIZE, part++) {
    assets.push([token,part,encoding,encoded.slice(offset,offset + ASSET_CHUNK_SIZE)]);
  }
  if (!encoded.length) assets.push([token,1,encoding,'']);
  return token;
}

function sheetXml(headers, rows, nullMarker, assetPrefix, assets) {
  if (rows.length + 1 > MAX_SHEET_ROWS) throw new Error('This data set is too large for an Excel worksheet.');
  const allRows = [headers,...rows];
  const lastCol = colName(Math.max(headers.length,1));
  const xmlRows = allRows.map((row,rowIndex) => {
    const cells = row.map((value,columnIndex) => workbookCell(colName(columnIndex + 1) + (rowIndex + 1),value,nullMarker,assetPrefix,assets)).join('');
    return '<row r=\"' + (rowIndex + 1) + '\">' + cells + '</row>';
  }).join('');
  return '<?xml version=\"1.0\" encoding=\"UTF-8\" standalone=\"yes\"?>' +
    '<worksheet xmlns=\"http://schemas.openxmlformats.org/spreadsheetml/2006/main\"><dimension ref=\"A1:' + lastCol + Math.max(allRows.length,1) + '\"/><sheetViews><sheetView workbookViewId=\"0\"/></sheetViews><sheetFormatPr defaultRowHeight=\"15\"/><sheetData>' +
    xmlRows + '</sheetData><pageMargins left=\"0.35\" right=\"0.35\" top=\"0.5\" bottom=\"0.5\" header=\"0.2\" footer=\"0.2\"/></worksheet>';
}

function dosDateTime(date = new Date()) {
  const year = Math.max(1980,date.getFullYear());
  return { date: ((year - 1980) << 9) | ((date.getMonth() + 1) << 5) | date.getDate(), time: (date.getHours() << 11) | (date.getMinutes() << 5) | Math.floor(date.getSeconds() / 2) };
}

function zipCreate(entries) {
  if (entries.length > 0xffff) throw new Error('The workbook contains too many files.');
  const localParts = [];
  const directoryParts = [];
  let offset = 0;
  let expanded = 0;
  const stamp = dosDateTime();
  for (const [name,dataValue] of entries) {
    const nameBytes = Buffer.from(name,'utf8');
    const data = Buffer.isBuffer(dataValue) ? dataValue : Buffer.from(dataValue,'utf8');
    expanded += data.length;
    if (expanded > MAX_UNPACKED_BYTES) throw new Error('The Excel backup content exceeds the 384 MB uncompressed file limit.');
    const compressed = deflateRawSync(data,{level:6});
    const checksum = crc32(data);
    const local = Buffer.alloc(30);
    local.writeUInt32LE(0x04034b50,0); local.writeUInt16LE(20,4); local.writeUInt16LE(0x0800,6);
    local.writeUInt16LE(8,8); local.writeUInt16LE(stamp.time,10); local.writeUInt16LE(stamp.date,12);
    local.writeUInt32LE(checksum,14); local.writeUInt32LE(compressed.length,18); local.writeUInt32LE(data.length,22);
    local.writeUInt16LE(nameBytes.length,26); local.writeUInt16LE(0,28);
    localParts.push(local,nameBytes,compressed);
    const central = Buffer.alloc(46);
    central.writeUInt32LE(0x02014b50,0); central.writeUInt16LE(20,4); central.writeUInt16LE(20,6);
    central.writeUInt16LE(0x0800,8); central.writeUInt16LE(8,10); central.writeUInt16LE(stamp.time,12);
    central.writeUInt16LE(stamp.date,14); central.writeUInt32LE(checksum,16);
    central.writeUInt32LE(compressed.length,20); central.writeUInt32LE(data.length,24);
    central.writeUInt16LE(nameBytes.length,28); central.writeUInt16LE(0,30); central.writeUInt16LE(0,32);
    central.writeUInt16LE(0,34); central.writeUInt16LE(0,36); central.writeUInt32LE(0,38); central.writeUInt32LE(offset,42);
    directoryParts.push(central,nameBytes);
    offset += local.length + nameBytes.length + compressed.length;
  }
  const directory = Buffer.concat(directoryParts);
  const end = Buffer.alloc(22);
  end.writeUInt32LE(0x06054b50,0); end.writeUInt16LE(0,4); end.writeUInt16LE(0,6);
  end.writeUInt16LE(entries.length,8); end.writeUInt16LE(entries.length,10);
  end.writeUInt32LE(directory.length,12); end.writeUInt32LE(offset,16); end.writeUInt16LE(0,20);
  const result = Buffer.concat([...localParts,directory,end]);
  if (result.length > MAX_XLSX_BYTES) throw new Error('The Excel backup would exceed the 128 MB file limit.');
  return result;
}

export function createBackupWorkbook(tables, schema, backupInfo = '1.0.0') {
  const options=typeof backupInfo==='string'?{appVersion:backupInfo}:{...(backupInfo||{})};
  const appVersion=String(options.appVersion||'2.0.0');
  const tableNames = schema.map(table => table.name);
  for (const name of tableNames) if (!Array.isArray(tables[name])) throw new Error('Missing database table for Excel backup: ' + name);
  const nullMarker = '__ITS_INVOICEY_NULL_' + randomUUID() + '__';
  const assetPrefix = '__ITS_INVOICEY_DATA_' + randomUUID() + '_';
  const assets = [];
  const entries = [];
  const manifest = [
    ['format',FORMAT_ID],
    ['application','itsme invoicey'],
    ['companyId',String(options.companyId||'')],
    ['companyName',String(options.companyName||'')],
    ['version',String(appVersion)],
    ['createdAt',new Date().toISOString()],
    ['schemaHash',schemaHash(schema)],
    ['dataHash',dataHash(tables,schema)],
    ['nullMarker',nullMarker],
    ['assetPrefix',assetPrefix]
  ];
  const sheets = [{name:'Backup Manifest',headers:['Setting','Value'],rows:manifest}];
  for (const table of schema) sheets.push({name:table.name,headers:table.columns.map(column=>column.name),rows:tables[table.name].map(row=>table.columns.map(column=>row[column.name]))});
  sheets.push({name:'Backup Content',headers:['Token','Part','Encoding','Data'],rows:assets});

  const sheetFiles = [];
  for (let index = 0; index < sheets.length; index++) {
    const sheet = sheets[index];
    sheetFiles.push({name:sheet.name,path:'xl/worksheets/sheet' + (index + 1) + '.xml',xml:sheetXml(sheet.headers,sheet.rows,sheet.name==='Backup Manifest'?null:nullMarker,assetPrefix,assets)});
  }
  const contentSheet = sheetFiles.find(sheet=>sheet.name==='Backup Content');
  contentSheet.xml = sheetXml(['Token','Part','Encoding','Data'],assets,nullMarker,assetPrefix,[]);

  const relationships = sheetFiles.map((sheet,index)=>'<Relationship Id=\"rId' + (index + 1) + '\" Type=\"http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet\" Target=\"worksheets/sheet' + (index + 1) + '.xml\"/>').join('') +
    '<Relationship Id=\"rId' + (sheetFiles.length + 1) + '\" Type=\"http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles\" Target=\"styles.xml\"/>';
  const workbookSheets = sheetFiles.map((sheet,index)=>'<sheet name=\"' + xmlEscape(sheet.name) + '\" sheetId=\"' + (index + 1) + '\" r:id=\"rId' + (index + 1) + '\"/>').join('');
  const contentTypes = '<Types xmlns=\"http://schemas.openxmlformats.org/package/2006/content-types\"><Default Extension=\"rels\" ContentType=\"application/vnd.openxmlformats-package.relationships+xml\"/><Default Extension=\"xml\" ContentType=\"application/xml\"/><Override PartName=\"/xl/workbook.xml\" ContentType=\"application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml\"/><Override PartName=\"/xl/styles.xml\" ContentType=\"application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml\"/>' +
    sheetFiles.map(sheet=>'<Override PartName=\"/' + sheet.path + '\" ContentType=\"application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml\"/>').join('') + '<Override PartName=\"/docProps/core.xml\" ContentType=\"application/vnd.openxmlformats-package.core-properties+xml\"/><Override PartName=\"/docProps/app.xml\" ContentType=\"application/vnd.openxmlformats-officedocument.extended-properties+xml\"/></Types>';
  entries.push(['[Content_Types].xml',contentTypes]);
  entries.push(['_rels/.rels','<?xml version=\"1.0\" encoding=\"UTF-8\"?><Relationships xmlns=\"http://schemas.openxmlformats.org/package/2006/relationships\"><Relationship Id=\"rId1\" Type=\"http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument\" Target=\"xl/workbook.xml\"/><Relationship Id=\"rId2\" Type=\"http://schemas.openxmlformats.org/package/2006/relationships/metadata/core-properties\" Target=\"docProps/core.xml\"/><Relationship Id=\"rId3\" Type=\"http://schemas.openxmlformats.org/officeDocument/2006/relationships/extended-properties\" Target=\"docProps/app.xml\"/></Relationships>']);
  entries.push(['xl/workbook.xml','<?xml version=\"1.0\" encoding=\"UTF-8\"?><workbook xmlns=\"http://schemas.openxmlformats.org/spreadsheetml/2006/main\" xmlns:r=\"http://schemas.openxmlformats.org/officeDocument/2006/relationships\"><bookViews><workbookView activeTab=\"0\"/></bookViews><sheets>' + workbookSheets + '</sheets><calcPr calcId=\"191029\"/></workbook>']);
  entries.push(['xl/_rels/workbook.xml.rels','<?xml version=\"1.0\" encoding=\"UTF-8\"?><Relationships xmlns=\"http://schemas.openxmlformats.org/package/2006/relationships\">' + relationships + '</Relationships>']);
  entries.push(['xl/styles.xml','<?xml version=\"1.0\" encoding=\"UTF-8\"?><styleSheet xmlns=\"http://schemas.openxmlformats.org/spreadsheetml/2006/main\"><fonts count=\"1\"><font><sz val=\"11\"/><name val=\"Calibri\"/></font></fonts><fills count=\"2\"><fill><patternFill patternType=\"none\"/></fill><fill><patternFill patternType=\"gray125\"/></fill></fills><borders count=\"1\"><border><left/><right/><top/><bottom/><diagonal/></border></borders><cellStyleXfs count=\"1\"><xf numFmtId=\"0\" fontId=\"0\" fillId=\"0\" borderId=\"0\"/></cellStyleXfs><cellXfs count=\"1\"><xf numFmtId=\"0\" fontId=\"0\" fillId=\"0\" borderId=\"0\" xfId=\"0\"/></cellXfs><cellStyles count=\"1\"><cellStyle name=\"Normal\" xfId=\"0\" builtinId=\"0\"/></cellStyles></styleSheet>']);
  entries.push(['docProps/core.xml','<?xml version=\"1.0\" encoding=\"UTF-8\"?><cp:coreProperties xmlns:cp=\"http://schemas.openxmlformats.org/package/2006/metadata/core-properties\" xmlns:dc=\"http://purl.org/dc/elements/1.1/\"><dc:creator>itsme invoicey</dc:creator><dc:title>Business data backup</dc:title></cp:coreProperties>']);
  entries.push(['docProps/app.xml','<?xml version=\"1.0\" encoding=\"UTF-8\"?><Properties xmlns=\"http://schemas.openxmlformats.org/officeDocument/2006/extended-properties\"><Application>itsme invoicey</Application></Properties>']);
  entries.push(...sheetFiles.map(sheet=>[sheet.path,sheet.xml]));
  return zipCreate(entries);
}

function zipRead(buffer) {
  if (!Buffer.isBuffer(buffer)) buffer = Buffer.from(buffer || []);
  if (buffer.length < 22 || buffer.length > MAX_XLSX_BYTES) throw new Error('Choose a valid Excel backup file smaller than 128 MB.');
  const earliest = Math.max(0,buffer.length - 65_557);
  let endOffset = -1;
  for (let offset=buffer.length-22; offset>=earliest; offset--) {
    if (buffer.readUInt32LE(offset)===0x06054b50) { endOffset=offset; break; }
  }
  if (endOffset<0) throw new Error('This is not a complete Excel workbook.');
  const count = buffer.readUInt16LE(endOffset+10);
  const directorySize = buffer.readUInt32LE(endOffset+12);
  let cursor = buffer.readUInt32LE(endOffset+16);
  if (count===0xffff || directorySize===0xffffffff || cursor===0xffffffff || cursor+directorySize>endOffset) throw new Error('Excel ZIP64 backups are not supported by this version.');
  const files = new Map();
  let expanded = 0;
  for (let index=0; index<count; index++) {
    if (cursor+46>buffer.length || buffer.readUInt32LE(cursor)!==0x02014b50) throw new Error('The Excel backup contains a damaged ZIP directory.');
    const flags=buffer.readUInt16LE(cursor+8), method=buffer.readUInt16LE(cursor+10);
    const expectedCrc=buffer.readUInt32LE(cursor+16), compressedSize=buffer.readUInt32LE(cursor+20), size=buffer.readUInt32LE(cursor+24);
    const nameSize=buffer.readUInt16LE(cursor+28), extraSize=buffer.readUInt16LE(cursor+30), commentSize=buffer.readUInt16LE(cursor+32);
    const localOffset=buffer.readUInt32LE(cursor+42);
    const name=buffer.subarray(cursor+46,cursor+46+nameSize).toString('utf8');
    cursor += 46+nameSize+extraSize+commentSize;
    if (!name || name.includes('..') || name.startsWith('/') || name.includes('\\') || files.has(name)) throw new Error('The Excel backup contains an unsafe or duplicate file path.');
    if (flags&1 || (method!==0 && method!==8) || size>MAX_UNPACKED_BYTES) throw new Error('The Excel backup uses an unsupported or encrypted ZIP entry.');
    if (localOffset+30>buffer.length || buffer.readUInt32LE(localOffset)!==0x04034b50) throw new Error('The Excel backup contains a damaged file entry.');
    const localNameSize=buffer.readUInt16LE(localOffset+26), localExtraSize=buffer.readUInt16LE(localOffset+28);
    const dataOffset=localOffset+30+localNameSize+localExtraSize;
    if (dataOffset+compressedSize>buffer.length) throw new Error('The Excel backup has a truncated file entry.');
    expanded += size;
    if (expanded>MAX_UNPACKED_BYTES) throw new Error('The Excel backup expands beyond the safe import size.');
    const compressed=buffer.subarray(dataOffset,dataOffset+compressedSize);
    let data;
    try { data=method===0?Buffer.from(compressed):inflateRawSync(compressed,{maxOutputLength:MAX_UNPACKED_BYTES}); }
    catch { throw new Error('The Excel backup contains a corrupt compressed file.'); }
    if (data.length!==size || crc32(data)!==expectedCrc) throw new Error('The Excel backup failed its integrity check.');
    files.set(name,data.toString('utf8'));
  }
  return files;
}

function readTextElement(source, tag) {
  const match=String(source).match(new RegExp('<'+tag+'\\b[^>]*>([\\s\\S]*?)</'+tag+'>','i'));
  return match ? xmlUnescape(match[1]) : '';
}

function columnIndex(reference) {
  const letters=String(reference).match(/^[A-Z]+/i)?.[0]?.toUpperCase();
  if (!letters) throw new Error('The Excel backup contains a cell without a valid address.');
  let result=0;
  for (const letter of letters) result=result*26+letter.charCodeAt(0)-64;
  if (!Number.isSafeInteger(result)||result<1||result>16_384) throw new Error('The Excel backup contains a cell outside the worksheet limits.');
  return result-1;
}

function parseSheet(xml, sharedStrings) {
  if (/<f\b/i.test(xml)) throw new Error('Backup sheets must not contain formulas. Download a fresh backup and try again.');
  const rows=[];
  const rowMatcher=/<row\b[^>]*>([\s\S]*?)<\/row>/gi;
  let rowMatch;
  while ((rowMatch=rowMatcher.exec(xml))) {
    const row=[];
    const cellMatcher=/<c\b([^>]*?)(?:\/>|>([\s\S]*?)<\/c>)/gi;
    let cellMatch;
    while ((cellMatch=cellMatcher.exec(rowMatch[1]))) {
      const address=attr(cellMatch[1],'r');
      const type=attr(cellMatch[1],'t');
      const body=cellMatch[2]||'';
      let value=null;
      if (type==='inlineStr') {
        value=[...body.matchAll(/<t\b[^>]*>([\s\S]*?)<\/t>/gi)].map(item=>xmlUnescape(item[1])).join('');
      } else {
        const raw=readTextElement(body,'v');
        if (type==='s') {
          const index=Number(raw);
          if (!Number.isInteger(index)||index<0||index>=sharedStrings.length) throw new Error('The Excel backup has an invalid shared string.');
          value=sharedStrings[index];
        } else if (type==='b') value=raw==='1';
        else if (type==='e') throw new Error('The Excel backup contains an Excel error cell.');
        else if (raw!=='') {
          if (type==='n'||type==='') {
            const number=Number(raw);
            if (!Number.isFinite(number)) throw new Error('The Excel backup contains an invalid numeric value.');
            value=number;
          } else value=xmlUnescape(raw);
        } else value='';
      }
      const index=columnIndex(address);
      if (Object.hasOwn(row,index)) throw new Error('The Excel backup contains duplicate cells.');
      row[index]=value;
    }
    rows.push(row);
    if (rows.length>MAX_SHEET_ROWS) throw new Error('The Excel backup contains too many worksheet rows.');
  }
  return rows;
}

function workbookContents(files) {
  const workbook=files.get('xl/workbook.xml');
  const relations=files.get('xl/_rels/workbook.xml.rels');
  if (!workbook||!relations||!files.has('[Content_Types].xml')||!files.has('_rels/.rels')) throw new Error('This file is not a complete .xlsx workbook.');
  const relationMap=new Map();
  for (const match of relations.matchAll(/<Relationship\b([^>]*?)\/?>(?:[\s\S]*?<\/Relationship>)?/gi)) {
    const id=attr(match[1],'Id'),target=attr(match[1],'Target'),type=attr(match[1],'Type');
    if (id && target && type?.endsWith('/worksheet')) relationMap.set(id,target);
  }
  const sharedStrings=files.has('xl/sharedStrings.xml')
    ? [...files.get('xl/sharedStrings.xml').matchAll(/<si\b[^>]*>([\s\S]*?)<\/si>/gi)].map(match=>[...match[1].matchAll(/<t\b[^>]*>([\s\S]*?)<\/t>/gi)].map(item=>xmlUnescape(item[1])).join(''))
    : [];
  const sheets=new Map();
  for (const match of workbook.matchAll(/<sheet\b([^>]*?)\/?>(?:[\s\S]*?<\/sheet>)?/gi)) {
    const name=attr(match[1],'name'),relationshipId=attr(match[1],'r:id')||attr(match[1],'id'),target=relationMap.get(relationshipId);
    if (!name||!target||sheets.has(name)) throw new Error('The Excel backup contains a missing or duplicate worksheet.');
    const clean=target.replaceAll('\\','/');
    const filePath=clean.startsWith('/')?clean.slice(1):'xl/'+clean.replace(/^\.\//,'');
    const xml=files.get(filePath);
    if (!xml) throw new Error('The Excel backup is missing worksheet ' + name + '.');
    sheets.set(name,parseSheet(xml,sharedStrings));
  }
  return sheets;
}

export function parseBackupWorkbook(input, schema, expectations = {}) {
  const files=zipRead(input);
  const sheets=workbookContents(files);
  const manifestRows=sheets.get('Backup Manifest');
  if (!manifestRows||!sheets.has('Backup Content')) throw new Error('Choose a backup file created by itsme invoicey.');
  const manifest=Object.fromEntries(manifestRows.slice(1).filter(row=>row?.[0]!==undefined).map(row=>[String(row[0]),row[1]===undefined?'':String(row[1])]));
  if (manifest.format!==FORMAT_ID||manifest.application!=='itsme invoicey') throw new Error('This is not a supported itsme invoicey backup.');
  if (manifest.schemaHash!==schemaHash(schema)) throw new Error('This backup uses a different or incompatible database version.');
  if(expectations.companyId){
    if(!manifest.companyId||manifest.companyId!==String(expectations.companyId))throw new Error('This Excel backup belongs to a different company. No records were restored.');
    if(!manifest.companyName)throw new Error('This Excel backup is missing its company name.');
    const expectedMajor=String(expectations.appVersion||'2.0.0').split('.')[0],backupMajor=String(manifest.version||'').split('.')[0];
    if(!/^\d+$/.test(backupMajor)||backupMajor!==expectedMajor)throw new Error('This Excel backup was created by an incompatible software version.');
  }
  if (!/^[a-f0-9]{64}$/i.test(manifest.dataHash||'')) throw new Error('The Excel backup is missing its integrity signature.');
  if (!/^__ITS_INVOICEY_NULL_[a-f0-9-]+__$/i.test(manifest.nullMarker||'')||!/^__ITS_INVOICEY_DATA_[a-f0-9-]+_$/i.test(manifest.assetPrefix||'')) throw new Error('The Excel backup has invalid content markers.');

  const expectedNames=new Set(['Backup Manifest','Backup Content',...schema.map(table=>table.name)]);
  if (sheets.size!==expectedNames.size||[...sheets.keys()].some(name=>!expectedNames.has(name))) throw new Error('The Excel backup has missing or unexpected worksheets.');
  const assets=new Map();
  const contentRows=sheets.get('Backup Content');
  if (!contentRows?.[0]||contentRows[0].slice(0,4).join('|')!=='Token|Part|Encoding|Data') throw new Error('The backup content worksheet has an invalid format.');
  for (const row of contentRows.slice(1)) {
    if (!row||row[0]===undefined) continue;
    const token=String(row[0]),part=Number(row[1]),encoding=String(row[2]),data=String(row[3]??'');
    if (!token.startsWith(manifest.assetPrefix)||!Number.isInteger(part)||part<1||!['base64','utf8-base64'].includes(encoding)) throw new Error('The backup content worksheet contains invalid data.');
    if (!assets.has(token)) assets.set(token,{encoding,parts:new Map()});
    const asset=assets.get(token);
    if (asset.encoding!==encoding||asset.parts.has(part)||data.length>ASSET_CHUNK_SIZE) throw new Error('The backup content worksheet contains duplicate or inconsistent data.');
    asset.parts.set(part,data);
  }
  for (const asset of assets.values()) {
    const sorted=[...asset.parts.keys()].sort((a,b)=>a-b);
    if (!sorted.length||sorted.some((number,index)=>number!==index+1)) throw new Error('The backup content worksheet is incomplete.');
  }
  const restoreAssets=new Map();
  for (const [token,asset] of assets) {
    const encoded=[...asset.parts].sort((a,b)=>a[0]-b[0]).map(([,part])=>part).join('');
    if (!/^(?:[A-Za-z0-9+/]*={0,2})$/.test(encoded)) throw new Error('The backup contains invalid encoded image or attachment data.');
    const bytes=Buffer.from(encoded,'base64');
    if (bytes.toString('base64')!==encoded) throw new Error('The backup contains damaged image or attachment data.');
    restoreAssets.set(token,asset.encoding==='base64'?bytes:bytes.toString('utf8'));
  }

  const tables={};
  for (const table of schema) {
    const rows=sheets.get(table.name);
    const expectedHeaders=table.columns.map(column=>column.name);
    if (!rows?.[0]||rows[0].length!==expectedHeaders.length||expectedHeaders.some((header,index)=>rows[0][index]!==header)) throw new Error('The worksheet for ' + table.name + ' does not match this application version.');
    tables[table.name]=[];
    for (const row of rows.slice(1)) {
      if (!row||row.every(value=>value===undefined||value===null||value==='')) continue;
      if (row.length>expectedHeaders.length) throw new Error('The worksheet for ' + table.name + ' contains unexpected data columns.');
      const record={};
      for (let index=0;index<expectedHeaders.length;index++) {
        let value=row[index]===undefined?'':row[index];
        if (value===manifest.nullMarker) value=null;
        else if (typeof value==='string'&&value.startsWith(manifest.assetPrefix)) {
          if (!restoreAssets.has(value)) throw new Error('The backup references missing image or attachment data.');
          value=restoreAssets.get(value);
        }
        const column=table.columns[index];
        if (value!==null&&(/INT|REAL|NUM|FLOA|DOUB/i.test(column.type))&&typeof value==='string'&&value.trim()!=='') {
          const number=Number(value);
          if (!Number.isFinite(number)) throw new Error('The ' + table.name + ' worksheet contains an invalid numeric value.');
          value=number;
        }
        record[column.name]=value;
      }
      tables[table.name].push(record);
    }
  }
  if (dataHash(tables,schema)!==manifest.dataHash) throw new Error('The backup data has changed or is damaged. No records were restored.');
  const companyRows=tables.companies||[];
  if (!companyRows.length||companyRows.filter(company=>Number(company.is_default)===1).length!==1) throw new Error('The backup must include exactly one company profile marked as the default.');
  if (tables.settings?.length!==1||Number(tables.settings[0].id)!==1) throw new Error('The backup does not contain a valid application settings record.');
  return {manifest,tables};
}

