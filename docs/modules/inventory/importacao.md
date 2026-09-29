# Importação legada — P09

O fluxo aceita XLSX sem macros de até 10 MiB. Ele grava a fonte no disco privado `inventory-imports`, calcula SHA-256 para impedir duplicação e cria uma prévia com referência à aba/linha. A leitura é somente de valores; fórmulas são ignoradas. Há limites de 20.000 linhas e 64 colunas por aba, 20 abas, 500 entradas ZIP e 64 MiB expandidos.

## Adaptador disponível

O adaptador `1.2.0` reconhece as abas `DADOS` e `LANÇAMENTOS`, com cabeçalhos na linha 4. `DADOS` é interpretada como ENTRY; `LANÇAMENTOS`, como ISSUE. As abas `Imprimir`, `Relatório` e `CÓDIGOS` não geram movimentos: são visualização/relatório/lista auxiliar. Colunas calculadas por fórmulas são ignoradas. Para quantity calculada por fórmula, a análise usa apenas o valor em cache do arquivo, sem recalcular, e exige revisão explícita.

Mapeamento de DADOS: `Cod.`→code, `Qtde`→quantity, `Categoria`→category, `Item`→name, `Descrição`→description, `Data Entrada`→date, `V.Unit.`→cost, `Nº. Processo`→document_number. Mapeamento de LANÇAMENTOS: `Cod.`→code, `Qtde`→quantity, `Descrição do Atentimento`→description, `Nº OS`→service_order_number, `Data`→date.

Datas Excel são convertidas para `AAAA-MM-DD`; ausências continuam NULL. As células fonte não são sobrescritas. A correção da data `2003-05-30` só ocorre junto a OS 1001, 1002 ou 1003 e conserva o valor original. O catálogo e a variante precisam ser vinculados na prévia; linhas sem quantidade exigem descarte justificado. O commit é uma ação separada, idempotente e transacional.

Entradas/saídas importadas preservam sinal histórico, inclusive saldos negativos legados. Isso não autoriza novas operações negativas. Antes de liberar operação, a CTI deve reconciliar os saldos por variante com contagem física. A importação não infere marca nem cria ajuste de contagem.

## Persistência e backup

Em produção, o serviço `app` monta o volume nomeado `inventory-imports` em `/var/lib/starterkit-files`, gravável por `www-data` e separado do estado modular. O diretório não é montado no Nginx nem em `public`. Incluir esse volume em backup/restauração junto com o banco; exercitar restauração antes da homologação. Recriar containers não deve apagar o volume.

## Verificação da pasta de trabalho v1.2

A fonte fornecida foi lida somente em memória/arquivo temporário, sem cópia no repositório e sem upload/commit para o banco. O adaptador selecionou as duas abas de fatos e ignorou as abas derivadas. Controles recalculados sem executar fórmulas:

| Aba | Linhas | Unidades | Datas ausentes |
|---|---:|---:|---:|
| DADOS (entradas) | 178 | 3.936 | 4 |
| LANÇAMENTOS (saídas) | 612 | 992 | 3 |

O total líquido agregado é 2.944 unidades, há 110 códigos de entrada, custo histórico conhecido de R$ 114.987,98 e quatro códigos agregados negativos (PEN02 -3, SSD01 -3, HDN02 -1, TN003 -1). Os quatro saldos negativos coincidem com a especificação. A saída da linha 99 tem quantidade por fórmula; seu cache é 27 e foi usado sem recalcular, mantendo a fórmula original na trilha. A linha 390 não tem quantidade e não pode ser importada sem resolução explícita; o fluxo permite descarte com justificativa auditada.

Há uma divergência a resolver com a CTI: `DADOS` contém quatro datas ausentes, enquanto a análise/especificação anterior registrava três. As cinco linhas 30/05/2003 estão em `LANÇAMENTOS` e coincidem com OS 1001–1003; apenas essas ocorrências recebem a correção já prevista para 30/05/2023, preservando os originais.

Esses totais demonstram leitura estrutural e reconciliação agregada, não equivalência completa da interface de planilha nem validação dos saldos físicos por variante. Nenhuma linha foi importada. Antes do commit operacional ainda é necessário mapear os 110 códigos e suas variantes com a CTI, aprovar a exceção de data extra e a linha sem quantidade, revisar prévia/exceções e exercitar Docker/backup/restauração. A fonte original não foi alterada.
