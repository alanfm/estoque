# Acompanhamento — Módulo Almoxarifado de TI

**Raiz obrigatória do projeto:** `~/Projects/estoque`.
**Referência técnica:** `alanfm/starterkit`, revisão consultada `ff1812f0dbfd95e84243d738768262ca0d36e1af`; o checkout em `~/Projects/starterkit` não é destino de alterações.
**Estado:** P00 permanece bloqueada pela falha Act registrada; P01 iniciada por orientação do usuário, com implementação e verificações locais concluídas.

## P00 — Preparação e baseline

| Item | Estado | Evidência / próxima ação |
|---|---|---|
| P00.1 Raiz e baseline | concluído | Base host incorporada em `estoque` a partir do `git archive` da revisão `ff1812f0dbfd95e84243d738768262ca0d36e1af`; preservados `.git` local e documentos funcionais. Nenhuma alteração feita em `~/Projects/starterkit`. Repositório local ainda sem commit. |
| P00.2 Contratos e orientações | concluído | Revisadas instruções, plano arquitetural, ambiente, política modular, API, autenticação, autorização, compatibilidade e deploy da referência; `AGENTS.md` atualizado para o estado real do host. |
| P00.3 Ambiente e checks | bloqueado | Sail/MariaDB sobem em portas locais 18080/15173/13307/18025; migrations, sincronização de permissões e build passam. Checks locais: Pint, PHPStan, PHPUnit (46/345), Prettier, ESLint, TypeScript e Vitest (52) passam. `/` e `/up` retornam 200; API com `Accept: application/json` retorna 401. Act falha consistentemente em `ApiContractTest::test_unexpected_error_is_sanitized_and_correlated_with_log` (espera `requestId` no contexto do log, recebe null); investigar antes do aceite. `npm ci` reportou 2 vulnerabilidades moderadas; Vite avisa chunk acima de 500 kB. |
| P00.4 Mapa de contratos | concluído | `module-kit` público exporta tipos/UI/`useSession`, mas ainda não `apiRequest`/`ApiError`; cliente atual é JSON-only. Pacotes são Composer locais com `module.json`; provider estende `ModuleServiceProvider`; API usa Resources e auth Sanctum/sessão; IDs de usuário usam FK do host. P01 endereça a lacuna de API/testes antes do pacote Inventory. |
| P00.5 Organização documental | concluído | Análise, especificação, plano e status permanecem sob `docs/`; links entre os três documentos preservados. |

### Próxima ação

Investigar a divergência do teste de correlação de logs entre o runner Act e o ambiente Sail local; reexecutar o workflow após corrigir/explicar a causa. P01 foi adiantada a pedido do usuário; não marcar P00 aceita nem iniciar P02 antes de resolver este gate.

Nenhum código funcional do estoque foi implementado e nenhum dado operacional foi importado ou alterado. Foram executados somente os testes e smoke checks do host de referência.

## P01 — Contratos públicos e integração de qualidade

| Item | Estado | Evidência / próxima ação |
|---|---|---|
| P01.1–P01.3 Cliente e exports públicos | concluído localmente | `module-kit` exporta `apiRequest`, `apiDownload`, `ApiError`, opções/tipos HTTP e recursos paginados. Headers de sessão/CSRF protegidos; headers customizados suportados; JSON/FormData/download implementados. |
| P01.4 Retry/idempotência | concluído localmente | GET pode repetir uma vez após 419; escritas só repetem com `Idempotency-Key` não vazia, preservando chave e corpo. Testes de retry e escrita não idempotente aprovados. |
| P01.5 Consumers de referência | concluído | `customersService` não importa caminhos internos e declara compatibilidade `^1.1.0`. |
| P01.6–P01.7 Descoberta e qualidade | concluído localmente | PHPUnit/PHPStan incluem `modules/acme/inventory`; Vitest/TypeScript/Prettier incluem o frontend do módulo. Testes sentinela confirmam descoberta. |
| P01.8 Contrato e compatibilidade | concluído localmente | `docs/contracts/core-1.1-module-http-client.md`; core configurado como 1.1.0; release/tag não publicados. |
| Verificação integrada | pendente | Sail: PHP 47 testes/346 assertions e Vitest 58 testes passam; Pint, PHPStan, lint, typecheck, Prettier, build e diagnóstico modular passam. Reexecutar Act após resolver o bloqueio P00 para evidência limpa. |

P01 foi avançada antes do aceite formal de P00 a pedido do usuário. A falha Act permanece classificada como bloqueio de baseline; não houve release/tag nem importação de dados reais.
