# Sistema de design

## Objetivo

Este documento define a identidade visual, os tokens, layouts, componentes, padrões de interação e requisitos de acessibilidade do starter kit e de seus módulos.

Este starter kit é exclusivo do IFCE Campus Sobral. Marca, identificação institucional, rodapés e contatos definidos aqui são fixos para suas aplicações; não fazem parte de uma configuração por instituição. Dados de contato podem ser atualizados quando a fonte oficial do campus mudar.

O sistema é materializado em tokens e componentes reutilizáveis. Os componentes iniciais partem de shadcn/ui, mas passam a ser código mantido pelo núcleo. Módulos usam somente a API pública do núcleo e não instalam cópias independentes dos mesmos componentes.

## Direção visual

A direção toma como referência o [portal do Campus Sobral do IFCE](https://portal.ifce.edu.br/campus/sobral/), observado em setembro de 2026. A referência orienta a linguagem, não uma reprodução literal da estrutura editorial.

São adotados:

- Verde institucional como cor de ação e orientação.
- Inter, com títulos fortes e corpo legível.
- Superfícies claras, áreas de respiro, bordas suaves e sombras discretas.
- Controles arredondados e navegação objetiva.
- Menu em overlay no mobile.

As cores oficiais da marca IF são verde `#2F9E41` e vermelho `#CD191E`, conforme o [Manual de Aplicação da Marca dos Institutos Federais](https://redefederal.mec.gov.br/images/pdf/manual.pdf). Os tons `#357E4B` e `#B20701` abaixo são adaptações mais escuras para texto, botões e estados da interface no tema claro. Portanto, não são as cores exatas da marca. A marca oficial, quando usada, deve manter suas cores originais e seguir as regras do manual.

Para o contexto administrativo:

- A navegação horizontal se transforma em menu lateral persistente no desktop.
- Fotografias ficam restritas a páginas públicas, autenticação e estados vazios; não decoram telas operacionais.
- A paleta recebe estados funcionais e tema escuro.
- Vermelho é reservado a perigo e erro.

## Princípios

1. **Institucional sem rigidez:** confiança vem de hierarquia e consistência, não de excesso de molduras.
2. **Consistência:** a mesma intenção usa o mesmo componente e comportamento.
3. **Clareza:** ações, estados e consequências são compreensíveis.
4. **Acessibilidade:** teclado, leitores de tela, contraste, zoom e reflow são requisitos funcionais.
5. **Responsividade:** o mesmo fluxo funciona de telas pequenas a monitores amplos.
6. **Feedback:** toda ação assíncrona comunica carregamento, sucesso ou falha.
7. **Densidade controlada:** telas administrativas podem ser densas sem sacrificar leitura ou alvos de interação.

## Identidade

### Marca e imagens

- As quatro imagens fornecidas ficam em `docs/prototypes`: `logo_h.png`, `logo_v.png`, `logo_h_branco.png` e `logo_v_branco.png`. Os protótipos usam a horizontal colorida nos cabeçalhos, a horizontal branca no destaque público e a vertical colorida no rodapé público. A vertical branca permanece disponível para uma futura região escura que justifique seu uso.
- A assinatura horizontal cabe em cabeçalhos; a vertical precisa de uma região alta, como o rodapé. Manter proporção, área de respiro e tamanho legível em todos os breakpoints. Evitar repetir a marca dentro do mesmo layout sem necessidade.
- Na ausência do ativo em uma implementação futura, usar o nome do sistema em texto; não redesenhar o símbolo com CSS ou ícones.
- Não comprimir, recolorir ou aplicar a marca sobre fundo sem contraste.
- Fotografias devem ter relação com o contexto e texto alternativo adequado à função.
- Imagem decorativa usa `alt=""`.
- Texto sobre fotografia exige camada de contraste e conformidade WCAG AA em toda a área de posicionamento.

### Iconografia

- A família única é [Lucide Icons](https://lucide.dev/). Na SPA React, importar ícones nomeados de `lucide-react`; os protótipos HTML usam os mesmos desenhos em SVG local. Não misturar bibliotecas, fontes de ícones, emoji ou glifos Unicode decorativos.
- Tamanhos: 16 px em conteúdo denso, 20 px em controles e 24 px em navegação destacada.
- Usar traço padrão de 2 px e `currentColor`, salvo ajuste documentado para um contexto específico.
- Ícone isolado em botão exige nome acessível e tooltip quando a intenção não for óbvia.
- Ícones decorativos usam `aria-hidden="true"`; se o ícone transmitir informação indispensável, fornecer nome ou texto equivalente.

## Tokens

Tokens usam intenção semântica, nunca nomes de cor ou componente. A notação documental usa pontos; em CSS, usa kebab-case com prefixo, por exemplo `text.primary` → `--color-text-primary`.

### Temas

O tema claro é o padrão. O tema escuro é suportado e pode seguir o sistema na primeira visita. A escolha explícita do usuário prevalece, é persistida localmente e deve ser aplicada antes da primeira pintura.

O atributo `data-theme` representa sempre o tema resolvido, inclusive quando a preferência é “sistema”. A propriedade CSS `color-scheme` deve corresponder a esse tema para que controles nativos não sigam uma preferência do sistema diferente da escolha explícita.

### Cores

Referências de marca (não substituem tokens semânticos): `brand.green: #2F9E41`, `brand.red: #CD191E`. O vermelho de marca é reservado à marca; avisos e ações destrutivas usam `action.danger` e `status.danger`.

| Token | Claro | Escuro | Uso |
|---|---:|---:|---|
| `background.canvas` | `#F8FCF9` | `#0B1B09` | Fundo geral |
| `background.surface` | `#FFFFFF` | `#122315` | Cards, menus e campos |
| `background.subtle` | `#EDF7F0` | `#1E482B` | Destaque leve |
| `background.inverse` | `#1E482B` | `#F8FCF9` | Região de alto contraste |
| `text.primary` | `#0B1B09` | `#F8FCF9` | Texto principal |
| `text.secondary` | `#4D4D4D` | `#C9E8D3` | Texto auxiliar |
| `text.muted` | `#666666` | `#A5D9B5` | Metadados |
| `text.inverse` | `#FFFFFF` | `#0B1B09` | Texto em fundo inverso |
| `border.default` | `#D9D9D9` | `#357E4B` | Bordas e divisores |
| `border.strong` | `#8C8C8C` | `#6FC388` | Ênfase |
| `action.primary` | `#357E4B` | `#6FC388` | Ação principal e seleção |
| `action.primaryHover` | `#1E482B` | `#93D2A6` | Hover |
| `action.primaryForeground` | `#FFFFFF` | `#0B1B09` | Texto/ícone sobre ação principal |
| `action.primarySubtle` | `#DBF0E1` | `#1E482B` | Seleção suave |
| `action.danger` | `#B20701` | `#FE8480` | Ação destrutiva |
| `action.dangerHover` | `#7F0501` | `#FF9D99` | Hover de ação destrutiva |
| `action.dangerForeground` | `#FFFFFF` | `#0B1B09` | Texto/ícone sobre ação destrutiva |
| `action.disabledBackground` | `#E6E6E6` | `#28362B` | Fundo de controle desabilitado |
| `action.disabledForeground` | `#666666` | `#BACFBE` | Texto/ícone de controle desabilitado |
| `action.disabledBorder` | `#8C8C8C` | `#8CA995` | Borda de controle desabilitado |
| `focus.ring` | `#0764A1` | `#93C6EC` | Foco visível |
| `status.success` | `#356204` | `#B5F86D` | Sucesso |
| `status.successSurface` | `#F3FEE7` | `#213414` | Fundo de sucesso |
| `status.warning` | `#806000` | `#FFD966` | Atenção; 5,85:1 sobre branco no tema claro |
| `status.warningSurface` | `#FFF9E5` | `#3B310F` | Fundo de atenção |
| `status.danger` | `#B20701` | `#FE8480` | Erro |
| `status.dangerSurface` | `#FFF5F5` | `#3D1918` | Fundo de erro |
| `status.info` | `#0764A1` | `#93C6EC` | Informação |
| `status.infoSurface` | `#F6FAFD` | `#132F41` | Fundo de informação |
| `status.neutral` | `#404040` | `#F8FCF9` | Estado neutro |
| `status.neutralSurface` | `#F1F3F1` | `#333C33` | Fundo neutro |
| `overlay.scrim` | `rgba(11,27,9,.64)` | `rgba(0,0,0,.72)` | Fundo de overlay |

Regras:

- Contraste mínimo: 4,5:1 para texto normal; 3:1 para texto grande, componentes e foco.
- Estado usa texto ou ícone além da cor.
- Links no conteúdo usam `action.primary` e sublinhado.
- Cores de status não devem preencher grandes áreas saturadas.

### Combinações de componentes

Cada célula abaixo nomeia, na ordem, **fundo / texto e ícone / borda**. O núcleo resolve os mesmos tokens no tema claro ou escuro conforme a tabela anterior; os módulos não escolhem hexadecimais próprios.

| Botão | Normal | Hover | Desabilitado |
|---|---|---|---|
| Primário | `action.primary` / `action.primaryForeground` / `action.primary` | `action.primaryHover` / `action.primaryForeground` / `action.primaryHover` | `action.disabledBackground` / `action.disabledForeground` / `action.disabledBorder` |
| Secundário | `background.surface` / `text.primary` / `border.strong` | `background.subtle` / `action.primaryHover` / `action.primary` | mesmos tokens de desabilitado |
| Ghost | transparente / `action.primary` / transparente | `background.subtle` / `action.primaryHover` / transparente | mesmos tokens de desabilitado |
| Perigo | `action.danger` / `action.dangerForeground` / `action.danger` | `action.dangerHover` / `action.dangerForeground` / `action.dangerHover` | mesmos tokens de desabilitado |
| Link visual | transparente / `action.primary` / transparente | transparente / `action.primaryHover` / transparente | transparente / `action.disabledForeground` / transparente |

- O botão de link visual permanece sublinhado; seu estado desabilitado não navega. Um link real sem destino válido não usa `href` e deve ser representado por texto inativo, não por um link clicável com aparência desabilitada.
- Desabilitado usa os tokens acima em todas as variantes, exceto o link visual, que mantém fundo e borda transparentes. Aplicar `disabled`/`aria-disabled` conforme a semântica e nenhuma ação no hover. A razão de contraste do texto desabilitado em botão preenchido é 4,6:1 no claro e 7,72:1 no escuro, embora WCAG não exija contraste para controles inativos.
- O foco visível usa `focus.ring` e não é substituído pelo hover. Para botões sobre fotografia ou outra superfície não prevista, a combinação deve ser revalidada.

Badges e alertas informativos usam a mesma família de tokens de estado. Em ambos, **fundo = `status.*Surface`, texto/ícone = `status.*`, borda = `status.*`**. As combinações são `success`, `warning`, `danger`, `info` e `neutral`, para os dois temas. O texto do alerta, inclusive sua descrição, usa o token de estado indicado; links internos mantêm sublinhado e a mesma cor de texto. Badges e alertas não possuem hover nem estado desabilitado porque não são controles. Quando um badge for acionável, deve ser implementado como botão ou link e seguir os estados da variante correspondente.

Exemplos de contraste de texto sobre a superfície de estado: `status.warning`/`status.warningSurface` = 5,55:1 no claro e 9,42:1 no escuro; `status.danger`/`status.dangerSurface` = 6,71:1 no claro e 6,53:1 no escuro. Os demais pares também devem ser medidos no componente final.

### Tipografia

```css
font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont,
  "Segoe UI", sans-serif;
```

Inter deve ser servida localmente quando a distribuição permitir. A interface não depende de serviço externo de fontes.

| Estilo | Tamanho/linha | Peso | Uso |
|---|---:|---:|---|
| `display` | 48/56 px | 800 | Destaque público |
| `heading.1` | 32/40 px | 700 | Título de página |
| `heading.2` | 24/32 px | 700 | Título de seção |
| `heading.3` | 20/28 px | 600 | Card ou subseção |
| `body.large` | 18/28 px | 400 | Introdução |
| `body` | 16/24 px | 400 | Texto padrão |
| `body.small` | 14/20 px | 400 | Tabela e ajuda |
| `label` | 14/20 px | 600 | Label, botão e navegação |
| `caption` | 12/16 px | 500 | Informação suplementar |
| `code` | 14/20 px | 400 | Código e identificadores |

- Pesos permitidos: 400, 500, 600, 700 e 800.
- Texto longo tem largura máxima de 70 caracteres.
- Usar capitalização de frase; caixa alta fica restrita a siglas e pequenas etiquetas.

### Espaçamento, dimensões e largura

Escala: `0, 4, 8, 12, 16, 24, 32, 48, 64, 80 px`.

| Token | Valor |
|---|---:|
| `control.compact` | 32 px |
| `control.default` | 40 px |
| `control.comfortable` | 48 px |
| `sidebar.expanded` | 272 px |
| `sidebar.collapsed` | 72 px |
| `content.reading` | 720 px |
| `content.default` | 1200 px |
| `content.wide` | 1440 px |

Alvos touch possuem ao menos 44 × 44 px. Valores fora da escala exigem justificativa visual.

### Breakpoints

```text
sm: 640 px
md: 768 px
lg: 1024 px
xl: 1280 px
2xl: 1536 px
```

Abaixo de `lg`, o menu lateral é overlay. Breakpoints orientam composição, não modelos de dispositivo.

### Raios, sombras, movimento e camadas

```text
radius.small: 6 px
radius.medium: 10 px
radius.large: 16 px
radius.pill: 999 px
shadow.raised: 0 1px 2px rgba(11,27,9,.08), 0 6px 18px rgba(11,27,9,.06)
shadow.overlay: 0 16px 48px rgba(11,27,9,.24)
motion.fast: 120 ms
motion.default: 180 ms
motion.slow: 240 ms
motion.easing: cubic-bezier(.2,0,0,1)
z-index: base 0 < sticky 100 < dropdown 200 < overlay 300 < modal 400 < toast 500 < critical 600
```

- Cards usam borda e `radius.medium`; destaque público pode usar `radius.large`.
- Pills ficam restritas a chips, filtros segmentados e status.
- Sombras indicam elevação, não ornamentação.
- Preferir animação de `opacity` e `transform`.
- `prefers-reduced-motion` remove movimento não essencial.
- Módulos não criam valores arbitrários de `z-index`.

## Layouts

### AuthLayout

- Fundo `background.canvas` e linha superior de 4 px em `action.primary`.
- Card central de até 440 px, com borda, `radius.large` e 32 px de padding; 24 px no mobile.
- Marca discreta, um único `h1` e área estável para mensagens.
- Ação principal ocupa a largura no mobile.
- Fotografia é opcional apenas a partir de `lg`; o formulário permanece dominante.

### PublicLayout

- Linha institucional superior de 4 px.
- Cabeçalho de até 80 px, marca à esquerda e navegação à direita.
- Conteúdo de até 1200 px, com padding lateral de 24 px no desktop e 16 px no mobile.
- Destaques podem usar imagem com gradiente, título grande e `radius.large`, como na referência.
- Menu mobile abre em overlay; rodapé agrupa links por assunto.

### AdminLayout

```text
┌──────────────────────────────────────────────────────────┐
│ marca / contexto                    ajuda  tema  usuário │
├──────────────┬───────────────────────────────────────────┤
│ navegação    │ breadcrumbs                               │
│ lateral      │ título, descrição              ações      │
│              │ alertas                                   │
│              │ conteúdo                                  │
└──────────────┴───────────────────────────────────────────┘
```

- Barra superior de 64 px, `background.surface`, borda inferior e linha verde de 3 px no topo.
- Menu lateral de 272/72 px, `background.inverse` e texto inverso.
- Item ativo usa fundo suave, indicador lateral de 3 px e `aria-current="page"`.
- Área principal usa `background.canvas`, padding de 32 px e largura `content.default` ou `content.wide`.
- Navegação é filtrada por permissões; links de módulos podem ser agrupados sob o nome de negócio do módulo, com páginas no segundo nível. Grupos vazios são ocultados.
- Estado recolhido persiste localmente; itens mantêm nome acessível e tooltip.
- “Alterar senha” aparece apenas no menu do usuário na barra superior. O controle de recolher/expandir fica no rodapé do menu lateral, alinhado aos itens de navegação e com rótulo acessível no estado recolhido.
- Abaixo de `lg`, o menu vira overlay, contém o foco e o devolve ao acionador ao fechar.

#### Navegação agrupada por módulo

Grupos usam botão expansível, indicador de abertura, estado ativo distinto da página ativa e lista aninhada de links. O nome do módulo permanece acessível na sidebar recolhida; o overlay mobile mantém os nomes e não fecha ao expandir/recolher. O filho ativo é o destino visível mais específico e recebe `aria-current="page"`. Interação e acessibilidade seguem a [SPEC-001](specs/module-sidebar-navigation.md).

### Rodapés

- Os rodapés público e de autenticação exibem identificação do Campus Sobral, endereço, telefone geral e e-mail da recepção. O layout público pode apresentar a marca vertical.
- O rodapé administrativo tem apenas uma faixa compacta com duas colunas: “(c) 2026 - IFCE - Campus Sobral.” à esquerda e “Desenvolvido pela CTI - Campus Sobral” à direita.
- Nos rodapés público e de autenticação, uma linha discreta informa: “Desenvolvido pela Coordenadoria de Tecnologia da Informação (CTI) do Campus Sobral.”
- Dados institucionais são conferidos no [portal do Campus Sobral](https://portal.ifce.edu.br/campus/sobral/) e na [página oficial de contatos](https://portal.ifce.edu.br/campus/sobral/contatos/) antes da publicação.

## Anatomia de página

```text
Breadcrumbs
Título da página                         Ações principais
Descrição ou contexto
Alertas da página
Filtros ou controles
Conteúdo
Paginação ou ações finais
```

- Regiões vazias podem ser omitidas, mas não reorganizadas arbitrariamente.
- `PageHeader` contém um único `h1`; ações descem no mobile.
- Formulários simples usam `content.reading`; tabelas e dashboards podem usar `content.wide`.
- Seções usam 32 px entre si; título e descrição, 8 px.

## Componentes

### Botões e links

Variantes de botão: `primary`, `secondary`, `ghost`, `danger` e `link`.

- Altura padrão 40 px; 32 px em regiões densas; 48 px em auth/mobile.
- Uma região não deve ter ações primárias concorrentes.
- Carregamento preserva largura e rótulo perceptível.
- Desabilitado tem motivo perceptível quando não evidente.
- Links navegam; botões executam ações. Links em texto corrido são sublinhados.

### Campos e formulários

- Todo campo tem label persistente, controle, ajuda opcional e erro.
- Altura padrão de 40 px; placeholder não substitui label.
- Foco usa anel de 2 px em `focus.ring`, com offset de 2 px.
- Erro usa texto/ícone além da borda e associa descrições por `aria-describedby`.
- Campos relacionados usam seção ou `fieldset`/`legend`.
- Formulários usam uma coluna por padrão; duas apenas quando a relação é clara.
- Falha recuperável não limpa dados. Saída com alterações relevantes não salvas gera aviso.

### Cards e tabelas

- Card padrão usa superfície, borda, `radius.medium` e 24 px de padding.
- Card clicável possui um destino principal e foco visível.
- Tabelas têm cabeçalho semântico, ordenação com `aria-sort`, filtros, paginação e estados de carregamento, vazio e erro conforme a necessidade.
- Cabeçalho de tabela usa fundo sutil, texto 14 px/600 e altura mínima de 44 px; linha, 48 px.
- Números alinham à direita. Ações críticas não dependem apenas de menus.
- Nas listagens administrativas, ações por linha usam `Button` ghost compacto, sem borda, somente com ícone, nome acessível contextual e `SimpleTooltip` com o verbo da ação. A exclusão usa cor de perigo; ambas ficam alinhadas à direita. Exclusões pedem confirmação com `ConfirmDialog`.
- No mobile, usar rolagem horizontal ou cards; dados ocultos continuam acessíveis.

### Modais, painéis e menus

- Criação e edição de registros DEVEM usar página dedicada, com URL própria, `PageHeader`, breadcrumbs e ações de salvar/cancelar.
- Modal e painel lateral são reservados a tarefas curtas e contextuais; NÃO DEVEM ser o padrão para formulário completo de criação ou edição.
- Título, foco contido, `Escape` quando seguro e restauração de foco são obrigatórios.
- Confirmação destrutiva informa objeto e consequência.
- Dropdowns têm navegação por teclado; a única ação principal não fica escondida em menu.
- Tooltips complementam, não contêm ações e não substituem labels.

### Feedback e status

- Alertas persistem no contexto; toasts comunicam resultado breve e não bloqueante.
- Erro que exige correção permanece visível; sucesso não usa modal.
- Usar `role="status"` para atualização informativa e `role="alert"` somente quando interrupção imediata for necessária.
- Badge comunica estado por texto e, opcionalmente, ícone; nunca só por cor.
- Estado vazio explica o que está vazio, por quê e a ação disponível. Resultado vazio de filtro oferece “Limpar filtros”.
- Skeleton é usado quando a estrutura é conhecida; spinner em ação curta e localizada.

## Padrões de página

### Listagem

```text
PageHeader → FilterBar → DataTable | EmptyState | ErrorState → Pagination
```

Filtros simples ficam visíveis; avançados usam painel. Filtros ativos aparecem como chips removíveis.

### Criação e edição

```text
PageHeader → FormErrorSummary → FormSections → FormActions
```

Cada operação de criação ou edição de registro usa sua própria rota e página por padrão. O formulário compartilhado entre essas páginas é recomendado quando campos e validações forem comuns; modal/painel só cabe para uma ação contextual curta que não represente o formulário completo do registro.

Cancelar retorna com segurança; salvar comunica progresso e resultado.

### Visualização e dashboard

- Visualização separa dados principais, metadados e histórico.
- Dashboard exibe informação acionável, com período e origem.
- Gráficos têm alternativa textual ou tabela e não dependem somente de cor.
- Indisponibilidade parcial é tratada por widget.

### Erros

`403`, `404` e erro inesperado possuem páginas distintas, mensagem simples e ação segura. Erro inesperado pode mostrar `requestId`, nunca stack trace.

## Conteúdo e linguagem

- Português do Brasil claro e capitalização de frase.
- Botões usam verbos específicos: “Salvar cliente”, “Excluir usuário”.
- Evitar “OK” quando existir rótulo mais claro.
- Erros dizem o que ocorreu e, quando possível, como corrigir.
- Termos técnicos internos não aparecem ao usuário.
- Mensagens não culpam o usuário nem usam humor em falhas críticas.

## Acessibilidade

Requisitos mínimos:

- WCAG 2.2 AA e HTML semântico antes de ARIA.
- Operação completa por teclado, ordem coerente e foco visível.
- Labels, ajuda e erros programaticamente associados.
- Mensagens dinâmicas anunciadas quando relevantes.
- Zoom de 200% e reflow a 320 CSS px sem perda de funcionalidade, salvo conteúdo bidimensional essencial.
- Nenhuma informação depende somente de cor, posição, forma ou movimento.
- “Ir para o conteúdo” é o primeiro controle focável nos layouts com navegação repetida.
- Título do documento e foco são atualizados em mudanças de rota da SPA.
- Componentes públicos recebem teste automatizado e por teclado; fluxos críticos recebem verificação manual proporcional ao risco.

## Responsividade

- **Mobile, abaixo de 768 px:** uma coluna, padding de 16 px, menu em overlay, ações essenciais priorizadas e grupos empilhados quando necessário.
- **Tablet, 768–1023 px:** grids reduzem progressivamente; menu permanece em overlay; filtros podem quebrar linha.
- **Desktop, 1024–1535 px:** menu persistente, maior densidade e largura limitada.
- **Wide, a partir de 1536 px:** espaço extra vira margem ou painel útil; texto e formulários simples não são esticados.

## Implementação dos temas

```css
:root[data-theme="light"] { color-scheme: light; }
:root[data-theme="dark"] { color-scheme: dark; }
```

- O seletor oferece “Claro”, “Escuro” e “Usar configuração do sistema”.
- A preferência persistida é `system`, `light` ou `dark`. Em `system`, atualizar `data-theme` para o tema resolvido quando `prefers-color-scheme` mudar; em escolha explícita, não sobrescrever `data-theme` com mudanças do sistema.
- Imagens, marcas e gráficos preservam contraste nos dois temas.
- Impressão usa tema claro, remove navegação e mantém o conteúdo necessário.

## Governança

- Novo componente público exige documentação de uso, estados, tokens e acessibilidade.
- Variação de módulo só existe quando o componente comum não atende semanticamente.
- Módulos não criam tokens próprios sem aprovação do sistema de design.
- Alterações incompatíveis exigem migração coordenada.
- Toda alteração de token é verificada nos temas claro e escuro.
- O módulo de referência demonstra layouts, formulários, tabela, modal, feedback e responsividade.

## Critérios de aceite da implementação inicial

Três protótipos estáticos em [docs/prototypes](prototypes/auth.html) exemplificam os layouts e as cores deste documento. Eles servem para revisão visual; a implementação final continua sendo a SPA React/TypeScript definida na arquitetura do frontend.

1. `tokens.css` contém os tokens obrigatórios para os dois temas.
2. `globals.css` aplica tipografia, canvas, foco e preferências de movimento.
3. `AuthLayout`, `PublicLayout` e `AdminLayout` seguem este documento.
4. Componentes públicos possuem exemplos, estados e testes de acessibilidade.
5. O menu funciona expandido, recolhido e em overlay mobile.
6. O tema não produz flash incorreto na carga inicial.
7. Login, listagem e edição são operáveis por teclado e verificados contra WCAG AA.
8. O módulo de referência demonstra ao menos uma página de cada padrão principal.
