import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  View,
} from 'react-native';

import { Button, FocusAwareStatusBar, Text } from '@/components/ui';
import { useSocket } from '@/lib/sockets/socket-provider';
import { useGameStore } from '@/lib/stores/game-store';
import { useUserStore } from '@/lib/stores/user-store';

export default function RoomScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { connected, emitGameAction, joinRoom, leaveRoom } = useSocket();
  const { profile } = useUserStore();
  const {
    currentRoom,
    gameState,
    isGameActive,
    messages,
    isTyping,
    setCurrentRoom,
    setError,
  } = useGameStore();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (id) {
      // Join the room when component mounts
      console.log('Joining room with id:', id);
      joinRoom(id);

      // Timeout for showing loading state
      setTimeout(() => {
        setIsLoading(false);
      }, 1500);

      // Debug log the current room
      setTimeout(() => {
        console.log('Current room after joining:', currentRoom);
      }, 2000);
    }

    return () => {
      if (id) {
        console.log('Leaving room with id:', id);
        leaveRoom(id);
        setCurrentRoom(null);
      }
    };
  }, [id]);

  const startGame = () => {
    if (!currentRoom?.gameType) {
      Alert.alert('Error', 'No game type selected');
      return;
    }

    emitGameAction('startGame', {
      roomId: currentRoom.id,
      gameType: currentRoom.gameType,
    });
  };

  const leaveRoomHandler = () => {
    console.log('Leave room button pressed');

    Alert.alert('Leave Room', 'Are you sure you want to leave this room?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Leave',
        style: 'destructive',
        onPress: () => {
          console.log('Confirming leave room');
          if (id && currentRoom) {
            console.log(`Leaving room ${id}`);
            leaveRoom(id);
            setCurrentRoom(null);

            // Wait a moment before navigating back
            setTimeout(() => {
              console.log('Navigating back');
              router.replace('/(app)');
            }, 500);
          } else {
            console.log('No room ID or current room to leave');
            router.replace('/(app)');
          }
        },
      },
    ]);
  };

  if (isLoading) {
    return (
      <View className="flex-1 items-center justify-center bg-white dark:bg-neutral-900">
        <FocusAwareStatusBar />
        <ActivityIndicator size="large" className="text-primary-600" />
        <Text className="mt-4 text-neutral-600 dark:text-neutral-400">
          Joining room...
        </Text>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-white dark:bg-neutral-900">
      <FocusAwareStatusBar />

      {/* Header */}
      <View className="flex-row items-center justify-between border-b border-neutral-200 p-4 dark:border-neutral-700">
        <Pressable onPress={leaveRoomHandler} className="p-2">
          <Ionicons
            name="arrow-back"
            size={24}
            className="text-neutral-900 dark:text-neutral-100"
          />
        </Pressable>

        <View className="flex-1 items-center">
          <Text className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">
            {currentRoom?.name || `Room ${id}`}
          </Text>
          <View className="mt-1 flex-row items-center">
            <View
              className={`mr-2 size-2 rounded-full ${
                connected ? 'bg-green-500' : 'bg-red-500'
              }`}
            />
            <Text className="text-sm text-neutral-600 dark:text-neutral-400">
              {connected ? 'Connected' : 'Disconnected'}
            </Text>
          </View>
          {/* Room Code Display */}
          {currentRoom?.inviteCode && (
            <View className="mt-2 rounded-lg border border-primary-300 bg-primary-100 px-4 py-2 dark:border-primary-700 dark:bg-primary-900">
              <Text className="mb-1 text-xs text-primary-700 dark:text-primary-300">
                Share this code to invite friends:
              </Text>
              <Text className="text-center font-mono text-lg font-bold text-primary-900 dark:text-primary-100">
                {currentRoom.inviteCode}
              </Text>
            </View>
          )}
        </View>

        <View className="w-10" />
      </View>

      {/* Players Section */}
      <View className="p-4">
        <Text className="mb-3 text-lg font-semibold text-neutral-900 dark:text-neutral-100">
          Players ({currentRoom?.players?.length || 0})
        </Text>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          className="mb-4"
        >
          {currentRoom?.players?.map((player) => (
            <View
              key={player.id}
              className="mr-3 min-w-[80px] items-center rounded-lg bg-neutral-100 p-3 dark:bg-neutral-800"
            >
              <View className="mb-2 size-12 items-center justify-center rounded-full bg-primary-500">
                <Text className="text-lg font-bold text-white">
                  {player.name.charAt(0).toUpperCase()}
                </Text>
              </View>
              <Text className="text-center text-sm font-medium text-neutral-900 dark:text-neutral-100">
                {player.name}
              </Text>
              {player.isOwner && (
                <Text className="mt-1 text-xs text-primary-600 dark:text-primary-400">
                  Owner
                </Text>
              )}
            </View>
          ))}
        </ScrollView>
      </View>

      {/* Game Status */}
      <View className="flex-1 p-4">
        {isGameActive ? (
          <View className="mb-4 rounded-lg bg-green-50 p-4 dark:bg-green-900/20">
            <Text className="font-semibold text-green-800 dark:text-green-200">
              Game in Progress: {currentRoom?.gameType}
            </Text>
            {gameState && (
              <Text className="mt-1 text-green-600 dark:text-green-400">
                Round {gameState.round} • Phase: {gameState.phase}
              </Text>
            )}
          </View>
        ) : (
          <View className="mb-4 rounded-lg bg-neutral-50 p-4 dark:bg-neutral-800">
            <Text className="font-semibold text-neutral-800 dark:text-neutral-200">
              Game Type: {currentRoom?.gameType || 'None selected'}
            </Text>
            <Text className="mt-1 text-neutral-600 dark:text-neutral-400">
              Waiting for game to start...
            </Text>
          </View>
        )}

        {/* Chat Messages */}
        <View className="flex-1">
          <Text className="mb-3 text-lg font-semibold text-neutral-900 dark:text-neutral-100">
            Chat
          </Text>

          <ScrollView className="flex-1 rounded-lg bg-neutral-50 p-3 dark:bg-neutral-800">
            {messages.length === 0 ? (
              <Text className="mt-4 text-center text-neutral-500 dark:text-neutral-400">
                No messages yet. Start chatting!
              </Text>
            ) : (
              messages.map((message) => (
                <View key={message.id} className="mb-3">
                  <View className="mb-1 flex-row items-center">
                    <Text className="font-medium text-neutral-900 dark:text-neutral-100">
                      {message.userName}
                    </Text>
                    <Text className="ml-2 text-xs text-neutral-500 dark:text-neutral-400">
                      {new Date(message.timestamp).toLocaleTimeString()}
                    </Text>
                  </View>
                  <Text
                    className={`${
                      message.type === 'system'
                        ? 'italic text-neutral-600 dark:text-neutral-400'
                        : message.type === 'game-action'
                          ? 'text-blue-600 dark:text-blue-400'
                          : 'text-neutral-800 dark:text-neutral-200'
                    }`}
                  >
                    {message.message}
                  </Text>
                </View>
              ))
            )}
          </ScrollView>

          {/* Typing Indicators */}
          {Object.keys(isTyping).length > 0 && (
            <Text className="mt-2 text-sm text-neutral-500 dark:text-neutral-400">
              {Object.keys(isTyping).length === 1
                ? 'Someone is typing...'
                : `${Object.keys(isTyping).length} people are typing...`}
            </Text>
          )}
        </View>
      </View>

      {/* Action Buttons */}
      <View className="border-t border-neutral-200 p-4 dark:border-neutral-700">
        {currentRoom?.ownerId === profile?.id && !isGameActive && (
          <Button
            label="Start Game"
            onPress={startGame}
            className="mb-3"
            disabled={!connected || (currentRoom?.players?.length || 0) < 2}
          />
        )}

        <Button
          label="Leave Room"
          variant="outline"
          onPress={leaveRoomHandler}
        />
      </View>
    </View>
  );
}
