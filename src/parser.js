import { normalizeText } from './normalize.js';

const FIELD_ALIASES = new Map([
  ['data', 'data'], ['data da ocorrencia', 'data'], ['data e hora', 'dataHora'],
  ['hora', 'horario'], ['horario', 'horario'],
  ['municipio', 'municipio'], ['cidade', 'municipio'],
  ['endereco', 'endereco'], ['local', 'endereco'], ['logradouro', 'endereco'],
  ['bairro', 'bairro'], ['natureza', 'tipo'], ['subnatureza', 'tipo'], ['tipo', 'tipo'],
  ['descricao', 'descricao'], ['observacao', 'descricao'], ['situacao', 'situacao'], ['status', 'situacao']
]);

function keyFor(label) {
  return FIELD_ALIASES.get(normalizeText(label).toLowerCase()) || '';
}

export function rowsToOccurrences(headers, rows, links = []) {
  const keys = headers.map(keyFor);
  if (!keys.includes('municipio')) throw new Error('A grade do SYSBM não contém uma coluna de município reconhecível.');
  return rows.map((cells, rowIndex) => {
    const item = {};
    cells.forEach((cell, index) => {
      const key = keys[index];
      if (!key) return;
      const value = normalizeText(cell);
      if (key === 'dataHora') {
        const match = value.match(/^(.*?)(?:\s+)(\d{1,2}:\d{2}(?::\d{2})?)$/);
        item.data = match ? match[1] : value;
        item.horario = match ? match[2] : '';
      } else if (!item[key] || key !== 'tipo') {
        item[key] = value;
      } else {
        item[key] = `${item[key]} — ${value}`;
      }
    });
    item.link = links[rowIndex] || '';
    return item;
  }).filter(item => Object.keys(item).length > 1);
}
