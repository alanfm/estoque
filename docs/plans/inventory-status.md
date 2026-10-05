# Acompanhamento — Módulo Almoxarifado de TI

**Raiz obrigatória do projeto:** `~/Projects/estoque`.
**Referência técnica:** `alanfm/starterkit`, revisão consultada `ff1812f0dbfd95e84243d738768262ca0d36e1af`; o checkout em `~/Projects/starterkit` não é destino de alterações.
**Atualização da base em 05/10/2026:** incorporadas as mudanças entre `ff1812f0dbfd95e84243d738768262ca0d36e1af` e `63ff5212e183689e14147ebc19a73295c344909d`, do checkout somente leitura em `/home/alan/Projetos/starterkit`. Evidências e orientações de implantação na seção final deste documento.
**Estado:** P00 permanece bloqueada pela falha Act registrada; P01 concluída localmente; P02–P09 aceitas pelo usuário para desenvolvimento; P10 em andamento, sem aceite de homologação. A falha Act e as limitações de concorrência/retroatividade permanecem explícitas.

P02 foi iniciada explicitamente pelo usuário antes da resolução do gate P00/P01. Essa decisão não equivale ao aceite do gate anterior; a falha Act segue pendente.

## P00 — Preparação e baseline

| Item | Estado | Evidência / próxima ação |
|---|---|---|
| P00.1 Raiz e baseline | concluído | Base host incorporada em `estoque` a partir do `git archive` da revisão `ff1812f0dbfd95e84243d738768262ca0d36e1af`; preservados `.git` local e documentos funcionais. Nenhuma alteração feita em `~/Projects/starterkit`. Repositório local ainda sem commit. |
| P00.2 Contratos e orientações | concluído | Revisadas instruções, plano arquitetural, ambiente, política modular, API, autenticação, autorização, compatibilidade e deploy da referência; `AGENTS.md` atualizado para o estado real do host. |
| P00.3 Ambiente e checks | bloqueado | Sail/MariaDB sobem em portas locais 18080/15173/13307/18025; migrations, sincronização de permissões e build passam. Checks locais: Pint, PHPStan, PHPUnit (46/345), Prettier, ESLint, TypeScript e Vitest (52) passam. `/` e `/up` retornam 200; API com `Accept: application/json` retorna 401. Act falha consistentemente em `ApiContractTest::test_unexpected_error_is_sanitized_and_correlated_with_log` (espera `requestId` no contexto do log, recebe null); investigar antes do aceite. `npm ci` reportou 2 vulnerabilidades moderadas; Vite avisa chunk acima de 500 kB. |
| P00.4 Mapa de contratos | concluído | `module-kit` público exporta tipos/UI/`useSession`, mas ainda não `apiRequest`/`ApiError`; cliente atual é JSON-only. Pacotes são Composer locais com `module.json`; provider estende `ModuleServiceProvider`; API usa Resources e auth Sanctum/sessão; IDs de usuário usam FK do host. P01 endereça a lacuna de API/testes antes do pacote Inventory. |
| P00.5 Organização documental | concluído | Análise, especificação, plano e status permanecem sob `docs/`; links entre os três documentos preservados. |

### Próxima ação

Investigar a divergência do teste de correlação de logs entre o runner Act e o ambiente Sail local; reexecutar o workflow após corrigir/explicar a causa. P01 foi adiantada a pedido do usuário; não marcar P00 aceita nem iniciar P02 antes de resolver este gate.

Nenhum código funcional do estoque foi implementado e nenhum dado operacional foi importado ou alterado. Foram executados somente os testes e smoke checks do host de referência.

## P01 — Contratos públicos e integração de qualidade

