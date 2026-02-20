import { ListItem, listsApi } from '@/src/api/client';
import BookCard from '@/src/components/cards/BookCard';
import { useAuth } from '@/src/context/AuthContext';
import { router, useFocusEffect } from 'expo-router';
import React, { useCallback, useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, StyleSheet, View } from 'react-native';
import { Button, Text, useTheme } from 'react-native-paper';

const PAGE_SIZE = 20;

// ── Pagination helpers ────────────────────────────────────────────────────────
function getPageNumbers(current: number, total: number): (number | '...')[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);

  const pages: (number | '...')[] = [1];
  if (current > 3) pages.push('...');

  const start = Math.max(2, current - 1);
  const end   = Math.min(total - 1, current + 1);
  for (let i = start; i <= end; i++) pages.push(i);

  if (current < total - 2) pages.push('...');
  pages.push(total);

  return pages;
}

export default function LibraryScreen() {
  const theme = useTheme();
  const { user, token, isLoading: authLoading } = useAuth();

  const [libraryItems, setLibraryItems] = useState<ListItem[]>([]);
  const [dataLoading, setDataLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);

  useFocusEffect(
    useCallback(() => {
      if (!user || !token) return;

      setDataLoading(true);
      setCurrentPage(1);
      let cancelled = false;

      async function fetchData() {
        try {
          const allLists = await listsApi.getMyLists(token!);
          const libraryList = allLists.find(l => l.title === 'Library');
          if (libraryList && !cancelled) {
            const items = await listsApi.getListItems(libraryList.listId, token!);
            if (!cancelled) setLibraryItems(items);
          }
        } finally {
          if (!cancelled) setDataLoading(false);
        }
      }

      fetchData();
      return () => { cancelled = true; };
    }, [user, token])
  );

  // ── Loading ───────────────────────────────────────────────────────────────
  if (authLoading || dataLoading) {
    return (
      <View style={[styles.centered, { backgroundColor: theme.colors.background }]}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  // ── Guest state ───────────────────────────────────────────────────────────
  if (!user) {
    return (
      <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <View style={styles.header}>
          <Text variant="displaySmall" style={[styles.screenTitle, { color: theme.colors.onBackground }]}>
            My Library
          </Text>
        </View>
        <View style={styles.guestContainer}>
          <Text variant="bodyLarge" style={[styles.guestText, { color: theme.colors.onSurface }]}>
            Sign in to see your library and lists
          </Text>
          <Button
            mode="contained"
            onPress={() => router.push('/auth/welcome')}
            buttonColor="#000000"
            textColor="#FFFFFF"
            style={styles.signInButton}
          >
            Login / Sign Up
          </Button>
        </View>
      </View>
    );
  }

  // ── Logged-in state ───────────────────────────────────────────────────────
  const totalPages = Math.ceil(libraryItems.length / PAGE_SIZE);
  const pageItems  = libraryItems.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  return (
    <FlatList
      style={[styles.container, { backgroundColor: theme.colors.background }]}
      contentContainerStyle={styles.gridContent}
      data={pageItems}
      keyExtractor={item => String(item.listItemId)}
      numColumns={2}
      columnWrapperStyle={styles.row}
      renderItem={({ item }) => (
        <BookCard
          title={item.bookTitle}
          author={item.bookAuthor}
          coverUrl={item.coverImageUrl ?? ''}
          bookId={item.bookId}
        />
      )}
      ListHeaderComponent={
        <View style={styles.header}>
          <Text variant="displaySmall" style={[styles.screenTitle, { color: theme.colors.onBackground }]}>
            My Library
          </Text>
          {libraryItems.length > 0 && (
            <Text variant="bodySmall" style={[styles.bookCount, { color: theme.colors.onSurface }]}>
              {libraryItems.length} {libraryItems.length === 1 ? 'book' : 'books'}
            </Text>
          )}
        </View>
      }
      ListEmptyComponent={
        <Text style={[styles.emptyText, { color: theme.colors.onSurface }]}>
          No books yet — add some from the Explore tab!
        </Text>
      }
      ListFooterComponent={
        totalPages > 1 ? (
          <View style={styles.pagination}>
            {/* Previous */}
            <Pressable
              onPress={() => setCurrentPage(p => p - 1)}
              disabled={currentPage === 1}
              style={[styles.pageBtn, currentPage === 1 && styles.pageBtnDisabled]}
            >
              <Text style={[styles.pageBtnText, { color: theme.colors.onBackground }]}>‹</Text>
            </Pressable>

            {/* Page numbers */}
            {getPageNumbers(currentPage, totalPages).map((page, i) =>
              page === '...' ? (
                <Text key={`ellipsis-${i}`} style={[styles.ellipsis, { color: theme.colors.onSurface }]}>
                  …
                </Text>
              ) : (
                <Pressable
                  key={page}
                  onPress={() => setCurrentPage(page as number)}
                  style={[
                    styles.pageBtn,
                    currentPage === page && { backgroundColor: theme.colors.primary },
                  ]}
                >
                  <Text
                    style={[
                      styles.pageBtnText,
                      { color: currentPage === page ? theme.colors.onPrimary : theme.colors.onBackground },
                    ]}
                  >
                    {page}
                  </Text>
                </Pressable>
              )
            )}

            {/* Next */}
            <Pressable
              onPress={() => setCurrentPage(p => p + 1)}
              disabled={currentPage === totalPages}
              style={[styles.pageBtn, currentPage === totalPages && styles.pageBtnDisabled]}
            >
              <Text style={[styles.pageBtnText, { color: theme.colors.onBackground }]}>›</Text>
            </Pressable>
          </View>
        ) : null
      }
    />
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  header: {
    paddingHorizontal: 16,
    paddingTop: 60,
    paddingBottom: 16,
  },
  screenTitle: {
    fontWeight: 'bold',
  },
  bookCount: {
    marginTop: 4,
    opacity: 0.6,
  },
  guestContainer: {
    alignItems: 'center',
    paddingVertical: 80,
    paddingHorizontal: 32,
    gap: 20,
  },
  guestText: {
    textAlign: 'center',
    opacity: 0.7,
  },
  signInButton: {
    width: '100%',
  },
  gridContent: {
    paddingBottom: 24,
  },
  row: {
    justifyContent: 'space-evenly',
    marginBottom: 16,
  },
  emptyText: {
    paddingTop: 16,
    paddingHorizontal: 16,
    opacity: 0.6,
    fontSize: 14,
  },
  // ── Pagination
  pagination: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 20,
    paddingHorizontal: 8,
    gap: 6,
  },
  pageBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pageBtnDisabled: {
    opacity: 0.25,
  },
  pageBtnText: {
    fontSize: 16,
    fontWeight: '600',
  },
  ellipsis: {
    fontSize: 16,
    paddingHorizontal: 2,
  },
});
