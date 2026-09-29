# Importação legada — P09

O fluxo aceita XLSX sem macros de até 10 MiB. Ele grava a fonte no disco privado `inventory-imports`, calcula SHA-256 para impedir duplicação e cria uma prévia com referência à aba/linha. A leitura é somente de valores; fórmulas são ignoradas. Há limites de 20.000 linhas e 64 colunas por aba, 20 abas, 500 entradas ZIP e 64 MiB expandidos.

## Adaptador disponível

O adaptador `1.0.0-canonical` é deliberadamente um contrato provisório, não uma afirmação sobre o formato da planilha oficial. Cada aba usa cabeçalhos canônicos na primeira linha:

`type`, `code`, `quantity`, `date`, `description`, `category`, `origin`, `document_number`, `service_order_number`, `cost`.

`type` deve ser `ENTRY` ou `ISSUE`; `date` usa `AAAA-MM-DD`. Datas em branco permanecem NULL. As células fonte não são sobrescritas. A correção da data `2003-05-30` só ocorre junto a OS 1001, 1002 ou 1003 e conserva o valor original. O catálogo e a variante precisam ser vinculados manualmente na prévia; o commit é uma ação separada, idempotente e transacional.

Entradas/saídas importadas preservam sinal histórico, inclusive saldos negativos legados. Isso não autoriza novas operações negativas. Antes de liberar operação, a CTI deve reconciliar os saldos por variante com contagem física. A importação não infere marca nem cria ajuste de contagem.

## Persistência e backup

Em produção, o serviço `app` monta o volume nomeado `inventory-imports` em `/var/lib/starterkit-files`, gravável por `www-data` e separado do estado modular. O diretório não é montado no Nginx nem em `public`. Incluir esse volume em backup/restauração junto com o banco; exercitar restauração antes da homologação. Recriar containers não deve apagar o volume.

## Bloqueio para a fonte real

O fluxo ainda não reconhece nomes de abas/cabeçalhos específicos da planilha real. Não carregar a fonte até obter autorização explícita para inspecioná-la, validar o adaptador com uma cópia aprovada e conferir a prévia/contagens com a CTI. A inspeção real, a reconstrução da imagem e um exercício de persistência/restauração continuam pendentes.
