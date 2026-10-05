# Acompanhamento SPEC-001 — Navegação lateral agrupada por módulo

**Estado:** implementação concluída; interface aceita pelo usuário em 01/10/2026. Revisão formal de acessibilidade e teste de disable/enable pendentes.
**Responsável:** agente OpenCode (implementação).
**Revisor:** usuário confirmou a interface como ok; revisão formal de acessibilidade pendente.
**Dependência:** F5 e F6 aceitas.
**Versão planejada/implementada localmente:** núcleo `1.1.0`; `acme/customers` `1.1.0`, mínimo `^1.1.0`.

| Etapa | Estado | Evidência / pendência |
|---|---|---|
| E1 — Contrato, versões e casos | concluída localmente | Confirmado o formato `navigationGroup`; versão local do núcleo `1.1.0`; `customers` usa `1.1.0` e `^1.1.0`. Caminhos reais preservados: `/admin/customers`, `/admin/customers/new`, `/admin/customers/:id`. |
| E2 — Tipos e registro | implementada; validada | `ModuleNavigationGroup` exportado pelo module-kit; projeção `navigationGroups`; lista plana preservada; registro atômico; ordenação estável. Registry tests incluídos na suíte completa. |
| E3 — Permissões e estado ativo | implementada; validada | `deriveModuleNavigation` filtra permissões, oculta grupo vazio, resolve limite de segmento e rota mais específica. Testes unitários incluídos na suíte completa. |
| E4 — Sidebar e estado | implementada; interface aceita pelo usuário | `AdminNav` renderiza grupos, estado compartilhado em `AdminLayout`, IDs distintos, foco e modo recolhido/mobile. Testes automatizados verdes; usuário acessou o sistema e confirmou que a interface está ok. A revisão formal de acessibilidade/reflow ainda não foi registrada. |
| E5 — Módulo de referência e compatibilidade | implementada; E2E aprovado | `customers` tem “Listar clientes” e “Novo cliente”; fixture de contrato anterior continua plana. Playwright autenticado: setup, navegação agrupada e CRUD passaram. |
| E6 — Documentação e aceite | aceite visual/funcional registrado | Usuário acessou a aplicação e confirmou que está ok. Permanecem a revisão formal de acessibilidade/responsividade e o ensaio disable/enable. |

## Evidência executada nesta implementação

Executado no ambiente local Node já presente no checkout (não Sail):

```text
npm run typecheck     passou
npm run lint          passou
npm test              passou: 16 arquivos, 67 testes
npm run build         passou; aviso de bundle principal > 500 kB
npm run format:check  apontou 6 arquivos; aplicado Prettier --write aos arquivos alterados
git diff --check      passou
```

Typecheck, lint, suíte completa, build e whitespace foram executados após os ajustes finais.

Validação Sail/Docker:

```text
./vendor/bin/sail artisan test                  passou: 46 testes, 345 assertions
./vendor/bin/sail artisan core:modules:diagnose --json
  coreVersion 1.1.0; customers 1.1.0 enabled; sem issues
docker compose exec -T --user root laravel.test npx playwright install --with-deps chromium
  instalou Chromium e dependências no container
docker compose exec -T --user root -e E2E_BASE_URL=http://localhost \\
  -e E2E_ADMIN_EMAIL=admin@example.com \\
  -e E2E_ADMIN_PASSWORD=[credencial de teste] \\
  laravel.test npx playwright test --project=authenticated tests/e2e/customers.auth.spec.ts
  passou: setup de autenticação, navegação agrupada e CRUD (3 testes)
```

Playwright roda dentro do container, portanto usa `http://localhost`; o host da máquina usa `localhost:8080`, endereço que não funciona a partir de dentro do container. A conta foi provisionada apenas no ambiente local de teste.

## Pendências de validação

- [x] Validação frontend local equivalente: format, lint, typecheck, 67 testes e build passaram (aviso de bundle > 500 kB).
- [x] Build recompilado dentro do container para o E2E.
- [x] `./vendor/bin/sail artisan test` passou: 46 testes, 345 assertions.
- [x] `./vendor/bin/sail artisan core:modules:diagnose --json` reportou núcleo `1.1.0`, `customers` `1.1.0`, enabled e sem issues.
- [x] Playwright autenticado `tests/e2e/customers.auth.spec.ts`: 3 testes passaram.
- [ ] Validar foco/overlay com teclado e leitor de tela, sidebar recolhida, mobile, temas claro/escuro, 320 px, zoom 200% e movimento reduzido.
- [ ] Testar ciclo disable/enable e build, se o ambiente operacional estiver disponível.
- [x] `git diff --check` e links locais passaram.
- [x] Usuário acessou o sistema e confirmou: “está ok” (01/10/2026).
- [ ] Revisão formal dos critérios de acessibilidade/responsividade e teste do ciclo disable/enable.

## Observações

- O primeiro E2E revelou requisitos de Chromium instalado, URL interna do container e administrador de teste provisionado. Com esses requisitos atendidos, os testes passaram.
- `package.json` e `package-lock.json` já estavam modificados antes desta implementação; essas mudanças não foram alteradas nem são necessárias para a SPEC-001.
- O aceite visual/funcional do usuário foi registrado. A SPEC segue sem encerramento formal até revisar os critérios de acessibilidade/responsividade e testar disable/enable.
