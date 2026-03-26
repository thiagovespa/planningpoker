# 🃏 Planning Poker MVP

Sistema web de Planning Poker multiplayer com arquitetura browser-only e zero persistência.

**🌐 App em Produção:** <https://thiagovespa.pages.dev/>

## 🎯 Características

- **Browser-only**: Zero backend, zero database
- **Real-time**: Sincronização via WebSocket (Partykit)
- **Privacidade**: Dados nunca saem do browser
- **Performance**: Bundle 50.71 KB (gzip: 18.97 KB)
- **Simplicidade**: Sem cadastro, apenas compartilha link
- **Multiplayer**: Suporta múltiplos participantes simultâneos

## 🚀 Como Usar

### **Produção (Live):**

1. **Acesse:** <https://thiagovespa.pages.dev/>
2. **Configure seu nome:** Digite seu nome na tela inicial
3. **Crie/Entre na sala:** Link é gerado automaticamente
4. **Compartilhe:** Clique em "Compartilhar" para copiar o link
5. **Vote:** Selecione um valor Fibonacci (1, 2, 3, 5, 8, 13, 21)
6. **Revele:** Quando todos votarem, clique em "Revelar"
7. **Nova rodada:** Clique em "Nova Rodada" para recomeçar

### **Guia Rápido de Funcionalidades:**

#### 📝 Histórias/Backlog

- **Adicionar:** Preencha título e descrição, clique em "Adicionar História"
- **Selecionar:** Clique na história para estimar
- **Remover:** Clique no ícone de lixeira
- **Estimadas:** Histórias já estimadas ficam com fundo verde

#### ⏱️ Timer

- **Configurar:** Ajuste a duração (10-3600 segundos)
- **Iniciar:** Clique em "Iniciar" no timer flutuante
- **Pausar/Resetar:** Use os controles do timer
- **Auto-reveal:** Quando o timer expira, os votos são revelados automaticamente

#### 🎭 Modo Anônimo/Transparente

- **Padrão:** Anônimo (segurança psicológica)
- **Alternar:** Toggle "Modo Anônimo" no header
- **Anônimo:** Não mostra quem votou o quê
- **Transparente:** Mostra nome + voto de cada participante

#### 📊 Exportar Resultados

- **JSON:** Dados estruturados para integração
- **CSV:** Compatível com Excel/Google Sheets
- **Inclui:** Histórias, votos, estatísticas (média, moda, min, max)

#### 👤 Personalização

- **Nome do usuário:** Editável a qualquer momento (clique no nome)
- **Nome da sala:** Editável no header (clique no lápis)
- **Persistência:** Seu nome é salvo no browser para próximas sessões

### **Desenvolvimento Local:**

```bash
# Instalar dependências
npm install

# Rodar frontend + backend localmente
npm run dev:all

# Ou rodar separadamente:
npm run dev        # Frontend (porta 5173)
npm run dev:party  # Backend WebSocket (porta 1999)

# Build para produção
npm run build

# Deploy do backend
npm run deploy:party
```

## 🔧 Troubleshooting

### Problemas de Conexão

**Sintoma:** Status mostra "Offline" ou não consegue conectar

**Soluções:**

1. Verifique sua conexão com a internet
2. Recarregue a página (Ctrl+R ou Cmd+R)
3. Aguarde alguns segundos - o app tenta reconectar automaticamente (até 5 tentativas)
4. Em desenvolvimento local, certifique-se que o servidor Partykit está rodando (`npm run dev:party`)

### Votos Não Aparecem

**Sintoma:** Votou mas outros participantes não veem

**Soluções:**

1.Verifique o indicador de conexão (deve estar verde/online)
2. Confirme que está na mesma sala (mesmo link compartilhado)
3. Recarregue a página - o estado sincroniza automaticamente

### Timer Não Sincroniza

**Sintoma:** Timer mostra tempos diferentes em diferentes clientes

**Soluções:**

1.Sincronização inicial pode levar 1-2 segundos
2. Relógio do dispositivo deve estar correto
3. Recarregue a página para resincronizar

### Performance Lenta

**Sintoma:** Interface lenta ou travando

**Soluções:**

1.Feche outras abas/apps pesados no browser
2. Limpe o cache do browser
3. Teste em modo anônimo/privado do browser
4. Verifique se a conexão está estável (não use 2G/Edge)

### Dados Não Persistem

**Sintoma:** Ao fechar o browser, dados desaparecem

**Explicação:** Isso é proposital! A arquitetura browser-only significa:

- Histórico de sessões NÃO persiste (privacidade por design)
- Seu nome de usuário É salvo localmente
- Para manter resultados, use **Exportar JSON/CSV** antes de fechar

## 💡 Dicas e Boas Práticas

### Para Facilitadores

