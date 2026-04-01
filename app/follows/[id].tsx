import { followersApi, PublicUserProfile, usersApi } from '@/src/api/client';
import { useAuth } from '@/src/context/AuthContext';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, StyleSheet, View } from 'react-native';
import { Appbar, Avatar, Divider, Searchbar, Text, useTheme } from 'react-native-paper';

export default function FollowsScreen() {
  const theme = useTheme();
  const { user: me, token } = useAuth();
  const { id, tab } = useLocalSearchParams<{ id: string; tab: 'followers' | 'following' }>();
  const userId = Number(id);

  const isOwnFollows = me?.userId === userId;

  const [activeTab, setActiveTab] = useState<'followers' | 'following'>(tab ?? 'followers');
  const [followersList, setFollowersList] = useState<PublicUserProfile[]>([]);
  const [followingList, setFollowingList] = useState<PublicUserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Search state — only used on own follows page
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<PublicUserProfile[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Load followers/following lists
  useEffect(() => {
    if (!token || !userId) return;
    let cancelled = false;

    async function load() {
      try {
        setLoading(true);
        setError(null);
        const [followers, following] = await Promise.all([
          followersApi.getFollowersList(userId, token!),
          followersApi.getFollowingList(userId, token!),
        ]);
        if (cancelled) return;
        setFollowersList(followers);
        setFollowingList(following);
      } catch (e: any) {
        if (!cancelled) setError(e?.message || 'Failed to load');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => { cancelled = true; };
  }, [userId, token]);

  // Debounced search
  useEffect(() => {
    if (!isOwnFollows || !token) return;

    if (debounceRef.current) clearTimeout(debounceRef.current);

    if (!searchQuery.trim()) {
      setSearchResults([]);
      setSearchLoading(false);
      return;
    }

    setSearchLoading(true);
    debounceRef.current = setTimeout(async () => {
      try {
        const results = await usersApi.search(searchQuery.trim(), token);
        setSearchResults(results);
      } catch {
        setSearchResults([]);
      } finally {
        setSearchLoading(false);
      }
    }, 400);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [searchQuery, token, isOwnFollows]);

  const isSearching = isOwnFollows && searchQuery.trim().length > 0;
  const displayList = isSearching ? searchResults : (activeTab === 'followers' ? followersList : followingList);

  const renderUserRow = ({ item }: { item: PublicUserProfile }) => (
    <Pressable
      style={styles.userRow}
      onPress={() => router.push({ pathname: '/user/[id]', params: { id: String(item.userId) } } as any)}
    >
      <Avatar.Text
        size={44}
        label={item.username.charAt(0).toUpperCase()}
        style={{ backgroundColor: theme.colors.primary }}
      />
      <View style={styles.userInfo}>
        <Text variant="titleMedium" style={{ color: theme.colors.onBackground }}>
          {item.username}
        </Text>
        {item.bio && !item.privacy ? (
          <Text variant="bodySmall" style={{ color: theme.colors.onSurface, opacity: 0.6 }} numberOfLines={1}>
            {item.bio}
          </Text>
        ) : null}
      </View>
    </Pressable>
  );

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <Appbar.Header style={{ backgroundColor: theme.colors.background }}>
        <Appbar.BackAction onPress={() => router.back()} />
        <Appbar.Content title={isSearching ? 'Search Results' : (activeTab === 'followers' ? 'Followers' : 'Following')} />
      </Appbar.Header>

      {/* Tabs — hidden while searching */}
      {!isSearching ? (
        <View style={[styles.tabRow, { borderBottomColor: theme.colors.outlineVariant }]}>
          <Pressable
            style={[styles.tab, activeTab === 'followers' && { borderBottomColor: theme.colors.primary, borderBottomWidth: 2 }]}
            onPress={() => setActiveTab('followers')}
          >
            <Text
              variant="titleSmall"
              style={{ color: activeTab === 'followers' ? theme.colors.primary : theme.colors.onSurface, opacity: activeTab === 'followers' ? 1 : 0.5 }}
            >
              Followers ({followersList.length})
            </Text>
          </Pressable>
          <Pressable
            style={[styles.tab, activeTab === 'following' && { borderBottomColor: theme.colors.primary, borderBottomWidth: 2 }]}
            onPress={() => setActiveTab('following')}
          >
            <Text
              variant="titleSmall"
              style={{ color: activeTab === 'following' ? theme.colors.primary : theme.colors.onSurface, opacity: activeTab === 'following' ? 1 : 0.5 }}
            >
              Following ({followingList.length})
            </Text>
          </Pressable>
        </View>
      ) : null}

      {/* Search bar — own page only */}
      {isOwnFollows ? (
        <Searchbar
          placeholder="Search for users to follow..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          style={[styles.searchBar, { backgroundColor: theme.colors.surface }]}
          inputStyle={{ color: theme.colors.onSurface }}
          loading={searchLoading}
        />
      ) : null}

      {/* Content */}
      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
        </View>
      ) : error ? (
        <View style={styles.centered}>
          <Text style={{ color: theme.colors.error }}>{error}</Text>
        </View>
      ) : isSearching && searchLoading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="small" color={theme.colors.primary} />
        </View>
      ) : isSearching && searchResults.length === 0 ? (
        <View style={styles.centered}>
          <Text style={{ color: theme.colors.onSurface, opacity: 0.5 }}>No users found.</Text>
        </View>
      ) : !isSearching && displayList.length === 0 ? (
        <View style={styles.centered}>
          <Text style={{ color: theme.colors.onSurface, opacity: 0.5 }}>
            {activeTab === 'followers' ? 'No followers yet.' : 'Not following anyone yet.'}
          </Text>
        </View>
      ) : (
        <FlatList
          data={displayList}
          keyExtractor={item => String(item.userId)}
          ItemSeparatorComponent={() => <Divider />}
          renderItem={renderUserRow}
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
  tabRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 12,
  },
  searchBar: {
    margin: 12,
    borderRadius: 10,
    elevation: 0,
  },
  userRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
  },
  userInfo: {
    flex: 1,
    gap: 2,
  },
});
