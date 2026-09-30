# Backup e restauração — Inventário

## Escopo

O backup operacional deve incluir, no mesmo ciclo coordenado:

1. o banco MariaDB, com `--single-transaction`, triggers e rotinas;
2. o volume privado `inventory-imports`, montado em `/var/lib/starterkit-files`;
3. o estado modular persistido em `/var/lib/starterkit` quando a instalação o utilizar.

O volume de importações não deve ser montado no Nginx nem em `public`. A restauração deve ocorrer primeiro em recursos novos/isolados, seguida de conferência de tabelas, arquivos, permissões e reconciliação antes de substituir o ambiente.

## Exemplo de backup

Executar em janela operacional, com credenciais fornecidas pelo gestor de segredos:

```sh
docker compose exec -T mariadb mariadb-dump \
  -u"$DB_USERNAME" -p"$DB_PASSWORD" \
  --single-transaction --routines --triggers "$DB_DATABASE" > database.sql

docker run --rm --user 0:0 \
  -v inventory-imports:/data:ro \
  -v "$PWD":/backup \
  starterkit-app:local \
  tar czf /backup/inventory-imports.tgz -C /data .
```

O arquivo de backup deve ter controle de acesso, retenção, integridade/hash e armazenamento conforme a política da operação. Não registrar senha na linha de comando em um ambiente compartilhado.

## Exemplo de restauração isolada

```sh
docker volume create inventory-imports-restore
docker run --rm --user 0:0 \
  -v inventory-imports-restore:/data \
  -v "$PWD":/backup \
  starterkit-app:local \
  tar xzf /backup/inventory-imports.tgz -C /data

# restaurar database.sql em um banco novo, nunca por cima sem autorização
docker compose exec -T mariadb mariadb -uroot -p"$DB_ROOT_PASSWORD" \
  -e 'CREATE DATABASE inventory_restore_check'
docker compose exec -T mariadb mariadb -uroot -p"$DB_ROOT_PASSWORD" \
  inventory_restore_check < database.sql
```

Após a cópia, confirmar que os arquivos podem ser lidos pelo usuário do app (`www-data`, UID/GID 33:33), que o volume não está exposto publicamente e que as contagens/reconciliação do banco correspondem ao backup. Remover os recursos temporários somente após registrar a evidência.

## Evidência local — 30/09/2026

- Dump sintético da base Sail: `47.530` bytes, restaurado em `starterkit_restore_check`.
- Conferência banco original/restaurado: `inventory_items` 0/0, `inventory_movements` 0/0 e `users` 1/1.
- Volume privado de teste: marcador restaurado e lido como UID/GID `33:33`.
- Banco e volumes temporários foram removidos após a conferência.

Esta evidência valida o procedimento em ambiente local isolado sem estoque operacional. Ainda não é backup/restauração da homologação ou produção, nem cobre retenção, criptografia, janela operacional ou restauração de dados reais.
