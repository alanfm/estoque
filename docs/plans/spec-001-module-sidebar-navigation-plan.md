# Plano de implementação — SPEC-001

## Identificação

- **Especificação:** [SPEC-001 — Navegação lateral agrupada por módulo](../specs/module-sidebar-navigation.md).
- **Decisão:** [ADR-022](../architecture.md#adr-022--navegação-lateral-agrupada-por-módulo).
- **Estado:** pendente.
- **Responsável:** a definir no início da execução.
- **Revisor:** a definir; deve ser diferente do responsável quando houver equipe disponível.
- **Dependências:** F5 e F6 aceitas; registro frontend de módulos, `AdminLayout`, permissões da sessão e módulo `customers` operacionais.

Este plano implementa a evolução como uma adição compatível ao contrato frontend. Nenhuma etapa abaixo é evidência de funcionalidade já entregue; os comandos e critérios deverão ser executados e registrados durante a implementação.

## Objetivo e limite

Entregar navegação administrativa com exatamente dois níveis opcionais:

1. grupo identificado pelo módulo;
2. links das páginas do módulo.

A entrega inclui contrato público, projeção interna do registro, interface desktop/mobile, acessibilidade, adoção pelo módulo de referência, testes e documentação.

Não fazem parte desta entrega:

- grupos aninhados além do segundo nível;
- configuração do menu em `module.json`;
- menu dinâmico vindo da API ou do banco;
- persistência da expansão entre recargas;
- alteração dos links administrativos do núcleo para o novo formato;
- mudança de autorização backend, permissões ou rotas HTTP;
- carregamento de módulos sem recompilar os assets.

## Decisões que devem ser fechadas antes do código

### Versões de lançamento

A alteração pública é aditiva e deve sair em uma versão MINOR do núcleo. Como o valor atual é `1.0.0`, a versão candidata é `1.1.0`. Antes da primeira alteração no módulo de referência, o responsável e o revisor DEVEM registrar:

- versão do núcleo que introduz `navigationGroup`;
- nova versão do módulo `customers` (candidata: `1.1.0`);
- faixa mínima do módulo após a adoção (candidata: `^1.1.0`).

Se a versão escolhida não for `1.1.0`, a justificativa deve constar no acompanhamento da entrega. A versão do núcleo em `config/modules.php`/`STARTERKIT_VERSION`, o manifesto e a documentação do módulo devem permanecer coerentes. Não alterar `schemaVersion`, pois o manifesto não recebe campo novo.

### Forma interna do registro

O contrato público adiciona somente:

```ts
export interface ModuleNavigationGroup {
  icon?: string;
  order?: number;
}

export interface FrontendModule {
  // campos atuais
  navigationGroup?: ModuleNavigationGroup;
}
```

O registro deve manter `FrontendModuleRegistry.navigation` como lista plana para compatibilidade e adicionar uma projeção interna explícita, por exemplo:

```ts
interface RegisteredModuleNavigationGroup {
  moduleName: string;
  label: string;
  icon?: string;
  order: number;
  registrationOrder: number;
  items: ModuleNavigationItem[];
}
```

O nome final dessa projeção pode seguir o padrão encontrado durante a implementação, mas ela DEVE:

- preservar a propriedade de itens declarativos e itens de `registerNavigation()`;
- conter somente módulos que optaram por `navigationGroup`;
- manter os mesmos objetos na lista plana, sem criar dois contratos divergentes;
- permitir ordenação estável por grupo e por filho;
- ser construída e publicada somente depois que todo o registro do módulo terminar com sucesso.

Itens de módulos sem `navigationGroup` continuam apenas na lista plana legada. A UI não pode renderizar duas vezes os itens de um módulo agrupado.

## Estratégia de entrega

As etapas são sequenciais pelos critérios de saída. Cada etapa deve resultar em uma alteração revisável e manter typecheck e testes relacionados verdes. A atualização de `customers` só ocorre após o host compreender os dois formatos.

### E1 — Fechar contrato, versão e casos de teste

**Arquivos principais:**

- `docs/specs/module-sidebar-navigation.md`;
- este plano e um futuro acompanhamento da SPEC-001;
- `config/modules.php` e `.env.example`, somente se a versão padrão do núcleo for publicada nesta entrega.

**Tarefas:**

1. Registrar responsável, revisor e versões escolhidas.
2. Converter os critérios da spec em uma matriz de testes com pelo menos: módulo legado, dois módulos agrupados, callback de registro, permissões total/parcial/nenhuma, grupo ativo e falha atômica.
3. Confirmar que `ModuleNavigationItem.permission` permanece o único filtro de menu desta entrega; `permissionsAny`/`permissionsAll` continuam disponíveis somente nas rotas.
4. Confirmar os caminhos reais de `customers`: `/admin/customers`, `/admin/customers/new` e `/admin/customers/:id`.

**Critério de saída:** versões e matriz registradas, sem pendência que altere a forma do contrato durante as etapas seguintes.

### E2 — Estender tipos públicos e registro

**Arquivos principais:**

- `resources/spa/modules/types.ts`;
- `resources/spa/module-kit/index.ts`;
- `resources/spa/modules/registry.tsx`;
- `resources/spa/modules/ModulesContext.tsx`;
- `resources/spa/modules/registry.test.tsx`;
- fixtures em `tests/Fixtures/Modules/`, quando necessário.

**Tarefas:**

1. Criar `ModuleNavigationGroup`, adicionar `FrontendModule.navigationGroup?` e exportar o tipo pela superfície pública.
2. Adicionar ao resultado do registro a projeção interna dos grupos e atualizar `EMPTY_REGISTRY`.
3. Coletar primeiro rotas e itens temporários do módulo, incluindo callbacks; só então publicar módulo, rotas, navegação plana e grupo.
4. Em falha de `register()`, descartar todas as contribuições temporárias daquele módulo e registrar uma única issue identificável.
5. Ordenar grupos por `order ?? 100`, com desempate por ordem de registro. Ordenar os filhos de cada grupo por `order ?? 100`, também de forma estável.
6. Manter na lista plana todos os itens para consumidores existentes, mas disponibilizar metadados suficientes para a UI separar links legados de links agrupados sem inferir por URL ou rótulo.
7. Não mutar os arrays ou objetos fornecidos pelo módulo.

**Testes mínimos:**

- módulo legado mantém o resultado atual;
- `{}` ativa um grupo com fallback de rótulo e ordem;
- dois grupos não misturam filhos;
- callback e propriedade declarativa entram no mesmo grupo;
- ordenação padrão, explícita e empate são estáveis;
- falha no callback não deixa rota, link, grupo ou metadata parcial;
- identificador duplicado e falha de carregamento continuam isolados;
- fixture legada ainda compila pela superfície pública.

**Critério de saída:** contrato novo compilável, comportamento legado preservado e testes unitários do registro verdes.

### E3 — Criar derivação de navegação visível e estado ativo

**Arquivos principais:**

- novo helper em `resources/spa/components/navigation/` ou `resources/spa/modules/`, conforme a responsabilidade final;
- teste unitário ao lado do helper;
- `resources/spa/lib/icons.ts` e seu teste.

**Tarefas:**

1. Implementar uma função pura que receba registro, usuário e pathname e retorne links legados visíveis, grupos visíveis e o filho ativo de cada grupo.
2. Filtrar filhos com `can(user, permission)` em toda derivação; omitir grupos vazios.
3. Normalizar somente o necessário para comparação: ignorar query/fragmento, respeitar limites de segmento e preservar a semântica de `end`.
4. Entre correspondências válidas, escolher o maior caminho; em empate, o primeiro na ordem visual.
5. Tratar `/admin/customers/new` como mais específico que `/admin/customers`; uma edição em `/admin/customers/{id}` deve recair no link de listagem enquanto não houver submenu próprio.
6. Definir um ícone genérico público para grupo quando o nome estiver ausente ou for desconhecido. Manter o comportamento dos links planos existentes, salvo decisão explícita documentada.

**Testes mínimos:**

- query string, fragmento, barra final e limite de segmento;
- `end: true` e correspondência por prefixo;
- destino mais específico e desempate estável;
- filtragem após troca de usuário/permissões;
- um filho mantém o grupo e zero filhos o remove;
- fallback de ícone para nome ausente/desconhecido.

**Critério de saída:** toda decisão de permissão e rota ativa exercitada por funções puras, sem depender da renderização da sidebar.

### E4 — Implementar componente e estado da sidebar

**Arquivos principais:**

- `resources/spa/components/navigation/AdminNav.tsx`;
- novo componente de grupo, caso a decomposição reduza a complexidade;
- novo `AdminNav.test.tsx`;
- `resources/spa/layouts/AdminLayout.tsx`;
- teste do layout se necessário para a interação entre sidebar e overlay.

**Modelo de estado:**

- `AdminLayout` mantém um conjunto de IDs de grupos abertos, compartilhado pelas instâncias desktop e mobile;
- cada `AdminNav` recebe um identificador de instância (`desktop` ou `mobile`) para gerar `aria-controls` únicos;
- mudança de `location.pathname` abre o grupo que contém o filho ativo;
- o fechamento manual do grupo ativo é permitido e permanece até uma nova mudança de rota correspondente;
- abrir/fechar o overlay não recria o estado enquanto o layout estiver montado.

**Tarefas:**

1. Renderizar a navegação como listas semânticas; links legados permanecem links e o pai agrupado é `button type="button"`.
2. Aplicar `aria-expanded`, `aria-controls`, IDs únicos, indicador textual/visual de expansão e `aria-current="page"` somente ao filho selecionado.
3. Exibir grupo ativo sem anunciá-lo como página ativa. Diferenciar visualmente grupo aberto, grupo ativo e filho ativo.
4. Antes de ocultar filhos, se o foco estiver dentro deles, movê-lo para o botão do grupo.
5. Na sidebar recolhida, manter nome acessível e tooltip. Ao ativar um grupo, solicitar ao layout a expansão da sidebar, abrir o grupo e restaurar o foco no botão desktop após a nova renderização.
6. No overlay mobile, alternar o pai sem fechar; executar `onNavigate` somente no clique de um filho ou link plano.
7. Manter alvos de 44 px, foco visível, tokens existentes e comportamento adequado com movimento reduzido.
8. Evitar estado derivado obsoleto: recomputar itens visíveis quando `user`, registro ou localização mudar.

**Testes de componente mínimos:**

- pai abre por clique, `Enter` e `Espaço`, sem navegar;
- vários grupos podem ficar abertos;
- grupo da rota inicial e de uma nova rota abre automaticamente;
- usuário pode fechar o grupo ativo até a próxima mudança de rota;
- somente o filho específico recebe `aria-current`;
- filhos fechados não são focáveis/não estão na árvore acessível;
- fechamento com foco interno devolve foco ao pai;
- IDs das instâncias desktop/mobile não colidem;
- sidebar recolhida expande, abre e preserva foco;
- mobile fecha somente ao navegar;
- atualização das permissões remove filho/grupo sem deixar foco ou estado inválido.

**Critério de saída:** comportamento completo em teste de componente com mouse e teclado, sem regressão dos links planos e controles existentes da sidebar.

### E5 — Adotar no módulo de referência e validar compatibilidade

**Arquivos principais:**

- `modules/acme/customers/resources/spa/module.ts`;
- `modules/acme/customers/module.json`;
- `modules/acme/customers/README.md`;
- fixture legada de contrato;
- `tests/e2e/customers.auth.spec.ts` ou novo arquivo E2E específico de navegação.

**Tarefas:**

1. Adicionar ao módulo `customers` o grupo “Clientes”, com ícone e ordem no pai.
2. Registrar dois filhos: “Listar clientes” em `/admin/customers` e “Novo cliente” em `/admin/customers/new`. O link de criação usa `end: true`; o de listagem permite que edição/detalhe mantenham o contexto ativo.
3. Remover o ícone dos filhos quando ele apenas repetir o ícone do grupo.
4. Atualizar versão/faixa `core` e changelog conforme E1; não alterar permissões nem `schemaVersion`.
5. Manter uma fixture/módulo sem `navigationGroup` para provar compatibilidade e uma fixture agrupada que compile via `@starterkit/module-kit`.
6. Estender E2E para abrir o grupo, navegar para criação e confirmar seleção correta após listagem, criação, edição, refresh e voltar/avançar.
7. Exercitar ao menos uma sessão com permissão parcial em teste de componente/integrado; não depender somente do bypass do superadministrador do E2E.

**Critério de saída:** `customers` demonstra os dois submenus, o módulo legado continua funcionando e a faixa de compatibilidade reflete a primeira versão real do contrato.

### E6 — Documentar, executar validação e aceitar

**Documentos principais:**

- `docs/README.md`;
- `docs/architecture.md`;
- `docs/module-contract.md`;
- `docs/frontend-architecture.md`;
- `docs/design.md`;
- `docs/creating-a-module.md`;
- `docs/compatibility-policy.md`;
- `modules/acme/customers/README.md`;
- novo acompanhamento em `docs/plans/spec-001-status.md`.

**Tarefas:**

1. Substituir linguagem de “proposta” por contrato implementado somente após todos os testes passarem.
2. Marcar ADR-022 como aceita, registrar a versão introduzida e reconciliar a regra anterior de “agrupada por capacidades” com o agrupamento por módulo aprovado.
3. Atualizar exemplos para os caminhos e tipos reais, incluindo menu plano legado e menu agrupado.
4. Criar acompanhamento com responsável, revisor, estado de cada critério, comandos executados e resultados reproduzíveis.
5. Conferir links locais e `git diff --check`; não incluir alterações de dependências sem necessidade desta spec.

**Critério de saída:** documentação normativa descreve o comportamento entregue, não o planejado, e o acompanhamento contém evidência verificável para aceite.

## Arquivos previstos e responsabilidade

| Área | Arquivo | Mudança esperada |
|---|---|---|
| Contrato público | `resources/spa/modules/types.ts` | Tipo do grupo e campo opcional |
| Superfície pública | `resources/spa/module-kit/index.ts` | Exportação do novo tipo |
| Registro | `resources/spa/modules/registry.tsx` | Associação, atomicidade e ordenação |
| Contexto | `resources/spa/modules/ModulesContext.tsx` | Valor vazio da nova projeção |
| Derivação | helper novo | Permissões e correspondência ativa |
| Ícones | `resources/spa/lib/icons.ts` | Fallback genérico de grupo |
| Navegação | `resources/spa/components/navigation/AdminNav.tsx` | Listas, grupos e filhos |
| Estado do layout | `resources/spa/layouts/AdminLayout.tsx` | Expansão compartilhada e sidebar recolhida |
| Referência | `modules/acme/customers/resources/spa/module.ts` | Adoção de grupo e dois filhos |
| Compatibilidade | `modules/acme/customers/module.json` e README | Versão mínima e changelog |
| Testes | registry/helper/AdminNav/E2E/fixtures | Contrato, interação e regressão |
| Documentação | documentos relacionados à SPEC-001 | Publicação do contrato final |

A lista é uma previsão. Novos arquivos podem ser criados para separar responsabilidades, mas imports privados não devem ser transformados em contrato público por conveniência.

## Validação reproduzível

Executar no ambiente Docker/Sail definido em [environment.md](../environment.md):

```bash
./vendor/bin/sail npm run format:check
./vendor/bin/sail npm run lint
./vendor/bin/sail npm run typecheck
./vendor/bin/sail npm test
./vendor/bin/sail npm run build
./vendor/bin/sail artisan test
./vendor/bin/sail artisan core:modules:diagnose --json
```

Depois de preparar o usuário E2E conforme o ambiente documentado, executar pelo menos o fluxo de navegação e o CRUD de clientes:

```bash
docker compose exec -T laravel.test \
  npx playwright test tests/e2e/customers.auth.spec.ts
```

Os comandos são requisitos planejados. Seus resultados só devem ser apresentados como evidência depois da execução real. Se o nome do teste E2E mudar ou um arquivo específico for criado, registrar no acompanhamento o comando exato usado.

## Matriz de aceite

| Cenário | Nível de teste | Resultado exigido |
|---|---|---|
| Módulo legado | registro + build | Link plano preservado sem mudança no módulo |
| Dois módulos agrupados | registro + componente | Grupos e filhos isolados e ordenados |
| Callback de registro | unitário | Itens entram no grupo proprietário |
| Falha durante registro | unitário | Nenhuma contribuição parcial |
| Permissões total/parcial/nenhuma | helper + componente | Filhos corretos e grupo vazio omitido |
| Rotas sobrepostas | helper + componente | Destino mais específico é o único ativo |
| Rota de edição | helper + E2E | Listagem representa o contexto ativo |
| Desktop expandido | componente | Expansão independente e teclado funcional |
| Desktop recolhido | componente | Sidebar expande, grupo abre e foco é mantido |
| Overlay mobile | componente/E2E | Pai não fecha; filho navega e fecha |
| Acessibilidade | componente + revisão manual | Sem IDs duplicados, foco perdido ou estado só por cor |
| Temas/reflow/movimento | revisão visual | Claro/escuro, 320 px, zoom 200% e reduced motion utilizáveis |
| `customers` agrupado | build + E2E | Listagem/criação/edição e refresh funcionam |
| Ciclo do módulo | diagnóstico + build | Desabilitar/reabilitar e recompilar remove/restaura grupo |

## Riscos e respostas

| Risco | Resposta |
|---|---|
| Renderização duplicada pelo registro plano e agrupado | Marcar propriedade no registro e separar as projeções antes da UI; cobrir com teste de contagem de links. |
| Estado aberto divergir entre desktop e mobile | Manter o conjunto no `AdminLayout`, não dentro de cada `AdminNav`. |
| Dois `AdminNav` gerarem IDs iguais | Exigir prefixo por instância e testar unicidade com ambos montados. |
| Listagem capturar criação/edição indevidamente | Resolver todas as correspondências e escolher o caminho mais específico, respeitando `end`. |
| Permissões mudarem e deixarem grupo/foco obsoleto | Derivar visibilidade da sessão atual e normalizar foco/estado quando o filho desaparecer. |
| Módulo passar a exigir núcleo antigo que não conhece o campo | Atualizar faixa mínima e testar uma fixture legada separadamente. |
| Mudança visual quebrar navegação recolhida | Implementar fluxo explícito de revelar sidebar + grupo + foco antes da validação E2E. |
| Aumento acidental do escopo para árvore genérica | Manter tipos e componentes limitados a dois níveis; nova profundidade exige outra decisão. |

## Definition of Done

A SPEC-001 só pode ser marcada como implementada quando:

1. todos os critérios da spec e da matriz acima tiverem evidência;
2. contrato público e versão mínima estiverem documentados;
3. módulo legado e `customers` compilarem no mesmo host;
4. permissões, rota ativa, desktop recolhido e mobile tiverem testes automatizados;
5. revisão manual cobrir teclado, leitor de tela proporcional ao risco, temas, reflow e movimento reduzido;
6. todos os comandos de validação aplicáveis estiverem verdes;
7. `docs/plans/spec-001-status.md` registrar resultados e pendências reais;
8. revisor aceitar a entrega e ADR-022/spec deixarem de indicar implementação pendente.
