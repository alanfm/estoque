# Repository guidance

- The implementation root is `~/Projects/estoque`; `~/Projects/starterkit` is a read-only technical reference and must not receive project changes.
- Host: Laravel 13/PHP 8.5 + React/TypeScript SPA, MariaDB, Docker Compose/Laravel Sail. Run PHP, Composer, Node, and tests through `./vendor/bin/sail`; the host and database are in Compose, not installed locally.
- The intended business package is `modules/acme/inventory`; keep inventory rules/data out of host `app/Core`. The host supplies auth, permissions, shared API contracts, and SPA shell.
- Module frontends must import host APIs only from `@starterkit/module-kit`; its public exports and write-retry/idempotency rules are documented in `docs/contracts/core-1.1-module-http-client.md`.
- Run focused checks via `./vendor/bin/sail artisan test --filter <TestName>` or `./vendor/bin/sail npm test -- <test-file>`; full checks are `./vendor/bin/sail composer format:check`, `./vendor/bin/sail composer analyse`, `./vendor/bin/sail artisan test`, and `./vendor/bin/sail npm run format:check`, `lint`, `typecheck`, `npm test`, `npm run build`.
- For HTTP smoke checks, API requests must send `Accept: application/json` to receive the JSON 401 contract rather than a browser redirect. `.env` is local/ignored; this checkout uses isolated ports from its `.env`.
- Read `docs/specs/especificacao-modulo-almoxarifado.md` for normative domain/technical decisions; it prevails over preliminary proposals in `docs/analise-funcional-almoxarifado.md`. Track phase state and evidence in `docs/plans/inventory-status.md`.
- Do not import or modify the source spreadsheet or real stock data without explicit approval. Historical negative balances, date corrections, and variant mapping require audited reconciliation; never invent physical counts.
