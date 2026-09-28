# Análise funcional e modelagem — Módulo de Almoxarifado de TI

**Versão:** 0.1
**Data:** 26/09/2026
**Fontes:** Controle Estoque - TI v1.2.xlsx e alanfm/starterkit (main), consultado como referência técnica.

## 1. Síntese

O módulo substituirá a planilha por um catálogo único de itens e um livro auditável de movimentações. Entradas, saídas, ajustes e estornos alteram o saldo de forma transacional; o saldo nunca é digitado diretamente.

Embora seja essencial para a CTI, estoque é uma funcionalidade de negócio. Deve ser implementado como pacote local em `modules/acme/inventory`, integrado ao core que será mantido na raiz `~/Projects/estoque`, e **não** como código dentro de `app/Core`. O repositório Starterkit é referência de arquitetura/contratos, não o diretório de implementação. Sugestão: módulo inventory, nome “Almoxarifado de TI”, API sob /api/v1/inventory.

### Decisões aprovadas pela CTI

1. O código identifica um item agregado, que pode reunir produtos equivalentes de diferentes marcas e modelos.
2. A saída pode não ter OS, mas nesse caso o campo observações é obrigatório e deve explicar por que a OS não foi informada.
3. O estoque mínimo efetivo é informado/aprovado pelo operador administrador. O sistema também calcula uma recomendação baseada no consumo e no prazo de compra.
4. Saldos negativos serão saneados sem apagar ou modificar silenciosamente o histórico original.
5. As cinco movimentações registradas em 30/05/2003 devem ser corrigidas para 30/05/2023, preservando a data original na auditoria da importação.
6. Toda entrada terá uma origem obrigatória. O número do documento poderá ser dispensado conforme a origem, com justificativa.
7. O MVP terá um único local, Almoxarifado TI, mantendo a entidade de local para evolução futura.
8. As quantidades serão inteiras no MVP.
9. Almoxarife registra entradas e saídas; gestor realiza ajustes e estornos; auditor possui acesso somente para consulta.

## 2. Diagnóstico da planilha

A pasta possui cinco áreas lógicas:

1. Saídas/consumo: código, quantidade, categoria, item, atendimento, OS, data, saldo e status.
2. Entradas: código, quantidade, categoria, item, descrição, data, valor unitário/total e processo/documento.
3. Cabeçalho vazio preparado para entradas.
4. Consolidações por OS, data e categoria, incluindo itens mais consumidos.
5. Catálogo auxiliar de categorias.

| Indicador | Resultado |
|---|---:|
| Registros / quantidade de saída | 612 / 992 unidades |
| Registros / quantidade de entrada | 178 / 3.936 unidades |
| SKUs distintos | 110 |
| Saldo calculado | 2.944 unidades |
| Valor histórico das entradas | R$ 114.987,98 |
| SKUs positivos / zerados / negativos | 100 / 6 / 4 |
| SKUs sem saída | 49 |
| Categorias | 38 linhas / 36 únicas |

### Regras implícitas

- O saldo histórico por código é coerente com entradas menos saídas.
- OK e Reposição dependem de limite específico por SKU, não de um limite global.
- Exemplos inferidos: SSD01/SSD02 entram em reposição até 40; FO001 até 24; KT001 até 9; PM001, CP001, MPC04 e BT004 até 1.
- Uma OS pode agrupar vários itens de saída; processo, nota ou doação referencia entradas.

### Problemas de qualidade

- Saldos negativos: PEN02=-3, SSD01=-3, HDN02=-1 e TN003=-1.
- Quatorze códigos têm descrições divergentes, incluindo FL001, TC001, BT002, WC003, TN001 e TN004. Com a decisão da CTI, essas descrições devem ser tratadas como possíveis variantes de marca/modelo sob o mesmo código, após validação de equivalência funcional.
- Cinco saídas aparecem em 30/05/2003 entre registros de 2023. A CTI confirmou a correção para 30/05/2023.
- 110 entradas não têm valor unitário; 89 não têm processo/documento; seis saídas não têm OS; três não têm data.
- Conectores e Patch Cord estão duplicados na lista auxiliar; Ferramentas não é usada.
- Valor desconhecido está sendo tratado como zero. No sistema deve ser NULL.
- Status não deve ser persistido manualmente; deve ser calculado.

