# Acompanhamento F0 — Fundação

**Estado:** concluída e aceita em 23/09/2026 após conferência informada pelo usuário. **Responsável pela implementação:** agente OpenCode (Infra/CI, Backend e Frontend). **Revisor:** usuário (conferência confirmada nesta sessão). Evidência reproduzível: `act push -W ci/local.yml -P ubuntu-latest=-self-hosted --env-file /dev/null --env ACT_REPO="$PWD"` terminou com `Job succeeded` em checkout limpo, com MariaDB de teste isolado e limpeza do volume.

| Etapa | Estado | Evidência / próxima ação |
|---|---|---|
| Host Laravel, SPA, TypeScript e Vite | validado localmente | `/` entrega o HTML com os assets Vite; `/login` entrega a SPA, `/up` responde `200` e `/api/v1/missing` responde JSON `404`. `npm ci`, format, lint, tipos, teste frontend e build passaram via Sail. |
| Sail PHP 8.5, MariaDB, Mailpit e banco de testes | validado localmente | `docker compose up -d --build` iniciou os três serviços; PHP 8.5.10 possui `pdo_mysql`; migration aplicada no banco de desenvolvimento; 2 testes backend (11 assertions), inclusive escrita isolada em `starterkit_test`, passaram. |
| Bootstrap e documentação | validado localmente | `docs/environment.md` cobre o caso sem `vendor/`; container PHP 8.5 gerou `composer.lock`; Act executou o fluxo a partir de clone limpo do HEAD local. Repetir na revisão independente. |
| Verificações locais | validado localmente | Formatação, análise estática, lint, tipos, testes e build executados via Sail; smoke HTTP da SPA, saúde e isolamento da API na mesma origem. |
| CI local com Act | validado localmente | Act `0.2.89` executou `ci/local.yml` com clone limpo, projeto Docker separado, migrations, checks PHP/frontend, testes e smoke HTTP; job `verify` finalizou com sucesso. Não é execução hospedada nem revisão independente. |

**Histórico:** o bloqueio inicial de acesso a `/var/run/docker.sock` foi resolvido. Composer e PHP continuam desnecessários no host. A validação acima ocorreu localmente com Docker/Compose e Sail; não é resultado de CI hospedado nem revisão de outra pessoa.

**Verificação local (23/09/2026):** `composer install` consumiu o lockfile no container de bootstrap; `docker compose up -d --build` iniciou Sail, MariaDB e Mailpit; `artisan migrate --force` não encontrou migrations pendentes. Via Sail passaram `npm ci`, Prettier, ESLint, TypeScript, Vitest (1 teste), build Vite, Pint, Larastan e os testes Laravel (2 testes, 11 assertions, com MariaDB de teste). Smoke HTTP local confirmou `/` e `/up` com sucesso, `/login` com HTML `200` e `/api/v1/missing` com JSON `404`.

**Histórico do CI:** após configurar remoto e autenticação, houve um run GitHub Actions com falha por testar a SPA antes do build e outro run verde após corrigir a ordem. A pedido do usuário, o workflow foi desativado e removido; esses runs não são o procedimento de validação adotado para esta fase.

**Aceite:** a conferência foi comunicada pelo usuário após o pipeline Act local e autorizou o início da F1. A evidência local não é uma execução hospedada.
