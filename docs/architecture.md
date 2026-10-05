# Arquitetura

## Objetivo

Este starter kit fornece uma base Laravel modular, API-first, preparada para receber funcionalidades instaláveis sem acoplar o domínio da aplicação ao núcleo.

O núcleo resolve preocupações transversais. Módulos resolvem capacidades de negócio.

## Visão geral

```text
┌──────────────────────── SPA ────────────────────────┐
│ Router, layouts, páginas, estado e design system    │
│ Registro das extensões frontend de cada módulo      │
└──────────────────────────┬──────────────────────────┘
                           │ HTTPS / JSON
┌──────────────────────────▼──────────────────────────┐
│ Laravel API                                         │
│ Auth, autorização, casos de uso e módulos           │
├─────────────────────────────────────────────────────┤
│ MariaDB                                             │
└─────────────────────────────────────────────────────┘
```

## Endereços da aplicação

A SPA e a API são servidas pelo mesmo domínio e protocolo. Em produção, por exemplo:

```text
https://exemplo.com/          → SPA React
https://exemplo.com/login     → rota da SPA
https://exemplo.com/api/v1    → API Laravel
https://exemplo.com/sanctum/csrf-cookie → inicialização CSRF do Sanctum
```

O endpoint técnico de CSRF mantém o caminho padrão do Sanctum. As operações de autenticação da aplicação seguem `/api/v1/auth`. A configuração do servidor deve entregar rotas da SPA ao seu ponto de entrada sem capturar `/api/*` ou `/sanctum/*`.

## Plataforma e dependências

- Núcleo: Laravel 13 e PHP 8.5.
- Módulos distribuíveis: compatíveis com Laravel `^13.0` e PHP `~8.5.0`, enquanto essa for a plataforma do núcleo.
- Composer e gerenciador de pacotes JavaScript registram resoluções em lockfiles versionados pelo host.
- Para novas dependências, selecionar a versão estável mais recente que seja compatível com Laravel 13, PHP 8.5, React, TypeScript e as dependências existentes.
- Atualizações de dependências são deliberadas: resolver versões, executar análise estática, testes e build, e só então atualizar os lockfiles.
- Uma nova versão principal de uma biblioteca não entra automaticamente quando exigir mudanças incompatíveis no núcleo ou nos módulos.
- Um upgrade futuro de Laravel ou PHP exige nova decisão arquitetural e revisão das faixas de compatibilidade.
- O sistema é executado em Docker; o desenvolvimento do host e dos módulos usa Laravel Sail. A imagem de execução fora do desenvolvimento não depende de Sail. Ver [environment.md](environment.md).

## Princípios

1. **Núcleo pequeno:** o núcleo contém apenas capacidades compartilhadas por várias aplicações.
2. **Módulos autônomos:** cada módulo possui rotas, migrations, permissões, casos de uso e testes próprios.
3. **Dependências explícitas:** integrações entre módulos acontecem por contratos públicos ou eventos.
4. **API como fronteira:** a SPA não depende da estrutura interna dos Models ou do banco.
5. **Segurança no servidor:** esconder elementos no frontend nunca substitui autorização backend.
6. **Instalação reversível:** um módulo pode ser instalado, atualizado e desabilitado de maneira previsível.
7. **Convenção antes de configuração:** módulos seguem a mesma estrutura e ciclo de vida.

## Responsabilidades do núcleo

O núcleo DEVE fornecer:

- Bootstrap e descoberta de módulos.
- Autenticação e gerenciamento da sessão.
- Usuário autenticável.
- Recuperação e alteração de senha.
- Catálogo de papéis e permissões.
- Tratamento e serialização de erros.
- Contratos compartilhados estritamente necessários.
- Registro de menus, rotas SPA e permissões dos módulos.
- Layouts e componentes visuais fundamentais.
- Infraestrutura de testes para módulos.

O núcleo NÃO DEVE conter regras específicas como clientes, pedidos, estoque ou financeiro.

## Organização sugerida

```text
app/
├── Core/
│   ├── Auth/
│   ├── Authorization/
│   ├── Exceptions/
│   ├── Http/
│   └── Modules/
├── Models/
└── Providers/
bootstrap/
config/
database/
docs/
modules/
resources/
└── spa/
routes/
└── api.php
tests/
```

`app/Core` contém a infraestrutura que pertence ao starter kit. `modules` contém pacotes locais usados durante o desenvolvimento. Um módulo pode ser extraído posteriormente para um repositório Composer independente.

