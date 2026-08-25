import assert from 'node:assert/strict';
import test from 'node:test';
import { executeRobot } from '../src/robot.js';

const old = { id: 'old', municipio: 'CASCAVEL', tipo: 'APH' };
const fresh = { id: 'new', municipio: 'CASCAVEL', tipo: 'Incêndio' };
const initial = () => ({ baselineCreated: false, processedIds: [], lastRunAt: null, lastSuccessAt: null, lastError: null });

test('primeira execução cria linha de base sem enviar', async () => {
  const state = initial();
  let calls = 0;
  const result = await executeRobot({ state, occurrences: [old], persist: async () => {},
    telegram: { dryRun: true, fetchImpl: async () => { calls += 1; } } });
  assert.equal(result.sent, 0);
  assert.equal(calls, 0);
  assert.equal(state.baselineCreated, true);
  assert.deepEqual(state.processedIds, ['old']);
});

test('ocorrência nova é enviada apenas uma vez', async () => {
  const state = initial();
  await executeRobot({ state, occurrences: [old], persist: async () => {}, telegram: { dryRun: true } });
  const first = await executeRobot({ state, occurrences: [fresh, old], persist: async () => {}, telegram: { dryRun: true } });
  const second = await executeRobot({ state, occurrences: [fresh, old], persist: async () => {}, telegram: { dryRun: true } });
  assert.equal(first.sent, 1);
  assert.equal(second.sent, 0);
});

test('falha no Telegram preserva ocorrência para nova tentativa', async () => {
  const state = { ...initial(), baselineCreated: true, processedIds: ['old'] };
  const response = { ok: false, status: 500, json: async () => ({ ok: false }) };
  await assert.rejects(() => executeRobot({ state, occurrences: [fresh, old], persist: async () => {},
    telegram: { token: 'x', chatId: 'y', fetchImpl: async () => response } }), /Telegram recusou/);
  assert.deepEqual(state.processedIds, ['old']);
  assert.match(state.lastError, /Telegram recusou/);
});
