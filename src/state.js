import fs from 'node:fs/promises';
import path from 'node:path';

export const MAX_IDS = 500;

export async function readState(filePath) {
  try {
    const value = JSON.parse(await fs.readFile(filePath, 'utf8'));
    return {
      baselineCreated: value.baselineCreated === true,
      processedIds: unique(value.processedIds || []).slice(0, MAX_IDS),
      lastRunAt: value.lastRunAt || null,
      lastSuccessAt: value.lastSuccessAt || null,
      lastError: value.lastError || null
    };
  } catch (error) {
    if (error.code !== 'ENOENT') throw error;
    return { baselineCreated: false, processedIds: [], lastRunAt: null, lastSuccessAt: null, lastError: null };
  }
}

export async function writeState(filePath, state) {
  const clean = {
    baselineCreated: state.baselineCreated === true,
    processedIds: unique(state.processedIds || []).slice(0, MAX_IDS),
    lastRunAt: state.lastRunAt || null,
    lastSuccessAt: state.lastSuccessAt || null,
    lastError: state.lastError || null
  };
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  await fs.writeFile(filePath, `${JSON.stringify(clean, null, 2)}\n`, 'utf8');
}

export function unique(values) {
  const seen = new Set();
  return values.map(String).filter(value => value && !seen.has(value) && seen.add(value));
}

export function sanitizeError(error) {
  return String(error?.message || error || 'Erro desconhecido')
    .replace(/bot\d+:[A-Za-z0-9_-]+/gi, 'bot[OCULTO]')
    .replace(/Bearer\s+\S+/gi, 'Bearer [OCULTO]')
    .slice(0, 500);
}