| Item | Estado | Evidência / próxima ação |
|---|---|---|
| P01.1–P01.3 Cliente e exports públicos | concluído localmente | `module-kit` exporta `apiRequest`, `apiDownload`, `ApiError`, opções/tipos HTTP e recursos paginados. Headers de sessão/CSRF protegidos; headers customizados suportados; JSON/FormData/download implementados. |
| P01.4 Retry/idempotência | concluído localmente | GET pode repetir uma vez após 419; escritas só repetem com `Idempotency-Key` não vazia, preservando chave e corpo. Testes de retry e escrita não idempotente aprovados. |
| P01.5 Consumers de referência | concluído | `customersService` não importa caminhos internos e declara compatibilidade `^1.1.0`. |
| P01.6–P01.7 Descoberta e qualidade | concluído localmente | PHPUnit/PHPStan incluem `modules/acme/inventory`; Vitest/TypeScript/Prettier incluem o frontend do módulo. Testes sentinela confirmam descoberta. |
| P01.8 Contrato e compatibilidade | concluído localmente | `docs/contracts/core-1.1-module-http-client.md`; core configurado como 1.1.0; release/tag não publicados. |
| Verificação integrada | pendente | Sail: PHP 47 testes/346 assertions e Vitest 58 testes passam; Pint, PHPStan, lint, typecheck, Prettier, build e diagnóstico modular passam. Reexecutar Act após resolver o bloqueio P00 para evidência limpa. |

P01 foi avançada antes do aceite formal de P00 a pedido do usuário. A falha Act permanece classificada como bloqueio de baseline; não houve release/tag nem importação de dados reais.

## P02 — Pacote modular, schema e autorização

| Item | Estado | Evidência / próxima ação |
|---|---|---|
| P02.1–P02.5 Pacote, manifesto, provider, rota e página inicial | aceito | Pacote Composer descoberto pelo loader; diagnose sem issues. Manifesto declara permissões individuais e entrada frontend protegida. |
| P02.6 Schema | aceito | Três migrations criam as 12 tabelas, índices, constraints e FKs para usuários do host. `artisan migrate --force` aplicado com sucesso ao banco local após corrigir nome longo de índice. |
| P02.7 Instalação e fábrica | aceito | `inventory:install` executado duas vezes; local TI permanece idempotente. Factory/model de categoria mínimo. |
| P02.8–P02.9 Navegação/permissões/ciclo de habilitação | aceito pela aprovação do usuário | Página inicial lazy; endpoint inicial protegido por sessão/permissão; manifesto sincronizado (22 criadas, 16 atualizadas). O ciclo disable/enable sem perda não foi exercitado. |
| Verificações | aceito pela aprovação do usuário | Diagnose sem issues; `ContractDiscoveryTest` passa; migrações aplicadas em MariaDB local; Pint, PHPStan, ESLint, TypeScript e build passam. Build mantém aviso de chunk >500 kB. Não foi executado teste em banco limpo nem ciclo modular completo. |

P02 aceita pelo usuário em 28/09/2026, com as limitações de verificação explicitadas acima.

## P03 — Categorias, códigos e variantes

| Item | Estado | Evidência / próxima ação |
|---|---|---|
| P03.1–P03.4 API, regras e concorrência otimista | concluído localmente | CRUD de categorias/itens/variantes, normalização, autorização por operação, identidade normalizada, saldos iniciais zero e controle de versão. Item impede alterar categoria/unidade após lançamento no ledger. |
| P03.5–P03.6 UI e listagem/detalhe | concluído localmente | Páginas lazy de categorias, itens, cadastro e detalhe; busca, filtro por categoria, paginação com estado na URL, variantes/saldos e ações condicionadas à permissão. |
| Testes | concluído localmente | InventoryCatalogTest cobre autorização, categoria/código normalizados, marcas diferentes, variante duplicada normalizada, saldos iniciais zero, versão obsoleta, categoria inativa e filtros. |
| Checks | concluído localmente | InventoryCatalogTest: 3 testes/28 assertions; Pint, PHPStan, ESLint, TypeScript, Vitest sentinel e build aprovados. Build mantém aviso de chunk >500 kB. |

P03 aceita pelo usuário em 28/09/2026. Implementação e verificações locais concluídas; ainda não houve E2E, medição de desempenho ou teste dedicado do bloqueio de unidade/categoria após lançamento no ledger.

