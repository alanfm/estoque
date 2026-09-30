# Medição de desempenho — P10.4

O comando `inventory:benchmark` cria dados sintéticos dentro de uma transação externa e mede três operações: dashboard, relatório de estoque e confirmação de entrada com até 100 linhas. Ao terminar, a transação é revertida; o comando é recusado fora de `local`/`testing`.

Execução:

```text
./vendor/bin/sail artisan inventory:benchmark --iterations=5 --lines=100 --json
```

O resultado registra p50/p95 em milissegundos e o maior número de queries observado por operação. A medição exclui rede e inicialização do processo Artisan, mas inclui transações e SQL da operação. A meta de referência é p95 até 1 s para leituras e até 2 s para confirmação de 100 linhas; ela não é considerada atingida sem registrar o resultado e o ambiente.

## Resultado local — 30/09/2026

Ambiente: Sail local, PHP 8.5.11, Laravel 13.33.0, MariaDB 11.8, cinco amostras, 100 linhas sintéticas. O banco estava no container `mariadb` da stack de desenvolvimento. O comando confirmou `rolledBack: true`; a verificação posterior encontrou zero itens `BEN%` e zero usuários do benchmark.

```json
{
    "environment": "local",
    "iterations": 5,
    "lines": 100,
    "rolledBack": true,
    "operations": {
        "dashboard": { "p50Ms": 6.99, "p95Ms": 7.56, "maxQueries": 3 },
        "stockReport": { "p50Ms": 7.37, "p95Ms": 7.75, "maxQueries": 2 },
        "postConfirmation": { "p50Ms": 210.83, "p95Ms": 215.57, "maxQueries": 312 }
    }
}
```

O resultado fica abaixo das metas propostas neste ambiente para as três operações, mas não é uma garantia de produção: a amostra é pequena, sintética e não inclui rede, exportação, concorrência ou volume real. A confirmação ainda executa operações SQL por linha (312 queries no cenário), portanto deve ser reavaliada antes de uma eventual otimização/cache.
