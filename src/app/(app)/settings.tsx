/* eslint-disable react/react-in-jsx-scope */
import { Env } from '@env';
import { router } from 'expo-router';
import { useColorScheme } from 'nativewind';
import { Button } from 'react-native';

import { Item } from '@/components/settings/item';
import { ItemsContainer } from '@/components/settings/items-container';
import { LanguageItem } from '@/components/settings/language-item';
import { ThemeItem } from '@/components/settings/theme-item';
import {
  colors,
  FocusAwareStatusBar,
  ScrollView,
  Text,
  View,
} from '@/components/ui';
import { Github, Rate, Share, Support, Website } from '@/components/ui/icons';
import { translate, useAuth } from '@/lib';
import { storage } from '@/lib/storage';
import { useGameStore } from '@/lib/stores/game-store';
import { useUserStore } from '@/lib/stores/user-store';

export default function Settings() {
  const signOut = useAuth.use.signOut();
  const { colorScheme } = useColorScheme();
  const iconColor =
    colorScheme === 'dark' ? colors.neutral[400] : colors.neutral[500];
  return (
    <>
      <FocusAwareStatusBar />

      <ScrollView>
        <View className="flex-1 px-4 pt-16 ">
          <Text className="text-xl font-bold">
            {translate('settings.title')}
          </Text>
          <ItemsContainer title="settings.generale">
            <LanguageItem />
            <ThemeItem />
          </ItemsContainer>

          <ItemsContainer title="settings.about">
            <Item text="settings.app_name" value={Env.NAME} />
            <Item text="settings.version" value={Env.VERSION} />
          </ItemsContainer>

          <ItemsContainer title="settings.support_us">
            <Item
              text="settings.share"
              icon={<Share color={iconColor} />}
              onPress={() => {}}
            />
            <Item
              text="settings.rate"
              icon={<Rate color={iconColor} />}
              onPress={() => {}}
            />
            <Item
              text="settings.support"
              icon={<Support color={iconColor} />}
              onPress={() => {}}
            />
          </ItemsContainer>

          <ItemsContainer title="settings.links">
            <Item text="settings.privacy" onPress={() => {}} />
            <Item text="settings.terms" onPress={() => {}} />
            <Item
              text="settings.github"
              icon={<Github color={iconColor} />}
              onPress={() => {}}
            />
            <Item
              text="settings.website"
              icon={<Website color={iconColor} />}
              onPress={() => {}}
            />
          </ItemsContainer>

          <View className="my-8">
            <ItemsContainer>
              <Item text="settings.logout" onPress={signOut} />
            </ItemsContainer>
          </View>

          {/* Developer Tools */}
          <View className="mb-8">
            <ItemsContainer title="settings.developer_tools">
              <View className="rounded-lg bg-gray-100 px-4 py-2 dark:bg-gray-800">
                <Text className="mb-2 text-sm text-black dark:text-white">
                  Game store state:{' '}
                  {JSON.stringify(
                    useGameStore.getState().currentRoom ? 'has room' : 'no room'
                  )}
                </Text>
                <Text className="mb-4 text-sm text-black dark:text-white">
                  User store state:{' '}
                  {JSON.stringify(
                    useUserStore.getState().profile
                      ? 'has profile'
                      : 'no profile'
                  )}
                </Text>

                <Button
                  title="Inspect Current Data"
                  color="blue"
                  onPress={() => {
                    console.log('INSPECT: Starting storage inspection');
                    try {
                      const allKeys = storage.getAllKeys();
                      console.log('INSPECT: All storage keys:', allKeys);

                      allKeys.forEach((key) => {
                        try {
                          const value = storage.getString(key);
                          console.log(
                            `INSPECT: ${key} =`,
                            value?.substring(0, 100) + '...'
                          );
                        } catch (err) {
                          console.log(`INSPECT: Error reading ${key}:`, err);
                        }
                      });

                      console.log(
                        'INSPECT: Game store current state:',
                        useGameStore.getState()
                      );
                      console.log(
                        'INSPECT: User store current state:',
                        useUserStore.getState()
                      );
                    } catch (error) {
                      console.error('INSPECT: Error:', error);
                    }
                  }}
                />

                <View className="h-4" />

                <Button
                  title="Reset All App Data"
                  color="red"
                  onPress={() => {
                    console.log(
                      'RESET: Button pressed - performing reset immediately'
                    );

                    try {
                      console.log('RESET: Clearing storage');
                      storage.clearAll();

                      console.log('RESET: Resetting stores');
                      useGameStore.getState().reset();
                      useUserStore.getState().reset();

                      console.log('RESET: Complete - navigating home');
                      router.replace('/(app)');
                    } catch (error) {
                      console.error('RESET: Error:', error);
                    }
                  }}
                />
              </View>
            </ItemsContainer>
          </View>
        </View>
      </ScrollView>
    </>
  );
}
