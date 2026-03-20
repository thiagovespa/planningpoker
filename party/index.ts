import type * as Party from "partykit/server";

export default class PlanningPokerServer implements Party.Server {
  constructor(readonly room: Party.Room) {}

  onConnect(conn: Party.Connection, ctx: Party.ConnectionContext) {
    // Novo participante conectou
    console.log(
      `User ${conn.id} connected to room ${this.room.id}`
    );

    // Envia lista atual de participantes para o novo usuário
    const participants = [...this.room.getConnections()].map((c) => c.id);

    conn.send(
      JSON.stringify({
        type: "participants",
        participants,
        you: conn.id,
      })
    );

    // Notifica todos sobre novo participante
    this.room.broadcast(
      JSON.stringify({
        type: "user-joined",
        userId: conn.id,
      }),
      [conn.id] // Exclui o próprio usuário
    );
  }

  onMessage(message: string, sender: Party.Connection) {
    // Broadcast de mensagens para todos
    this.room.broadcast(
      JSON.stringify({
        type: "message",
        userId: sender.id,
        message,
      })
    );
  }

  onClose(conn: Party.Connection) {
    // Participante desconectou
    console.log(`User ${conn.id} disconnected`);

    this.room.broadcast(
      JSON.stringify({
        type: "user-left",
        userId: conn.id,
      })
    );
  }
}

PlanningPokerServer satisfies Party.Worker;
