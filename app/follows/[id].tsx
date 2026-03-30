import { followersApi, PublicUserProfile } from '@/src/api/client';
import { useAuth } from '@/src/context/AuthContext';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, StyleSheet, View } from 'react-native';
import { Appbar, Avatar, Divider, Text, useTheme } from 'react-native-paper';

export default function FollowsScreen() {
  const theme = useTheme();
  const { token } = useAuth();
  const { id, tab } = useLocalSearchParams<{ id: string; tab: 'followers' | 'following' }>();
  const userId = Number(id);

  const [activeTab, setActiveTab] = useState<'followers' | 'following'>(tab ?? 'followers');
  const [followersList, setFollowersList] = useState<PublicUserProfile[]>([]);
  const [followingList, setFollowingList] = useState<PublicUserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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

  const displayList = activeTab === 'followers' ? followersList : followingList;

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <Appbar.Header style={{ backgroundColor: theme.colors.background }}>
        <Appbar.BackAction onPress={() => router.back()} />
        <Appbar.Content title={activeTab === 'followers' ? 'Followers' : 'Following'} />
      </Appbar.Header>

      {/* Tabs */}
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

      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
        </View>
      ) : error ? (
        <View style={styles.centered}>
          <Text style={{ color: theme.colors.error }}>{error}</Text>
        </View>
      ) : displayList.length === 0 ? (
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
          renderItem={({ item }) => (
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
          )}
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
