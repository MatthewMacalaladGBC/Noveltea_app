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
  dateOfBirth: string; // "YYYY-MM-DD"
  points?: number;
  reviewLikesReceived?: number;
  currentStreak?: number;
  longestStreak?: number;
  lastActiveDate?: string | null;
}

// Mirrors UserDto.PublicResponse (other users — no email)
export interface PublicUserProfile {
  userId: number;
  username: string;
  bio: string | null;
  privacy: boolean;
  role: string;
  joinDate: string; // "YYYY-MM-DD"
  points?: number;
  reviewLikesReceived?: number;
  currentStreak?: number;
  longestStreak?: number;
  lastActiveDate?: string | null;
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

  // Attempt to parse JSON — null for empty bodies (e.g. 204 No Content)
  let body: any = null;
  try {
    body = await response.json();
  } catch {
    // empty body — body stays null
  }

  if (!response.ok) {
    throw new Error(body?.message ?? `Request failed with status ${response.status}`);
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

  register: (username: string, email: string, password: string, dateOfBirth: string) =>
    request<AuthResponse>('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ username, email, password, dateOfBirth }),
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

  getLeaderboard: (token: string) =>
    request<PublicUserProfile[]>('/users/leaderboard', { token }),
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

export interface ClubJoinRequestResponse {
  requestId: number;
  bookClubId: number;
  clubName: string;
  userId: number;
  username: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  requestedAt: string; // "YYYY-MM-DD"
}

export const clubsApi = {
  getPublicClubs: (token: string) =>
    request<BookClubResponse[]>('/clubs', { token }),

  searchPublicClubs: (name: string, token: string) =>
    request<BookClubResponse[]>(`/clubs/search?name=${encodeURIComponent(name)}`, { token }),

  searchAllClubs: (name: string, token: string) =>
    request<BookClubResponse[]>(`/clubs/search/all?name=${encodeURIComponent(name)}`, { token }),

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

  updateRole: (bookClubId: number, userId: number, role: 'OWNER' | 'MODERATOR' | 'MEMBER', token: string) =>
    request<BookClubMemberResponse>(`/club-members/${bookClubId}/role`, {
      method: 'PUT',
      token,
      body: JSON.stringify({ userId, role }),
    }),

  removeMember: (bookClubId: number, targetUserId: number, token: string) =>
    request<void>(`/club-members/${bookClubId}/remove/${targetUserId}`, {
      method: 'DELETE',
      token,
    }),
};

export const clubJoinRequestsApi = {
  requestJoin: (bookClubId: number, token: string) =>
    request<ClubJoinRequestResponse>('/club-join-requests', {
      method: 'POST',
      token,
      body: JSON.stringify({ bookClubId }),
    }),

  cancelRequest: (requestId: number, token: string) =>
    request<void>(`/club-join-requests/${requestId}`, { method: 'DELETE', token }),

  approveRequest: (requestId: number, token: string) =>
    request<BookClubMemberResponse>(`/club-join-requests/${requestId}/approve`, { method: 'POST', token }),

  rejectRequest: (requestId: number, token: string) =>
    request<void>(`/club-join-requests/${requestId}/reject`, { method: 'POST', token }),

  getPendingRequests: (clubId: number, token: string) =>
    request<ClubJoinRequestResponse[]>(`/club-join-requests/club/${clubId}/pending`, { token }),

  // Returns null if no request exists for this club
  getMyRequest: (clubId: number, token: string) =>
    request<ClubJoinRequestResponse>(`/club-join-requests/my/${clubId}`, { token }),
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
    startDate?: string,
    endDate?: string,
  ) =>
    request<BookClubItemResponse>('/club-items', {
      method: 'POST',
      token,
      body: JSON.stringify({ bookClubId, bookId, title, author, coverImageUrl, startDate, endDate }),
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
// Club Announcement types + endpoints
// ---------------------------------------------------------------------------

export interface ClubAnnouncementResponse {
  announcementId: number;
  clubId: number;
  authorUsername: string;
  content: string;
  updatedAt: string; // ISO datetime
}

export const clubAnnouncementsApi = {
  get: (clubId: number, token: string) =>
    request<ClubAnnouncementResponse>(`/clubs/${clubId}/announcement`, { token }),

  set: (clubId: number, content: string, token: string) =>
    request<ClubAnnouncementResponse>(`/clubs/${clubId}/announcement`, {
      method: 'PUT',
      token,
      body: JSON.stringify({ content }),
    }),

  delete: (clubId: number, token: string) =>
    request<void>(`/clubs/${clubId}/announcement`, { method: 'DELETE', token }),
};

// ---------------------------------------------------------------------------
// Club Poll types + endpoints
// ---------------------------------------------------------------------------

export interface ClubPollOptionResponse {
  optionId: number;
  optionText: string;
  voteCount: number;
}

export interface ClubPollResponse {
  pollId: number;
  clubId: number;
  question: string;
  active: boolean;
  createdAt: string; // ISO datetime
  createdByUsername: string;
  options: ClubPollOptionResponse[];
  userVotedOptionId: number | null;
}

export const clubPollsApi = {
  getActive: (clubId: number, token: string) =>
    request<ClubPollResponse>(`/clubs/${clubId}/poll/active`, { token }),

  create: (clubId: number, question: string, options: string[], token: string) =>
    request<ClubPollResponse>(`/clubs/${clubId}/poll`, {
      method: 'POST',
      token,
      body: JSON.stringify({ question, options }),
    }),

  vote: (pollId: number, optionId: number, token: string) =>
    request<ClubPollResponse>(`/polls/${pollId}/vote`, {
      method: 'POST',
      token,
      body: JSON.stringify({ optionId }),
    }),

  close: (pollId: number, token: string) =>
    request<ClubPollResponse>(`/polls/${pollId}/close`, { method: 'POST', token }),

  delete: (pollId: number, token: string) =>
    request<void>(`/polls/${pollId}`, { method: 'DELETE', token }),
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

// ---------------------------------------------------------------------------
// Chat types + endpoints
// ---------------------------------------------------------------------------

export interface ChatMessageResponse {
  messageId: number;
  clubId: number;
  room: 'GENERAL' | 'BOOK_DISCUSSION';
  senderUserId: number;
  senderUsername: string;
  content: string;
  sentAt: string; // ISO datetime e.g. "2026-04-04T14:30:00"
  // Only set for BOOK_DISCUSSION messages when a book was active at send time
  bookId: string | null;
  bookTitle: string | null;
  bookCoverUrl: string | null;
}

export const chatApi = {
  // Initial load — 50 most recent messages, oldest-first
  getMessages: (clubId: number, room: 'GENERAL' | 'BOOK_DISCUSSION', token: string) =>
    request<ChatMessageResponse[]>(`/clubs/${clubId}/chat/${room}`, { token }),

  // Poll — messages newer than afterId, ascending
  getMessagesSince: (clubId: number, room: 'GENERAL' | 'BOOK_DISCUSSION', afterId: number, token: string) =>
    request<ChatMessageResponse[]>(`/clubs/${clubId}/chat/${room}?after=${afterId}`, { token }),

  // Scroll-up pagination — 50 messages older than beforeId, ascending
  getMessagesBefore: (clubId: number, room: 'GENERAL' | 'BOOK_DISCUSSION', beforeId: number, token: string) =>
    request<ChatMessageResponse[]>(`/clubs/${clubId}/chat/${room}?before=${beforeId}`, { token }),

  // Send a message
  sendMessage: (clubId: number, room: 'GENERAL' | 'BOOK_DISCUSSION', content: string, token: string) =>
    request<ChatMessageResponse>(`/clubs/${clubId}/chat`, {
      method: 'POST',
      token,
      body: JSON.stringify({ room, content }),
    }),
};