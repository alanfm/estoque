# Plano de implementação — Módulo de Almoxarifado de TI

Versão: 1.0 • Data: 26/09/2026 • Estado: planejado

Base funcional: [Especificação do módulo](./especificacao-modulo-almoxarifado.md). Contexto: [Análise funcional](./analise-funcional-almoxarifado.md).

Este plano define trabalho futuro e critérios verificáveis. Nenhuma etapa foi implementada ou executada nesta entrega. A raiz de implementação é `~/Projects/estoque`: o host e o módulo de negócio ficarão neste repositório; `modules/acme/inventory` será um pacote local do host. O repositório `alanfm/starterkit` é somente a referência técnica da revisão abaixo e não será alterado. Dados operacionais da CTI serão preenchidos durante a homologação.

## 1. Referência técnica verificada

Referência técnica: [alanfm/starterkit](https://github.com/alanfm/starterkit). Branch consultada: main. Revisão observada: ff1812f0dbfd95e84243d738768262ca0d36e1af, de 25/09/2026. A implementação ocorrerá em `~/Projects/estoque`; antes de incorporar a base do host, comparar a revisão local com essa referência e registrar a revisão efetivamente utilizada. Não trabalhar nem gravar alterações em `~/Projects/starterkit`.

Fontes principais:

- [Contrato modular](https://github.com/alanfm/starterkit/blob/main/docs/module-contract.md), [criação de módulo](https://github.com/alanfm/starterkit/blob/main/docs/creating-a-module.md) e [compatibilidade](https://github.com/alanfm/starterkit/blob/main/docs/compatibility-policy.md).
- [Padrões](https://github.com/alanfm/starterkit/blob/main/docs/development-standards.md), [API](https://github.com/alanfm/starterkit/blob/main/docs/api-conventions.md) e [testes](https://github.com/alanfm/starterkit/blob/main/docs/testing.md).
- [Composer do host](https://github.com/alanfm/starterkit/blob/main/composer.json), [módulo Customers](https://github.com/alanfm/starterkit/tree/main/modules/acme/customers) e [module-kit](https://github.com/alanfm/starterkit/blob/main/resources/spa/module-kit/index.ts).
- [Configuração Vite/Vitest](https://github.com/alanfm/starterkit/blob/main/vite.config.ts), [PHPUnit](https://github.com/alanfm/starterkit/blob/main/phpunit.xml), [PHPStan](https://github.com/alanfm/starterkit/blob/main/phpstan.neon) e [CI](https://github.com/alanfm/starterkit/blob/main/ci/local.yml).
- [Marco F7](https://github.com/alanfm/starterkit/blob/main/docs/plans/f7-status.md) e [operação](https://github.com/alanfm/starterkit/blob/main/docs/production-deployment.md).

### 1.1 Situação do host

O checkout de referência reportava core 1.0.0 e F0–F7 aceitas na revisão consultada; possui Laravel 13/PHP 8.5, Sanctum, MariaDB, SPA React/TypeScript, Docker/Sail, loader modular e módulo Customers de referência. A raiz local `~/Projects/estoque` atualmente contém somente os documentos funcionais e ainda não contém o host executável. A incorporação da base e a atualização de orientações desatualizadas fazem parte de P00; confirmar os dados contra a revisão efetivamente incorporada.

| Evidência | Consequência para o plano |
|---|---|
| Composer usa repository path modules/*/* | Pacote local pode ser instalado sem criar infraestrutura nova |
| Loader PHP e plugin Vite descobrem manifestos | Inventory usa provider e module.ts conforme contrato |
| module-kit exporta componentes e useSession, mas não apiRequest/ApiError/tipos HTTP | Publicar esses contratos antes de usá-los no módulo |
| Cliente atual aceita JSON, sem headers customizados, FormData ou resposta Blob | Adicionar capacidades compartilhadas para Idempotency-Key, importação e exportação |
| Customers importa cliente/tipos por caminhos internos | Usar como referência funcional; não repetir esse acoplamento |
| PHPUnit inclui somente tests do host | Incluir suíte do módulo e garantir autoload dos seus testes |
| Vitest inclui somente resources/spa/**/*.test | Incluir testes do pacote Inventory explicitamente |
| PHPStan e format:check têm escopo que não cobre todo módulo | Ampliar alvos e comprovar arquivos analisados |
| Docker tem fila sync e nenhum worker/scheduler ativo na F7 | Operações iniciais síncronas; sugestão de reposição calculada na consulta |
| compose.production.yaml usa filesystem read_only e só persiste banco/estado modular | Provisionar disco privado persistente de arquivos para importação; tmpfs não preserva a fonte |

## 2. Resultado esperado

Entregar em `~/Projects/estoque` uma aplicação host executável e o pacote acme/inventory em `modules/acme/inventory`, com namespace Acme\Inventory, manifesto inventory, API /api/v1/inventory e páginas /admin/inventory. Categoria → código agregado → variantes de marca/modelo. Cada operação movimenta uma variante; reposição consolida o código.

Operações: cadastro, rascunhos, entrada, saída com OS opcional e observações condicionais, contagem/ajuste, estorno integral, extrato, relatórios, exportação e importação do legado. Ajustes e estornos são do gestor; parâmetros de reposição são do administrador operacional.

Dados permanecem no módulo. Mudanças do host atendem somente contratos transversais, descoberta, qualidade e implantação. Não introduzir regras de estoque em app/Core nem dependência do módulo Customers.

## 3. Dependências e sequência

    P00 Preparar e fixar baseline
      ↓
    P01 Completar contratos públicos e cobertura de testes do host
      ↓
    P02 Instalar pacote + schema + permissões
      ↓
    P03 Catálogo e variantes
      ↓
    P04 Livro, locks, idempotência e conciliação
      ↓
    P05 Rascunhos + entradas + saídas
      ↓
    P06 Contagem + ajustes + estornos
      ↓
    P07 Reposição      P08 Relatórios/exportações
             ↘        ↙
             P09 Importação e saneamento
                       ↓
             P10 Homologação e integração
                       ↓
             P11 Implantação e entrega

P07 e P08 podem ser desenvolvidas independentemente após P06; P09 reutiliza catálogo e livro, e seu analisador pode começar após P03. Essa é uma relação de dependência do trabalho, não uma autorização para criar agentes ou chats.

Cada etapa termina com evidências salvas em docs/plans/inventory-status.md e marcação dos RF/RNF/AC cobertos. A próxima etapa dependente só começa após o aceite técnico da anterior.

## 4. Convenções e pontos fixados pelo plano

1. Rascunhos não reservam saldo; confirmação revalida disponibilidade.
2. Lançamentos assinados são fonte auditável; projeção de saldo é atualizada na mesma transação.
3. Core frontend recebe extensão compatível de API pública na versão 1.1.0. Módulos que consumirem os novos contratos exigem `^1.1.0`; a especificação do Inventory e o módulo Customers de referência declaram essa dependência.
4. A publicação do core 1.1.0 depende dos testes e de seu versionamento oficial; este plano não cria release ou tag.
5. Idempotência cobre criação de rascunho, confirmação, ajuste, estorno e commit de importação. Acrescentar criação de rascunho ao contrato funcional durante P04, para impedir duplicação após falha de rede.
6. Client mantém CSRF, eventos de sessão e envelope do host; retries preservam a chave. Escritas sem proteção não são reenviadas automaticamente.
7. Tipo ADJUSTMENT registra contagem; ledger guarda a diferença. REVERSAL é gerado pela aplicação, nunca informado como operação livre.
8. Estornos têm sinal oposto, data atual e vínculo único; original e compensação continuam compondo a soma.
9. Por falta de marca comprovável nas saídas históricas, importação usa variante legada não identificada quando necessário e concilia a distribuição por contagem física.
10. Não selecionar automaticamente marca antiga ou produto novo apenas pela ordem das linhas da planilha.

## 5. Etapas de implementação

### P00 — Preparação e baseline

Dependência: nenhuma. Entrega: checkout conhecido, ambiente de desenvolvimento/teste e mapa de contratos.

Tarefas:

- P00.1 Usar `~/Projects/estoque` como raiz de implementação; inventariar e preservar os documentos e mudanças existentes. Incorporar a base do host compatível com a revisão fixada sem editar `~/Projects/starterkit`; registrar origem, revisão e estratégia de integração.
- P00.2 Ler as orientações e contratos da base incorporada (AGENTS.md, arquitetura, ambiente, API, módulos e design); corrigir referências desatualizadas ao estágio documental sem remover regras aplicáveis.
- P00.3 Subir Docker/Sail com banco de testes isolado; executar baseline do host e registrar falhas preexistentes.
- P00.4 Inspecionar module-kit, contratos PHP, Resources, erros, router e tabelas de usuários/permissões para evitar cópias incompatíveis.
- P00.5 Organizar os documentos de análise/especificação/plano sob `docs/` no repositório `estoque`, preservando conteúdo e links, e criar `docs/plans/inventory-status.md`.

Arquivos do host: aplicação Laravel/SPA/Docker sob `~/Projects/estoque`, `AGENTS.md` e documentação. A base de referência pode ser incorporada ao repositório local, mas não se deve trabalhar diretamente no checkout `~/Projects/starterkit`. Nenhum dado real de estoque é carregado.

Saída: revisão e versões registradas; ambiente reproduzível; falhas preexistentes separadas de novas falhas; decisão sobre vendor técnico confirmada na documentação (acme é o padrão já adotado).

### P01 — Contratos públicos e integração de qualidade

Dependência: P00. Entrega: módulo consegue usar o host sem imports internos.

Tarefas:

- P01.1 Exportar pelo module-kit apiRequest, ApiError e tipos públicos de resposta/opções necessários.
- P01.2 Adicionar headers permitidos, suporte a FormData e função tipada para downloads Blob/Response, preservando cookies, CSRF e normalização de erro.
- P01.3 Impedir sobrescrita de headers protegidos de sessão/CSRF; FormData não recebe Content-Type JSON nem boundary manual.
- P01.4 Definir política de retry: GET é seguro; escrita só repete com proteção documentada. Testar recuperação 419 preservando Idempotency-Key e corpo.
- P01.5 Corrigir imports internos do Customers pelo contrato público como regressão de compatibilidade, sem alterar seu domínio.
- P01.6 Cobrir modules/acme/inventory/tests no PHPUnit; configurar PSR-4 de teste no host, pois autoload-dev de pacote dependente não é carregado automaticamente.
- P01.7 Incluir testes TS/TSX do Inventory no Vitest e código do módulo no typecheck, PHPStan e formatação. Testes E2E no diretório já descoberto pelo host.
- P01.8 Documentar contratos adicionados e atualizar versão de core/compatibilidade como mudança MINOR.

Arquivos previstos do host: resources/spa/module-kit/index.ts; resources/spa/services/api/client.ts e testes; tipos HTTP; composer.json; phpunit.xml; phpstan.neon; vite.config.ts; tsconfig.json; package.json; configuração de formatação se necessária; docs de contrato/compatibilidade e config/modules.php. ci/local.yml só muda se os checks não descobrirem os novos alvos.

Testes: JSON/headers customizados; upload multipart; download e erro JSON; CSRF/sessão; retry protegido; suíte Customers; teste sentinela de Inventory provando descoberta nos runners e análise estática.

Saída: API pública utilizável; imports internos removidos no consumidor de referência; testes do módulo realmente executados; host sem regressão. Compatibilidade declarada coincide com a menor versão que fornece as novas APIs.

### P02 — Pacote modular, schema e autorização

Dependência: P01. Entrega: pacote instalado com migrations, página inicial e catálogo de permissões.

Tarefas:

- P02.1 Criar composer.json type starterkit-module, PSR-4 e package discovery para InventoryServiceProvider.
- P02.2 Criar module.json schemaVersion 1, inventory, displayName Almoxarifado de TI, versão 1.0.0 de lançamento, apiPrefix inventory, dependencies vazio, entrada resources/spa/module.ts.
- P02.3 Expandir todas as permissões individuais da especificação no manifesto; não usar abreviações com barra.
- P02.4 Adicionar acme/inventory à dependência do host pelo repository path existente e atualizar composer.lock.
- P02.5 Provider estende ModuleServiceProvider; registrar policies, rotas, comandos e bindings apenas quando habilitado.
- P02.6 Criar migrations em ordem de dependência e factories; adicionar índices/constraints e usar tipos do host para FK de usuários.
- P02.7 Criar comando inventory:install idempotente para local TI e valores de configuração; sem carga/consulta no boot.
- P02.8 Registrar página/rota inicial lazy e navegação protegida; usar componentes públicos.
- P02.9 Sincronizar permissões e testar habilitar/desabilitar/reabilitar sem perda de dados.

Schema em grupos de migrations novos:

1. Categorias, itens, variantes e local.
2. Lotes/linhas de importação inicialmente sem vínculo circular com movimentos.
3. Movimentos e linhas; ledger; balances.
4. Auditoria, idempotência e vínculos finais das linhas importadas, quando necessários.

Remover FK circular por ordem de criação/ALTER posterior explícito; migrations distribuídas não serão reescritas.

Tabelas conforme a especificação: inventory_categories, inventory_items, inventory_product_variants, inventory_locations, inventory_movements, inventory_movement_lines, inventory_ledger_entries, inventory_balances, inventory_audit_events, inventory_idempotency_keys, inventory_import_batches e inventory_import_rows.

Testes: migration limpa em MariaDB; unicidade code e location/variant; FKs; manifesto; prefixos; ausência de import privado; factory mínima; comportamento com módulo desabilitado.

Saída: diagnose válido, migrations descobertas, permissões sincronizadas, rota protegida e bundle compilado. Mantém dados após ciclo de habilitação. AC24.

### P03 — Categorias, códigos e variantes

Dependência: P02. Entrega: primeiro fluxo completo API + páginas + testes.

Tarefas:

- P03.1 DTOs, Actions, Requests, Queries, Resources e policies por operação do catálogo.
- P03.2 Normalizar código/nome, validar duplicidade e unidade; optimistic version em PATCH.
- P03.3 Variantes por marca/modelo/descrição, identidade normalizada e variante legada não identificada.
- P03.4 Inativação; impedir mudança de unidade/vínculo depois de movimento. Preparar guardas usados pelo livro.
- P03.5 Listas com filtros/paginação no servidor; forms dedicados e mapeamento de 422.
- P03.6 Detalhe do item com variantes e saldos iniciais zero; componentes reaproveitáveis do módulo para tabelas e seleção.

Actions: CreateCategoryAction, UpdateCategoryAction, CreateStockItemAction, UpdateStockItemAction, CreateProductVariantAction e UpdateProductVariantAction. Queries: ListCategoriesQuery, ListStockItemsQuery e ListProductVariantsQuery.

Frontend: CategoriesPage e formulário dedicado; ItemsPage, ItemCreatePage, ItemEditPage, ItemDetailPage; páginas/forms de variante; inventoryCatalogService via module-kit.

Testes: duas marcas no mesmo código, duplicidade normalizada, inativação, 401/403, versão obsoleta, formulário/422 e filtros URL.

Saída: catálogo funcional com rastreabilidade e autorização; AC01 e suporte inicial a AC16. RF01–RF03.

### P04 — Livro, concorrência e idempotência

Dependência: P03. Entrega: mecanismo consistente, testado antes das páginas de movimentação.

Tarefas:

- P04.1 Enums de tipo/estado/origem; DTOs de linha; ledger append-only com delta signed.
- P04.2 Serviço coeso de aplicação de lançamentos usado por confirmar, ajustar e estornar; Actions continuam controlando transações.
- P04.3 Criar/preparar saldos zero de variantes, com chave única; locks em itens e saldos na ordem definida.
- P04.4 Idempotência com hash canônico e chave composta; insert concorrente, rollback e recuperação de resultado sem dupla aplicação.
- P04.5 Validação de saldo atual e histórico para retroatividade; somente POSTED alimenta livro.
- P04.6 Query de saldo agregado sem mascarar variante negativa; extrato com saldo inicial e desempate estável.
- P04.7 Auditoria e eventos pós-commit; atualização essencial de saldo permanece dentro da transação.
- P04.8 inventory:reconcile somente leitura e saída estruturada por variante/local.

Classes previstas: PostMovementAction; StockLedgerWriter; ExecuteIdempotentOperation; BalanceQuery; ItemLedgerQuery; ReconcileInventoryCommand; exceções InsufficientStock, HistoricalStockConflict e VersionConflict.

Detalhes que precisam ser resolvidos nesta etapa:

- Bloquear linhas existentes; saldo inexistente criado com unicidade antes de adquirir lock.
- Mesmo item/variante em dois processos usa duas conexões/processos reais para teste, não execução serial simulando corrida.
- Retroatividade valida saldo em cada ponto afetado; lançamentos sem data do legado são exceção sinalizada, e itens ainda não saneados não operam.
- Resposta e fato de negócio persistem na mesma transação, ou resultado reconstruído de modo determinístico; não deixar chave 'concluída' sem movimento.
- Retry de deadlock limitado e seguro, sempre preservando idempotência.

Testes: disputa da última unidade, rollback de segunda linha, mesma chave concorrente, chave/corpo diferente, inserção de saldo inicial concorrente, empate de datas, extrato e reconciliação.

Saída: nenhuma escrita parcial; diferença livro/projeção zero; concorrência demonstrada no MariaDB. AC04–AC07, AC17, AC21–AC23. RNF01/RNF07.

### P05 — Rascunhos, entradas e saídas

Dependência: P04. Entrega: operação diária completa.

Tarefas:

- P05.1 CreateMovementDraftAction, UpdateMovementDraftAction e CancelMovementDraftAction; propriedade e manageDrafts.
- P05.2 Validação de confirmação por tipo: origem/documento em entrada; description, OS e observations em saída.
- P05.3 Custos decimais/NULL, snapshot de variante e valores calculados; evitar float.
- P05.4 Listar/detalhar movimentos; confirmar com version e chave estável; estado CANCELLED para descarte.
- P05.5 Forms multi-item, seleção de variante/saldo e linhas sem repetição.
- P05.6 Mostrar conflito de saldo/versão, conservar formulário e impedir duplo envio.
- P05.7 Garantir que 'sem OS' exige explicar ausência, mantendo finalidade em description separado.

Frontend: MovementsPage, MovementDetailPage, EntryCreatePage, IssueCreatePage e editor de rascunho; MovementLinesForm; movementService.

Testes: RF04/RF05/RF08, OS vazia/espaços, entrada doação sem documento, compra sem documento, 110 custos ausentes como cenário NULL, rascunho de outro usuário, falta de permissão e expiração de sessão.

Saída: entrada e saída alteram saldo uma vez; rascunho não altera saldo; confirmado não edita; OS/observações seguem regra aprovada. AC02–AC08 e AC19.

### P06 — Contagem, ajustes e estornos

Dependência: P05. Entrega: correção operacional sem apagar histórico.

Tarefas:

- P06.1 AdjustInventoryAction com contagem não negativa, expectedBalanceVersion e motivo.
- P06.2 Confirmação atomicamente calcula diferença; contagem sem diferença registra auditoria/conferência sem ledger zero.
- P06.3 ReverseMovementAction integral, UNIQUE reverses_movement_id e signs opostos.
- P06.4 Validar saldo antes de estornar entrada/ajuste positivo já consumido; bloquear estorno de estorno.
- P06.5 Auditoria do original e compensação, sem excluir efeitos do original das queries.
- P06.6 AdjustmentCreatePage e ação de estorno no detalhe, com prévia de impacto e motivo.

Testes: ajuste positivo/negativo/zero, movimento após tela da contagem, negativa por estorno, duas reversões concorrentes, almoxarife sem permissão, gestor autorizado.

Saída: contagem física e estorno preservam coerência; permissões no servidor. AC09–AC11, AC15 e AC17. RF06/RF07.

### P07 — Reposição por consumo e prazo

Dependência: P06. Entrega: recomendação reproduzível, com mínimo efetivo aprovado.

Tarefas:

- P07.1 ConfigureReplenishmentAction com permissão própria e versão do item.
- P07.2 Consumo líquido nos W dias completos anteriores; compensações somente de saída; entradas/ajustes não entram.
- P07.3 CalculateReplenishmentRecommendation usando relógio testável, prazo, segurança e cobertura histórica.
- P07.4 Aplicar arredondamento ao final: teto(média diária × prazo + segurança).
- P07.5 Não calculável com parâmetros NULL; histórico insuficiente com cobertura incompleta; consumo zero conserva segurança.
- P07.6 SituationQuery com prioridade variante inconsistente, sem estoque, não configurado, reposição e OK.
- P07.7 Painel de parâmetros/sugestão e ação explícita de aplicação; manter before/after auditáveis.

Não ativar scheduler para esta etapa. Calcular nas Queries; introduzir cache somente após medição e com invalidadores de movimentos/parâmetros.

Testes: 90/180 × 30 + 5 = 20; zero consumo + segurança5 = 5; virada de dia/fuso; estorno fora/dentro do intervalo; cobertura insuficiente; parâmetro zero vs NULL.

Saída: mínimo não muda automaticamente; administrador vê fonte/data/parâmetros do cálculo. AC12–AC14 e AC16. RF10.

### P08 — Dashboard, relatórios e exportação

Dependência: P06; usar P07 para dashboard de reposição completo.

Tarefas:

- P08.1 DashboardQuery: alertas, mínimos não configurados, consumo/entradas e asOf.
- P08.2 StockReportQuery, ReplenishmentReportQuery, ConsumptionReportQuery e AdjustmentsReportQuery com filtros do contrato.
- P08.3 Totais por unidade; informar custo desconhecido; não chamar custo de entrada de avaliação financeira do saldo.
- P08.4 Gerar CSV com proteção contra fórmulas e XLSX com conteúdo textual tipado.
- P08.5 Exportações com mesmos filtros, instante de referência e autorização/download privado.
- P08.6 ReportsPage e DashboardPage com estados acessíveis; legenda de situação e variante inconsistente.

Dependência XLSX: selecionar biblioteca PHP compatível com PHP 8.5 na implementação e declarar no Composer do módulo. Avaliar uma única biblioteca para leitura/escrita; testar extensões necessárias nas imagens Sail/produção. Não presumir que o ambiente atual possui todas as extensões.

Testes: filtros/períodos inclusivos, sem N+1, snapshot consistente entre saldo/extrato, unidades distintas, NULL monetário, fórmula CSV e usuário sem exportação.

Saída: RF09/RF11–RF13; relatórios conciliam com livro, exportação reproduz filtros e conserva significado das unidades.

### P09 — Importação assistida e saneamento

Dependências: P03 para análise; P04/P06/P08 para carga e reconciliação.

Entregas: adaptador versionado da planilha, lote/resoluções, carga atômica e relatório de migração.

Tarefas:

- P09.1 Ler estrutura real das abas/cabeçalhos, fórmulas e valores; mapear conforme especificação, sem executar macros/fórmulas.
- P09.2 Validar .xlsx real, 10 MB e limites de expansão/células; guardar arquivo privado com hash.
- P09.2a Configurar disco privado local e volume persistente gravável por www-data no serviço app; por exemplo /var/lib/starterkit-files, separado do estado modular. Ajustar Compose, Dockerfile/configuração de disco e guia de backup; não montar uploads no Nginx ou em public. Exercitar escrita e preservação após recriar container com read_only mantido.
- P09.3 AnalyzeInventoryImportAction produz proposta de categorias/códigos/variantes e erros por linha.
- P09.4 Categorias duplicadas e códigos com marcas diferentes viram mapa explícito; saídas ambíguas usam variante não identificada.
- P09.5 Correção restrita às cinco datas 30/05/2003 → 30/05/2023, mantendo payload original.
- P09.6 Datas/OS/custos ausentes recebem exceção legada, sem atribuir dados inventados. effective_on NULL fica separado em extratos.
- P09.7 ResolveImportRowsAction controla versão da análise; mudanças de resolução recalculam prontidão.
- P09.8 CommitInventoryImportAction com exclusividade de implantação, hash/idempotência e transação única para o volume atual.
- P09.9 Preservar saldos negativos históricos com relatório; exigir contagem e conciliação auditada antes de liberar operação.
- P09.10 ImportsPage com upload, prévia, resolução, confirmação e resultado; exportar reconciliação autorizada.

Serviços previstos: TiStockV12WorkbookReader; InventoryImportAnalyzer; ImportResolutionValidator; InventoryImportCommitter; ImportReconciliationQuery. Organização por capacidade, sem uma classe por célula/coluna.

Controles de origem: 178 entradas/3.936 unidades; 612 saídas/992 unidades; 110 códigos; saldo líquido2.944; custo conhecido R$114.987,98. Conferir em prévia contra o arquivo efetivamente usado. Não impor saldo2.944 após saneamento.

Negativos conhecidos: PEN02 -3, SSD01 -3, HDN02 -1, TN003 -1. Só aplicar ajustes após contagem; +3/+3/+1/+1 são exemplos condicionais a contagem zero, não valores autorizados automaticamente.

Testes: arquivo inválido; cabeçalho alterado; expansão excessiva; mapa ambíguo; cinco datas sem substituição global; custo NULL; três saídas sem data; reimportação; falha no meio/rollback; dois commits concorrentes; saldo por variante e agregado.

Saída: prévia mostra todas as exceções, cada linha rastreável, nenhuma carga parcial ou duplicada; histórico e saneamento distintos. AC18–AC23. RF14.

### P10 — Integração e homologação

Dependência: P07–P09 completas. Entrega: evidências dos 24 cenários e versão candidata.

Tarefas:

- P10.1 Executar checks completos do host + módulo; nenhuma suíte do módulo omitida.
- P10.2 E2E com operador, gestor, auditor e administrador operacional; não usar somente super-admin.
- P10.3 Executar AC01–AC24 com resultados vinculados aos testes.
- P10.4 Medir listas/dashboard/confirmar100 linhas no ambiente descrito; verificar metas propostas e N+1.
- P10.5 Validar build Docker de produção, boot, API autenticada, assets Inventory, migrations e permissões.
- P10.6 Repetir migração em banco de homologação e validar contagens/variante/saldos com CTI.
- P10.7 Preencher mínimos, prazos, segurança, unidade e papéis operacionais; confirmar cobertura histórica.
- P10.8 Exercitar backup e restauração do banco e dos arquivos privados em ambiente isolado.

Saída: defeitos críticos de integridade/autorização resolvidos; parâmetros configurados; negativos conciliados; aceite operacional registrado. Nenhum resultado de homologação deve ser afirmado antes de execução.

### P11 — Implantação e entrega

Dependência: P10 e decisão de implantação. Entrega: pacote/documentação e ambiente operacional validado.

Tarefas:

- P11.1 Criar artefatos reprodutíveis com lockfiles, versão/revisão e módulos incluídos.
- P11.2 Backup completo; confirmar restauração e janela de manutenção.
- P11.3 Instalar pacote, diagnosticar, executar migrations, inventory:install, sincronizar permissões, habilitar e construir/publicar assets da mesma revisão.
- P11.4 Efetivar lote em manutenção, conferir reconciliação e aplicar contagens aprovadas.
- P11.5 Fazer smoke autenticado e uma operação controlada auditável; liberar usuários após validação.
- P11.6 Entregar README, CHANGELOG, OpenAPI, guia de operação/importação/backup e limitações da versão.

Reversibilidade: desabilitar o módulo preserva seus dados; imagens anteriores só retornam se schema/contratos forem compatíveis. Não executar rollback destrutivo das migrations para desfazer implantação já com movimentos. Falha de migração deve ser resolvida antes de liberar operação; restauração de backup considera todos os lançamentos posteriores e exige decisão operacional.

Esta etapa é um roteiro futuro. Produção, migração real e publicação de release não são executadas pela geração deste plano.

## 6. Arquivos previstos e limites de responsabilidade

| Local | Conteúdo |
|---|---|
| modules/acme/inventory/composer.json e module.json | Pacote, compatibilidade, permissões e frontend entry |
| src/InventoryServiceProvider.php | Hooks do contrato modular |
| src/Application/Actions | Casos de uso de catálogo, rascunhos, confirmação, ajuste, estorno, parâmetros/importação |
| src/Application/DTOs | Dados tipados/imutáveis entre HTTP e regra |
| src/Application/Queries | Listas, extrato, saldo, sugestão e relatórios |
| src/Domain | Enums, eventos e falhas de negócio |
| src/Infrastructure | Leitura/escrita XLSX, armazenamento e operação de ledger/idempotência |
| src/Models e src/Policies | Relações/casts e autorização por capacidade/estado/propriedade |
| src/Http | Um Controller invocável por endpoint; Requests e Resources |
| database/migrations/factories | Schema versionado e dados de teste |
| resources/spa | module.ts, páginas, forms, seleção de variantes e services tipados |
| tests/Unit, Feature, Integration | Regras, API, MariaDB/concorrência e migração |
| tests/e2e/inventory*.spec.ts no host | Jornadas executadas pelo Playwright já configurado |
| docs/modules/inventory | Especificação, OpenAPI e guias operacionais |

Sem interface Repository genérica para cada Model. Criar abstrações somente em fronteiras reais. Manter auth/session/core errors via contratos públicos; frontend não copia estado global de sessão nem tokens.

## 7. Matriz de rastreabilidade

| Critérios da especificação | Etapas responsáveis |
|---|---|
| AC01 duas marcas e saldo agregado | P03/P04 |
| AC02–AC03 OS/observações | P05 |
| AC04–AC07 saldo/idempotência/corrida | P04/P05 |
| AC08 confirmado imutável | P05 |
| AC09–AC11 ajuste/estorno | P06 |
| AC12–AC14 recomendação | P07 |
| AC15 autorização de ajustes | P02/P06/P10 |
| AC16 mínimo auditado | P07 |
| AC17 original + estorno no livro | P04/P06 |
| AC18 datas corrigidas | P09 |
| AC19 custo desconhecido | P05/P08/P09 |
| AC20 lote duplicado | P09 |
| AC21 rollback | P04/P09 |
| AC22 extrato e saldo inicial | P04/P08 |
| AC23 variante negativa não mascarada | P04/P07/P09 |
| AC24 ciclo modular | P02/P10 |

RF01–03: P03; RF04–05/08: P05; RF06–07: P06; RF09/11–13: P08; RF10: P07; RF14: P09; RF15–16: transversais P02–P10. RNF01/07: P04/P09; RNF02: todas as rotas; RNF03: todas as páginas; RNF04: P01/P02/P10; RNF05/08: Queries e P10; RNF06: P01/P08/P09.

## 8. Verificação e comandos

Os comandos abaixo são para executar futuramente a partir da raiz `~/Projects/estoque`, após preparar o host com Docker/Sail. Foram confirmados na referência técnica, mas não executados neste repositório durante a geração deste plano.

    ./vendor/bin/sail composer format:check
    ./vendor/bin/sail composer analyse
    ./vendor/bin/sail artisan core:modules:diagnose --json
    ./vendor/bin/sail artisan test
    ./vendor/bin/sail npm run format:check
    ./vendor/bin/sail npm run lint
    ./vendor/bin/sail npm run typecheck
    ./vendor/bin/sail npm test
    ./vendor/bin/sail npm run build
    ./vendor/bin/sail npm run test:e2e

P01 deve alterar escopos para que esses comandos também cubram Inventory; passar os comandos atuais sem isso não prova qualidade do módulo.

Comandos planejados do novo módulo, ainda inexistentes:

    ./vendor/bin/sail artisan inventory:install
    ./vendor/bin/sail artisan inventory:reconcile --json

Checks proporcionais: cada etapa roda sua suíte focal mais verificações das superfícies alteradas; integração completa em P10. Não repetir build/suítes indiscriminadamente sem nova mudança ou falha que justifique.

Conservação de dados: bancos de teste e CI devem ser isolados. Nunca executar migrate:fresh ou remoção de volumes em ambiente com estoque real. Comandos de migrations operacionais só durante janela e com backup.

## 9. Definition of Done por entrega

- [ ] Requisitos da etapa implementados e demonstrados por critério de aceite.
- [ ] API/Resources/autorização completos; erros de negócio no envelope do host.
- [ ] Tests da etapa descobertos e executados; integridade MariaDB testada quando afetada.
- [ ] UI com 422, loading, vazio, falha, sessão e permissão.
- [ ] Documentação/contratos atualizados; nenhuma discrepância introduzida silenciosamente.
- [ ] Migração nova compatível, sem editar migrations distribuídas.
- [ ] Sem falhas novas de tipo/lint/análise estática/build quando pertinentes.
- [ ] Evidência de revisão, comando, resultado e limitações registrada.

## 10. Organização de entregas para revisão

Entregas sugeridas, mantendo cada conjunto revisável:

1. Contratos públicos + runners do host (P00/P01).
2. Pacote/schema/permissões (P02).
3. Catálogo e variantes com UI (P03).
4. Livro/idempotência + entrada/saída (P04/P05).
5. Ajuste/estorno (P06).
6. Reposição (P07).
7. Dashboard/relatórios/exportações (P08).
8. Importação/saneamento (P09).
9. Homologação/documentação/empacotamento (P10/P11).

Não estimar calendário fechado antes de preparar o ambiente e medir P01/P04. O acompanhamento registra estado PLANEJADO, EM_ANDAMENTO, EM_VALIDACAO ou CONCLUIDO, dependência, revisão e evidência por etapa.

## 11. Riscos concretos e tratamento

| Risco | Tratamento no plano |
|---|---|
| API pública insuficiente e imports internos no exemplo | P01 publica contrato e corrige consumidor; faixa mínima correta |
| Suíte do módulo ignorada pelo host | Prova de descoberta, autoload de tests e alvos explícitos em P01 |
| Dupla baixa/idempotência frágil | Locks + uniques + duas conexões/processos em P04 |
| Marca desconhecida no legado | Variante não identificada e contagem em P09 |
| Data/custo ausente | NULL com exceção e relatório de cobertura, sem dados inventados |
| Biblioteca XLSX incompatível/extensões faltantes | Resolver dependência e exercitar em Sail/produção P08/P09 |
| Arquivo fonte perdido ao recriar container | Volume privado persistente, backup e teste de recuperação em P09/P10 |
| Quantidade por código mascara variante negativa | Situação INCONSISTENT prioritária e bloqueio até conciliação |
| Retentativa CSRF duplica escrita | Chave estável e retry protegido P01/P04/P05 |
| Backdating altera saldo histórico | Validação da sequência sob lock; exceções legadas segregadas |
| Downgrade com schema incompatível | Estratégia expandir/preservar e validar imagens no P10/P11 |

## 12. Condição para iniciar

O plano permite começar P00 e P01 com dados fictícios. Mínimos, prazos de compra, segurança, distribuição física por marca e usuários são necessários para a implantação, mas não impedem desenvolver os fluxos e testes. O primeiro marco é demonstrar que Inventory usa somente contratos públicos do host e que todas as suas suítes estão efetivamente incluídas.
