import * as SecureStore from 'expo-secure-store';
import React, { createContext, ReactNode, useContext, useEffect, useState } from 'react';
import { authApi, UserProfile } from '../api/client';

const TOKEN_KEY = 'noveltea_auth_token';

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
        const stored = await SecureStore.getItemAsync(TOKEN_KEY);
        if (stored) {
          // Validate the stored token is still accepted by the backend
          const profile = await authApi.me(stored);
          setToken(stored);
          setUser(profile);
        }
      } catch {
        // Token is missing, expired, or backend is unreachable; clear it and
        // stay logged out. The user will be prompted to log in again
        await SecureStore.deleteItemAsync(TOKEN_KEY).catch(() => {});
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
    await SecureStore.setItemAsync(TOKEN_KEY, accessToken);
    setToken(accessToken);
    setUser(profile);
  };

  const logout = async () => {
    await SecureStore.deleteItemAsync(TOKEN_KEY).catch(() => {});
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, token, isLoading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}