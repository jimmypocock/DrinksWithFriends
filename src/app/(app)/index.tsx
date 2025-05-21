import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useState } from 'react';
import { Alert, Pressable, ScrollView } from 'react-native';

import {
  Button,
  FocusAwareStatusBar,
  Input,
  Text,
  View,
} from '@/components/ui';
import { useSocket } from '@/lib/sockets/socket-provider';
import { useGameStore } from '@/lib/stores/game-store';

export default function HomeScreen() {
  const [roomCode, setRoomCode] = useState('');
  const { rooms, currentRoom } = useGameStore();
  const { joinRoom, connected } = useSocket();

  const joinRoomByCode = () => {
    if (!roomCode.trim()) {
      Alert.alert('Error', 'Please enter a room code');
      return;
    }

    if (!connected) {
      Alert.alert('Error', 'Not connected to server. Please try again.');
      return;
    }

    const code = roomCode.trim().toUpperCase();
    console.log('Joining room by code:', code);

    // This will trigger the joinRoom socket event and navigate if successful
    router.push(`/(app)/room/${code}`);
  };

  const createNewRoom = () => {
    router.push('/(app)/create-room');
  };

  const rejoinRoom = (roomId: string) => {
    router.push(`/(app)/room/${roomId}`);
  };

  return (
    <ScrollView className="flex-1 bg-white dark:bg-neutral-900">
      <FocusAwareStatusBar />

      {/* Header */}
      <View className="p-6 pt-12">
        <Text className="mb-2 text-3xl font-bold text-neutral-900 dark:text-neutral-100">
          🍻 Drinks With Friends
        </Text>
        <Text className="text-neutral-600 dark:text-neutral-400">
          Play drinking games with friends in private rooms
        </Text>
      </View>

      {/* Current Room */}
      {currentRoom && (
        <View className="mx-6 mb-6 rounded-lg border border-primary-200 bg-primary-50 p-4 dark:border-primary-700 dark:bg-primary-900/20">
          <View className="flex-row items-center justify-between">
            <View className="flex-1">
              <Text className="font-semibold text-primary-800 dark:text-primary-200">
                Currently in: {currentRoom.name}
              </Text>
              <Text className="mt-1 text-sm text-primary-600 dark:text-primary-400">
                {currentRoom.players.length} players • {currentRoom.gameType}
              </Text>
            </View>
            <Button
              label="Rejoin"
              size="sm"
              onPress={() => rejoinRoom(currentRoom.id)}
            />
          </View>
        </View>
      )}

      {/* Quick Actions */}
      <View className="mx-6 mb-6">
        <Text className="mb-4 text-xl font-semibold text-neutral-900 dark:text-neutral-100">
          Quick Start
        </Text>

        {/* Create Room */}
        <Pressable
          onPress={createNewRoom}
          className="mb-3 flex-row items-center rounded-lg bg-primary-500 p-4"
        >
          <View className="mr-4 rounded-full bg-white/20 p-3">
            <Ionicons name="add" size={24} color="white" />
          </View>
          <View className="flex-1">
            <Text className="text-lg font-semibold text-white">
              Create New Room
            </Text>
            <Text className="text-white/80">
              Start a game and invite your friends
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color="white" />
        </Pressable>

        {/* Join Room */}
        <View className="rounded-lg bg-neutral-50 p-4 dark:bg-neutral-800">
          <View className="mb-3 flex-row items-center">
            <View className="mr-4 rounded-full bg-neutral-200 p-3 dark:bg-neutral-700">
              <Ionicons
                name="enter"
                size={24}
                className="text-neutral-600 dark:text-neutral-300"
              />
            </View>
            <Text className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">
              Join Room
            </Text>
          </View>

          <View className="flex-row items-center space-x-3">
            <View className="flex-1">
              <Input
                placeholder="Enter room code"
                value={roomCode}
                onChangeText={setRoomCode}
                autoCapitalize="characters"
                maxLength={6}
              />
            </View>
            <Button
              label="Join"
              onPress={joinRoomByCode}
              disabled={!roomCode.trim()}
              size="sm"
            />
          </View>
        </View>
      </View>

      {/* Recent Rooms */}
      {rooms.length > 0 && (
        <View className="mx-6 mb-6">
          <Text className="mb-4 text-xl font-semibold text-neutral-900 dark:text-neutral-100">
            Recent Rooms
          </Text>

          {rooms.slice(0, 5).map((room) => (
            <Pressable
              key={room.id}
              onPress={() => rejoinRoom(room.id)}
              className="mb-3 flex-row items-center rounded-lg bg-neutral-50 p-4 dark:bg-neutral-800"
            >
              <View className="flex-1">
                <Text className="font-semibold text-neutral-900 dark:text-neutral-100">
                  {room.name}
                </Text>
                <Text className="mt-1 text-sm text-neutral-600 dark:text-neutral-400">
                  {room.gameType} • {room.players.length} players •{' '}
                  {room.status}
                </Text>
                <Text className="mt-1 text-xs text-neutral-500 dark:text-neutral-500">
                  {new Date(room.updatedAt).toLocaleDateString()}
                </Text>
              </View>

              <View className="ml-3 items-center">
                <Text className="rounded bg-neutral-200 px-2 py-1 font-mono text-xs text-neutral-700 dark:bg-neutral-700 dark:text-neutral-300">
                  {room.inviteCode}
                </Text>
              </View>
            </Pressable>
          ))}
        </View>
      )}

      {/* Game Types Info */}
      <View className="mx-6 mb-8">
        <Text className="mb-4 text-xl font-semibold text-neutral-900 dark:text-neutral-100">
          Available Games
        </Text>

        <View className="space-y-3">
          <View className="rounded-lg bg-neutral-50 p-4 dark:bg-neutral-800">
            <Text className="mb-1 font-semibold text-neutral-900 dark:text-neutral-100">
              👑 King's Cup
            </Text>
            <Text className="text-sm text-neutral-600 dark:text-neutral-400">
              Classic card drinking game with traditional rules
            </Text>
          </View>

          <View className="rounded-lg bg-neutral-50 p-4 dark:bg-neutral-800">
            <Text className="mb-1 font-semibold text-neutral-900 dark:text-neutral-100">
              🤫 Never Have I Ever
            </Text>
            <Text className="text-sm text-neutral-600 dark:text-neutral-400">
              Share secrets and learn about your friends
            </Text>
          </View>

          <View className="rounded-lg bg-neutral-50 p-4 dark:bg-neutral-800">
            <Text className="mb-1 font-semibold text-neutral-900 dark:text-neutral-100">
              🎲 Liar's Dice
            </Text>
            <Text className="text-sm text-neutral-600 dark:text-neutral-400">
              Bluffing game with dice - strategy meets luck
            </Text>
          </View>
        </View>
      </View>
    </ScrollView>
  );
}
