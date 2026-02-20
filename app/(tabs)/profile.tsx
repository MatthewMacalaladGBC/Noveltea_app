import { useAuth } from '@/src/context/AuthContext';
import { useThemeContext } from '@/src/ThemeContext';
import { router } from 'expo-router';
import React from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, View } from 'react-native';
import { Avatar, Button, Divider, List, Text, useTheme } from 'react-native-paper';

export default function ProfileScreen() {
  const theme = useTheme();
  const { isDark, toggleTheme } = useThemeContext();
  const { user, isLoading, logout } = useAuth();

  const handleLogout = async () => {
    await logout();
    router.replace('/auth/welcome');
  };

  // ── Loading state ──────────────────────────────────────────────────────────
  // AuthContext is restoring a stored session (SecureStore → /auth/me).
  // Show a spinner rather than flashing the guest UI momentarily.
  if (isLoading) {
    return (
      <View style={[styles.centered, { backgroundColor: theme.colors.background }]}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  // ── Guest state ────────────────────────────────────────────────────────────
  // No stored session, or stored token was expired/invalid.
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
  // user is the full UserProfile fetched from /auth/me at login/session restore.
  const avatarLabel = user.username.charAt(0).toUpperCase();

  return (
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
        {/* Bio is optional — only rendered when the user has set one */}
        {user.bio ? (
          <Text variant="bodySmall" style={[styles.bio, { color: theme.colors.onSurface }]}>
            {user.bio}
          </Text>
        ) : null}
      </View>

      {/* Stats — values are placeholders until book list integration is complete */}
      <View style={styles.statsContainer}>
        <View style={styles.statItem}>
          <Text variant="headlineMedium" style={[styles.statNumber, { color: theme.colors.onBackground }]}>
            0
          </Text>
          <Text variant="bodySmall" style={[styles.statLabel, { color: theme.colors.onSurface }]}>
            Books Read
          </Text>
        </View>
        <View style={styles.statItem}>
          <Text variant="headlineMedium" style={[styles.statNumber, { color: theme.colors.onBackground }]}>
            0
          </Text>
          <Text variant="bodySmall" style={[styles.statLabel, { color: theme.colors.onSurface }]}>
            Reading
          </Text>
        </View>
        <View style={styles.statItem}>
          <Text variant="headlineMedium" style={[styles.statNumber, { color: theme.colors.onBackground }]}>
            0
          </Text>
          <Text variant="bodySmall" style={[styles.statLabel, { color: theme.colors.onSurface }]}>
            Want to Read
          </Text>
        </View>
      </View>

      <Divider style={styles.divider} />

      {/* Settings list — user-specific items only visible when logged in */}
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
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  // Used by the loading spinner state
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
  // Replaces the old `email` style — used for the email line and the guest subtitle
  subtitle: {
    opacity: 0.7,
  },
  // Bio sits below the email/subtitle, slightly smaller and italicised
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
