# Contrato dos módulos

## Objetivo

Este documento define o formato obrigatório de um módulo instalável e suas fronteiras públicas.

## Estrutura mínima

```text
modules/vendor/module-name/
├── composer.json
├── module.json
├── src/
│   ├── Application/
│   │   ├── Actions/
│   │   ├── DTOs/
│   │   └── Queries/
│   ├── Contracts/
│   ├── Domain/
│   │   ├── Events/
│   │   └── Exceptions/
│   ├── Http/
│   │   ├── Controllers/
│   │   ├── Requests/
│   │   └── Resources/
│   ├── Infrastructure/
│   │   ├── Persistence/
│   │   └── Providers/
│   ├── Listeners/
│   ├── Models/
│   ├── Observers/
│   ├── Policies/
│   └── ModuleServiceProvider.php
├── database/
│   ├── factories/
│   ├── migrations/
│   └── seeders/
├── resources/
│   ├── lang/
│   └── spa/
│       ├── components/
│       ├── pages/
│       ├── routes.ts
│       └── module.ts
├── routes/
│   └── api.php
└── tests/
    ├── Feature/
    └── Unit/
```

Diretórios sem uso PODEM ser omitidos.

## Identidade

- O nome Composer DEVE seguir `vendor/package`.
- O pacote DEVE declarar compatibilidade com PHP `~8.5.0` e Laravel `^13.0` enquanto essas forem as versões do núcleo.
- O identificador do módulo DEVE usar kebab-case e ser globalmente único.
- Namespaces PHP DEVEM seguir PSR-4.
- Rotas, permissões, arquivos de configuração e traduções DEVEM possuir prefixo do módulo.
- Tabelas DEVEM ter nomes que evitem colisões previsíveis.

## Manifesto

Todo módulo DEVE fornecer `module.json`.

```json
{
  "$schema": "../../module.schema.json",
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

Campos obrigatórios:

| Campo | Descrição |
|---|---|
| `schemaVersion` | Versão do schema do manifesto suportada pelo núcleo (atualmente `1`) |
| `name` | Identificador técnico único |
| `displayName` | Nome apresentado ao usuário |
| `version` | Versão semântica do módulo |
| `core` | Faixa compatível do núcleo |
| `apiPrefix` | Prefixo das rotas HTTP |
| `frontendEntry` | Entrada de registro na SPA |
| `dependencies` | Módulos obrigatórios e suas versões |
| `permissions` | Permissões fornecidas pelo módulo |

O schema definitivo do manifesto é versionado pelo núcleo em `modules/module.schema.json` e a validação também é feita em código antes da ativação.

O campo `core` declara uma faixa semântica, como `^1.2.0`: a menor versão do núcleo de que o módulo necessita até antes da próxima versão maior. O host valida essa faixa antes da ativação. Dependências entre módulos também declaram faixas de versões. Consulte [compatibility-policy.md](compatibility-policy.md).

## Service Provider

O provider do módulo DEVE estender `App\Core\Modules\ModuleServiceProvider` e implementar `moduleName()`. A classe-base:

- Só carrega rotas, migrations, traduções e bindings quando o módulo está habilitado e sem erros de validação.
- Resolve o estado do módulo e executa `registerBindings()` durante o boot, depois que os providers do host registraram o `ModuleRegistry`; package discovery pode registrar providers de módulos antes disso.
- Registra as rotas sob `api/v1/{apiPrefix}` com o middleware `web`, permitindo que o arquivo de rotas use caminhos relativos e adicione `auth:sanctum` e `can:{permissão}`.
- Descobre as migrations em `database/migrations` e as traduções em `resources/lang`.
- Expõe os ganchos `registerBindings()` e `bootModule()` para o código específico do módulo.

O provider DEVE:

- Ser descoberto pelo mecanismo de package discovery do Composer/Laravel, declarando `extra.laravel.providers` no `composer.json`.
- Registrar comandos de instalação ou manutenção quando necessários.

O provider NÃO DEVE executar consultas ou alterações destrutivas durante o boot da aplicação.

O `composer.json` DEVE declarar `"type": "starterkit-module"`, autoload PSR-4, `php: ~8.5.0` e `laravel/framework: ^13.0`.

## Contrato frontend

O arquivo `module.ts` exporta a definição pública do módulo para a SPA React. Páginas e componentes são escritos em TSX. O contrato conceitual contém:

```ts
export interface FrontendModule {
  name: string;
  displayName?: string;
  navigationGroup?: ModuleNavigationGroup;
  routes?: ModuleRoute[];
  navigation?: ModuleNavigationItem[];
  register?(context: ModuleContext): void;
}

