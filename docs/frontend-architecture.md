# Arquitetura do frontend

## Objetivo

Definir uma SPA modular que consuma a API Laravel, preserve o sistema de design e aceite extensões fornecidas pelos módulos.

## Tecnologia

O frontend usa React com TypeScript em modo estrito. Páginas e componentes usam TSX. O bundler previsto é Vite. Componentes visuais partem de shadcn/ui e são mantidos como código do núcleo.

Requisitos para a implementação:

- TypeScript com modo estrito.
- Router oficial ou consolidado no ecossistema.
- Suporte a code splitting.
- Testes de componente.
- Boa integração com Vite.
- Capacidade de registrar rotas e itens de navegação por módulo.
- Ecossistema acessível e sustentável.

## Estrutura

```text
resources/spa/
├── app/
│   ├── App.tsx
│   ├── bootstrap.ts
│   └── providers/
├── components/
│   ├── actions/
│   ├── data-display/
│   ├── feedback/
│   ├── forms/
│   ├── navigation/
│   └── overlays/
├── layouts/
│   ├── AuthLayout
│   ├── PublicLayout
│   └── AdminLayout
├── modules/
│   ├── registry.ts
│   ├── bootstrap.ts
│   └── types.ts
├── module-kit/
│   └── index.ts
├── router/
├── services/
│   ├── api/
│   └── auth/
├── stores/
├── styles/
│   ├── tokens.css
│   └── globals.css
├── types/
└── main.tsx
```

## Camadas

### App shell

Inicializa dependências globais, autenticação, router, tratamento de erros, tema e módulos habilitados.

### Design system

Fornece componentes fundamentais, tokens e padrões de acessibilidade. Os componentes shadcn/ui adotados passam a ser código do projeto e são adaptados conforme `design.md`. Módulos não recriam seus próprios botões, campos ou modais quando existir componente público equivalente.

### Services

Concentram comunicação HTTP, normalização de erro e integrações do navegador. Componentes NÃO realizam chamadas HTTP dispersas quando houver service ou hook próprio do recurso.

### State

Estado global é reservado para dados realmente compartilhados, como sessão, tema e registro de módulos. Ele usa React Context e `useReducer`, com contextos separados por responsabilidade. Estado de formulário, modal ou página permanece local sempre que possível. Dados da API são consultados por services e hooks; não são duplicados automaticamente em um contexto global.

### Modules

Cada módulo registra suas páginas, rotas, navegação e traduções por uma entrada pública.

As entradas React e TypeScript dos módulos instalados são descobertas e compiladas junto com a SPA do host durante a implantação. Uma mudança de módulo exige novo build dos assets frontend.

Módulos importam somente `@starterkit/module-kit`, a superfície pública do núcleo para frontend; qualquer outro caminho interno não é contrato. O host injeta as entradas habilitadas pelo módulo virtual `virtual:starterkit-modules`, gerado pelo plugin Vite em `build/modules-vite-plugin.ts`, que lê os manifestos e o estado de habilitação.

## Registro de módulos

Contrato conceitual:

```ts
export interface FrontendModule {
  name: string;
  routes: RouteDefinition[];
  navigation: NavigationItem[];
  register(context: ModuleContext): void;
}
```

O registro deve:

- Validar nomes duplicados.
- Validar dependências.
- Filtrar rotas e navegação por permissão.
- Carregar páginas sob demanda.
- Isolar falhas de um módulo quando tecnicamente possível.
- Oferecer mensagens de diagnóstico úteis em desenvolvimento.

Módulos podem declarar `navigationGroup` para agrupar seus links em dois níveis. O registro mantém `navigation` como lista plana para compatibilidade e fornece uma projeção agrupada ao shell. Permissões são filtradas por link e grupos sem filhos autorizados não são renderizados. A associação é atômica: falha no registro de um módulo não deixa contribuições parciais.

### Navegação lateral agrupada por módulo

`AdminNav` renderiza grupos expansíveis opcionais e páginas no segundo nível. A expansão acompanha o grupo da rota ativa, pode ser controlada manualmente e é compartilhada entre as instâncias desktop/mobile durante a montagem do layout. No modo recolhido, ativar um grupo expande a sidebar e preserva o foco; no overlay mobile, somente navegar fecha o menu. O comportamento completo está na [SPEC-001](specs/module-sidebar-navigation.md).

