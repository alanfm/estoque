# Gerenciamento de módulos pelo core

O core oferece **Configurações → Módulos**, na rota `/admin/modules`. Gerenciar pacotes e seu estado é infraestrutura compartilhada do núcleo (ADR-027), e não uma funcionalidade de módulo de negócio.

## Acesso e operações

A sessão precisa de `modules.viewAny` para abrir a tela. Cada operação tem uma permissão independente: `modules.install`, `modules.remove`, `modules.enable` e `modules.disable`. O superadministrador segue o bypass centralizado existente. Execute `./vendor/bin/sail artisan core:sync-permissions` depois de atualizar o host para disponibilizar o novo catálogo aos papéis.

- **Adicionar:** solicita um link HTTPS de repositório GitHub, no formato `https://github.com/organizacao/repositorio` (também aceita `.git`). Clona a branch padrão numa pasta temporária, sem executar scripts ou hooks. O repositório deve ter `module.json` e `composer.json` na raiz; links simbólicos não são aceitos. O preflight verifica schema, identificadores, prefixo de API, permissões, entrada frontend, requisitos PHP/Laravel, faixa do core e dependências instaladas, válidas e habilitadas. Identificador/prefixo já instalado e prefixos reservados `admin`, `auth` e `system` são rejeitados. O Composer faz uma resolução `--dry-run` antes da instalação efetiva. O pacote local fica em `modules/vendor/package`, com versão Composer igual à versão declarada pelo manifesto, e é instalado **desabilitado**. Providers são validados num processo novo, sem ativar o módulo. Não há catálogo, atualização automática, seleção de branch/tag ou fluxo de credenciais para repositórios privados.
- **Habilitar:** revalida o módulo e seus providers, exige dependências habilitadas, persiste o estado, executa migrations pendentes e recompila a SPA. Sincroniza permissões de forma não destrutiva.
- **Desabilitar:** bloqueia a operação se existir dependente habilitado. Desativa o módulo, recompila os assets e sincroniza as permissões. Preserva tabelas, dados e atribuições de permissões.
- **Remover:** exige ausência de dependentes habilitados e pacote em `modules/vendor/package`. Remove a dependência Composer e os arquivos do pacote, recompila os assets e sincroniza permissões. Não executa rollback de migrations nem apaga dados ou vínculos de permissão. Reinstalar e habilitar reaproveita os dados preservados.

Após uma operação, a tela atualiza a listagem e oferece recarregar a página para atualizar o registro de módulos e os menus da SPA.

## API

Todas as rotas abaixo usam sessão/Sanctum, middleware `web` e CSRF nas mutações. A autorização é verificada no servidor antes de iniciar processos.

| Método e caminho sob `/api/v1` | Permissão | Resposta |
|---|---|---|
| `GET /admin/modules` | `modules.viewAny` | `200`, `data` com metadados de módulos e `meta` com `coreVersion`, `managementEnabled`, `issues` |
| `POST /admin/modules`, JSON `{ "repository": "https://github.com/acme/example" }` | `modules.install` | `204` após instalação desabilitada |
| `POST /admin/modules/{name}/enable` | `modules.enable` | `204` |
| `POST /admin/modules/{name}/disable` | `modules.disable` | `204` |
| `DELETE /admin/modules/{name}` | `modules.remove` | `204` |

Falhas de validação/compatibilidade, dependentes ativos, host imutável e operação concorrente retornam `422` no envelope existente. O campo `repository` contém motivos do preflight; `module` contém impedimentos operacionais. Visitantes recebem `401`, usuários sem permissão `403` e módulo desconhecido `404`. Caminhos absolutos e saída de processos não são enviados ao cliente; falhas de processos ficam nos logs.

## Ambiente de execução

`STARTERKIT_MODULE_MANAGEMENT` controla as mutações pelo painel. O padrão é habilitado em `APP_ENV=local`, desabilitado nos demais ambientes. A listagem continua disponível em hosts imutáveis.

O gerenciamento exige um **host de build mutável** com Git, Composer, PHP e Node/npm instalados, dependências frontend presentes, repositório do host completo e gravável, acesso ao GitHub/registries e acesso ao banco para migrations e sincronização. O Sail existente oferece esse ambiente. O host deve manter o repositório Composer `path` de `modules/*/*`, e essa raiz deve participar de `modules.paths`. Cada módulo segue as dependências frontend compartilhadas do host; a tela não instala dependências npm próprias do pacote.

A operação é síncrona: cada processo tem timeout de 300 segundos e a requisição permite até 900 segundos de execução PHP. Proxies e servidores de um ambiente que habilite a feature precisam permitir uma requisição longa correspondente. O lock em `storage/app/module-management.lock` serializa as operações do painel; não execute comandos de instalação/estado por fora do painel simultaneamente.

A imagem de produção atual segue imutável: não contém Node/Composer, não permite alterar o código e usa Nginx e PHP em imagens separadas. **Não habilite essa variável nessa imagem.** Faça mudanças pelo painel no ambiente de desenvolvimento/build, revise e versione os pacotes e lockfile alterados e gere uma nova imagem conforme [produção](production-deployment.md). Alterações de habilitação também precisam compor o estado publicado e o build correspondente. Uma arquitetura futura de implantação remota requer outra decisão; esta feature não modifica silenciosamente o contrato de produção.

Em falha, o core restaura os arquivos Composer e o estado anterior, devolve/remove o diretório de pacote conforme necessário e tenta reinstalar dependências, recompilar os assets e sincronizar permissões. Falhas na recuperação são registradas e exigem reparação pelo operador. Migrations já executadas não são revertidas automaticamente, pois podem alterar dados. Instalação de código de terceiros deve ser feita por administradores que confiam no repositório indicado.

## Verificação

`ModuleManagementTest` cobre autorização, URLs rejeitadas, preflight antes de Composer, instalação desabilitada, bloqueio por dependentes, remoção preservando dados, host imutável e recuperação de estado. Processos externos são simulados e as mutações de pacote usam hosts temporários; esses testes não demonstram download real do GitHub. Os testes frontend cobrem solicitação do link, apresentação de incompatibilidade, confirmação de remoção, controles por permissão e navegação Configurações → Módulos.
