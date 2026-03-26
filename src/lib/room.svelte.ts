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

// Estado global reativo
export let socket = $state<PartySocket | null>(null);
export let participants = $state<Participant[]>([]);
export let currentUserId = $state<string | null>(null);
export let connected = $state(false);
export let votes = $state<Vote[]>([]);
export let revealed = $state(false);
export let myVote = $state<number | null>(null);

let votesMap = new Map<string, Vote>();

export function connect(roomId: string) {
  const host =
    import.meta.env.MODE === "development"
      ? "localhost:1999"
      : "planningpoker.thiagovespa.partykit.dev";

  socket = new PartySocket({
    host,
    room: roomId,
  });

  socket.addEventListener("open", () => {
    console.log("Connected to room:", roomId);
    connected = true;
  });

  socket.addEventListener("message", (event) => {
    const data: MessageData = JSON.parse(event.data);

    if (data.type === "sync") {
      currentUserId = data.you;
      participants = data.participants.map((id) => ({
        id,
        connected: true,
      }));
      revealed = data.revealed;
      votesMap = new Map(data.votes.map((v) => [v.userId, v]));
      votes = data.votes;

      const myVoteData = votesMap.get(data.you);
      if (myVoteData) {
        myVote = myVoteData.value;
      }
    } else if (data.type === "user-joined") {
      participants = [...participants, {
        id: data.userId,
        connected: true,
      }];
    } else if (data.type === "user-left") {
      participants = participants.filter((p) => p.id !== data.userId);
      votesMap.delete(data.userId);
      votes = Array.from(votesMap.values());
    } else if (data.type === "vote-cast") {
      const existingVote = votesMap.get(data.userId);
      votesMap.set(data.userId, {
        userId: data.userId,
        value: existingVote?.value ?? null,
        revealed: false,
      });
      votes = Array.from(votesMap.values());
    } else if (data.type === "reveal") {
      revealed = true;
      votesMap = new Map(data.votes.map((v) => [v.userId, v]));
      votes = data.votes;
    } else if (data.type === "reset") {
      votesMap = new Map();
      votes = [];
      revealed = false;
      myVote = null;
    }
  });

  socket.addEventListener("close", () => {
    console.log("Disconnected from room");
    connected = false;
  });

  socket.addEventListener("error", (error) => {
    console.error("WebSocket error:", error);
    connected = false;
  });
}

export function disconnect() {
  if (socket) {
    socket.close();
    socket = null;
    connected = false;
    participants = [];
    currentUserId = null;
    votesMap = new Map();
    votes = [];
    revealed = false;
    myVote = null;
  }
}

export function vote(value: number) {
  if (socket && connected) {
    myVote = value;
    socket.send(JSON.stringify({ type: "vote", value }));
  }
}

export function reveal() {
  if (socket && connected) {
    socket.send(JSON.stringify({ type: "reveal" }));
  }
}

export function reset() {
  if (socket && connected) {
    socket.send(JSON.stringify({ type: "reset" }));
  }
}
