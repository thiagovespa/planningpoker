# Feedback Collection - Planning Poker MVP

## Objetivo

Coletar feedback de early adopters para validar o MVP e identificar features v1.1 baseadas em uso real.

## Meta

- **10+ equipes** testando e usando regularmente
- **Feedback qualitativo** sobre experiência de uso
- **Identificação de bugs** críticos e edge cases
- **Priorização de features** para próximas versões

---

## Como Dar Feedback

### GitHub Issues (Recomendado)

Para bugs, sugestões de features, ou problemas técnicos:

1. Acesse: <https://github.com/thiagovespa/planningpoker/issues>
2. Clique em "New Issue"
3. Use os templates abaixo como guia
4. Seja específico e detalhado

### Email (Alternativo)

Para feedback geral ou privado:
- Email: [seu-email@exemplo.com]
- Assunto: "[Planning Poker] Feedback"

---

## Templates de Feedback

### 🐛 Reportar Bug

```markdown
**Descrição do Bug:**
[Descreva o que aconteceu]

**Como Reproduzir:**
1. Passo 1
2. Passo 2
3. Passo 3

**Comportamento Esperado:**
[O que deveria acontecer]

**Comportamento Atual:**
[O que acontece na prática]

**Screenshots:**
[Se aplicável, adicione screenshots]

**Ambiente:**
- Browser: [ex: Chrome 120]
- OS: [ex: Windows 11, macOS 14, Android 13]
- Dispositivo: [Desktop/Mobile/Tablet]
- Conexão: [WiFi/4G/5G]

**Informações Adicionais:**
[Qualquer contexto adicional]
```

### 💡 Sugerir Feature

```markdown
**Descrição da Feature:**
[Descreva a funcionalidade desejada]

**Problema que Resolve:**
[Qual problema ou necessidade esta feature atende?]

**Solução Proposta:**
[Como você imagina que funcionaria?]

**Alternativas Consideradas:**
[Você pensou em outras formas de resolver isso?]

**Impacto:**
- [ ] Critical (bloqueador para uso)
- [ ] High (muito útil)
- [ ] Medium (seria legal ter)
- [ ] Low (nice to have)

**Use Cases:**
[Em que situações você usaria?]
```

### ⭐ Feedback Geral

```markdown
**O que você mais gostou:**
[Highlights positivos]

**O que pode melhorar:**
[Pontos de atenção]

**Você usaria regularmente?**
- [ ] Sim, definitivamente
- [ ] Sim, provavelmente
- [ ] Talvez
- [ ] Provavelmente não
- [ ] Definitivamente não

**Por quê?**
[Explique sua resposta]

**O que está faltando para você usar mais?**
[Features ou melhorias necessárias]

**Comparado com outras ferramentas:**
[Se você já usou Jira Planning Poker, PlanITPoker, etc]
- Melhor que: [aspectos]
- Pior que: [aspectos]
- Diferente: [aspectos únicos]
```

---

## Questionário de Validação MVP

### Seção 1: Usabilidade

1. **Conseguiu criar uma sala e votar sem ajuda ou documentação?**
   - [ ] Sim, foi intuitivo
   - [ ] Sim, mas com dificuldade
   - [ ] Não, precisei de ajuda/documentação
   - Comentário: _____________

2. **A interface é clara e fácil de entender?**
   - Nota: [ ] 1 2 3 4 5 (1=confusa, 5=muito clara)
   - Comentário: _____________

3. **Quanto tempo levou para fazer a primeira votação completa?**
   - [ ] <1 minuto
   - [ ] 1-3 minutos
   - [ ] 3-5 minutos
   - [ ] >5 minutos

### Seção 2: Performance

4. **A aplicação parece rápida e responsiva?**
   - [ ] Muito rápida
   - [ ] Rápida o suficiente
   - [ ] Um pouco lenta
   - [ ] Muito lenta
   - Comentário: _____________

5. **Teve problemas de conexão ou sincronização?**
   - [ ] Não, funcionou perfeitamente
   - [ ] Às vezes desconectou mas reconectou
   - [ ] Teve problemas frequentes
   - Descreva: _____________

6. **Testou em mobile? Como foi a experiência?**
   - [ ] Sim, excelente
   - [ ] Sim, boa
   - [ ] Sim, ruim
   - [ ] Não testei
   - Comentário: _____________