- **Configure histórias antes:** Adicione todas as histórias antes de começar a votação
- **Use timer:** Ajuda manter o ritmo e evita discussões longas demais
- **Modo anônimo:** Mantenha ativado para júniores se sentirem confortáveis votando
- **Exporte ao final:** Baixe CSV/JSON ao terminar cada sessão

### Para Equipes

- **Defina nomes claros:** Facilita identificação em modo transparente
- **Discutam extremos:** Quando houver spread grande (ex: 1 vs 21), discutam antes de nova rodada
- **Use descrições:** Adicione contexto nas histórias (acceptance criteria, links)
- **Mantenha sessões curtas:** 1-2h máximo, faça breaks

### Para Performance

- **Use WiFi estável:** Evite 3G/4G se possível
- **Feche outras abas:** Libera memória do browser
- **Atualize o browser:** Sempre use versão mais recente
- **Mobile:** Gire para landscape em histórias longas

## ✅ Status do Projeto

### **Milestone 1: Foundation** - ✅ COMPLETO

- ✅ Svelte 5 + TypeScript + Vite
- ✅ Design system responsivo
- ✅ Deploy pipeline (Cloudflare Pages + Partykit)

### **Milestone 2: Core Functionality** - ✅ COMPLETO

- ✅ WebSocket real-time com sincronização
- ✅ Sistema de votação Fibonacci (1, 2, 3, 5, 8, 13, 21)
- ✅ Revelação simultânea em todos os clientes
- ✅ Cálculo automático de média
- ✅ Gestão de participantes em tempo real
- ✅ Reset e nova rodada
- ✅ Share via link (zero fricção)

### **Milestone 3: UX Polish** - ✅ COMPLETO

- ✅ Modo Anônimo/Transparente
- ✅ Timer/Countdown
- ✅ Export JSON/CSV
- ✅ Undo single-level
- ✅ Sistema de histórias/backlog
- ✅ Histórico de estimativas com estatísticas
- ✅ Nome da sala customizável
- ✅ Auto-avanço para próxima história

### **Milestone 4: Testing & Optimization** - 🟡 EM PROGRESSO

- ✅ Bundle optimization (<100KB target → 29.8KB achieved!)
- ✅ Performance audit
- ✅ Error handling & auto-reconnection
- ✅ Documentation (README, Testing, Feedback)
- ⏳ Cross-browser testing (manual)
- ⏳ User feedback collection (early adopters)

## 🏗️ Arquitetura

- **Framework**: Svelte 5 + TypeScript
- **Build**: Vite
- **Frontend Deploy**: Cloudflare Pages
- **Backend**: Partykit (WebSocket server)
- **Real-time**: WebSocket com Svelte Stores
- **State Management**: Svelte writable stores

## 📊 Métricas

- **Bundle Size**: 50.71 KB (gzip: 18.97 KB) ✅
- **Target**: < 100 KB
- **Load Time**: < 1s
- **Real-time Latency**: < 200ms

## 🎨 Design Principles

1. **Simplicidade Radical**: Sem fricção, sem cadastro
2. **Privacidade por Design**: Browser-only, zero-persistence
3. **Performance First**: < 100KB, < 1s load time
4. **Segurança Psicológica**: Features de anonimato e segurança

## 📄 Documentação

- **Brainstorming Completo**: `_bmad-output/brainstorming/brainstorming-session-2026-03-20-155501.md`
- **Repositório**: <https://github.com/thiagovespa/planningpoker>

## 📣 Feedback e Suporte

### Como Dar Feedback

Seu feedback é essencial para melhorar o Planning Poker!

**Reportar Bugs ou Sugerir Features:**

- GitHub Issues: <https://github.com/thiagovespa/planningpoker/issues>
- Use os templates em [FEEDBACK.md](FEEDBACK.md)

**Questionário de Validação:**

- Teste o MVP e responda o questionário em [FEEDBACK.md](FEEDBACK.md)
- Ajude a priorizar features v1.1!

**Precisando Ajuda?**

- Consulte a seção [Troubleshooting](#-troubleshooting) acima
- Abra uma issue no GitHub
- Veja a [documentação completa](TESTING_CHECKLIST.md)

## 🤝 Contribuindo

Este projeto foi desenvolvido seguindo a metodologia BMad (Build-Measure-Analyze-Decide).

Para contribuir:

1. Fork o repositório
2. Crie uma branch para sua feature (`git checkout -b feature/AmazingFeature`)
3. Commit suas mudanças (`git commit -m 'Add some AmazingFeature'`)
4. Push para a branch (`git push origin feature/AmazingFeature`)
5. Abra um Pull Request

---

**Status Atual**: 🟢 **MVP Completo em Produção** - Milestone 3 finalizado, Milestone 4 em progresso
