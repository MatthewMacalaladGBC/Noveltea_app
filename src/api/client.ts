// Base URL from .env — falls back to localhost for local dev
const BASE_URL = (process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:8080').replace(/\/$/, '');

// ---------------------------------------------------------------------------
// Types — mirrors the backend DTOs exactly
// ---------------------------------------------------------------------------

export interface AuthResponse {
  accessToken: string;
  user: {
    userId: number;
    username: string;
    email: string;
  };
}

// Mirrors UserDto.Response from the backend
export interface UserProfile {
  userId: number;
  username: string;
  email: string;
  bio: string | null;
  privacy: boolean;
  role: string;
  joinDate: string; // "YYYY-MM-DD"
}

// ---------------------------------------------------------------------------
// Internal fetch helper
// ---------------------------------------------------------------------------

async function request<T>(
  path: string,
  options: RequestInit & { token?: string } = {}
): Promise<T> {
  const { token, ...rest } = options;

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };

  const response = await fetch(`${BASE_URL}${path}`, { ...rest, headers });

  // Attempt to parse JSON — fall back gracefully if the body isn't JSON
  const body = await response.json().catch(() => ({
    message: `Server error (${response.status})`,
  }));

  if (!response.ok) {
    throw new Error(body.message ?? `Request failed with status ${response.status}`);
  }

  return body as T;
}

// ---------------------------------------------------------------------------
// Auth endpoints
// ---------------------------------------------------------------------------

export const authApi = {
  login: (email: string, password: string) =>
    request<AuthResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }),

  register: (username: string, email: string, password: string) =>
    request<AuthResponse>('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ username, email, password }),
    }),

  // Fetches the full profile for the currently authenticated user
  me: (token: string) =>
    request<UserProfile>('/auth/me', { token }),
};