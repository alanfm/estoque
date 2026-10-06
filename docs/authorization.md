# Autorização

## Objetivo

Controlar operações e visibilidade por meio de permissões declaradas pelos módulos e atribuídas aos usuários por papéis.

## Modelo

```text
Usuário → Papéis → Permissões
       └──────────→ Permissões diretas, se habilitadas
```

A política inicial DEVERIA preferir permissões por papel. Permissões diretas aumentam flexibilidade, mas dificultam auditoria e suporte.

## Convenção de permissões

Formato:

```text
{recurso}.{ação}
```

Exemplo:

```text
customers.viewAny
customers.view
customers.create
customers.update
customers.delete
```

Regras:

- O recurso usa o identificador estável do módulo ou agregado.
- A ação representa uma capacidade, não o texto de um botão.
- Renomear uma permissão é uma alteração de contrato.
- Permissões DEVEM ser declaradas no manifesto do módulo.
- Permissões obsoletas exigem processo de migração e remoção.

## Responsabilidades

### Núcleo

- Armazenar papéis, permissões e vínculos.
- Permitir o provisionamento seguro do primeiro administrador por comando.
- Autorizar criação administrativa de usuários e atribuição de papéis.
- Descobrir permissões dos módulos instalados.
- Sincronizar o catálogo sem apagar atribuições silenciosamente.
- Fornecer APIs administrativas.
- Expor ao frontend as permissões efetivas do usuário atual.
- Definir o comportamento do superadministrador.

### Módulo

- Declarar permissões no manifesto.
- Implementar policies para recursos protegidos.
- Aplicar autorização em todos os endpoints.
- Associar menus, rotas e ações frontend às permissões.
- Testar cenários autorizados e negados.

## Policies e gates

- Policies são o padrão para operações sobre recursos.
- Gates são adequados para capacidades globais sem um recurso específico.
- Form Requests PODEM delegar sua autorização para policies.
- Actions críticas DEVERIAM proteger suas invariantes quando puderem ser chamadas fora do HTTP.
- A autorização backend é obrigatória mesmo quando a SPA esconde a ação.

## Superadministrador

Se existir, o bypass do superadministrador DEVE ficar centralizado. Não devem existir condicionais `is_admin` espalhadas pelo código.

O comportamento precisa ser testado e auditável. Recursos explicitamente não delegáveis PODEM negar acesso mesmo ao superadministrador, desde que documentados.

## Sincronização

O comando de sincronização deve:

1. Ler manifestos dos módulos habilitados.
2. Criar permissões novas.
3. Atualizar metadados não identificadores.
4. Marcar permissões ausentes como obsoletas.
5. Não apagar atribuições sem uma operação explícita.
6. Produzir saída adequada para automação.

## Frontend

A SPA recebe as permissões efetivas no bootstrap da sessão.

Ela PODE oferecer helpers equivalentes a:

```ts
can('customers.create')
canAny(['customers.update', 'customers.delete'])
canAll(['reports.view', 'reports.export'])
```

Esses helpers controlam:

- Rotas.
- Menus.
- Botões.
- Ações de tabela.
- Seções de formulários.

O frontend NÃO interpreta papéis para inferir capacidades. Ele verifica permissões.

## Respostas HTTP

- Usuário não autenticado: `401`.
- Usuário autenticado sem permissão: `403`.
- Recursos que precisam ocultar sua existência PODEM responder `404`, mediante política documentada.

## Administração

As telas administrativas DEVEM permitir:

- Criar usuários e enviar o link para definição inicial de senha.
- Listar papéis.
- Criar e editar papéis.
- Agrupar permissões por módulo e recurso.
- Atribuir papéis a usuários.
- Visualizar permissões efetivas.
- Identificar permissões obsoletas.
- Impedir remoção acidental do último administrador válido.

## Contrato implementado na F3

A F3 implementa o modelo `Usuário → Papéis → Permissões` em `users`, `roles`, `permissions` e nos vínculos `role_user` e `permission_role`. Permissões diretas por usuário não foram habilitadas: toda capacidade vem de papéis, conforme a preferência da política inicial.

### Catálogo do núcleo

O núcleo declara `users.*`, `roles.*`, `permissions.viewAny` e as permissões administrativas `modules.viewAny`, `modules.install`, `modules.remove`, `modules.enable` e `modules.disable` em `App\Core\Authorization\CorePermissions`. O comando `php artisan core:sync-permissions` sincroniza o catálogo de forma não destrutiva: cria permissões novas, atualiza `module`/`description`, restaura permissões antes obsoletas e marca como obsoletas (`obsolete_at`) as ausentes do catálogo. Permissões obsoletas permanecem no banco e não têm seus vínculos apagados. A leitura de manifestos de módulos e a inclusão de suas permissões entram na F5; até então o comando sincroniza apenas o catálogo do núcleo.

### Superadministrador

