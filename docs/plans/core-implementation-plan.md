# Plano de implementação do núcleo

## Objetivo e limite

Entregar uma aplicação Laravel 13/PHP 8.5, React/TypeScript e MariaDB executável em Docker, capaz de autenticar usuários, administrar acesso e hospedar módulos Composer com frontend compilado pela SPA. Este é um plano de implementação: os critérios abaixo não afirmam que já exista código ou infraestrutura pronta.

O núcleo é dono de identidade, sessão, autorização, API transversal, registro de módulos, shell da SPA, design system e ferramentas de teste. Regras de negócio (por exemplo, clientes) pertencem a módulos. O módulo de referência serve para provar o contrato, não para incorporar seu domínio ao núcleo. Não entram no primeiro marco: multitenancy, cadastro público, login federado, 2FA, tokens pessoais, carregamento remoto de bundles e catálogo de módulos de terceiros.

As fases são sequenciais pelos seus critérios de saída; tarefas independentes dentro de uma fase podem avançar em paralelo. Uma fase só é encerrada com evidência reproduzível em revisão, preferencialmente link para execução de CI, teste ou demonstração. Não se antecipa `1.0.0` antes da validação do contrato público.

## Responsabilidades

Os papéis são funções de trabalho, não pessoas obrigatoriamente diferentes. Ao iniciar cada fase, registrar no acompanhamento um responsável nominal e um revisor; se uma pessoa acumular papéis, a revisão ainda deve ser feita por outra pessoa quando houver equipe disponível.

| Papel | Responsabilidade principal |
|---|---|
| Coordenação técnica | Priorizar fases, resolver decisões e dependências, manter este plano e aceitar marcos. |
| Backend | Laravel, MariaDB, autenticação, autorização, API e ciclo de vida dos pacotes. |
| Frontend | SPA, cliente HTTP, design system, navegação e integração das entradas dos módulos. |
| Infra/CI | Docker/Sail, imagem e execução em Docker, configurações por ambiente e pipeline. |
| Qualidade/revisão | Critérios de aceite, testes cruzados, acessibilidade e evidências de release. |

## Fases e critérios de saída

### F0 — Fundação e ambiente reproduzível

**Objetivo:** partir de um host instalável e de uma rotina de desenvolvimento igual para núcleo e módulos.

**Escopo e ordem:**

1. Criar aplicação Laravel na plataforma definida, configurar Composer, TypeScript estrito, Vite e lockfiles do host.
2. Configurar Docker Compose de desenvolvimento com Laravel Sail, PHP 8.5, MariaDB e serviço de captura de e-mail; definir volumes, portas configuráveis, `.env.example` e isolamento de dados de teste. Validar disponibilidade das imagens/extensões necessárias antes de fixar a receita.
3. Documentar bootstrap, `up`, instalação de dependências, migrations, build, testes e `down` executados via Sail, inclusive a instalação inicial quando ainda não existir `vendor/`. Usar os mesmos serviços para desenvolver módulos locais em `modules/`.
4. Criar pipeline mínimo com formatação, análise estática, lint, tipos, testes backend/frontend e build; iniciar testes de integração com MariaDB real.

**Responsáveis:** Infra/CI (líder), Backend e Frontend (configuração), Qualidade (reprodução).

**Aceite verificável:** checkout limpo sobe via procedimento documentado; o ponto de entrada da SPA e uma rota técnica de saúde do Laravel respondem na mesma origem; migrations e um teste de integração passam com MariaDB no container; CI executa os comandos documentados. Falha de versão de PHP, extensão ou permissão de arquivos bloqueia F0.

### F1 — Contrato HTTP e persistência transversal

**Objetivo:** estabelecer a fronteira estável entre Laravel e SPA antes dos fluxos de identidade.

**Escopo e ordem:** migrations do usuário e dados transversais; rotas `/api/v1` sem interceptação pelo fallback da SPA; Form Requests, controllers invocáveis e Resources; erros JSON com `code`, `message`, `details`, `requestId`; convenções de paginação e status; documentação dos endpoints à medida que surgirem.

**Responsáveis:** Backend (líder), Frontend (validação de consumo), Qualidade (contratos).

**Aceite verificável:** testes HTTP demonstram JSON e status para sucesso, `404`, `422` e erro inesperado sem detalhes internos; `requestId` correlaciona resposta e log; rota SPA e `/api/v1` coexistem na mesma origem; migrations sobem em MariaDB limpo. O contrato segue [api-conventions.md](../api-conventions.md).

### F2 — Sessão e ciclo de vida da senha

**Objetivo:** permitir acesso first-party sem cadastro público nem credenciais padrão.

**Escopo e ordem:** configurar sessão/Sanctum e CSRF; criar o mínimo de persistência de papel/atribuição necessário ao bootstrap do administrador; comando idempotente e seguro para primeiro administrador; login, usuário atual e logout; recuperação, definição inicial e alteração de senha; invalidação de todas as sessões após redefinição; limites de tentativas e envio de link de uso único. A API de criação administrativa de contas fica em F3, quando a autorização estiver disponível.

