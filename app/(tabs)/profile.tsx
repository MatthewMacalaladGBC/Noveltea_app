import { useThemeContext } from '@/src/ThemeContext';
import { router } from 'expo-router';
import React from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { Avatar, Button, Divider, List, Text, useTheme } from 'react-native-paper';

export default function ProfileScreen() {
  const theme = useTheme();
  const { isDark, toggleTheme } = useThemeContext();

  return (
    <ScrollView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      {/* Header */}
      <View style={styles.header}>
        <Avatar.Text 
          size={80} 
          label="U" 
          style={[styles.avatar, { backgroundColor: theme.colors.primary }]}
        />
        <Text variant="headlineMedium" style={[styles.name, { color: theme.colors.onBackground }]}>
          Guest User
        </Text>
        <Text variant="bodyMedium" style={[styles.email, { color: theme.colors.onSurface }]}>
          guest@noveltea.com
        </Text>
      </View>

      {/* Stats */}
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

      {/* Settings List */}
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
          title={isDark ? "Light Mode" : "Dark Mode"}
          left={props => <List.Icon {...props} icon={isDark ? "white-balance-sunny" : "moon-waning-crescent"} />}
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

      {/* Login/Logout Button */}
      <View style={styles.actionContainer}>
        <Button 
          mode="outlined"
          onPress={() => router.push('/auth/welcome')}
          style={styles.loginButton}
          textColor={theme.colors.onBackground}
        >
          Login / Sign Up
        </Button>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
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
  email: {
    opacity: 0.7,
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
  loginButton: {
    borderWidth: 1,
  },
});