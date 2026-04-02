import { BookList, listsApi } from '@/src/api/client';
import { useAuth } from '@/src/context/AuthContext';
import { createReview, getReviewsByBook, updateReview } from '@/src/lib/reviews';
import { router, Stack, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Image, Modal, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { Appbar, Button, Chip, Portal, Snackbar, Text, useTheme } from 'react-native-paper';

interface BookDetails {
  key: string;
  title: string;
  authors?: Array<{ author: { key: string } }>;
  covers?: number[];
  first_publish_date?: string;
  description?: string | { value: string };
  subjects?: string[];
  language?: string[];
  number_of_pages?: number;
  publishers?: string[];
  isbn_13?: string[];
  ratings_average?: number;
  ratings_count?: number;
}

// ===== STAR RATING COMPONENT =====
interface StarRatingProps {
  value: number;
  onChange: (rating: number) => void;
  interactive?: boolean;
  size?: number;
  theme: any;
}

const StarRating = ({ value, onChange, interactive = true, size = 20, theme }: StarRatingProps) => {
  const [hover, setHover] = useState(0);

  return (
    <View style={{ flexDirection: 'row', gap: 4 }}>
      {[1, 2, 3, 4, 5].map((star) => (
        <Pressable
          key={star}
          onPress={() => interactive && onChange(star)}
          onPressIn={() => interactive && setHover(star)}
          onPressOut={() => interactive && setHover(0)}
          disabled={!interactive}
        >
          <Text
            style={{
              fontSize: size,
              color: star <= (hover || value) ? '#f5a623' : '#d1d5db',
            }}
          >
            ★
          </Text>
        </Pressable>
      ))}
    </View>
  );
};

// ===== TAG COMPONENT =====
interface TagProps {
  emoji: string;
  label: string;
  theme: any;
}

const Tag = ({ emoji, label, theme }: TagProps) => (
  <View style={[styles.tag, { backgroundColor: theme.colors.surface }]}>
    <Text style={[styles.tagText, { color: theme.colors.onSurface }]}>
      {emoji} {label}
    </Text>
  </View>
);

// ===== MAIN COMPONENT =====
export default function BookDetailsScreen() {
  const theme = useTheme();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { token, user } = useAuth();

  const [book, setBook] = useState<BookDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [authors, setAuthors] = useState('Unknown Author');
  const [userRating, setUserRating] = useState(0);
  const [existingReviewId, setExistingReviewId] = useState<number | null>(null);
  const [ratingLoading, setRatingLoading] = useState(false);
  const [isBlocked, setIsBlocked] = useState(false);

  // ── Library status ────────────────────────────────────────────────────────
  const [libraryListId, setLibraryListId] = useState<number | null>(null);
  const [libraryItemId, setLibraryItemId] = useState<number | null>(null);
  const [libraryLoading, setLibraryLoading] = useState(false);

  // ── Add to List picker ────────────────────────────────────────────────────
  const [userLists, setUserLists] = useState<BookList[]>([]);
  const [listPickerVisible, setListPickerVisible] = useState(false);
  const [addingToListId, setAddingToListId] = useState<number | null>(null);
  const [snackMessage, setSnackMessage] = useState<string | null>(null);

  // Fetch book details from OpenLibrary
  useEffect(() => {
    if (id) {
      fetchBookDetails(id);
    }
  }, [id]);

  // Check library status, load user's custom lists, and load existing rating
  useEffect(() => {
    if (!token || !id || !user) return;

    async function checkStatus() {
      try {
        const [allLists, reviews] = await Promise.all([
          listsApi.getMyLists(token!),
          getReviewsByBook(id!, token!),
        ]);

        const libraryList = allLists.find(l => l.title === 'Library');
        setUserLists(allLists.filter(l => l.title !== 'Library'));

        if (libraryList) {
          setLibraryListId(libraryList.listId);
          const items = await listsApi.getListItems(libraryList.listId, token!);
          const bookKey = `/works/${id}`;
          const existing = items.find(item => item.bookId === bookKey);
          if (existing) setLibraryItemId(existing.listItemId);
        }

        const myReview = reviews.find(r => r.userId === user!.userId);
        if (myReview) {
          setExistingReviewId(myReview.reviewId);
          setUserRating(Number(myReview.rating));
        }
      } catch {
        // Fail silently — buttons still render, just without pre-set state
      }
    }

    checkStatus();
  }, [token, id, user]);

  // ── Helpers ───────────────────────────────────────────────────────────────

  function calculateAge(dob: string): number {
    const birth = new Date(dob);
    const today = new Date();
    let age = today.getFullYear() - birth.getFullYear();
    const m = today.getMonth() - birth.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
    return age;
  }

  async function checkMaturity(isbn: string): Promise<boolean> {
    try {
      const res = await fetch(`https://www.googleapis.com/books/v1/volumes?q=isbn:${isbn}`);
      const data = await res.json();
      if (data.totalItems > 0) {
        return data.items[0].volumeInfo.maturityRating === 'MATURE';
      }
      return false;
    } catch {
      return false;
    }
  }

  const fetchWithTimeout = (url: string, ms = 15000) => {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), ms);
    return fetch(url, { signal: controller.signal }).finally(() => clearTimeout(timer));
  };

  const fetchBookDetails = async (bookId: string) => {
    setLoading(true);
    setError(null);
    try {
      const cleanId = bookId.replace('/works/', '');
      const response = await fetchWithTimeout(`https://openlibrary.org/works/${cleanId}.json`);

      if (!response.ok) {
        throw new Error(`Failed to fetch book details: ${response.status}`);
      }

      const data = await response.json();

      if (data.error) {
        throw new Error('Book not found');
      }

      // ── Maturity check ───────────────────────────────────────────────────
      if (user?.dateOfBirth && data.isbn_13?.[0]) {
        const age = calculateAge(user.dateOfBirth);
        if (age < 18) {
          const mature = await checkMaturity(data.isbn_13[0]);
          if (mature) {
            setIsBlocked(true);
            setLoading(false);
            return;
          }
        }
      }
      // ────────────────────────────────────────────────────────────────────

      setBook(data);

      if (data.authors && data.authors.length > 0) {
        const authorPromises = data.authors.slice(0, 3).map(async (a: any) => {
          const authorKey = a.author?.key?.replace('/authors/', '');
          if (!authorKey) return null;
          return fetchWithTimeout(`https://openlibrary.org/authors/${authorKey}.json`)
            .then(res => res.ok ? res.json() : null)
            .then(authorData => authorData?.name ?? null)
            .catch(() => null);
        });

        const names = await Promise.all(authorPromises);
        setAuthors(names.filter(Boolean).join(', ') || 'Unknown Author');
      }
    } catch (err: any) {
      console.error('Error fetching book details:', err);
      if (err?.name === 'AbortError') {
        setError('Request timed out. Open Library may be slow — please try again.');
      } else {
        setError(err instanceof Error ? err.message : 'Failed to load book details');
      }
    } finally {
      setLoading(false);
    }
  };

  const getDescription = (description: string | { value: string } | undefined) => {
    if (!description) return 'No description available.';
    if (typeof description === 'string') return description;
    return description.value || 'No description available.';
  };

  const getCoverUrl = (covers: number[] | undefined, size: 'S' | 'M' | 'L' = 'L') => {
    if (!covers || covers.length === 0) return null;
    return `https://covers.openlibrary.org/b/id/${covers[0]}-${size}.jpg`;
  };

  // ── Handlers ──────────────────────────────────────────────────────────────

  const handleAddToLibrary = async () => {
    if (!token || !book || !libraryListId) return;

    setLibraryLoading(true);
    try {
      if (libraryItemId !== null) {
        await listsApi.removeFromList(libraryItemId, token);
        setLibraryItemId(null);
      } else {
        const bookKey = `/works/${id}`;
        const coverForApi = getCoverUrl(book.covers, 'M');
        const result = await listsApi.addToList(
          libraryListId, bookKey, book.title, authors, coverForApi, token
        );
        setLibraryItemId(result.listItemId);
      }
    } catch (e) {
      console.error('Library action failed:', e);
    } finally {
      setLibraryLoading(false);
    }
  };

  const handleAddToList = async (listId: number) => {
    if (!token || !book) return;

    const listName = userLists.find(l => l.listId === listId)?.title ?? 'list';
    setAddingToListId(listId);
    try {
      const bookKey = `/works/${id}`;
      const coverForApi = getCoverUrl(book.covers, 'M');
      await listsApi.addToList(listId, bookKey, book.title, authors, coverForApi, token);
      setListPickerVisible(false);
      setSnackMessage(`Added to "${listName}"`);
    } catch (e) {
      console.error('Add to list failed:', e);
    } finally {
      setAddingToListId(null);
    }
  };

  const handleRating = async (rating: number) => {
    if (!token || !user || !book) return;
    setUserRating(rating);
    setRatingLoading(true);
    const isUpdate = existingReviewId !== null;
    try {
      if (isUpdate) {
        await updateReview(existingReviewId!, { rating }, token);
      } else {
        const result = await createReview(
          {
            bookId: id!,
            title: book.title,
            author: authors,
            coverImageUrl: getCoverUrl(book.covers, 'M'),
            rating,
          },
          token,
        );
        setExistingReviewId(result.reviewId);
      }
      setSnackMessage(isUpdate ? 'Rating updated!' : 'Rating saved!');
    } catch (e: any) {
      setSnackMessage(e?.message || 'Failed to save rating');
    } finally {
      setRatingLoading(false);
    }
  };

  const getTagEmoji = (subject: string): string => {
    const lowerSubject = subject.toLowerCase();
    if (lowerSubject.includes('fiction')) return '📘';
    if (lowerSubject.includes('adventure')) return '🌍';
    if (lowerSubject.includes('romance')) return '💕';
    if (lowerSubject.includes('mystery') || lowerSubject.includes('crime')) return '🔍';
    if (lowerSubject.includes('horror')) return '👻';
    if (lowerSubject.includes('science')) return '🔬';
    if (lowerSubject.includes('fantasy')) return '✨';
    if (lowerSubject.includes('history')) return '📜';
    if (lowerSubject.includes('biography')) return '👤';
    if (lowerSubject.includes('self')) return '💪';
    return '📖';
  };

  // ── Render states ─────────────────────────────────────────────────────────

  if (loading) {
    return (
      <>
        <Stack.Screen options={{ headerShown: false }} />
        <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
          <Appbar.Header style={{ backgroundColor: theme.colors.background, elevation: 0 }}>
            <Appbar.BackAction onPress={() => router.back()} />
            <Appbar.Content title="Book Details" titleStyle={{ color: theme.colors.onBackground }} />
          </Appbar.Header>
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={theme.colors.primary} />
            <Text style={[styles.loadingText, { color: theme.colors.onSurface }]}>Loading book details...</Text>
          </View>
        </View>
      </>
    );
  }

  if (isBlocked) {
    return (
      <>
        <Stack.Screen options={{ headerShown: false }} />
        <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
          <Appbar.Header style={{ backgroundColor: theme.colors.background, elevation: 0 }}>
            <Appbar.BackAction onPress={() => router.back()} />
          </Appbar.Header>
          <View style={styles.blockedContainer}>
            <Text style={styles.blockedEmoji}>📚</Text>
            <Text variant="headlineSmall" style={[styles.blockedTitle, { color: theme.colors.onBackground }]}>
              Sorry, maybe when you're a bit older
            </Text>
            <Text variant="bodyMedium" style={[styles.blockedSubtitle, { color: theme.colors.onSurface }]}>
              This book contains mature content and is only available to users aged 18 and over.
            </Text>
          </View>
        </View>
      </>
    );
  }

  if (error || !book) {
    return (
      <>
        <Stack.Screen options={{ headerShown: false }} />
        <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
          <Appbar.Header style={{ backgroundColor: theme.colors.background, elevation: 0 }}>
            <Appbar.BackAction onPress={() => router.back()} />
            <Appbar.Content title="Book Details" titleStyle={{ color: theme.colors.onBackground }} />
          </Appbar.Header>
          <View style={styles.errorContainer}>
            <Text style={[styles.errorText, { color: theme.colors.onSurface }]}>{error || 'Book not found'}</Text>
            <Button mode="contained" onPress={() => router.back()}>Go Back</Button>
          </View>
        </View>
      </>
    );
  }

  const coverUrl    = getCoverUrl(book.covers);
  const description = getDescription(book.description);
  const subjects    = book.subjects?.slice(0, 5) || [];
  const inLibrary   = libraryItemId !== null;

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />

      {/* ── Add to List picker (bottom sheet) ──────────────────────────────── */}
      <Modal
        visible={listPickerVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setListPickerVisible(false)}
      >
        <Pressable style={styles.pickerBackdrop} onPress={() => setListPickerVisible(false)}>
          <Pressable
            style={[styles.pickerSheet, { backgroundColor: theme.colors.surface }]}
            onPress={() => {}}
          >
            <Text variant="titleLarge" style={[styles.pickerTitle, { color: theme.colors.onSurface }]}>
              Add to List
            </Text>

            {userLists.length === 0 ? (
              <Text style={[styles.pickerEmpty, { color: theme.colors.onSurface }]}>
                No lists yet — create one from your Profile!
              </Text>
            ) : (
              <ScrollView style={styles.pickerScroll} showsVerticalScrollIndicator={false}>
                {userLists.map(list => (
                  <Pressable
                    key={list.listId}
                    style={({ pressed }) => [
                      styles.pickerItem,
                      { borderBottomColor: theme.colors.outline, opacity: pressed ? 0.6 : 1 },
                    ]}
                    onPress={() => handleAddToList(list.listId)}
                    disabled={addingToListId !== null}
                  >
                    <Text variant="bodyLarge" style={{ color: theme.colors.onSurface }}>
                      {list.title}
                    </Text>
                    {addingToListId === list.listId && (
                      <ActivityIndicator size="small" color={theme.colors.primary} />
                    )}
                  </Pressable>
                ))}
              </ScrollView>
            )}

            <Pressable style={styles.pickerCancel} onPress={() => setListPickerVisible(false)}>
              <Text style={[styles.pickerCancelText, { color: theme.colors.onSurface }]}>Cancel</Text>
            </Pressable>
          </Pressable>
        </Pressable>
      </Modal>

      <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <Appbar.Header style={{ backgroundColor: theme.colors.background, elevation: 0 }}>
          <Appbar.BackAction onPress={() => router.back()} />
          <Appbar.Content title="Book Details" titleStyle={{ color: theme.colors.onBackground }} />
        </Appbar.Header>

        <ScrollView style={styles.scrollContainer} showsVerticalScrollIndicator={false}>
          {/* BOOK COVER */}
          <View style={styles.coverSection}>
            {coverUrl ? (
              <Image source={{ uri: coverUrl }} style={styles.coverImage} resizeMode="cover" />
            ) : (
              <View style={[styles.placeholderCover, { backgroundColor: theme.colors.surface }]}>
                <Text style={[styles.placeholderText, { color: theme.colors.onSurface }]}>No Cover</Text>
              </View>
            )}
          </View>

          {/* TITLE & AUTHOR */}
          <View style={styles.titleSection}>
            <Text variant="headlineMedium" style={[styles.title, { color: theme.colors.onBackground }]}>
              {book.title}
            </Text>
            <Text variant="titleMedium" style={[styles.author, { color: theme.colors.onSurface }]}>
              {authors}
            </Text>
          </View>

          {/* TAGS & RATING DISPLAY */}
          <View style={styles.tagsSection}>
            {subjects.slice(0, 2).map((subject, index) => (
              <Tag key={index} emoji={getTagEmoji(subject)} label={subject} theme={theme} />
            ))}
            {book.ratings_average && book.ratings_average > 0 && (
              <View style={[styles.ratingTag, { backgroundColor: theme.colors.primary }]}>
                <Text style={[styles.ratingTagText, { color: '#fff' }]}>
                  ⭐ {book.ratings_average.toFixed(1)}
                </Text>
              </View>
            )}
          </View>

          {/* ACTION BUTTONS */}
          <View style={styles.actionsContainer}>
            {token ? (
              <>
                <Pressable
                  onPress={handleAddToLibrary}
                  disabled={libraryLoading}
                  style={[
                    styles.libraryButton,
                    { backgroundColor: inLibrary ? '#4ade80' : theme.colors.onBackground },
                  ]}
                >
                  {libraryLoading ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <Text style={styles.libraryButtonText}>
                      {inLibrary ? '✓ In Library' : 'Add to Library'}
                    </Text>
                  )}
                </Pressable>

                <Pressable
                  onPress={() => setListPickerVisible(true)}
                  style={[styles.addToListButton, { borderColor: theme.colors.onBackground }]}
                >
                  <Text style={[styles.addToListButtonText, { color: theme.colors.onBackground }]}>
                    + Add to List
                  </Text>
                </Pressable>
              </>
            ) : (
              <Pressable
                onPress={() => router.push('/auth/welcome')}
                style={[styles.libraryButton, { backgroundColor: theme.colors.onBackground }]}
              >
                <Text style={styles.libraryButtonText}>Sign in to save</Text>
              </Pressable>
            )}

            <Pressable
              onPress={() => {
                const cleanId = (id || '').replace('/works/', '');
                router.push({
                  pathname: '/reviews',
                  params: {
                    bookId: cleanId,
                    title: book.title,
                    author: authors,
                    coverImageURL: coverUrl || '',
                  },
                });
              }}
              style={[styles.libraryButton, { backgroundColor: theme.colors.primary }]}
            >
              <Text style={styles.libraryButtonText}>See Reviews</Text>
            </Pressable>

            {/* INTERACTIVE STAR RATING */}
            <View style={[styles.ratingInputContainer, { backgroundColor: theme.colors.surface }]}>
              <Text variant="labelSmall" style={{ color: theme.colors.onSurface, marginBottom: 6, opacity: 0.6 }}>
                {userRating > 0 ? 'Your Rating' : 'Rate this book'}
              </Text>
              {ratingLoading ? (
                <ActivityIndicator size="small" color={theme.colors.primary} />
              ) : (
                <StarRating
                  value={userRating}
                  onChange={handleRating}
                  interactive={!!token}
                  size={24}
                  theme={theme}
                />
              )}
            </View>
          </View>

          {/* BOOK DETAILS */}
          {(book.number_of_pages || book.language || book.publishers || book.isbn_13) && (
            <View style={styles.detailsSection}>
              <Text variant="titleLarge" style={[styles.sectionTitle, { color: theme.colors.onBackground }]}>
                Details
              </Text>
              <View style={styles.detailsGrid}>
                {book.number_of_pages && (
                  <View style={styles.detailItem}>
                    <Text variant="bodySmall" style={[styles.detailLabel, { color: theme.colors.onSurface }]}>Pages</Text>
                    <Text variant="bodyMedium" style={[styles.detailValue, { color: theme.colors.onBackground }]}>{book.number_of_pages}</Text>
                  </View>
                )}
                {book.language && book.language.length > 0 && book.language[0] && (
                  <View style={styles.detailItem}>
                    <Text variant="bodySmall" style={[styles.detailLabel, { color: theme.colors.onSurface }]}>Language</Text>
                    <Text variant="bodyMedium" style={[styles.detailValue, { color: theme.colors.onBackground }]}>{book.language[0].toUpperCase()}</Text>
                  </View>
                )}
                {book.publishers && book.publishers.length > 0 && book.publishers[0] && (
                  <View style={styles.detailItem}>
                    <Text variant="bodySmall" style={[styles.detailLabel, { color: theme.colors.onSurface }]}>Publisher</Text>
                    <Text variant="bodyMedium" style={[styles.detailValue, { color: theme.colors.onBackground }]}>{book.publishers[0]}</Text>
                  </View>
                )}
                {book.isbn_13 && book.isbn_13.length > 0 && book.isbn_13[0] && (
                  <View style={styles.detailItem}>
                    <Text variant="bodySmall" style={[styles.detailLabel, { color: theme.colors.onSurface }]}>ISBN-13</Text>
                    <Text variant="bodyMedium" style={[styles.detailValue, { color: theme.colors.onBackground }]}>{book.isbn_13[0]}</Text>
                  </View>
                )}
              </View>
            </View>
          )}

          {/* GENRES/SUBJECTS */}
          {subjects.length > 0 && (
            <View style={styles.subjectsSection}>
              <Text variant="titleLarge" style={[styles.sectionTitle, { color: theme.colors.onBackground }]}>
                Genres
              </Text>
              <View style={styles.subjectsContainer}>
                {subjects.map((subject, index) => (
                  <Chip
                    key={index}
                    style={[styles.subjectChip, { backgroundColor: theme.colors.surface }]}
                    textStyle={{ color: theme.colors.onSurface }}
                  >
                    {subject}
                  </Chip>
                ))}
              </View>
            </View>
          )}

          {/* DESCRIPTION */}
          <View style={styles.descriptionSection}>
            <Text variant="titleLarge" style={[styles.sectionTitle, { color: theme.colors.onBackground }]}>
              Description
            </Text>
            <Text variant="bodyMedium" style={[styles.description, { color: theme.colors.onSurface }]}>
              {description}
            </Text>
          </View>
        </ScrollView>
      </View>

      <Portal>
        <Snackbar
          visible={snackMessage !== null}
          onDismiss={() => setSnackMessage(null)}
          duration={2500}
        >
          {snackMessage}
        </Snackbar>
      </Portal>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContainer: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  loadingText: {
    marginTop: 16,
    textAlign: 'center',
  },
  blockedContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  blockedEmoji: {
    fontSize: 56,
    marginBottom: 20,
  },
  blockedTitle: {
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 12,
  },
  blockedSubtitle: {
    textAlign: 'center',
    opacity: 0.7,
    lineHeight: 22,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  errorText: {
    marginBottom: 20,
    textAlign: 'center',
    opacity: 0.7,
  },
  coverSection: {
    alignItems: 'center',
    paddingVertical: 24,
    paddingHorizontal: 20,
  },
  coverImage: {
    width: 160,
    height: 240,
    borderRadius: 12,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
  },
  placeholderCover: {
    width: 160,
    height: 240,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderText: {
    textAlign: 'center',
    opacity: 0.6,
    fontSize: 14,
  },
  titleSection: {
    paddingHorizontal: 20,
    paddingBottom: 16,
    alignItems: 'center',
  },
  title: {
    fontWeight: '700',
    marginBottom: 8,
    textAlign: 'center',
    lineHeight: 28,
  },
  author: {
    textAlign: 'center',
    opacity: 0.8,
    fontWeight: '600',
  },
  tagsSection: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    paddingHorizontal: 20,
    marginBottom: 20,
    gap: 8,
  },
  tag: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
  },
  tagText: {
    fontSize: 13,
    fontWeight: '500',
  },
  ratingTag: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
  },
  ratingTagText: {
    fontSize: 13,
    fontWeight: '600',
  },
  actionsContainer: {
    paddingHorizontal: 20,
    paddingBottom: 20,
    gap: 12,
  },
  libraryButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  libraryButtonText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 15,
  },
  addToListButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
  },
  addToListButtonText: {
    fontWeight: '700',
    fontSize: 15,
  },
  ratingInputContainer: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  detailsSection: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  sectionTitle: {
    fontWeight: '700',
    marginBottom: 16,
  },
  detailsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  detailItem: {
    width: '50%',
    marginBottom: 16,
  },
  detailLabel: {
    opacity: 0.7,
    marginBottom: 4,
    fontSize: 12,
  },
  detailValue: {
    fontWeight: '500',
  },
  subjectsSection: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  subjectsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  subjectChip: {
    marginBottom: 8,
  },
  descriptionSection: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  description: {
    lineHeight: 24,
    opacity: 0.9,
  },
  pickerBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  pickerSheet: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 32,
  },
  pickerTitle: {
    fontWeight: 'bold',
    marginBottom: 16,
  },
  pickerScroll: {
    maxHeight: 300,
  },
  pickerItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  pickerCancel: {
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 4,
  },
  pickerCancelText: {
    fontWeight: '600',
    fontSize: 15,
    opacity: 0.6,
  },
  pickerEmpty: {
    opacity: 0.6,
    textAlign: 'center',
    paddingVertical: 24,
    fontSize: 14,
  },
});