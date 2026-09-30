# `acme/inventory`

Módulo de Almoxarifado de TI para o Starterkit. O pacote mantém catálogo, variantes, saldos, livro, ajustes, estornos, relatórios e importação assistida dentro de `modules/acme/inventory`; autenticação, usuários, permissões e cliente HTTP são fornecidos pelo host.

## Compatibilidade

- PHP `~8.5.0`
- Laravel `^13.0`
- Core Starterkit `^1.1.0`
- MariaDB/InnoDB
- PhpSpreadsheet `^5.2`

O módulo é descoberto pelo repository path `modules/*/*` do host. Não instalar este pacote diretamente no checkout de referência `~/Projects/starterkit`.

## Instalação no host

```sh
composer install
./vendor/bin/sail artisan core:modules:diagnose --json
./vendor/bin/sail artisan migrate --force
./vendor/bin/sail artisan inventory:install
./vendor/bin/sail artisan core:sync-permissions
```

`inventory:install` é idempotente e cria apenas o local inicial `TI`. O boot do módulo não importa dados.

## Operação técnica

- API base: `/api/v1/inventory`.
- Interface: `/admin/inventory`.
- Reconciliação somente leitura: `./vendor/bin/sail artisan inventory:reconcile --json`.
- Benchmark sintético, somente em `local`/`testing`: `./vendor/bin/sail artisan inventory:benchmark --iterations=5 --lines=100 --json`.
- OpenAPI atual: `docs/modules/inventory/openapi.yaml`.
- Importação e backup: `docs/modules/inventory/importacao.md` e `docs/modules/inventory/backup-restauracao.md`.

Todas as escritas operacionais devem usar `Idempotency-Key` conforme o contrato público do host. PATCH de cadastros/rascunhos exige `version`. Valores monetários são strings decimais; IDs são strings na API.

## Limites de entrega

O pacote está preparado para implantação, mas a carga da fonte real, a distribuição física por variante e os parâmetros de reposição exigem aprovação da CTI. A implantação inicial não importará a planilha: categorias, códigos, unidades e variantes serão cadastrados manualmente, e a planilha ficará como referência histórica. Em uma futura importação autorizada, a carga aceitará somente tuplas completas; linhas incompletas ficarão para lançamento manual e PEN02, SSD01, HDN02 e TN003 começarão com saldo operacional zero, sem ajuste automático. Não executar importação real com este README como autorização. Confirmação operacional de ENTRY/ISSUE, concorrência real e validação histórica permanecem gates de integridade registrados no plano.
