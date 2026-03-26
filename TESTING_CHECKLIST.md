# Testing Checklist - Milestone 4

## Performance Metrics - Target vs Actual

### Bundle Size ✅ PASSOU
- **Target:** <100 KB (gzipped)
- **Actual:** 29.78 KB (gzipped)
- **Result:** ✅ 70% abaixo do limite
- **Breakdown:**
  - HTML: 0.30 KB
  - CSS: 3.85 KB
  - JS: 25.63 KB

### Load Time Target
- **Target:** <1s em 4G
- **How to test:**
  1. Abra Chrome DevTools (F12)
  2. Network tab → Throttling → Fast 3G ou 4G
  3. Hard reload (Ctrl+Shift+R)
  4. Verifique DOMContentLoaded time

### WebSocket Latency Target
- **Target:** <200ms para votos
- **How to test:**
  1. Abra 2 browsers/tabs com mesma sala
  2. Vote em um browser
  3. Observe tempo até aparecer no outro
  4. Deve ser quase instantâneo (<200ms)

---

## Functional Testing Checklist

### Core Voting Flow
- [ ] Criar nova sala (auto-geração de ID)
- [ ] Copiar link e abrir em nova aba/browser
- [ ] Ambos usuários se conectam
- [ ] Definir nomes diferentes
- [ ] Votar valores Fibonacci (1, 2, 3, 5, 8, 13, 21)
- [ ] Revelar votos simultaneamente
- [ ] Verificar cálculo de média
- [ ] Nova rodada limpa votos
- [ ] Desmarcar voto (clicar novamente)

### Real-Time Sync
- [ ] Presence indicator mostra online/offline
- [ ] Contador de participantes atualiza
- [ ] Votos aparecem em tempo real
- [ ] Novo usuário entra e vê estado atual
- [ ] Usuário sai e é removido da lista

### Story/Backlog Management
- [ ] Adicionar história com título e descrição
- [ ] História é auto-selecionada ao adicionar
- [ ] Selecionar história diferente
- [ ] Votos são limpos ao trocar história
- [ ] Remover história
- [ ] História estimada mostra badge verde
- [ ] Expandir história estimada mostra votos

### Timer
- [ ] Configurar duração (10s mínimo, 3600s máximo)
- [ ] Iniciar timer
- [ ] Timer sincroniza entre clientes
- [ ] Pausar timer
- [ ] Resetar timer
- [ ] Timer expira e auto-revela votos

### Modo Anônimo vs Transparente
- [ ] Default é anônimo (não mostra quem votou)
- [ ] Toggle para transparente
- [ ] Em transparente, mostra nome + voto
- [ ] Sincroniza entre todos clientes

### Room Name
- [ ] Definir nome da sala
- [ ] Nome aparece no header
- [ ] Nome sincroniza entre clientes
- [ ] Editar nome a qualquer momento

### User Name
- [ ] Definir nome na entrada
- [ ] Nome salvo no localStorage
- [ ] Próxima sessão sugere nome anterior
- [ ] Editar nome a qualquer momento

### Export
- [ ] Exportar JSON baixa arquivo correto
- [ ] Exportar CSV baixa arquivo correto
- [ ] CSV pode ser aberto no Excel/Sheets
- [ ] Dados exportados estão completos

---

## Cross-Browser Testing

### Desktop Browsers
- [ ] **Chrome** (versão atual)
  - [ ] Todas funcionalidades
  - [ ] WebSocket conecta
  - [ ] UI renderiza corretamente

- [ ] **Firefox** (versão atual)
  - [ ] Todas funcionalidades
  - [ ] WebSocket conecta
  - [ ] UI renderiza corretamente

- [ ] **Safari** (versão atual, se disponível)
  - [ ] Todas funcionalidades
  - [ ] WebSocket conecta
  - [ ] UI renderiza corretamente

- [ ] **Edge** (versão atual)
  - [ ] Todas funcionalidades
  - [ ] WebSocket conecta
  - [ ] UI renderiza corretamente

### Mobile Browsers
- [ ] **Chrome Android**
  - [ ] Layout responsivo
  - [ ] Cards de votação clicáveis
  - [ ] Timer flutuante não obstrui conteúdo
  - [ ] Scroll funciona normalmente

- [ ] **iOS Safari**
  - [ ] Layout responsivo
  - [ ] Cards de votação clicáveis
  - [ ] Timer flutuante não obstrui conteúdo
  - [ ] Scroll funciona normalmente

---

## Responsiveness Testing

### Breakpoints
- [ ] **Mobile Portrait** (320px - 480px)
  - [ ] Cards empilham verticalmente
  - [ ] Timer fica legível
  - [ ] Botões são grandes o suficiente
  - [ ] Texto não corta

- [ ] **Mobile Landscape** (481px - 768px)
  - [ ] Layout ajusta corretamente
  - [ ] Timer não obstrui conteúdo

- [ ] **Tablet** (769px - 1024px)
  - [ ] Cards começam a aparecer em grid
  - [ ] Espaçamento adequado

- [ ] **Desktop** (1025px+)
  - [ ] Layout completo
  - [ ] Máxima legibilidade

