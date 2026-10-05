# Padrões de desenvolvimento

## Objetivo

Estabelecer regras para manter código previsível, testável e modular.

## Controllers

- Controllers DEVEM ser invocáveis e representar uma única operação.
- Controllers DEVEM permanecer magros.
- Controllers NÃO DEVEM conter regras de negócio, queries, transações ou validação manual.
- Controllers recebem a requisição validada, montam um DTO, chamam uma Action ou Query e retornam um Resource ou resposta sem conteúdo.

Convenção de nomes:

```text
ListCustomersController
ShowCustomerController
StoreCustomerController
UpdateCustomerController
DeleteCustomerController
```

Exemplo:

```php
final class StoreCustomerController
{
    public function __invoke(
        StoreCustomerRequest $request,
        CreateCustomerAction $action,
    ): CustomerResource {
        $customer = $action->execute(
            CreateCustomerData::fromRequest($request),
        );

        return new CustomerResource($customer);
    }
}
```

## Form Requests

- Entradas não triviais DEVEM usar Form Requests.
- `rules()` valida formato e estrutura.
- `authorize()` PODE delegar a uma policy.
- Regras de domínio que dependem do estado do negócio pertencem à Action ou ao domínio.
- `$request->all()` NÃO DEVE ser passado para Actions ou Models.
- Apenas dados explicitamente validados podem atravessar a fronteira HTTP.

## DTOs

- Dados complexos entre camadas DEVEM usar DTOs tipados.
- DTOs DEVERIAM ser imutáveis.
- DTOs NÃO acessam banco, container, sessão ou usuário atual.
- A criação do DTO DEVE deixar explícita a origem e conversão dos dados.
- Arrays genéricos são permitidos apenas em fronteiras que os exijam, como drivers externos.

## Actions

- Uma Action representa um caso de uso e possui uma responsabilidade.
- Actions usam nomes verbais, como `CreateCustomerAction`.
- O método público convencional é `execute()`.
- Actions NÃO dependem de Request, Response, Controller ou API Resource.
- Actions PODEM controlar transações, chamar contratos e publicar eventos.
- Actions NÃO DEVEM se transformar em coleções indiscriminadas de utilitários.

## Services

Services são apropriados quando uma capacidade coesa é usada por múltiplas Actions e não representa uma única operação. O nome DEVE expressar a capacidade fornecida; nomes genéricos como `HelperService` são proibidos.

## Service Container

- Dependências são recebidas por injeção de construtor ou método.
- Interfaces são utilizadas quando existe uma fronteira, múltiplas implementações, integração externa ou necessidade real de substituição.
- Não se cria uma interface para cada classe por padrão.
- Bindings ficam no provider do módulo proprietário.
- Service Locator e chamadas indiscriminadas ao container dentro da regra de negócio são proibidos.

## Models

Models Eloquent PODEM conter:

- Relacionamentos.
- Casts.
- Query scopes.
- Atributos calculados.
- Pequenas invariantes e comportamentos diretamente relacionados à entidade.

Models NÃO DEVEM conter:

- Orquestração de casos de uso.
- Envio direto de e-mail ou notificações.
- Chamadas a APIs externas.
- Dependência de Request ou sessão.
- Consultas complexas de tela ou relatório.

O objetivo é evitar Models gigantes sem transformar o domínio em um conjunto anêmico de propriedades.

## Eventos, listeners e observers

- Eventos de negócio usam nomes no passado: `CustomerCreated`.
- Eventos possuem payload mínimo, explícito e serializável quando enfileirados.
- E-mails, notificações e integrações externas pertencem a listeners.
- Listeners demorados DEVEM usar filas.
- Listeners sujeitos a nova tentativa DEVEM ser idempotentes.
- Observers são reservados para preocupações ligadas ao ciclo de persistência.
- Efeitos essenciais do caso de uso NÃO DEVEM ficar escondidos exclusivamente em observers.
- Eventos que dependam dos dados persistidos DEVEM ser despachados após o commit.

## Queries

Consultas Eloquent, `where`, `join` e filtros NÃO DEVEM aparecer em Controllers.

Use:

| Necessidade | Abstração |
|---|---|
| Filtro simples e reutilizável de um Model | Query Scope |
| Listagem com filtros, ordenação e paginação | Query Object |
| Persistência de agregado ou fonte substituível | Repository |
| Leitura controlada entre módulos | Read Service/Contract |

Repositories NÃO são obrigatórios para todo Model. Encapsular mecanicamente cada chamada Eloquent acrescenta indireção sem necessariamente reduzir acoplamento.

## API Resources

- Models Eloquent nunca são retornados diretamente.
- Entidades usam API Resources.
- Coleções usam Resource Collections.
- Campos seguem allowlist explícita.
- Relacionamentos são incluídos somente quando carregados ou solicitados pelo contrato.
- Senhas, tokens, segredos e atributos internos nunca são serializados.
- O formato segue `api-conventions.md`.

## Métodos e complexidade

Métodos com mais de 20 linhas DEVEM ser revisados, mas a contagem não é uma proibição automática. A extração é indicada quando houver:

- Mais de uma responsabilidade.
- Muitos níveis de condicionais.
- Nomes difíceis de atribuir.
- Blocos que podem ser testados isoladamente.
- Repetição.
- Dependências em excesso.

Divisões artificiais que apenas espalham um fluxo simples entre muitos métodos privados devem ser evitadas.

## Exceções

- Exceções de domínio descrevem falhas esperadas do negócio.
- A camada HTTP converte exceções em respostas padronizadas.
- Mensagens internas, stack traces e detalhes de infraestrutura NÃO são expostos em produção.
- Exceções NÃO são usadas como controle normal de loops ou condicionais simples.

## Datas e tempo

- O relógio DEVERIA ser injetável em regras sensíveis ao tempo.
- Datas de API seguem ISO 8601.
- Persistência utiliza uma referência temporal única definida pela aplicação.
- Conversões para fuso local acontecem nas bordas de apresentação.

## Comentários

Comentários explicam decisões, restrições ou contexto; não repetem o código. Dívidas temporárias DEVEM possuir referência rastreável e condição de remoção.

## Definition of Done

Uma mudança está concluída quando:

- Respeita as fronteiras do módulo.
- Possui autorização backend.
- Valida entrada com Form Request.
- Usa Resource para saída de dados.
- Inclui testes proporcionais ao risco.
- Atualiza documentação e contrato de API quando necessário.
- Não introduz alertas estáticos, falhas de lint ou testes quebrados.
