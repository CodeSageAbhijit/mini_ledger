import * as SecureStore from 'expo-secure-store';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { UserProfile } from './authStore';

const ACCESS_TOKEN_KEY = 'miniledger_access_token';
const REFRESH_TOKEN_KEY = 'miniledger_refresh_token';
const USER_PROFILE_KEY = 'miniledger_user_profile';
const QUERY_CACHE_KEY = 'MINILEDGER_QUERY_CACHE';

export interface PersistedSession {
  accessToken: string | null;
  refreshToken: string | null;
  user: UserProfile | null;
}

export const sessionPersistence = {
  async load(): Promise<PersistedSession> {
    const [accessToken, refreshToken, userRaw] = await Promise.all([
      SecureStore.getItemAsync(ACCESS_TOKEN_KEY),
      SecureStore.getItemAsync(REFRESH_TOKEN_KEY),
      SecureStore.getItemAsync(USER_PROFILE_KEY),
    ]);

    return {
      accessToken,
      refreshToken,
      user: userRaw ? (JSON.parse(userRaw) as UserProfile) : null,
    };
  },

  async save(session: { accessToken: string; refreshToken: string; user: UserProfile }) {
    await Promise.all([
      SecureStore.setItemAsync(ACCESS_TOKEN_KEY, session.accessToken),
      SecureStore.setItemAsync(REFRESH_TOKEN_KEY, session.refreshToken),
      SecureStore.setItemAsync(USER_PROFILE_KEY, JSON.stringify(session.user)),
    ]);
  },

  async saveTokens(tokens: { accessToken: string; refreshToken: string }) {
    await Promise.all([
      SecureStore.setItemAsync(ACCESS_TOKEN_KEY, tokens.accessToken),
      SecureStore.setItemAsync(REFRESH_TOKEN_KEY, tokens.refreshToken),
    ]);
  },

  async clear() {
    await Promise.all([
      SecureStore.deleteItemAsync(ACCESS_TOKEN_KEY),
      SecureStore.deleteItemAsync(REFRESH_TOKEN_KEY),
      SecureStore.deleteItemAsync(USER_PROFILE_KEY),
      AsyncStorage.removeItem(QUERY_CACHE_KEY),
    ]);
  },
};