## Camadas de um módulo

```text
HTTP → Application → Domain
          │             ▲
          ▼             │
     Infrastructure ────┘
```

### HTTP

Contém controllers invocáveis, Form Requests e API Resources. Conhece HTTP, mas não implementa regras de negócio.

### Application

Contém Actions, DTOs e Queries que coordenam casos de uso. Pode iniciar transações e publicar eventos.

### Domain

Contém regras, contratos, eventos e exceções que descrevem o negócio. NÃO DEVE depender da camada HTTP.

### Infrastructure

Implementa persistência, integrações e bindings. Pode depender de Laravel, Eloquent, filas e serviços externos.

## Fluxo de escrita

```text
Route
  → Invokable Controller
  → Form Request
  → DTO
  → Action
  → Model ou Repository
  → Domain Event
  → API Resource
  → JSON Response
```

## Fluxo de leitura

```text
Route
  → Invokable Controller
  → Form Request de filtros
  → Query Object ou Query Scope
  → API Resource Collection
  → JSON Response
```

Leituras não precisam ser forçadas a passar pelo mesmo modelo de domínio usado nas escritas. Queries de tela podem usar projeções próprias, desde que preservem autorização e encapsulamento.

## Dependências entre módulos

Um módulo PODE depender do núcleo e de contratos públicos declarados por outros módulos.

Um módulo NÃO DEVE:

- Consultar diretamente tabelas pertencentes a outro módulo.
- Importar classes internas de outro módulo.
- Presumir a existência de rotas, telas ou permissões não declaradas como dependência.
- Alterar migrations pertencentes a outro módulo.

Integrações recomendadas:

- Contrato síncrono para uma resposta imediata necessária.
- Evento para informar que algo ocorreu.
- Read service público para leitura controlada.
- Identificador simples para referências persistidas entre módulos.

Dependências circulares são proibidas.

## Transações

- Actions controlam transações quando o caso de uso altera múltiplos registros.
- Controllers NÃO iniciam transações.
- Eventos com efeitos externos DEVEM ser processados depois do commit quando dependerem dos dados persistidos.
- Chamadas HTTP externas NÃO DEVEM permanecer dentro de uma transação longa.

## MariaDB

- Toda alteração de schema DEVE ser feita por migration.
- Migrations pertencem ao módulo dono dos dados.
- Chaves estrangeiras, índices e restrições DEVEM ser declarados explicitamente.
- Valores monetários usam tipos decimais, nunca ponto flutuante.
- Datas persistidas seguem uma única referência temporal definida pela aplicação; conversão de fuso ocorre nas fronteiras.
- Consultas dependentes de comportamento específico do MariaDB DEVEM possuir testes de integração.
- Exclusões lógicas são adotadas apenas quando houver requisito funcional ou de auditoria.

## Decisões arquiteturais

Mudanças estruturais DEVEM ser registradas nesta seção ou em um ADR dedicado.

### ADR-001 — Backend API-first

**Status:** aceito.

Laravel expõe dados e operações por JSON. A interface principal é uma SPA e não depende de views Blade para as páginas da aplicação.

### ADR-002 — Módulos como pacotes Composer

**Status:** aceito.

Cada módulo instalável possui `composer.json`, Service Provider, manifesto e ciclo de vida próprio.

### ADR-003 — SPA React e TypeScript

**Status:** aceito.

O frontend usa React com TypeScript e componentes TSX. O registro de rotas e páginas dos módulos deve seguir esse contrato.

### ADR-004 — Sem multitenancy

**Status:** aceito.

Não serão introduzidos `tenant_id`, scopes globais de tenant ou resolução de organização no núcleo.

### ADR-005 — Frontend dos módulos compilado pelo host

**Status:** aceito.

Cada módulo distribui o código-fonte React e TypeScript de sua extensão frontend. A aplicação host descobre as entradas dos módulos instalados e as compila junto com a SPA durante o build de implantação. Instalar ou atualizar um módulo exige novo build e publicação dos assets da SPA; não há carregamento dinâmico de bundles publicados separadamente na primeira versão.

### ADR-006 — Mesmo domínio para SPA e API

**Status:** aceito.

A SPA e a API usam a mesma origem. A API da aplicação ocupa `/api/v1`; o endpoint técnico `/sanctum/csrf-cookie` conserva seu caminho padrão. Essa topologia permite autenticação por sessão e cookies sem configuração entre origens distintas.

