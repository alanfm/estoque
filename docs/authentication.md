# Autenticação

## Objetivo

Fornecer autenticação first-party segura para a SPA e fluxos completos de recuperação e alteração de senha.

## Estratégia

A SPA utiliza autenticação baseada em sessão e cookies, com proteção CSRF. Tokens persistidos em `localStorage` ou `sessionStorage` NÃO são usados para a interface first-party.

Premissas:

- SPA e API usam a mesma origem; a API da aplicação ocupa `/api/v1`.
- Cookies seguros são usados em produção.
- O cliente envia credenciais e cabeçalhos CSRF nas requisições aplicáveis.
- Rotas protegidas utilizam o middleware de autenticação adequado.

Tokens pessoais para clientes externos, caso adicionados no futuro, constituem um fluxo separado.

## Provisionamento de contas

Não existe cadastro público local nem rota de autorregistro. No modo LDAP, um bind válido e a leitura do perfil institucional permitem provisionar automaticamente uma matrícula ainda ausente da base local, sem papéis, conforme a ADR-024 e a SPEC-002.

O primeiro administrador é criado por um comando administrativo executado no ambiente da aplicação. O comando solicita os dados necessários de forma segura, não distribui credenciais padrão e não deve criar um segundo administrador inicial silenciosamente.

Depois, um administrador autorizado cria a conta de outro usuário informando nome, matrícula, e-mail de contato e papéis iniciais. A matrícula identifica a conta no login local e institucional; o e-mail é usado para comunicação e recuperação de senha, não como identificador de login. O usuário recebe por e-mail um link de uso único e com prazo de validade para definir a própria senha. Senhas temporárias não são enviadas por e-mail. A conta não pode ser usada para login local antes da definição da senha. O link usa o mesmo cuidado de armazenamento, expiração e não exposição em logs aplicado à recuperação de senha.

A definição inicial de senha reutiliza o fluxo de token e o endpoint `/api/v1/auth/reset-password`, com uma página própria na SPA se for necessário diferenciar a mensagem apresentada ao usuário.

O fluxo de convite com aceite e etapas adicionais pode ser criado posteriormente, mas não faz parte do primeiro marco.

## Fluxos obrigatórios

### Login

Campos:

- Matrícula.
- Senha.
- Link para recuperação de senha.

Fluxo:

1. SPA solicita o cookie CSRF.
2. SPA envia matrícula e senha; `provider` omitido ou `auto` resolve a origem no servidor.
3. Backend limita tentativas e valida a senha local de contas existentes, ou consulta LDAP para contas institucionais e matrículas ausentes no modo LDAP. Um perfil institucional válido cria uma conta sem papéis e sem senha local.
4. Backend regenera a sessão.
5. SPA solicita o usuário atual e suas permissões.
6. SPA redireciona ao destino originalmente solicitado ou ao dashboard.

Mensagens de falha NÃO DEVEM permitir enumeração de contas.

O primeiro marco não oferece a opção “lembrar-me”. A sessão segue a política de expiração configurada no backend.

### Solicitação de recuperação

Campo:

- E-mail.

O backend responde com mensagem neutra independentemente da existência da conta. O token deve possuir expiração, ser de uso único e nunca aparecer em logs.

### Redefinição de senha

Campos:

- E-mail.
- Token.
- Nova senha.
- Confirmação da nova senha.

Após sucesso, o token é invalidado e todas as sessões anteriores do usuário são encerradas. O usuário precisa entrar novamente. A implementação deve invalidar também qualquer mecanismo de acesso persistente que venha a ser adicionado.

### Alteração autenticada

Campos:

- Senha atual.
- Nova senha.
- Confirmação da nova senha.

A operação exige sessão autenticada, confirmação da senha atual e limitação de tentativas.

### Logout

O backend invalida a sessão atual e regenera o token CSRF quando aplicável. A SPA limpa apenas estado derivado local; não deve haver token de autenticação persistido.

## Endpoints iniciais

```text
GET    /sanctum/csrf-cookie
POST   /api/v1/auth/login
POST   /api/v1/auth/logout
POST   /api/v1/auth/forgot-password
POST   /api/v1/auth/reset-password
GET    /api/v1/auth/user
PUT    /api/v1/auth/password
POST   /api/v1/auth/sync-profile
```

`/sanctum/csrf-cookie` é uma rota técnica fornecida pelo Sanctum. As demais rotas de autenticação são endpoints da aplicação e devem manter os caminhos acima mesmo se a implementação utilizar um pacote headless. Elas devem preservar autenticação de sessão e proteção CSRF.

### Contrato implementado na F2

Todas as rotas de `/api/v1/auth/*` usam o grupo de middleware `web` (cookies, sessão e CSRF) e respondem no envelope de erro de [api-conventions.md](api-conventions.md). Depois de qualquer alteração de estado que regenere a sessão (login, logout e redefinição), a SPA deve reler o cookie `XSRF-TOKEN` antes da próxima escrita. A sessão é armazenada na tabela `sessions` (`SESSION_DRIVER=database`).

| Endpoint | Corpo (JSON) | Sucesso | Erros esperados |
|---|---|---|---|
| `POST /api/v1/auth/login` | `registry`, `password` | `200` com `data` do usuário atual | `422` credenciais inválidas, `419` CSRF, `429` limite |
| `POST /api/v1/auth/logout` | vazio | `204` | `401` sem sessão, `419` CSRF |
| `GET /api/v1/auth/user` | — | `200` com `data` do usuário atual | `401` sem sessão |
| `POST /api/v1/auth/forgot-password` | `email` | `202` sempre neutro | `422` e-mail inválido, `429` limite |
| `POST /api/v1/auth/reset-password` | `email`, `token`, `password`, `passwordConfirmation` | `204` | `422` token inválido/expirado/reutilizado ou senha fraca |
| `PUT /api/v1/auth/password` | `currentPassword`, `password`, `passwordConfirmation` | `204` | `401` sem sessão, `422` senha atual inválida ou nova senha fraca, `429` limite |

