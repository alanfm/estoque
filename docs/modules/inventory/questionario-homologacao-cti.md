# Questionário de homologação — P10.6 e P10.7

**Projeto:** Almoxarifado de TI
**Fonte analisada:** Controle Estoque - TI v1.2
**Responsável CTI:** Alan Freire
**Data:** 30/09/2026
**Ambiente de homologação:** __________________________
**Revisão do sistema:** ________________________________

## Instruções

- Responder somente com informação aprovada ou comprovável pela CTI.
- Não preencher datas, quantidades, marcas, saldos ou usuários por suposição.
- Quando a decisão for **revisar depois**, a linha não deve ser importada nem liberar o saldo correspondente para operação.
- Anexar evidência quando houver correção de data, quantidade, variante, contagem ou documento.

---

## P10.6 — Homologação dos dados e da importação

### 1. Fonte e política confirmadas

- Fonte: **Controle Estoque - TI v1.2**.
- Abas de fatos: `DADOS` e `LANÇAMENTOS`; `Imprimir`, `Relatório` e `CÓDIGOS` são auxiliares.
- Um movimento por linha histórica completa, preservando descrição, custo, origem e referência quando existentes.

### 2. Política de carga de tuplas

Estas decisões já estão tomadas e não precisam ser respondidas novamente:

- Importar somente tuplas completas, com os campos obrigatórios do fato.
- As 4 entradas sem data e 3 saídas sem data ficam fora do lote e serão inseridas manualmente.
- A linha 390, sem quantidade, fica fora do lote e será inserida manualmente.
- A linha 99, cuja quantidade depende de fórmula/cache `27`, fica fora do lote e será inserida manualmente com quantidade conferida.
- Nenhuma data, quantidade, OS, marca ou custo será inventado para completar uma tupla.
- As cinco ocorrências `30/05/2003` vinculadas às OS 1001–1003 recebem a correção aprovada para `30/05/2023`, preservando o original.

### 3. Aprovação da prévia de tuplas completas

1. A CTI autoriza carregar somente as tuplas completas em uma base de homologação isolada?

   - [ ] Sim, em fase futura
   - [x] Não nesta implantação; a planilha será somente referência histórica
   - Condição: _______________________________________________________

2. Depois de revisar a prévia das tuplas completas e o relatório das linhas manuais pendentes, a CTI aprova o lote para commit?

   - [ ] Sim, em fase futura
   - [x] Não nesta implantação; não haverá prévia/commit inicial
   - Pendência futura: ________________________________________________

**Nome/assinatura CTI:** ______________________________________________
**Data:** ____/____/________

### 4. Categorias, códigos e variantes físicas

4. A CTI confirma a deduplicação das categorias **Conectores** e **Patch Cord**?

   - [ ] Confirmado
   - [ ] Manter separadas. Motivo: ____________________________________

5. Cadastrar manualmente cada código, categoria, unidade e variante física. Quando a marca/modelo não puder ser comprovada, usar explicitamente **“Marca/modelo não identificado”**; não escolher uma marca por ordem da planilha.

| Código | Categoria aprovada | Nome do item | Variante/marca/modelo | Unidade UN/PAR/CX | Quantidade física conferida | Ação: mapear/revisar/descartar | Evidência |
|---|---|---|---|---|---:|---|---|
| __________ | __________ | __________ | __________ | ______ | ______ | __________ | __________ |
| __________ | __________ | __________ | __________ | ______ | ______ | __________ | __________ |
| __________ | __________ | __________ | __________ | ______ | ______ | __________ | __________ |

**Anexar a lista completa dos 110 códigos cadastrados manualmente.** Se houver mais de uma variante por código, usar uma linha para cada variante. Essa lista não é um mapa para importação inicial.

6. Existem códigos tecnicamente incompatíveis que não devem compartilhar a mesma família/item?

   - [ ] Não
   - [ ] Sim. Códigos e separação aprovada: ___________________________

7. Para saídas históricas sem marca comprovável, a CTI aprova a variante legada não identificada?

   - [ ] Sim
   - [ ] Não. Mapeamento alternativo: _________________________________

### 6. Saldos negativos históricos

Decisão registrada: os saldos legados negativos de `PEN02=-3`, `SSD01=-3`, `HDN02=-1` e `TN003=-1` ficam com saldo operacional inicial **zero**. Esses códigos não entram como saldo negativo no lote inicial e não recebem ajuste automático. Eventual regularização posterior será feita manualmente e auditada.

3. A CTI confirma que a operação só será liberada com os saldos operacionais não negativos?

   - [x] Sim
   - [ ] Não. Exceção formal: _________________________________________

---

## P10.7 — Configuração operacional

### 7. Local e unidades

