import BookCard from '@/src/components/cards/BookCard';
import { useThemeContext } from '@/src/ThemeContext';
import { router } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { FlatList, Image, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import { Button, IconButton, Searchbar, Text, useTheme } from 'react-native-paper';

// Define the Book interface
interface Book {
  key: string;
  title: string;
  authors?: Array<{ name: string }>;
  cover_id?: number;
}

export default function HomeScreen() {
  const theme = useTheme();
  const { isDark, toggleTheme } = useThemeContext();
  const [books, setBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    // Fetch books from multiple genres
    const genres = [
      'romance',
      'science_fiction',
      'mystery',
      'thriller',
      'historical_fiction',
      'children',
      'nonfiction',
      'young_adult',
      'horror',
      'fantasy'
    ];
    
    // Fetch 3 books from each genre (30 total)
    const fetchPromises = genres.map(genre =>
      fetch(`https://openlibrary.org/subjects/${genre}.json?limit=3`)
        .then(res => res.json())
        .then(data => data.works)
    );
    
    Promise.all(fetchPromises)
      .then(results => {
        const allBooks = results.flat();
        setBooks(allBooks);
        setLoading(false);
      })
      .catch(error => {
        console.error('Error fetching books:', error);
        setLoading(false);
      });
  }, []);

  // Category data with API genre mapping
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

  // UPDATED THIS FUNCTION
  const handleCategoryPress = (apiGenre: string) => {
    router.push(`/category/${apiGenre}` as any);
  };

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <Text style={{ color: theme.colors.onBackground }}>Loading...</Text>
      </View>
    );
  }
  
  return (
    <ScrollView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      {/* Header Section with Theme Toggle */}
      <View style={styles.header}>
        <Searchbar
          placeholder="Search"
          onChangeText={setSearchQuery}
          value={searchQuery}
          style={[styles.searchBar, { backgroundColor: theme.colors.surface }]}
          inputStyle={{ color: theme.colors.onSurface }}
        />
        
        {/* Theme Toggle Button */}
        <IconButton
          icon={isDark ? "white-balance-sunny" : "moon-waning-crescent"}
          size={24}
          onPress={toggleTheme}
          iconColor={theme.colors.onBackground}
        />
        
        <Button 
          mode="outlined" 
          style={styles.loginButton}
          textColor={theme.colors.onBackground}
          onPress={() => router.push('/auth/welcome')}
        >
          Login / Signup
        </Button>
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

      {/* Category Section - Horizontal scroll with touchable items */}
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
          <Text style={[styles.seeAll, { color: theme.colors.onBackground }]}>›</Text>
        </View>
        <FlatList
          horizontal
          data={books.slice(0, 15)}
          keyExtractor={(item, index) => `${item.key}-${index}`}
          renderItem={({ item }) => {
            const title = item?.title || 'Unknown Title';
            const author = item?.authors?.[0]?.name || 'Unknown Author';
            const coverUrl = item?.cover_id 
              ? `https://covers.openlibrary.org/b/id/${item.cover_id}-M.jpg`
              : '';
            
            return (
              <BookCard
                title={title}
                author={author}
                coverUrl={coverUrl}
                onPress={() => console.log('Book pressed:', title)}
              />
            );
          }}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.horizontalList}
        />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingTop: 60,
    paddingBottom: 16,
    alignItems: 'center',
    gap: 8,
  },
  searchBar: {
    flex: 1,
    elevation: 0,
  },
  loginButton: {
    borderWidth: 1,
  },
  brandSection: {
    alignItems: 'center',
    paddingVertical: 24,
  },
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  logoImage: {
    width: 60,
    height: 60,
  },
  logo: {
    fontSize: 48,
    fontWeight: 'bold',
  },
  tagline: {
    marginTop: 8,
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    paddingHorizontal: 16,
  },
  sectionTitle: {
    fontWeight: 'bold',
  },
  seeAll: {
    fontSize: 24,
  },
  categoryItem: {
    alignItems: 'center',
    width: 80,
    marginRight: 12,
  },
  categoryCircle: {
    width: 70,
    height: 70,
    borderRadius: 35,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  categoryIcon: {
    fontSize: 32,
  },
  categoryName: {
    fontSize: 12,
    textAlign: 'center',
  },
  horizontalList: {
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
});