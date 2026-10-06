# Política de compatibilidade entre núcleo e módulos

**Status:** aceita.

## Objetivo

Permitir que módulos sejam instalados e atualizados separadamente, com um critério objetivo para saber se uma combinação funciona.

## Versões independentes

O núcleo e cada módulo possuem versões próprias no formato `MAJOR.MINOR.PATCH` e começam em `1.0.0` quando seus contratos públicos estiverem prontos. A versão de um módulo não acompanha automaticamente a versão do núcleo.

Exemplo: núcleo `1.4.2`, módulo Clientes `2.1.0` e módulo Relatórios `1.3.5` podem coexistir se seus requisitos forem satisfeitos.

## O que é contrato público do núcleo

- Interfaces PHP explicitamente publicadas para módulos.
- APIs de registro de rotas, menus, permissões, listeners e frontend.
- Formato e comportamento do manifesto `module.json`.
- Componentes React, hooks e contextos explicitamente exportados para módulos.
- Tokens e nomes semânticos publicados pelo design system.
- Eventos documentados e seus dados.
- Convenções de API e autenticação das quais os módulos dependem.

Classes internas, estrutura de diretórios privada e detalhes de implementação não são contratos. Um módulo não deve importá-los.

## Regra de versionamento

| Mudança | Versão | Exemplo |
|---|---|---|
| Correção sem alterar contrato | PATCH | Corrigir um bug de autorização |
| Adição compatível | MINOR | Novo hook ou campo opcional no contexto público |
| Quebra de contrato | MAJOR | Remover ou renomear método público; tornar campo obrigatório |

Uma mudança é compatível somente se os módulos que usam o contrato anterior continuarem compilando, instalando e funcionando. Alterações de visual que mudem propriedades públicas ou comportamento esperado dos componentes também podem ser incompatíveis.

## Declaração de compatibilidade

Cada módulo declara no `module.json` a faixa de versões do núcleo que suporta:

```json
{
  "name": "customers",
  "version": "2.1.0",
  "core": "^1.2.0",
  "dependencies": []
}
```

`^1.2.0` significa núcleo a partir de `1.2.0` e anterior a `2.0.0`. O módulo deve declarar como mínimo a primeira versão do núcleo que realmente usa. A faixa não constitui prova de compatibilidade: ela precisa de testes.

Dependências entre módulos usam a mesma regra:

```json
{
  "dependencies": [
    { "name": "catalog", "version": "^2.1.0" }
  ]
}
```

O módulo também declara, em `composer.json`, as faixas compatíveis com PHP `~8.5.0` e Laravel `^13.0`. A versão da API HTTP (`/api/v1`) é independente da versão do núcleo: não se presume que `v1` da API corresponda a `1.x` do núcleo.

Enquanto os contratos estão sendo validados antes da F7, o núcleo reporta uma versão pré-1.0.0 em `modules.core_version` (configurável por `STARTERKIT_VERSION`). A verificação compara a parte numérica e ignora pré-lançamentos, de modo que faixas como `^1.0.0` possam ser exercitadas por módulos antes da publicação estável. Após a validação do módulo de referência e dos critérios de empacotamento da F7, a versão padrão do núcleo é `1.0.0`; deployments podem sobrescrevê-la explicitamente por `STARTERKIT_VERSION`.

## Verificação na instalação e atualização

Antes de instalar, ativar ou atualizar um módulo, o host verifica:

1. Validade do manifesto e versão de seu schema.
2. Versão do núcleo dentro da faixa `core`.
3. Requisitos Composer de PHP, Laravel e outros pacotes.
4. Módulos dependentes presentes em versões compatíveis.
5. Ausência de dependências circulares e identificadores duplicados.
6. Entrada React compilável com as versões compartilhadas pelo host.
7. Migrations e permissões previstas para a atualização.

Falha em qualquer verificação impede a ativação e apresenta o requisito não satisfeito. A instalação não deve prosseguir parcialmente após uma incompatibilidade conhecida.

## Frontend compartilhado

