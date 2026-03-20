import PartySocket from "partysocket";

type Participant = {
  id: string;
  connected: boolean;
};

type MessageData =
  | { type: "participants"; participants: string[]; you: string }
  | { type: "user-joined"; userId: string }
  | { type: "user-left"; userId: string };

class RoomStore {
  socket: PartySocket | null = $state(null);
  participants = $state<Participant[]>([]);
  currentUserId = $state<string | null>(null);
  connected = $state(false);

  connect(roomId: string) {
    // Conecta ao servidor Partykit
    // Em dev: localhost:1999
    // Em prod: seu-projeto.partykit.dev
    const host =
      import.meta.env.MODE === "development"
        ? "localhost:1999"
        : "planningpoker.thiagovespa.partykit.dev";

    this.socket = new PartySocket({
      host,
      room: roomId,
    });

    this.socket.addEventListener("open", () => {
      console.log("Connected to room:", roomId);
      this.connected = true;
    });

    this.socket.addEventListener("message", (event) => {
      const data: MessageData = JSON.parse(event.data);

      if (data.type === "participants") {
        // Lista inicial de participantes
        this.currentUserId = data.you;
        this.participants = data.participants.map((id) => ({
          id,
          connected: true,
        }));
      } else if (data.type === "user-joined") {
        // Novo participante
        this.participants.push({
          id: data.userId,
          connected: true,
        });
      } else if (data.type === "user-left") {
        // Participante saiu
        this.participants = this.participants.filter(
          (p) => p.id !== data.userId
        );
      }
    });

    this.socket.addEventListener("close", () => {
      console.log("Disconnected from room");
      this.connected = false;
    });

    this.socket.addEventListener("error", (error) => {
      console.error("WebSocket error:", error);
      this.connected = false;
    });
  }

  disconnect() {
    if (this.socket) {
      this.socket.close();
      this.socket = null;
      this.connected = false;
      this.participants = [];
      this.currentUserId = null;
    }
  }

  sendMessage(message: string) {
    if (this.socket && this.connected) {
      this.socket.send(message);
    }
  }
}

export const room = new RoomStore();
