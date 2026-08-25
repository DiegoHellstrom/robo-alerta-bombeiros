import crypto from 'node:crypto';

export function normalizeText(value) {
  return String(value ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

export function normalizeMunicipio(value) {
  return normalizeText(value).toUpperCase();
}

export function deterministicId(item) {
  const source = [item.data, item.horario, normalizeMunicipio(item.municipio), item.tipo,
    item.endereco, item.bairro, item.descricao, item.situacao]
    .map(normalizeText).join('|').toUpperCase();
  return crypto.createHash('sha256').update(source, 'utf8').digest('hex').slice(0, 32);
}

export function parseDateTime(item) {
  const raw = `${item.data || ''} ${item.horario || ''}`.trim();
  const match = raw.match(/(\d{1,2})[\/-](\d{1,2})[\/-](\d{4})(?:\s+(\d{1,2}):(\d{2})(?::(\d{2}))?)?/);
  if (!match) return 0;
  const [, day, month, year, hour = '0', minute = '0', second = '0'] = match;
  return Date.UTC(Number(year), Number(month) - 1, Number(day), Number(hour), Number(minute), Number(second));
}

export function normalizeOccurrence(raw) {
  const item = {
    id: '',
    data: normalizeText(raw.data),
    horario: normalizeText(raw.horario),
    municipio: normalizeMunicipio(raw.municipio),
    endereco: normalizeText(raw.endereco || raw.local),
    bairro: normalizeText(raw.bairro),
    tipo: normalizeText(raw.tipo || raw.natureza || raw.subnatureza),
    descricao: normalizeText(raw.descricao),
    situacao: normalizeText(raw.situacao),
    origem: normalizeText(raw.origem) || 'SYSBM/Corpo de Bombeiros do Paraná',
    link: /^https:\/\//i.test(String(raw.link || '')) ? String(raw.link).trim() : ''
  };
  item.id = normalizeText(raw.id) || deterministicId(item);
  return item;
}

export function filterAndSortCascavel(items) {
  return items.map(normalizeOccurrence)
    .filter(item => item.municipio === 'CASCAVEL')
    .sort((a, b) => parseDateTime(b) - parseDateTime(a) || b.id.localeCompare(a.id));
}