export interface ModuleNavigationGroup {
  icon?: string;
  order?: number;
}
```

Os tipos completos (`ModuleRoute`, `ModuleNavigationItem`, `ModuleNavigationGroup`, `ModuleContext`) são exportados por `@starterkit/module-kit`. Páginas são carregadas sob demanda por `load: () => import(...)`. Rotas podem declarar `permission`, `permissionsAny` ou `permissionsAll`; links de navegação declaram `permission`.

O módulo:

- PODE registrar rotas, páginas, traduções e itens de navegação.
- DEVE importar apenas a superfície pública `@starterkit/module-kit` do núcleo.
- DEVE usar componentes públicos do design system.
- NÃO DEVE alterar estado global fora das APIs expostas pelo núcleo.
- NÃO DEVE depender da estrutura interna de outro módulo.
- DEVE associar itens protegidos às permissões correspondentes.

O módulo distribui o código-fonte React e TypeScript indicado por `frontendEntry`. O host descobre as entradas dos módulos habilitados pelo plugin Vite e as injeta em `virtual:starterkit-modules`, compilando-as com a SPA no build de implantação. A instalação, atualização, habilitação ou desabilitação do pacote exige novo build dos assets frontend.

### Navegação agrupada por módulo

`navigationGroup`, quando presente, agrupa os itens declarados em `navigation` e registrados por `registerNavigation()` sob o nome de negócio do módulo (`displayName`, com fallback para `name`). O núcleo preserva também `FrontendModuleRegistry.navigation` como projeção plana para compatibilidade; módulos sem `navigationGroup` mantêm os links planos. O campo aceita `icon` e `order`; itens filhos mantêm seus próprios `to`, `label`, `permission`, `end` e `order`. A hierarquia suporta dois níveis, e grupos sem filhos autorizados são ocultados.

Módulos que usam esse campo devem exigir núcleo `^1.1.0` ou superior e reconstruir os assets do host. O manifesto não muda de schema. Veja a [SPEC-001](specs/module-sidebar-navigation.md) para comportamento visual e acessibilidade.

## API pública do módulo

São considerados públicos:

- Interfaces dentro de `Contracts` explicitamente documentadas.
- Eventos de domínio documentados.
- Rotas documentadas.
- Permissões do manifesto.
- Entrada frontend e extensões registradas por ela.

Todas as demais classes são internas, mesmo quando tecnicamente acessíveis pelo autoload.

## Instalação

O fluxo esperado é:

1. Validar compatibilidade do módulo e de suas dependências com `core:modules:diagnose`.
2. Instalar o pacote Composer.
3. Descobrir e registrar seu provider pelo package discovery do Composer.
4. Publicar configuração ou assets quando aplicável.
5. Executar migrations.
6. Sincronizar permissões com `core:sync-permissions`.
7. Habilitar com `core:modules:enable` quando necessário.
8. Registrar a entrada frontend e recompilar a SPA do host (`npm run build`).
9. Limpar caches afetados.

O estado de habilitação fica em `storage/app/modules.json`, gerenciado por `core:modules:enable` e `core:modules:disable`. Instalações DEVEM ser não interativas quando utilizadas em pipelines; o diagnóstico e a listagem aceitam `--json`.

## Atualização

- Módulos seguem versionamento semântico.
- Alterações incompatíveis exigem versão principal nova.
- Migrations já distribuídas NÃO DEVEM ser editadas; uma nova migration deve corrigir ou evoluir o schema.
- O módulo DEVE documentar procedimentos adicionais de upgrade.
- O núcleo DEVE recusar versões declaradamente incompatíveis.
- A suíte do módulo DEVE testar a menor versão do núcleo declarada e a versão estável mais recente permitida pela faixa.

## Desabilitação e remoção

Desabilitar impede o carregamento funcional, mas preserva dados e vínculos de permissão. As rotas deixam de ser registradas e as permissões são marcadas como obsoletas na próxima sincronização; reabilitar e sincronizar restaura o acesso.

Remover o código e apagar dados são operações diferentes. Dados NÃO DEVEM ser apagados automaticamente pela remoção do pacote. Uma limpeza destrutiva exige comando explícito e confirmação.

Um módulo do qual outros dependem NÃO PODE ser desabilitado ou removido sem resolver os dependentes; `core:modules:disable` recusa a operação e informa os dependentes habilitados.

## Comunicação entre módulos

### Contratos síncronos

Use quando o chamador precisa do resultado para concluir o caso de uso atual.

### Eventos

Use quando o módulo anuncia um fato e não precisa conhecer os consumidores.

### Read services

Use para expor consultas controladas sem compartilhar Models ou tabelas.

### Proibições

- Dependências circulares.
- Uso direto do Model interno de outro módulo.
- Joins com tabelas privadas de outro módulo sem contrato arquitetural explícito.
- Eventos genéricos sem payload documentado.

## Requisitos de qualidade

Um módulo distribuível DEVE conter:

- Testes unitários dos casos de uso importantes.
- Testes de integração com banco para persistência relevante.
- Testes de feature para sua API.
- Testes de autorização.
- Documentação de instalação e configuração.
- Changelog.
- Matriz de compatibilidade.