### ADR-007 — Versões da plataforma

**Status:** aceito.

O núcleo usa Laravel 13 e PHP 8.5. Bibliotecas e pacotes adotam a versão estável mais recente que seja compatível com a plataforma e entre si. Lockfiles preservam builds reproduzíveis.

### ADR-008 — Componentes shadcn/ui

**Status:** aceito.

O núcleo incorpora e mantém o código dos componentes shadcn/ui usados pela aplicação. Tokens, estilos e interfaces públicas seguem `design.md`. Módulos consomem os componentes públicos do núcleo em vez de manter cópias próprias.

### ADR-009 — Estado compartilhado com Context e reducer

**Status:** aceito.

Estado compartilhado da SPA usa React Context e `useReducer`. Cada contexto tem responsabilidade definida e expõe uma API estável. Estado de página e formulário permanece local; dados recebidos da API não são copiados indiscriminadamente para contextos globais.

### ADR-010 — React Hook Form

**Status:** aceito.

React Hook Form é o padrão para formulários da SPA. Os componentes shadcn/ui adotados pelo núcleo fornecem os campos e estados visuais; Form Requests do Laravel continuam sendo a autoridade da validação no servidor. Erros `422` são associados aos campos do formulário.

### ADR-011 — Compatibilidade entre núcleo e módulos

**Status:** aceito.

Núcleo e módulos seguem versões independentes em `MAJOR.MINOR.PATCH`. Cada módulo declara no manifesto a faixa do núcleo e as versões de outros módulos que suporta. A instalação recusa combinações incompatíveis. A suíte de cada módulo testa a menor e a versão estável mais recente do núcleo permitidas pela faixa. O contrato completo está em [compatibility-policy.md](compatibility-policy.md).

### ADR-012 — Provisionamento de contas

**Status:** aceito.

Não há cadastro público. O primeiro administrador é criado por comando administrativo, sem senha padrão distribuída. Login local e LDAP usam matrícula como identificador; administradores autorizados informam matrícula e e-mail de contato ao criar usuários. O e-mail serve para comunicação e recuperação de senha. Cada novo usuário elegível recebe por e-mail um link de uso único para definir a própria senha. Convites com fluxo adicional podem ser adicionados no futuro.

### ADR-013 — Atualizações parciais por PATCH

**Status:** aceito.

Edições comuns de recursos usam `PATCH`. `PUT` fica reservado a substituições completas documentadas. A semântica está em [api-conventions.md](api-conventions.md).

### ADR-014 — Sessões após redefinição de senha

**Status:** aceito.

Uma redefinição de senha bem-sucedida invalida todas as sessões anteriores do usuário, inclusive acessos persistentes por “lembrar-me” caso esse recurso exista no futuro. O fluxo exige nova autenticação.

### ADR-015 — Docker para execução e Sail para desenvolvimento

**Status:** aceito.

O sistema roda em Docker. O núcleo e os módulos são desenvolvidos com Laravel Sail, que fornece um fluxo compartilhado para PHP, MariaDB e ferramentas de desenvolvimento em containers. O artefato fora do desenvolvimento usa imagem própria construída por pipeline, com configuração externa e dados persistentes, sem depender do runtime Sail. A separação evita levar dependências de desenvolvimento para a implantação e permite verificar o mesmo contrato de plataforma em ambos os ambientes. Requisitos e validação constam em [environment.md](environment.md).

### ADR-016 — Identificação e serialização de erros da API

**Status:** aceito para a F1.

O servidor atribui um ULID novo a cada requisição e o expõe em `X-Request-Id`. Erros sob `/api/v1` retornam sempre JSON no envelope documentado em [api-conventions.md](api-conventions.md), inclusive quando o cliente não envia `Accept: application/json`. A API não reutiliza IDs fornecidos pelo cliente. Exceções inesperadas são registradas pelo handler do Laravel com o mesmo `requestId` no contexto do log; a resposta pública preserva o status, mas não revela detalhes internos. O middleware global atribui o identificador também quando não há rota correspondente, sem interferir no fallback da SPA.

### ADR-017 — Autorização por permissões com bypass centralizado

**Status:** aceito para a F3.

