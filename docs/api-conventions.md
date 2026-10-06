# Convenções da API

## Objetivo

Definir contratos previsíveis entre Laravel, SPA e consumidores futuros.

## Base e versionamento

- Endpoints da aplicação usam o prefixo `/api/v1`.
- O endpoint técnico `/sanctum/csrf-cookie` conserva o caminho do Sanctum; login, logout e recuperação de senha usam `/api/v1/auth/*`.
- Uma mudança incompatível exige nova versão ou período de depreciação documentado.
- A versão faz parte da URL; versionamento por header não é o padrão inicial.

## Formato

- Requisições e respostas usam JSON, exceto downloads e uploads documentados.
- O cliente envia `Accept: application/json`.
- Propriedades JSON usam `camelCase`.
- Identificadores são tratados como opacos pelo frontend.
- Datas e horas seguem ISO 8601.
- Valores monetários são transmitidos como string decimal ou unidade inteira documentada, nunca como número de ponto flutuante.

## Recursos

Resposta de item:

```json
{
  "data": {
    "id": "123",
    "name": "Cliente exemplo",
    "createdAt": "2026-09-21T12:30:00Z"
  }
}
```

Resposta de coleção paginada:

```json
{
  "data": [],
  "links": {
    "first": "https://example.test/api/v1/customers?page=1",
    "last": "https://example.test/api/v1/customers?page=10",
    "prev": null,
    "next": "https://example.test/api/v1/customers?page=2"
  },
  "meta": {
    "currentPage": 1,
    "from": 1,
    "lastPage": 10,
    "perPage": 20,
    "to": 20,
    "total": 197
  }
}
```

API Resources são responsáveis por esse formato. Models Eloquent NÃO são serializados diretamente.

## Métodos e status HTTP

| Operação | Método | Sucesso esperado |
|---|---|---|
| Listar | `GET` | `200` |
| Exibir | `GET` | `200` |
| Criar | `POST` | `201` |
| Substituição parcial | `PATCH` | `200` |
| Substituição completa | `PUT` | `200` |
| Excluir sem corpo | `DELETE` | `204` |
| Ação assíncrona aceita | `POST` | `202` |

Edições comuns usam `PATCH` e enviam apenas os campos alterados. `PUT` é reservado a substituições completas explicitamente documentadas. Em ambos os casos, o endpoint documenta os campos aceitos e a resposta.

## Erros

Formato base:

```json
{
  "error": {
    "code": "CUSTOMER_NOT_FOUND",
    "message": "Cliente não encontrado.",
    "details": null,
    "requestId": "01K..."
  }
}
```

Validação:

```json
{
  "error": {
    "code": "VALIDATION_FAILED",
    "message": "Os dados informados são inválidos.",
    "details": {
      "fields": {
        "email": ["Informe um endereço de e-mail válido."]
      }
    },
    "requestId": "01K..."
  }
}
```

Regras:

- `code` é estável e adequado para decisões do cliente.
- `message` é segura para exibição.
- `details` possui estrutura específica por tipo de erro.
- `requestId` permite correlacionar logs sem expor detalhes internos.
- Stack traces, SQL, caminhos locais e segredos nunca aparecem em produção.
- `X-Request-Id` acompanha respostas da aplicação; o servidor gera um ULID por requisição, independentemente de cabeçalhos fornecidos pelo cliente. Em erros da API, o valor é igual a `error.requestId` e integra o contexto do log de exceções reportáveis.
- `details` é `null` para erros sem dados de campos; `422` usa `details.fields` com mensagens agrupadas pelos nomes recebidos no Form Request.
- Rotas sob `/api/v1` retornam o envelope JSON mesmo quando não há `Accept: application/json` (incluindo `404`); erros inesperados não expõem a mensagem da exceção mesmo com `APP_DEBUG=true`.

## Status de erro

| Status | Uso |
|---|---|
| `400` | Requisição semanticamente inválida fora da validação de campos |
| `401` | Autenticação ausente ou expirada |
| `403` | Autenticado sem autorização |
| `404` | Recurso inexistente ou deliberadamente oculto |
| `409` | Conflito com o estado atual |
| `419` | Sessão ou CSRF expirado |
| `422` | Falha de validação |
| `429` | Limite de requisições excedido |
| `500` | Falha interna não esperada |
| `503` | Serviço temporariamente indisponível |

## Filtros, ordenação e paginação

Convenção inicial:

```text
GET /api/v1/customers
    ?filter[search]=ana
    &filter[status]=active
    &sort=-createdAt,name
    &page=2
    &perPage=20
```