O host escolhe e trava as versões de React, TypeScript, shadcn/ui incorporado e demais dependências JavaScript. Módulos fornecem código-fonte para o build do host e utilizam as dependências e os componentes públicos oferecidos por ele. Não devem incluir uma segunda cópia de React nem importar arquivos internos do design system.

Uma atualização de componente público, hook ou contexto segue o versionamento do núcleo. Uma atualização interna do código shadcn/ui que preserve a API pública pode ocorrer em PATCH ou MINOR, conforme seu efeito observável.

### Navegação agrupada por módulo

`FrontendModule.navigationGroup` foi introduzido de forma aditiva no núcleo `1.1.0`. Módulos que o usam devem declarar mínimo `core: ^1.1.0`; os que preservam menus planos continuam compatíveis com o contrato anterior. A alteração não muda o schema do manifesto. O host mantém a lista plana de navegação e compila novamente os assets quando um módulo é instalado/atualizado. Detalhes: [SPEC-001](specs/module-sidebar-navigation.md).

## Banco de dados e dados existentes

- Migrations publicadas não são editadas; mudanças usam migrations novas.
- Atualizações preservam dados existentes, salvo migração destrutiva explícita e documentada.
- Um módulo não altera tabelas pertencentes a outro módulo sem contrato público apropriado.
- Mudanças de schema incompatíveis exigem sequência de expansão, migração de dados e remoção em versões separadas quando existir implantação sem parada.
- Remover o pacote não apaga dados automaticamente.

## Atualizações incompatíveis

Quando o núcleo lança `2.0.0` com quebra de contrato:

1. Publica guia de migração e identifica contratos afetados.
2. Disponibiliza uma matriz de módulos compatíveis.
3. Atualiza cada módulo afetado e amplia sua faixa `core` somente depois dos testes.
4. O host recusa módulos que aceitam apenas `1.x`.
5. A implantação atualiza núcleo, módulos compatíveis, migrations e assets como uma unidade validada.

Um módulo pode declarar suporte simultâneo a `^1.2.0 || ^2.0.0` se passar na suíte de compatibilidade com ambas as versões.

## Testes de compatibilidade

O CI de cada módulo deve testar:

- A menor versão do núcleo declarada.
- A versão estável mais recente permitida pela faixa declarada.
- PHP 8.5 e Laravel 13 com as dependências resolvidas.
- Compilação da extensão React no host de teste.
- Instalação, migration e API do módulo.
- Autorização e componentes públicos utilizados.

Antes de publicar uma nova versão do núcleo, a suíte deve instalar e testar pelo menos os módulos oficiais mantidos junto ao starter kit. Falhas impedem a publicação ou exigem uma versão maior acompanhada do guia de migração.

## Publicação e lockfiles

- A aplicação host versiona `composer.lock` e o lockfile JavaScript para implantações reproduzíveis.
- Módulos publicados declaram faixas de dependência, evitando travar todo consumidor em uma única versão de patch.
- A versão estável mais recente compatível é avaliada ao criar ou atualizar dependências; produção instala exatamente as versões dos lockfiles validados.
- Versões pré-lançamento não entram automaticamente nas faixas aceitas.

## Exemplo de decisão

| Núcleo | Requisito do módulo | Resultado |
|---|---|---|
| `1.4.2` | `^1.2.0` | Aceito, sujeito aos testes |
| `1.1.9` | `^1.2.0` | Recusado: núcleo antigo |
| `2.0.0` | `^1.2.0` | Recusado: versão maior fora da faixa |
| `2.0.0` | `^1.2.0 \|\| ^2.0.0` | Aceito, sujeito aos testes |

## Evolução especificada: autenticação local e LDAP

A [SPEC-002](specs/local-ldap-authentication.md) é candidata a MINOR por preservar login local legado, sessão e permissões, adicionando campos opcionais e Resources aditivos. A versão candidata ainda não foi publicada. Testes locais de compatibilidade passaram; tornar matrícula ou `provider` obrigatórios no login local seria quebra de contrato.

O gerenciamento pelo core aplica essa política no preflight, antes da instalação Composer, e novamente antes da habilitação. Um pacote incompatível é rejeitado com os motivos no campo `repository` da resposta `422`; consulte [gerenciamento de módulos](module-management.md).