## Roteamento

- Rotas públicas, de autenticação e administrativas são separadas.
- Rotas protegidas aguardam a resolução do estado de autenticação.
- Guards usam permissões, não nomes de papéis.
- Páginas possuem título e metadados declarativos.
- Módulos usam prefixos previsíveis.
- Página `404` e página `403` são diferentes.
- Redirecionamentos preservam o destino pretendido quando seguro.

## Cliente HTTP

O cliente HTTP centralizado DEVE:

- Definir base URL e headers comuns.
- Enviar cookies quando necessário.
- Inicializar e renovar o fluxo CSRF.
- Normalizar erros conforme `api-conventions.md`.
- Tratar `401`, `403`, `419`, `422` e `429` consistentemente.
- Propagar cancelamento de requisições.
- Não registrar corpos sensíveis.

Interceptadores NÃO DEVEM esconder regras de negócio nem criar ciclos infinitos de nova tentativa.

## Autenticação

A store de sessão possui estados explícitos:

```text
unknown → loading → authenticated
                  └→ guest
```

Ela armazena somente dados derivados necessários para a interface. A credencial continua sendo o cookie gerenciado pelo backend.

## Formulários

React Hook Form é o padrão de gerenciamento de formulários da SPA. Os campos visuais são os componentes públicos do design system. Form Requests do Laravel continuam sendo a autoridade da validação no servidor; respostas `422` devem ser associadas aos campos correspondentes.

- Componentes de campo associam label, ajuda e erro por identificadores acessíveis.
- Erros `422` são mapeados para seus campos.
- Erros gerais aparecem em uma região de feedback da página ou formulário.
- Botões de envio possuem estado de carregamento e impedem submissão duplicada.
- Valores digitados não são perdidos por uma falha recuperável.
- Confirmações destrutivas descrevem claramente o impacto.

## Tabelas e listagens

- Filtros relevantes são refletidos na URL.
- Paginação, ordenação e busca são realizadas no servidor para conjuntos não triviais.
- A tabela possui estado de carregamento, vazio, erro e sucesso.
- Ações por linha respeitam permissões.
- Tabelas responsivas preservam o significado dos dados; rolagem horizontal pode ser preferível a esconder colunas importantes.

## Tratamento de erros

- Erros esperados são apresentados próximos ao contexto da ação.
- Erros inesperados acionam uma boundary global e oferecem um `requestId` quando disponível.
- Toast não é usado para mensagens que exigem leitura prolongada ou ação.
- O frontend não exibe stack traces ou detalhes internos.

## Performance

- Páginas de módulos usam lazy loading.
- Dependências compartilhadas não devem ser duplicadas nos bundles dos módulos.
- Listas grandes usam paginação; virtualização é adicionada somente quando necessária.
- Requisições redundantes são deduplicadas ou armazenadas em cache com política explícita.
- O orçamento de bundle será definido após medir o primeiro build de produção com módulos instalados.

## Acessibilidade

- Navegação completa por teclado.
- Foco visível.
- Ordem de foco coerente.
- Modais prendem e restauram foco.
- Alterações assíncronas relevantes são anunciadas.
- Componentes nativos são preferidos antes de recriações ARIA complexas.
- Contraste segue WCAG AA como mínimo.

## Testes

- Funções puras e stores: testes unitários.
- Componentes públicos: testes de comportamento e acessibilidade.
- Páginas: testes de integração com API simulada.
- Login, autorização e fluxos críticos: testes end-to-end.

## Restrições para módulos

Um módulo frontend NÃO DEVE:

- Modificar diretamente a store de outro módulo.
- Importar arquivos internos de outro módulo.
- Criar tokens visuais próprios sem aprovação do design system.
- Registrar listeners globais sem removê-los.
- Presumir que um papel equivale a uma permissão.

## Formulários administrativos

Os formulários de criação e edição de usuários, papéis e clientes são apresentados em modais sobre suas listagens, sem rotas próprias. Os modais usam o Dialog do núcleo, com título, descrição, foco restrito, fechamento por Escape e rolagem em telas pequenas. As permissões dos papéis usam seções expansíveis por módulo (`details`/`summary`), mantendo as seleções ao recolher. Ver ADR-025.
