import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';

import { zustandStorage } from '../storage';

export type GameType = 'kings-cup' | 'never-have-i-ever' | 'liars-dice';

export type Player = {
  id: string;
  name: string;
  avatar: {
    base: string;
    outfit: string;
    drink: string;
    accessory: string;
  };
  isOwner: boolean;
  isReady: boolean;
  joinedAt: number;
};

export type Room = {
  id: string;
  ownerId: string;
  name: string;
  gameType: GameType;
  isPrivate: boolean;
  inviteCode: string;
  players: Player[];
  settings: {
    momMode: boolean;
    maxPlayers: number;
    allowSpectators: boolean;
  };
  status: 'waiting' | 'playing' | 'paused' | 'finished';
  createdAt: number;
  updatedAt: number;
};

export type GameState = {
  currentPlayer?: string;
  round: number;
  phase: string;
  data: Record<string, any>;
};

export type ChatMessage = {
  id: string;
  userId: string;
  userName: string;
  message: string;
  timestamp: number;
  type: 'message' | 'system' | 'game-action';
};

interface GameStore {
  // Room state
  currentRoom: Room | null;
  rooms: Room[];
  isLoading: boolean;
  error: string | null;

  // Game state
  gameState: GameState | null;
  isGameActive: boolean;

  // Chat state
  messages: ChatMessage[];
  isTyping: Record<string, boolean>;

  // Actions
  setCurrentRoom: (room: Room | null) => void;
  addRoom: (room: Room) => void;
  updateRoom: (roomId: string, updates: Partial<Room>) => void;
  removeRoom: (roomId: string) => void;

  setGameState: (gameState: GameState | null) => void;
  updateGameState: (updates: Partial<GameState>) => void;

  addPlayer: (player: Player) => void;
  removePlayer: (playerId: string) => void;
  updatePlayer: (playerId: string, updates: Partial<Player>) => void;

  addMessage: (message: ChatMessage) => void;
  clearMessages: () => void;
  setTyping: (userId: string, isTyping: boolean) => void;

  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  reset: () => void;
}

const initialState = {
  currentRoom: null,
  rooms: [],
  isLoading: false,
  error: null,
  gameState: null,
  isGameActive: false,
  messages: [],
  isTyping: {},
};

export const useGameStore = create<GameStore>()(
  persist(
    immer((set, get) => ({
      ...initialState,

      setCurrentRoom: (room) =>
        set((state) => {
          state.currentRoom = room;
          if (!room) {
            state.gameState = null;
            state.isGameActive = false;
            state.messages = [];
            state.isTyping = {};
          }
        }),

      addRoom: (room) =>
        set((state) => {
          const existingIndex = state.rooms.findIndex((r) => r.id === room.id);
          if (existingIndex >= 0) {
            state.rooms[existingIndex] = room;
          } else {
            state.rooms.push(room);
          }
        }),

      updateRoom: (roomId, updates) =>
        set((state) => {
          const room = state.rooms.find((r) => r.id === roomId);
          if (room) {
            Object.assign(room, updates);
          }
          if (state.currentRoom?.id === roomId) {
            Object.assign(state.currentRoom, updates);
          }
        }),

      removeRoom: (roomId) =>
        set((state) => {
          state.rooms = state.rooms.filter((r) => r.id !== roomId);
          if (state.currentRoom?.id === roomId) {
            state.currentRoom = null;
          }
        }),

      setGameState: (gameState) =>
        set((state) => {
          state.gameState = gameState;
          state.isGameActive = !!gameState;
        }),

      updateGameState: (updates) =>
        set((state) => {
          if (state.gameState) {
            Object.assign(state.gameState, updates);
          }
        }),

      addPlayer: (player) =>
        set((state) => {
          if (state.currentRoom) {
            const existingIndex = state.currentRoom.players.findIndex(
              (p) => p.id === player.id
            );
            if (existingIndex >= 0) {
              state.currentRoom.players[existingIndex] = player;
            } else {
              state.currentRoom.players.push(player);
            }
          }
        }),

      removePlayer: (playerId) =>
        set((state) => {
          if (state.currentRoom) {
            state.currentRoom.players = state.currentRoom.players.filter(
              (p) => p.id !== playerId
            );
          }
        }),

      updatePlayer: (playerId, updates) =>
        set((state) => {
          if (state.currentRoom) {
            const player = state.currentRoom.players.find(
              (p) => p.id === playerId
            );
            if (player) {
              Object.assign(player, updates);
            }
          }
        }),

      addMessage: (message) =>
        set((state) => {
          state.messages.push(message);
          // Keep only last 100 messages
          if (state.messages.length > 100) {
            state.messages = state.messages.slice(-100);
          }
        }),

      clearMessages: () =>
        set((state) => {
          state.messages = [];
        }),

      setTyping: (userId, isTyping) =>
        set((state) => {
          if (isTyping) {
            state.isTyping[userId] = true;
          } else {
            delete state.isTyping[userId];
          }
        }),

      setLoading: (loading) =>
        set((state) => {
          state.isLoading = loading;
        }),

      setError: (error) =>
        set((state) => {
          state.error = error;
        }),

      reset: () => {
        console.log('Resetting game store to initial state');
        set(() => ({ ...initialState }));
      },
    })),
    {
      name: 'game-store',
      storage: createJSONStorage(() => zustandStorage),
      partialize: (state) => ({
        rooms: state.rooms,
        currentRoom: state.currentRoom,
      }),
    }
  )
);
