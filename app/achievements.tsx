import { reviewsApi, usersApi } from '@/src/api/client';
import { useAuth } from '@/src/context/AuthContext';
import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { Card, Text, useTheme } from 'react-native-paper';

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

  const currentStreak = user?.currentStreak ?? 0;
  const longestStreak = user?.longestStreak ?? 0;

  const [leaderboard, setLeaderboard] = useState<any[]>([]);

  const [reviewCount, setReviewCount] = useState(0);

  useFocusEffect(
  useCallback(() => {
    let cancelled = false;

    async function load() {
      if (!token) return;

      // load review count safely
      try {
        const count = await reviewsApi.getMyCount(token);
        console.log('ACHIEVEMENTS review count:', count);

        if (!cancelled) {
            setReviewCount(count);
        }
    } catch (e) {
        console.log('ACHIEVEMENTS review count failed:', e);

      if (!cancelled) {
        setReviewCount(0);
        }
    }

      // load leaderboard separately so it doesn't break review count
      try {
        const leaderboardData = await usersApi.getLeaderboard(token);
        if (!cancelled) {
          setLeaderboard(leaderboardData.slice(0, 10));
        }
      } catch {
        if (!cancelled) {
          setLeaderboard([]);
        }
      }
    }

    load();

    return () => {
      cancelled = true;
    };
  }, [token])
);

  const points = user?.points ?? 0;
  const likesReceived = user?.reviewLikesReceived ?? 0;

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
      <ScrollView contentContainerStyle={styles.content}>
        <Text variant="headlineSmall" style={styles.title}>
          🏆 Progress
        </Text>

        <Card style={[styles.card, { backgroundColor: '#F3F3F3' }]}>          
            <Card.Content>
            <Text variant="titleMedium">Your Progress</Text>
            <Text style={styles.value}>{completedCount}/{totalCount} achievements unlocked</Text>
            <Text style={styles.value}>⭐ Points: {points}</Text>
            <Text style={styles.value}>👍 Likes received: {likesReceived}</Text>
            <Text style={styles.value}>📝 Reviews: {String(reviewCount)}</Text>
            </Card.Content>
        </Card>

        <Card style={[styles.card, { backgroundColor: '#F3F3F3' }]}>          
            <Card.Content>
            <Text variant="titleMedium">Reading Milestones</Text>

            {achievementItems.map((item, index) => (
              <View key={index} style={styles.achievementRow}>
                <Text style={styles.item}>
                  {item.icon} {item.title}
                </Text>
                <Text style={styles.sub}>{item.subtitle}</Text>
              </View>
            ))}
          </Card.Content>
        </Card>

        <Card style={[styles.card, { backgroundColor: '#F3F3F3' }]}>
          <Card.Content>
            <Text variant="titleMedium">Daily & Weekly Progress</Text>

            <Text style={styles.item}>🔥 Reading Streak</Text>
            <Text style={styles.sub}>{currentStreak} day{currentStreak === 1 ? '' : 's'} in a row</Text>

            <Text style={styles.item}>🏆 Best Streak</Text>
            <Text style={styles.sub}>{longestStreak} day{longestStreak === 1 ? '' : 's'} longest streak</Text>
           </Card.Content>
        </Card>

        <Card style={[styles.card, { backgroundColor: '#F3F3F3' }]}>
          <Card.Content>
            <Text variant="titleMedium">🏅 Leaderboard</Text>

            {leaderboard.length === 0 ? (
                <Text style={styles.sub}>No leaderboard data yet</Text>
            ) : (
            leaderboard.map((item, index) => (
                <View key={item.userId} style={styles.leaderboardRow}>
            <Text style={styles.rank}>#{index + 1}</Text>
            <Text style={styles.username}>
                    {item.username}
                    {item.username === user?.username ? ' (You)' : ''}
            </Text>
            <Text style={styles.points}>{item.points ?? 0} pts</Text>
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
  title: {
    fontWeight: '700',
    marginBottom: 4,
  },
  card: {
    borderRadius: 16,
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
    opacity: 0.7,
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