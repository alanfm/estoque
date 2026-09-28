# Especificação funcional e técnica — Almoxarifado de TI

Versão do documento: 1.0 • Data: 26/09/2026

Status: base para o plano de implementação. Requisitos aprovados pela CTI estão identificados como decisões; escolhas técnicas e parâmetros padrão são definições desta especificação, ajustáveis antes da implementação. Este documento não registra código implementado ou testes executados.

Documento relacionado: [Análise funcional e modelagem](./analise-funcional-almoxarifado.md).

Esta especificação detalha e prevalece sobre as propostas técnicas preliminares da análise quando houver diferença: ajustes usam contagem com delta assinado; observações são separadas da descrição do atendimento; consumo zero mantém o estoque de segurança; autorização para configurar reposição é específica. As decisões da CTI permanecem preservadas.

## 1. Objetivo e fontes

Fornecer à CTI controle de materiais por código agregado e produto de marca/modelo, entradas, consumo, inventário, estornos e reposição. O sistema substitui a operação da planilha e preserva seu histórico com rastreabilidade.

Fontes: Controle Estoque - TI v1.2.xlsx; decisões da CTI nesta conversa; documentação do starterkit consultada em 26/09/2026:

- [Arquitetura](https://github.com/alanfm/starterkit/blob/main/docs/architecture.md).
- [Contrato modular](https://github.com/alanfm/starterkit/blob/main/docs/module-contract.md).
- [Convenções da API](https://github.com/alanfm/starterkit/blob/main/docs/api-conventions.md).
- [Compatibilidade](https://github.com/alanfm/starterkit/blob/main/docs/compatibility-policy.md).

## 2. Decisões e fronteira

| ID | Decisão aprovada | Consequência |
|---|---|---|
| D01 | Código reúne produtos de marcas diferentes | Item agregado com variantes vinculadas; saldo agregado e detalhado |
| D02 | Saída sem OS é permitida, com observações obrigatórias | OS opcional; explicação de ausência obrigatória quando vazia |
| D03 | Administrador informa valores; reposição considera consumo e prazo de compra | Mínimo efetivo manual e sugestão calculada separada |
| D04 | Correções de saldo preservam o histórico | Conciliação com lançamento auditado; sem alteração silenciosa |
| D05 | Cinco datas de 2003 são de 2023 | Corrigir somente ocorrências identificadas e preservar original |
| D06 | Entrada exige origem; documento depende da origem | Compra exige documento; entrada sem documento exige justificativa |
| D07 | Um local no MVP, entidade preparada para evolução | Almoxarifado TI; sem transferências entre locais na interface inicial |
| D08 | Quantidades inteiras | Unidade, par ou caixa são unidades de estoque indivisíveis |
| D09 | Almoxarife movimenta; gestor ajusta/estorna; auditor consulta | Permissões específicas no servidor |

O almoxarifado será um módulo de negócio instalado no core do host, cuja raiz do projeto é `~/Projects/estoque`. Seus dados, regras, migrations e páginas pertencem ao pacote local `modules/acme/inventory`. Autenticação, usuários, papéis, componentes públicos e envelopes HTTP são serviços do host. O repositório `alanfm/starterkit` é referência técnica; não é o diretório de trabalho nem receberá as alterações deste projeto.

Fora da versão inicial: compras/licitação, pedidos de reposição com aprovação, integração com chamados, empréstimos, tombamento, múltiplos locais operacionais, movimentação fracionária e códigos de barras.

## 3. Vocabulário e invariantes

| Conceito | Definição |
|---|---|
| Categoria | Classificação existente, como Teclado, Memória ou Fonte |
| Item/código | Família operacional identificada pelo código, por exemplo TC001 |
| Variante | Produto de uma marca/modelo/especificação vinculado ao código |
| Movimento | Documento com data, tipo, referências e linhas |
| Linha | Quantidade de uma variante em um movimento |
| Saldo da variante | Soma dos lançamentos assinados dessa variante/local |
| Saldo do código | Soma dos saldos de suas variantes |
| Mínimo efetivo | Limite de reposição aprovado pelo administrador |
| Mínimo sugerido | Resultado do cálculo de consumo, prazo e segurança |

Categoria não é substituída pelo código. Marcas diferentes podem compartilhar o código; a CTI define a abrangência funcional da família. A aplicação não deduz equivalência técnica somente pelo nome. Produtos com aplicação ou capacidade incompatível são apresentados para saneamento.

Invariantes obrigatórios:

1. Cada variante pertence a exatamente um item; esse vínculo não muda depois de movimentada.
2. Cada movimento confirmado altera saldos exatamente uma vez.
3. A soma do livro por variante/local deve coincidir com o saldo projetado.
4. Novas operações operacionais não geram saldo negativo.
5. Movimento confirmado, linhas e lançamentos não são editados ou apagados.
6. Original e estorno são contados no livro; marcar o original como estornado não remove seu efeito histórico.
7. Valor desconhecido é NULL e não zero.
8. Quantidade nunca muda de unidade implicitamente: um par e uma unidade individual exigem conversão definida ou códigos distintos.

## 4. Requisitos funcionais

| ID | Requisito | Critério observável |
|---|---|---|
| RF01 | Categorias | Listar, criar, atualizar e inativar; nomes únicos normalizados |
| RF02 | Itens | Código único, nome, categoria, unidade, atividade e parâmetros |
| RF03 | Variantes | Marca/modelo/descrição e saldo por variante; conservar histórico |
| RF04 | Entradas | Rascunho multi-item; origem/documento; confirmação aumenta saldo |
| RF05 | Saídas | Rascunho multi-item; OS opcional; observações condicionais |
| RF06 | Inventário | Gestor registra contagem e diferença auditável |
| RF07 | Estorno | Gestor cria compensação integral; motivo obrigatório |
| RF08 | Livro | Filtrar por data, código, variante, categoria, OS, documento e tipo |
| RF09 | Extrato | Saldo inicial do período, movimentos e saldo final |
| RF10 | Reposição | Situação pelo mínimo efetivo; sugestão e parâmetros visíveis |
| RF11 | Dashboard | Alertas, itens sem mínimo, entradas e saídas do período |
| RF12 | Relatórios | Saldo, reposição, consumo e ajustes/estornos |
| RF13 | Exportação | CSV/XLSX com mesmos filtros e autorização |
| RF14 | Importação | Prévia, saneamento, execução idempotente e reconciliação |
| RF15 | Auditoria | Usuário, instante, motivo e valores anteriores/posteriores |
| RF16 | Permissões | Cada escrita/leitura autorizada no backend |

## 5. Cadastros e validações

### 5.1 Categoria, item e variante

- Categoria: name entre 1 e 120 caracteres após trim; chave normalizada única; active boolean.
- Item: code entre 1 e 32 caracteres, normalizado em maiúsculas; padrão inicial [A-Z0-9_-]; name até 200; description até 5.000; categoria obrigatória.
- Unidade: UN, PAR ou CX. Unidade é congelada depois do primeiro lançamento.
- Variante: brand/model opcionais até 120 caracteres; description obrigatória até 2.000. Sem identificação no legado, usar variante explícita 'Marca/modelo não identificado'.
- Código e categoria aceitam variantes de marcas distintas; descrições históricas permanecem no snapshot da linha.
- Inativação preserva registros. Item/variante com saldo positivo pode ser inativado, mas novo movimento exige reativação; a interface informa o saldo remanescente.
- Categoria inativa não aceita novos itens; não oculta itens históricos.
- Variante não pode mudar de item após movimento confirmado. Duplicidade de variante é detectada pela combinação normalizada item/marca/modelo/descrição.
- Mínimo e segurança são inteiros não negativos; prazo de compra é inteiro não negativo. NULL significa parâmetro ainda não configurado.

### 5.2 Movimento

Tipos operacionais: ENTRY, ISSUE e ADJUSTMENT. REVERSAL é gerado pelo sistema. Ajustes possuem linhas com quantidade contada; os lançamentos derivados recebem sinal positivo ou negativo.

Campos comuns: occurredOn, locationId, description (atendimento/finalidade), observations, lines e version. A descrição do atendimento continua separada das observações que explicam ausência de OS.

| Campo | Entrada | Saída | Ajuste/estorno |
|---|---|---|---|
| Data do fato | Obrigatória na confirmação | Obrigatória na confirmação | Obrigatória |
| Descrição/finalidade | Opcional | Obrigatória | Motivo obrigatório |
| Origem | Obrigatória | Não aplicável | Não aplicável |
| OS | Não aplicável | Opcional, texto até 120 | Não aplicável |
| Documento | Obrigatório para compra | Não aplicável | Não aplicável |
| Observações | Obrigatórias se não houver documento | Obrigatórias se não houver OS | Opcional, além do motivo |
| Quantidade | Inteiro > 0 | Inteiro > 0 | Contagem inteira >= 0 |
| Custo unitário | Decimal >= 0 ou NULL | Não informado | Não informado |

Origens: PURCHASE, DONATION, INITIAL_STOCK, RETURN, TRANSFER_RECEIPT e OTHER. TRANSFER_RECEIPT referencia material recebido externamente; não implementa transferência interna entre dois locais.

Campos inaplicáveis ao tipo são rejeitados. OS e documento são strings, pois o legado contém referências compostas. Não existe tabela de OS nem validação de existência em outro sistema nesta versão.

Observações e justificativas com apenas espaços são inválidas. Não há tamanho mínimo arbitrário para comprovar qualidade do texto: o sistema exige conteúdo e o responsável verifica o motivo.

Rascunhos podem ter campos incompletos. POST de criação exige tipo e local; confirmação revalida todos os campos e linhas. Máximo técnico inicial: 100 variantes por movimento. Variante repetida é rejeitada, com orientação para consolidar quantidade.

Data de nova operação não pode ser futura em relação ao fuso do host. Retroatividade é permitida; recordedAt/postedAt preservam quando foi registrada. Novas saídas retroativas devem manter saldo não negativo tanto atualmente quanto na sequência histórica por variante.

## 6. Ciclo de vida e operações

### 6.1 Rascunho

DRAFT → POSTED → REVERSED. DRAFT também pode ser descartado, ficando CANCELLED. Descarte é lógico e auditado. Rascunhos não reservam nem alteram estoque.

O criador pode editar, confirmar e descartar seus rascunhos se mantiver permissão para o tipo. Gestor pode administrar rascunhos de outros usuários por inventory.movements.manageDrafts. A autorização verifica permissão e propriedade; o superadministrador segue o bypass central do core.

### 6.2 Confirmar entrada ou saída

Validar versão esperada, estado, usuário, dados e variantes. Abrir transação, bloquear item agregado e saldos das variantes em ordem determinística, revalidar disponibilidade, gravar lançamentos e atualizar projeções. Estado, postedBy e postedAt são gravados na mesma transação.

Em saída, escolher variante física e mostrar saldo daquela variante. Saldo agregado suficiente não permite retirar uma variante que está sem unidades. O operador pode distribuir a saída entre variantes disponíveis.

### 6.3 Inventário

Gestor informa contagem por variante, motivo e saldo/versão que viu na tela. Ao confirmar, bloquear saldos e rejeitar se mudou desde a contagem (409 BALANCE_CHANGED). Após atualizar a tela e conferir a contagem, pode reenviar.

Diferença = quantidade contada - saldo atual. Contagem sem diferença não cria lançamento de estoque, mas registra a conferência e o motivo. Ajuste é efetivo no instante de confirmação; não é retrodatado. Isso evita alterar a interpretação de uma contagem física atual.

### 6.4 Estorno

Estorno integral no MVP. Cria outro movimento POSTED e lançamentos com sinais opostos aos originais. O original passa a REVERSED com vínculo único para a compensação.

Reversão de entrada ou ajuste positivo é bloqueada se retirar unidades já consumidas e produzir negativo. Gestor deve primeiro regularizar a situação por movimentos legítimos; permissão de estorno não autoriza ignorar saldo insuficiente.

Estorno tem data efetiva atual, usuário e motivo. Estorno de estorno é proibido. Para corrigir operação, estornar e criar um novo movimento; correção parcial usa ajuste justificado.

### 6.5 Concorrência e repetição

- PATCH de cadastros/rascunhos exige version; versão desatualizada retorna 409 VERSION_CONFLICT.
- Confirmar, ajustar, estornar e efetivar importação exigem Idempotency-Key.
- Escopo da chave: usuário + operação + recurso; guardar hash do payload e resultado durável.
- Mesma chave e payload retorna o resultado original; mesma chave e payload diferente retorna 409 IDEMPOTENCY_CONFLICT.
- A unicidade do estorno e os estados do movimento continuam protegidos por restrições/transações, mesmo com outra chave.
- Ordens de bloqueio: itens por ID e depois variantes/saldos por ID; evita inversão de locks.

## 7. Reposição

O limite efetivo é responsabilidade do operador administrador, habilitado por inventory.items.configureReplenishment. A sugestão não altera automaticamente esse limite.

Consumo elegível: saídas confirmadas, com compensações de estornos de saída na data efetiva do estorno. Ajustes, entradas e estornos de entrada não são consumo. Intervalo usa dias corridos e termina no dia anterior ao cálculo, evitando dia incompleto.

Para W dias completos:

    consumo líquido = max(0, quantidade de saídas - devolução por estornos de saída no intervalo)
    média diária = consumo líquido / W
    sugestão = teto(média diária × prazo de compra em dias + estoque de segurança)

Exemplo: 90 unidades em 180 dias, prazo de 30 dias e segurança de 5 → média 0,5/dia → sugestão 20 unidades.

Definições técnicas iniciais: W = 180, configurável por item entre 30 e 365 dias. Prazo e segurança são configurados manualmente. Se qualquer parâmetro indispensável estiver NULL, resultado NÃO CALCULÁVEL com motivo. Se histórico só começa depois do início do intervalo, resultado HISTÓRICO INSUFICIENTE; não extrapolar silenciosamente.

Com cobertura completa e consumo zero, sugestão = estoque de segurança. Somente será zero se a segurança for zero. Esse detalhe corrige a simplificação da análise anterior.

Não implementar exclusão seletiva de consumo no MVP. A interface identifica picos e deixa ao administrador a decisão sobre o mínimo efetivo, preservando cálculo reproduzível.

Situação do código, nesta ordem:

1. INCONSISTENT: alguma variante possui saldo negativo legado, mesmo que a soma seja positiva.
2. OUT_OF_STOCK: soma das variantes = 0.
3. NOT_CONFIGURED: soma positiva e mínimo efetivo NULL.
4. REPLENISHMENT: soma positiva <= mínimo efetivo.
5. OK: soma > mínimo efetivo.

Quantidade sugerida para recompor até o limite = max(0, mínimo efetivo - saldo agregado). Isso não é pedido de compra e pode ser zero quando o saldo é exatamente igual ao mínimo, embora o alerta esteja ativo.

Cada cálculo expõe período, dias, consumo, média, prazo, segurança, sugestão, cobertura, computedAt e versão dos parâmetros. Aplicar sugestão exige ação explícita do administrador e registra antes/depois. Quantidades são arredondadas só ao final.

## 8. Modelo relacional

MariaDB/InnoDB; IDs bigint unsigned; FKs explícitas; UTC para instantes; datas do fato como DATE no fuso funcional do host. API usa camelCase, banco snake_case. Valores monetários decimal(15,2), moeda BRL. Quantidades de saldo/lançamento bigint signed para preservar legado negativo.

| Tabela | Campos principais e restrições |
|---|---|
| inventory_categories | id, name, normalized_name UNIQUE, active, version, timestamps |
| inventory_items | id, code UNIQUE, category_id FK, name, description, unit, minimum_stock NULL, purchase_lead_time_days NULL, safety_stock NULL, recommendation_window_days DEFAULT 180, history_coverage_from NULL, active, version, created_by, updated_by |
| inventory_product_variants | id, item_id FK, brand NULL, model NULL, description, identity_hash, active, version; UNIQUE(item_id, identity_hash) |
| inventory_locations | id, code UNIQUE, name, active; local inicial TI |
| inventory_movements | id, type, status, location_id, occurred_on, origin NULL, service_order_number NULL, document_number NULL, description NULL, observations NULL, reason NULL, version, reverses_movement_id NULL UNIQUE, source, import_batch_id NULL, posted_by/at, created_by, timestamps |
| inventory_movement_lines | id, movement_id FK, variant_id FK, quantity NULL, counted_quantity NULL, unit_cost NULL, snapshot JSON; UNIQUE(movement_id, variant_id) |
| inventory_ledger_entries | id, movement_line_id UNIQUE FK, variant_id FK, location_id FK, effective_on, delta signed, posted_at; imutável |
| inventory_balances | id, location_id FK, variant_id FK, quantity, version, updated_at; UNIQUE(location_id, variant_id) |
| inventory_audit_events | id, entity_type/id, action, actor_id NULL, before/after JSON, reason NULL, occurred_at, request_id NULL |
| inventory_idempotency_keys | id, actor_id, operation, resource_key, key, request_hash, result JSON; chave composta UNIQUE |
| inventory_import_batches | id, file_hash UNIQUE, original_name, storage_path, adapter_version, status, analysis_version, created_by, approved_by, counts JSON, completed_at |
| inventory_import_rows | id, batch_id, sheet_name, row_number, source_payload JSON, corrected_payload JSON, resolution, errors JSON, movement_line_id NULL; UNIQUE(batch_id, sheet_name, row_number) |

FKs de histórico usam RESTRICT; dados não são apagados em cascata. A referência ao usuário autenticável do core segue sua interface pública e IDs do host. Usuários legados desconhecidos não recebem autoria inventada; lote identifica quem migrou.

Não duplicar item_id em linhas: ele é obtido pela variante. Livro guarda delta explícito: entrada +q, saída -q, ajuste diferença, estorno -delta original. Lançamento de ajuste zero é omitido.

Índices: itens(category_id, active); variantes(item_id, active); movimentos(status, occurred_on, id), (type, occurred_on), service_order_number, document_number; livro(variant_id, location_id, effective_on, id); auditoria(entity_type, entity_id, occurred_at).

Valor total da linha = quantity × unit_cost; NULL se custo desconhecido. Não consolidar custos diferentes em uma mesma linha. Movimentos de entrada distintos preservam preços de lotes diferentes. Saldo físico é por variante, sem rastreamento de lote ou custeio médio contábil no MVP.

## 9. Arquitetura e contrato modular

Plataforma declarada pelo starterkit: PHP ~8.5.0, Laravel ^13.0, MariaDB, SPA React/TypeScript, design system público, React Hook Form e Docker/Sail.

Identidade técnica adotada para preparar o plano: inventory; pacote local acme/inventory; namespace Acme\\Inventory; versão de lançamento 1.0.0; core ^1.0.0 sujeito aos testes de compatibilidade. Vendor é substituível antes da primeira publicação.

Provider estende App\\Core\\Modules\\ModuleServiceProvider e retorna inventory em moduleName(). Manifesto schemaVersion 1, apiPrefix inventory, frontendEntry resources/spa/module.ts, dependencies vazio, catálogo completo da seção 10.

Estrutura:

    modules/acme/inventory/
      composer.json, module.json, README.md, CHANGELOG.md
      src/Application/{Actions,DTOs,Queries}
      src/Domain/{Events,Exceptions}
      src/Http/{Controllers,Requests,Resources}
      src/Models, src/Policies, src/Infrastructure
      database/{migrations,factories,seeders}
      resources/spa/{pages,components,services,module.ts}
      routes/api.php, tests/{Unit,Feature}

Controllers invocáveis por operação. Requests validam formato/autorização; DTOs transportam dados; Actions conduzem regras/transações; Queries fornecem leituras; Resources definem JSON. Não criar dependência do módulo Customers.

A extensão frontend usa somente @starterkit/module-kit para APIs do host, lazy loading e AdminLayout. Instalação/habilitação exige build dos assets do host. Boot não executa carga de dados; local inicial é criado por instalação idempotente.

## 10. Autorização

| Permissão | Consulta/auditor | Almoxarife | Gestor | Administrador operacional |
|---|:---:|:---:|:---:|:---:|
| inventory.dashboard.view | Sim | Sim | Sim | Sim |
| inventory.categories.viewAny | Sim | Sim | Sim | Sim |
| inventory.categories.create/update | — | — | Sim | Sim |
| inventory.items.viewAny/view | Sim | Sim | Sim | Sim |
| inventory.items.create/update | — | — | Sim | Sim |
| inventory.variants.create/update | — | — | Sim | Sim |
| inventory.items.configureReplenishment | — | — | — | Sim |
| inventory.movements.viewAny/view | Sim | Sim | Sim | Sim |
| inventory.entries.create | — | Sim | Sim | Sim |
| inventory.issues.create | — | Sim | Sim | Sim |
| inventory.adjustments.create | — | — | Sim | Sim |
| inventory.movements.reverse | — | — | Sim | Sim |
| inventory.movements.manageDrafts | — | — | Sim | Sim |
| inventory.reports.view | Sim | Sim | Sim | Sim |
| inventory.reports.export | Sim | — | Sim | Sim |
| inventory.imports.view | Auditor | — | Sim | Sim |
| inventory.imports.execute | — | — | — | Sim |

Notação create/update e viewAny/view representa permissões individuais a expandir no manifesto. Papéis são conjuntos iniciais sugeridos; administrador operacional não precisa ser super-admin. Policies conferem também propriedade/estado. UI oculta ações sem permissão; servidor rejeita com 403.

## 11. API

Base /api/v1/inventory; cookie/sessão Sanctum e CSRF do host. JSON UTF-8, objetos em data; paginação com links/meta do core. IDs serializados como strings decimais para não perder precisão JavaScript; dinheiro como string decimal; enums como códigos estáveis em maiúsculas.

GET é somente leitura. Listas: page padrão 1, perPage padrão 20 e máximo 100; filtros em filter[...], sort com prefixo -; parâmetros desconhecidos retornam 422.

| Método/caminho relativo | Permissão | Resultado/efeito |
|---|---|---|
| GET /dashboard | dashboard.view | 200 indicadores e asOf |
| GET /categories | categories.viewAny | 200 coleção |
| POST /categories | categories.create | 201 cadastro |
| PATCH /categories/{id} | categories.update | 200 atualização/inativação |
| GET /items | items.viewAny | 200 coleção com saldo/situação |
| POST /items | items.create | 201 cadastro |
| GET /items/{id} | items.view | 200 detalhe |
| PATCH /items/{id} | items.update | 200 dados básicos |
| PATCH /items/{id}/replenishment | items.configureReplenishment | 200 parâmetros/mínimo, auditoria |
| GET /items/{id}/replenishment | items.view | 200 sugestão reproduzível |
| GET /items/{id}/variants | items.view | 200 variantes/saldos |
| POST /items/{id}/variants | variants.create | 201 variante |
| PATCH /items/{id}/variants/{variantId} | variants.update | 200 variante |
| GET /items/{id}/ledger | movements.viewAny | 200 extrato paginado |
| GET /movements | movements.viewAny | 200 coleção |
| POST /movements | entries.create ou issues.create pelo tipo | 201 rascunho |
| GET /movements/{id} | movements.view | 200 detalhe |
| PATCH /movements/{id} | permissão do tipo + propriedade/gestão | 200 rascunho atualizado |
| POST /movements/{id}/cancel | permissão do tipo + propriedade/gestão | 200 cancelamento de rascunho |
| POST /movements/{id}/post | permissão do tipo + propriedade/gestão | 200 confirmação, ledger e saldo |
| POST /adjustments | adjustments.create | 201 ajuste confirmado atomicamente |
| POST /movements/{id}/reverse | movements.reverse | 201 compensação e original REVERSED |
| GET /reports/{stock,replenishment,consumption,adjustments} | reports.view | 200 resultado filtrado |
| GET /exports/{stock,replenishment,consumption,adjustments} | reports.export + reports.view | 200 download CSV/XLSX |
| POST /imports/analyze | imports.execute | 201 lote analisado/prévia |
| GET /imports e /imports/{id} | imports.view | 200 histórico/detalhe |
| PATCH /imports/{id}/resolutions | imports.execute | 200 saneamento; análise revalidada |
| POST /imports/{id}/commit | imports.execute | 200 lote efetivado/reconciliação |

Todas as permissões recebem prefixo inventory. Ajustes não usam o POST genérico de rascunho; estornos são gerados pela Action.

### 11.1 Exemplos de contratos

Saída em rascunho:

    {
      "type": "ISSUE", "locationId": "1", "occurredOn": "2026-09-26",
      "serviceOrderNumber": null,
      "description": "Substituição de teclado defeituoso",
      "observations": "Atendimento emergencial interno sem abertura de OS.",
      "lines": [{"variantId": "12", "quantity": 1}]
    }

Confirmar: corpo {"version": 3}, header Idempotency-Key obrigatório. Resposta 200 inclui id, status POSTED, occurredOn, postedAt, version e linhas. Entrada segue o mesmo formato com origin, documentNumber, observations e unitCost (string decimal ou NULL).

Ajuste:

    {"locationId":"1", "reason":"Contagem física",
     "lines":[{"variantId":"12", "countedQuantity":8, "expectedBalanceVersion":4}]}

Estorno: {"version":4,"reason":"Entrega lançada em duplicidade"}. Data e sinais compensatórios são definidos pelo servidor.

PATCH replenishment: version, minimumStock, purchaseLeadTimeDays, safetyStock, recommendationWindowDays. A permissão items.update não permite alterar esses campos pelo PATCH comum.

### 11.2 Filtros e erros

Items: search, categoryId, active, situation; sort code/name/quantity/updatedAt. Movements: type, status, from, to, itemId, variantId, serviceOrderNumber, documentNumber, createdBy; sort occurredOn/postedAt/id. Datas inicial/final inclusivas. Ledger ordena effectiveOn, postedAt, id para desempate.

422 VALIDATION_FAILED identifica campos; 409 inclui códigos INSUFFICIENT_STOCK, BALANCE_CHANGED, VERSION_CONFLICT, MOVEMENT_NOT_DRAFT, ALREADY_REVERSED, IDEMPOTENCY_CONFLICT, IMPORT_NOT_READY, IMPORT_ALREADY_APPLIED e HISTORICAL_STOCK_CONFLICT. Erro de saldo identifica variante, disponível e solicitado. 401/403/404/419 e inesperados seguem o core, com requestId.

## 12. Interface

Rotas base /admin/inventory. Dashboard; items; items/new; items/{id}; items/{id}/edit; categories; movements; entries/new; issues/new; movements/{id}; adjustments/new; reports; imports.

Criação/edição em páginas com breadcrumbs, PageHeader, salvar/cancelar. Formulários preservam conteúdo em falha recuperável. Todo dado tem loading, vazio, erro, sem permissão e sessão expirada. Filtros e paginação na URL.

Detalhe do item apresenta código, categoria, variantes e saldos, mínimo efetivo, sugestão, parâmetros e extrato. Saída mostra disponibilidade por variante. Quando OS fica vazia, observações recebem rótulo e ajuda para explicar sua ausência; validação também ocorre no servidor.

Gestor vê efeito do ajuste/estorno antes de confirmar. Administrador vê comparação mínimo atual/sugerido e ação explícita para aplicar. Quantidades de categorias diferentes não são apresentadas como medida de disponibilidade homogênea.

## 13. Relatórios e exportação

- Posição atual: código/variante/categoria/unidade/saldo/mínimo/situação.
- Reposição: agregado, variantes, mínimo efetivo, sugestão, prazo e parâmetros faltantes.
- Consumo: saídas brutas, compensações e consumo líquido; agrupamento por item, categoria, OS ou mês.
- Extrato: saldo anterior ao início, delta de cada registro, saldo final e usuário.
- Ajustes/estornos: motivo, original, compensação, responsável e instante.
- Valor histórico: somar entradas com custo conhecido; informar quantidade/linhas sem custo. Não chamar esse valor de avaliação financeira do saldo.

As consolidações existentes na planilha são derivadas, não importadas como fatos. Não somar unidades, pares e caixas em um indicador com interpretação física única.

Exportação usa os mesmos filtros, inclui generatedAt/asOf e moeda/unidade, exige autorização em cada download. CSV neutraliza células que possam virar fórmulas; XLSX grava textos de usuário como texto. Não exportar payload bruto/auditoria inteira por padrão.

## 14. Importação e saneamento

Perfil de dados levantado na análise: 178 entradas/3.936 unidades; 612 saídas/992 unidades; 110 códigos; saldo líquido agregado 2.944 unidades; custos históricos conhecidos totalizam R$ 114.987,98. Valores são controles do legado, não metas após ajustes de saneamento.

Upload inicial limitado a 10 MB, arquivo .xlsx sem macros; validar estrutura real e limites de planilha expandida. Armazenar em área privada com nome interno/hash SHA-256. Não executar fórmulas. Identificar áreas por cabeçalhos, confirmando nomes reais das abas no adaptador.

Estados: ANALYZED → NEEDS_REVIEW ou READY → COMMITTING → IMPORTED; FAILED permite reanálise/retentativa. Análise/resoluções têm version. Arquivo já aplicado retorna conflito com ID do lote existente.

### 14.1 Mapeamento

| Origem | Destino |
|---|---|
| Cod./Categoria/Item | Item agregado, categoria e variante identificada |
| Qtde de entrada/saída | Linha e delta positivo/negativo |
| Descrição de entrada | Especificação da variante e snapshot |
| Descrição do atendimento | description do movimento de saída |
| Nº OS | serviceOrderNumber preservado como texto |
| Data/Data Entrada | occurredOn, com correções documentadas |
| V.Unit. | unitCost; vazio → NULL |
| Nº Processo/nota/doação | origin e documentNumber após resolução |
| Saldo/Status | Valores de conferência, não editáveis no sistema |

Não agrupar linhas históricas de forma a perder preços, descrições ou origem. Política inicial: um movimento por linha da planilha; várias linhas podem compartilhar OS, sem exigir criar um único documento retroativamente.

Não exigir preencher retroativamente justificativa ou OS inexistente. Campo ausente permanece NULL, flag de exceção e motivo de aceitação no lote; novas operações seguem validação completa.

Data desconhecida: registrar NULL somente no legado, com exceção explícita; item fica sem cobertura histórica completa e não gera recomendação até saneamento. Os três registros sem data não recebem data inventada.

Para esses registros, effective_on do livro também permite NULL. O saldo atual inclui todos os lançamentos, mas extratos por data exibem separadamente a quantidade de movimentos sem data e avisam que os saldos cronológicos não são plenamente determináveis. Relatórios por período não atribuem movimentos sem data a um dia arbitrário; mostram o total não alocado. A conciliação física resolve a disponibilidade atual, mas não cria cobertura histórica inexistente.

Datas aprovadas: corrigir as cinco ocorrências 30/05/2003 vinculadas às OS 1001, 1002 e 1003 para 30/05/2023. O adaptador identifica exatamente linhas/valores antes de aplicar; não substituir todo ano 2003 indiscriminadamente.

Categorias Conectores/Patch Cord são deduplicadas conservando mapa de origem. Quatorze códigos com descrições diversas são mapeados a variantes; dados não permitem inferir automaticamente qual marca foi efetivamente entregue quando o saldo era agregado. Nesses casos usar variante legada não identificada e saneamento por contagem, evitando precisão fictícia.

### 14.2 Saldos negativos

PEN02=-3, SSD01=-3, HDN02=-1 e TN003=-1 exigem contagem e decisão. Importação pode preservar temporariamente esses deltas negativos em sessão exclusiva de implantação, com divergências registradas; isso não libera saldo negativo para novas operações.

Após carga, gestor lança conciliação por variante com motivo e referência ao lote. Se contagem física for zero, ajustes seriam +3,+3,+1,+1, mas não executar esses números sem a contagem. Variações por marca também precisam ser conciliadas.

Implantação só libera movimentação operacional quando os saldos das variantes estão conciliados e não negativos. O saldo final pode diferir de 2.944 após saneamento; relatório mostra saldo original, correção, ajuste e saldo final.

### 14.3 Execução

Importar em manutenção exclusiva, antes de lançamentos operacionais. Para o volume atual, uma transação para todos os fatos e saldos evita lote parcialmente visível. Parsing/resoluções ocorrem antes dessa transação. Falha reverte toda a carga, mantendo o lote/erro para diagnóstico.

Reconciliação por código e variante: entradas, saídas, custos conhecidos, ajustes, saldo e exceções. Hash/lote e unique batch/aba/linha impedem duplicação. Sem exclusão automática do arquivo original.

## 15. Auditoria, eventos e manutenção

Auditar cadastros, parâmetros, rascunhos, confirmação, ajuste, estorno e resoluções de importação. Eventos incluem actorId, recordedAt, requestId quando houver, alvo e mudança. Históricos são acessíveis somente por permissões pertinentes.

Eventos de domínio internos: MovementPosted, MovementReversed, InventoryAdjusted e ReplenishmentParametersChanged. Payload: movementId/itemId aplicável, local, variantes/deltas, ator e instante. Publicar depois do commit para consumidores externos. A atualização essencial do saldo acontece dentro da Action, não em listener.

Comando inventory:reconcile, padrão somente leitura, compara livro e projeções por variante/local e retorna resultado estruturado. Reparo de projeção exige opção explícita, manutenção e auditoria; não corrige silenciosamente lançamentos de negócio.

Desabilitar/remover pacote conserva dados. Atualizações usam novas migrations, changelog e validação da compatibilidade. Nenhuma chamada externa é necessária para confirmar estoque.

## 16. Requisitos não funcionais

| ID | Requisito | Verificação |
|---|---|---|
| RNF01 | Integridade transacional | Rollback e corrida concorrente em MariaDB real |
| RNF02 | Autorização no servidor | Visitante, sem permissão, autorizado e propriedade |
| RNF03 | Interface acessível | Teclado, foco, labels, erros e contraste do design system |
| RNF04 | Compatibilidade modular | Instalação limpa e build no host compatível |
| RNF05 | Paginação | Listas limitadas e filtros no servidor |
| RNF06 | Privacidade | Arquivos privados, downloads autorizados, logs sem payload integral |
| RNF07 | Rastreabilidade | Livro, auditoria e fontes de migração preservados |
| RNF08 | Desempenho | Sem N+1; índices e medições com massa representativa |

Meta inicial de desempenho proposta: p95 até 1 segundo para listas/dashboard e até 2 segundos para confirmação de 100 linhas em ambiente de teste definido no plano, excluindo rede do cliente e exportações. Não constitui garantia antes de medição.

## 17. Matriz de aceite

| ID | Cenário | Resultado esperado |
|---|---|---|
| AC01 | Duas marcas no mesmo código | Saldo separado por variante e agregado correto |
| AC02 | Saída sem OS e observações vazias | 422 no campo observations; sem confirmação |
| AC03 | Saída sem OS e motivo preenchido | Confirmação válida com autoria |
| AC04 | Variante insuficiente, agregado suficiente | 409; nenhuma linha aplicada |
| AC05 | Duas saídas disputam última unidade | Apenas uma confirma; saldo final zero |
| AC06 | Reenvio com mesma idempotência | Mesmo movimento/resultado, sem nova baixa |
| AC07 | Mesma chave com outro corpo | 409 IDEMPOTENCY_CONFLICT |
| AC08 | Editar confirmado | 409; original íntegro |
| AC09 | Estornar saída | Compensação +q e vínculo único; histórico preservado |
| AC10 | Estornar entrada consumida | 409; sem negativo |
| AC11 | Contagem com saldo alterado | 409 BALANCE_CHANGED; operador confere novamente |
| AC12 | Sugestão 90/180, prazo30, segurança5 | Sugestão20; mínimo efetivo inalterado |
| AC13 | Consumo zero e segurança5 | Sugestão5 |
| AC14 | Histórico incompleto/parametrização NULL | Resultado explica por que não calcula |
| AC15 | Almoxarife tenta ajuste/estorno | 403 |
| AC16 | Mínimo efetivo alterado | Auditoria de valor anterior/posterior e autor |
| AC17 | Livro com estorno | Original e compensação somados uma única vez |
| AC18 | Corrigir datas do legado | 2023 aplicado às cinco linhas; original preservado |
| AC19 | Entrada sem custo | NULL preservado; relatório informa custo desconhecido |
| AC20 | Lote já efetivado é reenviado | Nenhuma duplicação |
| AC21 | Falha na carga ou confirmação | Rollback sem projeção parcial |
| AC22 | Ledger retroativo antes do intervalo | Saldo inicial do extrato correto |
| AC23 | Saldo negativo de variante mascarado pela soma | Código marcado INCONSISTENT |
| AC24 | Desabilitar/reabilitar módulo | Dados preservados; rotas/permissões seguem core |

Testes de regras e HTTP; integração MariaDB para locks/restrições/rollback; frontend para validação/estados; E2E para entrada, saída sem OS, ajuste e estorno. Manifesto, migrations, análise estática e build fazem parte do aceite técnico.

## 18. Insumos para o plano posterior

O plano de implementação deve decompor os RF/RNF/AC em entregas verificáveis, com dependências, migrations, serviços, testes e critérios de saída. Sequência orientativa: contrato modular → catálogo/variantes → livro/saldos → entrada/saída → ajustes/estornos → reposição/relatórios → migração/implantação.

Dados de operação ainda a preencher, sem bloquear a construção do módulo: mínimos efetivos, prazos, segurança, variantes físicas, contagens, papéis dos usuários e origem dos documentos históricos.

Antes da implantação, verificar: equivalência das variantes; reconciliação física; cinco correções de data; exceções sem data/OS/custo; aprovação dos parâmetros; compatibilidade real do host e cópia de segurança do banco. Esta especificação não autoriza corrigir a planilha original, publicar código ou executar migração.
