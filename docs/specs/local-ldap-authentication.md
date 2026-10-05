# SPEC-002 — Autenticação local e LDAP do IFCE

**Status:** implementação atualizada; homologação institucional pendente.
**Data:** 2026-10-02.
**Decisões:** ADR-023 e [ADR-024](../architecture.md#adr-024--provisionamento-ldap-no-primeiro-login-e-perfil-institucional).
**Plano:** [Implementação da SPEC-002](../plans/spec-002-local-ldap-authentication-plan.md).

## Objetivo e escopo

Receber matrícula e senha em um formulário único. Contas locais existentes validam senha local; contas institucionais validam a senha pelo AD do IFCE. Com LDAP habilitado, uma matrícula ausente da base local pode autenticar e criar sua conta após leitura do perfil no diretório. A integração pertence a `app/Core/Auth` e mantém sessão Sanctum, CSRF, mesma origem, IDs locais e autorização no MariaDB.

A conta importada é marcada como administrada pelo LDAP, sem senha local, papéis ou permissões. A autenticação dá acesso ao perfil e às páginas que exigem apenas sessão; funcionalidades de negócio continuam exigindo suas permissões. Não há cadastro público local, sincronização de grupos, importação em lote, escrita no diretório ou SSO por redirecionamento. O primeiro administrador e o último administrador de contingência continuam locais.

Esta revisão substitui a exigência anterior de usuário previamente provisionado para login LDAP. O skeleton do IFCE Sobral foi usado como referência histórica na revisão `e7d8b8331fc0cb2902ab51b24be5f5d55cc87108`. O Starter Kit usa a extensão PHP LDAP nativa, sem dependência Composer.

## Configuração e disponibilidade

`AUTH_MODE=local` oferece somente contas locais; `AUTH_MODE=ldap` habilita consulta e provisionamento institucionais. Ler variáveis em `config/*`; valores desconhecidos devem falhar na validação de configuração.

| Variável | Regra |
|---|---|
| `AUTH_MODE` | `local` ou `ldap`; padrão `local` |
| `LDAP_DEFAULT_HOSTS` | host aprovado pela CTI; referência `ad.ifce.edu.br` |
| `LDAP_UPN_SUFFIX` | sufixo fixo por ambiente; referência `ad.ifce.edu.br` |
| `LDAP_DEFAULT_PORT` | 636 para LDAPS ou 389 para LDAP/StartTLS |
| `LDAP_DEFAULT_SSL` / `LDAP_DEFAULT_TLS` | SSL para LDAPS, TLS para StartTLS; ambos falsos para LDAP sem criptografia; nunca ambos verdadeiros |
| `LDAP_DEFAULT_TIMEOUT` | inteiro positivo; padrão 5 segundos, máximo 10 |
| `LDAP_DEFAULT_BASE_DN` | obrigatório para leitura do perfil; restringe as contas elegíveis ao escopo aprovado pela CTI |
| `LDAP_DEFAULT_USERNAME` / `LDAP_DEFAULT_PASSWORD` | não exigidos para bind/leitura com a própria conta autenticada |
| `LDAP_PASSWORD_HELP_URL` | URL HTTPS aprovada pela CTI; sem confirmação, exibir orientação textual |

As imagens precisam da extensão LDAP e, quando SSL/StartTLS estiver habilitado, da CA institucional. Validar o transporte configurado, hostname, DNS, rede/VPN, timeout e permissão de leitura dos atributos. LDAP sem criptografia transmite a senha pela conexão e exige uma rede confiável. Desabilitar referrals na conexão; nunca seguir outro diretório nem aceitar host, DN ou domínio do cliente. Readiness HTTP não depende do AD. Falhas operacionais abrem circuito de 30 segundos e retornam `503`; nenhuma conta é criada nessas falhas.

## Contas e identidade

Migrations novas preservam dados e migrations históricas:

| Campo interno em `users` | Regra |
|---|---|
| `registry` | string até 64 caracteres, única; nullable para migração das contas existentes |
| `ldap_enabled` | boolean, padrão false |
| `local_auth_enabled` | boolean, padrão true |
| `ldap_managed` | boolean, padrão false; true nas contas importadas no login |
| `ldap_object_id` | representação hexadecimal do `objectGUID` do AD, 32 caracteres, única e nullable |
| `ldap_synced_at` | instante da importação ou última sincronização bem-sucedida |

Matrícula é obrigatória no cadastro administrativo e no login; preserva zeros iniciais e aceita somente letras ASCII, dígitos, ponto, hífen e sublinhado. Remover espaços externos e normalizar letras para minúsculas na administração, consulta, bind e rate limit. Não aceitar domínio, controles ou espaços internos. Contas antigas sem matrícula precisam de revisão administrativa antes de novo login; não inferir matrícula por e-mail.

O perfil LDAP lê `displayName` (ou `cn`), `mail`, `sAMAccountName` e `objectGUID`. Exigir uma única entrada no base DN, encontrada por UPN escapado, com matrícula correspondente, nome não vazio, e-mail válido e GUID de 16 bytes. Nome/e-mail devem caber nas colunas existentes. Perfil incompleto ou fora do escopo não cria usuário.

O GUID estável evita autenticar outra identidade após reuso da matrícula. Conflitos de e-mail, matrícula ou GUID nunca fundem contas nem transferem papéis. Duas tentativas concorrentes da mesma identidade podem reutilizar a conta criada pela primeira; qualquer identidade divergente deve falhar.

Contas importadas têm `ldap_enabled=true`, `local_auth_enabled=false`, `password=NULL` e nenhum vínculo de papel. Contas administrativas previamente vinculadas ao LDAP continuam permitindo acesso local/fallback quando expressamente autorizado; não são convertidas silenciosamente em contas administradas pelo diretório.

## Fluxo de autenticação

1. SPA lê opções públicas, obtém cookie CSRF e envia matrícula/senha.
2. Backend normaliza matrícula e aplica o limite por rota/IP e 5 tentativas por minuto por matrícula/IP, com identificador hash na chave.
3. Em `provider=auto`, a conta existente define a origem: local usa senha local; conta institucional usa LDAP. Matrícula ausente usa LDAP somente quando `AUTH_MODE=ldap`.
4. Conta local com senha inválida nunca dispara consulta LDAP automática; contas desabilitadas não são reprovisionadas.
5. LDAP faz bind com matrícula e sufixo configurado. Senha vazia nunca chega ao bind. Conta importada ou matrícula ausente exige leitura/validação do perfil; contas importadas existentes precisam conservar o mesmo GUID.
6. Após bind e perfil válidos, matrícula ausente cria a conta local sem senha, papéis ou permissões. Não vincular automaticamente conta local com mesmo e-mail.
7. Contas previamente vinculadas com acesso local podem usar fallback autorizado. Contas administradas pelo LDAP não têm fallback.
8. Backend autentica o ID local, regenera a sessão e retorna Resource. Encerrar conexão LDAP sempre. Nenhuma senha é armazenada na conta, sessão, cache ou logs.

Mudanças no AD não revogam sessões do host imediatamente. Logout, expiração e invalidadores locais mantêm suas regras. A origem efetiva da sessão é `local` ou `ldap`, nunca `auto`.

## Contrato HTTP

Campos JSON usam camelCase. Endpoints permanecem sob `/api/v1`, com middleware web, sessão e CSRF nas escritas.

### Opções e login

`GET /api/v1/auth/options` retorna `localEnabled`, `ldapEnabled`, `ldapLabel` e `ldapPasswordHelpUrl`, sem informações de conta/rede e com `Cache-Control: no-store`.

`POST /api/v1/auth/login` recebe:

```json
{"registry":"0012345","password":"..."}
```

`provider` é opcional e assume `auto`; aceita também `local|ldap` para clientes explícitos. Ambas as origens usam matrícula. O corpo legado `{email,password}` deve migrar. Sucesso é `200` com `data` do usuário atual.

| Situação | Resposta |
|---|---|
| Credenciais inválidas, perfil incompleto/fora do escopo, origem negada | `422 VALIDATION_FAILED`, mensagem genérica em `registry` |
| Entrada inválida ou origem LDAP desabilitada | `422`, campo correspondente |
| Falha operacional LDAP sem fallback autorizado | `503 AUTH_PROVIDER_UNAVAILABLE`, detalhes sanitizados, `Retry-After` |
| Conflito ao vincular identidade/e-mail | `409 CONFLICT`; sem fusão ou divulgação de outra conta |
| CSRF expirado | `419` |
| Limite excedido | `429` com `Retry-After` |

### Sessão e senha

Login e `GET /api/v1/auth/user` retornam, além de nome/e-mail/papéis/permissões:

```json
{"registry":"0012345","accountSource":"ldap","ldapSyncedAt":"2026-10-02T12:00:00.000000Z","authentication":{"provider":"ldap","canChangeLocalPassword":false}}
```

`accountSource` identifica a administração dos dados (`local|ldap`), separadamente da origem efetiva da sessão. GUID e infraestrutura LDAP não são expostos. `forgot-password` permanece por e-mail e com `202` neutro; contas somente LDAP não recebem links locais. Reset e alteração de senha não permitem definir hash para essas contas; alteração retorna `403 LOCAL_PASSWORD_DISABLED`.

### Sincronização do perfil

`POST /api/v1/auth/sync-profile`, autenticado, com CSRF e limite por rota/IP, recebe `{"password":"..."}`. Apenas a própria conta administrada pelo LDAP e com acesso LDAP habilitado pode usar essa operação. A senha é solicitada novamente porque não fica armazenada.

O servidor faz novo bind/leitura e confirma o GUID existente; atualiza somente nome, e-mail e instante de sincronização. Matrícula, ID, origens, senha, papéis e permissões são preservados. Sucesso retorna `200` com Resource atualizado. Senha/perfil inválido retorna `422`; conta local retorna `403`; conflito de e-mail/identidade retorna `409`; indisponibilidade retorna `503`. Nenhuma falha deixa atualização parcial.

### Administração e SPA

Criação local exige `name`, `registry`, `email`; origens e papéis usam as permissões atuais. Resources administrativos incluem `accountSource`. Em contas importadas, o backend rejeita mudanças manuais de nome, e-mail, matrícula e origens com `422`. Papéis permanecem editáveis por administradores autorizados; o AD não atribui autorização. Não permitir alteração de `ldap_managed` ou GUID via entrada administrativa.

A tela de login é única, com matrícula/senha e ajuda para recuperação local/institucional. A página `/profile` existe para qualquer usuário autenticado, mesmo sem permissões, mostra dados institucionais somente para leitura e oferece sincronização mediante senha institucional. Administração bloqueia os campos correspondentes das contas importadas. Nenhuma credencial é persistida no navegador.

## Segurança, operação e compatibilidade

Auditar login, origem efetiva, fallback e sincronização por ID local/requestId, sem senha, GUID, payload LDAP, DN ou exceções brutas. Não marcar e-mail verificado nem importar privilégios a partir do diretório. Preparar o transporte LDAP e a base DN com a CTI antes de habilitar provisionamento.

Aplicar as migrations antes de servir a versão nova. Preservar administrador local de contingência. Desabilitar LDAP impede novos logins institucionais e sincronização, sem converter contas nem apagar dados. As suites usam doubles; CI não acessa o AD real.

O novo default `auto`, o provisionamento no login e a proteção dos dados alteram comportamento público e exigem revisão de versão conforme a política de compatibilidade; não classificar como mudança apenas aditiva. Nenhum contrato de módulo, exports ou permissão muda.

## Critérios de aceite

- Login local por matrícula não consulta LDAP, inclusive após senha incorreta.
- Matrícula ausente com bind/perfil válidos cria uma única conta sem papéis, senha local ou permissões.
- Falha, indisponibilidade, perfil inválido e colisões não criam/fundem contas.
- Contas importadas retornam origem dos dados, conservam GUID e não têm fallback/recuperação local.
- Edição manual dos dados institucionais é negada pelo backend; papéis continuam administráveis.
- Sincronização exige sessão e nova senha institucional, conserva identidade/papéis e não atualiza parcialmente em falhas.
- Sessão, CSRF, limites e mensagens sanitizadas conservam seus contratos.
- Homologação CTI confirma UPN, atributos, escopo, GUID, transporte e CA quando aplicável, permissão de leitura e rede antes da ativação em produção.
