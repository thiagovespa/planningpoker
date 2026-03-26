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

1. Acesse: <https://thiagovespa.pages.dev/>
2. Copie o link da sala
3. Compartilhe com sua equipe
4. Votem juntos em tempo real!

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

### **Milestone 3: UX Polish** - 🚧 EM PROGRESSO

- [ ] Modo Anônimo/Transparente
- [ ] Timer/Countdown
- [ ] Export JSON/CSV
- [ ] Undo single-level

### **Milestone 4: Testing & Optimization** - ⏳ PLANEJADO

- [ ] Testes E2E
- [ ] Performance audit
- [ ] Cross-browser testing
- [ ] User feedback collection

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

## 🤝 Contribuindo

Este projeto foi desenvolvido seguindo a metodologia BMad (Build-Measure-Analyze-Decide).

---

**Status Atual**: 🟢 **MVP Completo em Produção** - Milestone 2 finalizado, Milestone 3 em progresso
