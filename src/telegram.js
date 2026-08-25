const LIMIT = 4096;

export function formatOccurrence(item) {
  const lines = ['🚒 NOVA OCORRÊNCIA — CASCAVEL', ''];
  add(lines, 'Tipo', item.tipo);
  add(lines, 'Data e horário', [item.data, item.horario].filter(Boolean).join(' '));
  add(lines, 'Bairro', item.bairro);
  add(lines, 'Local', item.endereco || item.local);
  add(lines, 'Descrição', item.descricao);
  add(lines, 'Situação', item.situacao);
  lines.push('', 'Origem: SYSBM/Corpo de Bombeiros do Paraná');
  if (/^https:\/\//i.test(String(item.link || ''))) lines.push(String(item.link));
  return lines.join('\n');
}

export async function sendTelegram(message, { token, chatId, fetchImpl = fetch, dryRun = false }) {
  if (dryRun) return { ok: true, dryRun: true };
  if (!token || !chatId) throw new Error('TELEGRAM_BOT_TOKEN e TELEGRAM_CHAT_ID são obrigatórios.');
  for (const part of splitMessage(message)) {
    const response = await fetchImpl(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: 'POST', headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ chat_id: chatId, text: part, disable_web_page_preview: true })
    });
    const body = await response.json().catch(() => ({}));
    if (!response.ok || body.ok !== true) throw new Error(`Telegram recusou a mensagem (HTTP ${response.status}).`);
  }
  return { ok: true };
}

export function splitMessage(text, limit = LIMIT) {
  const result = [];
  let remaining = String(text);
  while (remaining.length > limit) {
    let cut = remaining.lastIndexOf('\n', limit);
    if (cut < Math.floor(limit * 0.6)) cut = limit;
    result.push(remaining.slice(0, cut));
    remaining = remaining.slice(cut).replace(/^\n+/, '');
  }
  if (remaining) result.push(remaining);
  return result;
}

function add(lines, label, value) {
  if (String(value || '').trim()) lines.push(`${label}: ${String(value).trim()}`);
}
