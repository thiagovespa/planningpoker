<script lang="ts">
  // Planning Poker MVP - Main App Component
  let roomId = crypto.randomUUID()
  let shareUrl = `${window.location.origin}/?room=${roomId}`

  function copyToClipboard() {
    navigator.clipboard.writeText(shareUrl)
    alert('Link copiado!')
  }
</script>

<main>
  <header>
    <h1>🃏 Planning Poker</h1>
    <p>Estimativas ágeis em tempo real, privado e simples</p>
  </header>

  <section class="room-card">
    <h2>Sua Sala de Votação</h2>
    <div class="share-section">
      <input
        type="text"
        value={shareUrl}
        readonly
        on:click={(e) => e.currentTarget.select()}
      />
      <button on:click={copyToClipboard}>
        📋 Copiar Link
      </button>
    </div>
    <p class="hint">Compartilhe este link com sua equipe para começar!</p>
  </section>

  <section class="status">
    <div class="status-indicator">
      <span class="dot online"></span>
      <span>Conectado</span>
    </div>
    <div class="participants">
      <span>👤 0 participantes</span>
    </div>
  </section>

  <footer>
    <p>
      <strong>MVP v0.1</strong> •
      Arquitetura browser-only •
      Zero persistência •
      <a href="https://github.com" target="_blank">GitHub</a>
    </p>
  </footer>
</main>

<style>
  main {
    max-width: 800px;
    margin: 0 auto;
    padding: var(--space-xl);
  }

  header {
    text-align: center;
    margin-bottom: var(--space-xl);
  }

  header h1 {
    font-size: 2.5rem;
    margin-bottom: var(--space-sm);
  }

  header p {
    color: #666;
    font-size: 1.125rem;
  }

  .room-card {
    background: var(--color-bg);
    border: 2px solid var(--color-border);
    border-radius: 8px;
    padding: var(--space-xl);
    margin-bottom: var(--space-lg);
  }

  .room-card h2 {
    margin-bottom: var(--space-md);
  }

  .share-section {
    display: flex;
    gap: var(--space-sm);
    margin-bottom: var(--space-sm);
  }

  input {
    flex: 1;
    padding: var(--space-md);
    border: 1px solid var(--color-border);
    border-radius: 4px;
    font-family: var(--font-mono);
    font-size: 0.875rem;
  }

  button {
    padding: var(--space-md) var(--space-lg);
    background: var(--color-primary);
    color: white;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    font-weight: 600;
    transition: background 0.2s;
  }

  button:hover {
    background: var(--color-primary-hover);
  }

  .hint {
    color: #666;
    font-size: 0.875rem;
  }

  .status {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: var(--space-md);
    background: #f9fafb;
    border-radius: 4px;
    margin-bottom: var(--space-lg);
  }

  .status-indicator {
    display: flex;
    align-items: center;
    gap: var(--space-sm);
  }

  .dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
  }

  .dot.online {
    background: var(--color-success);
    animation: pulse 2s infinite;
  }

  @keyframes pulse {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.5; }
  }

  footer {
    text-align: center;
    padding-top: var(--space-xl);
    border-top: 1px solid var(--color-border);
    color: #666;
    font-size: 0.875rem;
  }

  footer a {
    color: var(--color-primary);
    text-decoration: none;
  }

  footer a:hover {
    text-decoration: underline;
  }

  @media (max-width: 640px) {
    main {
      padding: var(--space-md);
    }

    header h1 {
      font-size: 2rem;
    }

    .share-section {
      flex-direction: column;
    }

    .status {
      flex-direction: column;
      gap: var(--space-sm);
      align-items: flex-start;
    }
  }
</style>