## 3. Escopo do MVP

1. Dashboard.
2. Categorias, itens agregados/códigos e variantes de produto.
3. Entradas e saídas multi-item.
4. Ajuste de inventário justificado.
5. Estorno de movimento.
6. Extrato por item e consulta geral de movimentos.
7. Relatórios de saldo, reposição e consumo.
8. Importação assistida da planilha.
9. Controle de acesso por permissões.

Ficam fora do MVP: compras/licitação, integração automática com chamados, patrimônio individualizado, empréstimos/devoluções, multitenancy, previsão de demanda e código de barras.

## 4. Atores

| Ator sugerido | Responsabilidade |
|---|---|
| Consulta | Dashboard, saldos, movimentos e relatórios. |
| Almoxarife | Entradas, saídas e consultas. |
| Gestor | Catálogo, ajustes, estornos e exportações. |
| Auditor | Histórico, ajustes, estornos e importações sem escrita. |
| Administrador | Papéis e permissões pelo core. |

Esses são papéis sugeridos. Backend e frontend autorizam por permissões efetivas, nunca pelo nome do papel.

## 5. Fluxos

### Entrada

Criar rascunho → informar data, origem, documento quando aplicável e linhas com código/variante → validar → confirmar → atualizar saldos na mesma transação. Movimento confirmado é imutável.

### Saída

Criar rascunho → informar OS quando existente, observações e linhas → validar saldo → confirmar atomicamente. Sem OS, observações tornam-se obrigatórias e devem explicar sua ausência. Quantidade maior que o disponível retorna conflito e não grava parcialmente.

### Ajuste

Informar item, saldo contado e justificativa → mostrar saldo anterior/diferença → confirmar movimento de ajuste, sem reescrever o histórico.

### Estorno

Selecionar movimento confirmado → justificar → criar movimento compensatório vinculado. Original e estorno permanecem consultáveis.

### Importação

Analisar arquivo → exibir conflitos → resolver códigos/datas/saldos → gravar lote e linhas de origem → reconciliar planilha e sistema.

## 6. Regras de negócio

- Código é obrigatório, único sem considerar caixa e identifica um item agregado funcionalmente equivalente.
- Um código pode possuir várias variantes de produto, com marca, modelo e descrição próprios.
- Categoria é uma classificação superior ao código. Exemplo conceitual: categoria Periféricos → código TC001/Teclado USB → variantes por marca e modelo.
- Produtos só podem compartilhar um código quando forem intercambiáveis para a finalidade operacional definida pela CTI. Diferenças de capacidade, compatibilidade ou aplicação exigem outro código.
- Item movimentado não é excluído; pode ser inativado.
- Estoque mínimo efetivo é informado ou aprovado pelo operador administrador para cada código.
- O sistema calcula estoque mínimo recomendado por consumo histórico e prazo de compra, mas não altera automaticamente o valor efetivo.
- Quantidade é inteira e maior que zero no domínio atual.
- Movimento confirmado não pode ser editado ou apagado.
- Estorno só ocorre uma vez e por movimento compensatório.
- Saída que geraria saldo negativo é bloqueada com 409.
- Ajuste negativo exige permissão e justificativa.
- Saldos usam transação e bloqueio de linha contra dupla baixa concorrente.
- Data do fato e data/hora do registro são distintas.
- Valor unitário usa decimal; valor desconhecido é NULL.
- Lote, aba e linha original são preservados na importação.
- Entrada exige origem: compra, doação, transferência, devolução, estoque inicial, ajuste ou outra. Documento é obrigatório para compra; nas origens sem documento, justificativa é obrigatória.
- Saída sem OS exige observações não vazias explicando a ausência da OS.