O núcleo controla operações por permissões `{recurso}.{ação}` agrupadas em papéis, persistidas em `permissions`/`permission_role` sobre `roles`/`role_user`. O frontend decide por permissões efetivas expostas em `GET /api/v1/auth/user`, nunca inferindo capacidades a partir de papéis. O papel de slug `super-admin` é o superadministrador e seu bypass fica centralizado em um único `Gate::before` no provider de autorização, evitando condicionais de administrador espalhadas. O catálogo é sincronizado de forma não destrutiva por `core:sync-permissions`: permissões ausentes são marcadas como obsoletas, não apagadas, e os vínculos existentes são preservados. A leitura de manifestos de módulos para completar o catálogo pertence à F5. As regras completas estão em [authorization.md](authorization.md).

### ADR-018 — Implementação da SPA essencial

**Status:** aceito para a F4.

A SPA usa React 19, TypeScript estrito, Vite e Tailwind CSS 4. O código dos componentes shadcn/ui adotados (Radix UI como base, `class-variance-authority`, `clsx` e `tailwind-merge`) é mantido no próprio projeto; os tokens de `design.md` são declarados em `styles/tokens.css` e mapeados para utilitários em `styles/globals.css`. O tema resolvido é escrito em `data-theme` antes da primeira pintura por um script inline em `app.blade.php`, evitando o flash de tema; a preferência (`system`, `light`, `dark`) é persistida em `localStorage`.

Um cliente HTTP único centraliza `credentials: same-origin`, o fluxo `/sanctum/csrf-cookie` e o cabeçalho `X-XSRF-TOKEN`, normaliza o envelope de erro e sinaliza eventos `auth:unauthorized`/`auth:csrf-expired`. A store de sessão modela `unknown → loading → authenticated | guest`; a store de tema mantém `preference` e `resolved`. Guards de rota usam permissões (`RequirePermission`), nunca nomes de papéis. Rotas protegidas aguardam a resolução da sessão antes de decidir.

A validação essencial da SPA é coberta por testes de unidade, componente e integração com Vitest e Testing Library, e por testes end-to-end com Playwright dos fluxos de login/logout, sessão, páginas de erro e administração de usuários. A execução E2E usa o stack Docker em `E2E_BASE_URL` e um administrador semeado por comando.

### ADR-019 — Ciclo de vida dos módulos

**Status:** aceito para a F5.

O manifesto `module.json` é versionado por `schemaVersion` (versão 1) e validado contra o schema mantido pelo núcleo em `modules/module.schema.json`. A descoberta varre as raízes configuradas em `modules.paths` (padrão `modules/`) por pacotes `vendor/name` com `type: starterkit-module`; o provider é carregado pelo package discovery do Composer via `extra.laravel.providers`. Antes da ativação o núcleo valida identificador, schema, faixa `core`, requisitos de PHP/Laravel, provider, dependências entre módulos e ausência de ciclos. Manifesto inválido, versão incompatível, dependência ausente/circular ou provider não carregável impedem a ativação.

O estado de habilitação é persistido fora do banco em `storage/app/modules.json`, lido no boot sem consultar a conexão. Os providers de módulo estendem `App\Core\Modules\ModuleServiceProvider`; a base só carrega rotas, migrations, traduções e bindings quando o módulo está habilitado e válido. Desabilitar impede o uso funcional e a sincronização marca as permissões como obsoletas sem apagar vínculos nem dados; reabilitar restaura rotas e permissões. A sincronização de `core:sync-permissions` soma o catálogo do núcleo ao dos módulos habilitados, de forma não destrutiva.

Cada módulo distribui a entrada React/TypeScript indicada em `frontendEntry`. O plugin Vite do host (`build/modules-vite-plugin.ts`) descobre as entradas dos módulos habilitados e as injeta por import dinâmico em `virtual:starterkit-modules`; a SPA agrega rotas e navegação no `ModuleRegistry`. Módulos importam apenas a superfície pública `@starterkit/module-kit`. Instalar, atualizar ou habilitar um módulo exige novo build dos assets. Os comandos `core:modules:list`, `core:modules:diagnose`, `core:modules:enable`, `core:modules:disable` e `core:modules:entries` apoiam a operação e pipelines de forma não interativa.

### ADR-020 — Momento de registro dos bindings dos módulos

**Status:** aceita para a F6.

Providers de módulos são descobertos pelo Composer, antes da fase de boot dos providers da aplicação. Por isso, `ModuleServiceProvider` resolve o `ModuleRegistry` e invoca `registerBindings()` no boot, após os providers do host registrarem suas dependências. O hook continua condicionado ao módulo estar habilitado e válido. `registerBindings()` configura bindings e políticas; não deve executar operações destrutivas nem depender de efeitos de boot fora do contrato do módulo.

