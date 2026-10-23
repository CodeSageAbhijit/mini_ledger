import { create } from 'zustand';
import { sessionPersistence } from './sessionPersistence';

export interface UserProfile {
  id: string;
  phone: string;
  name: string | null;
  username: string | null;
  email: string | null;
}

interface AuthState {
  accessToken: string | null;
  refreshToken: string | null;
  user: UserProfile | null;
  isHydrated: boolean;
  isAuthenticated: boolean;
  hydrate: () => Promise<void>;
  setSession: (tokens: { accessToken: string; refreshToken: string; user: UserProfile }) => Promise<void>;
  updateTokens: (tokens: { accessToken: string; refreshToken: string }) => Promise<void>;
  updateUser: (user: UserProfile) => Promise<void>;
  clearSession: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  accessToken: null,
  refreshToken: null,
  user: null,
  isHydrated: false,
  isAuthenticated: false,

  hydrate: async () => {
    try {
      const { accessToken, refreshToken, user } = await sessionPersistence.load();
      const isAuthenticated = Boolean(accessToken && refreshToken);

      set({
        accessToken,
        refreshToken,
        user,
        isHydrated: true,
        isAuthenticated,
      });
    } catch {
      set({ isHydrated: true, isAuthenticated: false });
    }
  },

  setSession: async ({ accessToken, refreshToken, user }) => {
    await sessionPersistence.save({ accessToken, refreshToken, user });

    set({
      accessToken,
      refreshToken,
      user,
      isAuthenticated: true,
    });
  },

  updateTokens: async ({ accessToken, refreshToken }) => {
    await sessionPersistence.saveTokens({ accessToken, refreshToken });

    set({ accessToken, refreshToken });
  },

  updateUser: async (user) => {
    const session = await sessionPersistence.load();
    if (session.accessToken && session.refreshToken) {
      await sessionPersistence.save({
        accessToken: session.accessToken,
        refreshToken: session.refreshToken,
        user,
      });
    }
    set({ user });
  },

  clearSession: async () => {
    await sessionPersistence.clear();

    set({
      accessToken: null,
      refreshToken: null,
      user: null,
      isAuthenticated: false,
    });
  },
}));