### Regra de reposição recomendada

O sistema deve calcular uma sugestão, sem substituir a decisão do administrador:

    consumo médio diário = saídas no período de análise / dias do período
    ponto de reposição sugerido =
        teto(consumo médio diário × prazo de compra em dias + estoque de segurança)

- O prazo de compra é informado pelo administrador por código.
- O estoque de segurança também é configurável por código.
- O período de análise deve ser configurável; sugestão inicial: últimos 180 dias.
- Períodos sem consumo geram recomendação zero, mas não apagam o mínimo efetivo.
- Consumos excepcionais podem ser excluídos do cálculo somente com justificativa e trilha de auditoria.
- A tela deve mostrar valor efetivo, valor sugerido, parâmetros, data do cálculo e diferença.
- Alterar o mínimo efetivo exige permissão inventory.items.update e registra usuário/data.

Situação calculada:

    saldo < 0                      → INCONSISTENTE
    saldo = 0                      → SEM_ESTOQUE
    0 < saldo <= estoque mínimo    → REPOSICAO
    saldo > estoque mínimo         → OK
    mínimo não configurado         → NAO_CONFIGURADO

## 7. Modelo de domínio

    Category 1 ── N StockItem 1 ── N ProductVariant
    StockMovement 1 ── N StockMovementLine N ── 1 ProductVariant
    StockLocation 1 ── N InventoryBalance N ── 1 ProductVariant
    StockMovement 0..1 ── reverses ── 1 StockMovement
    ImportBatch 1 ── N ImportRow ── 0..1 StockMovementLine

### Tabelas

- inventory_categories: id, name único, active, timestamps.
- inventory_items: código agregado único, category_id, nome funcional, descrição, unidade, minimum_stock efetivo, purchase_lead_time_days, safety_stock, recommendation_window_days, active, created_by e updated_by.
- inventory_product_variants: item_id, marca, modelo, descrição/especificação, active e timestamps. Representa os produtos equivalentes de marcas diferentes que compartilham o código do item.
- inventory_locations: uma linha inicial “Almoxarifado TI”; prepara evolução física sem introduzir multitenancy.
- inventory_movements: location, type, status, occurred_on, service_order_number nullable, reference_type/number, observations nullable, movimento estornado, motivo, usuários e timestamps de confirmação/estorno. Em movimentos de saída, observations é obrigatório quando service_order_number não for informado.
- inventory_movement_lines: movement_id, item_id, product_variant_id, quantity, unit_cost nullable, snapshot do legado e import_row_id.
- inventory_balances: chave única location/variante, quantity e versão de concorrência. O saldo do código é a soma de suas variantes.
- inventory_import_batches/rows: hash do arquivo, estado, contagens, payload normalizado, erros e vínculos criados.

Tipos: ENTRY, ISSUE, ADJUSTMENT_IN, ADJUSTMENT_OUT e REVERSAL. Estados: DRAFT, POSTED e REVERSED.

O livro de movimentos é a fonte auditável; inventory_balances é a projeção transacional de leitura rápida e deve ser sempre reconciliável.

Na saída, o operador seleciona a variante física entregue. O dashboard e os alertas de reposição consolidam o saldo no nível do código agregado.

## 8. Permissões

    inventory.dashboard.view
    inventory.categories.viewAny
    inventory.categories.create
    inventory.categories.update
    inventory.items.viewAny
    inventory.items.view
    inventory.items.create
    inventory.items.update
    inventory.variants.create
    inventory.variants.update
    inventory.movements.viewAny
    inventory.movements.view
    inventory.entries.create
    inventory.issues.create
    inventory.adjustments.create
    inventory.movements.reverse
    inventory.reports.view
    inventory.reports.export
    inventory.imports.execute

## 9. Telas

