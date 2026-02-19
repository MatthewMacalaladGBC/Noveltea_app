import { router, Stack, useLocalSearchParams } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Image, ScrollView, StyleSheet, View, Pressable } from 'react-native';
import { Appbar, Button, Chip, Text, useTheme } from 'react-native-paper';

interface BookDetails {
  key: string;
  title: string;
  authors?: Array<{ name: string; key?: string }>;
  cover_id?: number;
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
  <View
    style={[
      styles.tag,
      {
        backgroundColor: theme.colors.surface,
      },
    ]}
  >
    <Text style={[styles.tagText, { color: theme.colors.onSurface }]}>
      {emoji} {label}
    </Text>
  </View>
);

// ===== MAIN COMPONENT =====
export default function BookDetailsScreen() {
  const theme = useTheme();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [book, setBook] = useState<BookDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [inLibrary, setInLibrary] = useState(false);
  const [userRating, setUserRating] = useState(0);

  useEffect(() => {
    if (id) {
      fetchBookDetails(id);
    }
  }, [id]);

  const fetchBookDetails = async (bookId: string) => {
    setLoading(true);
    setError(null);
    try {
      const cleanId = bookId.replace('/works/', '');
      const response = await fetch(`https://openlibrary.org/works/${cleanId}.json`);

      if (!response.ok) {
        throw new Error(`Failed to fetch book details: ${response.status}`);
      }

      const data = await response.json();

      if (data.error) {
        throw new Error('Book not found');
      }

      setBook(data);
    } catch (err) {
      console.error('Error fetching book details:', err);
      setError(err instanceof Error ? err.message : 'Failed to load book details');
    } finally {
      setLoading(false);
    }
  };

  const getDescription = (description: string | { value: string } | undefined) => {
    if (!description) return 'No description available.';
    if (typeof description === 'string') return description;
    return description.value || 'No description available.';
  };

  const getCoverUrl = (coverId: number | undefined, size: 'S' | 'M' | 'L' = 'L') => {
    if (!coverId) return null;
    return `https://covers.openlibrary.org/b/id/${coverId}-${size}.jpg`;
  };

  const handleAddToLibrary = () => {
    setInLibrary(!inLibrary);
    // TODO: Persist to async storage or backend
  };

  const handleRating = (rating: number) => {
    setUserRating(rating);
    // TODO: Persist to async storage or backend
  };

  // Map subjects to emoji tags
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

  const coverUrl = getCoverUrl(book.cover_id);
  const description = getDescription(book.description);
  const authors = book.authors?.map(author => author.name).filter(name => name).join(', ') || 'Unknown Author';
  const subjects = book.subjects?.slice(0, 5) || [];

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <Appbar.Header style={{ backgroundColor: theme.colors.background, elevation: 0 }}>
          <Appbar.BackAction onPress={() => router.back()} />
          <Appbar.Content title="Book Details" titleStyle={{ color: theme.colors.onBackground }} />
        </Appbar.Header>

        <ScrollView style={styles.scrollContainer} showsVerticalScrollIndicator={false}>
          {/* BOOK COVER - CENTERED */}
          <View style={styles.coverSection}>
            {coverUrl ? (
              <Image
                source={{ uri: coverUrl }}
                style={styles.coverImage}
                resizeMode="cover"
              />
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
            <Pressable
              onPress={handleAddToLibrary}
              style={[
                styles.libraryButton,
                {
                  backgroundColor: inLibrary ? '#4ade80' : theme.colors.onBackground,
                },
              ]}
            >
              <Text style={styles.libraryButtonText}>
                {inLibrary ? '✓ In Library' : 'Add to Library'}
              </Text>
            </Pressable>

            {/* INTERACTIVE STAR RATING */}
            <View style={[styles.ratingInputContainer, { backgroundColor: theme.colors.surface }]}>
              <StarRating
                value={userRating}
                onChange={handleRating}
                interactive={true}
                size={24}
                theme={theme}
              />
            </View>
          </View>

          {/* Book Details */}
          {(book.number_of_pages || book.language || book.publishers || book.isbn_13) && (
            <View style={styles.detailsSection}>
              <Text variant="titleLarge" style={[styles.sectionTitle, { color: theme.colors.onBackground }]}>
                Details
              </Text>

              <View style={styles.detailsGrid}>
                {book.number_of_pages && (
                  <View style={styles.detailItem}>
                    <Text variant="bodySmall" style={[styles.detailLabel, { color: theme.colors.onSurface }]}>
                      Pages
                    </Text>
                    <Text variant="bodyMedium" style={[styles.detailValue, { color: theme.colors.onBackground }]}>
                      {book.number_of_pages}
                    </Text>
                  </View>
                )}

                {book.language && book.language.length > 0 && book.language[0] && (
                  <View style={styles.detailItem}>
                    <Text variant="bodySmall" style={[styles.detailLabel, { color: theme.colors.onSurface }]}>
                      Language
                    </Text>
                    <Text variant="bodyMedium" style={[styles.detailValue, { color: theme.colors.onBackground }]}>
                      {book.language[0].toUpperCase()}
                    </Text>
                  </View>
                )}

                {book.publishers && book.publishers.length > 0 && book.publishers[0] && (
                  <View style={styles.detailItem}>
                    <Text variant="bodySmall" style={[styles.detailLabel, { color: theme.colors.onSurface }]}>
                      Publisher
                    </Text>
                    <Text variant="bodyMedium" style={[styles.detailValue, { color: theme.colors.onBackground }]}>
                      {book.publishers[0]}
                    </Text>
                  </View>
                )}

                {book.isbn_13 && book.isbn_13.length > 0 && book.isbn_13[0] && (
                  <View style={styles.detailItem}>
                    <Text variant="bodySmall" style={[styles.detailLabel, { color: theme.colors.onSurface }]}>
                      ISBN-13
                    </Text>
                    <Text variant="bodyMedium" style={[styles.detailValue, { color: theme.colors.onBackground }]}>
                      {book.isbn_13[0]}
                    </Text>
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

  // === COVER SECTION ===
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

  // === TITLE SECTION ===
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

  // === TAGS SECTION ===
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

  // === ACTIONS SECTION ===
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
  ratingInputContainer: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // === DETAILS SECTION ===
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

  // === SUBJECTS SECTION ===
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

  // === DESCRIPTION SECTION ===
  descriptionSection: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  description: {
    lineHeight: 24,
    opacity: 0.9,
  },
});