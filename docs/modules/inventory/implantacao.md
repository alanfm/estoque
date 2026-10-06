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
4. Executar `php artisan core:sync-permissions`. A migration inicializa o local padrão TI; `inventory:install` permanece disponível para manutenção administrativa, sem ser necessário para registrar a primeira entrada.
5. Executar `php artisan core:modules:diagnose --json`; corrigir qualquer issue antes de habilitar o módulo.
6. Construir/publicar os assets da mesma revisão e verificar `/up`, login, `/admin/inventory` e API com `Accept: application/json`.
7. Habilitar o módulo conforme o mecanismo de estado do core e conferir as permissões dos papéis reais.
8. Cadastrar manualmente categorias, códigos, unidades e variantes aprovados; não importar a planilha na implantação inicial.
9. Fazer smoke autenticado somente com uma operação sintética/controlada autorizada; registrar auditoria e reconciliação.

## Atualização da autenticação (base Starter Kit de 05/10/2026)

Esta versão adiciona duas migrations de autenticação e muda o login de e-mail para matrícula. Planejar a atualização em manutenção: após aplicar as migrations e antes de liberar o novo login, preencher `users.registry` com as matrículas conferidas de todas as contas que precisam entrar, inclusive o administrador local. Preservar IDs, hashes de senha, papéis e vínculos do inventário. Não inferir matrícula a partir do e-mail. A migration mantém as contas antigas como locais e deixa a matrícula nula.

A gestão administrativa permite editar a matrícula de contas locais quando houver sessão administrativa válida; se não houver sessão, preparar uma atualização administrativa controlada com os valores aprovados antes de encerrar a manutenção. `core:bootstrap-admin {registry} {name} {email}` serve para instalação nova e não atualiza um administrador existente.

`AUTH_MODE=local` mantém o acesso local por matrícula/senha. Para habilitar LDAP, definir `AUTH_MODE=ldap` e os parâmetros `LDAP_*` documentados em [autenticação](../../authentication.md). Construir as imagens atualizadas, que incluem LDAP e preservam GD/ZIP para os relatórios. Contas provisionadas pelo diretório começam sem papéis; o responsável precisa atribuir as permissões do inventário pelo host. Homologar TLS/CA e o diretório real antes da liberação institucional.

## Importação e liberação

Não executar `imports/analyze` ou `imports/commit` na implantação inicial. A planilha será apenas referência histórica. Uma importação futura exigirá autorização explícita, prévia, `Idempotency-Key`, revisão das tuplas completas, relatório de linhas manuais e conferência dos saldos por variante.

## Reversibilidade

Em falha de boot, diagnosticar e corrigir antes de liberar usuários. Desabilitar o módulo preserva os dados. Não apagar tabelas nem reverter migrations depois de existirem movimentos; restauração de backup exige decisão sobre todos os lançamentos posteriores.

## Estado desta entrega

P11.1 e P11.6 foram preparados localmente nesta revisão. A implantação em homologação/produção, a operação controlada e a carga real permanecem bloqueadas pelos gates P10.6–P10.7.
