import { validateWorkspace, MAX_WORKSPACE_BYTES } from './workspace.js';

const plainTextKeys = ['fable-language', 'fable-default-edition'];
const HEADER = ['fable_backup_version', 'section', 'data_json'];
const quote = value => `"${String(value).replaceAll('"', '""')}"`;
export function serializeBackup(workspace, format = 'json') {
  const validated = validateWorkspace(workspace);
  if (format === 'json') return JSON.stringify({ format: 'fable-backup', version: 1, sections: Object.fromEntries(Object.entries(validated.data).map(([key, raw]) => [key, plainTextKeys.includes(key) ? raw : JSON.parse(raw)])) }, null, 2);
  if (format !== 'csv') throw new Error('Formato di backup non supportato.');
  // Keep the original JSON in cells: nested rules, inventories and multiline notes survive.
  return '\uFEFF' + [HEADER, ...Object.entries(validated.data).map(([key, raw]) => ['1', key, raw])].map(row => row.map(quote).join(',')).join('\r\n') + '\r\n';
}
function parseCsv(text) {
  const rows = []; let row = [], cell = '', quoted = false, closed = false;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (quoted) {
      if (ch === '"' && text[i + 1] === '"') { cell += '"'; i++; }
      else if (ch === '"') { quoted = false; closed = true; }
      else cell += ch;
    } else if (ch === '"') {
      if (cell || closed) throw new Error('Virgolette non valide nel CSV.');
      quoted = true;
    } else if (ch === ',') { row.push(cell); cell = ''; closed = false; }
    else if (ch === '\r' || ch === '\n') {
      if (ch === '\r' && text[i + 1] === '\n') i++;
      row.push(cell); rows.push(row); row = []; cell = ''; closed = false;
    } else {
      if (closed) throw new Error('Separatore non valido nel CSV.');
      cell += ch;
    }
    if (row.length > 3 || rows.length > 20) throw new Error('CSV di backup non valido.');
  }
  if (quoted) throw new Error('Virgolette non chiuse nel CSV.');
  if (cell || row.length || closed) { row.push(cell); rows.push(row); }
  return rows;
}
export function parseBackup(text) {
  if (typeof text !== 'string' || new TextEncoder().encode(text).length > MAX_WORKSPACE_BYTES * 2) throw new Error('File troppo grande. Limite 10 MB.');
  text = text.replace(/^\uFEFF/, '');
  if (text.trimStart().startsWith('{')) {
    const value = JSON.parse(text);
    if (value?.format !== 'fable-backup') return validateWorkspace(value);
    if (value.version !== 1 || !value.sections || typeof value.sections !== 'object' || Array.isArray(value.sections)) throw new Error('Versione o sezioni del backup non valide.');
    return validateWorkspace({ schemaVersion: 1, data: Object.fromEntries(Object.entries(value.sections).map(([key, section]) => [key, plainTextKeys.includes(key) ? section : JSON.stringify(section)])) });
  }
  const [header, ...rows] = parseCsv(text);
  if (!header || header.length !== 3 || header.some((value, i) => value !== HEADER[i])) throw new Error('Usa un CSV completo esportato da Fable.');
  const data = {};
  for (const row of rows) {
    if (row.length !== 3 || row[0] !== '1' || Object.hasOwn(data, row[1])) throw new Error('Versione, sezione o riga CSV non valida.');
    Object.defineProperty(data, row[1], { value: row[2], enumerable: true });
  }
  return validateWorkspace({ schemaVersion: 1, data });
}
export function backupSummary(workspace) {
  const { data } = validateWorkspace(workspace);
  const archived = data['fable-character-library'] ? JSON.parse(data['fable-character-library']) : [];
  const active = data['fable-character'] ? JSON.parse(data['fable-character']) : null;
  const characters = new Set(archived.map(c => c.id || c.name));
  if (active) characters.add(active.id || active.name);
  const dm = data['fable-dm'] ? JSON.parse(data['fable-dm']) : null;
  return { characters: characters.size, campaign: data['fable-campaign'] ? JSON.parse(data['fable-campaign']).name : null, encounters: dm ? 1 + (dm.encounterArchive?.length || 0) : 0, hasDm: !!dm };
}