Sem dados operacionais importados. A implantação das migrations foi apenas no banco de desenvolvimento local; não executada em homologação/produção.

## P04 — Livro, concorrência e idempotência

| Item | Estado | Evidência / próxima ação |
|---|---|---|
| P04.1–P04.4 Ledger de confirmação e idempotência | aceito | `PostMovementAction` confirma ENTRY/ISSUE em transação, bloqueia itens/saldos em ordem determinística, grava ledger e projeção, e valida saldo disponível. `ExecuteIdempotentOperation` persiste hash/resposta no mesmo commit e recupera repetição/confere conflito. |
| P04.5–P04.7 Histórico, consulta e auditoria | aceito com limitações registradas | `BalanceQuery`, `ItemLedgerQuery` e auditoria de confirmação adicionados. Validação completa de backdating por sequência, eventos pós-commit e garantias concorrentes com duas conexões permanecem pendentes antes de ampliar/usar a confirmação operacional. |
| P04.8 Reconciliação | implementado localmente | `inventory:reconcile [--json]` compara projeção e soma do ledger por variante/local; somente leitura. |
| Verificações focais | aprovadas | `InventoryLedgerTest`: 1 teste/7 assertions (idempotência, divergência de payload, insuficiência sem commit e reconciliação); `composer analyse`, `composer format:check` aprovados. |

P04 aceita pelo usuário em 28/09/2026, com as limitações acima explícitas. P05 pode desenvolver rascunhos e interface, mas confirmação operacional permanece bloqueada até concluir cobertura de concorrência real/locks e retroatividade; não foram carregados dados reais.

## P05 — Rascunhos, entradas e saídas

| Item | Estado | Evidência / próxima ação |
|---|---|---|
| P05.1 Rascunhos | implementado parcialmente | API de criação idempotente, atualização com versão otimista, listagem/detalhe e descarte lógico; propriedade do criador ou permissão `manageDrafts`; eventos de auditoria. Linhas guardam snapshot; rascunhos não alteram saldos. |
| P05.2–P05.3 Dados operacionais | parcial | DTO HTTP valida linhas e campos de entrada/saída, custo decimal permanece texto no cliente/decimal no banco; regras incompletas são revalidadas na futura confirmação. Confirmar ainda não está exposto, respeitando o gate de segurança P04. |
| P05.5 UI | implementado parcialmente | Lista/detalhe e formulários de rascunho de entrada/saída com seletor de variantes, estados de carregamento/erro e descarte. Edição visual do rascunho ainda pendente. |
| Testes e checks focais | aprovados localmente | `InventoryMovementDraftTest`: 1 teste/15 assertions, incluindo rascunho incompleto, repetição da Idempotency-Key, propriedade, descarte e ausência de efeito no ledger. Pint, PHPStan, lint, typecheck, Vitest sentinela e build passaram. Build mantém alerta de chunk >500 kB. |

P05 aceita pelo usuário em 28/09/2026, com as limitações registradas acima. Permanecem pendentes os testes P04 de concorrência real e retroatividade, validação completa na confirmação (origem/documento/OS/custo/data/saldo), endpoints/UI de confirmação e edição visual, além de testes adicionais para conflitos de versão, permissões e regras de negócio. A confirmação operacional continua bloqueada até resolver as limitações de integridade. Nenhum saldo operacional foi alterado.

## P06 — Contagem, ajustes e estornos

| Item | Estado | Evidência / próxima ação |
|---|---|---|
| P06.1–P06.2 Contagem física | implementado localmente | Endpoint idempotente usa `expectedBalanceVersion`, calcula delta sob lock de item/saldo e exige motivo. Contagem sem diferença gera movimento/auditoria sem ledger zero; resposta de saldo inclui versão. |
| P06.3–P06.5 Estorno integral | implementado localmente | Endpoint idempotente bloqueia original, preserva ledger original, grava linhas/lançamentos com sinais opostos, atualiza saldo e audita original/compensação. Índice único impede segundo estorno; resultado negativo retorna conflito sem commit. |
| P06.6 Interface | implementado localmente | Tela de contagem mostra saldo atual/prévia e conflito por versão; detalhe do movimento permite estorno condicionado à permissão, com motivo obrigatório e aviso de impacto no saldo. |
| Testes e checks focais | aprovados localmente | Suíte Inventory: 9 testes/76 assertions (inclui permissão, versão obsoleta, delta zero, estorno idempotente/duplicado e bloqueio de saldo negativo); Pint, PHPStan, Prettier, ESLint, TypeScript, Vitest (58 testes) e build aprovados. Build mantém aviso de chunk >500 kB. |

