import BookCard from '@/src/components/cards/BookCard';
import { useThemeContext } from '@/src/ThemeContext';
import { router, Stack, useLocalSearchParams } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, StyleSheet, View } from 'react-native';
import { Appbar, Searchbar, Text, useTheme } from 'react-native-paper';

interface Book {
  key: string;
  title: string;
  authors?: Array<{ name: string }>;
  cover_id?: number;
  isbn13?: string[];
}

export default function CategoryScreen() {
  const theme = useTheme();
  const { isDark } = useThemeContext();
  const { genre } = useLocalSearchParams<{ genre: string }>();
  const [books, setBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  // Genre display names mapping
  const genreDisplayNames: { [key: string]: string } = {
    'romance': 'Romance',
    'science_fiction': 'Science Fiction',
    'mystery': 'Mystery',
    'thriller': 'Thriller',
    'historical_fiction': 'Historical Fiction',
    'children': 'Kids Books',
    'nonfiction': 'Non-Fiction',
    'young_adult': 'Young Adult',
    'horror': 'Horror',
    'fantasy': 'Fantasy',
  };

  useEffect(() => {
    if (genre) {
      fetchBooksForGenre(genre);
    }
  }, [genre]);

  const fetchBooksForGenre = async (genreName: string) => {
    setLoading(true);
    try {
      const response = await fetch(
        `https://openlibrary.org/subjects/${genreName}.json?limit=20`
      );
      const data = await response.json();
      setBooks(data.works || []);
    } catch (error) {
      console.error('Error fetching books:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredBooks = books.filter(book => {
    const title = book?.title?.toLowerCase() || '';
    const author = book?.authors?.[0]?.name?.toLowerCase() || '';
    const query = searchQuery.toLowerCase();
    return title.includes(query) || author.includes(query);
  });

  const displayName = genreDisplayNames[genre as string] || 
    (genre as string)?.split('_').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');

  return (
    <>
      {/* Hide the default Expo Router header */}
      <Stack.Screen options={{ headerShown: false }} />
      
      <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
        {/* Custom Header */}
        <View style={[styles.headerContainer, { backgroundColor: theme.colors.background }]}>
          <Appbar.Header 
            style={{ 
              backgroundColor: theme.colors.background,
              elevation: 0,
            }}
          >
            <Appbar.BackAction onPress={() => router.back()} />
            <Appbar.Content 
              title={displayName}
              titleStyle={{ color: theme.colors.onBackground, fontSize: 20, fontWeight: 'bold' }}
            />
          </Appbar.Header>
        </View>

        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <Searchbar
            placeholder="Search books..."
            onChangeText={setSearchQuery}
            value={searchQuery}
            style={[styles.searchBar, { backgroundColor: theme.colors.surface }]}
            inputStyle={{ color: theme.colors.onSurface }}
          />
        </View>

        {/* Book Count */}
        <View style={styles.countSection}>
          <Text variant="bodyMedium" style={[styles.count, { color: theme.colors.onSurface }]}>
            {filteredBooks.length} books found
          </Text>
        </View>

        {/* Books Grid */}
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={theme.colors.primary} />
          </View>
        ) : (
          <FlatList
            data={filteredBooks}
            keyExtractor={(item, index) => `${item.key}-${index}`}
            numColumns={2}
            columnWrapperStyle={styles.row}
            contentContainerStyle={styles.listContent}
            renderItem={({ item }) => {
              const title = item?.title || 'Unknown Title';
              const author = item?.authors?.[0]?.name || 'Unknown Author';
              const coverUrl = getCoverUrl(item?.isbn13, item?.cover_id, 'L');

              return (
                <View style={styles.bookItem}>
                  <BookCard
                    title={title}
                    author={author}
                    coverUrl={coverUrl || 'https://via.placeholder.com/150x225?text=No+Cover'}
                    bookId={item.key}
                    onPress={() => router.push({
                      pathname: '/book/[id]',
                      params: { id: item.key.replace('/works/', '') }
                    })}                  
                    />
                </View>
              );
            }}
            showsVerticalScrollIndicator={true}
          />
        )}
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  headerContainer: {
    paddingTop: 0,
  },
  searchContainer: {
    paddingHorizontal: 16,
    paddingTop: 8, 
    paddingBottom: 8,
  },
  searchBar: {
    elevation: 0,
  },
  countSection: {
    paddingHorizontal: 16,
    paddingBottom: 8, 
  },
  count: {
    opacity: 0.7,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 24,
  },
  row: {
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  bookItem: {
    width: '48%',
  },
});

const getCoverUrl = (isbn13: string[] | undefined, coverId: number | undefined, size: 'S' | 'M' | 'L' = 'L') => {
  // Try ISBN first (more reliable)
  if (isbn13 && isbn13.length > 0 && isbn13[0]) {
    return `https://covers.openlibrary.org/b/isbn/${isbn13[0]}-${size}.jpg`;
  }
  // Fallback to cover_id
  if (coverId) {
    return `https://covers.openlibrary.org/b/id/${coverId}-${size}.jpg`;
  }
  return null;
};