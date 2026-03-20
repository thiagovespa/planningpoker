# 🃏 Planning Poker MVP

Sistema web de Planning Poker multiplayer com arquitetura browser-only e zero persistência.

## 🎯 Características

- **Browser-only**: Zero backend, zero database
- **Real-time**: Sincronização via WebSocket
- **Privacidade**: Dados nunca saem do browser
- **Performance**: Bundle < 100KB
- **Simplicidade**: Sem cadastro, apenas link

## 🚀 Desenvolvimento

```bash
# Instalar dependências
npm install

# Rodar dev server
npm run dev

# Build para produção
npm run build

# Preview do build
npm run preview
```

## 📋 Roadmap MVP (4 semanas)

- [x] **Semana 1**: Foundation (Setup + UI base) ← VOCÊ ESTÁ AQUI
- [ ] **Semana 2**: Core (WebSocket + Votação + Reveal)
- [ ] **Semana 3**: UX Polish (Anônimo + Timer + Export)
- [ ] **Semana 4**: Testing & Optimization

## 🏗️ Arquitetura

- **Framework**: Svelte 5 + TypeScript
- **Build**: Vite
- **Deploy**: Cloudflare Pages
- **Real-time**: WebSocket (upgrade para WebRTC no futuro)

## 📄 Documento de Planejamento

Veja o brainstorming completo em: `_bmad-output/brainstorming/brainstorming-session-2026-03-20-155501.md`

## 🎨 Design Principles

1. **Simplicidade Radical**: Sem fricção, sem cadastro
2. **Privacidade por Design**: Browser-only, zero-persistence
3. **Performance First**: < 100KB, < 1s load time
4. **Segurança Psicológica**: Anônimo por default

## 📦 Bundle Size Target

- Target: < 100KB total
- Svelte core: ~2KB
- App code: ~40KB
- WebSocket client: ~5KB
- Remaining: ~50KB para features

---

**Status**: 🟢 MVP em desenvolvimento - Milestone 1 (Foundation)
