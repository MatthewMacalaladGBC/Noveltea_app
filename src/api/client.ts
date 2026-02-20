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

const REQUEST_TIMEOUT_MS = 8000;

async function request<T>(
  path: string,
  options: RequestInit & { token?: string } = {}
): Promise<T> {
  const { token, ...rest } = options;

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  let response: Response;
  try {
    response = await fetch(`${BASE_URL}${path}`, { ...rest, headers, signal: controller.signal });
  } catch (e: any) {
    if (e?.name === 'AbortError') {
      throw new Error('Request timed out. Is the server running?');
    }
    throw new Error('Network error. Check your connection or server status.');
  } finally {
    clearTimeout(timeoutId);
  }

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