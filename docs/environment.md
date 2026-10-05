# Ambiente Docker e Laravel Sail

## Decisão

O sistema DEVE rodar em Docker. O desenvolvimento do núcleo e dos módulos DEVE usar Laravel Sail (dependência de desenvolvimento do host) sobre Docker Compose. O artefato de execução fora do desenvolvimento será uma imagem de aplicação própria, construída e validada em pipeline; Sail não é o runtime de produção. Esta distinção conserva um fluxo local simples sem acoplar a implantação às ferramentas de desenvolvimento.

O ambiente de desenvolvimento F0 está configurado em `compose.yaml` e foi validado localmente com Docker e Sail. A imagem de produção e sua validação pertencem à F7. As evidências locais e os critérios ainda pendentes estão no [acompanhamento](plans/f0-status.md).

## Bootstrap de um checkout limpo

Requer Docker Engine e Docker Compose com permissão de acesso ao daemon. Não requer PHP, Composer, Node ou MariaDB locais. Execute na raiz do repositório:

```bash
cp .env.example .env
# Em Linux com UID/GID diferentes de 1000, defina WWWUSER/WWWGROUP em .env
# com os valores de id -u e id -g antes de prosseguir.
docker compose --profile bootstrap run --build --rm --no-deps composer composer install --no-interaction --prefer-dist
docker compose up -d --build
./vendor/bin/sail artisan key:generate
./vendor/bin/sail artisan migrate
./vendor/bin/sail artisan core:sync-permissions
./vendor/bin/sail npm ci
./vendor/bin/sail npm run build
```

O comando `core:sync-permissions` popula o catálogo de permissões do núcleo; ele é não destrutivo e pode ser repetido com segurança após atualizações.

`composer` é um container temporário PHP 8.5 que resolve o problema de ainda não existir `vendor/bin/sail`; os demais comandos são executados pelo Sail. Instalar ou atualizar módulos locais em `modules/` usa o mesmo volume de código e `./vendor/bin/sail composer ...`, seguido por `./vendor/bin/sail npm run build`. `composer.lock` é parte dos arquivos do host e deve ser incluído no commit; `composer install` consome as versões resolvidas sem alterá-las.

Abra `http://localhost:8080/` para a SPA, `http://localhost:8080/up` para a saúde e `http://localhost:8025/` para mensagens capturadas pelo Mailpit. `APP_PORT`, `VITE_PORT`, `MAILPIT_PORT` e `DB_FORWARD_PORT` em `.env` permitem alterar as portas; `APP_URL` deve acompanhar `APP_PORT`. Para HMR, `./vendor/bin/sail npm run dev`. Os dados MariaDB são persistidos em volume nomeado. O script de inicialização cria o banco de testes separado (`starterkit_test`) somente na primeira criação do volume.

```bash
./vendor/bin/sail composer format:check
./vendor/bin/sail composer analyse
./vendor/bin/sail artisan test
./vendor/bin/sail npm run format:check
./vendor/bin/sail npm run lint
./vendor/bin/sail npm run typecheck
./vendor/bin/sail npm test
./vendor/bin/sail npm run build
./vendor/bin/sail down
```

Os testes end-to-end usam Playwright dentro do container e exigem o stack ativo, os assets compilados, o administrador de teste e o navegador instalado. Depois do build e de semear o administrador (`core:bootstrap-admin`), execute:

```bash
docker compose exec -T --user root laravel.test npx playwright install --with-deps chromium
docker compose exec -T --user root -e E2E_BASE_URL=http://localhost laravel.test npx playwright test
```

`E2E_ADMIN_EMAIL` e `E2E_ADMIN_PASSWORD` definem as credenciais semeadas; o padrão está em `ci/local.yml`.

`phpunit.xml` força `DB_DATABASE=starterkit_test` para não tocar no banco de desenvolvimento. Para desligar e **apagar todos os dados locais**, use `./vendor/bin/sail down -v` conscientemente. Não copie `.env` para imagens nem registre credenciais reais no repositório.

## Usuários de teste

Em ambientes `local` ou `testing`, após as migrations, execute:

