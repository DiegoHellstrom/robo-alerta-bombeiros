import path from 'node:path';
import { collectOccurrences } from './collector.js';
import { executeRobot } from './robot.js';
import { readState, sanitizeError, writeState } from './state.js';

const statePath = path.resolve(process.env.STATE_PATH || 'state/processed.json');
const config = {
  sysbmUrl: process.env.SYSBM_URL || 'https://www.sysbm.bombeiros.pr.gov.br/sysbmnew/grid_imprensa/',
  timeoutMs: Number(process.env.SYSBM_TIMEOUT_MS || 45000),
  lookback: process.env.SYSBM_LOOKBACK || 'U7',
  headless: true,
  fixturePath: process.env.SYSBM_FIXTURE_PATH ? path.resolve(process.env.SYSBM_FIXTURE_PATH) : ''
};

try {
  const state = await readState(statePath);
  const occurrences = await collectOccurrences(config);
  const result = await executeRobot({
    state, occurrences,
    persist: value => writeState(statePath, value),
    telegram: {
      token: process.env.TELEGRAM_BOT_TOKEN,
      chatId: process.env.TELEGRAM_CHAT_ID,
      dryRun: process.env.TELEGRAM_DRY_RUN === 'true'
    }
  });
  console.log(`[robô] concluído: recebidas=${result.received}, enviadas=${result.sent}, linhaBase=${result.baselineCreated}`);
} catch (error) {
  console.error(`[robô] falha: ${sanitizeError(error)}`);
  process.exitCode = 1;
}
