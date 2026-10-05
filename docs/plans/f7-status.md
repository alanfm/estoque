# Acompanhamento F7 — Empacotamento e marco do núcleo

**Estado:** concluída e aceita em 25/09/2026. **Responsável pela implementação e acompanhamento:** agente OpenCode. **Revisor:** usuário (aceite confirmado nesta sessão). **Dependência:** F6 aceita.

## Critérios e evidências

| Critério | Estado | Evidência |
|---|---|---|
| Imagem de produção com dependências/assets travados e módulos instalados | concluído | `Dockerfile` multi-stage produz alvos PHP-FPM `app` e Nginx `web`; `composer install --no-dev` e `npm ci` usam lockfiles. O build executa `core:modules:diagnose --json`; Vite falha se a entrada frontend do módulo estiver inválida/ausente. Imagens executam sem root e carregam labels OCI de versão e revisão. O alvo PHP final inclui somente arquivos do runtime (sem `tests/`, docs raiz, lockfiles ou ferramentas Node). |
| Processos HTTP, worker/scheduler e migrations | concluído para o escopo atual | Nginx e PHP-FPM são serviços separados da imagem; MariaDB usa volume persistente. A aplicação usa fila síncrona e não registra scheduler, portanto não há worker/scheduler ativo. Migrations são executadas explicitamente por `php artisan migrate --force`. |
| Configuração operacional, saúde, backup e recuperação | concluído | `compose.production.yaml` injeta configuração/secrets em runtime, usa filesystem somente leitura e health checks. `docs/production-deployment.md` descreve publicação, backup, restauração, atualização e rollback. |
| Build e smoke da imagem sem Sail em pipeline local | concluído | Execução do workflow local `ci/local.yml` por Act 0.2.89 terminou com `Job succeeded`; os passos construíram as imagens de produção por lockfile e validaram `/up`, SPA, login, CSRF, `401` da API e entrada compilada de `customers`. |
| SPA/API/sessão/banco/módulo de referência em imagem Docker | concluído | Compose isolado `starterkit-f7` respondeu `/up=200`, `/=200`, `/login=200`, `/sanctum/csrf-cookie=204`, `GET /api/v1/customers` sem autenticação com `401`; Playwright executado contra a imagem de produção passou login e CRUD de clientes (2 testes incluindo setup). O manifesto de build contém `CustomersPage` e o asset respondeu `200`. |
| Atualização e retorno preservando dados persistidos | concluído para migrations compatíveis exercitadas | Imagens locais `f7-test` → `f7-upgrade` → `f7-test` foram implantadas com o mesmo volume MariaDB e de estado de módulos. A migration foi executada explicitamente (sem migrations novas pendentes); o registro `f7-persisted@example.test` permaneceu após upgrade e rollback e `modules.json` continuou habilitado. |
| Backup e restauração MariaDB | concluído em ambiente descartável | `mariadb-dump --single-transaction` foi restaurado em schema isolado `starterkit_restore`; consulta confirmou a preservação do cliente `f7-persisted@example.test`. O arquivo do backup ficou em `/tmp/opencode/starterkit-f7-backup.sql`, fora do repositório. |
| Suíte e política de compatibilidade | concluído | Execução local completa: Pint e PHPStan aprovados; 46 testes PHP/345 assertions, 52 testes Vitest, lint, typecheck e build Vite aprovados; Playwright E2E 14/14 passou no Act. Build de produção também validou diagnóstico e compatibilidade do módulo. |
| Versão padrão do núcleo `1.0.0` e guia operacional | implementado | `config/modules.php` e Compose reportam `1.0.0` por padrão após a validação; `docs/production-deployment.md` documenta build, configuração, instalação, upgrade, backup/restore e rollback. Nenhuma imagem foi publicada em registry e nenhum tag Git/release externo foi criado nesta execução. |

## Evidência reproduzível

O workflow integrado foi executado com o checkout de trabalho incluído:

```bash
~/.local/share/mise/installs/act/0.2.89/act push -W ci/local.yml \
  -P ubuntu-latest=-self-hosted --env-file /dev/null \
  --env ACT_REPO="$PWD" --env ACT_INCLUDE_WORKTREE=1
```

Resultado observado: `Job succeeded`. O workflow executou bootstrap limpo, migrations MariaDB, checks PHP/frontend, 46 testes PHP, 52 testes frontend, 14 E2E e build + smoke das imagens de produção sem Sail. Os serviços e volumes de teste foram removidos pela etapa de cleanup do projeto Act.

O roteiro de entrega e os comandos de implantação estão em [production-deployment.md](../production-deployment.md). A execução Docker/Compose manual utilizou o projeto isolado `starterkit-f7`, porta `18080` e credenciais exclusivamente descartáveis; não alterou nem removeu os dados do projeto de desenvolvimento.

## Revisão final

Os critérios técnicos de F7 foram exercitados, passaram e foram aceitos pelo usuário em 25/09/2026. A imagem `1.0.0` foi construída localmente; a publicação externa em registry e criação de tag Git/release não fizeram parte desta execução.
