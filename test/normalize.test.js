import assert from 'node:assert/strict';
import test from 'node:test';
import { filterAndSortCascavel, normalizeMunicipio } from '../src/normalize.js';

test('normaliza e filtra exatamente Cascavel', () => {
  assert.equal(normalizeMunicipio(' Cascavél '), 'CASCAVEL');
  const result = filterAndSortCascavel([
    { municipio: 'Cascavel', descricao: 'válida' },
    { municipio: 'Cascavel do Sul', descricao: 'inválida' },
    { municipio: 'Toledo', descricao: 'inválida' }
  ]);
  assert.equal(result.length, 1);
  assert.equal(result[0].municipio, 'CASCAVEL');
});
