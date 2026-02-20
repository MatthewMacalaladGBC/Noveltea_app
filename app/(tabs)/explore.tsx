import { router, useLocalSearchParams } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Image,
  Pressable,
  StyleSheet,
  View,
} from 'react-native';
import { Searchbar, Text, useTheme } from 'react-native-paper';

// ─── Types ────────────────────────────────────────────────────────────────────

interface SearchBook {
  key: string;
  title: string;
  author_name?: string[];
  first_publish_year?: number;
  cover_i?: number;
}

// ─── Browse categories ────────────────────────────────────────────────────────

const BROWSE_CATEGORIES = [
  { label: 'Genre',          route: '/(tabs)/genre' },
  { label: 'Author',         route: null },
  { label: 'Most Popular',   route: null },
  { label: 'Trending',       route: null },
  { label: 'Language',       route: null },
  { label: 'Release Date',   route: null },
  { label: 'Featured Lists', route: null },
];

// ─── Browse row ───────────────────────────────────────────────────────────────

function BrowseRow({ label, onPress }: { label: string; onPress: () => void }) {
  const theme = useTheme();
  return (
    <Pressable
      onPress={onPress}
      android_ripple={{ color: theme.colors.surfaceVariant }}
      style={({ pressed }) => [
        styles.browseRow,
        { borderBottomColor: theme.colors.surfaceVariant, opacity: pressed ? 0.7 : 1 },
      ]}
    >
      <Text style={[styles.browseLabel, { color: theme.colors.onBackground }]}>
        {label}
      </Text>
      <Text style={{ color: theme.colors.onSurface, fontSize: 18 }}>›</Text>
    </Pressable>
  );
}

// ─── Book result row ──────────────────────────────────────────────────────────

