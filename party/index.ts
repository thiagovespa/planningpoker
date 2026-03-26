import type * as Party from "partykit/server";

interface Vote {
  userId: string;
  value: number | null;
  revealed: boolean;
}

interface Participant {
  userId: string;
  name: string;
}

interface TimerState {
  duration: number; // em segundos
  startTime: number | null; // timestamp
  isRunning: boolean;
}

interface Story {
  id: string;
  title: string;
  description: string;
  createdAt: number;
}

interface EstimateResult {
  storyId: string;
  storyTitle: string;
  votes: Vote[];
  average: number | null;
  mostVoted: number | null; // moda
  min: number | null;
  max: number | null;
  finishedAt: number;
}

export default class PlanningPokerServer implements Party.Server {
  votes: Map<string, Vote>;
  participants: Map<string, Participant>;
  revealed: boolean;
  anonymous: boolean;
  timer: TimerState;
  stories: Story[];
  currentStoryIndex: number;
  estimateHistory: EstimateResult[];
  roomName: string;

  constructor(readonly room: Party.Room) {
    this.votes = new Map();
    this.participants = new Map();
    this.revealed = false;
    this.anonymous = true; // Default: modo anônimo (segurança psicológica)
    this.timer = {
      duration: 20, // 20 segundos default
      startTime: null,
      isRunning: false,
    };
    this.stories = [];
    this.currentStoryIndex = -1; // -1 = nenhuma história selecionada
    this.estimateHistory = [];
    this.roomName = "Sessão de Planning Poker";
  }

  onConnect(conn: Party.Connection) {
    console.log(`User ${conn.id} connected to room ${this.room.id}`);

    // Adiciona participante na lista (sem nome ainda)
    this.participants.set(conn.id, {
      userId: conn.id,
      name: "",
    });

    // Envia estado completo para o novo usuário
    const participantsList = Array.from(this.participants.values());

    // Calcula elapsed time para o timer
    const timerData = {
      duration: this.timer.duration,
      isRunning: this.timer.isRunning,
      elapsed: this.timer.isRunning && this.timer.startTime
        ? Math.floor((Date.now() - this.timer.startTime) / 1000)
        : 0,
    };

    const currentStory = this.currentStoryIndex >= 0 ? this.stories[this.currentStoryIndex] : null;

    conn.send(
      JSON.stringify({
        type: "sync",
        participants: participantsList,
        you: conn.id,
        votes: Array.from(this.votes.values()),
        revealed: this.revealed,
        anonymous: this.anonymous,
        timer: timerData,
        stories: this.stories,
        currentStoryIndex: this.currentStoryIndex,
        currentStory: currentStory,
        estimateHistory: this.estimateHistory,
        roomName: this.roomName,
      })
    );

    // Notifica todos sobre novo participante
    this.room.broadcast(
      JSON.stringify({
        type: "user-joined",
        userId: conn.id,
        name: "",
      }),
      [conn.id]
    );
  }

