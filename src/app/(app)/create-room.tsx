import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useState } from 'react';
import { Alert, Pressable, ScrollView, View } from 'react-native';

import { Button, FocusAwareStatusBar, Input, Text } from '@/components/ui';
import { useSocket } from '@/lib/sockets/socket-provider';
import type { GameType } from '@/lib/stores/game-store';
import { useGameStore } from '@/lib/stores/game-store';
import { useUserStore } from '@/lib/stores/user-store';

const GAME_TYPES: {
  id: GameType;
  name: string;
  description: string;
  minPlayers: number;
  maxPlayers: number;
}[] = [
  {
    id: 'kings-cup',
    name: "King's Cup",
    description: 'Classic card drinking game with traditional rules',
    minPlayers: 3,
    maxPlayers: 8,
  },
  {
    id: 'never-have-i-ever',
    name: 'Never Have I Ever',
    description: 'Share secrets and learn about your friends',
    minPlayers: 3,
    maxPlayers: 10,
  },
  {
    id: 'liars-dice',
    name: "Liar's Dice",
    description: 'Bluffing game with dice - strategy meets luck',
    minPlayers: 2,
    maxPlayers: 6,
  },
];

export default function CreateRoomScreen() {
  const [roomName, setRoomName] = useState('');
  const [selectedGame, setSelectedGame] = useState<GameType>('kings-cup');
  const [maxPlayers, setMaxPlayers] = useState('6');
  const [momMode, setMomMode] = useState(false);
  const [isPrivate, setIsPrivate] = useState(true);
  const [isLoading, setIsLoading] = useState(false);

  const { profile } = useUserStore();
  const { setCurrentRoom, addRoom } = useGameStore();
  const { socket, connected, emitGameAction } = useSocket();

  const createRoom = async () => {
    if (!roomName.trim()) {
      Alert.alert('Error', 'Please enter a room name');
      return;
    }

    if (!selectedGame) {
      Alert.alert('Error', 'Please select a game type');
      return;
    }

    if (!connected || !socket) {
      Alert.alert('Error', 'Not connected to server. Please try again.');
      return;
    }

    const maxPlayersNum = parseInt(maxPlayers);
    const selectedGameType = GAME_TYPES.find((g) => g.id === selectedGame);

    if (maxPlayersNum < (selectedGameType?.minPlayers || 2)) {
      Alert.alert(
        'Error',
        `${selectedGameType?.name} requires at least ${selectedGameType?.minPlayers} players`
      );
      return;
    }

    setIsLoading(true);

    try {
      console.log('Creating room via WebSocket...');

      // Send createRoom event to server
      socket.emit('createRoom', {
        name: roomName.trim(),
        gameType: selectedGame,
        isPrivate,
        userName: profile?.username || 'Guest',
        avatar: profile?.avatar || {
          base: 'default',
          outfit: 'casual',
          drink: 'beer',
          accessory: 'none',
        },
        settings: {
          momMode,
          maxPlayers: maxPlayersNum,
          allowSpectators: false,
        },
      });

      // The socket provider will handle the roomCreated event
      // and update the store, then we navigate to the room
      console.log('Room creation request sent to server');

      // Set a timeout to stop loading if no response
      setTimeout(() => {
        setIsLoading(false);
      }, 3000);
    } catch (error) {
      console.error('Failed to create room:', error);
      Alert.alert('Error', 'Failed to create room. Please try again.');
      setIsLoading(false);
    }
  };

  const selectedGameType = GAME_TYPES.find((g) => g.id === selectedGame);

  return (
    <ScrollView className="flex-1 bg-white dark:bg-neutral-900">
      <FocusAwareStatusBar />

      {/* Header */}
      <View className="flex-row items-center border-b border-neutral-200 p-4 dark:border-neutral-700">
        <Pressable onPress={() => router.back()} className="mr-2 p-2">
          <Ionicons
            name="arrow-back"
            size={24}
            className="text-neutral-900 dark:text-neutral-100"
          />
        </Pressable>
        <Text className="text-xl font-bold text-neutral-900 dark:text-neutral-100">
          Create Room
        </Text>
      </View>

      <View className="p-4">
        {/* Room Name */}
        <View className="mb-6">
          <Text className="mb-2 text-lg font-semibold text-neutral-900 dark:text-neutral-100">
            Room Name
          </Text>
          <Input
            placeholder="Enter room name"
            value={roomName}
            onChangeText={setRoomName}
            maxLength={30}
          />
        </View>

        {/* Game Selection */}
        <View className="mb-6">
          <Text className="mb-3 text-lg font-semibold text-neutral-900 dark:text-neutral-100">
            Select Game
          </Text>

          {GAME_TYPES.map((game) => (
            <Pressable
              key={game.id}
              onPress={() => setSelectedGame(game.id)}
              className={`mb-3 rounded-lg border-2 p-4 ${
                selectedGame === game.id
                  ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                  : 'border-neutral-200 bg-neutral-50 dark:border-neutral-700 dark:bg-neutral-800'
              }`}
            >
              <View className="mb-2 flex-row items-center justify-between">
                <Text
                  className={`font-semibold ${
                    selectedGame === game.id
                      ? 'text-primary-700 dark:text-primary-300'
                      : 'text-neutral-900 dark:text-neutral-100'
                  }`}
                >
                  {game.name}
                </Text>
                <View className="flex-row items-center">
                  <Ionicons
                    name="people"
                    size={16}
                    className="mr-1 text-neutral-600 dark:text-neutral-400"
                  />
                  <Text className="text-sm text-neutral-600 dark:text-neutral-400">
                    {game.minPlayers}-{game.maxPlayers}
                  </Text>
                </View>
              </View>
              <Text className="text-neutral-600 dark:text-neutral-400">
                {game.description}
              </Text>
            </Pressable>
          ))}
        </View>

        {/* Settings */}
        <View className="mb-6">
          <Text className="mb-3 text-lg font-semibold text-neutral-900 dark:text-neutral-100">
            Settings
          </Text>

          {/* Max Players */}
          <View className="mb-4">
            <Text className="mb-2 text-sm font-medium text-neutral-700 dark:text-neutral-300">
              Max Players
            </Text>
            <Input
              placeholder="Max players"
              value={maxPlayers}
              onChangeText={setMaxPlayers}
              keyboardType="numeric"
              maxLength={2}
            />
            {selectedGameType && (
              <Text className="mt-1 text-xs text-neutral-500 dark:text-neutral-400">
                {selectedGameType.name} supports {selectedGameType.minPlayers}-
                {selectedGameType.maxPlayers} players
              </Text>
            )}
          </View>

          {/* Mom Mode Toggle */}
          <Pressable
            onPress={() => setMomMode(!momMode)}
            className="mb-3 flex-row items-center justify-between rounded-lg bg-neutral-50 p-4 dark:bg-neutral-800"
          >
            <View className="flex-1">
              <Text className="font-medium text-neutral-900 dark:text-neutral-100">
                Mom Mode 👩‍👩‍👧‍👦
              </Text>
              <Text className="mt-1 text-sm text-neutral-600 dark:text-neutral-400">
                Family-friendly content and rules
              </Text>
            </View>
            <View
              className={`h-7 w-12 rounded-full ${
                momMode
                  ? 'bg-primary-500'
                  : 'bg-neutral-300 dark:bg-neutral-600'
              }`}
            >
              <View
                className={`mt-1 size-5 rounded-full bg-white transition-transform ${
                  momMode ? 'ml-6' : 'ml-1'
                }`}
              />
            </View>
          </Pressable>

          {/* Private Room Toggle */}
          <Pressable
            onPress={() => setIsPrivate(!isPrivate)}
            className="flex-row items-center justify-between rounded-lg bg-neutral-50 p-4 dark:bg-neutral-800"
          >
            <View className="flex-1">
              <Text className="font-medium text-neutral-900 dark:text-neutral-100">
                Private Room 🔒
              </Text>
              <Text className="mt-1 text-sm text-neutral-600 dark:text-neutral-400">
                Only people with invite code can join
              </Text>
            </View>
            <View
              className={`h-7 w-12 rounded-full ${
                isPrivate
                  ? 'bg-primary-500'
                  : 'bg-neutral-300 dark:bg-neutral-600'
              }`}
            >
              <View
                className={`mt-1 size-5 rounded-full bg-white transition-transform ${
                  isPrivate ? 'ml-6' : 'ml-1'
                }`}
              />
            </View>
          </Pressable>
        </View>

        {/* Create Button */}
        <Button
          label={isLoading ? 'Creating Room...' : 'Create Room'}
          onPress={createRoom}
          disabled={isLoading || !roomName.trim()}
          className="mt-4"
        />
      </View>
    </ScrollView>
  );
}
