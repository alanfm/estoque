# Acompanhamento F4 — SPA e experiência essencial

**Estado:** concluída e aceita em 25/09/2026 após conferência informada pelo usuário. **Responsável pela implementação:** agente OpenCode (Frontend). **Revisor:** usuário (conferência confirmada nesta sessão). **Dependência:** F3 aceita.

| Critério | Estado | Evidência |
|---|---|---|
| Cliente HTTP com cookies/CSRF | validado localmente | `services/api/client.ts` centraliza `credentials: same-origin`, `/sanctum/csrf-cookie`, `X-XSRF-TOKEN`, retentativa única em `419` e normalização do envelope de erro em `ApiError` (`unauthorized`, `forbidden`, `csrf`, `validation`, `throttled`, `notFound`, `conflict`, `server`, `network`). Testes cobrem `422`, `500`, `204`, cabeçalho CSRF e evento de `401`. |
| Sessão e tema com Context + `useReducer` | validado localmente | `stores/session` modela `unknown → loading → authenticated | guest`; `stores/theme` mantém `preference`/`resolved` e persiste a escolha. Reducers testados isoladamente. |
| Router e proteção de rotas | validado localmente | `router/routes.tsx` separa rotas públicas, de autenticação e administrativas; guards usam permissões (`RequireAuth`, `RequireGuest`, `RequirePermission`) e aguardam a resolução da sessão. |
| Tokens e componentes shadcn/ui | validado localmente | `styles/tokens.css` contém os tokens dos dois temas; `styles/globals.css` mapeia para Tailwind 4. Componentes base (Button, Input, Field, Checkbox, Select, Card, Badge, Table, Alert, Spinner, EmptyState, ErrorState, Dialog, ConfirmDialog, DropdownMenu, Tooltip, Pagination, Breadcrumbs) mantidos no projeto sobre Radix UI. |
| Layouts Auth, Public e Admin | validado localmente | `layouts/` seguem `design.md`, incluindo menu lateral 272/72 px persistido, overlay mobile com contenção de foco via Radix Dialog, linha institucional e rodapés com dados oficiais do Campus Sobral. |
| Telas essenciais com React Hook Form | validado localmente | Login, recuperação, definição/redefinição de senha, alteração de senha, usuários (lista/criação/edição) e papéis (lista/criação/edição). Erros `422` são associados aos campos; falha geral usa região de feedback. |
| Erros `403`/`404` distintos | validado localmente | `ForbiddenPage` e `NotFoundPage` separadas; erro inesperado é tratado por `ErrorBoundary` com exibição de `requestId`. E2E cobre as páginas `403` e `404` e a proteção de rota administrativa. |
| Tema sem flash na carga inicial | validado localmente | Script inline em `resources/views/app.blade.php` define `data-theme` antes da primeira pintura; a preferência persistida prevalece. |
| Acessibilidade e responsividade | validado localmente | Primeiro controle focável “Ir para o conteúdo” no AdminLayout, foco movido a cada mudança de rota (`RootRoute`), `aria-current`, labels/erros associados por `aria-describedby`, foco visível em `focus.ring`, menu lateral overlay abaixo de `lg`. Testes de componente verificam rótulos e estados. |
| Testes de componentes e integração | validado localmente | 42 testes Vitest/Testing Library passando (`npm test`). |
| Testes end-to-end | validado localmente | 13 testes Playwright passando dentro do container Sail contra Docker + MariaDB, cobrindo login/logout, sessão após recarregar, credenciais inválidas, recuperação com resposta neutra, alteração de senha com senha atual incorreta, páginas `403`/`404`, proteção de rota e criação/filtro de usuários. |
| Documentação | atualizada | `docs/architecture.md` (ADR-018), `docs/plans/f4-status.md` e este acompanhamento; `docs/README.md` referencia a fase. |

**Evidência reproduzível:** com o stack Sail/MariaDB de desenvolvimento em `http://localhost:8080`, banco migrado e administrador semeado por `core:bootstrap-admin`, executou-se:

```bash
npm run format:check   # All matched files use Prettier code style
npm run lint           # sem avisos
npm run typecheck      # sem erros
npm test               # 42 testes passando
npm run build          # build de produção concluído
./vendor/bin/sail artisan test   # 26 testes backend passando (263 assertions)
```

A suíte E2E foi executada com o mesmo procedimento que o pipeline usa, dentro do container Sail e contra `http://localhost`:

```bash
docker compose exec -T --user root laravel.test npx playwright install --with-deps chromium
docker compose exec -T --user root -e E2E_BASE_URL=http://localhost laravel.test npx playwright test
# 13 testes passando
```

O pipeline local `ci/local.yml` foi estendido para semear o administrador de teste (`E2E_ADMIN_EMAIL`/`E2E_ADMIN_PASSWORD`) e executar esses dois comandos após a suíte backend, sem exigir Node ou navegador na máquina hospedeira. A execução completa do Act ainda precisa ser conferida e por isso não é usada como evidência de aceite nesta entrega.

**Pendências conhecidas:** o bundle inicial da SPA emitido pelo Vite tem aviso de tamanho acima de 500 kB; o orçamento e o code splitting das páginas administrativas serão definidos após medir o build com o módulo de referência (F6/F7, conforme `frontend-architecture.md`).

**Aceite:** a conferência foi comunicada pelo usuário após a revisão do layout de autenticação contra `docs/prototypes/auth.html`, autorizando o avanço para a F5.
