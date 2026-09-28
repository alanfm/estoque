#!/bin/sh
set -eu

mariadb -uroot -p"$MARIADB_ROOT_PASSWORD" <<SQL
CREATE DATABASE IF NOT EXISTS starterkit_test;
GRANT ALL PRIVILEGES ON starterkit_test.* TO '$MARIADB_USER'@'%';
SQL