8. O local operacional inicial permanece:

   - [ ] `TI — Almoxarifado TI`
   - [ ] Alterar para: ________________________________________________

9. Confirmar a unidade de estoque de cada código na lista anexa:

   - [ ] `UN` — unidade
   - [ ] `PAR` — par
   - [ ] `CX` — caixa
   - [ ] Há conversões necessárias. Códigos/documentação: ______________

**Não misturar unidade, par e caixa no mesmo saldo sem conversão aprovada.**

### 8. Parâmetros de reposição

Para cada item, o mínimo efetivo e o estoque de segurança serão preenchidos manualmente. Quando houver histórico de movimentação suficiente, uma fórmula futura poderá calcular uma sugestão baseada no consumo; ela não substituirá automaticamente o valor manual. O prazo de compra e a janela de recomendação ainda precisam ser definidos.

| Código | Mínimo efetivo | Prazo de compra (dias) | Estoque de segurança | Janela (30–365 dias) | Cobertura histórica desde | Observação |
|---|---:|---:|---:|---:|---|---|
| __________ | ______/NULL | ______/NULL | ______/NULL | ______ | ____/____/______ | __________ |
| __________ | ______/NULL | ______/NULL | ______/NULL | ______ | ____/____/______ | __________ |
| __________ | ______/NULL | ______/NULL | ______/NULL | ______ | ____/____/______ | __________ |

**Anexar a lista completa dos itens.**

10. Qual prazo de compra será usado por item?

   - [x] Definido manualmente pelo administrador operacional
   - Observação: ______________________________________________________

11. Qual janela de recomendação será usada quando houver histórico suficiente?

   - É o número de dias anteriores de movimentação usado no cálculo da sugestão, não o prazo de compra.
   - Valor padrão (30–365 dias): ______________________________________
   - [ ] Ainda não definido

12. O mínimo efetivo manual pode ser alterado automaticamente pela sugestão futura?

   - [x] Não; a sugestão será informativa e qualquer alteração será manual/auditada
   - [ ] Sim, sob esta regra formal: __________________________________

13. A cobertura histórica da fonte está confirmada como referência para uso futuro, sem carga inicial?

   - [x] Sim
   - [ ] Não. Observação: ______________________________________________

### 9. Usuários e papéis reais

Inicialmente, o sistema será operado somente pelos técnicos de TI. Não há usuários reais para cadastrar nesta etapa. As capacidades abaixo devem permanecer disponíveis para futura expansão a outros setores, sempre com permissões separadas.

| Função suportada | Disponível no sistema | Uso inicial |
|---|---|---|
| Auditor | [x] Sim | Não haverá conta real inicial |
| Almoxarife | [x] Sim | Técnicos de TI, conforme atribuição |
| Gestor | [x] Sim | Técnicos de TI autorizados |
| Administrador operacional | [x] Sim | Técnicos de TI autorizados |

14. Quem será o administrador operacional responsável no futuro por configurar reposição e autorizar exportações/importações?

   **A definir:** _____________________________________________________

15. Quem será o gestor responsável no futuro por ajustes e estornos?

   **A definir:** _____________________________________________________

16. Quem fará a conferência como auditor no futuro, sem permissão de escrita?

   **A definir:** _____________________________________________________

17. O papel de almoxarife ficará restrito a entradas e saídas, sem ajustes e estornos?

   - [ ] Sim
   - [ ] Não. Exceção aprovada: ______________________________________

### 10. Janela e aceite operacional

18. Janela aprovada para implantação/configuração inicial (sem importação):

   **Data/hora início:** __________________  **Data/hora fim:** __________________

19. Responsável técnico pela execução: __________________________________________

20. Responsável CTI pela conferência do cadastro inicial: _________________________

21. Critérios para liberar operação após o cadastro manual inicial:

   - [ ] Backup restaurável conferido
   - [ ] Planilha registrada somente como referência histórica
   - [ ] Categorias, códigos, unidades e variantes cadastrados manualmente
   - [ ] PEN02, SSD01, HDN02 e TN003 registrados com saldo operacional zero
   - [ ] Reconciliação do cadastro/saldos iniciais sem divergência não explicada
   - [ ] Papéis testados
   - [ ] Smoke autenticado registrado

**Aprovação CTI para homologação:** ______________________________________________
**Data:** ____/____/________  **Observações:** ____________________________________

## Anexos esperados

1. Lista completa dos 110 códigos com categoria, unidade e variante(s), cadastrados manualmente.
2. Relatório das tuplas incompletas encaminhadas para lançamento manual.
3. Registro dos quatro códigos tratados com saldo operacional zero.
4. Tabela completa de parâmetros de reposição.
5. Lista de usuários, papéis e responsáveis.
6. Evidências/documentos que sustentam correções e exceções.
