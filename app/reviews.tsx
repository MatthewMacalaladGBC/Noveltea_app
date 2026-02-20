import React, { useEffect, useMemo, useState } from "react";
import { ScrollView, View } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { Appbar, Button, Text, TextInput, useTheme } from "react-native-paper";
import {
  createReview,
  deleteReview,
  getReviewsByBook,
  updateReview,
  ReviewResponse,
} from "@/src/lib/reviews";
import { useAuth } from "@/src/context/AuthContext";

function toNumber(x: any) {
  const n = typeof x === "number" ? x : parseFloat(String(x));
  return Number.isFinite(n) ? n : 0;
}

function pickErrorMessage(data: any) {
  // Handles common Spring validation shapes
  if (!data) return null;

  // your controller/service might throw: {message:"..."}
  if (typeof data.message === "string") return data.message;

  // sometimes: {error:"..."}
  if (typeof data.error === "string") return data.error;

  // sometimes: {errors:["a","b"]}
  if (Array.isArray(data.errors)) return data.errors.join(", ");

  // sometimes: {errors:{field:"msg"}}
  if (data.errors && typeof data.errors === "object") {
    return Object.entries(data.errors)
      .map(([k, v]) => `${k}: ${v}`)
      .join(", ");
  }

  // sometimes: {fieldErrors:[{field:"x", defaultMessage:"y"}]}
  if (Array.isArray(data.fieldErrors)) {
    return data.fieldErrors
      .map((e: any) => `${e.field || "field"}: ${e.defaultMessage || "invalid"}`)
      .join(", ");
  }

  return null;
}

