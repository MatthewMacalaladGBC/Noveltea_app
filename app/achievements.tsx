import { authApi, reviewsApi, usersApi, UserProfile } from '@/src/api/client';
import { useAuth } from '@/src/context/AuthContext';
import { router, useFocusEffect } from 'expo-router';
import React, { useCallback, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { Appbar, Card, Text, useTheme } from 'react-native-paper';

function milestone(done: boolean, title: string, subtitle: string) {
  return {
    icon: done ? '✅' : '🔒',
    title,
    subtitle,
    done,
  };
}

export default function AchievementsScreen() {
  const theme = useTheme();
  const { user, token } = useAuth();

  const [freshUser, setFreshUser] = useState<UserProfile | null>(null);
  const [leaderboard, setLeaderboard] = useState<any[]>([]);
  const [reviewCount, setReviewCount] = useState(0);

  useFocusEffect(
    useCallback(() => {
      let cancelled = false;

      async function load() {
        if (!token) return;

        try {
          const profile = await authApi.me(token);
          if (!cancelled) setFreshUser(profile);
        } catch {
          if (!cancelled) setFreshUser(null);
        }

        try {
          const count = await reviewsApi.getMyCount(token);
          if (!cancelled) setReviewCount(typeof count === 'number' ? count : 0);
        } catch {
          if (!cancelled) setReviewCount(0);
        }

        try {
          const leaderboardData = await usersApi.getLeaderboard(token);
          if (!cancelled) setLeaderboard(leaderboardData.slice(0, 10));
        } catch {
          if (!cancelled) setLeaderboard([]);
        }
      }

      load();

      return () => {
        cancelled = true;
      };
    }, [token])
  );

  const currentStreak = freshUser?.currentStreak ?? user?.currentStreak ?? 0;
  const longestStreak = freshUser?.longestStreak ?? user?.longestStreak ?? 0;
  const points = freshUser?.points ?? user?.points ?? 0;
  const likesReceived = freshUser?.reviewLikesReceived ?? user?.reviewLikesReceived ?? 0;

  const achievementItems = [
    milestone(reviewCount >= 1, 'First Review', 'Write your first review'),
    milestone(reviewCount >= 5, 'Bookworm', 'Write 5 reviews'),
    milestone(reviewCount >= 10, 'Literary Explorer', 'Write 10 reviews'),
    milestone(likesReceived >= 1, 'First Like', 'Receive your first like'),
    milestone(likesReceived >= 5, 'Popular Reviewer', 'Receive 5 likes'),
    milestone(points >= 50, '50 Point Club', 'Reach 50 points'),
  ];

  const completedCount = achievementItems.filter(a => a.done).length;
  const totalCount = achievementItems.length;

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <Appbar.Header style={{ backgroundColor: theme.colors.background }}>
        <Appbar.BackAction onPress={() => router.back()} />
        <Appbar.Content title="Achievements" />
      </Appbar.Header>

      <ScrollView contentContainerStyle={styles.content}>
        <Card style={[styles.card, { backgroundColor: theme.colors.surface }]}>
          <Card.Content>
            <Text
              variant="titleMedium"
              style={[styles.cardTitle, { color: theme.colors.onSurface }]}
            >
              Your Progress
            </Text>
            <Text style={[styles.cardText, { color: theme.colors.onSurfaceVariant }]}>
              {completedCount}/{totalCount} achievements unlocked
            </Text>
            <Text style={[styles.value, { color: theme.colors.onSurface }]}>
              ⭐ Points: {points}
            </Text>
            <Text style={[styles.value, { color: theme.colors.onSurface }]}>
              👍 Likes received: {likesReceived}
            </Text>
            <Text style={[styles.value, { color: theme.colors.onSurface }]}>
              📝 Reviews: {reviewCount}
            </Text>
          </Card.Content>
        </Card>

        <Card style={[styles.card, { backgroundColor: theme.colors.surface }]}>
          <Card.Content>
            <Text
              variant="titleMedium"
              style={[styles.cardTitle, { color: theme.colors.onSurface }]}
            >
              Reading Milestones
            </Text>

            {achievementItems.map((item, index) => (
              <View key={index} style={styles.achievementRow}>
                <Text style={[styles.item, { color: theme.colors.onSurface }]}>
                  {item.icon} {item.title}
                </Text>
                <Text style={[styles.sub, { color: theme.colors.onSurfaceVariant }]}>
                  {item.subtitle}
                </Text>
              </View>
            ))}
          </Card.Content>
        </Card>

        <Card style={[styles.card, { backgroundColor: theme.colors.surface }]}>
          <Card.Content>
            <Text
              variant="titleMedium"
              style={[styles.cardTitle, { color: theme.colors.onSurface }]}
            >
              Daily & Weekly Progress
            </Text>

            <Text style={[styles.item, { color: theme.colors.onSurface }]}>
              🔥 Streak
            </Text>
            <Text style={[styles.sub, { color: theme.colors.onSurfaceVariant }]}>
              {currentStreak} day{currentStreak === 1 ? '' : 's'} in a row
            </Text>

            <Text style={[styles.item, styles.sectionGap, { color: theme.colors.onSurface }]}>
              🏆 Best Streak
            </Text>
            <Text style={[styles.sub, { color: theme.colors.onSurfaceVariant }]}>
              {longestStreak} day{longestStreak === 1 ? '' : 's'} longest streak
            </Text>
          </Card.Content>
        </Card>

        <Card style={[styles.card, { backgroundColor: theme.colors.surface }]}>
          <Card.Content>
            <Text
              variant="titleMedium"
              style={[styles.cardTitle, { color: theme.colors.onSurface }]}
            >
              🏅 Leaderboard
            </Text>

            {leaderboard.length === 0 ? (
              <Text style={[styles.sub, { color: theme.colors.onSurfaceVariant }]}>
                No leaderboard data yet
              </Text>
            ) : (
              leaderboard.map((item, index) => (
                <View key={item.userId} style={styles.leaderboardRow}>
                  <Text style={[styles.rank, { color: theme.colors.onSurface }]}>
                    #{index + 1}
                  </Text>
                  <Text style={[styles.username, { color: theme.colors.onSurface }]}>
                    {item.username}
                    {item.username === user?.username ? ' (You)' : ''}
                  </Text>
                  <Text style={[styles.points, { color: theme.colors.onSurface }]}>
                    {item.points ?? 0} pts
                  </Text>
                </View>
              ))
            )}
          </Card.Content>
        </Card>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: 16,
    gap: 14,
  },
  card: {
    borderRadius: 16,
  },
  cardTitle: {
    fontWeight: '700',
    marginBottom: 4,
  },
  cardText: {
    fontSize: 15,
    marginTop: 4,
  },
  value: {
    marginTop: 8,
    fontSize: 16,
  },
  achievementRow: {
    marginTop: 12,
  },
  item: {
    fontSize: 16,
    fontWeight: '600',
  },
  sub: {
    marginTop: 2,
    fontSize: 14,
  },
  sectionGap: {
    marginTop: 12,
  },
  leaderboardRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12,
  },
  rank: {
    fontWeight: 'bold',
    width: 30,
  },
  username: {
    flex: 1,
    fontSize: 16,
  },
  points: {
    fontWeight: '600',
  },
});