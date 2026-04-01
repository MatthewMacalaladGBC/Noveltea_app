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

// Mirrors UserDto.Response from the backend (own profile — includes email)
export interface UserProfile {
  userId: number;
  username: string;
  email: string;
  bio: string | null;
  privacy: boolean;
  role: string;
  joinDate: string; // "YYYY-MM-DD"
}

// Mirrors UserDto.PublicResponse (other users — no email)
export interface PublicUserProfile {
  userId: number;
  username: string;
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

// Mirrors BookListDto.Response
export interface BookList {
  listId: number;
  creatorId: number;
  creatorUsername: string;
  title: string;
  description: string | null;
  visibility: boolean;
  creationDate: string; // "YYYY-MM-DD"
  bookCount: number;
}

// Mirrors ListItemDto.Response
export interface ListItem {
  listItemId: number;
  listId: number;
  bookId: string;        // OpenLibrary key e.g. "/works/OL1234W"
  bookTitle: string;
  bookAuthor: string;
  coverImageUrl: string | null;
  sortOrder: number;
  addedDate: string;     // "YYYY-MM-DD"
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

// ---------------------------------------------------------------------------
// List endpoints
// ---------------------------------------------------------------------------

export const listsApi = {
  // Returns all lists owned by the authenticated user (including private)
  getMyLists: (token: string) =>
    request<BookList[]>('/lists/me', { token }),

  // Returns metadata for a single list
  getListById: (listId: number, token: string) =>
    request<BookList>(`/lists/${listId}`, { token }),

  // Returns all items in a list, ordered by sortOrder
  getListItems: (listId: number, token: string) =>
    request<ListItem[]>(`/list-items/list/${listId}`, { token }),

  // Adds a book to a list; book metadata is passed so the backend can cache it
  addToList: (
    listId: number,
    bookId: string,
    title: string,
    author: string,
    coverImageUrl: string | null,
    token: string,
  ) =>
    request<ListItem>('/list-items', {
      method: 'POST',
      token,
      body: JSON.stringify({ listId, bookId, title, author, coverImageUrl }),
    }),

  // Removes a book from a list
  removeFromList: (listItemId: number, token: string) =>
    request<void>(`/list-items/${listItemId}`, { method: 'DELETE', token }),

  // Creates a new list
  createList: (title: string, description: string | null, visibility: boolean, token: string) =>
    request<BookList>('/lists', {
      method: 'POST',
      token,
      body: JSON.stringify({ title, description, visibility }),
    }),

  // Updates an existing list's title, description, and/or visibility
  updateList: (listId: number, title: string, description: string | null, visibility: boolean, token: string) =>
    request<BookList>(`/lists/${listId}`, {
      method: 'PUT',
      token,
      body: JSON.stringify({ title, description, visibility }),
    }),

  // Deletes a list permanently
  deleteList: (listId: number, token: string) =>
    request<void>(`/lists/${listId}`, { method: 'DELETE', token }),

  // Returns public lists for another user
  getUserLists: (userId: number, token: string) =>
    request<BookList[]>(`/lists/user/${userId}`, { token }),
};

// ---------------------------------------------------------------------------
// User endpoints
// ---------------------------------------------------------------------------

export const usersApi = {
  // Returns public profile for any user by numeric ID (no email field)
  getPublicProfile: (userId: number, token: string) =>
    request<PublicUserProfile>(`/users/${userId}`, { token }),

  // Returns public profile by username — used for username-based routing
  getPublicProfileByUsername: (username: string, token: string) =>
    request<PublicUserProfile>(`/users/username/${encodeURIComponent(username)}`, { token }),

  // Searches public users by username — startsWith results sorted first
  search: (query: string, token: string) =>
    request<PublicUserProfile[]>(`/users/search?username=${encodeURIComponent(query)}`, { token }),
};

// ---------------------------------------------------------------------------
// Follower endpoints
// ---------------------------------------------------------------------------

export const followersApi = {
  getFollowerCount: (userId: number, token: string) =>
    request<number>(`/followers/${userId}/followers`, { token }),

  getFollowingCount: (userId: number, token: string) =>
    request<number>(`/followers/${userId}/following`, { token }),

  isFollowing: (targetUserId: number, token: string) =>
    request<boolean>(`/followers/${targetUserId}/is-following`, { token }),

  follow: (targetUserId: number, token: string) =>
    request<string>(`/followers/${targetUserId}`, { method: 'POST', token }),

  unfollow: (targetUserId: number, token: string) =>
    request<string>(`/followers/${targetUserId}`, { method: 'DELETE', token }),

  getFollowersList: (userId: number, token: string) =>
    request<PublicUserProfile[]>(`/followers/${userId}/followers/list`, { token }),

  getFollowingList: (userId: number, token: string) =>
    request<PublicUserProfile[]>(`/followers/${userId}/following/list`, { token }),
};

// ---------------------------------------------------------------------------
// Review endpoints
// ---------------------------------------------------------------------------

export interface ReviewResponse {
  reviewId: number;
  userId: number;
  username: string;
  bookId: string;
  bookTitle: string;
  bookAuthor: string;
  coverImageUrl: string | null;
  rating: string | number; // BigDecimal may arrive as string
  reviewText: string | null;
  likes: number;
  visibility: boolean;
  creationDate: string; // "YYYY-MM-DD"
}

// ---------------------------------------------------------------------------
// Book Club types
// ---------------------------------------------------------------------------

export interface BookClubResponse {
  bookClubId: number;
  name: string;
  description: string | null;
  privacy: boolean;
  creationDate: string; // "YYYY-MM-DD"
  memberCount: number;
  ownerUsername: string | null;
}

export interface BookClubMemberResponse {
  clubMemberId: number;
  bookClubId: number;
  clubName: string;
  userId: number;
  username: string;
  role: 'OWNER' | 'MODERATOR' | 'MEMBER';
  joinedDate: string;
}

export interface BookClubItemResponse {
  clubItemId: number;
  bookClubId: number;
  bookId: string;
  bookTitle: string;
  bookAuthor: string;
  coverImageUrl: string | null;
  status: 'ACTIVE' | 'UPCOMING' | 'COMPLETED';
  startDate: string | null;
  endDate: string | null;
  addedDate: string;
}

// ---------------------------------------------------------------------------
// Book Club endpoints
// ---------------------------------------------------------------------------

export const clubsApi = {
  getPublicClubs: (token: string) =>
    request<BookClubResponse[]>('/clubs', { token }),

  searchPublicClubs: (name: string, token: string) =>
    request<BookClubResponse[]>(`/clubs/search?name=${encodeURIComponent(name)}`, { token }),

  getMyClubs: (token: string) =>
    request<BookClubResponse[]>('/clubs/me', { token }),

  getClubById: (clubId: number, token: string) =>
    request<BookClubResponse>(`/clubs/${clubId}`, { token }),

  createClub: (name: string, description: string | null, privacy: boolean, token: string) =>
    request<BookClubResponse>('/clubs', {
      method: 'POST',
      token,
      body: JSON.stringify({ name, description, privacy }),
    }),

  updateClub: (
    clubId: number,
    data: { name?: string; description?: string | null; privacy?: boolean },
    token: string,
  ) =>
    request<BookClubResponse>(`/clubs/${clubId}`, {
      method: 'PUT',
      token,
      body: JSON.stringify(data),
    }),

  deleteClub: (clubId: number, token: string) =>
    request<void>(`/clubs/${clubId}`, { method: 'DELETE', token }),
};

export const clubMembersApi = {
  getMyMemberships: (token: string) =>
    request<BookClubMemberResponse[]>('/club-members/me', { token }),

  getMembersByClub: (clubId: number, token: string) =>
    request<BookClubMemberResponse[]>(`/club-members/club/${clubId}`, { token }),

  joinClub: (bookClubId: number, token: string) =>
    request<BookClubMemberResponse>('/club-members/join', {
      method: 'POST',
      token,
      body: JSON.stringify({ bookClubId }),
    }),

  leaveClub: (bookClubId: number, token: string) =>
    request<void>(`/club-members/leave/${bookClubId}`, { method: 'DELETE', token }),
};

export const clubItemsApi = {
  getItemsByClub: (clubId: number, token: string) =>
    request<BookClubItemResponse[]>(`/club-items/club/${clubId}`, { token }),

  getCurrentRead: (clubId: number, token: string) =>
    request<BookClubItemResponse>(`/club-items/club/${clubId}/current`, { token }),

  addBook: (
    bookClubId: number,
    bookId: string,
    title: string,
    author: string,
    coverImageUrl: string | null,
    token: string,
  ) =>
    request<BookClubItemResponse>('/club-items', {
      method: 'POST',
      token,
      body: JSON.stringify({ bookClubId, bookId, title, author, coverImageUrl }),
    }),

  updateItem: (
    clubItemId: number,
    data: { status?: 'ACTIVE' | 'UPCOMING' | 'COMPLETED'; startDate?: string; endDate?: string },
    token: string,
  ) =>
    request<BookClubItemResponse>(`/club-items/${clubItemId}`, {
      method: 'PATCH',
      token,
      body: JSON.stringify(data),
    }),

  removeBook: (clubItemId: number, token: string) =>
    request<void>(`/club-items/${clubItemId}`, { method: 'DELETE', token }),
};

// ---------------------------------------------------------------------------
// Review endpoints
// ---------------------------------------------------------------------------

export const reviewsApi = {
  // Returns the total number of reviews written by the authenticated user
  getMyCount: (token: string) =>
    request<number>('/reviews/me/count', { token }),

  // Returns reviews by a user — public only for others, all for own profile
  getUserReviews: (userId: number, token: string) =>
    request<ReviewResponse[]>(`/reviews/user/${userId}`, { token }),
};