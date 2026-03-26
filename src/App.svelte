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
    addStory,
    selectStory,
    removeStory,
    setRoomName,
    connected,
    participants,
    votes,
    revealed,
    myVote,
    currentUserId,
    anonymous,
    timer,
    stories,
    currentStoryIndex,
    currentStory,
    estimateHistory,
    roomName
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

  // Carrega nome salvo do localStorage
  let userName = '';
  let hasEnteredName = false;
  let roomNameInput = '';
  let showRoomNameInput = true; // Mostra campo apenas se sala não tiver nome customizado
  let currentTime = Date.now();
  let timerInterval: number | null = null;
  let isEditingName = false;
  let editNameValue = '';
  let showAddStory = false;
  let newStoryTitle = '';
  let newStoryDescription = '';
  let showHistory = false;
  let isEditingRoomName = false;
  let editRoomNameValue = '';
  let expandedStoryId: string | null = null;

  function handleEnterRoom() {
    const name = userName.trim() || 'Anônimo';
    setName(name);
    // Salva nome no localStorage
    if (name !== 'Anônimo') {
      localStorage.setItem('planningpoker-username', name);
    }

    // Define nome da sala se foi fornecido
    if (roomNameInput.trim()) {
      setRoomName(roomNameInput.trim());
    }

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
    // Reseta timer PRIMEIRO para evitar auto-reveal
    resetTimer();

    // Aguarda um tick para garantir que o timer foi resetado
    setTimeout(() => {
      reset();
    }, 50);
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
      // Salva nome no localStorage
      if (newName !== 'Anônimo') {
        localStorage.setItem('planningpoker-username', newName);
      }
    }
    isEditingName = false;
    editNameValue = '';
  }

  function handleAddStory() {
    const title = newStoryTitle.trim();
    if (title) {
      addStory(title, newStoryDescription.trim());
      newStoryTitle = '';
      newStoryDescription = '';
      showAddStory = false;
    }
  }

  function handleSelectStory(index: number) {
    selectStory(index);
  }

  function handleRemoveStory(index: number) {
    if (confirm('Remover esta história?')) {
      removeStory(index);
    }
  }

  function toggleHistory() {
    showHistory = !showHistory;
  }

  function exportJSON() {
    const data = {
      exportedAt: new Date().toISOString(),
      roomId: roomId,
      stories: $stories,
      estimateHistory: $estimateHistory,
      participants: $participants,
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `planning-poker-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  function startEditingRoomName() {
    editRoomNameValue = $roomName;
    isEditingRoomName = true;
  }

  function cancelEditingRoomName() {
    isEditingRoomName = false;
    editRoomNameValue = '';
  }

  function saveRoomName() {
    const newName = editRoomNameValue.trim();
    if (newName) {
      setRoomName(newName);
    }
    isEditingRoomName = false;
    editRoomNameValue = '';
  }

  function toggleStoryDetails(storyId: string) {
    expandedStoryId = expandedStoryId === storyId ? null : storyId;
  }

  // Mapa reativo de histórias estimadas
  $: estimatedStoriesMap = new Map(
    $estimateHistory.map(e => [e.storyId, e])
  );

  function exportCSV() {
    if ($estimateHistory.length === 0) {
      alert('Nenhuma estimativa para exportar!');
      return;
    }

    // Cabeçalho do CSV
    let csv = 'Título,Descrição,Média,Mais Votado,Mínimo,Máximo,Total de Votos,Data/Hora\n';

    // Adiciona cada estimativa
    $estimateHistory.forEach(estimate => {
      const story = $stories.find(s => s.id === estimate.storyId);
      const title = (estimate.storyTitle || '').replace(/"/g, '""');
      const description = (story?.description || '').replace(/"/g, '""');
      const date = new Date(estimate.finishedAt).toLocaleString('pt-BR');

      csv += `"${title}","${description}",${estimate.average?.toFixed(1) || ''},${estimate.mostVoted || ''},${estimate.min || ''},${estimate.max || ''},${estimate.votes.length},"${date}"\n`;
    });

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `planning-poker-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
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

  // Calcula estatísticas dos votos revelados
  $: voteStats = (() => {
    if (!$revealed || $votes.length === 0) return null;
    const values = $votes
      .map(v => v.value)
      .filter((v): v is number => v !== null);
    if (values.length === 0) return null;

    const average = values.reduce((a, b) => a + b, 0) / values.length;
    const min = Math.min(...values);
    const max = Math.max(...values);

    // Calcula moda (mais votado)
    const frequency = new Map<number, number>();
    values.forEach(v => frequency.set(v, (frequency.get(v) || 0) + 1));
    let maxFreq = 0;
    let mostVoted = values[0];
    frequency.forEach((freq, value) => {
      if (freq > maxFreq) {
        maxFreq = freq;
        mostVoted = value;
      }
    });

    return { average, mostVoted, min, max };
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
    // Carrega nome salvo do localStorage
    const savedName = localStorage.getItem('planningpoker-username');
    if (savedName) {
      userName = savedName;
    }

    connect(roomId);

    // Verifica se sala já tem nome customizado após sync
    const unsubscribe = roomName.subscribe((name) => {
      if (name && name !== "Sessão de Planning Poker") {
        showRoomNameInput = false;
      }
    });

    // Update current time every second for timer countdown
    timerInterval = window.setInterval(() => {
      currentTime = Date.now();
    }, 1000);

    return () => {
      unsubscribe();
    };
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

        {#if $roomName && $roomName !== "Sessão de Planning Poker"}
          <div class="room-name-display">
            <span class="room-label">Sala:</span>
            <span class="room-name-text">{$roomName}</span>
          </div>
        {/if}

        <div class="welcome-content">
          <p class="welcome-message">Configure sua sessão:</p>

          <form on:submit|preventDefault={handleEnterRoom}>
            {#if showRoomNameInput}
              <input
                type="text"
                bind:value={roomNameInput}
                placeholder="Nome da sala (opcional)"
                class="name-input"
                maxlength="50"
              />
            {/if}

            <input
              type="text"
              bind:value={userName}
              placeholder="Seu nome"
              class="name-input"
              maxlength="30"
            />

            <button type="submit" class="enter-btn">
              Entrar na Sala
            </button>
          </form>

          <p class="welcome-hint">
            {#if showRoomNameInput}
              O nome da sala ajuda a identificar a sessão. Seu nome será visível no <strong>modo transparente</strong>.
            {:else}
              Seu nome será visível para outros participantes no <strong>modo transparente</strong>.
            {/if}
          </p>
        </div>
      </div>
    </div>
  {:else}
    <!-- Interface principal -->
    <header>
      <div class="header-top">
        <div class="room-name-section">
          {#if !isEditingRoomName}
            <h1 class="room-name" on:click={startEditingRoomName}>{$roomName}</h1>
            <button class="edit-room-btn" on:click={startEditingRoomName} title="Editar nome da sala">
              ✏️
            </button>
          {:else}
            <input
              type="text"
              bind:value={editRoomNameValue}
              class="room-name-input"
              placeholder="Nome da sala"
              maxlength="50"
              on:keydown={(e) => e.key === 'Enter' && saveRoomName()}
            />
            <button class="save-room-btn" on:click={saveRoomName} title="Salvar">✓</button>
            <button class="cancel-room-btn" on:click={cancelEditingRoomName} title="Cancelar">✕</button>
          {/if}
        </div>

        <div class="share-compact">
          <button class="share-btn" on:click={copyToClipboard} title="Copiar link da sala">
            🔗 Compartilhar
          </button>
        </div>
      </div>
    </header>

  <div class="info-bar">
    <div class="info-item">
      <span class="dot {$connected ? 'online' : 'offline'}"></span>
      <span class="info-text">{$connected ? 'Online' : 'Offline'}</span>
    </div>
    <div class="info-item">
      <span class="info-icon">👥</span>
      <span class="info-text">{$participants.length}</span>
    </div>
    <div class="info-item user-info">
      {#if !isEditingName}
        <span class="user-name" on:click={startEditingName}>
          👤 {userName || 'Anônimo'}
        </span>
        <button class="edit-name-btn-small" on:click={startEditingName} title="Editar nome">
          ✏️
        </button>
      {:else}
        <input
          type="text"
          bind:value={editNameValue}
          class="edit-name-input-small"
          placeholder="Seu nome"
          maxlength="30"
          on:keydown={(e) => e.key === 'Enter' && saveNewName()}
        />
        <button class="save-name-btn-small" on:click={saveNewName} title="Salvar">✓</button>
        <button class="cancel-name-btn-small" on:click={cancelEditingName} title="Cancelar">✕</button>
      {/if}
    </div>
  </div>

  {#if $connected}
    <section class="stories-section">
      <div class="stories-header">
        <h2>📋 Backlog</h2>
        <div class="stories-actions">
          <button class="add-story-btn" on:click={() => showAddStory = !showAddStory}>
            ➕ Nova História
          </button>
          <button class="history-btn" on:click={toggleHistory}>
            📊 Histórico ({$estimateHistory.length})
          </button>
          {#if $estimateHistory.length > 0}
            <button class="export-btn" on:click={exportJSON} title="Exportar JSON">
              📥 JSON
            </button>
            <button class="export-btn" on:click={exportCSV} title="Exportar CSV">
              📥 CSV
            </button>
          {/if}
        </div>
      </div>

      {#if showAddStory}
        <div class="add-story-form">
          <input
            type="text"
            bind:value={newStoryTitle}
            placeholder="Título da história..."
            class="story-title-input"
            maxlength="100"
            on:keydown={(e) => e.key === 'Enter' && handleAddStory()}
          />
          <textarea
            bind:value={newStoryDescription}
            placeholder="Descrição (opcional)..."
            class="story-description-input"
            rows="3"
            maxlength="500"
          ></textarea>
          <div class="form-actions">
            <button class="save-story-btn" on:click={handleAddStory}>
              ✓ Adicionar
            </button>
            <button class="cancel-story-btn" on:click={() => { showAddStory = false; newStoryTitle = ''; newStoryDescription = ''; }}>
              ✕ Cancelar
            </button>
          </div>
        </div>
      {/if}

      {#if $currentStory}
        <div class="current-story">
          <div class="current-story-badge">▶️ Estimando agora:</div>
          <div class="current-story-content">
            <h3>{$currentStory.title}</h3>
            {#if $currentStory.description}
              <p>{$currentStory.description}</p>
            {/if}
          </div>
        </div>
      {/if}

      {#if $stories.length > 0}
        <div class="stories-list">
          {#each $stories as story, index}
            {@const estimate = estimatedStoriesMap.get(story.id)}
            <div class="story-item" class:active={index === $currentStoryIndex} class:estimated={!!estimate}>
              <div class="story-content" on:click={() => handleSelectStory(index)}>
                <div class="story-header-row">
                  <div class="story-title">{story.title}</div>
                  {#if estimate}
                    <span class="estimated-badge">✓ Estimada: {estimate.average?.toFixed(1) || '?'}</span>
                  {/if}
                </div>
                {#if story.description}
                  <div class="story-description">{story.description}</div>
                {/if}
              </div>
              <div class="story-actions">
                {#if estimate}
                  <button
                    class="view-estimate-btn"
                    on:click={() => toggleStoryDetails(story.id)}
                    title="Ver votação"
                  >
                    {expandedStoryId === story.id ? '▼' : '👁️'}
                  </button>
                {/if}
                <button class="remove-story-btn" on:click={() => handleRemoveStory(index)} title="Remover">
                  🗑️
                </button>
              </div>
            </div>

            {#if expandedStoryId === story.id && estimate}
              <div class="estimate-details">
                <div class="estimate-stats-compact">
                  <div class="stat-compact">
                    <span class="label">Média:</span>
                    <span class="value">{estimate.average?.toFixed(1)}</span>
                  </div>
                  <div class="stat-compact">
                    <span class="label">Mais votado:</span>
                    <span class="value">{estimate.mostVoted}</span>
                  </div>
                  <div class="stat-compact">
                    <span class="label">Min:</span>
                    <span class="value">{estimate.min}</span>
                  </div>
                  <div class="stat-compact">
                    <span class="label">Max:</span>
                    <span class="value">{estimate.max}</span>
                  </div>
                </div>
                <div class="votes-detail">
                  {#each estimate.votes as vote}
                    {@const participant = $participants.find(p => p.userId === vote.userId)}
                    <div class="vote-detail-item">
                      <span class="voter-name">
                        {participant?.name || 'Participante'}:
                      </span>
                      <span class="vote-value-small">{vote.value ?? '?'}</span>
                    </div>
                  {/each}
                </div>
              </div>
            {/if}
          {/each}
        </div>
      {:else}
        <div class="empty-stories">
          <p>Nenhuma história adicionada ainda.</p>
          <p class="hint">Clique em "Nova História" para começar!</p>
        </div>
      {/if}

      {#if showHistory && $estimateHistory.length > 0}
        <div class="estimate-history">
          <h3>📊 Histórico de Estimativas</h3>
          <div class="history-list">
            {#each $estimateHistory as estimate}
              <div class="history-item">
                <div class="history-header">
                  <span class="history-title">{estimate.storyTitle}</span>
                </div>
                {#if estimate.average !== null}
                  <div class="history-stats">
                    <div class="stat">
                      <span class="stat-label">Média:</span>
                      <span class="stat-value">{estimate.average.toFixed(1)}</span>
                    </div>
                    <div class="stat">
                      <span class="stat-label">Mais votado:</span>
                      <span class="stat-value">{estimate.mostVoted}</span>
                    </div>
                    <div class="stat">
                      <span class="stat-label">Min:</span>
                      <span class="stat-value">{estimate.min}</span>
                    </div>
                    <div class="stat">
                      <span class="stat-label">Max:</span>
                      <span class="stat-value">{estimate.max}</span>
                    </div>
                  </div>
                {:else}
                  <div class="no-votes">Sem votos</div>
                {/if}
                <div class="history-date">
                  {new Date(estimate.finishedAt).toLocaleString('pt-BR')}
                </div>
              </div>
            {/each}
          </div>
        </div>
      {/if}
    </section>

    <section class="timer-section">
      <div class="timer-controls">
        <div class="timer-display" class:expired={timerExpired}>
          <div class="timer-time">
            {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
          </div>
        </div>

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
              ▶️
            </button>
          {:else}
            <button class="timer-btn pause-btn" on:click={handlePauseTimer}>
              ⏸️
            </button>
          {/if}
          <button class="timer-btn reset-btn" on:click={handleResetTimer}>
            🔄
          </button>
        </div>
      </div>
    </section>

    <section class="voting-section">
      <h2>🎴 Votação</h2>

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

          {#if voteStats !== null}
            <div class="stats-grid">
              <div class="stat-box average-box">
                <span class="stat-label">Média</span>
                <span class="stat-value">{voteStats.average.toFixed(1)}</span>
              </div>
              <div class="stat-box">
                <span class="stat-label">Mais Votado</span>
                <span class="stat-value">{voteStats.mostVoted}</span>
              </div>
              <div class="stat-box">
                <span class="stat-label">Mínimo</span>
                <span class="stat-value">{voteStats.min}</span>
              </div>
              <div class="stat-box">
                <span class="stat-label">Máximo</span>
                <span class="stat-value">{voteStats.max}</span>
              </div>
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
    margin-bottom: var(--space-lg);
  }

  .room-name-display {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
    padding: var(--space-md) var(--space-lg);
    border-radius: 8px;
    margin-bottom: var(--space-lg);
    text-align: center;
  }

  .room-label {
    font-size: 0.875rem;
    opacity: 0.9;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }

  .room-name-text {
    display: block;
    font-size: 1.5rem;
    font-weight: 700;
    margin-top: var(--space-xs);
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
    margin-bottom: var(--space-lg);
  }

  .header-top {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: var(--space-lg);
    padding: var(--space-lg);
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    border-radius: 12px;
    color: white;
    flex-wrap: wrap;
  }

  .room-name-section {
    display: flex;
    align-items: center;
    gap: var(--space-sm);
    flex: 1;
  }

  .room-name {
    font-size: 1.75rem;
    font-weight: 700;
    margin: 0;
    cursor: pointer;
    transition: opacity 0.2s;
  }

  .room-name:hover {
    opacity: 0.9;
  }

  .edit-room-btn,
  .save-room-btn,
  .cancel-room-btn {
    padding: var(--space-xs) var(--space-sm);
    background: rgba(255, 255, 255, 0.2);
    border: 1px solid rgba(255, 255, 255, 0.3);
    border-radius: 6px;
    cursor: pointer;
    color: white;
    font-size: 0.875rem;
    transition: all 0.2s;
  }

  .edit-room-btn:hover,
  .save-room-btn:hover,
  .cancel-room-btn:hover {
    background: rgba(255, 255, 255, 0.3);
  }

  .room-name-input {
    flex: 1;
    padding: var(--space-sm) var(--space-md);
    border: 2px solid rgba(255, 255, 255, 0.5);
    border-radius: 8px;
    font-size: 1.5rem;
    font-weight: 700;
    background: rgba(255, 255, 255, 0.15);
    color: white;
  }

  .room-name-input::placeholder {
    color: rgba(255, 255, 255, 0.6);
  }

  .room-name-input:focus {
    outline: none;
    border-color: white;
    background: rgba(255, 255, 255, 0.25);
  }

  .share-compact {
    display: flex;
    gap: var(--space-sm);
  }

  .share-btn {
    padding: var(--space-sm) var(--space-lg);
    background: rgba(255, 255, 255, 0.2);
    border: 2px solid rgba(255, 255, 255, 0.3);
    border-radius: 8px;
    color: white;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s;
  }

  .share-btn:hover {
    background: rgba(255, 255, 255, 0.3);
    transform: translateY(-2px);
  }

  /* Info Bar */
  .info-bar {
    display: flex;
    gap: var(--space-lg);
    padding: var(--space-md);
    background: #f9fafb;
    border-radius: 8px;
    margin-bottom: var(--space-lg);
    align-items: center;
    flex-wrap: wrap;
  }

  @media (prefers-color-scheme: dark) {
    .info-bar {
      background: #2a2a2a;
    }
  }

  .info-item {
    display: flex;
    align-items: center;
    gap: var(--space-xs);
  }

  .info-icon {
    font-size: 1.125rem;
  }

  .info-text {
    font-size: 0.875rem;
    font-weight: 600;
    color: #1a1a1a;
  }

  @media (prefers-color-scheme: dark) {
    .info-text {
      color: #f5f5f5;
    }
  }

  .user-info {
    margin-left: auto;
  }

  .user-name {
    font-weight: 600;
    cursor: pointer;
    transition: opacity 0.2s;
  }

  .user-name:hover {
    opacity: 0.7;
  }

  .edit-name-btn-small {
    padding: 2px 6px;
    background: transparent;
    border: 1px solid var(--color-border);
    border-radius: 4px;
    cursor: pointer;
    font-size: 0.75rem;
    transition: all 0.2s;
  }

  .edit-name-btn-small:hover {
    background: var(--color-primary);
    color: white;
    border-color: var(--color-primary);
  }

  .edit-name-input-small {
    padding: 4px 8px;
    border: 2px solid var(--color-primary);
    border-radius: 4px;
    font-size: 0.875rem;
    width: 120px;
  }

  .save-name-btn-small,
  .cancel-name-btn-small {
    padding: 4px 8px;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    font-size: 0.75rem;
    font-weight: 600;
    transition: all 0.2s;
  }

  .save-name-btn-small {
    background: var(--color-success);
    color: white;
  }

  .save-name-btn-small:hover {
    background: #16a34a;
  }

  .cancel-name-btn-small {
    background: #6b7280;
    color: white;
  }

  .cancel-name-btn-small:hover {
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
    display: flex;
    align-items: center;
    justify-content: center;
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

  .stats-grid {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: var(--space-md);
    margin-bottom: var(--space-xl);
  }

  .stat-box {
    text-align: center;
    padding: var(--space-lg);
    background: #f9fafb;
    border-radius: 8px;
    border: 2px solid var(--color-border);
  }

  @media (prefers-color-scheme: dark) {
    .stat-box {
      background: #2a2a2a;
    }
  }

  .stat-box.average-box {
    background: #f0fdf4;
    border-color: var(--color-success);
  }

  @media (prefers-color-scheme: dark) {
    .stat-box.average-box {
      background: #064e3b;
    }
  }

  .stat-box .stat-label {
    display: block;
    font-size: 0.875rem;
    color: #666;
    font-weight: 600;
    text-transform: uppercase;
    margin-bottom: var(--space-sm);
  }

  .stat-box .stat-value {
    display: block;
    font-size: 2.5rem;
    font-weight: bold;
    color: var(--color-primary);
  }

  .stat-box.average-box .stat-value {
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

  /* Stories Section */
  .stories-section {
    background: var(--color-bg);
    border: 2px solid var(--color-border);
    border-radius: 8px;
    padding: var(--space-md);
    margin-bottom: var(--space-lg);
  }

  .stories-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: var(--space-md);
    flex-wrap: wrap;
    gap: var(--space-sm);
  }

  .stories-header h2 {
    margin: 0;
    font-size: 1.125rem;
  }

  .stories-actions {
    display: flex;
    gap: var(--space-sm);
  }

  .add-story-btn,
  .history-btn,
  .export-btn {
    padding: var(--space-sm) var(--space-md);
    background: var(--color-primary);
    color: white;
    border: none;
    border-radius: 6px;
    cursor: pointer;
    font-weight: 600;
    font-size: 0.875rem;
    transition: all 0.2s;
  }

  .add-story-btn:hover,
  .history-btn:hover,
  .export-btn:hover {
    background: var(--color-primary-hover);
  }

  .export-btn {
    background: #10b981;
  }

  .export-btn:hover {
    background: #059669;
  }

  .add-story-form {
    background: #f9fafb;
    padding: var(--space-md);
    border-radius: 6px;
    margin-bottom: var(--space-md);
  }

  @media (prefers-color-scheme: dark) {
    .add-story-form {
      background: #2a2a2a;
    }
  }

  .story-title-input,
  .story-description-input {
    width: 100%;
    padding: var(--space-sm);
    border: 2px solid var(--color-border);
    border-radius: 6px;
    font-size: 0.875rem;
    margin-bottom: var(--space-sm);
  }

  .story-title-input:focus,
  .story-description-input:focus {
    outline: none;
    border-color: var(--color-primary);
  }

  .story-description-input {
    resize: vertical;
    font-family: inherit;
  }

  .form-actions {
    display: flex;
    gap: var(--space-sm);
  }

  .save-story-btn,
  .cancel-story-btn {
    padding: var(--space-sm) var(--space-md);
    border: none;
    border-radius: 6px;
    cursor: pointer;
    font-weight: 600;
    transition: all 0.2s;
  }

  .save-story-btn {
    background: var(--color-success);
    color: white;
  }

  .save-story-btn:hover {
    background: #16a34a;
  }

  .cancel-story-btn {
    background: #6b7280;
    color: white;
  }

  .cancel-story-btn:hover {
    background: #4b5563;
  }

  .current-story {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
    padding: var(--space-md);
    border-radius: 6px;
    margin-bottom: var(--space-md);
  }

  .current-story-badge {
    font-size: 0.75rem;
    font-weight: 600;
    margin-bottom: var(--space-xs);
    opacity: 0.9;
    text-transform: uppercase;
  }

  .current-story-content h3 {
    margin: 0 0 var(--space-xs) 0;
    font-size: 1.125rem;
  }

  .current-story-content p {
    margin: 0;
    opacity: 0.95;
    line-height: 1.4;
    font-size: 0.875rem;
  }

  .stories-list {
    display: flex;
    flex-direction: column;
    gap: var(--space-sm);
  }

  .story-item {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: var(--space-sm);
    background: white;
    border: 1px solid var(--color-border);
    border-radius: 4px;
    transition: all 0.2s;
  }

  @media (prefers-color-scheme: dark) {
    .story-item {
      background: #2a2a2a;
    }
  }

  .story-item:hover {
    border-color: var(--color-primary);
    transform: translateX(2px);
  }

  .story-item.active {
    border-color: var(--color-primary);
    background: #f0f4ff;
    border-width: 2px;
  }

  @media (prefers-color-scheme: dark) {
    .story-item.active {
      background: #1e293b;
    }
  }

  .story-item.estimated {
    background: #f0fdf4;
  }

  @media (prefers-color-scheme: dark) {
    .story-item.estimated {
      background: #064e3b;
    }
  }

  .story-item.estimated.active {
    background: #e0f2fe;
  }

  @media (prefers-color-scheme: dark) {
    .story-item.estimated.active {
      background: #0c4a6e;
    }
  }

  .story-content {
    flex: 1;
    cursor: pointer;
  }

  .story-header-row {
    display: flex;
    align-items: center;
    gap: var(--space-xs);
    margin-bottom: 2px;
    flex-wrap: wrap;
  }

  .story-title {
    font-weight: 600;
    font-size: 0.875rem;
  }

  .estimated-badge {
    font-size: 0.625rem;
    font-weight: 600;
    padding: 2px 6px;
    background: var(--color-success);
    color: white;
    border-radius: 3px;
    white-space: nowrap;
  }

  .story-description {
    font-size: 0.75rem;
    color: #666;
    line-height: 1.3;
  }

  @media (prefers-color-scheme: dark) {
    .story-description {
      color: #9ca3af;
    }
  }

  .story-actions {
    display: flex;
    gap: 4px;
    align-items: center;
  }

  .view-estimate-btn,
  .remove-story-btn {
    padding: 4px 8px;
    background: transparent;
    border: 1px solid var(--color-border);
    border-radius: 4px;
    cursor: pointer;
    transition: all 0.2s;
    font-size: 0.75rem;
  }

  .view-estimate-btn:hover {
    background: #e0f2fe;
    border-color: var(--color-primary);
  }

  .remove-story-btn:hover {
    background: #fee;
    border-color: #ef4444;
  }

  .estimate-details {
    padding: var(--space-sm);
    background: #f9fafb;
    border: 1px solid var(--color-border);
    border-radius: 4px;
    margin-top: 4px;
    margin-bottom: var(--space-sm);
  }

  @media (prefers-color-scheme: dark) {
    .estimate-details {
      background: #1a1a1a;
    }
  }

  .estimate-stats-compact {
    display: flex;
    gap: var(--space-md);
    margin-bottom: var(--space-sm);
    flex-wrap: wrap;
  }

  .stat-compact {
    display: flex;
    gap: 4px;
    font-size: 0.75rem;
  }

  .stat-compact .label {
    color: #666;
    font-weight: 600;
  }

  .stat-compact .value {
    color: var(--color-success);
    font-weight: bold;
  }

  .votes-detail {
    display: flex;
    flex-wrap: wrap;
    gap: var(--space-xs);
  }

  .vote-detail-item {
    display: flex;
    align-items: center;
    gap: 4px;
    padding: 4px 8px;
    background: white;
    border: 1px solid var(--color-border);
    border-radius: 4px;
    font-size: 0.75rem;
  }

  @media (prefers-color-scheme: dark) {
    .vote-detail-item {
      background: #2a2a2a;
    }
  }

  .voter-name {
    color: #666;
  }

  .vote-value-small {
    font-weight: bold;
    color: var(--color-primary);
  }

  .empty-stories {
    text-align: center;
    padding: var(--space-lg);
    color: #666;
  }

  .empty-stories p {
    margin: var(--space-xs) 0;
    font-size: 0.875rem;
  }

  .estimate-history {
    margin-top: var(--space-lg);
    padding-top: var(--space-lg);
    border-top: 2px solid var(--color-border);
  }

  .estimate-history h3 {
    margin-bottom: var(--space-md);
    font-size: 1rem;
  }

  .history-list {
    display: flex;
    flex-direction: column;
    gap: var(--space-sm);
  }

  .history-item {
    padding: var(--space-sm);
    background: #f9fafb;
    border-radius: 4px;
    border-left: 3px solid var(--color-success);
  }

  @media (prefers-color-scheme: dark) {
    .history-item {
      background: #2a2a2a;
    }
  }

  .history-header {
    margin-bottom: var(--space-sm);
  }

  .history-title {
    font-weight: 600;
    font-size: 0.875rem;
  }

  .history-stats {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: var(--space-xs);
    margin-bottom: var(--space-sm);
  }

  .stat {
    display: flex;
    flex-direction: column;
    gap: 2px;
  }

  .stat-label {
    font-size: 0.625rem;
    color: #666;
    font-weight: 600;
    text-transform: uppercase;
  }

  .stat-value {
    font-size: 1rem;
    font-weight: bold;
    color: var(--color-primary);
  }

  .no-votes {
    color: #666;
    font-style: italic;
    margin-bottom: var(--space-sm);
  }

  .history-date {
    font-size: 0.625rem;
    color: #666;
  }

  /* Timer Section */
  .timer-section {
    position: fixed;
    bottom: var(--space-lg);
    right: var(--space-lg);
    z-index: 100;
    background: white;
    border: 2px solid var(--color-border);
    border-radius: 12px;
    padding: var(--space-md);
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
  }

  @media (prefers-color-scheme: dark) {
    .timer-section {
      background: #1a1a1a;
      border-color: #404040;
    }
  }

  .timer-section h2 {
    margin: 0 0 var(--space-sm) 0;
    font-size: 1rem;
    text-align: center;
    font-weight: 600;
  }

  .timer-display {
    text-align: center;
    padding: var(--space-sm);
    background: #f9fafb;
    border-radius: 8px;
    border: 2px solid var(--color-border);
    width: 100%;
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
    font-size: 1.5rem;
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
    gap: var(--space-sm);
    align-items: center;
  }

  .timer-durations {
    display: flex;
    gap: 4px;
    justify-content: center;
    flex-wrap: wrap;
    width: 100%;
  }

  .duration-btn {
    padding: 4px 8px;
    background: white;
    color: #1a1a1a;
    border: 1px solid var(--color-border);
    border-radius: 4px;
    cursor: pointer;
    font-weight: 600;
    font-size: 0.75rem;
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
    transform: translateY(-1px);
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
    gap: var(--space-sm);
    justify-content: center;
    flex-wrap: wrap;
    width: 100%;
  }

  .timer-btn {
    padding: var(--space-xs) var(--space-md);
    font-size: 0.875rem;
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

  button {
    padding: var(--space-md) var(--space-lg);
    background: var(--color-primary);
    color: white;
    border: none;
    border-radius: 6px;
    cursor: pointer;
    font-weight: 600;
    transition: all 0.2s;
  }

  button:hover {
    background: var(--color-primary-hover);
  }

  input {
    padding: var(--space-md);
    border: 2px solid var(--color-border);
    border-radius: 6px;
    font-size: 1rem;
  }

  input:focus {
    outline: none;
    border-color: var(--color-primary);
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

    .header-top {
      flex-direction: column;
      align-items: stretch;
    }

    .room-name {
      font-size: 1.5rem;
    }

    .room-name-input {
      font-size: 1.25rem;
    }

    .share-compact {
      width: 100%;
    }

    .share-btn {
      width: 100%;
      text-align: center;
    }

    .info-bar {
      flex-direction: column;
      align-items: flex-start;
      gap: var(--space-sm);
    }

    .user-info {
      margin-left: 0;
      width: 100%;
    }

    .edit-name-input-small {
      width: 100%;
    }

    .cards {
      gap: var(--space-sm);
    }

    .card {
      width: 60px;
      height: 85px;
      font-size: 1.5rem;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .votes-grid {
      grid-template-columns: repeat(auto-fill, minmax(100px, 1fr));
    }

    .timer-section {
      bottom: var(--space-sm);
      right: var(--space-sm);
      left: var(--space-sm);
      padding: var(--space-sm);
    }

    .timer-time {
      font-size: 1.25rem;
    }

    .participants-status {
      padding: var(--space-sm);
    }

    .participant-item {
      font-size: 0.8rem;
      padding: var(--space-xs) var(--space-sm);
    }

    .stories-header {
      flex-direction: column;
      align-items: flex-start;
    }

    .stories-actions {
      width: 100%;
      flex-wrap: wrap;
    }

    .add-story-btn,
    .history-btn {
      flex: 1;
      min-width: 120px;
    }

    .export-btn {
      flex: 0 1 auto;
    }

    .current-story-content h3 {
      font-size: 1.25rem;
    }

    .estimate-stats-compact {
      flex-direction: column;
      gap: var(--space-xs);
    }

    .history-header {
      flex-direction: column;
      align-items: flex-start;
    }

    .stats-grid {
      grid-template-columns: repeat(2, 1fr);
    }

    .stat-box .stat-value {
      font-size: 2rem;
    }

    .history-stats {
      grid-template-columns: repeat(2, 1fr);
    }

    .stat-value {
      font-size: 1rem;
    }
  }
</style>
