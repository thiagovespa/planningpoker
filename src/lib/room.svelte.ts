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

export type Story = {
  id: string;
  title: string;
  description: string;
  createdAt: number;
};

export type EstimateResult = {
  storyId: string;
  storyTitle: string;
  votes: Vote[];
  average: number | null;
  mostVoted: number | null;
  min: number | null;
  max: number | null;
  finishedAt: number;
};

type MessageData =
  | { type: "sync"; participants: Participant[]; you: string; votes: Vote[]; revealed: boolean; anonymous: boolean; timer: { duration: number; isRunning: boolean; elapsed: number }; stories: Story[]; currentStoryIndex: number; currentStory: Story | null; estimateHistory: EstimateResult[]; roomName: string }
  | { type: "user-joined"; userId: string; name: string }
  | { type: "user-left"; userId: string }
  | { type: "vote-cast"; userId: string; hasVoted: boolean }
  | { type: "reveal"; votes: Vote[] }
  | { type: "reset"; estimateHistory: EstimateResult[]; currentStoryIndex: number; currentStory: Story | null }
  | { type: "anonymous-changed"; anonymous: boolean }
  | { type: "name-changed"; userId: string; name: string }
  | { type: "timer-started"; duration: number }
  | { type: "timer-paused" }
  | { type: "timer-reset" }
  | { type: "timer-duration-changed"; duration: number }
  | { type: "stories-updated"; stories: Story[]; currentStoryIndex?: number; currentStory?: Story | null }
  | { type: "story-selected"; currentStoryIndex: number; currentStory: Story }
  | { type: "room-name-changed"; roomName: string };

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
const storiesStore = writable<Story[]>([]);
const currentStoryIndexStore = writable<number>(-1);
const currentStoryStore = writable<Story | null>(null);
const estimateHistoryStore = writable<EstimateResult[]>([]);
const roomNameStore = writable<string>("Sessão de Planning Poker");

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
export const stories = storiesStore;
export const currentStoryIndex = currentStoryIndexStore;
export const currentStory = currentStoryStore;
export const estimateHistory = estimateHistoryStore;
export const roomName = roomNameStore;

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

        storiesStore.set(data.stories);
        currentStoryIndexStore.set(data.currentStoryIndex);
        currentStoryStore.set(data.currentStory);
        estimateHistoryStore.set(data.estimateHistory);
        roomNameStore.set(data.roomName);
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
        estimateHistoryStore.set(data.estimateHistory);
        currentStoryIndexStore.set(data.currentStoryIndex);
        currentStoryStore.set(data.currentStory);
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
      } else if (data.type === "stories-updated") {
        storiesStore.set(data.stories);
        if (data.currentStoryIndex !== undefined) {
          currentStoryIndexStore.set(data.currentStoryIndex);
        }
        if (data.currentStory !== undefined) {
          currentStoryStore.set(data.currentStory);
          // Se uma nova história foi selecionada, limpa votos
          if (data.currentStory !== null) {
            votesMap = new Map();
            votesStore.set([]);
            revealedStore.set(false);
            myVoteStore.set(null);
          }
        }
      } else if (data.type === "story-selected") {
        currentStoryIndexStore.set(data.currentStoryIndex);
        currentStoryStore.set(data.currentStory);
        // Limpa votos locais ao selecionar nova história
        votesMap = new Map();
        votesStore.set([]);
        revealedStore.set(false);
        myVoteStore.set(null);
      } else if (data.type === "room-name-changed") {
        roomNameStore.set(data.roomName);
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

export function addStory(title: string, description: string) {
  const ws = get(socketStore);
  const isConnected = get(connectedStore);
  if (ws && isConnected) {
    ws.send(JSON.stringify({ type: "add-story", title, description }));
  }
}

export function selectStory(index: number) {
  const ws = get(socketStore);
  const isConnected = get(connectedStore);
  if (ws && isConnected) {
    ws.send(JSON.stringify({ type: "select-story", index }));
  }
}

export function removeStory(index: number) {
  const ws = get(socketStore);
  const isConnected = get(connectedStore);
  if (ws && isConnected) {
    ws.send(JSON.stringify({ type: "remove-story", index }));
  }
}

export function setRoomName(name: string) {
  const ws = get(socketStore);
  const isConnected = get(connectedStore);
  if (ws && isConnected) {
    ws.send(JSON.stringify({ type: "set-room-name", name }));
  }
}
