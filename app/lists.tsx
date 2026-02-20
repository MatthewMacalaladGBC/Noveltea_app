import { BookList, listsApi } from '@/src/api/client';
import { useAuth } from '@/src/context/AuthContext';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import { Divider, Text, useTheme } from 'react-native-paper';

export default function AllListsScreen() {
  const theme = useTheme();
  const { token } = useAuth();

  const [lists, setLists] = useState<BookList[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token) return;

    listsApi.getMyLists(token)
      .then(all =>
        setLists(
          all
            .filter(l => l.title !== 'Library')
            .sort((a, b) => b.creationDate.localeCompare(a.creationDate))
        )
      )
      .finally(() => setLoading(false));
  }, [token]);

  if (loading) {
    return (
      <View style={[styles.centered, { backgroundColor: theme.colors.background }]}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  return (
    <ScrollView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Text style={[styles.backText, { color: theme.colors.onBackground }]}>‹ Back</Text>
        </TouchableOpacity>
        <Text variant="headlineMedium" style={[styles.title, { color: theme.colors.onBackground }]}>
          My Lists
        </Text>
      </View>

      {lists.length === 0 ? (
        <Text style={[styles.emptyText, { color: theme.colors.onSurface }]}>
          No lists yet — create one to get started!
        </Text>
      ) : (
        lists.map((list, index) => (
          <View key={list.listId}>
            <TouchableOpacity
              style={styles.listItem}
              onPress={() => router.push({ pathname: '/list/[id]', params: { id: String(list.listId) } } as any)}
            >
              <View style={styles.listItemContent}>
                <View style={styles.listNameRow}>
                  <Text variant="titleMedium" style={[styles.listName, { color: theme.colors.onBackground }]}>
                    {list.title}
                  </Text>
                  <Text style={[styles.bookCount, { color: theme.colors.onSurface }]}>
                    {list.bookCount} {list.bookCount === 1 ? 'book' : 'books'}
                  </Text>
                </View>
                {list.description ? (
                  <Text variant="bodySmall" style={[styles.listDescription, { color: theme.colors.onSurface }]}>
                    {list.description}
                  </Text>
                ) : null}
                <Text variant="bodySmall" style={[styles.listDate, { color: theme.colors.onSurface }]}>
                  Created {list.creationDate}
                </Text>
              </View>
              <Text style={[styles.chevron, { color: theme.colors.onBackground }]}>›</Text>
            </TouchableOpacity>
            {index < lists.length - 1 && <Divider />}
          </View>
        ))
      )}
    </ScrollView>
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
  backButton: {
    marginBottom: 12,
  },
  backText: {
    fontSize: 18,
  },
  title: {
    fontWeight: 'bold',
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 16,
  },
  listItemContent: {
    flex: 1,
  },
  listNameRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 8,
    marginBottom: 2,
  },
  listName: {
    fontWeight: '600',
  },
  bookCount: {
    fontSize: 12,
    opacity: 0.55,
  },
  listDescription: {
    opacity: 0.7,
    marginBottom: 2,
  },
  listDate: {
    opacity: 0.5,
    fontSize: 11,
  },
  chevron: {
    fontSize: 20,
  },
  emptyText: {
    paddingHorizontal: 16,
    paddingTop: 16,
    opacity: 0.6,
    fontSize: 14,
  },
});