P06 aceita pelo usuário em 29/09/2026. A suíte Inventory e os checks de qualidade foram executados; não foi adicionado/executado teste com dois processos reais para reversões concorrentes nem demonstrado o comportamento dos locks MariaDB. Essa limitação permanece explícita. Confirmação de ENTRY/ISSUE e validação histórica P04 continuam pendentes; nenhum dado real foi alterado.

## P07 — Reposição por consumo e prazo

| Item | Estado | Evidência / próxima ação |
|---|---|---|
| P07.1 Configuração auditada | implementado localmente | Endpoint protegido por `inventory.items.configureReplenishment`, versão otimista e auditoria before/after. Teste cobre permissão, conflito de versão e auditoria. |
| P07.2–P07.6 Consulta e regra | implementado localmente | Endpoint de recomendação calcula janela completa anterior ao dia corrente, consumo ISSUE líquido de reversões de ISSUE, segurança e teto; distingue parâmetros ausentes e cobertura insuficiente. Testes cobrem 90/180×30+5, reversão dentro/fora da janela, movimento no dia corrente, consumo zero, segurança zero, saldo negativo, parâmetro NULL e histórico insuficiente. |
| P07.7 Interface | aceito com limitação | Detalhe do item mostra situação, saldo, período, consumo, prazo, segurança, sugestão e permite configurar parâmetros com permissão. A ação explícita para aplicar a sugestão fica fora desta entrega. |
| Verificações | aprovadas localmente | `InventoryReplenishmentTest`: 4 testes/37 assertions; Pint, PHPStan, Prettier, ESLint, TypeScript e Vitest sentinela passam. |

P07 aceita pelo usuário em 29/09/2026, com a limitação da ação de aplicação explícita registrada acima. Nenhum parâmetro efetivo foi configurado e nenhum saldo operacional foi alterado. O cálculo permanece sob demanda, sem scheduler/cache. A ação de aplicar sugestão pode ser tratada em entrega futura.

## P08 — Dashboard, relatórios e exportação

| Item | Estado | Evidência / próxima ação |
|---|---|---|
| P08.1 Dashboard | aceito | Endpoint com alertas/contagens, unidade de entradas/saídas no período e `asOf`; página com estado de carregamento/erro e intervalo. |
| P08.2–P08.3 Relatórios | aceito | Consultas de estoque por variante/unidade, reposição, consumo agrupável (item/categoria/OS/mês) e ajustes/estornos. Consultas compostas leem em transação para snapshot consistente. Estoque informa custo histórico conhecido e linhas/unidades sem custo, sem chamar custo de avaliação do saldo. Datas inclusivas testadas para consumo e ajustes; situação segue a prioridade aprovada. |
| P08.4–P08.5 Exportações | aceito com verificações operacionais pendentes | CSV neutraliza fórmulas; XLSX grava valores textuais como string; ambos incluem instante/moeda, usam dados/filtros correspondentes e exigem as permissões `reports.view` + `reports.export`. PhpSpreadsheet ^5.2 adicionado ao pacote; extensões GD/ZIP/XML necessárias estão declaradas nos Dockerfiles de produção/bootstrap. Imagem Docker ainda não reconstruída. |
| P08.6 Interface | aceito com verificações pendentes | Página de relatórios com tipos, filtros, paginação e controles de exportação condicionados à permissão; painel dashboard lazy. Revisão visual/E2E pendentes. |
| Verificações | aprovadas localmente | `InventoryReportsTest`: 4 testes/48 assertions; suíte Inventory: 17 testes/161 assertions; Vitest: 58 testes. Pint, PHPStan, Prettier, ESLint, TypeScript, build e `composer check-platform-reqs --no-dev` passam; build mantém alerta de chunk >500 kB. Composer validate apenas reporta ausência de licença. `composer require` não reportou advisories de segurança. |

