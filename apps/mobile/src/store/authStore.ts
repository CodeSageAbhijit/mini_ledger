import * as SecureStore from 'expo-secure-store';
import { create } from 'zustand';

export interface UserProfile {
  id: string;
  phone: string;
  name: string | null;
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
  clearSession: () => Promise<void>;
}

const ACCESS_TOKEN_KEY = 'miniledger_access_token';
const REFRESH_TOKEN_KEY = 'miniledger_refresh_token';
const USER_PROFILE_KEY = 'miniledger_user_profile';

export const useAuthStore = create<AuthState>((set) => ({
  accessToken: null,
  refreshToken: null,
  user: null,
  isHydrated: false,
  isAuthenticated: false,

  hydrate: async () => {
    try {
      const [accessToken, refreshToken, userRaw] = await Promise.all([
        SecureStore.getItemAsync(ACCESS_TOKEN_KEY),
        SecureStore.getItemAsync(REFRESH_TOKEN_KEY),
        SecureStore.getItemAsync(USER_PROFILE_KEY),
      ]);

      const user = userRaw ? (JSON.parse(userRaw) as UserProfile) : null;
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
    await Promise.all([
      SecureStore.setItemAsync(ACCESS_TOKEN_KEY, accessToken),
      SecureStore.setItemAsync(REFRESH_TOKEN_KEY, refreshToken),
      SecureStore.setItemAsync(USER_PROFILE_KEY, JSON.stringify(user)),
    ]);

    set({
      accessToken,
      refreshToken,
      user,
      isAuthenticated: true,
    });
  },

  updateTokens: async ({ accessToken, refreshToken }) => {
    await Promise.all([
      SecureStore.setItemAsync(ACCESS_TOKEN_KEY, accessToken),
      SecureStore.setItemAsync(REFRESH_TOKEN_KEY, refreshToken),
    ]);

    set({ accessToken, refreshToken });
  },

  clearSession: async () => {
    await Promise.all([
      SecureStore.deleteItemAsync(ACCESS_TOKEN_KEY),
      SecureStore.deleteItemAsync(REFRESH_TOKEN_KEY),
      SecureStore.deleteItemAsync(USER_PROFILE_KEY),
    ]);

    set({
      accessToken: null,
      refreshToken: null,
      user: null,
      isAuthenticated: false,
    });
  },
}));
