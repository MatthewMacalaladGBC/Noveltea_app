import { followersApi, listsApi, reviewsApi, usersApi, PublicUserProfile, BookList } from '@/src/api/client';
import { useAuth } from '@/src/context/AuthContext';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { Appbar, Avatar, Button, Divider, Text, useTheme } from 'react-native-paper';

export default function UserProfileScreen() {
  const theme = useTheme();
  const { user: me, token } = useAuth();
  const { username } = useLocalSearchParams<{ username: string }>();

  const [profile, setProfile] = useState<PublicUserProfile | null>(null);
  const [followerCount, setFollowerCount] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);
  const [following, setFollowing] = useState(false);
  const [lists, setLists] = useState<BookList[]>([]);
  const [reviewCount, setReviewCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [followLoading, setFollowLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // isOwnProfile resolved after profile loads — compare against me.userId
  const isOwnProfile = profile != null && me?.userId === profile.userId;

  useEffect(() => {
    if (!token || !username) return;

    let cancelled = false;

    async function load() {
      try {
        setLoading(true);
        setError(null);

        // Resolve username → profile first, then fan out with the numeric userId
        const profileData = await usersApi.getPublicProfileByUsername(username, token!);
        if (cancelled) return;

        const ownProfile = me?.userId === profileData.userId;

        const [followers, following, userReviews] = await Promise.all([
          followersApi.getFollowerCount(profileData.userId, token!),
          followersApi.getFollowingCount(profileData.userId, token!),
          reviewsApi.getUserReviews(profileData.userId, token!),
        ]);
        if (cancelled) return;

        setProfile(profileData);
        setFollowerCount(followers);
        setFollowingCount(following);
        setReviewCount(userReviews.length);

        if (!ownProfile) {
          const [followStatus, publicLists] = await Promise.all([
            followersApi.isFollowing(profileData.userId, token!),
            !profileData.privacy ? listsApi.getUserLists(profileData.userId, token!) : Promise.resolve<BookList[]>([]),
          ]);
          if (cancelled) return;
          setFollowing(followStatus);
          setLists(publicLists);
        } else if (!profileData.privacy) {
          const publicLists = await listsApi.getUserLists(profileData.userId, token!);
          if (cancelled) return;
          setLists(publicLists);
        }
      } catch (e: any) {
        if (!cancelled) setError(e?.message || 'Failed to load profile');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => { cancelled = true; };
  }, [username, token]);

  const handleFollowToggle = async () => {
    if (!token || !profile) return;
    try {
      setFollowLoading(true);
      if (following) {
        await followersApi.unfollow(profile.userId, token);
        setFollowing(false);
        setFollowerCount(c => c - 1);
      } else {
        await followersApi.follow(profile.userId, token);
        setFollowing(true);
        setFollowerCount(c => c + 1);
      }
    } catch (e: any) {
      setError(e?.message || 'Action failed');
    } finally {
      setFollowLoading(false);
    }
  };

  // ── Loading ────────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <View style={[styles.centered, { backgroundColor: theme.colors.background }]}>
        <Appbar.Header style={[styles.floatingHeader, { backgroundColor: theme.colors.background }]}>
          <Appbar.BackAction onPress={() => router.back()} />
        </Appbar.Header>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  // ── Error / not found ──────────────────────────────────────────────────────
  if (error || !profile) {
    return (
      <View style={[styles.centered, { backgroundColor: theme.colors.background }]}>
        <Appbar.Header style={[styles.floatingHeader, { backgroundColor: theme.colors.background }]}>
          <Appbar.BackAction onPress={() => router.back()} />
        </Appbar.Header>
        <Text style={{ color: theme.colors.error }}>{error || 'User not found'}</Text>
      </View>
    );
  }

  // ── Profile ────────────────────────────────────────────────────────────────
  const avatarLabel = profile.username.charAt(0).toUpperCase();
  const publicLists = lists.filter(l => l.title !== 'Library');

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <Appbar.Header style={{ backgroundColor: theme.colors.background }}>
        <Appbar.BackAction onPress={() => router.back()} />
        <Appbar.Content title={profile.username} />
      </Appbar.Header>

      <ScrollView>
        {/* Header */}
        <View style={styles.header}>
          <Avatar.Text
            size={80}
            label={avatarLabel}
            style={[styles.avatar, { backgroundColor: theme.colors.primary }]}
          />
          <Text variant="headlineMedium" style={[styles.name, { color: theme.colors.onBackground }]}>
            {profile.username}
          </Text>
          {profile.bio && !profile.privacy ? (
            <Text variant="bodyMedium" style={[styles.bio, { color: theme.colors.onSurface }]}>
              {profile.bio}
            </Text>
          ) : null}
        </View>

        {/* Stats */}
        <View style={styles.statsContainer}>
          <View style={styles.statItem}>
            <Text variant="headlineMedium" style={[styles.statNumber, { color: theme.colors.onBackground }]}>
              {followerCount}
            </Text>
            <Text variant="bodySmall" style={[styles.statLabel, { color: theme.colors.onSurface }]}>
              Followers
            </Text>
          </View>
          <View style={styles.statItem}>
            <Text variant="headlineMedium" style={[styles.statNumber, { color: theme.colors.onBackground }]}>
              {followingCount}
            </Text>
            <Text variant="bodySmall" style={[styles.statLabel, { color: theme.colors.onSurface }]}>
              Following
            </Text>
          </View>
          {!profile.privacy ? (
            <Pressable
              style={styles.statItem}
              onPress={() => router.push({ pathname: '/user-reviews/[username]', params: { username: profile.username } } as any)}
            >
              <Text variant="headlineMedium" style={[styles.statNumber, { color: theme.colors.onBackground }]}>
                {reviewCount}
              </Text>
              <Text variant="bodySmall" style={[styles.statLabel, { color: theme.colors.onSurface }]}>
                Reviews
              </Text>
            </Pressable>
          ) : null}
        </View>

        {/* Follow / Unfollow — only for other users when logged in */}
        {!isOwnProfile && token ? (
          <View style={styles.followContainer}>
            <Button
              mode={following ? 'outlined' : 'contained'}
              onPress={handleFollowToggle}
              loading={followLoading}
              disabled={followLoading}
              style={styles.followButton}
              buttonColor={following ? undefined : '#000000'}
              textColor={following ? theme.colors.onBackground : '#FFFFFF'}
            >
              {following ? 'Unfollow' : 'Follow'}
            </Button>
          </View>
        ) : null}

        <Divider style={styles.divider} />

        {/* Content — gated on privacy */}
        {profile.privacy ? (
          <View style={styles.privateContainer}>
            <Text variant="bodyMedium" style={{ color: theme.colors.onSurface, opacity: 0.6, textAlign: 'center' }}>
              This profile is private.
            </Text>
          </View>
        ) : (
          <View style={styles.listsSection}>
            <Text variant="headlineSmall" style={[styles.sectionTitle, { color: theme.colors.onBackground }]}>
              Lists
            </Text>
            {publicLists.length === 0 ? (
              <Text style={[styles.emptyText, { color: theme.colors.onSurface }]}>
                No public lists yet.
              </Text>
            ) : (
              publicLists.map(list => (
                <Pressable
                  key={list.listId}
                  style={({ pressed }) => [styles.listItem, { backgroundColor: theme.colors.surface, opacity: pressed ? 0.7 : 1 }]}
                  onPress={() => router.push({ pathname: '/list/[id]', params: { id: String(list.listId) } } as any)}
                >
                  <Text variant="titleMedium" style={{ color: theme.colors.onSurface }}>
                    {list.title}
                  </Text>
                  {list.description ? (
                    <Text variant="bodySmall" style={{ color: theme.colors.onSurface, opacity: 0.7, marginTop: 2 }}>
                      {list.description}
                    </Text>
                  ) : null}
                  <Text variant="bodySmall" style={{ color: theme.colors.onSurface, opacity: 0.5, marginTop: 4 }}>
                    {list.bookCount ?? 0} {(list.bookCount ?? 0) === 1 ? 'book' : 'books'}
                  </Text>
                </Pressable>
              ))
            )}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  floatingHeader: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
  },
  header: {
    alignItems: 'center',
    paddingTop: 24,
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
  bio: {
    marginTop: 8,
    opacity: 0.7,
    textAlign: 'center',
    fontStyle: 'italic',
    paddingHorizontal: 16,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 16,
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
  followContainer: {
    paddingHorizontal: 24,
    paddingBottom: 16,
  },
  followButton: {
    borderRadius: 8,
  },
  divider: {
    marginVertical: 8,
  },
  listsSection: {
    padding: 16,
    gap: 12,
  },
  sectionTitle: {
    fontWeight: 'bold',
    marginBottom: 8,
  },
  listItem: {
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  emptyText: {
    opacity: 0.6,
    fontSize: 14,
  },
  privateContainer: {
    padding: 32,
    alignItems: 'center',
  },
});
