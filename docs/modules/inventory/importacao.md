# Importação legada — P09

O fluxo aceita XLSX sem macros de até 10 MiB. Ele grava a fonte no disco privado `inventory-imports`, calcula SHA-256 para impedir duplicação e cria uma prévia com referência à aba/linha. A leitura é somente de valores; fórmulas são ignoradas. Há limites de 20.000 linhas e 64 colunas por aba, 20 abas, 500 entradas ZIP e 64 MiB expandidos.

## Adaptador disponível

O adaptador `1.2.0` reconhece as abas `DADOS` e `LANÇAMENTOS`, com cabeçalhos na linha 4. `DADOS` é interpretada como ENTRY; `LANÇAMENTOS`, como ISSUE. As abas `Imprimir`, `Relatório` e `CÓDIGOS` não geram movimentos: são visualização/relatório/lista auxiliar. Colunas calculadas por fórmulas são ignoradas. Para quantity calculada por fórmula, a análise usa apenas o valor em cache do arquivo, sem recalcular, e exige revisão explícita.

Mapeamento de DADOS: `Cod.`→code, `Qtde`→quantity, `Categoria`→category, `Item`→name, `Descrição`→description, `Data Entrada`→date, `V.Unit.`→cost, `Nº. Processo`→document_number. Mapeamento de LANÇAMENTOS: `Cod.`→code, `Qtde`→quantity, `Descrição do Atentimento`→description, `Nº OS`→service_order_number, `Data`→date.

Datas Excel são convertidas para `AAAA-MM-DD`; as cinco ocorrências `2003-05-30` ligadas às OS 1001–1003 recebem a correção aprovada para `2023-05-30`, preservando o original. A carga inicial aceita somente tuplas completas: linhas sem data/quantidade obrigatória ou com quantidade dependente de fórmula/cache são marcadas como `SKIPPED` e ficam para lançamento manual. O catálogo e a variante precisam ser vinculados na prévia; o commit é separado, idempotente e transacional.

Entradas/saídas completas preservam seus sinais históricos, mas os quatro códigos com saldo legado negativo (PEN02, SSD01, HDN02 e TN003) ficam fora da carga inicial e começam com saldo operacional zero. Não importar saldo negativo, não criar ajuste automático e não inferir marca; qualquer regularização posterior será movimento manual auditado.

## Persistência e backup

Em produção, o serviço `app` monta o volume nomeado `inventory-imports` em `/var/lib/starterkit-files`, gravável por `www-data` e separado do estado modular. O diretório não é montado no Nginx nem em `public`. Incluir esse volume em backup/restauração junto com o banco; exercitar restauração antes da homologação. Recriar containers não deve apagar o volume.

## Verificação da pasta de trabalho v1.2

A fonte fornecida foi lida somente em memória/arquivo temporário, sem cópia no repositório e sem upload/commit para o banco. O adaptador selecionou as duas abas de fatos e ignorou as abas derivadas. Controles recalculados sem executar fórmulas:

| Aba | Linhas | Unidades | Datas ausentes |
|---|---:|---:|---:|
| DADOS (entradas) | 178 | 3.936 | 4 |
| LANÇAMENTOS (saídas) | 612 | 992 | 3 |

O total líquido agregado é 2.944 unidades, há 110 códigos de entrada, custo histórico conhecido de R$ 114.987,98 e quatro códigos agregados negativos (PEN02 -3, SSD01 -3, HDN02 -1, TN003 -1). Por decisão de homologação, esses números permanecem somente como referência histórica; não haverá importação inicial. No futuro, se a importação for autorizada, esses quatro códigos começarão com saldo operacional zero. A saída da linha 99 tem quantidade por fórmula; seu cache é 27, mas a tupla ficará fora de qualquer carga futura para lançamento manual. A linha 390 não tem quantidade e também ficará fora de qualquer carga, com motivo rastreável.

`DADOS` contém quatro datas ausentes e `LANÇAMENTOS` contém três; como não haverá carga inicial, essas linhas permanecem apenas no relatório de pendências para inserção manual futura. As cinco linhas 30/05/2003 estão em `LANÇAMENTOS` e coincidem com OS 1001–1003; somente essas ocorrências recebem a correção aprovada se a importação futura for autorizada, preservando os originais.

Esses totais demonstram leitura estrutural e reconciliação agregada, não equivalência completa da interface de planilha nem validação dos saldos físicos por variante. Nenhuma linha será importada na implantação inicial. O catálogo, unidades e variantes serão cadastrados manualmente; a planilha permanece como referência histórica e as linhas incompletas ficam para lançamentos manuais futuros. A fonte original não foi alterada.
