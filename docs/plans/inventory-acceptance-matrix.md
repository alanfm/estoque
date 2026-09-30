# Matriz de aceite — P10

Esta matriz registra a evidência técnica disponível em 30/09/2026. **Local** significa executado no checkout com MariaDB/Sail e dados sintéticos; não equivale a homologação da CTI. Nenhuma linha da fonte real foi importada.

| AC | Cenário | Evidência atual | Estado |
|---|---|---|---|
| AC01 | Duas marcas no mesmo código | `InventoryCatalogTest::test_catalog_normalizes_code_and_category_and_tracks_multiple_variants` | Coberto localmente |
| AC02 | Saída sem OS e observações vazias | Regra de rascunho coberta em `InventoryMovementDraftTest`; confirmação HTTP ainda bloqueada | Parcial |
| AC03 | Saída sem OS com motivo | `InventoryMovementDraftTest::test_issue_draft_requires_explanation_without_order_and_is_owned_by_creator` cobre o rascunho; confirmação ainda não liberada | Parcial |
| AC04 | Variante insuficiente com agregado suficiente | Regra de saldo por variante não possui teste dedicado de aceite | Pendente |
| AC05 | Duas saídas disputam a última unidade | Requer duas conexões/processos MariaDB reais; não executado | Pendente |
| AC06 | Reenvio com mesma idempotência | `InventoryLedgerTest::test_posting_is_atomic_idempotent_and_reconciles` e teste de rascunho | Coberto localmente, sem corrida concorrente |
| AC07 | Mesma chave com outro corpo | `InventoryLedgerTest::test_posting_is_atomic_idempotent_and_reconciles` | Coberto localmente |
| AC08 | Editar confirmado | Imutabilidade é aplicada pelo ciclo de estado, mas não há teste dedicado do endpoint | Pendente |
| AC09 | Estornar saída | Estorno integral/idempotente coberto em `InventoryCorrectionTest`; fixture existente cobre principalmente entrada | Parcial |
| AC10 | Estornar entrada consumida | `InventoryCorrectionTest::test_reversal_is_rejected_when_it_would_make_a_variant_negative` | Coberto localmente |
| AC11 | Contagem com saldo alterado | `InventoryCorrectionTest::test_adjustment_uses_expected_balance_version_and_audits_zero_count_without_ledger_entry` | Coberto localmente |
| AC12 | Cálculo 90/180, prazo 30 e segurança 5 | `InventoryReportsTest::test_replenishment_and_adjustment_reports_include_calculation_and_audit_context` | Coberto localmente |
| AC13 | Consumo zero conserva segurança | `InventoryReplenishmentTest::test_zero_consumption_keeps_safety_stock_and_negative_variant_is_inconsistent` | Coberto localmente |
| AC14 | Histórico insuficiente/parâmetro NULL | `InventoryReplenishmentTest::test_recommendation_explains_missing_parameters_and_insufficient_coverage` | Coberto localmente |
| AC15 | Almoxarife sem ajuste/estorno | `InventoryCorrectionTest` e E2E por papel em `tests/e2e/inventory.auth.spec.ts` | Coberto localmente |
| AC16 | Mínimo efetivo auditado | `InventoryReplenishmentTest::test_configuration_requires_dedicated_permission_and_audits_optimistic_update` | Coberto localmente |
| AC17 | Original e estorno no livro | `InventoryCorrectionTest` e `InventoryReportsTest` cobrem lançamentos e relatório | Coberto localmente, sem corrida concorrente |
| AC18 | Correção seletiva de datas legadas | `TiStockWorkbookReaderTest` e `InventoryImportTest` cobrem a regra sintética; cinco linhas da fonte aguardam prévia autorizada | Parcial |
| AC19 | Entrada sem custo preserva NULL | `InventoryReportsTest::test_dashboard_and_stock_report_return_aggregated_inventory_and_enforce_permissions` | Coberto localmente |
| AC20 | Reenvio de lote importado | `InventoryImportTest::test_synthetic_workbook_is_analyzed_mapped_and_committed_atomically_with_nullable_legacy_date` | Coberto localmente |
| AC21 | Falha sem projeção parcial | Ledger rejeita saldo insuficiente atomicamente; importação sintética testa commit e idempotência | Parcial; falha no meio ainda precisa de cenário dedicado |
| AC22 | Ledger retroativo e saldo inicial | Query de extrato existe, mas não há teste dedicado de sequência retroativa | Pendente |
| AC23 | Variante negativa não mascarada | `InventoryReplenishmentTest::test_zero_consumption_keeps_safety_stock_and_negative_variant_is_inconsistent` | Coberto localmente |
| AC24 | Desabilitar/reabilitar preserva dados | `ModuleContractTest::test_permission_sync_and_disable_preserve_data_and_assignments` | Coberto localmente |

## Pendências que impedem aceite P10

1. Testes de concorrência com duas conexões/processos reais para AC04, AC05, AC06, AC17 e RNF01.
2. Cenários dedicados de retroatividade/saldo inicial para AC22 e validação histórica do P04.
3. Execução da prévia real somente após decisão da CTI sobre a quarta data ausente, quantidade ausente e variantes físicas.
4. Homologação operacional, parâmetros, contagens, papéis reais e backup/restauração permanecem fora do checkout local.
