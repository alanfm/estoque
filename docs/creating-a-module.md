# Como criar um módulo

## Objetivo

Este roteiro descreve a criação de um módulo compatível com o starter kit. O exemplo didático usa o recurso `customers`, mantido apenas na documentação upstream; esse pacote não está instalado no estoque. O módulo de negócio desta aplicação é `acme/inventory`.

O desenvolvimento e os testes do módulo usam o host no ambiente Docker/Laravel Sail descrito em [environment.md](environment.md); instalação Composer, migrations e build frontend acontecem nesse host. A publicação do host com o módulo requer nova imagem e novo build dos assets.

## 1. Definir a fronteira

Antes de criar arquivos, registre:

- Capacidade de negócio fornecida.
- Dados dos quais o módulo é proprietário.
- Operações públicas.
- Permissões.
- Eventos publicados.
- Contratos consumidos de outros módulos.
- Dependências obrigatórias.

Se duas capacidades têm ciclos de dependência, a fronteira precisa ser revista antes da implementação.

## 2. Criar o pacote

Estrutura inicial:

```text
modules/acme/customers/
├── composer.json
├── module.json
├── src/
│   └── CustomersServiceProvider.php
├── database/
│   └── migrations/
├── resources/
│   └── spa/
│       └── module.ts
├── routes/
│   └── api.php
└── tests/
```

O `composer.json` deve declarar:

- Nome no formato `vendor/package`, versão e `"type": "starterkit-module"`.
- Versão PHP (`~8.5.0`) e Laravel (`^13.0`) compatíveis.
- Autoload PSR-4.
- Namespace de testes.
- `extra.laravel.providers` com o Service Provider para package discovery.

## 3. Criar o manifesto

```json
{
  "schemaVersion": 1,
  "name": "customers",
  "displayName": "Clientes",
  "version": "1.0.0",
  "core": "^1.0",
  "apiPrefix": "customers",
  "frontendEntry": "resources/spa/module.ts",
  "dependencies": [],
  "permissions": [
    "customers.viewAny",
    "customers.view",
    "customers.create",
    "customers.update",
    "customers.delete"
  ]
}
```

Valide o manifesto com `./vendor/bin/sail artisan core:modules:diagnose` antes de escrever o restante do módulo.

## 4. Registrar o provider

O provider deve estender `App\Core\Modules\ModuleServiceProvider` e implementar `moduleName()`:

```php
final class CustomersServiceProvider extends ModuleServiceProvider
{
    protected function moduleName(): string
    {
        return 'customers';
    }

    protected function registerBindings(ModuleDescriptor $module): void
    {
        // bindings do módulo
    }
}
```

A base carrega rotas, migrations, traduções e bindings apenas quando o módulo está habilitado e sem erros. Não execute migrations, seeders ou alterações de dados automaticamente durante o boot.

## 5. Criar o schema

- Adicione uma migration nova.
- Declare chaves estrangeiras, índices e restrições.
- Crie factory para testes.
- Não edite migrations já publicadas em versões anteriores.
- Confirme compatibilidade real com MariaDB.

## 6. Implementar um caso de uso

Para `CreateCustomer`:

```text
StoreCustomerRequest
  → CreateCustomerData
  → CreateCustomerAction
  → Customer
  → CustomerCreated
  → CustomerResource
```

Responsabilidades:

- Request valida formato e autorização.
- DTO transporta dados tipados.
- Action aplica regras e persiste.
- Evento anuncia o fato.
- Resource controla o JSON público.

## 7. Criar a leitura

Para uma listagem:

```text
ListCustomersRequest
  → ListCustomersQuery
  → paginator
  → CustomerResource::collection(...)
```

A Query aplica somente filtros e ordenações permitidos. O Controller não contém `where`, `join` ou lógica de paginação.

## 8. Criar controllers invocáveis

Crie um controller por operação:

```text
ListCustomersController
ShowCustomerController
StoreCustomerController
UpdateCustomerController
DeleteCustomerController
```

Cada controller recebe dependências, chama uma Action ou Query e retorna a resposta.

## 9. Aplicar autorização

- Crie `CustomerPolicy`.
- Associe operações às permissões do manifesto.
- Autorize no backend.
- Teste visitante, usuário sem permissão e usuário autorizado.
- Não use a visibilidade do botão como mecanismo de segurança.

## 10. Definir as rotas

As rotas devem:

