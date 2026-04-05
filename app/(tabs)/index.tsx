import BookCard from '@/src/components/cards/BookCard';
import { useAuth } from '@/src/context/AuthContext';
import { useThemeContext } from '@/src/ThemeContext';
import { router } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, Image, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import { Button, IconButton, Searchbar, Text, useTheme } from 'react-native-paper';

interface Book {
  key: string;
  title: string;
  author_name?: string[];
  cover_i?: number;
}

export default function HomeScreen() {
  const theme = useTheme();
  const { isDark, toggleTheme } = useThemeContext();
  const { user } = useAuth();
  const [books, setBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  const fetchTrending = () => {
    setLoading(true);
    const FICTION_GENRES = ['fantasy', 'science_fiction', 'romance'];
    const TIMEOUT_MS = 10000;

    Promise.all(
      FICTION_GENRES.map(genre => {
        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
        return fetch(
          `https://openlibrary.org/subjects/${genre}.json?sort=trending&limit=5`,
          { signal: controller.signal }
        )
          .then(res => res.ok ? res.json() : null)
          .then(data => (data?.works ?? []).map((w: any) => ({
            key: w.key,
            title: w.title,
            author_name: w.authors?.map((a: any) => a.name),
            cover_i: w.cover_id,
          })))
          .catch(() => [])
          .finally(() => clearTimeout(timer));
      })
    )
      .then(results => setBooks(results.flat()))
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchTrending(); }, []);

  const categories = [
    { name: 'Romance', icon: '💕', apiGenre: 'romance' },
    { name: 'Sci-Fi', icon: '🚀', apiGenre: 'science_fiction' },
    { name: 'Mystery', icon: '🔍', apiGenre: 'mystery' },
    { name: 'Thriller', icon: '🔪', apiGenre: 'thriller' },
    { name: 'Historical', icon: '📜', apiGenre: 'historical_fiction' },
    { name: 'Kids', icon: '👶', apiGenre: 'children' },
    { name: 'Non-Fiction', icon: '📖', apiGenre: 'nonfiction' },
    { name: 'YA', icon: '🎓', apiGenre: 'young_adult' },
    { name: 'Horror', icon: '👻', apiGenre: 'horror' },
    { name: 'Fantasy', icon: '🧙', apiGenre: 'fantasy' },
  ];

  const handleCategoryPress = (apiGenre: string) => {
    router.push(`/category/${apiGenre}` as any);
  };

  const renderTrendingItem = useCallback(({ item }: { item: Book }) => {
    const title = item?.title || 'Unknown Title';
    const author = item?.author_name?.[0] || 'Unknown Author';
    const coverUrl = item?.cover_i
      ? `https://covers.openlibrary.org/b/id/${item.cover_i}-M.jpg`
      : '';
    const bookId = item.key.replace('/works/', '');
    return (
      <BookCard
        title={title}
        author={author}
        coverUrl={coverUrl}
        bookId={item.key}
        onPress={() => router.push({ pathname: '/book/[id]', params: { id: bookId } })}
      />
    );
  }, []);

  return (
    <ScrollView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      {/* Header */}
      <View style={styles.header}>
        <Searchbar
          placeholder="Search"
          onChangeText={setSearchQuery}
          value={searchQuery}
          onSubmitEditing={() => {
            if (searchQuery.trim()) {
              router.push({
                pathname: '/(tabs)/explore',
                params: { query: searchQuery.trim() },
              } as any);
            }
          }}
          style={[styles.searchBar, { backgroundColor: theme.colors.surface }]}
          inputStyle={{ color: theme.colors.onSurface }}
        />

        <IconButton
          icon={isDark ? "white-balance-sunny" : "moon-waning-crescent"}
          size={24}
          onPress={toggleTheme}
          iconColor={theme.colors.onBackground}
        />

        {!user && (
          <Button
            mode="outlined"
            style={styles.loginButton}
            textColor={theme.colors.onBackground}
            onPress={() => router.push('/auth/welcome')}
          >
            Login / Signup
          </Button>
        )}
      </View>

      {/* Logo and Tagline */}
      <View style={styles.brandSection}>
        <View style={styles.logoContainer}>
          <Image
            source={require('@/assets/images/Noveltea-logo.png')}
            style={styles.logoImage}
            resizeMode="contain"
          />
          <Text variant="displayLarge" style={[styles.logo, { color: theme.colors.onBackground }]}>
            NovelTea
          </Text>
        </View>
        <Text variant="bodyLarge" style={[styles.tagline, { color: theme.colors.onSurface }]}>
          Discover your next great read
        </Text>
      </View>

      {/* Category Section */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text variant="headlineSmall" style={[styles.sectionTitle, { color: theme.colors.onBackground }]}>
            Category
          </Text>
          <Text style={[styles.seeAll, { color: theme.colors.onBackground }]}>›</Text>
        </View>

        <FlatList
          horizontal
          data={categories}
          keyExtractor={(item) => item.apiGenre}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.categoryItem}
              onPress={() => handleCategoryPress(item.apiGenre)}
            >
              <View style={[styles.categoryCircle, { backgroundColor: theme.colors.onBackground }]}>
                <Text style={styles.categoryIcon}>{item.icon}</Text>
              </View>
              <Text style={[styles.categoryName, { color: theme.colors.onBackground }]}>
                {item.name}
              </Text>
            </TouchableOpacity>
          )}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.horizontalList}
        />
      </View>

      {/* Trending Section */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text variant="headlineSmall" style={[styles.sectionTitle, { color: theme.colors.onBackground }]}>
            Trending
          </Text>
          <TouchableOpacity onPress={() => router.push({ pathname: '/(tabs)/explore', params: { mode: 'trending' } } as any)}>
            <Text style={[styles.seeAll, { color: theme.colors.onBackground }]}>›</Text>
          </TouchableOpacity>
        </View>
        {loading && (
          <ActivityIndicator style={{ marginVertical: 16 }} color={theme.colors.primary} />
        )}
        {!loading && books.length === 0 && (
          <Button
            mode="outlined"
            onPress={fetchTrending}
            style={{ marginHorizontal: 16, marginBottom: 8 }}
          >
            Retry
          </Button>
        )}
        <FlatList
          horizontal
          data={books.slice(0, 15)}
          keyExtractor={(item, index) => `${item.key}-${index}`}
          renderItem={renderTrendingItem}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.horizontalList}
        />
      </View>

      {/* Book Clubs promo */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text variant="headlineSmall" style={[styles.sectionTitle, { color: theme.colors.onBackground }]}>
            Book Clubs
          </Text>
        </View>
        <TouchableOpacity
          style={[styles.clubsPromo, { backgroundColor: theme.colors.surface }]}
          onPress={() => router.push('/(tabs)/clubs' as any)}
        >
          <Text style={styles.clubsPromoEmoji}>📚</Text>
          <View style={{ flex: 1 }}>
            <Text style={[styles.clubsPromoTitle, { color: theme.colors.onSurface }]}>
              Discover & Join Book Clubs
            </Text>
            <Text style={[styles.clubsPromoSub, { color: theme.colors.onSurface }]}>
              Read together, discuss, and track progress as a group
            </Text>
          </View>
          <Text style={{ color: theme.colors.onSurface, fontSize: 20 }}>›</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingTop: 60,
    paddingBottom: 16,
    alignItems: 'center',
    gap: 8,
  },
  searchBar: { flex: 1, elevation: 0 },
  loginButton: { borderWidth: 1 },
  brandSection: { alignItems: 'center', paddingVertical: 24 },
  logoContainer: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  logoImage: { width: 60, height: 60 },
  logo: { fontSize: 48, fontWeight: 'bold' },
  tagline: { marginTop: 8 },
  section: { marginBottom: 24 },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    paddingHorizontal: 16,
  },
  sectionTitle: { fontWeight: 'bold' },
  seeAll: { fontSize: 24 },
  categoryItem: { alignItems: 'center', width: 80, marginRight: 12 },
  categoryCircle: {
    width: 70,
    height: 70,
    borderRadius: 35,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  categoryIcon: { fontSize: 32 },
  categoryName: { fontSize: 12, textAlign: 'center' },
  horizontalList: { paddingHorizontal: 16, paddingBottom: 8 },
  clubsPromo: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 14,
    padding: 16,
    gap: 14,
    marginHorizontal: 16,
  },
  clubsPromoEmoji: { fontSize: 36 },
  clubsPromoTitle: { fontSize: 15, fontWeight: '700', marginBottom: 2 },
  clubsPromoSub: { fontSize: 12, opacity: 0.6 },
});
