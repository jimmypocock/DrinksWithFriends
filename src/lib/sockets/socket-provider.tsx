import { router } from 'expo-router';
import React, { createContext, useContext, useEffect, useState } from 'react';
import { Alert } from 'react-native';
import io, { type Socket } from 'socket.io-client';

import { useAuth } from '../auth';
import { Env } from '../env';
import { useGameStore } from '../stores/game-store';
import { useUserStore } from '../stores/user-store';

interface SocketContextType {
  socket: Socket | null;
  connected: boolean;
  emitGameAction: (action: string, data?: any) => void;
  joinRoom: (roomId: string) => void;
  leaveRoom: (roomId: string) => void;
}

const SocketContext = createContext<SocketContextType | null>(null);

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
};

export const SocketProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [connected, setConnected] = useState(false);

  const { token } = useAuth();
  const { profile } = useUserStore();
  const {
    currentRoom,
    setCurrentRoom,
    addPlayer,
    removePlayer,
    updateGameState,
    addMessage,
    setTyping,
    setError,
  } = useGameStore();

  useEffect(() => {
    if (!token) return;

    // Use profile ID if available, otherwise generate a guest ID
    const userId =
      profile?.id || `guest-${Math.random().toString(36).substring(2, 10)}`;

    // Initialize socket connection
    const newSocket = io(Env.WEBSOCKET_URL, {
      auth: {
        token,
        userId,
      },
      transports: ['websocket'],
      autoConnect: false,
    });

    // Connection event handlers
    newSocket.on('connect', () => {
      console.log('Connected to socket');
      setConnected(true);
    });

    newSocket.on('disconnect', (reason) => {
      console.log('Disconnected from socket:', reason);
      setConnected(false);
    });

    newSocket.on('connect_error', (error) => {
      console.error('Socket connection error:', error);
      setError('Failed to connect to game server');
    });

    // Room event handlers
    newSocket.on('roomCreated', (room) => {
      console.log('Room created:', room);
      setCurrentRoom(room);
      // Navigate to the newly created room
      router.replace(`/(app)/room/${room.id}`);
    });

    newSocket.on('roomJoined', (room) => {
      console.log('Room joined:', room);
      setCurrentRoom(room);
    });

    // Game event handlers
    newSocket.on('gameStateUpdate', (gameState) => {
      console.log('Game state update:', gameState);
      updateGameState(gameState);
    });

    newSocket.on('playerJoined', (player) => {
      console.log('Player joined:', player);
      addPlayer(player);
      addMessage({
        id: `system-${Date.now()}`,
        userId: 'system',
        userName: 'System',
        message: `${player.name} joined the room`,
        timestamp: Date.now(),
        type: 'system',
      });
    });

    newSocket.on('playerLeft', (data) => {
      console.log('Player left:', data);
      removePlayer(data.playerId);
      addMessage({
        id: `system-${Date.now()}`,
        userId: 'system',
        userName: 'System',
        message: `${data.playerName} left the room`,
        timestamp: Date.now(),
        type: 'system',
      });
    });

    // Chat event handlers
    newSocket.on('messageReceived', (message) => {
      addMessage(message);
    });

    newSocket.on('userTyping', ({ userId, isTyping: typing }) => {
      setTyping(userId, typing);
    });

    // Game action handlers
    newSocket.on('gameAction', (action) => {
      addMessage({
        id: `game-${Date.now()}`,
        userId: action.playerId,
        userName: action.playerName,
        message: action.description,
        timestamp: Date.now(),
        type: 'game-action',
      });
    });

    // Error handling
    newSocket.on('error', (error) => {
      console.error('Socket error:', error);

      // Show error in app
      if (typeof error === 'string') {
        setError(error);
      } else if (error && error.message) {
        setError(error.message);
      } else {
        setError('An error occurred');
      }

      // Show alert for debugging
      Alert.alert('Socket Error', JSON.stringify(error));
    });

    newSocket.connect();
    setSocket(newSocket);

    return () => {
      newSocket.close();
      setSocket(null);
      setConnected(false);
    };
  }, [token]);

  // Auto-join current room when it changes
  useEffect(() => {
    if (socket && connected && currentRoom) {
      socket.emit('joinRoom', { roomId: currentRoom.id });
    }
  }, [socket, connected, currentRoom?.id]);

  const emitGameAction = (action: string, data?: any) => {
    if (socket && connected) {
      socket.emit(action, data);
    } else {
      console.warn('Socket not connected, cannot emit action:', action);
    }
  };

  const joinRoom = (roomId: string) => {
    if (socket && connected) {
      const userData = {
        roomId,
        userName: profile?.username || 'Guest',
        avatar: profile?.avatar || {
          base: 'default',
          outfit: 'casual',
          drink: 'beer',
          accessory: 'none',
        },
      };
      socket.emit('joinRoom', userData);
    }
  };

  const leaveRoom = (roomId: string) => {
    if (socket && connected) {
      socket.emit('leaveRoom', { roomId });
    }
  };

  return (
    <SocketContext.Provider
      value={{
        socket,
        connected,
        emitGameAction,
        joinRoom,
        leaveRoom,
      }}
    >
      {children}
    </SocketContext.Provider>
  );
};
