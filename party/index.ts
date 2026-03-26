import type * as Party from "partykit/server";

interface Vote {
  userId: string;
  value: number | null;
  revealed: boolean;
}

export default class PlanningPokerServer implements Party.Server {
  votes: Map<string, Vote>;
  revealed: boolean;
  anonymous: boolean;

  constructor(readonly room: Party.Room) {
    this.votes = new Map();
    this.revealed = false;
    this.anonymous = true; // Default: modo anônimo (segurança psicológica)
  }

  onConnect(conn: Party.Connection, ctx: Party.ConnectionContext) {
    console.log(`User ${conn.id} connected to room ${this.room.id}`);

    // Envia estado completo para o novo usuário
    const participants = [...this.room.getConnections()].map((c) => c.id);

    conn.send(
      JSON.stringify({
        type: "sync",
        participants,
        you: conn.id,
        votes: Array.from(this.votes.values()),
        revealed: this.revealed,
        anonymous: this.anonymous,
      })
    );

    // Notifica todos sobre novo participante
    this.room.broadcast(
      JSON.stringify({
        type: "user-joined",
        userId: conn.id,
      }),
      [conn.id]
    );
  }

  onMessage(message: string, sender: Party.Connection) {
    const data = JSON.parse(message);

    if (data.type === "vote") {
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
    }
  }

  onClose(conn: Party.Connection) {
    console.log(`User ${conn.id} disconnected`);

    // Remove voto do participante que saiu
    this.votes.delete(conn.id);

    this.room.broadcast(
      JSON.stringify({
        type: "user-left",
        userId: conn.id,
      })
    );
  }
}

PlanningPokerServer satisfies Party.Worker;