  onMessage(message: string, sender: Party.Connection) {
    const data = JSON.parse(message);

    if (data.type === "vote") {
      // Se value for null, remove o voto (desmarca)
      if (data.value === null) {
        this.votes.delete(sender.id);

        this.room.broadcast(
          JSON.stringify({
            type: "vote-cast",
            userId: sender.id,
            hasVoted: false,
          })
        );
      } else {
        // Armazena o voto
        this.votes.set(sender.id, {
          userId: sender.id,
          value: data.value,
          revealed: this.revealed,
        });

        // Broadcast (sem revelar o valor ainda)
        this.room.broadcast(
          JSON.stringify({
            type: "vote-cast",
            userId: sender.id,
            hasVoted: true,
          })
        );
      }
    } else if (data.type === "reveal") {
      // Revela todos os votos
      this.revealed = true;

      const votes = Array.from(this.votes.values()).map((vote) => ({
        ...vote,
        revealed: true,
      }));

      this.room.broadcast(
        JSON.stringify({
          type: "reveal",
          votes,
        })
      );
    } else if (data.type === "reset") {
      // Salva estimativa no histórico antes de resetar (se houver história atual e votos)
      if (this.currentStoryIndex >= 0 && this.votes.size > 0 && this.revealed) {
        const currentStory = this.stories[this.currentStoryIndex];
        const votes = Array.from(this.votes.values());
        const values = votes.map(v => v.value).filter((v): v is number => v !== null);

        let average: number | null = null;
        let mostVoted: number | null = null;
        let min: number | null = null;
        let max: number | null = null;

        if (values.length > 0) {
          // Média
          average = values.reduce((a, b) => a + b, 0) / values.length;

          // Min e Max
          min = Math.min(...values);
          max = Math.max(...values);

          // Moda (mais votado)
          const frequency = new Map<number, number>();
          values.forEach(v => frequency.set(v, (frequency.get(v) || 0) + 1));
          let maxFreq = 0;
          frequency.forEach((freq, value) => {
            if (freq > maxFreq) {
              maxFreq = freq;
              mostVoted = value;
            }
          });
        }

        this.estimateHistory.push({
          storyId: currentStory.id,
          storyTitle: currentStory.title,
          votes: votes.map(v => ({ ...v })),
          average,
          mostVoted,
          min,
          max,
          finishedAt: Date.now(),
        });
      }

      // Reinicia a votação
      this.votes.clear();
      this.revealed = false;

      // Avança para próxima história se houver
      let nextStory: Story | null = null;
      if (this.currentStoryIndex >= 0 && this.currentStoryIndex < this.stories.length - 1) {
        this.currentStoryIndex++;
        nextStory = this.stories[this.currentStoryIndex];
      } else {
        // Não há próxima história
        this.currentStoryIndex = -1;
        nextStory = null;
      }

      this.room.broadcast(
        JSON.stringify({
          type: "reset",
          estimateHistory: this.estimateHistory,
          currentStoryIndex: this.currentStoryIndex,
          currentStory: nextStory,
        })
      );
    } else if (data.type === "toggle-anonymous") {
      // Alterna entre modo anônimo e transparente
      this.anonymous = !this.anonymous;

      this.room.broadcast(
        JSON.stringify({
          type: "anonymous-changed",
          anonymous: this.anonymous,
        })
      );
    } else if (data.type === "set-name") {
      // Define o nome do participante
      const name = (data.name || "Anônimo").trim();

      this.participants.set(sender.id, {
        userId: sender.id,
        name: name,
      });

      // Notifica todos sobre o nome do participante
      this.room.broadcast(
        JSON.stringify({
          type: "name-changed",
          userId: sender.id,
          name: name,
        })
      );
    } else if (data.type === "start-timer") {
      // Inicia o timer
      this.timer.startTime = Date.now();
      this.timer.isRunning = true;

      this.room.broadcast(
        JSON.stringify({
          type: "timer-started",
          duration: this.timer.duration,
        })
      );
    } else if (data.type === "pause-timer") {
      // Pausa o timer
      this.timer.isRunning = false;

      this.room.broadcast(
        JSON.stringify({
          type: "timer-paused",
        })
      );
    } else if (data.type === "reset-timer") {
      // Reseta o timer
      this.timer.startTime = null;
      this.timer.isRunning = false;

      this.room.broadcast(
        JSON.stringify({
          type: "timer-reset",
        })
      );
    } else if (data.type === "set-timer-duration") {
      // Define a duração do timer
      const duration = Math.max(10, Math.min(3600, data.duration || 180)); // Entre 10s e 1h

      this.timer.duration = duration;
      this.timer.startTime = null;
      this.timer.isRunning = false;

      this.room.broadcast(
        JSON.stringify({
          type: "timer-duration-changed",
          duration: duration,
        })
      );
    } else if (data.type === "add-story") {
      // Adiciona nova história
      const story: Story = {
        id: crypto.randomUUID(),
        title: data.title || "Sem título",
        description: data.description || "",
        createdAt: Date.now(),
      };

      this.stories.push(story);

      // Seleciona automaticamente a nova história como atual
      this.currentStoryIndex = this.stories.length - 1;

      // Limpa votos ao selecionar nova história
      this.votes.clear();
      this.revealed = false;

      this.room.broadcast(
        JSON.stringify({
          type: "stories-updated",
          stories: this.stories,
          currentStoryIndex: this.currentStoryIndex,
          currentStory: story,
        })
      );
    } else if (data.type === "select-story") {
      // Seleciona história para estimar
      const index = data.index;

      if (index >= 0 && index < this.stories.length) {
        this.currentStoryIndex = index;

        // Limpa votos ao selecionar nova história
        this.votes.clear();
        this.revealed = false;

        const currentStory = this.stories[this.currentStoryIndex];

        this.room.broadcast(
          JSON.stringify({
            type: "story-selected",
            currentStoryIndex: this.currentStoryIndex,
            currentStory: currentStory,
          })
        );
      }
    } else if (data.type === "remove-story") {
      // Remove história
      const index = data.index;

      if (index >= 0 && index < this.stories.length) {
        this.stories.splice(index, 1);

        // Ajusta currentStoryIndex se necessário
        if (this.currentStoryIndex >= this.stories.length) {
          this.currentStoryIndex = this.stories.length - 1;
        }

        const currentStory = this.currentStoryIndex >= 0 ? this.stories[this.currentStoryIndex] : null;

        this.room.broadcast(
          JSON.stringify({
            type: "stories-updated",
            stories: this.stories,
            currentStoryIndex: this.currentStoryIndex,
            currentStory: currentStory,
          })
        );
      }
    } else if (data.type === "set-room-name") {
      // Define nome da sala
      this.roomName = data.name || "Sessão de Planning Poker";

      this.room.broadcast(
        JSON.stringify({
          type: "room-name-changed",
          roomName: this.roomName,
        })
      );
    }
  }

  onClose(conn: Party.Connection) {
    console.log(`User ${conn.id} disconnected`);

    // Remove voto e participante que saiu
    this.votes.delete(conn.id);
    this.participants.delete(conn.id);

    this.room.broadcast(
      JSON.stringify({
        type: "user-left",
        userId: conn.id,
      })
    );
  }
}

PlanningPokerServer satisfies Party.Worker;