P08 aceita pelo usuário em 29/09/2026. Permanecem explícitas as verificações de reconstrução da imagem Docker, revisão visual/E2E e medição de desempenho. Nenhuma exportação contém payload de auditoria completo ou dados reais importados.

## P09 — Importação assistida e saneamento

| Item | Estado | Evidência / próxima ação |
|---|---|---|
| P09.2 Persistência privada | validado em smoke local; backup operacional pendente | Disco `inventory-imports` fora de `public`, volume persistente dedicado em `compose.production.yaml` e ownership `www-data` preparado no Dockerfile. Em stack isolada de produção local, escrita como `www-data` e permanência após recriar `app` passaram com `read_only=true`; backup/restauração ainda não exercitados. |
| P09.3–P09.9 Parser, lote, saneamento e commit | aceito para estrutura v1.2; carga operacional pendente | Adaptador reconhece DADOS/LANÇAMENTOS, converte datas Excel, ignora abas de relatório/fórmulas derivadas e preserva o valor em cache de fórmula quantity para revisão; hash idempotente, prévia, correção restrita, mapeamento explícito, skip justificado, commit transacional e auditoria. Leitura real somente em memória: 178 entradas/3.936, 612 saídas/992; líquido 2.944 e negativos conferem com controles conhecidos. |
| P09.1 Estrutura da fonte real | analisada sem alteração | Abas/cabeçalhos v1.2 reconhecidos. Achada divergência: quatro entradas sem data (especificação registrava três); três saídas sem data. Cinco datas 30/05/2003 ligadas às OS 1001–1003 encontradas. Uma saída tem quantidade ausente; outra usa fórmula com cache 27. Fonte não copiada para o projeto nem carregada no banco. |
| P09.10 Interface e testes | implementado localmente, aceite com limites | Tela lazy permite upload, prévia paginada, mapeamento item/variante/tipo e descarte justificado. Testes sintéticos de commit/idempotência e reader v1.2; suíte Inventory: 19 testes/192 assertions. A associação dos 110 códigos às variantes físicas continua revisão humana. |

P09 aceita pelo usuário em 29/09/2026 para o desenvolvimento; análise da fonte v1.2 autorizada em seguida e concluída em modo somente leitura. Não foi feito upload nem importação operacional. Ainda faltam decisão da CTI sobre a quarta data ausente e linha de quantidade ausente, reconciliação de variantes físicas, execução de prévia/upload autorizado e exercício de backup/restauração. Build e smoke local da imagem, incluindo persistência do disco privado após recriar container, foram executados em P10. Ver `docs/modules/inventory/importacao.md`.

## P10 — Integração e homologação

