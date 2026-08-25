import fs from 'node:fs/promises';
import { chromium } from 'playwright';
import { filterAndSortCascavel } from './normalize.js';
import { rowsToOccurrences } from './parser.js';

const SELECTORS = {
  period: '#SC_rgo_datahora_recebimento_cond',
  municipio: '#SC_rgo_id_municipio',
  search: '#sc_b_pesq_bot'
};

async function readFixture(filePath) {
  const parsed = JSON.parse(await fs.readFile(filePath, 'utf8'));
  return Array.isArray(parsed) ? parsed : parsed.ocorrencias || [];
}

async function extractFromPage(page) {
  const candidates = page.locator('table');
  const count = await candidates.count();
  for (let index = count - 1; index >= 0; index -= 1) {
    const table = candidates.nth(index);
    const matrix = await table.locator('tr').evaluateAll(rows => rows.map(row =>
      [...row.querySelectorAll(':scope > th, :scope > td')].map(cell => cell.innerText.trim())
    ));
    if (matrix.length < 2) continue;
    const headerIndex = matrix.findIndex(row => row.some(cell => /munic[ií]pio|cidade/i.test(cell)));
    if (headerIndex < 0) continue;
    const headers = matrix[headerIndex];
    const rows = matrix.slice(headerIndex + 1).filter(row => row.some(Boolean));
    const links = await table.locator('tr').evaluateAll((els, start) => els.slice(start).map(row => {
      const href = row.querySelector('a[href]')?.href || '';
      return /^https:\/\//i.test(href) ? href : '';
    }), headerIndex + 1);
    return rowsToOccurrences(headers, rows, links);
  }
  const emptyText = await page.locator('body').innerText().catch(() => '');
  if (/nenhum registro|sem registro|0 registro/i.test(emptyText)) return [];
  throw new Error('A estrutura da grade do SYSBM mudou ou não ficou disponível.');
}

export async function collectOccurrences(config, dependencies = {}) {
  if (config.fixturePath) return filterAndSortCascavel(await readFixture(config.fixturePath));
  const launcher = dependencies.chromium || chromium;
  const browser = await launcher.launch({ headless: config.headless });
  const context = await browser.newContext({ locale: 'pt-BR', timezoneId: 'America/Sao_Paulo' });
  const page = await context.newPage();
  page.setDefaultTimeout(config.timeoutMs);
  try {
    await page.goto(config.sysbmUrl, { waitUntil: 'domcontentloaded', timeout: config.timeoutMs });
    await page.locator(SELECTORS.period).waitFor({ state: 'visible' });
    await page.locator(SELECTORS.period).selectOption(config.lookback);
    const municipality = page.locator(SELECTORS.municipio);
    await municipality.selectOption({ label: 'CASCAVEL' });
    const selected = await municipality.locator('option:checked').textContent();
    if (String(selected).trim() !== 'CASCAVEL') throw new Error('O filtro exato de CASCAVEL não pôde ser selecionado.');
    await page.locator(SELECTORS.search).click();
    await page.waitForTimeout(1500);

    const resultFrame = page.frameLocator('#nmsc_iframe_grid_imprensa');
    const resultBody = resultFrame.locator('body');
    const hasFrame = await resultBody.isVisible().catch(() => false);
    const raw = hasFrame ? await extractFromPage(resultFrame) : await extractFromPage(page);
    return filterAndSortCascavel(raw);
  } finally {
    await context.close().catch(() => {});
    await browser.close().catch(() => {});
  }
}

export { SELECTORS, extractFromPage };
