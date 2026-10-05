# Acompanhamento F3 — Autorização e administração de acesso

**Estado:** concluída e aceita em 23/09/2026 após conferência informada pelo usuário. **Responsável pela implementação:** agente OpenCode (Backend). **Revisor:** usuário (conferência confirmada nesta sessão). **Dependência:** F2 aceita.

| Critério | Estado | Evidência |
|---|---|---|
| Catálogo de permissões e vínculos | validado localmente | Migrations `permissions`/`permission_role`; `core:sync-permissions` é idempotente, marca obsoletas sem apagar vínculos e restaura permissões ausentes. Teste dedicado confirma atribuição preservada. |
| Regra centralizada de superadministrador | validado localmente | `Gate::before` único em `AuthorizationServiceProvider`; papel `super-admin` protegido; somente superadministrador atribui o papel (`403` caso contrário). |
| Policies e gates | validado localmente | `UserPolicy`, `RolePolicy` e `PermissionPolicy`; cada permissão do catálogo vira gate com o próprio nome; Form Requests autorizam as operações. |
| APIs de usuários, papéis e permissões | validado localmente | `GET/POST/GET/PATCH/DELETE` em `/api/v1/admin/users` e `/api/v1/admin/roles`, mais `GET /api/v1/admin/permissions`. Testes cobrem `401` para visitante, `403` sem permissão e sucesso para autorizado. |
| Criação administrativa envia link | validado localmente | `POST /api/v1/admin/users` grava `password` nulo e envia `ResetPassword` para `/reset-password?token=...`; nenhuma senha trafega por e-mail. |
| Último administrador protegido | validado localmente | Remover o papel ou excluir o último superadministrador retorna `409`; com um segundo superadministrador a operação é permitida. |
| Permissões efetivas na sessão | validado localmente | `GET /api/v1/auth/user` devolve papéis e permissões; superadministrador recebe o catálogo completo; permissões obsoletas são excluídas. |
| Documentação | atualizada | `docs/authorization.md`, `docs/api-conventions.md`, `docs/architecture.md` (ADR-017), `docs/environment.md` e este acompanhamento. |

**Evidência reproduzível:** `act push -W ci/local.yml -P ubuntu-latest=-self-hosted --env-file /dev/null --env ACT_REPO="$PWD" --env ACT_INCLUDE_WORKTREE=1` terminou com `Job succeeded` em clone isolado e MariaDB limpo, com 26 testes Laravel (263 assertions), incluindo os 9 testes de autorização, além de Pint, Larastan, Prettier, ESLint, tipos, build Vite e smoke HTTP. A execução via Sail confirmou os mesmos resultados.

**Aceite:** a conferência foi comunicada pelo usuário após a execução local do Act e autorizou o avanço para a F4.
