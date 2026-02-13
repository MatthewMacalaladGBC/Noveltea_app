import { useThemeContext } from '@/src/ThemeContext';
import React from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { Text, useTheme } from 'react-native-paper';

export default function LibraryScreen() {
  const theme = useTheme();
  const { isDark } = useThemeContext();

  return (
    <ScrollView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <View style={styles.header}>
        <Text variant="displaySmall" style={[styles.title, { color: theme.colors.onBackground }]}>
          My Library
        </Text>
        <Text variant="bodyMedium" style={[styles.subtitle, { color: theme.colors.onSurface }]}>
          Your saved books and reading lists
        </Text>
      </View>

      {/* Placeholder content */}
      <View style={styles.content}>
        <Text style={[styles.emptyText, { color: theme.colors.onSurface }]}>
          Your library is empty.
        </Text>
        <Text style={[styles.emptySubtext, { color: theme.colors.onSurface }]}>
          Start saving books to see them here!
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 24,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    opacity: 0.7,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 100,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    opacity: 0.6,
  },
});