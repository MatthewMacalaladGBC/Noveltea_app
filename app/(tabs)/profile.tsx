import { BookList, ListItem, listsApi, reviewsApi } from '@/src/api/client';
import BookCard from '@/src/components/cards/BookCard';
import CreateListModal from '@/src/components/modals/CreateListModal';
import { useAuth } from '@/src/context/AuthContext';
import { useThemeContext } from '@/src/ThemeContext';
import { router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { Avatar, Button, Divider, List, Text, useTheme } from 'react-native-paper';

// Number of lists shown in the My Lists preview
const PREVIEW_LISTS = 3;
// Max books shown per list in the horizontal preview
const LIST_PREVIEW = 5;

export default function ProfileScreen() {
  const theme = useTheme();
  const { isDark, toggleTheme } = useThemeContext();
  const { user, token, isLoading, logout } = useAuth();

  const [lists, setLists] = useState<BookList[]>([]);
  const [listItemsMap, setListItemsMap] = useState<Record<number, ListItem[]>>({});
  const [listsLoading, setListsLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [reviewCount, setReviewCount] = useState<number>(0);

  useFocusEffect(
    useCallback(() => {
      if (!user || !token) return;

      setListsLoading(true);
      let cancelled = false;

      async function fetchLists() {
        try {
          const [allLists, count] = await Promise.all([
            listsApi.getMyLists(token!),
            reviewsApi.getMyCount(token!),
          ]);
          if (cancelled) return;

          setReviewCount(count);

          // Exclude Library, sort by most recently created, take the top few
          const userLists = allLists
            .filter(l => l.title !== 'Library')
            .sort((a, b) => b.creationDate.localeCompare(a.creationDate))
            .slice(0, PREVIEW_LISTS);

          setLists(userLists);

          const results = await Promise.all(
            userLists.map(l =>
              listsApi.getListItems(l.listId, token!).then(items => ({ listId: l.listId, items }))
            )
          );

          if (cancelled) return;

          const map: Record<number, ListItem[]> = {};
          for (const { listId, items } of results) {
            map[listId] = items;
          }
          setListItemsMap(map);
        } finally {
          if (!cancelled) setListsLoading(false);
        }
      }

      fetchLists();
      return () => { cancelled = true; };
    }, [user, token])
  );

  const handleLogout = async () => {
    await logout();
    router.replace('/auth/welcome');
  };

  const handleListCreated = (created: BookList) => {
    setLists(prev => [created, ...prev].slice(0, PREVIEW_LISTS));
    setListItemsMap(prev => ({ ...prev, [created.listId]: [] }));
    setModalVisible(false);
  };

  // ── Loading state ──────────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <View style={[styles.centered, { backgroundColor: theme.colors.background }]}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  // ── Guest state ────────────────────────────────────────────────────────────
  if (!user) {
    return (
      <ScrollView style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <View style={styles.header}>
          <Avatar.Text
            size={80}
            label="?"
            style={[styles.avatar, { backgroundColor: theme.colors.primary }]}
          />
          <Text variant="headlineMedium" style={[styles.name, { color: theme.colors.onBackground }]}>
            Guest User
          </Text>
          <Text variant="bodyMedium" style={[styles.subtitle, { color: theme.colors.onSurface }]}>
            Sign in to track your reading
          </Text>
        </View>

        <Divider style={styles.divider} />

        {/* Dark mode toggle is an app preference — available to guests too */}
        <View style={styles.settingsContainer}>
          <List.Item
            title={isDark ? 'Light Mode' : 'Dark Mode'}
            left={props => <List.Icon {...props} icon={isDark ? 'white-balance-sunny' : 'moon-waning-crescent'} />}
            onPress={toggleTheme}
          />
        </View>

        <Divider style={styles.divider} />

        <View style={styles.actionContainer}>
          <Button
            mode="contained"
            onPress={() => router.push('/auth/welcome')}
            style={styles.actionButton}
            buttonColor="#000000"
            textColor="#FFFFFF"
            labelStyle={styles.actionButtonLabel}
          >
            Login / Sign Up
          </Button>
        </View>
      </ScrollView>
    );
  }

  // ── Logged-in state ────────────────────────────────────────────────────────
  const avatarLabel = user.username.charAt(0).toUpperCase();

  return (
    <>
      <ScrollView style={[styles.container, { backgroundColor: theme.colors.background }]}>
        {/* Header */}
        <View style={styles.header}>
          <Avatar.Text
            size={80}
            label={avatarLabel}
            style={[styles.avatar, { backgroundColor: theme.colors.primary }]}
          />
          <Text variant="headlineMedium" style={[styles.name, { color: theme.colors.onBackground }]}>
            {user.username}
          </Text>
          <Text variant="bodyMedium" style={[styles.subtitle, { color: theme.colors.onSurface }]}>
            {user.email}
          </Text>
          {user.bio ? (
            <Text variant="bodySmall" style={[styles.bio, { color: theme.colors.onSurface }]}>
              {user.bio}
            </Text>
          ) : null}
        </View>

        {/* Stats — values are placeholders until following / review integration is complete */}
        <View style={styles.statsContainer}>
          <View style={styles.statItem}>
            <Text variant="headlineMedium" style={[styles.statNumber, { color: theme.colors.onBackground }]}>
              0
            </Text>
            <Text variant="bodySmall" style={[styles.statLabel, { color: theme.colors.onSurface }]}>
              Followers
            </Text>
          </View>
          <View style={styles.statItem}>
            <Text variant="headlineMedium" style={[styles.statNumber, { color: theme.colors.onBackground }]}>
              0
            </Text>
            <Text variant="bodySmall" style={[styles.statLabel, { color: theme.colors.onSurface }]}>
              Followed
            </Text>
          </View>
          <View style={styles.statItem}>
            <Text variant="headlineMedium" style={[styles.statNumber, { color: theme.colors.onBackground }]}>
              {reviewCount}
            </Text>
            <Text variant="bodySmall" style={[styles.statLabel, { color: theme.colors.onSurface }]}>
              Reviews
            </Text>
          </View>
        </View>

        <Divider style={styles.divider} />

        {/* ── My Lists ──────────────────────────────────────────────────────────── */}
        <View style={styles.myListsSection}>
          <View style={styles.myListsHeader}>
            <Text variant="headlineSmall" style={[styles.myListsTitle, { color: theme.colors.onBackground }]}>
              My Lists
            </Text>
            <Text
              style={[styles.seeAllLink, { color: theme.colors.onBackground }]}
              onPress={() => router.push('/lists')}
            >
              See all ›
            </Text>
          </View>

          {/* Create List button — always visible inside the section */}
          <Pressable
            style={[styles.createListBtn, { borderColor: theme.colors.outline, marginTop: 10, marginBottom: 20 }]}
            onPress={() => setModalVisible(true)}
          >
            <Text style={[styles.createListBtnText, { color: theme.colors.primary }]}>
              + Create New List
            </Text>
          </Pressable>

          {listsLoading ? (
            <ActivityIndicator size="small" color={theme.colors.primary} style={styles.listLoader} />
          ) : lists.length === 0 ? (
            <Text style={[styles.emptyText, { color: theme.colors.onSurface }]}>
              No lists yet — create one to get started!
            </Text>
          ) : (
            lists.map(list => (
              <View key={list.listId} style={styles.listRow}>
                <View style={styles.listNameRow}>
                  <Text
                    variant="titleMedium"
                    style={[styles.listName, { color: theme.colors.onBackground }]}
                    onPress={() => router.push({ pathname: '/list/[id]', params: { id: String(list.listId) } } as any)}
                  >
                    {list.title} ›
                  </Text>
                  <Text style={[styles.bookCountBadge, { color: theme.colors.onSurface }]}>
                    {list.bookCount ?? 0} {(list.bookCount ?? 0) === 1 ? 'book' : 'books'}
                  </Text>
                </View>

                {!listItemsMap[list.listId] ? (
                  <ActivityIndicator size="small" color={theme.colors.primary} style={styles.listLoader} />
                ) : listItemsMap[list.listId].length === 0 ? (
                  <Text style={[styles.emptyText, { color: theme.colors.onSurface }]}>
                    This list is empty
                  </Text>
                ) : (
                  <FlatList
                    horizontal
                    data={listItemsMap[list.listId].slice(0, LIST_PREVIEW)}
                    keyExtractor={item => String(item.listItemId)}
                    renderItem={({ item }) => (
                      <BookCard
                        title={item.bookTitle}
                        author={item.bookAuthor}
                        coverUrl={item.coverImageUrl ?? ''}
                        bookId={item.bookId}
                      />
                    )}
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.horizontalList}
                  />
                )}
              </View>
            ))
          )}
        </View>

        <Divider style={styles.divider} />

        {/* Settings list */}
        <View style={styles.settingsContainer}>
          <List.Item
            title="Edit Profile"
            left={props => <List.Icon {...props} icon="account-edit" />}
            right={props => <List.Icon {...props} icon="chevron-right" />}
            onPress={() => console.log('Edit profile')}
          />
          <List.Item
            title="Reading Goals"
            left={props => <List.Icon {...props} icon="flag" />}
            right={props => <List.Icon {...props} icon="chevron-right" />}
            onPress={() => console.log('Reading goals')}
          />
          <List.Item
            title="Book Clubs"
            left={props => <List.Icon {...props} icon="account-group" />}
            right={props => <List.Icon {...props} icon="chevron-right" />}
            onPress={() => console.log('Book clubs')}
          />
          <List.Item
            title={isDark ? 'Light Mode' : 'Dark Mode'}
            left={props => <List.Icon {...props} icon={isDark ? 'white-balance-sunny' : 'moon-waning-crescent'} />}
            onPress={toggleTheme}
          />
          <List.Item
            title="Settings"
            left={props => <List.Icon {...props} icon="cog" />}
            right={props => <List.Icon {...props} icon="chevron-right" />}
            onPress={() => console.log('Settings')}
          />
        </View>

        <Divider style={styles.divider} />

        <View style={styles.actionContainer}>
          <Button
            mode="outlined"
            onPress={handleLogout}
            style={styles.actionButton}
            textColor={theme.colors.onBackground}
            labelStyle={styles.actionButtonLabel}
          >
            Log Out
          </Button>
        </View>
      </ScrollView>

      <CreateListModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        onCreated={handleListCreated}
        token={token!}
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
    alignItems: 'center',
    paddingTop: 60,
    paddingBottom: 24,
    paddingHorizontal: 20,
  },
  avatar: {
    marginBottom: 16,
  },
  name: {
    fontWeight: 'bold',
    marginBottom: 4,
  },
  subtitle: {
    opacity: 0.7,
  },
  bio: {
    marginTop: 8,
    opacity: 0.6,
    textAlign: 'center',
    fontStyle: 'italic',
    paddingHorizontal: 16,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 24,
    paddingHorizontal: 20,
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    fontWeight: 'bold',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    opacity: 0.7,
  },
  divider: {
    marginVertical: 8,
  },
  // ── My Lists
  myListsSection: {
    paddingVertical: 8,
  },
  myListsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginBottom: 4,
  },
  myListsTitle: {
    fontWeight: 'bold',
  },
  createListBtn: {
    marginHorizontal: 16,
    marginBottom: 4,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
  },
  createListBtnText: {
    fontSize: 14,
    fontWeight: '600',
  },
  seeAllLink: {
    fontSize: 22,
  },
  listRow: {
    marginTop: 12,
  },
  listNameRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 8,
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  listName: {
    fontWeight: '600',
  },
  bookCountBadge: {
    fontSize: 12,
    opacity: 0.55,
  },
  horizontalList: {
    paddingHorizontal: 16,
    paddingBottom: 4,
  },
  listLoader: {
    marginLeft: 16,
    marginBottom: 8,
  },
  emptyText: {
    paddingHorizontal: 16,
    paddingBottom: 8,
    opacity: 0.6,
    fontSize: 14,
  },
  // ── Settings
  settingsContainer: {
    paddingVertical: 8,
  },
  actionContainer: {
    paddingHorizontal: 20,
    paddingVertical: 24,
  },
  actionButton: {
    borderWidth: 1,
  },
  actionButtonLabel: {
    fontSize: 15,
    fontWeight: '600',
  },
});
