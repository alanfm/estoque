# Empacotamento e operação em produção

Este documento define o contrato operacional para uma entrega Docker do host e dos módulos instalados. O repositório fornece `Dockerfile` multi-stage e `compose.production.yaml`; os exemplos abaixo executam o empacotamento local e o smoke test. Em produção, valores sensíveis devem vir do secret manager da plataforma, e o CI deve publicar/promover o mesmo digest validado. O marco F7 só é aceito quando os critérios deste documento e de [testing.md](testing.md) tiverem evidência reproduzível.

## Artefato de release

Cada release DEVE produzir uma imagem imutável, identificável pela versão e pelo commit de origem. O processo de build DEVE:

- Instalar dependências PHP com `composer.lock` em modo de produção e sem dependências de desenvolvimento.
- Instalar dependências frontend a partir do lockfile JavaScript, compilar os assets em etapa de build e incluir somente os artefatos necessários no runtime.
- Descobrir e validar os módulos Composer instalados, compilar suas entradas React/TypeScript junto com a SPA e falhar se uma entrada declarada estiver ausente ou inválida.
- Registrar versão do núcleo, módulos incluídos, commit e identificação dos lockfiles na metadata ou nas labels OCI da imagem.
- Manter ferramentas de build, caches, código `.env` e segredos fora da imagem/runtime final.
- Executar como usuário sem privilégios, com filesystem somente leitura quando suportado; os diretórios graváveis necessários (por exemplo, logs/cache e estado dos módulos) devem ser explicitamente definidos e persistidos conforme seu propósito.

Imagens publicadas não devem ser sobrescritas com outra build usando a mesma tag. O pipeline deve guardar o digest que passou nos testes e promover esse mesmo digest entre ambientes.

O Dockerfile produz os alvos `app` (PHP-FPM) e `web` (Nginx) a partir das mesmas fontes. O alvo `app` executa `composer install --no-dev` com o lockfile e falha se `core:modules:diagnose --json` encontrar incompatibilidades. O alvo `web` contém os arquivos públicos e assets compilados pelo Node; ambos os processos executam sem root. A configuração Compose de referência publica somente a porta HTTP do Nginx; TLS deve terminar em um proxy HTTPS confiável.

## Configuração e serviços

Configuração é fornecida pelo ambiente de execução, nunca incorporada à imagem. Cada ambiente configura, no mínimo, URL/host confiável e HTTPS, chave da aplicação, conexão MariaDB, sessão/cookies, cache, fila quando usada e transporte de e-mail. Segredos devem vir do mecanismo de secrets da plataforma e não ser gravados em logs, argumentos permanentes ou arquivos versionados.

O serviço HTTP, worker e scheduler (se usados) devem executar a mesma imagem/digest e configuração compatível. Worker e scheduler são processos separados do serviço HTTP; políticas de concorrência, reinício, timeout e graceful shutdown devem ser declaradas pela plataforma. A imagem deve expor a rota de saúde Laravel `/up`; monitoramento adicional deve verificar dependências sem expor dados sensíveis.

A SPA, `/api/v1` e `/sanctum/csrf-cookie` devem permanecer sob a mesma origem HTTPS. O proxy deve encaminhar corretamente host e protocolo originais, não servir fallback SPA para endpoints API e não remover cabeçalhos necessários à sessão segura.

## Sequência de publicação

Para verificação local, forneça os valores abaixo pelo ambiente de shell ou por um secret manager (não grave segredos em arquivo versionado). `APP_KEY` deve ser uma chave Laravel válida; `APP_URL` deve ser a URL pública HTTPS; configure credenciais únicas para MariaDB e valores válidos de SMTP.

```bash
export APP_KEY='base64:<chave-aleatória-de-32-bytes-em-base64>'
export APP_URL='https://starterkit.example.test'
export DB_USERNAME='starterkit'
export DB_PASSWORD='<segredo>'
export DB_ROOT_PASSWORD='<segredo-distinto>'
export MAIL_HOST='smtp.example.test'
export MAIL_FROM_ADDRESS='noreply@example.test'
export RELEASE_TAG='1.0.0'
export VCS_REF='<commit-da-release>'

docker compose -f compose.production.yaml build
docker compose -f compose.production.yaml up -d db
# Fazer e verificar o backup MariaDB antes das migrations.
docker compose -f compose.production.yaml run --rm app php artisan migrate --force
docker compose -f compose.production.yaml up -d --wait app web
curl --fail https://starterkit.example.test/up
```

Na primeira instalação, sincronizar permissões e provisionar o administrador usando o fluxo operacional de [authentication.md](authentication.md). A criação do administrador deve ser feita uma vez e a senha não deve aparecer em logs ou histórico do shell.

1. Resolver dependências pelos lockfiles versionados e construir uma única imagem para o commit da release.
2. Executar verificações de qualidade, testes backend/frontend, validação dos manifestos e build de produção definidos em [testing.md](testing.md).
3. Subir a imagem em ambiente descartável sem Sail, com MariaDB real e configuração externa; executar smoke test de saúde, SPA, login/sessão, API e página do módulo `inventory`.
4. Gerar e verificar backup do banco antes de qualquer migration de produção. Confirmar espaço, política de retenção e procedimento de restauração.
5. Implantar o mesmo digest validado. Aplicar migrations explicitamente como etapa controlada, antes de encaminhar tráfego à nova versão quando a migration exigir schema novo.
6. Verificar saúde, autenticação, API e módulo após a migração; observar logs e métricas sem registrar credenciais, tokens, cookies ou dados pessoais desnecessários.
7. Registrar digest, versão, commit, migrations executadas, backup associado e resultado do smoke test no histórico do release.