### ADR-021 — Serviços da imagem de produção

**Status:** aceito para a F7.

A imagem de produção é construída em etapas multi-stage a partir dos lockfiles. O alvo `app` executa PHP-FPM sem root; o alvo `web` executa Nginx sem root e serve os assets compilados da SPA. Ambos usam as mesmas fontes/revisão e são implantados juntos por `compose.production.yaml`; MariaDB e o estado persistente dos módulos ficam em volumes separados. O proxy externo termina TLS e encaminha SPA/API pela mesma origem. O runtime não inclui Sail nem dependências de desenvolvimento. Requisitos e roteiro operacional estão em [production-deployment.md](production-deployment.md).

### ADR-022 — Navegação lateral agrupada por módulo

**Status:** aceita; implementada no contrato frontend do núcleo `1.1.0`.

O módulo pode declarar `navigationGroup` no contrato frontend para apresentar um grupo expansível com suas páginas como submenus. O núcleo é responsável por renderização, filtragem por permissão, estado ativo e acessibilidade, com dois níveis de navegação. O pai usa o nome de negócio do módulo e não navega; grupos sem filhos autorizados ficam ocultos. Módulos que não adotarem a extensão preservam os links planos. A projeção plana `navigation` permanece disponível para compatibilidade.

O comportamento responsivo, migração e critérios de aceite estão em [SPEC-001 — Navegação lateral agrupada por módulo](specs/module-sidebar-navigation.md) e no [plano de implementação](plans/spec-001-module-sidebar-navigation-plan.md). O agrupamento visual por módulo substitui, para os itens de módulos, a regra anterior de agrupamento por capacidades.

### ADR-023 — Autenticação local e LDAP do IFCE

**Status:** aceita e implementada; homologação LDAP pendente.

O núcleo permite senha local e bind no Active Directory do IFCE, mantendo usuário, sessão Sanctum e autorização locais. Matrícula é o identificador de login para ambas as origens; e-mail permanece como contato para comunicação e recuperação. `AUTH_MODE=local` oferece apenas senha local; `AUTH_MODE=ldap` habilita também autenticação institucional. A exigência original de provisionamento administrativo para LDAP foi substituída pela ADR-024. O login LDAP não atribui papéis. Fallback para senha local só ocorre em contas previamente vinculadas com acesso local autorizado. O primeiro e o último administrador de contingência permanecem capazes de login local. O transporte LDAP é configurável: LDAPS, StartTLS ou LDAP sem criptografia conforme o diretório institucional. Senhas institucionais não são armazenadas ou alteradas no host. A opção sem criptografia transmite credenciais pela rede e requer rede confiável.

A [SPEC-002](specs/local-ldap-authentication.md) define persistência, contrato de login por matrícula, recuperação por origem, tratamento de indisponibilidade e diferenças deliberadas em relação ao skeleton do IFCE. Consulte o [plano](plans/spec-002-local-ldap-authentication-plan.md). A alteração substitui o identificador local legado `email` por `registry`; o contrato administrativo requer matrícula e e-mail de contato.

### ADR-024 — Provisionamento LDAP no primeiro login e perfil institucional

**Status:** aceita.

O formulário recebe matrícula e senha, com resolução automática da origem. Contas locais existentes usam senha local; contas LDAP usam o diretório. No modo LDAP, uma matrícula ausente na base local pode autenticar no AD e criar sua conta a partir de nome, e-mail e matrícula, após leitura de uma entrada única dentro do base DN configurado. A nova conta é marcada como administrada pelo LDAP, sem senha local, papéis ou permissões. Nenhum vínculo é inferido por e-mail; conflitos de e-mail, matrícula ou identificador estável do diretório impedem provisionamento e exigem revisão administrativa.

Nome, e-mail, matrícula e origens da conta importada ficam protegidos contra alteração manual, inclusive por APIs administrativas; papéis continuam administrados no host. A página de perfil oferece sincronização explícita de nome/e-mail mediante nova confirmação da senha institucional e do mesmo `objectGUID`. A sincronização conserva matrícula, ID local, papéis e permissões. A senha institucional não é armazenada; o AD nunca concede papéis. As contas previamente provisionadas com LDAP e fallback local autorizado conservam seu contrato. A mudança substitui a proibição de provisionamento no login da ADR-023 e está detalhada na SPEC-002.
