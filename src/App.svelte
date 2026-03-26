<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import {
    connect,
    disconnect,
    vote,
    reveal,
    reset,
    toggleAnonymous,
    setName,
    startTimer,
    pauseTimer,
    resetTimer,
    setTimerDuration,
    connected,
    participants,
    votes,
    revealed,
    myVote,
    currentUserId,
    anonymous,
    timer
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

  let userName = '';
  let hasEnteredName = false;
  let currentTime = Date.now();
  let timerInterval: number | null = null;
  let isEditingName = false;
  let editNameValue = '';

  function handleEnterRoom() {
    const name = userName.trim() || 'Anônimo';
    setName(name);
    hasEnteredName = true;
  }

  function copyToClipboard() {
    navigator.clipboard.writeText(shareUrl);
    alert('Link copiado!');
  }

  function selectCard(value: number) {
    // Se clicar no card já selecionado, desmarca
    if ($myVote === value) {
      vote(null);
    } else {
      vote(value);
    }
  }

  function handleReveal() {
    reveal();
  }

  function handleReset() {
    reset();
    resetTimer();
  }

  function handleToggleAnonymous() {
    toggleAnonymous();
  }

  function handleStartTimer() {
    startTimer();
  }

  function handlePauseTimer() {
    pauseTimer();
  }

  function handleResetTimer() {
    resetTimer();
  }

  function handleSetTimerDuration(duration: number) {
    setTimerDuration(duration);
  }

  function startEditingName() {
    const currentUser = $participants.find(p => p.userId === $currentUserId);
    editNameValue = currentUser?.name || '';
    isEditingName = true;
  }

  function cancelEditingName() {
    isEditingName = false;
    editNameValue = '';
  }

  function saveNewName() {
    const newName = editNameValue.trim();
    if (newName) {
      setName(newName);
      userName = newName;
    }
    isEditingName = false;
    editNameValue = '';
  }

  // Conta quantos participantes já votaram
  $: votedCount = $votes.length;
  $: totalParticipants = $participants.length;
  $: allVoted = votedCount === totalParticipants && totalParticipants > 0;

  // Mapeia participantes com status de votação
  $: participantsWithVotes = $participants.map((participant) => ({
    ...participant,
    hasVoted: $votes.some((vote) => vote.userId === participant.userId),
  }));

  // Calcula média dos votos revelados
  $: average = (() => {
    if (!$revealed || $votes.length === 0) return null;
    const values = $votes
      .map(v => v.value)
      .filter((v): v is number => v !== null);
    if (values.length === 0) return null;
    return values.reduce((a, b) => a + b, 0) / values.length;
  })();

  // Calcula tempo restante do timer
  $: remainingTime = (() => {
    // currentTime força re-renderização a cada segundo, mas usamos Date.now() para precisão
    void currentTime;

    if (!$timer.isRunning || $timer.startTime === null) {
      return $timer.duration;
    }
    const elapsed = Math.floor((Date.now() - $timer.startTime) / 1000);
    const remaining = Math.max(0, $timer.duration - elapsed);
    return remaining;
  })();

  $: minutes = Math.floor(remainingTime / 60);
  $: seconds = remainingTime % 60;
  $: timerExpired = remainingTime === 0 && $timer.isRunning;

  // Auto-reveal quando o timer expira
  let lastTimerExpiredState = false;
  $: {
    if (timerExpired && !$revealed && !lastTimerExpiredState) {
      lastTimerExpiredState = true;
      reveal();
    } else if (!timerExpired) {
      lastTimerExpiredState = false;
    }
  }

  // Connect to WebSocket on mount
  onMount(() => {
    connect(roomId);

    // Update current time every second for timer countdown
    timerInterval = window.setInterval(() => {
      currentTime = Date.now();
    }, 1000);
  });

  // Disconnect on unmount
  onDestroy(() => {
    disconnect();
    if (timerInterval !== null) {
      clearInterval(timerInterval);
    }
  });
</script>

<main>
  {#if !hasEnteredName}
    <!-- Tela de boas-vindas -->
    <div class="welcome-screen">
      <div class="welcome-card">
        <h1>🃏 Planning Poker</h1>
        <p class="welcome-subtitle">Estimativas ágeis em tempo real</p>

        <div class="welcome-content">
          <p class="welcome-message">Bem-vindo! Antes de entrar na sala, nos diga seu nome:</p>

          <form on:submit|preventDefault={handleEnterRoom}>
            <input
              type="text"
              bind:value={userName}
              placeholder="Digite seu nome..."
              class="name-input"
              maxlength="30"
            />

            <button type="submit" class="enter-btn">
              Entrar na Sala
            </button>
          </form>

          <p class="welcome-hint">
            Seu nome será visível para outros participantes no <strong>modo transparente</strong>.
          </p>
        </div>
      </div>
    </div>
  {:else}
    <!-- Interface principal -->
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
    <div class="status-right">
      <div class="user-info">
        {#if !isEditingName}
          <span class="user-name">
            👤 {userName || 'Anônimo'}
          </span>
          <button class="edit-name-btn" on:click={startEditingName} title="Editar nome">
            ✏️
          </button>
        {:else}
          <input
            type="text"
            bind:value={editNameValue}
            class="edit-name-input"
            placeholder="Seu nome"
            maxlength="30"
            on:keydown={(e) => e.key === 'Enter' && saveNewName()}
          />
          <button class="save-name-btn" on:click={saveNewName} title="Salvar">
            ✓
          </button>
          <button class="cancel-name-btn" on:click={cancelEditingName} title="Cancelar">
            ✕
          </button>
        {/if}
      </div>
      <div class="participants">
        <span>{$participants.length} participante{$participants.length !== 1 ? 's' : ''}</span>
      </div>
    </div>
  </section>

  {#if $connected}
    <section class="timer-section">
      <h2>Timer</h2>

      <div class="timer-display" class:expired={timerExpired}>
        <div class="timer-time">
          {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
        </div>
      </div>

      <div class="timer-controls">
        <div class="timer-durations">
          <button
            class="duration-btn"
            class:active={$timer.duration === 10 && !$timer.isRunning}
            on:click={() => handleSetTimerDuration(10)}
            disabled={$timer.isRunning}
          >
            10s
          </button>
          <button
            class="duration-btn"
            class:active={$timer.duration === 20 && !$timer.isRunning}
            on:click={() => handleSetTimerDuration(20)}
            disabled={$timer.isRunning}
          >
            20s
          </button>
          <button
            class="duration-btn"
            class:active={$timer.duration === 30 && !$timer.isRunning}
            on:click={() => handleSetTimerDuration(30)}
            disabled={$timer.isRunning}
          >
            30s
          </button>
          <button
            class="duration-btn"
            class:active={$timer.duration === 60 && !$timer.isRunning}
            on:click={() => handleSetTimerDuration(60)}
            disabled={$timer.isRunning}
          >
            1m
          </button>
          <button
            class="duration-btn"
            class:active={$timer.duration === 120 && !$timer.isRunning}
            on:click={() => handleSetTimerDuration(120)}
            disabled={$timer.isRunning}
          >
            2m
          </button>
        </div>

        <div class="timer-actions">
          {#if !$timer.isRunning}
            <button class="timer-btn start-btn" on:click={handleStartTimer}>
              ▶️ Iniciar
            </button>
          {:else}
            <button class="timer-btn pause-btn" on:click={handlePauseTimer}>
              ⏸️ Pausar
            </button>
          {/if}
          <button class="timer-btn reset-btn" on:click={handleResetTimer}>
            🔄 Resetar
          </button>
        </div>
      </div>
    </section>

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

        {#if !$revealed && totalParticipants > 0}
          <div class="participants-status">
            {#each participantsWithVotes as participant}
              <div class="participant-item" class:voted={participant.hasVoted}>
                <span class="vote-indicator">
                  {participant.hasVoted ? '✓' : '○'}
                </span>
                <span class="participant-name">
                  {#if participant.userId === $currentUserId}
                    Você
                  {:else if $anonymous}
                    Participante
                  {:else}
                    {participant.name || 'Anônimo'}
                  {/if}
                </span>
              </div>
            {/each}
          </div>
        {/if}

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
              {@const participant = $participants.find(p => p.userId === vote.userId)}
              <div class="vote-card">
                <div class="vote-user">
                  {#if $anonymous}
                    Participante {index + 1}
                  {:else if vote.userId === $currentUserId}
                    Você
                  {:else}
                    {participant?.name || 'Anônimo'}
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
  {/if}
</main>

<style>
  main {
    max-width: 800px;
    margin: 0 auto;
    padding: var(--space-xl);
  }

  /* Tela de boas-vindas */
  .welcome-screen {
    min-height: 100vh;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: var(--space-xl);
  }

  .welcome-card {
    background: var(--color-bg);
    border: 2px solid var(--color-border);
    border-radius: 12px;
    padding: var(--space-xl);
    max-width: 500px;
    width: 100%;
    text-align: center;
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
  }

  .welcome-card h1 {
    font-size: 3rem;
    margin-bottom: var(--space-sm);
  }

  .welcome-subtitle {
    color: #666;
    font-size: 1.125rem;
    margin-bottom: var(--space-xl);
  }

  .welcome-content {
    margin-top: var(--space-xl);
  }

  .welcome-message {
    font-size: 1.125rem;
    margin-bottom: var(--space-lg);
    color: #1a1a1a;
  }

  @media (prefers-color-scheme: dark) {
    .welcome-message {
      color: #f5f5f5;
    }
  }

  .name-input {
    width: 100%;
    padding: var(--space-lg);
    font-size: 1.125rem;
    border: 2px solid var(--color-border);
    border-radius: 8px;
    margin-bottom: var(--space-md);
    text-align: center;
    transition: border-color 0.2s;
  }

  .name-input:focus {
    outline: none;
    border-color: var(--color-primary);
  }

  .enter-btn {
    width: 100%;
    padding: var(--space-lg);
    font-size: 1.125rem;
    font-weight: 600;
    background: var(--color-primary);
    color: white;
    border: none;
    border-radius: 8px;
    cursor: pointer;
    transition: background 0.2s;
  }

  .enter-btn:hover {
    background: var(--color-primary-hover);
  }

  .welcome-hint {
    margin-top: var(--space-lg);
    font-size: 0.875rem;
    color: #666;
    line-height: 1.5;
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

  .status-right {
    display: flex;
    align-items: center;
    gap: var(--space-md);
  }

  .user-info {
    display: flex;
    align-items: center;
    gap: var(--space-xs);
  }

  .user-name {
    font-weight: 600;
  }

  .edit-name-btn {
    padding: var(--space-xs);
    background: transparent;
    border: 1px solid var(--color-border);
    border-radius: 4px;
    cursor: pointer;
    font-size: 0.875rem;
    transition: all 0.2s;
  }

  .edit-name-btn:hover {
    background: var(--color-bg);
    border-color: var(--color-primary);
  }

  .edit-name-input {
    padding: var(--space-xs) var(--space-sm);
    border: 2px solid var(--color-primary);
    border-radius: 4px;
    font-size: 0.875rem;
    width: 150px;
  }

  .save-name-btn,
  .cancel-name-btn {
    padding: var(--space-xs) var(--space-sm);
    border: none;
    border-radius: 4px;
    cursor: pointer;
    font-size: 0.875rem;
    font-weight: 600;
    transition: all 0.2s;
  }

  .save-name-btn {
    background: var(--color-success);
    color: white;
  }

  .save-name-btn:hover {
    background: #16a34a;
  }

  .cancel-name-btn {
    background: #6b7280;
    color: white;
  }

  .cancel-name-btn:hover {
    background: #4b5563;
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

  .participants-status {
    display: flex;
    flex-wrap: wrap;
    gap: var(--space-sm);
    justify-content: center;
    margin-bottom: var(--space-lg);
    padding: var(--space-md);
    background: #f9fafb;
    border-radius: 8px;
  }

  @media (prefers-color-scheme: dark) {
    .participants-status {
      background: #2a2a2a;
    }
  }

  .participant-item {
    display: flex;
    align-items: center;
    gap: var(--space-xs);
    padding: var(--space-xs) var(--space-md);
    background: white;
    border: 2px solid #e5e7eb;
    border-radius: 6px;
    font-size: 0.875rem;
    transition: all 0.2s;
  }

  @media (prefers-color-scheme: dark) {
    .participant-item {
      background: #1a1a1a;
      border-color: #404040;
    }
  }

  .participant-item.voted {
    border-color: var(--color-success);
    background: #f0fdf4;
  }

  @media (prefers-color-scheme: dark) {
    .participant-item.voted {
      background: #064e3b;
      border-color: var(--color-success);
    }
  }

  .vote-indicator {
    font-weight: bold;
    font-size: 1rem;
  }

  .participant-item.voted .vote-indicator {
    color: var(--color-success);
  }

  .participant-item:not(.voted) .vote-indicator {
    color: #9ca3af;
  }

  .participant-name {
    color: #1a1a1a;
  }

  @media (prefers-color-scheme: dark) {
    .participant-name {
      color: #f5f5f5;
    }
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

  /* Timer Section */
  .timer-section {
    background: var(--color-bg);
    border: 2px solid var(--color-border);
    border-radius: 8px;
    padding: var(--space-xl);
    margin-bottom: var(--space-lg);
  }

  .timer-section h2 {
    margin-bottom: var(--space-lg);
    text-align: center;
  }

  .timer-display {
    text-align: center;
    margin-bottom: var(--space-lg);
    padding: var(--space-xl);
    background: #f9fafb;
    border-radius: 12px;
    border: 3px solid var(--color-border);
  }

  @media (prefers-color-scheme: dark) {
    .timer-display {
      background: #2a2a2a;
    }
  }

  .timer-display.expired {
    background: #fee;
    border-color: #ef4444;
    animation: blink 1s infinite;
  }

  @media (prefers-color-scheme: dark) {
    .timer-display.expired {
      background: #7f1d1d;
    }
  }

  @keyframes blink {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.7; }
  }

  .timer-time {
    font-size: 4rem;
    font-weight: bold;
    font-family: var(--font-mono);
    color: var(--color-primary);
  }

  .timer-display.expired .timer-time {
    color: #ef4444;
  }

  .timer-controls {
    display: flex;
    flex-direction: column;
    gap: var(--space-lg);
  }

  .timer-durations {
    display: flex;
    gap: var(--space-sm);
    justify-content: center;
    flex-wrap: wrap;
  }

  .duration-btn {
    padding: var(--space-sm) var(--space-md);
    background: white;
    color: #1a1a1a;
    border: 2px solid var(--color-border);
    border-radius: 6px;
    cursor: pointer;
    font-weight: 600;
    transition: all 0.2s;
  }

  @media (prefers-color-scheme: dark) {
    .duration-btn {
      background: #2a2a2a;
      color: #f5f5f5;
    }
  }

  .duration-btn:hover:not(:disabled) {
    border-color: var(--color-primary);
    transform: translateY(-2px);
  }

  .duration-btn.active {
    background: var(--color-primary);
    color: white;
    border-color: var(--color-primary);
  }

  .duration-btn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .timer-actions {
    display: flex;
    gap: var(--space-md);
    justify-content: center;
    flex-wrap: wrap;
  }

  .timer-btn {
    padding: var(--space-md) var(--space-xl);
    font-size: 1rem;
    font-weight: 600;
    border: none;
    border-radius: 6px;
    cursor: pointer;
    transition: all 0.2s;
  }

  .start-btn {
    background: var(--color-success);
    color: white;
  }

  .start-btn:hover {
    background: #16a34a;
  }

  .pause-btn {
    background: #f59e0b;
    color: white;
  }

  .pause-btn:hover {
    background: #d97706;
  }

  .timer-btn.reset-btn {
    background: #6b7280;
    color: white;
  }

  .timer-btn.reset-btn:hover {
    background: #4b5563;
  }

  @media (max-width: 640px) {
    main {
      padding: var(--space-md);
    }

    .welcome-screen {
      padding: var(--space-md);
    }

    .welcome-card {
      padding: var(--space-lg);
    }

    .welcome-card h1 {
      font-size: 2.5rem;
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

    .status-right {
      flex-direction: column;
      align-items: flex-start;
      width: 100%;
      gap: var(--space-sm);
    }

    .edit-name-input {
      width: 100%;
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

    .timer-time {
      font-size: 3rem;
    }

    .timer-durations {
      gap: var(--space-xs);
    }

    .duration-btn {
      padding: var(--space-xs) var(--space-sm);
      font-size: 0.875rem;
    }

    .participants-status {
      padding: var(--space-sm);
    }

    .participant-item {
      font-size: 0.8rem;
      padding: var(--space-xs) var(--space-sm);
    }
  }
</style>
