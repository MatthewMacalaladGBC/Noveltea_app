import * as SecureStore from 'expo-secure-store';
import React, { createContext, ReactNode, useContext, useEffect, useState } from 'react';
import { Platform } from 'react-native';
import { authApi, UserProfile } from '../api/client';

const TOKEN_KEY = 'noveltea_auth_token';

const tokenStorage = {
  get: () =>
    Platform.OS === 'web'
      ? Promise.resolve(localStorage.getItem(TOKEN_KEY))
      : SecureStore.getItemAsync(TOKEN_KEY),
  set: (value: string) =>
    Platform.OS === 'web'
      ? Promise.resolve(localStorage.setItem(TOKEN_KEY, value))
      : SecureStore.setItemAsync(TOKEN_KEY, value),
  remove: () =>
    Platform.OS === 'web'
      ? Promise.resolve(localStorage.removeItem(TOKEN_KEY))
      : SecureStore.deleteItemAsync(TOKEN_KEY),
};

interface AuthContextValue {
  user: UserProfile | null;
  token: string | null;
  /** True while the stored session is being restored on app startup */
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  /** Re-fetches the current user's profile from the backend and updates state */
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue>({
  user: null,
  token: null,
  isLoading: true,
  login: async () => {},
  logout: async () => {},
  refreshUser: async () => {},
});

export const useAuth = () => useContext(AuthContext);

export function AuthContextProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function restoreSession() {
      try {
        const stored = await tokenStorage.get();
        if (stored) {
          const profile = await authApi.me(stored);
          setToken(stored);
          setUser(profile);
        }
      } catch {
        await tokenStorage.remove().catch(() => {});
      } finally {
        setIsLoading(false);
      }
    }
    restoreSession();
  }, []);

  const login = async (email: string, password: string) => {
    const { accessToken } = await authApi.login(email, password);
    const profile = await authApi.me(accessToken);
    await tokenStorage.set(accessToken);
    setToken(accessToken);
    setUser(profile);
  };

  const logout = async () => {
    await tokenStorage.remove().catch(() => {});
    setToken(null);
    setUser(null);
  };

  const refreshUser = async () => {
    if (!token) return;
    const profile = await authApi.me(token);
    setUser(profile);
  };

  return (
    <AuthContext.Provider value={{ user, token, isLoading, login, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}