| Item | Estado | Evidência / próxima ação |
|---|---|---|
| P10.1 Checks completos | aprovado localmente | Composer format/PHPStan/platform reqs, PHPUnit (66 testes/544 assertions), Prettier, ESLint, TypeScript, Vitest (58 testes) e build frontend aprovados. Vitest atualizado para 4.1.11; `npm ci` e `npm audit` passam sem vulnerabilidades. O postinstall do `esbuild` foi explicitamente aprovado no `package.json` para manter a instalação reproduzível. |
| P10.1 Correção de integração | implementado e validado | `tests/Feature/ModuleContractTest.php` invalida `RefreshDatabaseState` ao terminar os testes com módulos temporários; antes disso, `migrate:fresh` deixava o schema sem Inventory para suítes posteriores. Suíte completa passa após correção. |
| P10.5 Imagens e boot de produção | aprovado em ambiente isolado local | `docker compose -f compose.production.yaml build` produziu `starterkit-app:local` e `starterkit-web:local`; stack de smoke isolada iniciou saudável. Migrations aplicadas, `inventory:install` idempotente, 38 permissões sincronizadas e diagnose sem issues. `/up` 200, API Inventory sem sessão 401 JSON e asset lazy `ImportsPage` 200. Stack removida após teste; volumes de smoke não foram apagados. |
| P10.5 Upload privado | validado localmente | Escrita de arquivo como `www-data`, recriação do container `app` e leitura do mesmo conteúdo passaram com filesystem root read-only; marcador de teste removido. Não substitui exercício de backup/restauração. |
| P10.2 E2E por papel | aprovado localmente; homologação pendente | `tests/e2e/inventory.auth.spec.ts` executa 5 testes (setup + almoxarife, gestor, auditor e administrador operacional), com login, sessão real, catálogo, permissões e negativas de navegação/ações; resultado local: 5 passed em 13,4 s usando somente contas/papéis sintéticos. A rota de preparação exige `E2E_ROLE_ACTORS=true` e só é registrada em `local`/`testing`; não existe na configuração normal nem em produção. Isso não substitui aceite operacional da CTI. |
| P10.3 Matriz AC01–AC24 | aceito tecnicamente pelo usuário; homologação pendente | `docs/plans/inventory-acceptance-matrix.md` mapeia cada critério aos testes/evidências e separa cobertura parcial das pendências. Concorrência com processos/conexões reais e retroatividade continuam sem evidência. |
| P10.4 Desempenho | aceito tecnicamente pelo usuário; homologação pendente | `inventory:benchmark --iterations=5 --lines=100 --json` usa somente dados sintéticos em transação revertida. p95: dashboard 7,56 ms/3 queries; relatório 7,75 ms/2 queries; confirmação 215,57 ms/312 queries. Metas propostas foram atingidas neste ambiente, sem representar produção. Metodologia/limitações em `docs/plans/inventory-performance.md`. |
| P10.6–P10.7 Homologação operacional | parcialmente definido; implantação sem carga | Decisões CTI registradas: planilha somente como referência histórica; sem prévia/commit inicial; catálogo, unidades e variantes cadastrados manualmente; PEN02/SSD01/HDN02/TN003 com saldo zero; mínimos, estoque de segurança e prazo de compra definidos manualmente pelo administrador; cobertura histórica confirmada como referência futura; técnicos de TI operam inicialmente. Ainda faltam janela de recomendação, janela/responsáveis da implantação e cadastro manual dos 110 códigos. Nenhum dado real foi enviado ou importado. |
| P10.8 Backup/restauração | validado em smoke local; operacional pendente | Dump restaurado em banco temporário e arquivo do volume privado restaurado/lido como `www-data` em volumes isolados. Evidência e limitações em `docs/modules/inventory/backup-restauracao.md`; não substitui exercício com dados reais e política operacional. |

P10 continua em andamento e não está aceita. O teste local confirma integração técnica, imagem e jornadas sintéticas por papéis, mas não representa homologação operacional da CTI. Permanecem também o bloqueio P00 (falha Act registrada anteriormente) e as limitações P04 de concorrência/retroatividade; confirmação operacional de ENTRY/ISSUE e importação real seguem bloqueadas.

P10.3 e P10.4 foram aceitas pelo usuário em 30/09/2026 como entrega técnica local; P10.8 foi validada em smoke local na mesma data. Isso não substitui o aceite operacional de P10.6–P10.7.

## P11 — Implantação e entrega

