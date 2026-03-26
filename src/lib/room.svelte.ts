import PartySocket from "partysocket";
import { writable, get } from 'svelte/store';

export type Participant = {
  userId: string;
  name: string;
};

export type Vote = {
  userId: string;
  value: number | null;
  revealed: boolean;
};

export type TimerState = {
  duration: number;
  startTime: number | null;
  isRunning: boolean;
};

type MessageData =
  | { type: "sync"; participants: Participant[]; you: string; votes: Vote[]; revealed: boolean; anonymous: boolean; timer: { duration: number; isRunning: boolean; elapsed: number } }
  | { type: "user-joined"; userId: string; name: string }
  | { type: "user-left"; userId: string }
  | { type: "vote-cast"; userId: string; hasVoted: boolean }
  | { type: "reveal"; votes: Vote[] }
  | { type: "reset" }
  | { type: "anonymous-changed"; anonymous: boolean }
  | { type: "name-changed"; userId: string; name: string }
  | { type: "timer-started"; duration: number }
  | { type: "timer-paused" }
  | { type: "timer-reset" }
  | { type: "timer-duration-changed"; duration: number };

// Stores Svelte
const socketStore = writable<PartySocket | null>(null);
const participantsStore = writable<Participant[]>([]);
const currentUserIdStore = writable<string | null>(null);
const connectedStore = writable(false);
const votesStore = writable<Vote[]>([]);
const revealedStore = writable(false);
const myVoteStore = writable<number | null>(null);
const anonymousStore = writable(true); // Default: modo anônimo
const timerStore = writable<TimerState>({
  duration: 20,
  startTime: null,
  isRunning: false,
});

let votesMap = new Map<string, Vote>();

// Exporta stores para uso com $ syntax
export const socket = socketStore;
export const participants = participantsStore;
export const currentUserId = currentUserIdStore;
export const connected = connectedStore;
export const votes = votesStore;
export const revealed = revealedStore;
export const myVote = myVoteStore;
export const anonymous = anonymousStore;
export const timer = timerStore;

// Funções de controle
export function connect(roomId: string) {
    const host =
      import.meta.env.MODE === "development"
        ? "localhost:1999"
        : "planningpoker.thiagovespa.partykit.dev";

    const ws = new PartySocket({
      host,
      room: roomId,
    });

    socketStore.set(ws);

    ws.addEventListener("open", () => {
      console.log("Connected to room:", roomId);
      connectedStore.set(true);
    });

    ws.addEventListener("message", (event) => {
      const data: MessageData = JSON.parse(event.data);

      if (data.type === "sync") {
        currentUserIdStore.set(data.you);
        participantsStore.set(data.participants);
        revealedStore.set(data.revealed);
        anonymousStore.set(data.anonymous);
        votesMap = new Map(data.votes.map((v) => [v.userId, v]));
        votesStore.set(data.votes);

        const myVoteData = votesMap.get(data.you);
        if (myVoteData) {
          myVoteStore.set(myVoteData.value);
        }

        // Reconstrói o timer usando elapsed do servidor e clock local
        const timerState: TimerState = {
          duration: data.timer.duration,
          isRunning: data.timer.isRunning,
          startTime: data.timer.isRunning
            ? Date.now() - (data.timer.elapsed * 1000)
            : null,
        };
        timerStore.set(timerState);
      } else if (data.type === "user-joined") {
        participantsStore.update((p) => [...p, {
          userId: data.userId,
          name: data.name,
        }]);
      } else if (data.type === "user-left") {
        participantsStore.update((p) => p.filter((participant) => participant.userId !== data.userId));
        votesMap.delete(data.userId);
        votesStore.set(Array.from(votesMap.values()));
      } else if (data.type === "name-changed") {
        participantsStore.update((p) => p.map((participant) =>
          participant.userId === data.userId
            ? { ...participant, name: data.name }
            : participant
        ));
      } else if (data.type === "vote-cast") {
        if (data.hasVoted) {
          const existingVote = votesMap.get(data.userId);
          votesMap.set(data.userId, {
            userId: data.userId,
            value: existingVote?.value ?? null,
            revealed: false,
          });
        } else {
          // Remove o voto se hasVoted for false (desmarcou)
          votesMap.delete(data.userId);
        }
        votesStore.set(Array.from(votesMap.values()));
      } else if (data.type === "reveal") {
        revealedStore.set(true);
        votesMap = new Map(data.votes.map((v) => [v.userId, v]));
        votesStore.set(data.votes);
      } else if (data.type === "reset") {
        votesMap = new Map();
        votesStore.set([]);
        revealedStore.set(false);
        myVoteStore.set(null);
      } else if (data.type === "anonymous-changed") {
        anonymousStore.set(data.anonymous);
      } else if (data.type === "timer-started") {
        const now = Date.now();
        timerStore.update((timer) => ({
          ...timer,
          duration: data.duration,
          startTime: now,
          isRunning: true,
        }));
      } else if (data.type === "timer-paused") {
        timerStore.update((timer) => ({
          ...timer,
          isRunning: false,
        }));
      } else if (data.type === "timer-reset") {
        timerStore.update((timer) => ({
          ...timer,
          startTime: null,
          isRunning: false,
        }));
      } else if (data.type === "timer-duration-changed") {
        timerStore.set({
          duration: data.duration,
          startTime: null,
          isRunning: false,
        });
      }
    });

    ws.addEventListener("close", () => {
      console.log("Disconnected from room");
      connectedStore.set(false);
    });

    ws.addEventListener("error", (error) => {
      console.error("WebSocket error:", error);
      connectedStore.set(false);
    });
}

