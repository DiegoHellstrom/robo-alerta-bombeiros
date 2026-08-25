import { formatOccurrence, sendTelegram } from './telegram.js';
import { sanitizeError, unique } from './state.js';

export async function executeRobot({ state, occurrences, persist, telegram }) {
  state.lastRunAt = new Date().toISOString();
  try {
    if (!state.baselineCreated) {
      state.processedIds = unique(occurrences.map(item => item.id));
      state.baselineCreated = true;
      state.lastSuccessAt = new Date().toISOString();
      state.lastError = null;
      await persist(state);
      return { baselineCreated: true, received: occurrences.length, sent: 0 };
    }

    const known = new Set(state.processedIds);
    const fresh = occurrences.filter(item => !known.has(item.id)).reverse();
    let sent = 0;
    for (const item of fresh) {
      await sendTelegram(formatOccurrence(item), telegram);
      state.processedIds = unique([item.id, ...state.processedIds]);
      state.lastSuccessAt = new Date().toISOString();
      state.lastError = null;
      await persist(state); // Persistir após cada envio evita duplicidade em falha parcial.
      sent += 1;
    }
    state.lastSuccessAt = new Date().toISOString();
    state.lastError = null;
    await persist(state);
    return { baselineCreated: false, received: occurrences.length, sent };
  } catch (error) {
    state.lastError = sanitizeError(error);
    await persist(state);
    throw error;
  }
}
