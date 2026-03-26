<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import {
    connect,
    disconnect,
    vote,
    reveal,
    reset,
    toggleAnonymous,
    connected,
    participants,
    votes,
    revealed,
    myVote,
    currentUserId,
    anonymous
  } from './lib/room.svelte';

  // Get roomId from URL or generate new
  const urlParams = new URLSearchParams(window.location.search);
  const roomId = urlParams.get('room') || crypto.randomUUID();
  const shareUrl = `${window.location.origin}/?room=${roomId}`;

  // Update URL if new room
  if (!urlParams.get('room')) {
    window.history.replaceState({}, '', `?room=${roomId}`);
  }

  const fibonacciCards = [1, 2, 3, 5, 8, 13, 21];

  function copyToClipboard() {
    navigator.clipboard.writeText(shareUrl);
    alert('Link copiado!');
  }

  function selectCard(value: number) {
    vote(value);
  }

  function handleReveal() {
    reveal();
  }

  function handleReset() {
    reset();
  }

  function handleToggleAnonymous() {
    toggleAnonymous();
  }

  // Conta quantos participantes já votaram
  $: votedCount = $votes.length;
  $: totalParticipants = $participants.length;
  $: allVoted = votedCount === totalParticipants && totalParticipants > 0;

  // Calcula média dos votos revelados
  $: average = (() => {
    if (!$revealed || $votes.length === 0) return null;
    const values = $votes
      .map(v => v.value)
      .filter((v): v is number => v !== null);
    if (values.length === 0) return null;
    return values.reduce((a, b) => a + b, 0) / values.length;
  })();

  // Connect to WebSocket on mount
  onMount(() => {
    connect(roomId);
  });

  // Disconnect on unmount
  onDestroy(() => {
    disconnect();
  });
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
      <span class="dot {$connected ? 'online' : 'offline'}"></span>
      <span>{$connected ? 'Conectado' : 'Conectando...'}</span>
    </div>
    <div class="participants">
      <span>👤 {$participants.length} participante{$participants.length !== 1 ? 's' : ''}</span>
    </div>
  </section>

  {#if $connected}
    <section class="voting-section">
      <h2>Sua Estimativa</h2>

      <div class="cards">
        {#each fibonacciCards as card}
          <button
            class="card"
            class:selected={$myVote === card}
            disabled={$revealed}
            on:click={() => selectCard(card)}
          >
            {card}
          </button>
        {/each}
      </div>

      <div class="voting-status">
        <p>
          <strong>{votedCount}</strong> de <strong>{totalParticipants}</strong> votaram
        </p>

        <div class="action-buttons">
          {#if !$revealed}
            <button
              class="action-btn reveal-btn"
              disabled={!allVoted}
              on:click={handleReveal}
            >
              🎭 Revelar Votos
            </button>
          {:else}
            <button class="action-btn reset-btn" on:click={handleReset}>
              🔄 Nova Rodada
            </button>
          {/if}

          <button
            class="action-btn anonymous-btn"
            on:click={handleToggleAnonymous}
            title={$anonymous ? 'Modo Anônimo (clique para mostrar nomes)' : 'Modo Transparente (clique para ocultar nomes)'}
          >
            {$anonymous ? '🎭 Anônimo' : '👁️ Transparente'}
          </button>
        </div>
      </div>

      {#if $revealed && $votes.length > 0}
        <div class="results">
          <h3>Resultados</h3>

          {#if average !== null}
            <div class="average">
              <span class="label">Média:</span>
              <span class="value">{average.toFixed(1)}</span>
            </div>
          {/if}

          <div class="votes-grid">
            {#each $votes as vote, index}
              <div class="vote-card">
                <div class="vote-user">
                  {#if $anonymous}
                    Participante {index + 1}
                  {:else}
                    {vote.userId === $currentUserId ? 'Você' : vote.userId.slice(0, 8)}
                  {/if}
                </div>
                <div class="vote-value">
                  {vote.value ?? '?'}
                </div>
              </div>
            {/each}
          </div>
        </div>
      {/if}
    </section>
  {/if}

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
    color: #1a1a1a;
  }

  @media (prefers-color-scheme: dark) {
    .status {
      background: #2a2a2a;
      color: #f5f5f5;
    }
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

  .dot.offline {
    background: var(--color-warning);
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

  .voting-section {
    background: var(--color-bg);
    border: 2px solid var(--color-border);
    border-radius: 8px;
    padding: var(--space-xl);
    margin-bottom: var(--space-lg);
  }

  .voting-section h2 {
    margin-bottom: var(--space-lg);
  }

  .cards {
    display: flex;
    gap: var(--space-md);
    justify-content: center;
    flex-wrap: wrap;
    margin-bottom: var(--space-xl);
  }

  .card {
    width: 80px;
    height: 110px;
    background: white;
    border: 2px solid var(--color-border);
    border-radius: 8px;
    font-size: 2rem;
    font-weight: bold;
    cursor: pointer;
    transition: all 0.2s;
    color: #1a1a1a;
  }

  .card:hover:not(:disabled) {
    transform: translateY(-4px);
    border-color: var(--color-primary);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  }

  .card.selected {
    background: var(--color-primary);
    color: white;
    border-color: var(--color-primary);
    transform: translateY(-8px);
  }

  .card:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .voting-status {
    text-align: center;
    margin-bottom: var(--space-lg);
  }

  .voting-status p {
    margin-bottom: var(--space-md);
    font-size: 1.125rem;
  }

  .action-buttons {
    display: flex;
    gap: var(--space-md);
    justify-content: center;
    flex-wrap: wrap;
  }

  .action-btn {
    padding: var(--space-md) var(--space-xl);
    font-size: 1rem;
    font-weight: 600;
    border: none;
    border-radius: 6px;
    cursor: pointer;
    transition: all 0.2s;
  }

  .reveal-btn {
    background: var(--color-success);
    color: white;
  }

  .reveal-btn:hover:not(:disabled) {
    background: #16a34a;
  }

  .reveal-btn:disabled {
    background: #9ca3af;
    cursor: not-allowed;
  }

  .reset-btn {
    background: var(--color-warning);
    color: white;
  }

  .reset-btn:hover {
    background: #ea580c;
  }

  .anonymous-btn {
    background: #6b7280;
    color: white;
  }

  .anonymous-btn:hover {
    background: #4b5563;
  }

  .results {
    margin-top: var(--space-xl);
    padding-top: var(--space-xl);
    border-top: 2px solid var(--color-border);
  }

  .results h3 {
    margin-bottom: var(--space-lg);
    text-align: center;
  }

  .average {
    text-align: center;
    margin-bottom: var(--space-lg);
    padding: var(--space-lg);
    background: #f0fdf4;
    border-radius: 8px;
  }

  @media (prefers-color-scheme: dark) {
    .average {
      background: #064e3b;
    }
  }

  .average .label {
    font-size: 1rem;
    color: #666;
    margin-right: var(--space-sm);
  }

  .average .value {
    font-size: 2.5rem;
    font-weight: bold;
    color: var(--color-success);
  }

  .votes-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
    gap: var(--space-md);
  }

  .vote-card {
    background: white;
    border: 2px solid var(--color-border);
    border-radius: 8px;
    padding: var(--space-md);
    text-align: center;
  }

  @media (prefers-color-scheme: dark) {
    .vote-card {
      background: #2a2a2a;
      color: #f5f5f5;
    }
  }

  .vote-user {
    font-size: 0.875rem;
    color: #666;
    margin-bottom: var(--space-sm);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .vote-value {
    font-size: 2rem;
    font-weight: bold;
    color: var(--color-primary);
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

    .cards {
      gap: var(--space-sm);
    }

    .card {
      width: 60px;
      height: 85px;
      font-size: 1.5rem;
    }

    .votes-grid {
      grid-template-columns: repeat(auto-fill, minmax(100px, 1fr));
    }
  }
</style>
