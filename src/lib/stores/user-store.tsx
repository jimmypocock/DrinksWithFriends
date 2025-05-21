import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';

import { zustandStorage } from '../storage';

export type UserAvatar = {
  base: string;
  outfit: string;
  drink: string;
  accessory: string;
};

export type UserProfile = {
  id: string;
  username: string;
  avatar: UserAvatar;
  preferences: {
    momMode: boolean;
    language: string;
    notifications: boolean;
  };
  stats: {
    gamesPlayed: number;
    gamesWon: number;
    achievementsUnlocked: number;
  };
};

interface UserStore {
  // User state
  profile: UserProfile | null;
  isLoadingProfile: boolean;
  profileError: string | null;

  // Actions
  setProfile: (profile: UserProfile | null) => void;
  updateProfile: (updates: Partial<UserProfile>) => void;
  updateAvatar: (avatar: Partial<UserAvatar>) => void;
  updatePreferences: (prefs: Partial<UserProfile['preferences']>) => void;
  incrementStats: (
    stats: Partial<Record<keyof UserProfile['stats'], number>>
  ) => void;

  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  reset: () => void;
}

const initialState = {
  profile: null,
  isLoadingProfile: false,
  profileError: null,
};

export const useUserStore = create<UserStore>()(
  persist(
    immer((set) => ({
      ...initialState,

      setProfile: (profile) =>
        set((state) => {
          state.profile = profile;
        }),

      updateProfile: (updates) =>
        set((state) => {
          if (state.profile) {
            Object.assign(state.profile, updates);
          }
        }),

      updateAvatar: (avatar) =>
        set((state) => {
          if (state.profile?.avatar) {
            Object.assign(state.profile.avatar, avatar);
          }
        }),

      updatePreferences: (prefs) =>
        set((state) => {
          if (state.profile?.preferences) {
            Object.assign(state.profile.preferences, prefs);
          }
        }),

      incrementStats: (stats) =>
        set((state) => {
          if (state.profile?.stats) {
            Object.entries(stats).forEach(([key, value]) => {
              const typedKey = key as keyof UserProfile['stats'];
              if (state.profile && typedKey in state.profile.stats) {
                state.profile.stats[typedKey] += value;
              }
            });
          }
        }),

      setLoading: (loading) =>
        set((state) => {
          state.isLoadingProfile = loading;
        }),

      setError: (error) =>
        set((state) => {
          state.profileError = error;
        }),

      reset: () => set(() => ({ ...initialState })),
    })),
    {
      name: 'user-store',
      storage: createJSONStorage(() => zustandStorage),
      partialize: (state) => ({
        profile: state.profile,
      }),
    }
  )
);

// Initialize a guest profile if none exists
export const initGuestProfile = () => {
  const { profile, setProfile } = useUserStore.getState();

  if (!profile) {
    const guestId = `guest-${Math.random().toString(36).substring(2, 10)}`;

    setProfile({
      id: guestId,
      username: `Guest-${guestId.substring(6).toUpperCase()}`,
      avatar: {
        base: 'default',
        outfit: 'casual',
        drink: 'beer',
        accessory: 'none',
      },
      preferences: {
        momMode: false,
        language: 'en',
        notifications: true,
      },
      stats: {
        gamesPlayed: 0,
        gamesWon: 0,
        achievementsUnlocked: 0,
      },
    });
  }
};