Regras aplicadas: o login local consulta a matrícula normalizada e regenera o identificador da sessão; e-mail é reservado a comunicação e recuperação de senha. O logout invalida a sessão e o token CSRF; a redefinição e a alteração de senha invalidam as demais sessões (a alteração preserva a sessão corrente); contas com `password` nulo não autenticam localmente e recebem o link de definição inicial pelo mesmo fluxo de recuperação. A política de senha exige no mínimo 12 caracteres. O login e os endpoints de recuperação usam limite de 5 tentativas por minuto por rota e IP. O link enviado aponta para `/reset-password?token=...&email=...` na mesma origem.

O comando `php artisan core:bootstrap-admin {registry} {name} {email}` cria o primeiro administrador de forma idempotente, pede a senha de forma interativa (nunca em argumento ou log) e recusa a criação quando já existe administrador inicial ou há usuários sem administrador. `registry` é o identificador de login; `email` é o contato para recuperação e comunicação.

## Usuário atual

`GET /api/v1/auth/user` retorna somente dados necessários para inicializar a sessão frontend:

```json
{
  "data": {
    "id": 1,
    "name": "Administrador",
    "registry": "0012345",
    "email": "admin@example.com",
    "roles": ["admin"],
    "permissions": [
      "customers.viewAny",
      "customers.create"
    ]
  }
}
```

Desde a F3, `permissions` traz as permissões efetivas do usuário (as permissões de seus papéis, excluindo as obsoletas); o superadministrador recebe o catálogo completo. As APIs que administram usuários, papéis e vínculos estão em [authorization.md](authorization.md).

## Estados do frontend

A store de autenticação representa explicitamente:

```text
unknown → loading → authenticated
                  └→ guest
```

Rotas protegidas NÃO DEVEM decidir antes da resolução do estado inicial.

Tratamento esperado:

- `401`: sessão ausente ou expirada; redirecionar ao login.
- `419`: sessão ou CSRF expirado; renovar o fluxo de sessão e solicitar nova autenticação quando necessário.
- `403`: autenticado, mas sem autorização; exibir página de acesso negado.
- `422`: exibir erros de validação junto aos campos.
- `429`: informar limitação temporária de tentativas.

## Política de senha

A política concreta deve ser configurável e aplicada no backend. Ela DEVE:

- Impor comprimento mínimo adequado.
- Bloquear senhas conhecidas como comprometidas quando a infraestrutura permitir.
- Evitar regras arbitrárias que incentivem padrões previsíveis.
- Permitir gerenciadores de senha e colagem nos campos.
- Nunca registrar ou expor a senha.

## Segurança

- Login, recuperação e alteração de senha possuem rate limit.
- A sessão é regenerada após autenticação.
- Cookies de produção usam `Secure`, `HttpOnly` quando aplicável e política `SameSite` compatível com a topologia.
- CORS permite apenas origens confiáveis.
- URLs e logs NÃO contêm credenciais ou tokens.
- Respostas de recuperação não revelam se o e-mail está cadastrado.
- Criação de usuários exige autorização administrativa; não existe endpoint de cadastro público.
- A definição inicial e a redefinição de senha usam links de uso único, com expiração e sem exposição em logs.
- Ações sensíveis PODEM exigir confirmação recente da senha.
- Eventos de segurança relevantes são auditáveis sem armazenar segredos.

## Extensões futuras

Os seguintes recursos não fazem parte do primeiro marco, mas a arquitetura não deve impedi-los:

- Verificação de e-mail.
- Autenticação de dois fatores.
- Passkeys.
- Gerenciamento de sessões ativas.
- Login federado.
- Tokens pessoais para integrações.

## Testes mínimos

- Login válido e inválido.
- Comando de criação do primeiro administrador sem credencial padrão ou duplicação silenciosa.
- Criação administrativa de usuário e definição inicial de senha por link.
- Tentativa de cadastro público não disponível e criação administrativa negada sem permissão.
- Rate limit do login.
- Regeneração de sessão.
- Acesso autenticado e não autenticado.
- Solicitação de recuperação sem enumeração de usuário.
- Token de redefinição válido, inválido, expirado e reutilizado.
- Redefinição invalida sessões anteriores e exige novo login.
- Alteração com senha atual correta e incorreta.
- Logout e invalidação da sessão.
- Respostas `401`, `403`, `419`, `422` e `429` na SPA.

## Evolução especificada: autenticação local e LDAP

A [SPEC-002](specs/local-ldap-authentication.md), registrada nas ADR-023 e ADR-024, define autenticação institucional por matrícula, provisionamento após bind e leitura do perfil, bloqueio de edição manual dos dados importados e sincronização autenticada no perfil. O formulário unificado usa resolução automática; `provider=local|ldap` permanece disponível para clientes explícitos. O objeto da sessão inclui `registry`, `accountSource` e `ldapSyncedAt`.

A implementação conserva mesma origem, cookies/CSRF, provisionamento administrativo e permissões locais; adiciona origens habilitadas por conta, fallback local autorizado, opções públicas de login, metadados da sessão e recuperação restrita às contas com acesso local. Contas somente LDAP não recebem link de definição local; LDAP não é login federado por redirecionamento. O [plano](plans/spec-002-local-ldap-authentication-plan.md) registra a homologação externa pendente.