**Responsáveis:** Backend (líder), Infra/CI (sessão, e-mail e testes em containers), Qualidade (segurança).

**Aceite verificável:** testes cobrem sessão regenerada no login, CSRF, `401`, limite de tentativas, recuperação sem enumeração, token válido/expirado/reutilizado, bloqueio de login antes da primeira senha, encerramento de sessões após reset e ausência de autorregistro. O fluxo segue [authentication.md](../authentication.md).

### F3 — Autorização e administração de acesso

**Objetivo:** fazer permissões efetivas controlarem operações no servidor.

**Escopo e ordem:** completar catálogo de permissões e vínculos sobre os papéis iniciados em F2; centralizar regra do superadministrador; policies/gates; criar APIs para usuários e papéis e atribuição de papéis; enviar link de definição de senha na criação administrativa; impedir perda do último administrador; preparar sincronização não destrutiva de permissões (a leitura de manifestos entra em F5).

**Responsáveis:** Backend (líder), Frontend (contrato de permissões da sessão), Qualidade (matriz de acessos).

**Aceite verificável:** para cada operação administrativa, testes demonstram `401` para visitante, `403` para usuário sem permissão e sucesso para usuário autorizado; criar usuário exige permissão e não envia senha por e-mail; o último administrador não pode ser removido acidentalmente; `GET /api/v1/auth/user` expõe apenas dados e permissões previstos em [authorization.md](../authorization.md).

### F4 — SPA e experiência essencial

**Objetivo:** integrar sessão e administração à interface, com base visual reutilizável.

**Escopo e ordem:** cliente HTTP com cookies/CSRF e tratamento de `401/403/419/422/429`; Context + `useReducer` para sessão e tema; router e proteção de rotas; tokens claro/escuro e componentes shadcn/ui incorporados; AuthLayout, PublicLayout e AdminLayout; telas de login, recuperação, definição/alteração de senha, usuários e papéis com React Hook Form.

**Responsáveis:** Frontend (líder), Backend (integração), Qualidade (teclado e acessibilidade).

**Aceite verificável:** jornadas login/logout, recuperação, criação de usuário e administração funcionam de ponta a ponta; refresh mantém sessão válida; `422` aparece junto aos campos e `403` em tela própria; tema não pisca na carga inicial; navegação por teclado e visualização mobile/desktop seguem [design.md](../design.md). Testes de componentes e E2E dos fluxos críticos passam.

### F5 — Contrato e ciclo de vida dos módulos

**Objetivo:** instalar módulos independentes sem expor classes internas nem carregar versões incompatíveis.

**Escopo e ordem:** versionar schema de `module.json`; descobrir providers via Composer; validar identificação, versões, dependências e ciclos; definir habilitação/desabilitação preservando dados; registrar rotas, migrations, permissões e entradas SPA; sincronizar permissões sem apagar atribuições; integrar descoberta das entradas ao build Vite do host; fornecer suíte de contrato e diagnóstico não interativo para pipelines.

**Responsáveis:** Backend (líder do ciclo de vida e schema), Frontend (registro/build), Infra/CI (pipeline), Qualidade (suíte de contrato).

**Aceite verificável:** pacote local instalado registra provider, rota, migration, permissão, menu e página compilada; manifesto inválido, dependência ausente/circular ou versão incompatível impedem ativação com erro identificável; desabilitar conserva dados e impede uso funcional; reinstalar/reabilitar e recompilar restabelecem acesso; suíte testa compatibilidade conforme [compatibility-policy.md](../compatibility-policy.md). Registrar explicitamente os contratos públicos antes de fixar `1.0.0`.

### F6 — Módulo de referência e validação integrada

**Objetivo:** provar que o núcleo é utilizável por um pacote de negócio completo.

**Escopo e ordem:** criar módulo `customers` fora de `app/Core` com CRUD, migrations, policies, Actions/Queries/Resources, páginas de listagem e edição; rodar instalação em host limpo, testes e build; exercitar atualização compatível, desabilitação/reabilitação e preservação de dados.

**Responsáveis:** Backend e Frontend (módulo), Qualidade (validação cruzada), Coordenação técnica (revisão de fronteiras).

**Aceite verificável:** CRUD autorizado e negado passa em API e E2E; filtros/paginação funcionam em MariaDB; telas usam componentes públicos; sem imports privados do núcleo ou de outros módulos; instalação, atualização e desabilitação são repetíveis em checkout limpo. O roteiro segue [creating-a-module.md](../creating-a-module.md).

### F7 — Empacotamento e marco do núcleo

**Objetivo:** produzir e validar uma entrega Docker reproduzível do host com módulos instalados.

**Escopo e ordem:** preparar imagem de aplicação de produção com dependências e assets resolvidos por lockfiles; configurar execução HTTP e, se utilizados, worker/scheduler como processos separados, migrations como etapa explícita e dados do MariaDB em armazenamento persistente; publicar instruções de configuração por ambiente, atualização, backup/restore e saúde; validar suite completa e política de compatibilidade antes de versionar o núcleo.