function BookResult({ item }: { item: SearchBook }) {
  const theme = useTheme();
  const coverUrl = item.cover_i
    ? `https://covers.openlibrary.org/b/id/${item.cover_i}-M.jpg`
    : null;
  const bookId = item.key.replace('/works/', '');

  return (
    <View style={[styles.resultCard, { borderBottomColor: theme.colors.surfaceVariant }]}>
      {coverUrl ? (
        <Image source={{ uri: coverUrl }} style={styles.cover} resizeMode="cover" />
      ) : (
        <View style={[styles.cover, styles.noCover, { backgroundColor: theme.colors.surface }]}>
          <Text style={{ color: theme.colors.onSurface, fontSize: 10, textAlign: 'center' }}>
            No Cover
          </Text>
        </View>
      )}

      <View style={styles.resultInfo}>
        <Text numberOfLines={2} style={[styles.resultTitle, { color: theme.colors.onBackground }]}>
          {item.title}
          {item.first_publish_year
            ? <Text style={[styles.resultYear, { color: theme.colors.onSurface }]}> ({item.first_publish_year})</Text>
            : null}
        </Text>

        <Text numberOfLines={1} style={[styles.resultAuthor, { color: theme.colors.onSurface }]}>
          Written by: {item.author_name?.[0] ?? 'Unknown Author'}
        </Text>

        <Pressable
          onPress={() => router.push({ pathname: '/book/[id]', params: { id: bookId } })}
          style={({ pressed }) => [
            styles.viewMoreBtn,
            { backgroundColor: theme.colors.onBackground, opacity: pressed ? 0.75 : 1 },
          ]}
        >
          <Text style={[styles.viewMoreText, { color: theme.colors.background }]}>
            View More
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

// ─── Main screen ──────────────────────────────────────────────────────────────

export default function ExploreScreen() {
  const theme = useTheme();
  const { mode } = useLocalSearchParams<{ mode?: string }>();
  const isTrendingMode = mode === 'trending';

  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchBook[]>([]);
  const [loading, setLoading] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Auto-load trending when navigated with ?mode=trending
  useEffect(() => {
    if (isTrendingMode) fetchTrending();
  }, [isTrendingMode]);

  const fetchTrending = async () => {
    setLoading(true);
    try {
      const res = await fetch(
        'https://openlibrary.org/search.json?q=trending&sort=rating&limit=20&fields=key,title,author_name,first_publish_year,cover_i'
      );
      const data = await res.json();
      setResults(data.docs ?? []);
    } catch (e) {
      console.error('Trending fetch error:', e);
    } finally {
      setLoading(false);
    }
  };

  // Debounced search
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (!query.trim()) {
      if (!isTrendingMode) setResults([]);
      return;
    }
    debounceRef.current = setTimeout(() => searchBooks(query.trim()), 400);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [query]);

  const searchBooks = async (q: string) => {
    setLoading(true);
    try {
      const res = await fetch(
        `https://openlibrary.org/search.json?q=${encodeURIComponent(q)}&limit=20&fields=key,title,author_name,first_publish_year,cover_i`
      );
      const data = await res.json();
      setResults(data.docs ?? []);
    } catch (e) {
      console.error('Search error:', e);
    } finally {
      setLoading(false);
    }
  };

  const showResults = query.trim().length > 0 || isTrendingMode;
  const headerTitle = isTrendingMode && !query ? 'Trending Books' : 'Search';

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: theme.colors.background }]}>
        <Text variant="headlineMedium" style={[styles.headerTitle, { color: theme.colors.onBackground }]}>
          {headerTitle}
        </Text>
      </View>

      {/* Search bar */}
      <View style={styles.searchWrapper}>
        <Searchbar
          placeholder="Find books, authors, lists, clubs..."
          value={query}
          onChangeText={setQuery}
          style={[styles.searchBar, { backgroundColor: theme.colors.surface }]}
          inputStyle={{ color: theme.colors.onSurface }}
          iconColor={theme.colors.onSurface}
          placeholderTextColor={theme.colors.onSurface}
        />
      </View>

      {/* Content */}
      {!showResults ? (
        // ── Browse view ──
        <FlatList
          data={BROWSE_CATEGORIES}
          keyExtractor={(item) => item.label}
          ListHeaderComponent={
            <Text style={[styles.browseHeader, { color: theme.colors.onBackground }]}>
              Browse by
            </Text>
          }
          renderItem={({ item }) => (
            <BrowseRow
              label={item.label}
              onPress={() => { if (item.route) router.push(item.route as any); }}
            />
          )}
          contentContainerStyle={styles.browseList}
        />
      ) : loading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
        </View>
      ) : results.length === 0 ? (
        <View style={styles.centered}>
          <Text style={{ color: theme.colors.onSurface, opacity: 0.6 }}>
            No results found for "{query}"
          </Text>
        </View>
      ) : (
        <FlatList
          data={results}
          keyExtractor={(item, i) => `${item.key}-${i}`}
          renderItem={({ item }) => <BookResult item={item} />}
          contentContainerStyle={styles.resultsList}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        />
      )}
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container:     { flex: 1 },
  header:        { paddingTop: 56, paddingHorizontal: 16, paddingBottom: 8 },
  headerTitle:   { fontWeight: '700', textAlign: 'center' },
  searchWrapper: { paddingHorizontal: 16, paddingVertical: 8 },
  searchBar:     { elevation: 0, borderRadius: 12 },

  browseList:   { paddingHorizontal: 16, paddingTop: 8 },
  browseHeader: { fontSize: 18, fontWeight: '700', marginBottom: 4 },
  browseRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  browseLabel: { fontSize: 15 },

  resultsList: { paddingHorizontal: 16, paddingBottom: 24 },
  resultCard: {
    flexDirection: 'row',
    paddingVertical: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    gap: 14,
  },
  cover:   { width: 80, height: 120, borderRadius: 8, flexShrink: 0 },
  noCover: { justifyContent: 'center', alignItems: 'center' },
  resultInfo:   { flex: 1, justifyContent: 'center', gap: 6 },
  resultTitle:  { fontSize: 16, fontWeight: '700', lineHeight: 22 },
  resultYear:   { fontWeight: '400', fontSize: 14 },
  resultAuthor: { fontSize: 13, opacity: 0.75 },
  viewMoreBtn: {
    alignSelf: 'flex-start',
    marginTop: 6,
    paddingVertical: 8,
    paddingHorizontal: 20,
    borderRadius: 999,
  },
  viewMoreText: { fontSize: 13, fontWeight: '700' },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
});