### Seção 3: Funcionalidades Core

7. **Quais features você usou?** (marque todas)
   - [ ] Votação Fibonacci
   - [ ] Revelar votos
   - [ ] Nova rodada
   - [ ] Timer
   - [ ] Modo anônimo/transparente
   - [ ] Histórias/Backlog
   - [ ] Exportar JSON/CSV
   - [ ] Nome da sala personalizado

8. **Qual feature você mais usou/gostou?**
   - _____________

9. **Alguma feature não funcionou como esperado?**
   - _____________

### Seção 4: Missing Features

10. **O que você sentiu falta?** (features que gostaria de ter)
    - _____________
    - _____________
    - _____________

11. **Qual destas features você mais gostaria?** (escolha top 3)
    - [ ] T-shirt Sizes (XS, S, M, L, XL)
    - [ ] Atalhos de teclado (1-9 para votar)
    - [ ] Templates de sessão
    - [ ] Importação de histórias (CSV)
    - [ ] Confidence voting (voto + confiança)
    - [ ] Modo observador
    - [ ] Animações melhores
    - [ ] Histórico de sessões passadas
    - [ ] Integração Jira/GitHub
    - [ ] Outro: _____________

### Seção 5: Adoption

12. **Usaria esta ferramenta em seu trabalho diário?**
    - [ ] Sim, com certeza
    - [ ] Sim, provavelmente
    - [ ] Talvez, com melhorias
    - [ ] Não

13. **Recomendaria para outras equipes?**
    - [ ] Sim, com certeza
    - [ ] Sim, provavelmente
    - [ ] Talvez
    - [ ] Não

14. **Nota geral (1-10):**
    - [ ] 1 2 3 4 5 6 7 8 9 10

15. **Comentários finais:**
    - _____________

---

## Tracking de Feedback

### Early Adopters

| Equipe | Data | Status | Nota | Principais Feedbacks |
|--------|------|--------|------|---------------------|
| - | - | - | - | - |

### Bugs Críticos Identificados

| ID | Descrição | Severidade | Status | Resolvido |
|----|-----------|-----------|--------|-----------|
| - | - | - | - | - |

### Features Mais Solicitadas

| Feature | Votos | Prioridade | Estimativa | Versão |
|---------|-------|-----------|-----------|--------|
| - | - | - | - | - |

---

## Análise de Feedback

### Padrões Identificados

**Pontos Fortes (O que está funcionando):**
- [ ] Performance (bundle size, load time)
- [ ] Simplicidade de uso
- [ ] Zero-friction onboarding
- [ ] _____________

**Pontos Fracos (O que precisa melhorar):**
- [ ] _____________
- [ ] _____________

**Bugs Recorrentes:**
- [ ] _____________
- [ ] _____________

**Features Bloqueadoras:**
(Features cuja ausência impede adoção)
- [ ] _____________
- [ ] _____________

**Nice-to-Haves:**
(Features desejadas mas não críticas)
- [ ] _____________
- [ ] _____________

---

## Decisões Baseadas em Feedback

### v1.1 Roadmap (Priorizadas)

1. **[Feature]** - Solicitada por X equipes
   - Estimativa: Y horas
   - Justificativa: Z

2. **[Feature]** - Solicitada por X equipes
   - Estimativa: Y horas
   - Justificativa: Z

### Backlog (Despriorizadas)

- **[Feature]** - Razão: baixa demanda / alta complexidade / fora do escopo

---

## Critérios de Sucesso MVP

**MVP é considerado validado quando:**

- [x] 10+ equipes testaram
- [ ] Taxa de aprovação >70% (nota ≥7/10)
- [ ] Bugs críticos identificados e corrigidos
- [ ] Pelo menos 3 early adopters usando regularmente
- [ ] Features v1.1 priorizadas com base em feedback real

**Status Atual:** 🟡 Em coleta de feedback

---

## Próximos Passos

1. **Compartilhar com early adopters** (tech teams, comunidades)
2. **Agendar sessões de teste** com 3-5 equipes
3. **Coletar feedback** usando questionário
4. **Analisar padrões** e priorizar v1.1
5. **Iterar rapidamente** baseado em uso real

---

**Última atualização:** 2026-03-26
