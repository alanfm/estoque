# Estratégia de testes

## Objetivo

Verificar regras de negócio, contratos HTTP, isolamento modular, segurança e experiência crítica da SPA com testes proporcionais ao risco.

## Pirâmide

```text
             End-to-end
          Integração/Feature
             Unitários
```

Testes end-to-end são poucos e cobrem jornadas críticas. A maior parte das regras deve ser verificada em testes unitários e de integração rápidos.

## Backend

### Unitários

Cobrem:

- DTOs e conversões.
- Regras de domínio.
- Actions sem infraestrutura real quando apropriado.
- Policies.
- Serviços puros.
- Casos-limite de datas e valores.

### Feature/API

Cobrem:

- Rotas e middleware.
- Form Requests.
- Autenticação e autorização.
- Formato de Resources.
- Códigos de status.
- Paginação, filtros e ordenação.
- Tratamento padronizado de erros.

### Integração

Cobrem:

- Queries reais no MariaDB.
- Migrations e constraints.
- Repositories.
- Filas, cache e integrações adaptadas.
- Compatibilidade entre módulo e núcleo.

Consultas que dependem de comportamento específico do MariaDB NÃO devem ser validadas apenas com SQLite.

No desenvolvimento, executar os testes do núcleo e dos módulos pelo ambiente Laravel Sail com serviço MariaDB de teste isolado do banco de desenvolvimento. O CI deve usar a mesma plataforma em containers; na validação da entrega, executar smoke tests contra a imagem Docker da aplicação sem Sail. Ver [environment.md](environment.md).

## Frontend

### Unitários

- Formatação e funções puras.
- Stores e reducers.
- Helpers de autorização.
- Normalização de erros.

### Componentes

- Interação por teclado e mouse.
- Estados visualmente relevantes.
- Labels e nomes acessíveis.
- Emissão de eventos.
- Tratamento de loading, erro e vazio.

### Integração de páginas

- Carregamento e submissão de dados.
- Mapeamento de erros `422`.
- Filtros sincronizados com URL.
- Renderização conforme permissões.
- Comportamento diante de `401`, `403` e `419`.

### End-to-end

Jornadas mínimas:

- Login e logout.
- Recuperação e redefinição de senha.
- Provisionamento do primeiro administrador e criação administrativa de usuários.
- Definição inicial de senha por link de uso único.
- Invalidação das sessões anteriores após redefinição de senha.
- Alteração de senha.
- Navegação autorizada e negada.
- CRUD do módulo de referência.
- Tratamento de sessão expirada.

## Testes de contrato dos módulos

Todo módulo DEVE passar por uma suíte fornecida pelo núcleo que valida:

- `module.json` contra o schema.
- Identificador e namespace únicos.
- Compatibilidade declarada.
- Dependências existentes e sem ciclos.
- Registro do Service Provider.
- Rotas sob o prefixo permitido.
- Permissões declaradas.
- Migrations descobertas.
- Entrada frontend válida.
- Ausência de importações internas proibidas quando verificável.

O núcleo fornece o diagnóstico não interativo `core:modules:diagnose` (com `--json`) e o seu próprio teste de contrato, que exercita um módulo de amostra em `tests/Fixtures/Modules`: descoberta, provider, rota, migration, permissão, ciclo de dependências, habilitação/desabilitação e compilação da página pelo bundler do host.

## Autenticação e segurança

Cobertura mínima:

- Credenciais válidas e inválidas.
- Rate limiting.
- Regeneração e encerramento de sessão.
- Proteção CSRF.
- Recuperação sem enumeração de contas.
- Expiração e uso único de token.
- Acesso não autenticado, não autorizado e autorizado.
- Campos sensíveis ausentes nas respostas.
- Upload inválido quando aplicável.

## Banco de dados

- Factories criam dados válidos e mínimos.
- Cada teste controla seus dados e não depende da ordem de execução.
- Migrations são testadas em banco limpo.
- Índices e restrições importantes têm testes de integração ou inspeção automatizada.
- Rollback de migrations distribuídas deve ser seguro quando oferecido.

## Filas e eventos

- Testar o evento publicado pelo caso de uso.
- Testar listeners separadamente.
- Testar idempotência em listeners com retentativa.
- Testar comportamento depois de commit quando relevante.
- Não substituir todos os testes por simples asserts de que um job foi despachado.

## Qualidade não funcional

O pipeline DEVE executar:

- Formatação.
- Análise estática.
- Lint frontend.
- Verificação de tipos.
- Testes backend.
- Testes frontend.
- Build de produção.
- Validação de manifestos.

Análises adicionais recomendadas:

- Auditoria de dependências.
- Verificação de secrets.
- Teste básico de acessibilidade.
- Limites de bundle e performance.

## Cobertura

Cobertura percentual é um indicador, não o objetivo. Os critérios principais são:

- Casos de uso críticos cobertos.
- Falhas e limites relevantes cobertos.
- Autorização coberta por operação.
- Contratos públicos protegidos contra regressão.

Uma meta percentual pode ser definida posteriormente, sem permitir testes vazios criados apenas para aumentar o número.

## Organização

```text
tests/
├── Architecture/
├── Feature/
├── Integration/
└── Unit/

modules/vendor/name/tests/
├── Feature/
├── Integration/
└── Unit/
```

Testes seguem a localização da funcionalidade proprietária.

## Critério para correção de bugs

Toda correção DEVERIA incluir um teste que falha antes da correção e passa depois, salvo quando tecnicamente inviável. A exceção deve ser justificada na revisão.

## Evolução especificada: autenticação LDAP

A [SPEC-002](specs/local-ldap-authentication.md#critérios-de-aceite) e seu [plano](plans/spec-002-local-ldap-authentication-plan.md) definem a matriz de testes para acesso local, LDAP e fallback autorizado, recuperação por origem, proteção administrativa e indisponibilidade. Os testes usam conexão simulada; CI não depende do AD de produção nem usa credenciais reais. A homologação IFCE com TLS/CA segue pendente com a CTI.