- Declarar caminhos relativos no arquivo `routes/api.php`; a base do provider aplica `api/v1/{apiPrefix}` e o middleware `web`.
- Usar `PATCH` para edições parciais de recursos; reservar `PUT` para substituição completa documentada.
- Exigir autenticação (`auth:sanctum`) e permissão (`can:{permissão}`) quando aplicável.
- Apontar para controllers invocáveis.
- Usar nomes prefixados e únicos.

## 11. Registrar o frontend

O arquivo `resources/spa/module.ts` deve registrar:

- Rotas do módulo.
- Páginas carregadas sob demanda.
- Itens de navegação.
- Permissões requeridas para cada extensão.

Criação e edição de registros DEVEM ter páginas e rotas dedicadas, com `PageHeader`, breadcrumbs e ações próprias de salvar/cancelar. Modal ou painel NÃO DEVE ser o padrão para formulário completo; reserve-o a ações rápidas e contextuais.

Importe apenas a superfície pública `@starterkit/module-kit`; páginas são exibidas dentro do `AdminLayout` e usam componentes públicos do design system.

```ts
import type { FrontendModule } from "@starterkit/module-kit";

export default {
  name: "customers",
  displayName: "Clientes",
  navigationGroup: { icon: "Users", order: 100 },
  routes: [
    {
      path: "admin/customers",
      load: () => import("./pages/CustomersListPage"),
      permission: "customers.viewAny",
    },
  ],
  navigation: [
    {
      to: "/admin/customers",
      label: "Listar clientes",
      permission: "customers.viewAny",
      order: 10,
    },
  ],
} satisfies FrontendModule;
```

No módulo de referência, criação e edição abrem em modais na listagem; somente a listagem possui rota e submenu (ADR-025).

Módulos que adotam `navigationGroup` devem declarar no manifesto uma faixa `core` que inclua `^1.1.0` e gerar novo build dos assets no host. Sem o campo, os itens permanecem links planos. `ModuleNavigationItem.permission` filtra cada link; não associe permissão ao grupo. Consulte a [SPEC-001](specs/module-sidebar-navigation.md) para os detalhes de comportamento e acessibilidade.

## 12. Implementar estados da interface

Cada página de dados deve tratar:

- Carregamento.
- Sucesso.
- Vazio.
- Falha.
- Sem permissão.
- Sessão expirada.

Formulários também tratam validação `422`, submissão em andamento e prevenção de envio duplicado.

## 13. Testar

Checklist mínimo:

- [ ] Manifesto válido.
- [ ] Migrations executam em banco limpo.
- [ ] Factory produz registros válidos.
- [ ] Actions possuem testes de regras importantes.
- [ ] API possui testes de sucesso e erro.
- [ ] Cada operação possui testes de autorização.
- [ ] Resources não expõem campos internos.
- [ ] Filtros, ordenação e paginação são testados.
- [ ] Entrada frontend é carregada.
- [ ] Páginas respeitam permissões.
- [ ] Fluxo principal possui teste end-to-end quando crítico.

## 14. Documentar

O módulo deve fornecer:

- Resumo funcional.
- Requisitos e compatibilidade.
- Instalação.
- Configuração.
- Permissões.
- Endpoints públicos.
- Eventos e contratos.
- Procedimento de atualização.
- Changelog.

## 15. Validar a distribuição

Antes de publicar:

1. Instale o módulo em uma aplicação limpa.
2. Valide o manifesto com `core:modules:diagnose`.
3. Execute migrations.
4. Sincronize permissões com `core:sync-permissions`.
5. Compile a SPA.
6. Execute testes e análise estática.
7. Desabilite e reabilite o módulo (`core:modules:disable` / `core:modules:enable`) preservando dados.
8. Atualize a partir da versão anterior suportada.
9. Confirme que a remoção do pacote não apaga dados silenciosamente.

## Checklist de revisão arquitetural

- [ ] O módulo possui uma fronteira de negócio clara.
- [ ] Não acessa tabelas internas de outro módulo.
- [ ] Não cria dependência circular.
- [ ] Não adiciona regra específica ao núcleo.
- [ ] Controllers são invocáveis e magros.
- [ ] Requests, DTOs, Actions e Resources têm responsabilidades distintas.
- [ ] Queries estão fora dos Controllers.
- [ ] Eventos e listeners não escondem regras essenciais.
- [ ] Contratos públicos estão documentados.
- [ ] Alterações incompatíveis respeitam versionamento semântico.
