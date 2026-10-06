# Core 1.1.0 — contrato HTTP público para módulos

**Estado:** contrato implementado e verificado localmente; não representa publicação de release/tag.

**Escopo:** extensões do host estoque; este documento não garante que todos os exports abaixo existam no Starterkit upstream 1.1.0. O pacote Inventory instalável usa somente os exports upstream existentes e mantém seu transporte HTTP, tipos e componentes adicionais em `resources/spa/support`, sem modificar o host de destino.

Frontends de módulos importam a superfície de host exclusivamente de `@starterkit/module-kit`. Não importam caminhos internos de `resources/spa`.

## Exports

- Funções: `apiRequest<T>(path, options)` para JSON e `apiDownload(path, options)` para `Blob`.
- Erros: `ApiError` e `ApiErrorKind`, com status, código, mensagem, detalhes, `requestId`, tipo e `fieldErrors()`.
- Opções: `ApiRequestOptions` e `QueryValue`; aceitam método, query, `AbortSignal`, headers adicionais e corpo JSON ou `FormData`.
- Tipos JSON: `ApiResource<T>`, `Paginated<T>`, metadados/links de paginação, `ListQuery`, `ApiErrorBody` e tipos de validação.
- Permanecem também disponíveis os exports de tipos de módulo, componentes visuais e `useSession` existentes.
- `FormModal` padroniza formulários em modais associados a rotas: recebe `title`, `description` opcional, `returnTo`, `children`, `background` opcional e `backgroundPermission` opcional. A listagem de fundo só é montada quando autorizada; X, Esc e Fechar navegam para `returnTo`. Clique fora não descarta o formulário. `useDocumentTitle` também está disponível para páginas de módulos.
- Listagens usam os mesmos primitivos da página de usuários: `Table`, `TableWrapper`, `TableHeader`, `TableBody`, `TableRow`, `TableHead`, `TableCell`, `Badge`, `Pagination`, `SimpleTooltip`, `EmptyState`, `ErrorState` e `Spinner`. `Select`, `useAsync` e `can` também fazem parte da superfície pública.

## Sessão, headers e corpo

O cliente usa caminhos relativos sob `/api/v1`, `credentials: "same-origin"`, `Accept: application/json`, cookie CSRF Sanctum e `X-XSRF-TOKEN` em escritas. O cliente controla `Accept`, `Authorization`, `Content-Type`, `Cookie`, `X-CSRF-TOKEN` e `X-XSRF-TOKEN`; tentar fornecê-los em `headers` rejeita a chamada. Outros headers, incluindo `Idempotency-Key`, são preservados.

Corpos não-`FormData` são serializados como JSON com `Content-Type: application/json`. Para `FormData`, o cliente não define `Content-Type`; o browser gera o boundary multipart. `apiDownload` compartilha autenticação, CSRF e tratamento do envelope JSON de erro.

## Retry e idempotência

Uma resposta 419 pode atualizar o cookie CSRF e repetir no máximo uma vez. GET pode repetir por ser leitura. Uma escrita só repete quando `Idempotency-Key` está presente e não vazio; chave e corpo são mantidos exatamente na tentativa. Escritas sem essa proteção retornam `ApiError` sem retry automático. O servidor deve validar e persistir a chave de idempotência para garantir efeito único.

401 e 419 mantêm os eventos de sessão do host; respostas de erro preservam o envelope público e o `requestId`.

## Compatibilidade

O core declara a extensão como incremento MINOR para `1.1.0`. Um módulo que use esses novos exports declara `core: ^1.1.0`; Inventory é o consumidor instalado no estoque; o exemplo Customers do upstream foi removido desta aplicação. O número local não publica release nem cria tag.
