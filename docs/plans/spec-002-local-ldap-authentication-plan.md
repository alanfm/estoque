# Plano de implementação da SPEC-002 — Autenticação local e LDAP

**Estado:** E1–E4 implementadas; E5 aguarda homologação da CTI.
**Contrato:** [SPEC-002](../specs/local-ldap-authentication.md).
**Dependências:** contratos de sessão, administração e SPA de F2/F3/F4; ambiente Docker/Sail e imagem de produção. LDAP não reabre nem altera o aceite histórico dessas fases.

## Revisão da ADR-024

O login passa a resolver automaticamente a origem por matrícula. Matrículas ausentes podem criar contas após bind e leitura do perfil institucional, com GUID estável, sem senha local ou papéis. Os dados importados ficam protegidos; a página de perfil inclui sincronização mediante nova senha institucional. O seed LDAP temporário foi removido, pois contas institucionais passam a ser provisionadas no próprio login.

Esta revisão acrescenta uma migration aditiva e altera o contrato de provisionamento; a homologação E5 precisa confirmar também escopo de busca, leitura de nome/e-mail e GUID. As evidências abaixo da entrega anterior são históricas; a revisão deve registrar seus próprios resultados, sem usar a suíte antiga como prova do novo fluxo.

Validação desta revisão (02/10/2026):

- Suíte backend completa: 67 testes, 463 assertions, incluindo provisionamento, colisões, isolamento de contas locais, dados protegidos e sincronização.
- Suíte frontend: 72 testes, incluindo sincronização por usuário sem permissões, atualização da sessão e limpeza da senha em sucesso/falha.
- Typecheck, lint, análise estática PHP e formatação dos arquivos PHP afetados passaram.
- Build da SPA passou em `/tmp/starterkit-ldap-build`; o aviso existente de bundle acima de 500 kB permanece.
- Migration aditiva aplicada no banco local. Nenhum bind com credenciais reais foi executado nesta validação; homologação institucional permanece pendente.

## Etapas e critérios de saída

| Etapa | Trabalho | Evidência necessária |
|---|---|---|
| E1 — Integração e infraestrutura | Extensão LDAP nativa, configuração e runtime | Implementado; Sail já inclui ldap e imagens de produção compilam a extensão; falta confirmar conexão CTI |
| E2 — Persistência e administração | Migration aditiva, vínculo de matrícula, origens, convites e proteção do último administrador | Implementado e coberto pela suíte Laravel |
| E3 — Actions e contrato HTTP | Login local/LDAP/fallback, limiter, circuito, endpoint de opções e restrições de senha | Implementado e coberto por testes com adaptador LDAP simulado |
| E4 — SPA | Seleção de origem, matrícula, ajuda institucional, erros e gestão de conta | Implementado; typecheck, lint, testes e build aprovados |
| E5 — Homologação e entrega | Teste LDAP TLS, validação CTI, compatibilidade e guia operacional | Pendente de endpoint, conta de teste e confirmação de rede/certificado da CTI |

O código usa a extensão PHP LDAP nativa, sem dependência Composer; a imagem Sail já inclui `php8.5-ldap`, e as imagens host compilam a extensão. Nenhuma conexão real ao diretório IFCE foi executada; habilitação em produção depende de homologação CTI.

## Matriz mínima de testes

Cobrir contas locais, somente LDAP e ambas, em modo local e LDAP; vínculo ausente/duplicado, zeros iniciais, senha vazia/nula/incorreta, LDAP rejeitado/indisponível, certificado inválido, fallback habilitado/desabilitado, desligamento global, recuperação/alteração de senha, criação/edição administrativa, último administrador e sessões existentes. Verificar que AD nunca concede papéis, cria contas ou grava senha no host.

Usar doubles na suíte rápida e diretório isolado para transporte/bind. A homologação institucional depende de configuração e conta de teste fornecidas pela CTI; CI não usa produção. Registrar responsáveis e revisor quando cada etapa começar, sem marcar concluída por haver apenas documentação.

## Validação executada

- `./vendor/bin/sail artisan test --compact`: 58 testes passaram (400 assertions).
- `npm run typecheck`, `npm run lint` e `npm test -- --reporter=dot`: passaram; 68 testes frontend.
- `npm run build -- --outDir /tmp/starterkit-build`: passou; bundle principal continua acima de 500 kB. O build padrão não pôde limpar `public/build/assets`, cujos arquivos locais pertencem ao usuário do container.
- `./vendor/bin/pint --test`: passou.
- `./vendor/bin/sail composer analyse`: passou sem erros.
- Homologação LDAP com TLS/CA e build de imagem sem conexão à rede institucional não foram executados.
