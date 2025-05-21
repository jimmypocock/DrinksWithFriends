import { router } from 'expo-router';
import { Alert } from 'react-native';

import { storage } from './storage';
import { useGameStore } from './stores/game-store';
import { useUserStore } from './stores/user-store';

/**
 * Clear all client-side app data (for testing and debugging)
 * This resets all state, storage, and navigates back to home
 */
export function clearClientData() {
  return new Promise<void>((resolve) => {
    Alert.alert(
      'Reset App Data',
      'This will clear all app data and reset to initial state. Continue?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
          onPress: () => resolve(),
        },
        {
          text: 'Reset',
          style: 'destructive',
          onPress: () => {
            console.log('Clearing all client data...');

            try {
              // Clear MMKV storage first
              console.log('Clearing MMKV storage...');
              storage.clearAll();

              // Clear specific store keys
              console.log('Clearing store persistence keys...');
              storage.delete('game-store');
              storage.delete('user-store');

              // Reset Zustand stores
              console.log('Resetting Zustand stores...');
              useGameStore.getState().reset();
              useUserStore.getState().reset();

              console.log('All client data cleared successfully');

              // Force reload app state
              Alert.alert('Success', 'App data has been reset', [
                {
                  text: 'OK',
                  onPress: () => {
                    // Navigate back to home
                    console.log('Navigating to home screen...');
                    router.replace('/(app)');
                    resolve();
                  },
                },
              ]);
            } catch (error) {
              console.error('Error clearing client data:', error);
              Alert.alert('Error', 'Failed to reset app data');
              resolve();
            }
          },
        },
      ]
    );
  });
}

/**
 * Reset both client and server data
 * @returns Promise that resolves when reset is complete or canceled
 */
export function resetAllData(): Promise<void> {
  return new Promise<void>((resolve) => {
    Alert.alert(
      'Full Reset',
      'Reset both client and server data?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
          onPress: () => resolve(),
        },
        {
          text: 'Reset All',
          style: 'destructive',
          onPress: async () => {
            try {
              console.log('Starting full data reset...');

              // Reset server data first
              console.log('Resetting server data...');
              try {
                // Use AbortController for timeout
                const controller = new AbortController();
                const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout

                try {
                  const response = await fetch('http://localhost:3001/reset', {
                    method: 'POST',
                    signal: controller.signal,
                  });

                  clearTimeout(timeoutId);

                  if (response.ok) {
                    const result = await response.json();
                    console.log('Server reset successful:', result);
                  } else {
                    console.error(
                      'Failed to reset server data:',
                      response.statusText
                    );
                    Alert.alert(
                      'Warning',
                      'Server reset failed. Client data will still be reset.',
                      [{ text: 'OK' }]
                    );
                  }
                } catch (fetchError) {
                  clearTimeout(timeoutId);
                  if ((fetchError as Error).name === 'AbortError') {
                    console.error('Fetch request timed out');
                    throw new Error('Server request timed out');
                  }
                  throw fetchError;
                }
              } catch (error) {
                console.error('Error contacting server:', error);
                Alert.alert(
                  'Server Unavailable',
                  'Could not reach the server. Client data will still be reset.',
                  [{ text: 'OK' }]
                );
              }

              // Then reset client data
              console.log('Now resetting client data...');
              await clearClientData();

              // Resolve promise after everything is done
              resolve();
            } catch (error) {
              console.error('Error in resetAllData:', error);
              Alert.alert(
                'Error',
                'Something went wrong during the reset process',
                [{ text: 'OK', onPress: () => resolve() }]
              );
            }
          },
        },
      ],
      { cancelable: false }
    );
  });
}