| Rota proposta | Tela |
|---|---|
| /admin/inventory | Dashboard e alertas. |
| /admin/inventory/items | Catálogo, filtros e saldos. |
| /admin/inventory/items/new | Novo item. |
| /admin/inventory/items/{id} | Detalhe, variantes, saldo consolidado e extrato. |
| /admin/inventory/items/{id}/edit | Edição. |
| /admin/inventory/movements | Livro de movimentos. |
| /admin/inventory/entries/new | Entrada multi-item. |
| /admin/inventory/issues/new | Saída multi-item. |
| /admin/inventory/adjustments/new | Ajuste por contagem. |
| /admin/inventory/movements/{id} | Detalhes e estorno. |
| /admin/inventory/categories | Categorias. |
| /admin/inventory/reports | Saldo, reposição e consumo. |
| /admin/inventory/imports | Prévia e histórico de importações. |

Filtros e paginação permanecem na URL. Criação e edição usam páginas dedicadas, seguindo o padrão do starterkit.

## 10. API conceitual

| Método | Endpoint | Operação |
|---|---|---|
| GET | /api/v1/inventory/dashboard | Indicadores. |
| GET/POST | /api/v1/inventory/categories | Listar/criar categorias. |
| PATCH | /api/v1/inventory/categories/{category} | Atualizar/inativar. |
| GET/POST | /api/v1/inventory/items | Listar/criar itens. |
| GET/PATCH | /api/v1/inventory/items/{item} | Consultar/atualizar. |
| GET/POST | /api/v1/inventory/items/{item}/variants | Listar/criar variantes. |
| PATCH | /api/v1/inventory/items/{item}/variants/{variant} | Atualizar/inativar variante. |
| GET | /api/v1/inventory/items/{item}/ledger | Extrato. |
| GET/POST | /api/v1/inventory/movements | Listar/criar rascunho. |
| GET/PATCH | /api/v1/inventory/movements/{movement} | Consultar/editar rascunho. |
| POST | /api/v1/inventory/movements/{movement}/post | Confirmar. |
| POST | /api/v1/inventory/movements/{movement}/reverse | Estornar. |
| GET | /api/v1/inventory/reports/replenishment | Reposição. |
| GET | /api/v1/inventory/reports/consumption | Consumo. |
| POST | /api/v1/inventory/imports/analyze | Analisar arquivo. |
| POST | /api/v1/inventory/imports/{batch}/commit | Efetivar lote validado. |

Todos usam sessão/Sanctum na mesma origem, Resources JSON e autorização no backend. Confirmação e estorno devem ter proteção de idempotência. Conflito de saldo retorna 409 no envelope padrão.

## 11. Relatórios

- Posição atual por código, item, categoria, saldo, mínimo e situação.
- Itens a repor, zerados e inconsistentes.
- Extrato por item com saldo após cada movimento.
- Entradas por período e origem/documento.
- Saídas por período, categoria, item e OS.
- Itens mais consumidos.
- Ajustes e estornos.
- Exportação autorizada em CSV/XLSX.
- Indicador de itens sem mínimo configurado.
- Reconciliação entre livro e projeção de saldo.

## 12. Estratégia de migração

### Preparação

1. Congelar a versão fonte e calcular seu hash.
2. Normalizar categorias sem modificar o original.
3. Criar mapa código → item agregado → variantes de marca/modelo.
4. Validar a equivalência funcional das variantes sob cada um dos 14 códigos divergentes.
5. Corrigir as cinco datas de 30/05/2003 para 30/05/2023, preservando valor original e decisão da CTI no lote.
6. Conciliar os quatro saldos negativos por entrada ausente, separação de variante ou ajuste inicial auditado.
7. Carregar os mínimos históricos como sugestão; o operador administrador confirma o valor efetivo, o prazo de compra e o estoque de segurança.

### Carga

1. Categorias.
2. Itens agregados, variantes e parâmetros de reposição.
3. Local padrão Almoxarifado TI.
4. Entradas históricas, preservando a linha de origem.
5. Saídas históricas, agrupadas por data/OS/descrição somente quando seguro.
6. Projeção dos saldos.
7. Reconciliação por SKU.

