# SPEC-001 — Navegação lateral agrupada por módulo

**Status:** implementação em andamento; validações pendentes. Consulte o [acompanhamento](../plans/spec-001-status.md).
**Data:** 2026-10-01.
**Decisão relacionada:** [ADR-022](../architecture.md#adr-022--navegação-lateral-agrupada-por-módulo).
**Plano de implementação:** [Plano da SPEC-001](../plans/spec-001-module-sidebar-navigation-plan.md).

## Objetivo

Permitir que cada módulo apresente um menu expansível na barra lateral e que suas funções/páginas apareçam como submenus, mantendo a navegação consistente no desktop e no mobile.

```text
Espaço de trabalho
  Painel
  Usuários
  Papéis
  Clientes              ▾
    Listar clientes
    Novo cliente
  Financeiro            ▸
```

Os nomes são de negócio (`Clientes`), nunca nomes técnicos de pacotes (`acme/customers`). A hierarquia tem exatamente dois níveis: módulo e página. Não há grupos dentro de submenus nesta entrega.

## Situação atual

- `ModuleNavigationItem` exige `to` e representa um link plano.
- `createModuleRegistry` agrega os links e ordena por `order`, sem preservar a associação visual ao módulo.
- `AdminNav` renderiza links do núcleo e dos módulos na mesma lista.
- O host já possui sidebar expandida/recolhida e overlay mobile.

## Contrato frontend proposto

Adicionar uma configuração opcional ao `FrontendModule`, exportando seu tipo por `@starterkit/module-kit`:

```ts
export interface ModuleNavigationGroup {
  icon?: string;
  order?: number;
}

// Adição à interface FrontendModule existente:
// navigationGroup?: ModuleNavigationGroup;
```

1. A presença de `navigationGroup` (inclusive `{}`) ativa o agrupamento. Sua ausência mantém o comportamento plano existente.
2. O identificador do grupo é `FrontendModule.name`; o rótulo é `displayName`, com fallback para `name`, como no registro atual.
3. Todos os itens de `navigation` e os adicionados por `registerNavigation()` pertencem ao grupo desse módulo. O núcleo DEVE preservar essa associação durante o registro.
4. `ModuleNavigationItem` e `registerNavigation(items)` mantêm suas assinaturas. Cada filho continua usando `to`, `label`, `icon`, `permission`, `end` e `order`.
5. O grupo não possui `to` nem permissão própria. Ele é um controle de expansão; sua visibilidade é derivada dos filhos autorizados.
6. `icon` usa o resolvedor de ícones do núcleo. Ausência ou nome desconhecido DEVE produzir um ícone genérico de módulo, inclusive na sidebar recolhida.
7. `order` do grupo ordena entre as entradas dos módulos; `order` dos filhos ordena somente dentro dele. O valor padrão continua sendo `100`, em ordem crescente; empates preservam a ordem de registro. Os itens do núcleo continuam antes das entradas dos módulos.
8. Módulo agrupado com somente um filho visível DEVE continuar como grupo. Sem filhos visíveis, o grupo DEVE ser omitido.

Exemplo prospectivo, utilizável após a implementação:

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
    {
      path: "admin/customers/create",
      load: () => import("./pages/CustomerCreatePage"),
      permission: "customers.create",
    },
  ],
  navigation: [
    {
      to: "/admin/customers",
      label: "Listar clientes",
      permission: "customers.viewAny",
      order: 10,
    },
    {
      to: "/admin/customers/create",
      label: "Novo cliente",
      permission: "customers.create",
      end: true,
      order: 20,
    },
  ],
} satisfies FrontendModule;
```

As rotas e os nomes de páginas do exemplo são ilustrativos. Páginas de edição/detalhe podem ser acessadas pela listagem sem ganhar um submenu.

## Permissões e registro

- Filtrar cada filho por `permission`, usando as permissões efetivas da sessão e o mesmo mecanismo dos links atuais; sem permissão declarada, o link fica disponível ao usuário autenticado.
- Recalcular a árvore visível ao mudar a sessão/permissões; não manter links de outro usuário em cache.
- Ocultar um grupo vazio após a filtragem, sem espaço, botão ou tooltip residual.
- Preservar guards das rotas e autorização no servidor: o menu não concede acesso.
- Registrar os dados de um módulo de forma atômica. Falha ao carregar/registrar o módulo não pode deixar grupo vazio ou itens parciais; os demais módulos continuam disponíveis e o problema aparece em `issues`.
- O agrupamento segue o ciclo de habilitação e build existente. Um módulo desabilitado não aparece na SPA reconstruída.

## Interação e estado ativo

### Sidebar expandida

- O botão do módulo alterna os filhos sem navegar. Exibe nome, ícone e indicador de expansão.
- Vários grupos PODEM ficar abertos simultaneamente.
- Inicialmente, grupos ficam fechados, exceto o que contém o link ativo. Acesso direto, refresh e mudanças de rota DEVEM abrir o grupo ativo.
- O usuário PODE fechar manualmente o grupo ativo; ele volta a abrir na próxima mudança de rota que corresponda a um filho.
- A expansão dos grupos é estado local do layout, compartilhado entre desktop e mobile durante sua montagem. Não exige persistência entre recargas. A preferência persistida de recolhimento da sidebar continua independente.
- Filhos têm recuo visual e o mesmo alvo mínimo de interação dos links existentes.

### Correspondência de rota

- Aplicar a semântica de caminhos do router e `end`, ignorando query string e fragmento. Prefixos respeitam limites de segmento (`/customers` não corresponde a `/customers-old`).
- Quando mais de um filho corresponder, selecionar o destino mais específico (maior caminho); em empate, o primeiro na ordem de exibição. No exemplo, `/admin/customers/create` ativa apenas “Novo cliente”; `/admin/customers/42/edit` ativa “Listar clientes”.
- Somente o filho selecionado recebe `aria-current="page"`. O pai recebe destaque visual de grupo ativo, sem se apresentar como uma página.
- Se nenhum filho visível corresponder à URL, o grupo não é ativo. Permissão para uma rota não implica visibilidade de um link protegido por outra permissão.

### Sidebar recolhida e mobile

- Na sidebar recolhida, o ícone do módulo é um botão com nome acessível e tooltip. Acioná-lo DEVE expandir a sidebar e abrir o grupo, preservando o foco no botão correspondente. Os filhos ficam então acessíveis na navegação normal.
- No mobile, o overlay apresenta nomes completos e a mesma hierarquia. Expandir/recolher um grupo não fecha o overlay; acionar um filho fecha o overlay e navega.
- `Escape`, contenção e restauração de foco seguem o comportamento do overlay existente. Fechar/reabrir o overlay preserva a expansão durante a montagem do layout.

## Acessibilidade e aparência

- Usar navegação semântica com listas aninhadas, links para páginas e `button type="button"` para expansão. Não aplicar `role="menu"`/`tree` à navegação comum.
- O botão possui `aria-expanded` e `aria-controls`, com IDs únicos inclusive entre as instâncias desktop/mobile.
- `Tab`/`Shift+Tab` percorrem controles visíveis; `Enter`/`Espaço` alternam o grupo. Filhos fechados não entram na ordem de foco nem na árvore de acessibilidade.
- Recolher um grupo que contém o foco DEVE devolver o foco ao seu botão antes de ocultar o conteúdo.
- Diferenciar grupo aberto, grupo ativo e página ativa; não depender somente de cor. Respeitar tokens, foco visível, contraste dos dois temas, alvos touch de 44 px e movimento reduzido definidos em [design.md](../design.md).

## Compatibilidade e adoção

A extensão é aditiva e candidata a uma versão **MINOR** do núcleo, desde que os módulos existentes continuem compilando e funcionando. A versão de lançamento será definida na implementação; esta spec não altera versões publicadas.

- Módulos existentes mantêm menus planos até adotarem `navigationGroup`.
- Novos módulos DEVERIAM adotar o grupo; o módulo de referência `customers` DEVE demonstrá-lo nesta entrega.
- Módulos que adotarem o campo DEVEM elevar o mínimo da faixa `core` à primeira versão que o suporta e reconstruir os assets do host.
- Não é necessário alterar `module.json`, `schemaVersion`, endpoints ou permissões. A extensão pertence ao contrato frontend.
- O registro pode adicionar uma projeção interna para a árvore, preservando o formato plano existente para consumidores atuais. Não substituir silenciosamente `navigation` por uma união de grupos e links.

## Sequência de implementação

1. Adicionar o tipo e campo opcional em `resources/spa/modules/types.ts` e exportar por `resources/spa/module-kit/index.ts`.
2. Preservar a propriedade dos links e metadados de grupo em `resources/spa/modules/registry.tsx`, incluindo registros pelo callback; derivar a árvore sem quebrar a lista existente.
3. Implementar filtragem, ordenação e resolução de estado ativo; integrar grupos em `AdminNav` e estado compartilhado/expansão em `AdminLayout`.
4. Adaptar `customers` e atualizar o guia de criação com um exemplo compilável na versão de lançamento.
5. Executar tipos, lint, testes de registro/componentes, build e E2E apropriados via ambiente Docker/Sail; registrar evidências e versão mínima antes de marcar esta spec como implementada.

## Critérios de aceite

- [ ] Dois módulos agrupados mostram suas próprias páginas, sem misturar filhos; links do núcleo e módulos legados continuam funcionais.
- [ ] `navigation` e `registerNavigation()` contribuem para o mesmo grupo, com ordenação estável de grupos e filhos.
- [ ] Usuários com todas, algumas ou nenhuma das permissões veem os filhos corretos; um filho mantém o grupo e zero filhos o oculta.
- [ ] Troca de sessão/permissões remove itens indevidos; URL direta continua sujeita aos guards e à API.
- [ ] Acesso direto, refresh, voltar/avançar e navegação para criação/edição abrem o grupo correto e selecionam somente o filho mais específico.
- [ ] Grupos abrem/fecham independentemente; botão do pai nunca navega.
- [ ] Sidebar recolhida permite alcançar todos os filhos por teclado; no mobile, somente navegar fecha o overlay.
- [ ] Leitor de tela percebe nome, expansão e página ativa; IDs não se repetem e elementos ocultos não recebem foco.
- [ ] Temas claro/escuro, viewport de 320 px, zoom de 200% e movimento reduzido preservam a usabilidade.
- [ ] Falha de registro não deixa itens parciais; desabilitar/reabilitar e reconstruir a SPA remove/restaura o grupo.
- [ ] Suíte de compatibilidade compila um módulo legado e um agrupado; `customers` demonstra a funcionalidade e a documentação informa a versão mínima real.