Migrations longas ou incompatíveis devem ser avaliadas para execução operacional segura. Em implantação com versões simultâneas, aplicar estratégia expand/contract: primeiro adicionar schema compatível com versões antiga e nova, migrar dados, publicar código novo e remover estruturas antigas somente em release posterior. A estratégia efetiva deve ser demonstrada no banco MariaDB da aplicação.

## Atualização e rollback

O procedimento de release deve garantir que código, módulos e assets sejam publicados como uma unidade; não se atualiza módulo isoladamente em runtime. O rollback de aplicação consiste em reimplantar o digest anterior, não em reconstruir uma imagem antiga a partir de dependências atuais.

Antes de iniciar, identificar migrations da release e se são reversíveis. Reverter a imagem só é permitido se o schema após as migrations permanecer compatível com o código anterior. Não executar `migrate:rollback` automaticamente como parte do rollback: migrations podem ser destrutivas ou não reversíveis. Se o schema não for retrocompatível, interromper o tráfego e restaurar conjuntamente banco e aplicação a partir de backup consistente, seguindo o procedimento aprovado para o ambiente.

O ensaio F7 deve usar uma instalação inicial e depois atualizar a imagem mantendo dados persistidos. Deve demonstrar que os dados de usuários e do inventário sobrevivem à atualização e à troca para a versão anterior compatível. O relatório registra os digests, migrations, verificações, duração, backup/restore exercitado e resultado de cada etapa.

## Backup e restauração

- Banco MariaDB é dado persistente e deve ter backups automatizados com retenção definida pelo ambiente.
- Backups devem ser criptografados e armazenados separadamente do volume primário; acesso deve ser restrito.
- O operador deve registrar objetivo de ponto de recuperação e tempo de recuperação definidos para o ambiente.
- Restauração deve ser ensaiada periodicamente em ambiente isolado; verificar integridade e funcionamento da aplicação restaurada antes de declarar sucesso.
- O arquivo de estado dos módulos em `storage/app/modules.json`, quando usado, deve ser incluído na estratégia de persistência/backup ou ser reconstruível de maneira documentada a partir da configuração de release. Não persistir caches compilados entre releases.
- Mídia ou outros arquivos enviados pela aplicação, caso existam, requerem storage persistente e backup coordenado com o banco.

No Compose de referência, o serviço MariaDB recebe `MARIADB_DATABASE`, `MARIADB_USER` e as senhas do ambiente. O exemplo abaixo grava backup fora do repositório com permissões restritas e restaura uma cópia em schema descartável para ensaio:

```bash
umask 077
BACKUP_FILE="${BACKUP_FILE:-/secure-backups/starterkit-$(date -u +%Y%m%dT%H%M%SZ).sql}"
docker compose -f compose.production.yaml exec -T db sh -c \
  'MYSQL_PWD="$MARIADB_PASSWORD" mariadb-dump --user="$MARIADB_USER" --single-transaction --routines --events --triggers "$MARIADB_DATABASE"' \
  > "$BACKUP_FILE"
test -s "$BACKUP_FILE"

docker compose -f compose.production.yaml exec -T db sh -c \
  'MYSQL_PWD="$MARIADB_ROOT_PASSWORD" mariadb --user=root -e "CREATE DATABASE starterkit_restore"'
docker compose -f compose.production.yaml exec -T db sh -c \
  'MYSQL_PWD="$MARIADB_ROOT_PASSWORD" mariadb --user=root starterkit_restore' \
  < "$BACKUP_FILE"
docker compose -f compose.production.yaml exec -T db sh -c \
  'MYSQL_PWD="$MARIADB_ROOT_PASSWORD" mariadb --user=root starterkit_restore -e "SHOW TABLES"'
```

Em recuperação de produção, restaurar exige procedimento aprovado para o ambiente: pausar gravações/tráfego, restaurar backup consistente e iniciar código compatível com o schema restaurado. O schema `starterkit_restore` acima serve somente a um ensaio; removê-lo após validar a cópia.

## Critérios reproduzíveis para concluir F7

O registro da release deve conter evidência verificável de todos os itens:

1. Checkout limpo constrói a imagem com lockfiles, sem Sail, e produz metadata de commit/digest.
2. Build falha em caso de manifesto/módulo incompatível ou entrada frontend ausente; módulo instalado resulta em página incluída nos assets finais.
3. Imagem sobe com configuração externa e banco MariaDB persistente; `/up`, SPA, API, sessão e fluxo funcional do módulo `inventory` passam no smoke test.
4. Migrations são uma etapa explícita, com backup anterior e relatório do resultado.
5. Atualização preserva dados e o rollback documentado é ensaiado; se a volta da imagem não for segura após uma migration, o procedimento de recuperação banco+imagem é exercitado.
6. Suíte completa definida em [testing.md](testing.md) e verificações de compatibilidade definidas em [compatibility-policy.md](compatibility-policy.md) passam.
7. Guia de instalação, configuração, atualização e recuperação está publicado junto aos contratos públicos revisados para o marco `1.0.0`.

Enquanto faltar evidência em qualquer item, F7 não está aceita e o núcleo não deve ser publicado como `1.0.0`.

## Evolução especificada: operação LDAP

A [SPEC-002](specs/local-ldap-authentication.md#configuração-e-disponibilidade) exige extensão PHP LDAP, confiança na CA institucional e rede até os hosts aprovados pela CTI. Produção usa LDAPS ou StartTLS com certificado validado, sem downgrade. Configurar o modo externamente, preservar administrador local para contingência e não colocar segredos LDAP em assets, imagem ou logs. Habilitação depende de homologação; saúde HTTP não depende da disponibilidade do AD.
