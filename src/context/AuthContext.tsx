import * as SecureStore from 'expo-secure-store';
import React, { createContext, ReactNode, useContext, useEffect, useState } from 'react';
import { Platform } from 'react-native';
import { authApi, UserProfile } from '../api/client';

const TOKEN_KEY = 'noveltea_auth_token';

// expo-secure-store uses native Keychain/Keystore APIs that don't exist in a
// browser. Fall back to localStorage on web so login works during local testing.
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

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface AuthContextValue {
  user: UserProfile | null;
  token: string | null;
  /** True while the stored session is being restored on app startup */
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

// ---------------------------------------------------------------------------
// Context
// ---------------------------------------------------------------------------

const AuthContext = createContext<AuthContextValue>({
  user: null,
  token: null,
  isLoading: true,
  login: async () => {},
  logout: async () => {},
});

export const useAuth = () => useContext(AuthContext);

// ---------------------------------------------------------------------------
// Provider
// ---------------------------------------------------------------------------

export function AuthContextProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // On mount: attempt to restore a previously stored session
  useEffect(() => {
    async function restoreSession() {
      try {
        const stored = await tokenStorage.get();
        if (stored) {
          // Validate the stored token is still accepted by the backend
          const profile = await authApi.me(stored);
          setToken(stored);
          setUser(profile);
        }
      } catch {
        // Token is missing, expired, or backend is unreachable; clear it and
        // stay logged out. The user will be prompted to log in again
        await tokenStorage.remove().catch(() => {});
      } finally {
        setIsLoading(false);
      }
    }

    restoreSession();
  }, []);

  // Called by the login screen after the user submits their credentials
  const login = async (email: string, password: string) => {
    const { accessToken } = await authApi.login(email, password);
    // Fetch the full profile immediately so the rest of the app has all fields
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

  return (
    <AuthContext.Provider value={{ user, token, isLoading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}