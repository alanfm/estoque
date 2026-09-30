# Guia de implantação — P11

Este guia descreve a implantação do pacote `acme/inventory` no host. Ele não autoriza a importação da fonte real nem substitui a aprovação da CTI.

## Pré-requisitos e artefatos

- revisão Git identificada e lockfiles `composer.lock`/`package-lock.json` preservados;
- imagem construída com `Dockerfile` e `compose.production.yaml` da mesma revisão;
- segredos de `APP_KEY`, banco, SMTP e URL fornecidos fora do repositório;
- backup restaurável do banco, estado modular e volume `inventory-imports`;
- janela de manutenção aprovada e plano de retorno não destrutivo.

Validar antes da janela:

```sh
./vendor/bin/sail composer validate --no-check-publish
./vendor/bin/sail composer format:check
./vendor/bin/sail composer analyse
./vendor/bin/sail artisan test
./vendor/bin/sail npm run format:check
./vendor/bin/sail npm run lint
./vendor/bin/sail npm run typecheck
./vendor/bin/sail npm test
./vendor/bin/sail npm run build
docker compose -f compose.production.yaml build
```

## Sequência controlada

1. Fazer e verificar o backup; não executar rollback destrutivo de migrations.
2. Publicar as imagens da mesma revisão e iniciar banco/app/web isoladamente.
3. Executar `php artisan migrate --force` no app.
4. Executar `php artisan inventory:install` e `php artisan core:sync-permissions`.
5. Executar `php artisan core:modules:diagnose --json`; corrigir qualquer issue antes de habilitar o módulo.
6. Construir/publicar os assets da mesma revisão e verificar `/up`, login, `/admin/inventory` e API com `Accept: application/json`.
7. Habilitar o módulo conforme o mecanismo de estado do core e conferir as permissões dos papéis reais.
8. Cadastrar manualmente categorias, códigos, unidades e variantes aprovados; não importar a planilha na implantação inicial.
9. Fazer smoke autenticado somente com uma operação sintética/controlada autorizada; registrar auditoria e reconciliação.

## Importação e liberação

Não executar `imports/analyze` ou `imports/commit` na implantação inicial. A planilha será apenas referência histórica. Uma importação futura exigirá autorização explícita, prévia, `Idempotency-Key`, revisão das tuplas completas, relatório de linhas manuais e conferência dos saldos por variante.

## Reversibilidade

Em falha de boot, diagnosticar e corrigir antes de liberar usuários. Desabilitar o módulo preserva os dados. Não apagar tabelas nem reverter migrations depois de existirem movimentos; restauração de backup exige decisão sobre todos os lançamentos posteriores.

## Estado desta entrega

P11.1 e P11.6 foram preparados localmente nesta revisão. A implantação em homologação/produção, a operação controlada e a carga real permanecem bloqueadas pelos gates P10.6–P10.7.
