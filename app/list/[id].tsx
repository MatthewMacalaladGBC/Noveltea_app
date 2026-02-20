import { BookList, ListItem, listsApi } from '@/src/api/client';
import BookCard from '@/src/components/cards/BookCard';
import EditListModal from '@/src/components/modals/EditListModal';
import { useAuth } from '@/src/context/AuthContext';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, FlatList, StyleSheet, TouchableOpacity, View } from 'react-native';
import { Text, useTheme } from 'react-native-paper';

const H_PADDING = 16;

export default function ListDetailScreen() {
  const theme = useTheme();
  const { token } = useAuth();
  const { id } = useLocalSearchParams<{ id: string }>();

  const [list, setList] = useState<BookList | null>(null);
  const [items, setItems] = useState<ListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [editModalVisible, setEditModalVisible] = useState(false);

  const handleRemovePress = (item: ListItem) => {
    Alert.alert(
      'Remove Book',
      `Remove "${item.bookTitle}" from this list?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            try {
              await listsApi.removeFromList(item.listItemId, token!);
              setItems(prev => prev.filter(i => i.listItemId !== item.listItemId));
            } catch (e) {
              console.error('Remove failed:', e);
            }
          },
        },
      ],
    );
  };

  useEffect(() => {
    if (!token || !id) return;

    async function fetchData() {
      try {
        const [listData, listItems] = await Promise.all([
          listsApi.getListById(Number(id), token!),
          listsApi.getListItems(Number(id), token!),
        ]);
        setList(listData);
        setItems(listItems);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [id, token]);

  if (loading) {
    return (
      <View style={[styles.centered, { backgroundColor: theme.colors.background }]}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  return (
    <>
    {list && (
      <EditListModal
        visible={editModalVisible}
        onClose={() => setEditModalVisible(false)}
        onUpdated={(updated) => setList(updated)}
        onDeleted={() => router.back()}
        token={token!}
        listId={list.listId}
        initialTitle={list.title}
        initialDescription={list.description ?? null}
        initialVisibility={list.visibility}
      />
    )}
    <FlatList
      style={[styles.container, { backgroundColor: theme.colors.background }]}
      contentContainerStyle={styles.gridContent}
      data={items}
      keyExtractor={item => String(item.listItemId)}
      numColumns={2}
      columnWrapperStyle={styles.row}
      renderItem={({ item }) => (
        <View style={styles.cardWrapper}>
          <BookCard
            title={item.bookTitle}
            author={item.bookAuthor}
            coverUrl={item.coverImageUrl ?? ''}
            bookId={item.bookId}
          />
          <TouchableOpacity
            style={styles.removeBtn}
            onPress={() => handleRemovePress(item)}
            hitSlop={{ top: 6, left: 6, bottom: 6, right: 6 }}
          >
            <Text style={styles.removeBtnText}>×</Text>
          </TouchableOpacity>
        </View>
      )}
      ListHeaderComponent={
        <View style={styles.header}>
          <View style={styles.headerRow}>
            <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
              <Text style={[styles.backText, { color: theme.colors.onBackground }]}>‹ Back</Text>
            </TouchableOpacity>
            {list && (
              <TouchableOpacity onPress={() => setEditModalVisible(true)} style={styles.editButton}>
                <Text style={[styles.editText, { color: theme.colors.primary }]}>Edit</Text>
              </TouchableOpacity>
            )}
          </View>
          <Text variant="headlineMedium" style={[styles.title, { color: theme.colors.onBackground }]}>
            {list?.title ?? 'List'}
          </Text>
          <Text variant="bodySmall" style={[styles.bookCount, { color: theme.colors.onSurface }]}>
            {items.length} {items.length === 1 ? 'book' : 'books'}
          </Text>
          {list?.description ? (
            <Text variant="bodyMedium" style={[styles.description, { color: theme.colors.onSurface }]}>
              {list.description}
            </Text>
          ) : null}
        </View>
      }
      ListEmptyComponent={
        <Text style={[styles.emptyText, { color: theme.colors.onSurface }]}>
          This list is empty
        </Text>
      }
    />
    </>
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
    paddingHorizontal: H_PADDING,
    paddingTop: 60,
    paddingBottom: 16,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  backButton: {},
  backText: {
    fontSize: 18,
  },
  editButton: {},
  editText: {
    fontSize: 16,
    fontWeight: '600',
  },
  title: {
    fontWeight: 'bold',
    marginBottom: 4,
  },
  bookCount: {
    opacity: 0.55,
    marginTop: 2,
    marginBottom: 4,
  },
  description: {
    opacity: 0.7,
    marginTop: 4,
  },
  gridContent: {
    paddingBottom: 24,
  },
  row: {
    justifyContent: 'space-evenly',
    marginBottom: 8,
  },
  emptyText: {
    paddingTop: 16,
    opacity: 0.6,
    fontSize: 14,
  },
  cardWrapper: {
    position: 'relative',
  },
  removeBtn: {
    position: 'absolute',
    top: 4,
    left: 4,
    zIndex: 1,
    backgroundColor: 'rgba(239, 83, 80, 0.88)',
    borderRadius: 10,
    width: 22,
    height: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  removeBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    lineHeight: 20,
  },
});
