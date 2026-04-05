import { ReviewResponse, reviewsApi, usersApi } from '@/src/api/client';
import { useAuth } from '@/src/context/AuthContext';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, Image, Pressable, StyleSheet, View } from 'react-native';
import { Appbar, Divider, Text, useTheme } from 'react-native-paper';

// ─── Star display (read-only) ──────────────────────────────────────────────

function StarDisplay({ rating, size = 14 }: { rating: number; size?: number }) {
  const full = Math.round(rating);
  return (
    <View style={{ flexDirection: 'row', gap: 2 }}>
      {[1, 2, 3, 4, 5].map(s => (
        <Text key={s} style={{ fontSize: size, color: s <= full ? '#f5a623' : '#d1d5db' }}>★</Text>
      ))}
    </View>
  );
}

// ─── Review card ───────────────────────────────────────────────────────────

function ReviewCard({ item, theme }: { item: ReviewResponse; theme: any }) {
  const bookId = item.bookId.replace('/works/', '');

  return (
    <Pressable
      style={({ pressed }) => [styles.card, { opacity: pressed ? 0.75 : 1 }]}
      onPress={() => router.push({ pathname: '/book/[id]', params: { id: bookId } } as any)}
    >
      {item.coverImageUrl ? (
        <Image source={{ uri: item.coverImageUrl }} style={styles.cover} resizeMode="cover" />
      ) : (
        <View style={[styles.cover, styles.noCover, { backgroundColor: theme.colors.surface }]}>
          <Text style={{ fontSize: 10, color: theme.colors.onSurface, textAlign: 'center' }}>
            No Cover
          </Text>
        </View>
      )}

      <View style={styles.cardBody}>
        <Text variant="titleSmall" numberOfLines={2} style={{ color: theme.colors.onBackground, fontWeight: '700' }}>
          {item.bookTitle}
        </Text>
        <Text variant="bodySmall" numberOfLines={1} style={{ color: theme.colors.onSurface, opacity: 0.7 }}>
          {item.bookAuthor}
        </Text>

        <StarDisplay rating={Number(item.rating)} />

        {item.reviewText ? (
          <Text
            variant="bodySmall"
            numberOfLines={3}
            style={{ color: theme.colors.onSurface, marginTop: 4, lineHeight: 18 }}
          >
            {item.reviewText}
          </Text>
        ) : null}

        <Text variant="bodySmall" style={{ color: theme.colors.onSurface, opacity: 0.45, marginTop: 4 }}>
          {item.creationDate}
        </Text>
      </View>
    </Pressable>
  );
}

// ─── Main screen ───────────────────────────────────────────────────────────

export default function UserReviewsScreen() {
  const theme = useTheme();
  const { username } = useLocalSearchParams<{ username: string }>();
  const { token } = useAuth();

  const [reviews, setReviews] = useState<ReviewResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!token || !username) return;
    let cancelled = false;

    async function load() {
      try {
        setLoading(true);
        setError(null);
        const profile = await usersApi.getPublicProfileByUsername(username!, token!);
        const data = await reviewsApi.getUserReviews(profile.userId, token!);
        if (!cancelled) setReviews(data);
      } catch (e: any) {
        if (!cancelled) setError(e?.message || 'Failed to load reviews');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => { cancelled = true; };
  }, [username, token]);

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <Appbar.Header style={{ backgroundColor: theme.colors.background }}>
        <Appbar.BackAction onPress={() => router.back()} />
        <Appbar.Content
          title={username ? `${username}'s Reviews` : 'Reviews'}
          titleStyle={{ color: theme.colors.onBackground }}
        />
      </Appbar.Header>

      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
        </View>
      ) : error ? (
        <View style={styles.centered}>
          <Text style={{ color: theme.colors.error }}>{error}</Text>
        </View>
      ) : reviews.length === 0 ? (
        <View style={styles.centered}>
          <Text style={{ color: theme.colors.onSurface, opacity: 0.5 }}>No reviews yet.</Text>
        </View>
      ) : (
        <FlatList
          data={reviews}
          keyExtractor={item => String(item.reviewId)}
          ItemSeparatorComponent={() => <Divider />}
          renderItem={({ item }) => <ReviewCard item={item} theme={theme} />}
          contentContainerStyle={{ paddingBottom: 24 }}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  card: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 14,
  },
  cover: {
    width: 70,
    height: 100,
    borderRadius: 6,
    flexShrink: 0,
  },
  noCover: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardBody: {
    flex: 1,
    gap: 4,
    justifyContent: 'center',
  },
});
