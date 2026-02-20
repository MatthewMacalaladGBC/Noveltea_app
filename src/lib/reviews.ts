const API_URL = process.env.EXPO_PUBLIC_API_URL || "http://10.0.2.2:8080";

export type ReviewResponse = {
  reviewId: number;
  userId: number;
  username: string;
  bookId: string;
  bookTitle: string;
  bookAuthor: string;
  coverImageUrl?: string | null;
  rating: string | number; // backend BigDecimal may come as string
  reviewText?: string | null;
  likes: number;
  visibility: boolean;
  creationDate: string; // LocalDate serialized
};

export async function getReviewsByBook(bookId: string, token?: string): Promise<ReviewResponse[]> {
  const res = await fetch(`${API_URL}/reviews/book/${bookId}`, {
    method: "GET",
    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
  });

  const data = await res.json().catch(() => []);
  if (!res.ok) {
    throw new Error(data?.message || "Failed to load reviews");
  }
  return Array.isArray(data) ? data : [];
}

export type CreateReviewPayload = {
  bookId: string;
  title: string;
  author: string;
  coverImageUrl?: string | null;
  rating: number; // we'll send number, backend accepts BigDecimal
  reviewText?: string | null;
  visibility?: boolean | null;
};

export async function createReview(payload: CreateReviewPayload, token: string) {
  const res = await fetch(`${API_URL}/reviews`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  });

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    const msg =
      data?.message ||
      data?.error ||
      (Array.isArray(data?.errors) ? data.errors.join(", ") : null) ||
      "Failed to create review";
    throw new Error(msg);
  }

  return data;
}
export type UpdateReviewPayload = {
  rating?: number;
  reviewText?: string | null;
  visibility?: boolean;
};

export async function updateReview(reviewId: number, payload: UpdateReviewPayload, token: string) {
  const res = await fetch(`${API_URL}/reviews/${reviewId}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const msg = data?.message || data?.error || "Failed to update review";
    throw new Error(msg);
  }
  return data;
}

export async function deleteReview(reviewId: number, token: string) {
  const res = await fetch(`${API_URL}/reviews/${reviewId}`, {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    const msg = data?.message || data?.error || "Failed to delete review";
    throw new Error(msg);
  }
}