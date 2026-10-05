# Documentação do estoque e da base Starter Kit

As decisões do almoxarifado estão na [especificação do inventário](specs/especificacao-modulo-almoxarifado.md), no [contrato HTTP público](contracts/core-1.1-module-http-client.md) e no [acompanhamento do estoque](plans/inventory-status.md). Esses documentos prevalecem para o módulo. Os estados F0–F7 e SPEC abaixo registram a referência upstream; não constituem aceite ou implantação do estoque.

Este diretório define o contrato arquitetural, visual e operacional para aplicações Laravel modulares com frontend SPA e banco de dados MariaDB. [F0](plans/f0-status.md), [F1](plans/f1-status.md), [F2](plans/f2-status.md), [F3](plans/f3-status.md), [F4](plans/f4-status.md), [F5](plans/f5-status.md), [F6](plans/f6-status.md) e [F7](plans/f7-status.md) foram aceitas.

## Decisões já estabelecidas

- Laravel 13 atua como backend HTTP e API JSON, com PHP 8.5.
- O frontend é uma SPA em React e TypeScript.
- Os componentes visuais partem de shadcn/ui e são mantidos pelo núcleo como código do projeto.
- A identidade visual toma como referência o portal do Campus Sobral do IFCE: tipografia Inter, paleta institucional verde, superfícies claras, bordas suaves e títulos fortes.
- O tema claro é o padrão; o tema escuro é suportado e a preferência explícita do usuário é persistida localmente.
- Estado global compartilhado usa React Context e `useReducer`.
- Formulários usam React Hook Form.
- O banco de dados é MariaDB.
- O sistema roda em Docker; o desenvolvimento do núcleo e dos módulos usa Laravel Sail.
- A aplicação não possui multiempresa ou multitenancy.
- A autenticação da SPA é baseada em sessão e cookies.
- Não há cadastro público local: o primeiro administrador é criado por comando, e contas locais são criadas por administradores com definição de senha por link enviado por e-mail. Um primeiro login LDAP válido pode provisionar uma conta institucional sem papéis; os dados dessa conta são administrados pelo diretório (ADR-024).
- SPA e API compartilham o mesmo domínio: a SPA ocupa as rotas de interface e a API usa `/api/v1`.
- Autorização utiliza papéis, permissões, policies e gates.
- Funcionalidades de negócio são distribuídas como módulos instaláveis.
- Cada módulo backend é um pacote Composer.
- Cada módulo declara `type: starterkit-module` e um `module.json` versionado (`schemaVersion`), validado pelo núcleo antes da ativação.
- O provider de cada módulo estende `App\Core\Modules\ModuleServiceProvider`; a base só carrega rotas, migrations e traduções quando o módulo está habilitado e válido.
- O estado de habilitação fica em `storage/app/modules.json`; desabilitar um módulo preserva dados e vínculos de permissão.
- O código React de cada módulo é compilado junto com a SPA do host durante a implantação.
- Em produção, PHP-FPM e Nginx executam como serviços separados em imagens construídas do mesmo código; MariaDB e estado de módulos persistem em volumes externos.
- Bibliotecas e pacotes usam a versão estável mais recente compatível com a plataforma e entre si, com versões resolvidas registradas em lockfiles.
- Núcleo e módulos seguem a [política de compatibilidade](compatibility-policy.md) com versões independentes e faixas declaradas.
- Controllers são invocáveis e representam uma única operação.
- Entrada, regras de negócio e serialização ficam, respectivamente, em Form Requests, Actions e API Resources.

## Decisões pendentes

- [SPEC-001 — Navegação lateral agrupada por módulo](specs/module-sidebar-navigation.md): proposta de menu do módulo com submenus para suas páginas, registrada na ADR-022; implementação pendente.

Nenhuma decisão pendente deve ser incorporada silenciosamente. Ela deve ser registrada em `architecture.md` antes de afetar o contrato público do starter kit.

## Documentos

1. [Arquitetura](architecture.md)
2. [Contrato dos módulos](module-contract.md)
3. [Padrões de desenvolvimento](development-standards.md)
4. [Autenticação](authentication.md)
5. [Autorização](authorization.md)
6. [Convenções da API](api-conventions.md)
7. [Sistema de design](design.md)
8. [Arquitetura do frontend](frontend-architecture.md)
9. [Estratégia de testes](testing.md)
10. [Como criar um módulo](creating-a-module.md)
11. [Política de compatibilidade entre núcleo e módulos](compatibility-policy.md)
12. [Ambiente Docker e Laravel Sail](environment.md)
13. [Empacotamento e operação em produção](production-deployment.md)
14. [Plano de implementação do núcleo](plans/core-implementation-plan.md)
15. [Acompanhamento da F0](plans/f0-status.md), [da F1](plans/f1-status.md), [da F2](plans/f2-status.md), [da F3](plans/f3-status.md), [da F4](plans/f4-status.md), [da F5](plans/f5-status.md), [da F6](plans/f6-status.md) e [da F7](plans/f7-status.md)
16. [Plano de implementação da SPEC-001](plans/spec-001-module-sidebar-navigation-plan.md)
17. [Acompanhamento da SPEC-001](plans/spec-001-status.md)
18. [SPEC-002 — Autenticação local e LDAP do IFCE](specs/local-ldap-authentication.md) e [plano de implementação](plans/spec-002-local-ldap-authentication-plan.md)

## Especificações de evolução

- [SPEC-002 — Autenticação local e LDAP do IFCE](specs/local-ldap-authentication.md) — implementação concluída; homologação pendente; consulte o [plano](plans/spec-002-local-ldap-authentication-plan.md).

- [SPEC-001 — Navegação lateral agrupada por módulo](specs/module-sidebar-navigation.md) — implementação em andamento; consulte o [plano](plans/spec-001-module-sidebar-navigation-plan.md) e o [acompanhamento](plans/spec-001-status.md).

## Linguagem normativa

Os termos abaixo expressam o peso das regras:

- **DEVE**: requisito obrigatório.
- **NÃO DEVE**: prática proibida.
- **DEVERIA**: recomendação que pode ser ignorada mediante justificativa.
- **PODE**: decisão opcional.

## Manutenção

Mudanças que alterem contratos de API, módulos, autenticação, autorização ou componentes públicos DEVEM atualizar os documentos relacionados no mesmo conjunto de alterações.
