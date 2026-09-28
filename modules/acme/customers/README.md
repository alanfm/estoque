# Módulo de clientes

Módulo de referência do Starter Kit com CRUD de clientes, API autenticada, permissões próprias e tela integrada à navegação administrativa.

## Compatibilidade e instalação

- PHP `~8.5.0`, Laravel `^13.0` e núcleo `^1.0.0`.
- Composer: `acme/customers` (`type: starterkit-module`); identificador do manifesto: `customers`.
- No host, instale o pacote via Composer, valide com `core:modules:diagnose`, rode migrations e sincronize permissões com `core:sync-permissions`; habilite com `core:modules:enable customers` se estiver desabilitado e recompile a SPA (`npm run build`).

## Permissões

`customers.viewAny`, `customers.view`, `customers.create`, `customers.update` e `customers.delete`. A autorização é aplicada no servidor por `CustomerPolicy`; usuários superadministradores seguem a regra global do núcleo.

## API

Todas as rotas usam sessão/Sanctum na mesma origem e ficam sob `/api/v1/customers`:

| Método | Caminho | Operação | Permissão |
|---|---|---|---|
| GET | `/` | Listar (`search`, `per_page`, `page`) | `customers.viewAny` |
| POST | `/` | Criar | `customers.create` |
| GET | `/{customer}` | Consultar | `customers.view` |
| PATCH | `/{customer}` | Atualizar parcialmente | `customers.update` |
| DELETE | `/{customer}` | Excluir | `customers.delete` |

Resources expõem somente `id`, `name`, `email`, `phone`, `company` e `createdAt`. O e-mail é único; telefone e empresa são opcionais.

## Interface

- Listagem: `/admin/customers`.
- Criação: `/admin/customers/new`.
- Edição: `/admin/customers/{id}`.

Criação e edição usam páginas dedicadas com formulário compartilhado, breadcrumbs e ações de salvar/cancelar, seguindo a convenção do design system.

## Atualização e changelog

Migrations publicadas não devem ser editadas. Evoluções de schema exigem nova migration; remoção do pacote não remove os dados. Mudanças incompatíveis seguem a política de compatibilidade do núcleo.

### 1.0.0

- CRUD inicial, pesquisa por nome/e-mail/empresa, paginação, autorização por operação e tela SPA administrativa.