**Responsáveis:** Infra/CI (líder), Backend e Frontend (artefatos), Qualidade (aceite), Coordenação técnica (liberação).

**Aceite verificável:** a imagem construída em pipeline sobe em Docker com configuração externa e sem Sail; SPA, API, sessão, banco e módulo de referência passam no smoke test; build usa lockfiles e recompila assets quando o módulo muda; procedimento de atualização e retorno a versão anterior é ensaiado com dados persistidos; verificações de [testing.md](../testing.md) estão verdes. Liberação `1.0.0` somente após publicação dos contratos e guia de instalação.

## Decisões técnicas e alternativas

| Decisão adotada | Justificativa | Alternativa e condição de revisão |
|---|---|---|
| Docker para execução; Sail para desenvolver núcleo e módulos | Reproduz PHP/MariaDB e ferramentas no time; mantém ambiente local próximo dos testes. | Compose próprio no desenvolvimento só se Sail não suportar requisito demonstrado; produção usa imagem própria, não Sail. Ver [ambiente e Docker](../environment.md). |
| Mesma origem para SPA/API e sessão com Sanctum | Evita configuração cross-origin e tokens persistidos no navegador. | Origens distintas exigiriam nova revisão de cookies, CSRF e CORS. |
| Pacotes Composer com fonte React compilada pelo host | Compatibilidade declarada e um build consistente das dependências compartilhadas. | Bundles remotos exigiriam protocolo e isolamento novos; fora do primeiro marco. |
| MariaDB real na integração; testes unitários rápidos isolados | Detecta diferenças de schema/query sem encarecer toda a suíte. | SQLite pode servir para casos unitários sem comportamento específico, nunca para validar persistência final. |
| Contratos incrementais antes de estabilizar `1.0.0` | Permite ajustar APIs com a prova do módulo de referência. | Congelar contrato antes de F6 traz risco de quebrá-lo ao integrar o primeiro pacote. |

## Riscos e respostas

| Risco / sinal de alerta | Resposta planejada | Dono |
|---|---|---|
| Imagem Sail ainda sem suporte prático à plataforma ou extensões exigidas | Fazer prova de bootstrap em F0; adaptar runtime Sail conforme documentação oficial, sem baixar versão da plataforma silenciosamente. | Infra/CI |
| Cookies/CSRF falham atrás de proxy ou com portas locais diferentes | Testar desde F2 com URL de mesma origem e em F7 atrás da configuração de HTTP real; revisar proxy, URL e atributos do cookie. | Backend + Infra/CI |
| Descoberta Composer e entradas Vite divergem após instalar módulo | Validar pacote local em F5 com build limpo e criar verificação de entradas ausentes no pipeline. | Backend + Frontend |
| Desabilitação parcial deixa rotas ou permissões utilizáveis | Definir estado único de habilitação e exercitar desabilitar/reabilitar preservando dados na suíte de contrato. | Backend |
| Escopo visual e administrativo cresce antes do primeiro módulo | Limitar F4 aos fluxos transversais; demonstrar padrões de negócio apenas em F6. | Coordenação técnica |
| Dados ou sessões se perdem em nova imagem | Testar banco persistente, migração explícita, backup/restore e regressão no smoke test de F7. | Infra/CI |

## Validação e acompanhamento

- Abrir um item por fase e itens menores para suas etapas; cada item informa responsável nominal, revisor, dependência, evidência de aceite e estado (`pendente`, `em andamento`, `bloqueado`, `concluído`).
- Atualizar o quadro ao fim de cada ciclo curto de trabalho (sugestão: semanal); anotar bloqueio e próxima ação com dono. Não estimar data de entrega antes de medir F0 e decompor as primeiras etapas.
- Encerrar fase apenas após a revisão dos critérios de saída; registrar no item o link para testes/CI, demonstração e documentos atualizados. Para cada mudança, aplicar a Definition of Done de [development-standards.md](../development-standards.md).
- Medir progresso por fases aceitas e critérios pendentes, não por porcentagem arbitrária de código. Registrar decisão que altere contrato em [architecture.md](../architecture.md) e atualizar documentos afetados na mesma entrega.
- Marcos de verificação: ambiente e pipeline (F0), conta e controle de acesso completos (F1–F4), pacote integrado (F5–F6), entrega Docker e versão pública (F7). Se um critério falhar, permanecer na fase e abrir correção com responsável antes de avançar.

## Evolução posterior: autenticação local e LDAP

A [SPEC-002](../specs/local-ldap-authentication.md) e seu [plano próprio](spec-002-local-ldap-authentication-plan.md) estendem os contratos de F2/F3/F4 sem reescrever seus critérios históricos. E1–E4 estão implementadas e preservam login local, sessão Sanctum e autorização do host; E5 aguarda homologação da CTI. Login federado continua fora do primeiro marco.