```bash
./vendor/bin/sail artisan db:seed --class=TestUsersSeeder
```

Para criar os usuários e sincronizar também o catálogo de permissões do núcleo e dos módulos habilitados, use `./vendor/bin/sail artisan db:seed`. O `DatabaseSeeder` também é chamado por `sail artisan migrate:fresh --seed`, que apaga as tabelas antes de recriar o banco e executar o seed.

O seed cria `admin@example.test` (matrícula `123456`, superadministrador) e `user@example.test` (matrícula `654321`, sem papéis ou permissões administrativas), ambos com senha `Teste@12345678`, armazenada como hash. Contas existentes com esses e-mails são preservadas integralmente, inclusive senha e papéis. O seed é explícito, não envia e-mails e recusa outros ambientes, mesmo com `--force`. Essas credenciais servem apenas para desenvolvimento e testes; o provisionamento real continua usando `core:bootstrap-admin {registry} {name} {email}` e os links de definição de senha.

Contas institucionais não precisam de seed: com `AUTH_MODE=ldap` e conexão validada, o primeiro login de uma matrícula ausente provisiona uma conta sem papéis a partir do diretório. Execute as migrations antes do login para criar as colunas de matrícula, origem, identificador LDAP e sincronização. Os usuários fixos do seed continuam locais; não vincule matrícula institucional a um superadministrador de teste para testar provisionamento sem permissões.

## CI local com Act