O papel de slug `super-admin` é o superadministrador. O bypass é centralizado em `App\Core\Authorization\AuthorizationServiceProvider`, que registra um `Gate::before` retornando `true` para superadministradores antes de qualquer policy ou gate. Não existem condicionais de administrador espalhadas pelo código. O papel `super-admin` é protegido: não pode ser editado nem excluído pela API, e somente um superadministrador pode atribuí-lo. Em `GET /api/v1/auth/user`, o superadministrador recebe o catálogo completo de permissões não obsoletas, e o frontend verifica permissões efetivas para os usuários comuns. A exceção de `super-admin` fica centralizada em `resources/spa/lib/permissions.ts`: `can`, `canAny` e `canAll` autorizam esse papel mesmo sem permissões explícitas na sessão, mantendo painel, navegação e guards consistentes com o bypass do backend.

### Policies e gates

`UserPolicy`, `RolePolicy` e `PermissionPolicy` mapeiam cada operação para a permissão correspondente, e cada permissão do catálogo é exposta como gate com o próprio nome. Form Requests autorizam a operação; rotas administrativas exigem `auth:sanctum`. Operações sobre o último superadministrador válido são bloqueadas com `409` por `LastSuperAdminGuard`, tanto na remoção do papel quanto na exclusão da conta.

### Endpoints administrativos

Todas as rotas abaixo usam o grupo `web` (sessão e CSRF) e `auth:sanctum`, respondem no envelope de [api-conventions.md](api-conventions.md) e ficam sob `/api/v1/admin`.

| Endpoint | Permissão | Corpo | Sucesso |
|---|---|---|---|
| `GET /api/v1/admin/users` | `users.viewAny` | `filter[search]`, `sort`, `perPage`, `page` | `200` paginado |
| `POST /api/v1/admin/users` | `users.create` | `name`, `registry`, `email`, `roles[]` | `201` |
| `GET /api/v1/admin/users/{user}` | `users.view` | — | `200` |
| `PATCH /api/v1/admin/users/{user}` | `users.update` | `name`, `registry`, `email`, `roles[]` (parciais) | `200` |
| `DELETE /api/v1/admin/users/{user}` | `users.delete` | — | `204` |
| `GET /api/v1/admin/roles` | `roles.viewAny` | `filter[search]`, `sort`, `perPage`, `page` | `200` paginado |
| `POST /api/v1/admin/roles` | `roles.create` | `slug`, `name`, `permissions[]` | `201` |
| `GET /api/v1/admin/roles/{role}` | `roles.view` | — | `200` |
| `PATCH /api/v1/admin/roles/{role}` | `roles.update` | `name`, `permissions[]` (parciais) | `200` |
| `DELETE /api/v1/admin/roles/{role}` | `roles.delete` | — | `204` |
| `GET /api/v1/admin/permissions` | `permissions.viewAny` | `filter[module]`, `filter[search]` | `200` (catálogo completo) |

Regras adicionais:

- Criar usuário registra matrícula única para login e e-mail de contato, grava `password` nulo e envia por e-mail o link de uso único do fluxo de definição inicial (`/api/v1/auth/reset-password`); nenhuma senha temporária é enviada.
- `roles[]` usa o `slug` do papel; `permissions[]` usa o nome estável da permissão. O `slug` do papel é imutável após a criação.
- Atribuir `super-admin` exige ser superadministrador (`403` caso contrário).
- Excluir um papel ainda atribuído a usuários retorna `409`; excluir ou editar `super-admin` retorna `409`.
- O último superadministrador não pode perder o papel nem ser excluído (`409`).
- A lista de permissões é um catálogo limitado e por isso é retornada completa, com a marca `obsolete`, sem paginação.

## Auditoria

Alterações de papel, permissão e vínculos DEVERIAM registrar:

- Autor da alteração.
- Alvo.
- Valores anteriores e posteriores.
- Data e hora.
- Contexto técnico necessário à investigação.

## Testes mínimos

Para cada recurso protegido:

- Visitante recebe `401`.
- Usuário sem permissão recebe `403`.
- Usuário com permissão executa a operação.
- Policy considera propriedade ou estado do recurso quando aplicável.
- Menu e rota frontend refletem a permissão.
- Manipulação manual da interface não permite contornar o backend.

## Evolução especificada: origens de autenticação

A [SPEC-002](specs/local-ldap-authentication.md) exige matrícula no cadastro e implementa `ldapEnabled` e `localAuthEnabled`, com as permissões existentes de usuários. Links são enviados apenas às contas com acesso local e o último superadministrador capaz de login local fica protegido. Contas provisionadas no primeiro login LDAP recebem `accountSource=ldap`, sem papéis ou permissões. Nome, e-mail, matrícula e origens dessas contas não aceitam edição manual; a administração ainda pode atribuir/remover papéis. A sincronização de perfil nunca altera papéis ou permissões.
