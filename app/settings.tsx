import { useAuth } from '@/src/context/AuthContext';
import { useThemeContext } from '@/src/ThemeContext';
import { router } from 'expo-router';
import { useState } from 'react';
import { Alert, ScrollView, StyleSheet, View } from 'react-native';
import { Divider, List, Switch, Text, useTheme } from 'react-native-paper';

export default function SettingsScreen() {
  const theme = useTheme();
  const { isDark, toggleTheme } = useThemeContext();
  const { user, token, logout } = useAuth();

  const [notifications, setNotifications] = useState(true);

  const handleDeleteAccount = () => {
    Alert.alert(
      'Delete account',
      'This will permanently delete your account and all your data. This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            if (!token || !user) return;
            try {
              const BASE_URL = (process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:8080').replace(/\/$/, '');
              const res = await fetch(`${BASE_URL}/users/${user.userId}`, {
                method: 'DELETE',
                headers: { Authorization: `Bearer ${token}` },
              });
              if (!res.ok) throw new Error('Failed to delete account');
              await logout();
              router.replace('/auth/welcome');
            } catch (e: any) {
              Alert.alert('Error', e.message ?? 'Could not delete account. Try again.');
            }
          },
        },
      ]
    );
  };

  return (
    <ScrollView style={[styles.container, { backgroundColor: theme.colors.background }]}>

      {/* Account */}
      <List.Section>
        <List.Subheader style={{ color: theme.colors.onSurface }}>Account</List.Subheader>
        <List.Item
          title="Email"
          description={user?.email ?? '—'}
          left={props => <List.Icon {...props} icon="email-outline" />}
          titleStyle={{ color: theme.colors.onBackground }}
          descriptionStyle={{ color: theme.colors.onSurface, opacity: 0.7 }}
        />
        <Divider />
        <List.Item
          title="Change password"
          left={props => <List.Icon {...props} icon="lock-outline" />}
          right={props => <List.Icon {...props} icon="chevron-right" />}
          onPress={() => router.push('/change-password' as any)}
          titleStyle={{ color: theme.colors.onBackground }}
        />
        <Divider />
        <List.Item
          title="Edit profile"
          left={props => <List.Icon {...props} icon="account-edit-outline" />}
          right={props => <List.Icon {...props} icon="chevron-right" />}
          onPress={() => router.push('/edit-profile' as any)}
          titleStyle={{ color: theme.colors.onBackground }}
        />
      </List.Section>

      <Divider style={styles.sectionDivider} />

      {/* Preferences */}
      <List.Section>
        <List.Subheader style={{ color: theme.colors.onSurface }}>Preferences</List.Subheader>
        <List.Item
          title={isDark ? 'Light mode' : 'Dark mode'}
          left={props => (
            <List.Icon {...props} icon={isDark ? 'white-balance-sunny' : 'moon-waning-crescent'} />
          )}
          right={() => (
            <Switch value={isDark} onValueChange={toggleTheme} color={theme.colors.primary} />
          )}
          onPress={toggleTheme}
          titleStyle={{ color: theme.colors.onBackground }}
        />
        <Divider />
        <List.Item
          title="Push notifications"
          left={props => <List.Icon {...props} icon="bell-outline" />}
          right={() => (
            <Switch
              value={notifications}
              onValueChange={setNotifications}
              color={theme.colors.primary}
            />
          )}
          onPress={() => setNotifications(v => !v)}
          titleStyle={{ color: theme.colors.onBackground }}
        />
      </List.Section>

      <Divider style={styles.sectionDivider} />

      {/* Support */}
      <List.Section>
        <List.Subheader style={{ color: theme.colors.onSurface }}>Support</List.Subheader>
        <List.Item
          title="Privacy policy"
          left={props => <List.Icon {...props} icon="shield-outline" />}
          right={props => <List.Icon {...props} icon="chevron-right" />}
          onPress={() => router.push('/privacy-policy' as any)}
          titleStyle={{ color: theme.colors.onBackground }}
        />
        <Divider />
        <List.Item
          title="Terms of service"
          left={props => <List.Icon {...props} icon="file-document-outline" />}
          right={props => <List.Icon {...props} icon="chevron-right" />}
          onPress={() => router.push('/terms-of-service' as any)}
          titleStyle={{ color: theme.colors.onBackground }}
        />
      </List.Section>

      <Divider style={styles.sectionDivider} />

      {/* Danger zone */}
      <List.Section>
        <List.Subheader style={{ color: theme.colors.error }}>Danger zone</List.Subheader>
        <List.Item
          title="Delete account"
          titleStyle={{ color: theme.colors.error }}
          left={props => <List.Icon {...props} icon="delete-outline" color={theme.colors.error} />}
          onPress={handleDeleteAccount}
        />
      </List.Section>

      <View style={styles.versionRow}>
        <Text variant="bodySmall" style={{ color: theme.colors.onSurface, opacity: 0.4 }}>
          Noveltea v1.0.0
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  sectionDivider: { marginVertical: 4 },
  versionRow: {
    alignItems: 'center',
    paddingVertical: 24,
  },
});
