# Robô Alerta Bombeiros — GitHub Actions

Versão gratuita, sem computador ligado, Google Cloud, Apps Script ou servidor permanente.

## Funcionamento

O workflow roda a cada cinco minutos, abre a listagem pública do SYSBM com Playwright, seleciona o município exato `CASCAVEL`, cria uma linha de base na primeira execução, envia somente ocorrências novas ao Telegram e salva no repositório apenas os IDs já processados.

## Segredos obrigatórios

Em **Settings → Secrets and variables → Actions**, crie:

- `TELEGRAM_BOT_TOKEN`
- `TELEGRAM_CHAT_ID`

Os valores não devem ser colocados em arquivos, commits ou mensagens.

## Primeira execução

1. Abra **Actions → Alerta Bombeiros**.
2. Clique em **Run workflow**.
3. A primeira execução cria a linha de base e não envia ocorrências antigas.
4. Execute novamente para confirmar que não há duplicidade.

## Segurança

- O repositório é público para usar gratuitamente os executores padrão.
- Tokens permanecem em GitHub Secrets.
- O estado público contém somente hashes determinísticos, horários de execução e erros sanitizados.
- Se o Telegram falhar, o ID daquela ocorrência não é gravado e ela será tentada novamente.
- Falhas parciais preservam os alertas já enviados antes de encerrar a execução.

## Limitações

- O menor agendamento nativo do GitHub é cinco minutos.
- Execuções podem sofrer atraso na fila.
- Workflows agendados de repositórios públicos podem ser desativados após 60 dias sem atividade; reative em **Actions** se necessário.
- Alterações futuras na página do SYSBM podem exigir revisão do coletor.