| Item | Estado | Evidência / próxima ação |
|---|---|---|
| P11.1 Artefatos reprodutíveis | preparado localmente | `composer.lock`, `package-lock.json`, Dockerfile e compose de produção permanecem versionados; README registra compatibilidade e procedimento. Nenhum release/tag foi publicado. |
| P11.2 Backup completo | validado em smoke local; operacional pendente | Evidência em `docs/modules/inventory/backup-restauracao.md`; falta executar com dados e política de homologação/produção. |
| P11.3 Instalação e diagnóstico | documentado; execução operacional pendente | Sequência registrada em `docs/modules/inventory/implantacao.md`; depende de ambiente de homologação e janela aprovada. |
| P11.4 Efetivação do lote | não aplicável à implantação inicial | Não haverá lote inicial; a planilha será referência histórica e o catálogo será manual. O fluxo de importação poderá ser autorizado em fase futura. |
| P11.5 Smoke autenticado | testes locais aceitos pelo usuário; operação pendente | Testes locais, E2E sintético por papéis e smoke de imagem foram considerados relativamente satisfatórios pelo usuário; ainda falta operação controlada após o cadastro manual. |
| P11.6 Documentação de entrega | preparado localmente | `README.md`, `CHANGELOG.md`, OpenAPI, guia de implantação/backup e questionário CTI adicionados; revisar com operadores antes da homologação. |

P11 foi preparada tecnicamente, mas não está aceita para implantação. A liberação inicial depende do cadastro manual, da definição do prazo/janela de reposição, da janela e responsáveis de implantação, dos gates P04 e dos testes operacionais; não haverá importação inicial.

## Correções de interface — 01/10/2026

- Campo Variante de Nova entrada e Nova saída convertido em seletor com pesquisa por código, nome do item, marca, modelo e descrição, ignorando acentos e maiúsculas/minúsculas. Permite seleção por mouse ou teclado, informa pesquisa sem resultados e exige escolher uma variante válida. Verificações via Sail: três testes focais do componente, ESLint dos arquivos alterados e TypeScript aprovados; arquivos frontend formatados com Prettier. Pesquisa usa o catálogo já carregado (até 100 itens); revisão visual no navegador não executada.
- Decisão de interface atualizada: cadastros/edições em modais. Convertidos usuários, papéis, clientes, criação de itens, entradas/saídas e contagem por rota; alteração de senha e estorno também em modais. Categorias, variantes, reposição e edição de rascunhos mantêm os modais existentes. URLs e validações preservadas; fundo de listagem respeita sua permissão específica e modais longos têm rolagem. Verificações via Sail: 81 testes frontend aprovados (incluindo acesso direto, foco, fechamento por X/Esc e permissão do fundo), Prettier, ESLint, TypeScript e build aprovados. Build emite aviso de chunk principal acima de 500 kB; não houve homologação visual no navegador nesta alteração.
- Botões de movimentações com texto, ícones e bordas em cores distintas: Nova entrada em verde, Nova saída em laranja e Contagem de estoque em azul; fundo transparente inclusive no hover, preservados tamanho, formato e estados de interação. Prettier da página e `npm run typecheck` aprovados via Sail.
- A coluna Data da tabela de movimentações exibe `DD/MM/AAAA`, preservando o dia informado sem conversão de fuso; datas ausentes continuam como `—`.
- Verificações via Sail: Prettier da página de movimentações e `npm run typecheck` aprovados.

- Painel do almoxarifado enriquecido com cards de itens ativos/atenção/regulares e movimentos, gráfico diário por tipo, distribuição exclusiva por situação, oito alertas prioritários e atalhos condicionados às permissões. Filtros de data, atualização, estados vazios/erro e validação de intervalo preservados; estoque representa posição atual e gráfico usa contagem de movimentos, sem agregar unidades distintas. Consulta aplica a prioridade normativa de inconsistência antes dos demais alertas. Verificações via Sail: InventoryReportsTest (5 testes/65 assertions), Pint, PHPStan, ESLint dos arquivos alterados, TypeScript e build aprovados. Build mantém aviso existente de chunk principal >500 kB; revisão visual no navegador não executada. Nenhum dado operacional foi alterado.


## Atualização do Starter Kit — 05/10/2026

Incorporadas as cinco revisões posteriores ao baseline, até `63ff521`: navegação agrupada por módulo, Vitest 5.0.3, autenticação local/LDAP, seeders de teste protegidos por ambiente e login por matrícula com provisionamento/sincronização de perfil LDAP. O código upstream foi integrado por comparação de três versões (baseline, estoque e starterkit); não houve alteração no repositório de referência.

