# Acompanhamento F2 — Sessão e ciclo de vida da senha

**Estado:** concluída e aceita em 23/09/2026 após conferência informada pelo usuário. **Responsável pela implementação:** agente OpenCode (Backend). **Revisor:** usuário (conferência confirmada nesta sessão). **Dependência:** F1 aceita.

| Critério | Estado | Evidência |
|---|---|---|
| Sessão/Sanctum e CSRF na mesma origem | validado localmente | Fluxo HTTP real: `/sanctum/csrf-cookie` `204`; login sem token `419`; login com token `200`; `401` sem sessão. Sessão em banco. |
| Primeiro administrador | validado localmente | `core:bootstrap-admin` cria e é idempotente; recusa segundo administrador; senha solicitada por prompt, sem argumento ou log. |
| Login, usuário atual e logout | validado localmente | Testes e smoke HTTP: login `200`, usuário `200`, logout `204`, usuário após logout `401`; `/api/v1/register` inexistente. |
| Recuperação e primeira senha | validado localmente | Respostas neutras `202`; e-mail capturado no Mailpit só para conta existente; token inválido/expirado/reutilizado `422`; conta sem senha não autentica. |
| Alteração de senha e revogação | validado localmente | Senha atual obrigatória; redefinição zera as sessões do usuário; alteração preserva a sessão corrente. |
| Rate limiting | validado localmente | Login e recuperação retornam `429` após 5 tentativas por minuto por rota e IP. |

**Evidência reproduzível:** `act push -W ci/local.yml -P ubuntu-latest=-self-hosted --env-file /dev/null --env ACT_REPO="$PWD" --env ACT_INCLUDE_WORKTREE=1` terminou com `Job succeeded` em clone isolado e MariaDB limpo, com 17 testes Laravel (139 assertions), 1 teste Vitest, Pint, Larastan, Prettier, ESLint, tipos, build Vite e smoke HTTP. O fluxo real por HTTP foi conferido à parte: `/sanctum/csrf-cookie` `204`, login sem token `419`, login `200`, usuário `200`, logout `204`, usuário após logout `401`, recuperação `202` neutra com e-mail entregue ao Mailpit apenas para conta existente.

**Aceite:** a conferência foi comunicada pelo usuário após a execução local do Act e autorizou o avanço para a F3.
