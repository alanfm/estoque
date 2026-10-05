# Acompanhamento F6 — Módulo de referência e validação integrada

**Estado:** concluída e aceita em 25/09/2026 após conferência informada pelo usuário. **Responsável pela implementação:** agente OpenCode (Backend/Frontend). **Revisor:** usuário (aceite confirmado nesta sessão). **Dependência:** F5 aceita.

| Critério | Estado | Evidência |
|---|---|---|
| Módulo `customers` como pacote fora de `app/Core` | implementado | `modules/acme/customers` possui pacote Composer `acme/customers`, manifesto compatível com schema 1 e provider que estende `ModuleServiceProvider`; lockfile instala o pacote por path repository. |
| CRUD com migration, policy, Actions/Queries/Resources | implementado | API autenticada `/api/v1/customers`, migrations MariaDB, `CustomerPolicy`, `SaveCustomerAction`, `ListCustomersQuery` e Resources; testes cobrem CRUD, validação e `401`/`403`/sucesso. |
| Pesquisa e paginação em MariaDB | implementado | Listagem filtra nome, e-mail e empresa e usa `PaginatedResourceCollection`; teste feature verifica filtro e metadata camelCase. |
| SPA: listagem, pesquisa, paginação, edição e exclusão | implementado | Entrada do módulo com rota lazy e navegação autorizada; UI usa componentes públicos, apresenta estados carregando/vazio/erro e oculta ações sem permissão correspondente. |
| Suíte E2E do CRUD | aprovado | `tests/e2e/customers.auth.spec.ts` passa no container Sail; cobre autenticação de setup, criar, filtrar, editar e remover cliente. |
| Instalação, compatibilidade e atualização | parcialmente validado; aceite confirmado | `composer require acme/customers:^1.0` resolveu e instalou o link local; `core:modules:diagnose --json` reconheceu o módulo como habilitado sem issues. O ensaio automatizado de upgrade em checkout limpo não foi registrado nesta execução; a fase foi aceita pelo usuário. |
| Documentação do módulo e política de fronteiras | implementado | `modules/acme/customers/README.md` descreve compatibilidade, instalação, permissões, endpoints e atualização; `creating-a-module.md` segue como roteiro geral. |

**Evidência reproduzível executada:**

```bash
./vendor/bin/sail artisan core:modules:diagnose --json
./vendor/bin/sail artisan test
# 46 testes passando (345 assertions)
./vendor/bin/sail composer format:check
./vendor/bin/sail composer analyse
npm run typecheck
npm run lint
npm test
# 52 testes passando
npm run build
./vendor/bin/sail artisan migrate --force
./vendor/bin/sail artisan core:sync-permissions
printf '%s\n%s\n' 'senha-de-teste-1234' 'senha-de-teste-1234' | \
  ./vendor/bin/sail artisan core:bootstrap-admin admin001 'Administrador E2E' admin@example.com
docker compose exec -T --user root \
  -e E2E_BASE_URL=http://localhost \
  -e E2E_ADMIN_EMAIL=admin@example.com \
  -e E2E_ADMIN_PASSWORD=senha-de-teste-1234 \
  laravel.test npx playwright test tests/e2e/customers.auth.spec.ts
# 2 testes passando (setup + CRUD)
```

O build Vite emitiu a entrada compilada de `CustomersPage` e manteve o aviso de bundle principal acima de 500 kB, já conhecido desde F4. Para o E2E, as migrations e permissões foram verificadas/sincronizadas e o administrador inicial de teste foi provisionado com as mesmas credenciais de `ci/local.yml`; o setup e o fluxo completo passaram.

**Aceite:** o usuário confirmou que a fase está aceita. O roteiro de instalação/upgrade em checkout limpo permanece como melhoria de evidência para a próxima validação integrada.
