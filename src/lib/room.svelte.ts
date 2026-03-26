import PartySocket from "partysocket";

export type Participant = {
  id: string;
  connected: boolean;
};

export type Vote = {
  userId: string;
  value: number | null;
  revealed: boolean;
};

type MessageData =
  | { type: "sync"; participants: string[]; you: string; votes: Vote[]; revealed: boolean }
  | { type: "user-joined"; userId: string }
  | { type: "user-left"; userId: string }
  | { type: "vote-cast"; userId: string; hasVoted: boolean }
  | { type: "reveal"; votes: Vote[] }
  | { type: "reset" };

// Room state class - encapsula o estado reativo
class RoomState {
  socket = $state<PartySocket | null>(null);
  participants = $state<Participant[]>([]);
  currentUserId = $state<string | null>(null);
  connected = $state(false);
  votes = $state<Vote[]>([]);
  revealed = $state(false);
  myVote = $state<number | null>(null);

  private votesMap = new Map<string, Vote>();

  connect(roomId: string) {
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

      if (data.type === "sync") {
        this.currentUserId = data.you;
        this.participants = data.participants.map((id) => ({
          id,
          connected: true,
        }));
        this.revealed = data.revealed;
        this.votesMap = new Map(data.votes.map((v) => [v.userId, v]));
        this.votes = data.votes;

        const myVoteData = this.votesMap.get(data.you);
        if (myVoteData) {
          this.myVote = myVoteData.value;
        }
      } else if (data.type === "user-joined") {
        this.participants = [...this.participants, {
          id: data.userId,
          connected: true,
        }];
      } else if (data.type === "user-left") {
        this.participants = this.participants.filter((p) => p.id !== data.userId);
        this.votesMap.delete(data.userId);
        this.votes = Array.from(this.votesMap.values());
      } else if (data.type === "vote-cast") {
        const existingVote = this.votesMap.get(data.userId);
        this.votesMap.set(data.userId, {
          userId: data.userId,
          value: existingVote?.value ?? null,
          revealed: false,
        });
        this.votes = Array.from(this.votesMap.values());
      } else if (data.type === "reveal") {
        this.revealed = true;
        this.votesMap = new Map(data.votes.map((v) => [v.userId, v]));
        this.votes = data.votes;
      } else if (data.type === "reset") {
        this.votesMap = new Map();
        this.votes = [];
        this.revealed = false;
        this.myVote = null;
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
      this.votesMap = new Map();
      this.votes = [];
      this.revealed = false;
      this.myVote = null;
    }
  }

  vote(value: number) {
    if (this.socket && this.connected) {
      this.myVote = value;
      this.socket.send(JSON.stringify({ type: "vote", value }));
    }
  }

  reveal() {
    if (this.socket && this.connected) {
      this.socket.send(JSON.stringify({ type: "reveal" }));
    }
  }

  reset() {
    if (this.socket && this.connected) {
      this.socket.send(JSON.stringify({ type: "reset" }));
    }
  }
}

// Exporta instância única do room state
export const room = new RoomState();
