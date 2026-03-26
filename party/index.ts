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

export default class PlanningPokerServer implements Party.Server {
  votes: Map<string, Vote>;
  participants: Map<string, Participant>;
  revealed: boolean;
  anonymous: boolean;
  timer: TimerState;

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

    conn.send(
      JSON.stringify({
        type: "sync",
        participants: participantsList,
        you: conn.id,
        votes: Array.from(this.votes.values()),
        revealed: this.revealed,
        anonymous: this.anonymous,
        timer: timerData,
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
      // Reinicia a votação
      this.votes.clear();
      this.revealed = false;

      this.room.broadcast(
        JSON.stringify({
          type: "reset",
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
