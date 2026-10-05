# Acompanhamento F1 — Contrato HTTP e persistência transversal

**Estado:** concluída e aceita em 23/09/2026 após conferência informada pelo usuário. **Responsável pela implementação:** agente OpenCode (Backend). **Revisor:** usuário (conferência confirmada nesta sessão). **Dependência:** F0 aceita.

| Critério | Estado | Evidência |
|---|---|---|
| Migrations de usuário e dados transversais | validado localmente | Act aplicou as migrations de `users`, `password_reset_tokens` e `sessions` em MariaDB limpo; senha inicial permite `NULL`; teste integrado confirma isolamento do banco de testes e e-mail único. |
| API `/api/v1` e rota SPA na mesma origem | validado localmente | Testes cobrem rota de status, `404` JSON sem `Accept`, `405` e `/login` da SPA; smoke HTTP no Act confirmou mesma origem. |
| Contrato JSON e serialização | validado localmente | Form Request, controller invocável, Action e Resource em `GET /api/v1/system/status`; testes para `200`, `404`, `422`, `500` sanitizado e paginação `camelCase`. |
| Correlação `requestId` | validado localmente | Mesmo ULID no corpo/cabeçalho e no contexto do log do erro inesperado; IDs distintos entre requisições. |
| Documentação da API | atualizada | Endpoint, erros, paginação e ADR-016 em `docs/api-conventions.md` e `docs/architecture.md`. |

**Evidência reproduzível:** `act push -W ci/local.yml -P ubuntu-latest=-self-hosted --env-file /dev/null --env ACT_REPO="$PWD" --env ACT_INCLUDE_WORKTREE=1` terminou com `Job succeeded` após clone isolado com snapshot das alterações locais, migrations em MariaDB limpo, 8 testes Laravel (53 assertions), 1 teste Vitest, Pint, Larastan, Prettier, ESLint, tipos, build Vite e smoke HTTP. Sem a opção `ACT_INCLUDE_WORKTREE=1`, o pipeline testa somente o `HEAD` versionado.

**Aceite:** a conferência foi comunicada pelo usuário após a execução local do Act e autorizou o início da F2.