Não se recomenda importar apenas o saldo inicial, pois isso descartaria o histórico necessário aos relatórios. Linha sem valor conhecido usa unit_cost NULL.

### Aceite da migração

- 110 SKUs classificados ou marcados para revisão.
- Quantidades reconciliadas por código.
- Nenhum código ambíguo importado silenciosamente.
- Correções preservam o valor original.
- Saldo negativo só permanece como exceção explicitamente aceita.
- Relatório informa lidos, importados, corrigidos, ignorados e rejeitados.

## 13. Backlog

### A — Saneamento

- Validar a equivalência funcional das variantes por código.
- Aplicar a correção aprovada das datas, preservando o original.
- Definir mínimo efetivo, prazo de compra e segurança por código.
- Conciliar negativos.
- Aprovar bloqueio de saldo insuficiente.
- Definir vendor/nome final do pacote.

### B — Fundação

- Criar Composer package e module.json para core ^1.0.0.
- Provider, migrations, frontend entry, navegação e permissões.
- Factories, policies e infraestrutura de testes.

### C — Catálogo

- Categorias.
- Itens e inativação.
- Variantes por marca/modelo.
- Busca, filtros, paginação e código agregado único.
- Estoque mínimo efetivo e sugestão por consumo/prazo.

### D — Livro e saldo

- Rascunhos multi-item.
- Confirmação de entrada e saída.
- Bloqueio concorrente.
- Ajuste, estorno, extrato e reconciliação.

### E — Operação

- Dashboard.
- Reposição, consumo e filtros por referência/período.
- Exportações.

### F — Migração

- Analisador, prévia e resolução de conflitos.
- Importação idempotente por hash/lote.
- Relatório de reconciliação.

### G — Qualidade

- Testes unitários das regras.
- Integração MariaDB e concorrência.
- API e autorização.
- Frontend e respostas 422.
- E2E: entrada, saída, saldo insuficiente, ajuste e estorno.
- Diagnóstico do manifesto e build SPA.

## 14. Critérios de aceite do MVP

1. Código agregado é único, aceita variantes equivalentes por marca/modelo e possui mínimo configurável.
2. Entrada e saída alteram saldo exatamente uma vez.
3. Duas saídas concorrentes não consomem a mesma unidade.
4. Saída acima do saldo falha sem escrita parcial.
5. Saída sem OS só é aceita com observações obrigatórias explicando sua ausência.
6. Movimento confirmado é imutável.
7. Estorno cria compensação e restaura o saldo esperado.
8. Reposição usa o mínimo efetivo aprovado e exibe recomendação baseada em consumo, prazo e segurança.
9. Backend aplica todas as permissões e reserva ajustes/estornos ao gestor.
10. Histórico registra data do fato, data de registro e usuário.
11. API segue filtros, paginação e erros do starterkit.
12. Reimportação não duplica lote.
13. Livro e inventory_balances reconciliam com diferença zero.

## 15. Parâmetros operacionais ainda a configurar

As decisões funcionais foram aprovadas. Restam parâmetros de implantação que não alteram a modelagem:

1. Valor efetivo inicial do estoque mínimo para cada código.
2. Prazo médio de compra em dias para cada código ou grupo de códigos.
3. Estoque de segurança por código.
4. Confirmação do período padrão do cálculo de consumo; proposta inicial: 180 dias.
5. Identificação das variantes equivalentes existentes em cada código.
6. Resultado da contagem física dos quatro códigos com saldo negativo.
7. Usuários que receberão os papéis de almoxarife, gestor e auditor.

## 16. Próxima etapa

Realizar uma oficina curta de saneamento para preencher os parâmetros da seção 15 e conferir as variantes. Em seguida, produzir a especificação técnica: manifesto definitivo, migrations, contratos HTTP, DTOs/Actions/Queries, matriz de testes e roteiro de importação. A implementação deve avançar em fatias verticais: catálogo/variantes → entrada → saída → ajuste/estorno → relatórios → migração.