Instale [Act](https://nektosact.com/installation/index.html) (versão validada: `0.2.89`) e mantenha Docker/Compose disponíveis. Da raiz do repositório, execute:

```bash
act push -W ci/local.yml -P ubuntu-latest=-self-hosted --env-file /dev/null --env ACT_REPO="$PWD"
```

O workflow `ci/local.yml` fica fora de `.github/workflows/`: ele é executado somente pelo Act local, sem acionar GitHub Actions. `-self-hosted` permite ao Act usar o Docker Compose da máquina; nenhum PHP, Composer ou Node local é necessário. Act clona o `HEAD` local em seu workspace (alterações não commitadas não entram na validação), copia `.env.example`, instala dependências pelo lockfile e usa o projeto Docker `starterkit-act` com volume MariaDB separado. O workflow usa portas isoladas `18081`, `18082`, `13308` e `18026` para não conflitar com o ambiente de desenvolvimento e também constrói/smoke-testa as imagens de produção em projeto separado. Ao terminar, inclusive em caso de falha, encerra containers e apaga **apenas** os volumes dos projetos de teste.

Para validar mudanças ainda não commitadas no mesmo workspace isolado, acrescente `--env ACT_INCLUDE_WORKTREE=1` ao comando. O Act aplica o diff do `HEAD` e copia arquivos novos não ignorados; `.env`, `vendor/` e `node_modules/` continuam excluídos. A execução normal, sem essa opção, representa o checkout versionado.

## Desenvolvimento do núcleo e dos módulos

- Requisitos da máquina: Docker com suporte a Compose; PHP, Composer, Node e MariaDB locais não devem ser pré-requisitos para desenvolver depois do bootstrap.
- O host Laravel inclui `laravel/sail` como dependência de desenvolvimento. Configuração versionada de Compose/Sail deve iniciar aplicação PHP 8.5, MariaDB e captura local de e-mail; adicionar serviços apenas mediante necessidade comprovada (por exemplo, worker de fila). A SPA e `/api/v1` precisam usar a mesma origem para exercitar cookies e CSRF.
- O código em `modules/` é montado junto ao host; `composer.json` do módulo é instalado no host e sua entrada React/TypeScript participa do build do host. Comandos PHP/Composer/Artisan, JavaScript e testes rodam no ambiente Sail, inclusive durante o desenvolvimento dos módulos.
- O ciclo de vida local de um módulo usa `./vendor/bin/sail artisan core:modules:list`, `core:modules:diagnose`, `core:modules:enable <nome>`, `core:modules:disable <nome>`, `core:sync-permissions` e `./vendor/bin/sail npm run build`. As raízes de descoberta e o arquivo de estado (módulos desabilitados) podem ser ajustados por `STARTERKIT_MODULE_PATHS` e `STARTERKIT_MODULE_STATE`.
- O bootstrap acima cobre checkout sem `vendor/`, criação de `.env`, chave da aplicação, dependências, migrations, assets e testes. Não versionar credenciais nem dados do banco. Portas são configuráveis e o volume nomeado mantém dados entre reinícios.
- E-mail de definição/redefinição de senha deve ser inspecionável no serviço local de captura. Banco de desenvolvimento e banco de testes precisam ser isolados; testes de integração usam MariaDB, não somente SQLite.
- As verificações locais da F0 usam os comandos acima, executados via Sail, e o pipeline local com Act. Não há workflow GitHub Actions ativo para este projeto.

## Execução em Docker fora do desenvolvimento

O runtime Laravel Sail 8.5 já inclui `php8.5-ldap`. As imagens de produção compilam a extensão PHP LDAP; quando `AUTH_MODE=ldap`, configure host institucional, porta e transporte LDAP conforme a [SPEC-002](specs/local-ldap-authentication.md). A conexão real exige liberação de rede e CA institucional confirmadas pela CTI; não use credenciais reais no ambiente local.

Use `LDAP_DEFAULT_SSL=true` e `LDAP_DEFAULT_TLS=false` para LDAPS (normalmente porta 636), ou `LDAP_DEFAULT_SSL=false` e `LDAP_DEFAULT_TLS=true` para StartTLS (normalmente porta 389). Não combine LDAPS com uma porta que espera StartTLS. Se a validação retornar `unable to get local issuer certificate`, obtenha da CTI a cadeia de certificados da CA institucional e instale-a no armazenamento de confiança do container. Preserve a validação do certificado; o certificado do servidor não substitui a CA confiável.

- Construir imagem de aplicação com versões resolvidas por `composer.lock` e lockfile JavaScript e publicar os assets da SPA junto ao host e módulos instalados; alteração de módulo exige novo build. Não copiar `.env` nem segredos para a imagem. Ver [empacotamento e operação em produção](production-deployment.md) para requisitos do artefato de release.
- Configurar serviço HTTP, conexão com MariaDB e armazenamento persistente por ambiente. Se houver processamento assíncrono ou agendamento, executar worker e scheduler como processos/serviços próprios com a mesma versão da aplicação; não presumir que estarão ativos no container HTTP.
- Aplicar migrations como etapa explícita de implantação e verificar saúde após a atualização. Planejar backup/restore do banco e procedimento de rollback de imagem compatível com as migrations aplicadas; remover imagem ou pacote não remove dados automaticamente.
- Configurar a mesma origem para SPA e API atrás do proxy HTTPS, preservando `/api/v1` e `/sanctum/csrf-cookie`; cookies seguros, sessão e CSRF seguem [authentication.md](authentication.md). Parâmetros de banco, e-mail e sessão vêm de configuração externa por ambiente.
- A imagem de release é imutável e a mesma imagem validada deve ser promovida entre ambientes; registrar digest e metadata do commit. Executar smoke tests, migrations, backup/restore e rollback conforme [production-deployment.md](production-deployment.md).

## Verificação do ambiente

No marco F0, uma pessoa deve reproduzir o bootstrap em checkout limpo usando apenas Docker/Compose, acessar SPA e API, executar migrations, teste com MariaDB e build dos assets. No marco F7, subir a imagem sem Sail e provar login, e-mail de recuperação, API e página de um módulo instalado; repetir com atualização da imagem preservando dados. Os critérios e o roteiro operacional estão em [production-deployment.md](production-deployment.md); ver [testing.md](testing.md) para os testes de aplicação.

Para LDAP sem SSL/StartTLS na porta 389, configure `LDAP_DEFAULT_PORT=389`, `LDAP_DEFAULT_SSL=false` e `LDAP_DEFAULT_TLS=false`. Nesse modo a conexão não usa certificados e transmite credenciais sem criptografia; utilize uma rede confiável.