- Filtros permitidos usam allowlist.
- Prefixo `-` indica ordem decrescente.
- `perPage` possui padrão e limite máximo.
- Coleções com paginação por número de página usam `PaginatedResourceCollection` do núcleo para emitir `links` e `meta` em `camelCase`, sem o `meta.links` padrão do Laravel. Cada endpoint define seu próprio limite máximo e allowlist de filtros/ordenação.
- Parâmetros desconhecidos podem ser rejeitados para detectar erros de integração.
- Consultas são implementadas por Query Objects ou scopes, nunca no Controller.

## Relacionamentos e campos

Caso includes sejam suportados:

```text
GET /api/v1/customers/123?include=contacts,address
```

- Includes usam allowlist.
- Profundidade máxima é limitada.
- O Resource inclui apenas relacionamentos carregados.
- Sparse fieldsets só devem ser adicionados se houver necessidade comprovada.

## Idempotência e concorrência

- Operações críticas sujeitas a repetição DEVEM avaliar chave de idempotência.
- Atualizações concorrentes DEVEM possuir estratégia documentada, como versão do registro ou `updatedAt` esperado.
- Retentativas automáticas não são permitidas em operações não idempotentes sem proteção.

## Uploads e downloads

- Tipo, extensão e tamanho são validados no backend.
- Nome fornecido pelo usuário não determina diretamente o caminho persistido.
- Arquivos privados exigem autorização em cada acesso.
- Downloads grandes DEVEM usar streaming ou mecanismo equivalente.

## Documentação

### Primeiro endpoint técnico da F1

`GET /api/v1/system/status` é público e somente leitura; não exige sessão nem permissão. Não recebe corpo. Sem parâmetros retorna `200`:

```json
{"data":{"status":"ok"}}
```

O parâmetro opcional `check=database` verifica a conexão MariaDB antes de retornar `{"data":{"status":"ok","database":"ok"}}`. Outro valor para `check` produz `422 VALIDATION_FAILED` com `details.fields.check`. Caminhos inexistentes produzem `404 NOT_FOUND`; indisponibilidade inesperada do banco produz `500 INTERNAL_ERROR`, sem detalhes internos. Repetir o `GET` não altera dados. Para saúde HTTP independente do banco, continua disponível `/up` fora da API.

As tabelas transversais da F1 (`users`, `password_reset_tokens` e `sessions`) ainda não disponibilizam endpoints públicos de contas; os fluxos de autenticação e autorização começam em F2/F3. `users.password` permite `NULL` para contas antes da definição da primeira senha.

Cada endpoint público DEVE documentar:

- Método e caminho.
- Permissão necessária.
- Parâmetros e corpo.
- Resposta de sucesso.
- Erros esperados.
- Efeitos colaterais.
- Regras de idempotência quando aplicáveis.

### Endpoints administrativos da F3

Os endpoints de administração de usuários, papéis e catálogo de permissões ficam sob `/api/v1/admin`, exigem sessão (`auth:sanctum`) e a permissão correspondente, e seguem os métodos e status desta convenção (`201` na criação, `204` na exclusão sem corpo, `409` em conflito de estado). A lista completa de rotas, permissões, corpos e regras está em [authorization.md](authorization.md#endpoints-administrativos). Erros de autorização usam `401` para visitante e `403` para usuário autenticado sem permissão, no envelope JSON padrão.

Uma especificação OpenAPI DEVERIA ser gerada ou mantida junto da implementação quando a primeira API funcional for criada.

### Evolução especificada da autenticação

A [SPEC-002](specs/local-ldap-authentication.md#contrato-http) implementa `GET /api/v1/auth/options` e login por `registry`/`password`; `provider` omitido assume `auto`, com `local|ldap` ainda disponíveis para clientes explícitos. Matrículas ausentes podem ser provisionadas por um login LDAP válido, sem papéis. Resources da sessão incluem `accountSource`, `registry` e `ldapSyncedAt`; Resources administrativos incluem `accountSource`. `POST /api/v1/auth/sync-profile` recebe `password`, exige sessão, CSRF e conta administrada pelo LDAP, e retorna o perfil atualizado. Conflitos de identidade/e-mail retornam `409 CONFLICT`, sem fusão automática. Dados institucionais protegidos retornam `422` quando alterados manualmente. O corpo legado `{email,password}` deve migrar; e-mail permanece nos fluxos de contato e recuperação. A versão de publicação precisa refletir as mudanças incompatíveis de autenticação/provisionamento, conforme a política de compatibilidade.

## Módulos do core

A administração de módulos usa `/api/v1/admin/modules`, com permissões independentes para listagem, instalação, habilitação, desabilitação e remoção. Consulte o [contrato dos endpoints](module-management.md#api). As mutações são síncronas e retornam `204` somente após as etapas operacionais; incompatibilidades e impedimentos retornam `422` com `details.fields` no envelope padrão.