### Orientation Changes
- [ ] Girar device de portrait para landscape
- [ ] UI reage sem quebrar
- [ ] Scroll funciona após rotação

---

## Error Handling & Edge Cases

### Network Issues
- [ ] Desconectar WiFi durante sessão
  - [ ] Indicator muda para offline
  - [ ] Reconecta automaticamente ao voltar
  - [ ] Estado sincroniza após reconexão

- [ ] Latência alta simulada (Slow 3G)
  - [ ] App continua responsivo
  - [ ] Não trava ou congela
  - [ ] Updates chegam eventualmente

### Edge Cases - Voting
- [ ] Todos votam o mesmo valor
  - [ ] Média calcula corretamente
  - [ ] UI mostra consenso

- [ ] Spread máximo (1 e 21)
  - [ ] Média calcula corretamente
  - [ ] Mostra valores min/max

- [ ] Apenas 1 pessoa vota
  - [ ] Pode revelar normalmente
  - [ ] Média = voto único

- [ ] Revelar sem votos
  - [ ] Não quebra app
  - [ ] Mostra 0 votos

### Edge Cases - Stories
- [ ] Adicionar história sem descrição
  - [ ] Aceita normalmente

- [ ] Título muito longo (50+ chars)
  - [ ] Corta em 50 caracteres

- [ ] Remover história atual
  - [ ] Deseleciona (currentStoryIndex = -1)
  - [ ] Não quebra votação

- [ ] Remover última história
  - [ ] Lista fica vazia
  - [ ] Pode adicionar novas

### Edge Cases - Timer
- [ ] Iniciar timer e mudar história
  - [ ] Timer continua rodando

- [ ] Timer expira com 0 votos
  - [ ] Revela normalmente (vazio)

- [ ] Configurar duração enquanto rodando
  - [ ] Reseta e para

### Edge Cases - Room
- [ ] Room ID inválido/inexistente
  - [ ] Cria sala nova

- [ ] Múltiplos usuários com mesmo nome
  - [ ] Aceita normalmente (ID é único)

- [ ] Nome de sala vazio
  - [ ] Usa default "Sessão de Planning Poker"

- [ ] Caracteres especiais no nome
  - [ ] Aceita normalmente

---

## Security & Privacy

### Browser-Only Architecture
- [ ] Verificar que votos não persistem no servidor
- [ ] Fechar todas abas e reabrir → sala vazia
- [ ] Dados ficam apenas no browser (localStorage)

### Data Export
- [ ] Exportar não envia para servidor
- [ ] Download é client-side
- [ ] Dados sensíveis não vazam

---

## Usability Testing

### First-Time User Experience
- [ ] Abrir app pela primeira vez
- [ ] Interface é auto-explicativa?
- [ ] Consegue criar sala e votar sem ajuda?
- [ ] Fluxo de compartilhar link é claro?

### Performance Perception
- [ ] App parece rápido e responsivo?
- [ ] Animações são suaves?
- [ ] Não há delays perceptíveis?

### Visual Polish
- [ ] Timer flutuante não obstrui conteúdo importante
- [ ] Cores e contraste são adequados
- [ ] Espaçamento é consistente
- [ ] Ícones são claros

---

## Automated Testing (Future)

### E2E Testing with Playwright (Pending)
```bash
# TODO: Adicionar Playwright
npm install -D @playwright/test
npx playwright test
```

### Unit Testing (Pending)
```bash
# TODO: Adicionar Vitest
npm install -D vitest
npm run test
```

---

## Performance Optimization Opportunities

### Identified (Not Critical)
1. ✅ Code splitting (apenas se >100KB)
2. ✅ Image optimization (não usa imagens)
3. ✅ Service Worker (opcional para offline)
4. ✅ HTTP/2 push (servidor-side, não aplicável)

### Current Status
- Bundle já está 70% abaixo do target
- Não há necessidade de otimizações adicionais agora
- Monitorar se crescer com novas features

---

## Known Issues

### None identified yet

---

## Testing Completion Criteria

Para considerar Milestone 4 completo:

- [ ] Bundle size <100KB ✅ (completado)
- [ ] Todas funcionalidades core testadas
- [ ] Funciona em Chrome, Firefox, Safari, Edge
- [ ] Responsivo em mobile e desktop
- [ ] Sem bugs críticos identificados
- [ ] WebSocket confiável e reconexão funciona
- [ ] Performance percebida é boa
- [ ] 3-5 usuários reais testaram e aprovaram

---

## Feedback Collection

### Setup
- [ ] Criar formulário de feedback (Google Forms / Typeform)
- [ ] Link no README
- [ ] Compartilhar com early adopters

### Questions to Ask
1. A interface é intuitiva?
2. Encontrou algum bug?
3. Qual feature você mais usaria?
4. O que está faltando?
5. Usaria regularmente? (1-5)

---

## Next Steps After Testing

1. Coletar feedback de 10+ equipes
2. Priorizar bugs críticos
3. Identificar features v1.1 baseado em uso real
4. Considerar features do backlog (T-shirt sizes, atalhos teclado, etc)
