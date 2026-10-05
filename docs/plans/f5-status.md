# Acompanhamento F5 — Contrato e ciclo de vida dos módulos

**Estado:** concluída e aceita em 25/09/2026 após conferência informada pelo usuário. **Responsável pela implementação:** agente OpenCode (Backend/Frontend). **Revisor:** usuário (conferência confirmada nesta sessão). **Dependência:** F4 aceita.

| Critério | Estado | Evidência |
|---|---|---|
| Schema de `module.json` versionado | implementado | `modules/module.schema.json` (draft 2020-12) com `schemaVersion: 1`; validação equivalente em `ModuleManifestParser`. Documentação atualizada em `module-contract.md`. |
| Descoberta de providers via Composer | implementado | Módulos declaram `type: starterkit-module` e `extra.laravel.providers`; `ModuleComposerPackage` valida provider, autoload PSR-4, PHP `~8.5.0` e Laravel `^13.0`. O package discovery do Composer carrega o provider. |
| Validação de identificação, versões, dependências e ciclos | implementado | `ModuleRegistry` valida kebab-case, unicidade de identificador e de permissão, faixa `core`, dependências ausentes/incompatíveis e ciclos (DFS). Testes cobrem cada caso e bloqueiam a ativação. |
| Habilitação/desabilitação preservando dados | implementado | Estado em `storage/app/modules.json` (`ModuleStateStore`); `core:modules:enable`/`disable`; `core:modules:disable` recusa módulo com dependentes habilitados. Teste comprova rota, migration e permissão após reabilitar, com dados e vínculos intactos. |
| Registro de rotas, migrations, permissões e entradas SPA | implementado | `ModuleServiceProvider` aplica `api/v1/{apiPrefix}` com middleware `web` e carrega migrations/traduções; `core:sync-permissions` inclui módulos habilitados; o plugin Vite injeta `frontendEntry` em `virtual:starterkit-modules`. |
| Sincronização de permissões não destrutiva | implementado | `PermissionSynchronizer` inalterado passa a receber núcleo + módulos; testes demonstram obsoletos sem exclusão e restauração na reabilitação. |
| Descoberta das entradas no build Vite | implementado | `build/modules-vite-plugin.ts` espelha a descoberta do núcleo, lê o estado e gera imports dinâmicos; `resolve.alias` publica `@starterkit/module-kit`. Testes Vitest cobrem descoberta, desabilitados, entrada ausente e duplicados. |
| Suíte de contrato e diagnóstico não interativo | implementado | Módulo de amostra em `tests/Fixtures/Modules/contract-sample` + `ModuleContractTest`; comandos `core:modules:list/diagnose/enable/disable/entries` com saída e `--json`; `diagnose` retorna código diferente de zero em problemas. |
| Frontend: registry, rotas e navegação de módulos | implementado | `resources/spa/modules` com tipos, `createModuleRegistry`, guards por permissão, contexto e integração ao router e ao `AdminNav`. |
| Documentação | atualizada | `docs/architecture.md` (ADR-019), `module-contract.md`, `creating-a-module.md`, `frontend-architecture.md`, `compatibility-policy.md`, `testing.md`, `README.md` e este acompanhamento. |

**Evidência reproduzível:** com o stack Sail/MariaDB em execução, executou-se via Sail e Node:

```bash
./vendor/bin/sail composer format:check   # passed
./vendor/bin/sail composer analyse        # No errors
./vendor/bin/sail artisan test            # 44 testes passando (323 assertions)
npm run format:check                      # All matched files use Prettier code style
npm run lint                              # sem avisos
npm run typecheck                         # sem erros
npm test                                  # 52 testes passando
npm run build                             # build de produção concluído
```

O teste de contrato exercita descoberta, provider, rota autenticada, migration em MariaDB, inclusão de permissão, desabilitação com preservação de dados/vínculos e reabilitação, além de incompatibilidade de versão, dependência ausente e ciclo. O teste de descoberta do build confirma as entradas e a compilação da página do módulo de amostra pelo Vite. A suíte end-to-end existente foi reexecutada sem regressão:

```bash
docker compose exec -T --user root -e E2E_BASE_URL=http://localhost laravel.test npx playwright test
# 13 testes passando
```

**Pendências conhecidas:** o aviso de tamanho do bundle inicial (>500 kB) segue o da F4 e será tratado com o módulo de referência em F6/F7. Os testes end-to-end não foram estendidos nesta fase; os fluxos de módulo serão cobertos em F6.

**Aceite:** a conferência foi comunicada pelo usuário, autorizando o avanço para a F6.