Preservados: módulo Inventory, bypass de superadministrador, contratos públicos HTTP 1.1 e sua política de retry/idempotência, formulários em modais, GD/ZIP para exportação e volume privado `inventory-imports`. Customers passa para 1.1.0; o core permanece na versão upstream 1.1.0. Lockfiles atualizados sem remover o pacote Inventory ou PhpSpreadsheet. Indisponibilidade LDAP usa `AUTH_PROVIDER_UNAVAILABLE`; demais erros 503 preservam `SERVICE_UNAVAILABLE`.

Corrigida falha preexistente do benchmark sintético: a entrada de exemplo agora informa origem/documento e usa a data corrente. A operação permanece transacional e reverte os dados sintéticos.

### Evidências locais

- Suíte PHP completa: 89 testes / 693 assertions aprovados em MariaDB isolada `starterkit_test`.
- Após incluir regressões de integração: suíte focal `ApiContractTest|LdapProvisioningTest|LocalLdapAuthenticationTest`, 24 testes / 153 assertions aprovados. Inclui negação de leitura/escrita no inventário para conta LDAP recém-provisionada sem papéis e manutenção do contrato de erro 503 genérico.
- Vitest 5.0.3: 22 arquivos / 92 testes aprovados, incluindo testes do módulo Inventory e do cliente HTTP público.
- Pint, PHPStan, Prettier, ESLint, TypeScript (etapa do build) e build Vite aprovados. Permanece o aviso conhecido do bundle principal acima de 500 kB.
- Diagnóstico modular: core 1.1.0, Customers 1.1.0 e Inventory 1.0.0 habilitados, sem issues.
- Lockfile npm sem vulnerabilidades reportadas; atualização Composer sem advisories reportados.

### Implantação ainda necessária

As duas migrations de autenticação foram exercitadas somente no banco de testes. Não foram aplicadas ao banco de desenvolvimento ou a homologação/produção; nenhum usuário, papel ou saldo operacional foi alterado e nenhum seeder foi executado nesses bancos. Não houve importação da planilha.

Antes de liberar esta versão: aplicar as migrations com backup, associar matrículas conferidas aos usuários existentes (incluindo o administrador) e verificar login local. Os registros antigos mantêm ID, senha, papéis e vínculos com o inventário, mas a migration não inventa matrículas. `AUTH_MODE=local` continua sendo o padrão; a ativação LDAP exige configuração/homologação institucional. O comando de bootstrap cria apenas o primeiro administrador e não preenche matrículas de administradores existentes.

Os testes E2E foram adaptados ao novo login, mas não executados nesta atualização. Não foram executados Act, rebuild das imagens de produção ou conexão ao diretório institucional real; testes LDAP usam adaptador simulado. Os resultados upstream importados em documentos F0–F7/SPEC são históricos da referência, não evidência de implantação do estoque. Consulte também o [guia de implantação](../modules/inventory/implantacao.md).


## Remoção do módulo de exemplo Clientes — 05/10/2026

Removido `modules/acme/customers`, a dependência Composer `acme/customers`, os testes funcionais/E2E exclusivos do exemplo e o caminho de formatação do frontend. O smoke de produção do pipeline passa a verificar `/api/v1/inventory/items` e o asset `ItemsPage.tsx`. A documentação operacional aponta para Inventory; menções históricas ao exemplo upstream e fixtures sintéticas de navegação permanecem como referência.

A remoção não executa rollback nem exclui tabelas ou dados existentes. O catálogo de permissões obsoletas será atualizado pelo comando normal `core:sync-permissions` na implantação, preservando vínculos históricos. O starterkit de referência permanece intacto.

Verificações após a remoção: suíte PHP completa com 88 testes / 680 assertions; PHPStan, formatação frontend e build com TypeScript aprovados. Diagnóstico lista apenas Inventory 1.0.0 habilitado, sem issues. Manifesto do build verificado sem entradas Customers e com `ItemsPage.tsx` do Inventory.