export default function ReviewsScreen() {
  const theme = useTheme();
  const { token, user } = useAuth();

  // We MUST receive these from book details for CreateRequest validation:
  const params = useLocalSearchParams<{
    bookId?: string;
    title?: string;
    author?: string;
    coverImageUrl?: string;
  }>();

  const bookId = params.bookId || "";
  const title = params.title || "";
  const author = params.author || "";
  const coverImageUrl = params.coverImageUrl || "";

  const [reviews, setReviews] = useState<ReviewResponse[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // create form
  const [rating, setRating] = useState("5");
  const [reviewText, setReviewText] = useState("");

  // edit form
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editRating, setEditRating] = useState("5");
  const [editText, setEditText] = useState("");

  const missingBookInfo = !bookId || !title || !author;

  const canPost = useMemo(() => {
    const r = parseFloat(rating);
    return (
      !!token &&
      !missingBookInfo &&
      Number.isFinite(r) &&
      r >= 0 &&
      r <= 5 &&
      !loading
    );
  }, [token, rating, missingBookInfo, loading]);

  const loadReviews = async () => {
    if (!bookId) return;

    try {
      setLoading(true);
      setError(null);
      const data = await getReviewsByBook(bookId, token || undefined);
      setReviews(data);
    } catch (e: any) {
      setError(e?.message || "Failed to load reviews");
    } finally {
      setLoading(false);
    }
  };

  // reload if book changes OR login state changes
  useEffect(() => {
    loadReviews();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bookId, token]);

  const onSubmit = async () => {
    if (!token) {
      router.push("/auth/login");
      return;
    }

    if (missingBookInfo) {
      setError("Missing book info. Go back and open Reviews from the Book Details page.");
      return;
    }

    const r = parseFloat(rating);
    if (!Number.isFinite(r) || r < 0 || r > 5) {
      setError("Rating must be between 0 and 5.");
      return;
    }

    try {
      setLoading(true);
      setError(null);

      await createReview(
        {
          bookId,
          title,
          author,
          coverImageUrl: coverImageUrl || null,
          rating: r,
          reviewText: reviewText.trim() ? reviewText.trim() : null,
          visibility: true,
        },
        token
      );

      setReviewText("");
      setRating("5");
      await loadReviews();
    } catch (e: any) {
      setError(e?.message || "Failed to post review");
    } finally {
      setLoading(false);
    }
  };

  const startEdit = (r: ReviewResponse) => {
    setEditingId(r.reviewId);
    setEditRating(String(toNumber(r.rating)));
    setEditText(r.reviewText || "");
    setError(null);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditRating("5");
    setEditText("");
  };

  const saveEdit = async (reviewId: number) => {
    if (!token) {
      router.push("/auth/login");
      return;
    }

    const rNum = parseFloat(editRating);
    if (!Number.isFinite(rNum) || rNum < 0 || rNum > 5) {
      setError("Rating must be between 0 and 5.");
      return;
    }

    try {
      setLoading(true);
      setError(null);

      await updateReview(
        reviewId,
        {
          rating: rNum,
          reviewText: editText.trim() ? editText.trim() : null,
          // keep visibility as-is unless you want a toggle
        },
        token
      );

      cancelEdit();
      await loadReviews();
    } catch (e: any) {
      setError(e?.message || "Failed to update review");
    } finally {
      setLoading(false);
    }
  };

  const removeReview = async (reviewId: number) => {
    if (!token) {
      router.push("/auth/login");
      return;
    }

    try {
      setLoading(true);
      setError(null);

      await deleteReview(reviewId, token);

      // if you deleted the one you were editing, exit edit mode
      if (editingId === reviewId) cancelEdit();

      await loadReviews();
    } catch (e: any) {
      setError(e?.message || "Failed to delete review");
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <Appbar.Header style={{ backgroundColor: theme.colors.background }}>
        <Appbar.BackAction onPress={() => router.back()} />
        <Appbar.Content title="Reviews" />
      </Appbar.Header>

      <ScrollView contentContainerStyle={{ padding: 16, gap: 14 }}>
        {missingBookInfo && (
          <Text style={{ color: "#CC0000" }}>
            Missing book details. Open Reviews from a book details page.
          </Text>
        )}

        {/* Write review box */}
        {token ? (
          <View style={{ gap: 10, padding: 12, borderRadius: 12, backgroundColor: theme.colors.surface }}>
            <Text variant="titleMedium">Write a review</Text>

            <Text style={{ opacity: 0.7 }}>
              {title ? title : ""} {author ? `• ${author}` : ""}
            </Text>

            <TextInput
              label="Rating (0 - 5)"
              mode="outlined"
              keyboardType="decimal-pad"
              value={rating}
              onChangeText={setRating}
              disabled={loading}
            />

            <TextInput
              label="Review (optional)"
              mode="outlined"
              multiline
              numberOfLines={4}
              value={reviewText}
              onChangeText={setReviewText}
              disabled={loading}
            />

            <Button mode="contained" onPress={onSubmit} disabled={!canPost} loading={loading}>
              Post Review
            </Button>
          </View>
        ) : (
          <View style={{ gap: 10, padding: 12, borderRadius: 12, backgroundColor: theme.colors.surface }}>
            <Text>You must be logged in to write a review.</Text>
            <Button mode="contained" onPress={() => router.push("/auth/login")}>
              Login
            </Button>
          </View>
        )}

        {error ? <Text style={{ color: "#CC0000" }}>{error}</Text> : null}

        {/* List */}
        <View style={{ gap: 10 }}>
          <Text variant="titleMedium">All reviews</Text>

          {reviews.length === 0 ? (
            <Text style={{ opacity: 0.7 }}>No reviews yet.</Text>
          ) : (
            reviews.map((r) => {
              // only owner can edit/delete
              // If your AuthContext user uses "id" instead of "userId", change to: user?.id
              const isMine = !!user && r.userId === (user as any).userId;

              const isEditing = editingId === r.reviewId;

              return (
                <View
                  key={String(r.reviewId)}
                  style={{
                    padding: 12,
                    borderRadius: 12,
                    backgroundColor: theme.colors.surface,
                    gap: 8,
                  }}
                >
                  <Text style={{ fontWeight: "700" }}>
                    ⭐ {toNumber(r.rating).toFixed(1)} • {r.username || "User"}
                    {isMine ? " (you)" : ""}
                  </Text>

                  {!isEditing ? (
                    <>
                      {r.reviewText ? (
                        <Text style={{ opacity: 0.9 }}>{r.reviewText}</Text>
                      ) : (
                        <Text style={{ opacity: 0.6 }}>(rating only)</Text>
                      )}
                    </>
                  ) : (
                    <View style={{ gap: 10, marginTop: 6 }}>
                      <TextInput
                        label="Rating (0 - 5)"
                        mode="outlined"
                        keyboardType="decimal-pad"
                        value={editRating}
                        onChangeText={setEditRating}
                        disabled={loading}
                      />

                      <TextInput
                        label="Review (optional)"
                        mode="outlined"
                        multiline
                        numberOfLines={4}
                        value={editText}
                        onChangeText={setEditText}
                        disabled={loading}
                      />

                      <View style={{ flexDirection: "row", gap: 10 }}>
                        <Button
                          mode="contained"
                          onPress={() => saveEdit(r.reviewId)}
                          loading={loading}
                          disabled={loading}
                          style={{ flex: 1 }}
                        >
                          Save
                        </Button>

                        <Button
                          mode="outlined"
                          onPress={cancelEdit}
                          disabled={loading}
                          style={{ flex: 1 }}
                        >
                          Cancel
                        </Button>
                      </View>
                    </View>
                  )}

                  <Text style={{ fontSize: 12, opacity: 0.6 }}>
                    {r.creationDate ? `Created: ${r.creationDate}` : ""}
                  </Text>

                  {isMine && token ? (
                    <View style={{ flexDirection: "row", gap: 10, marginTop: 4 }}>
                      {!isEditing ? (
                        <>
                          <Button mode="outlined" onPress={() => startEdit(r)} disabled={loading} style={{ flex: 1 }}>
                            Edit
                          </Button>

                          <Button
                            mode="contained-tonal"
                            onPress={() => removeReview(r.reviewId)}
                            disabled={loading}
                            style={{ flex: 1 }}
                          >
                            Delete
                          </Button>
                        </>
                      ) : null}
                    </View>
                  ) : null}
                </View>
              );
            })
          )}
        </View>
      </ScrollView>
    </View>
  );
}