export function disconnect() {
  const ws = get(socketStore);
  if (ws) {
    ws.close();
    socketStore.set(null);
    connectedStore.set(false);
    participantsStore.set([]);
    currentUserIdStore.set(null);
    votesMap = new Map();
    votesStore.set([]);
    revealedStore.set(false);
    myVoteStore.set(null);
  }
}

export function vote(value: number | null) {
  const ws = get(socketStore);
  const isConnected = get(connectedStore);
  if (ws && isConnected) {
    myVoteStore.set(value);
    ws.send(JSON.stringify({ type: "vote", value }));
  }
}

export function reveal() {
  const ws = get(socketStore);
  const isConnected = get(connectedStore);
  if (ws && isConnected) {
    ws.send(JSON.stringify({ type: "reveal" }));
  }
}

export function reset() {
  const ws = get(socketStore);
  const isConnected = get(connectedStore);
  if (ws && isConnected) {
    ws.send(JSON.stringify({ type: "reset" }));
  }
}

export function toggleAnonymous() {
  const ws = get(socketStore);
  const isConnected = get(connectedStore);
  if (ws && isConnected) {
    ws.send(JSON.stringify({ type: "toggle-anonymous" }));
  }
}

export function setName(name: string) {
  const ws = get(socketStore);
  const isConnected = get(connectedStore);
  if (ws && isConnected) {
    ws.send(JSON.stringify({ type: "set-name", name }));
  }
}

export function startTimer() {
  const ws = get(socketStore);
  const isConnected = get(connectedStore);
  if (ws && isConnected) {
    ws.send(JSON.stringify({ type: "start-timer" }));
  }
}

export function pauseTimer() {
  const ws = get(socketStore);
  const isConnected = get(connectedStore);
  if (ws && isConnected) {
    ws.send(JSON.stringify({ type: "pause-timer" }));
  }
}

export function resetTimer() {
  const ws = get(socketStore);
  const isConnected = get(connectedStore);
  if (ws && isConnected) {
    ws.send(JSON.stringify({ type: "reset-timer" }));
  }
}

export function setTimerDuration(duration: number) {
  const ws = get(socketStore);
  const isConnected = get(connectedStore);
  if (ws && isConnected) {
    ws.send(JSON.stringify({ type: "set-timer-duration", duration }));
  }
}
