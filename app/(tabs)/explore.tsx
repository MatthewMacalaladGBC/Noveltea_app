import React from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { Text } from 'react-native-paper';

export default function ExploreScreen() {
  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        <Text variant="headlineLarge" style={styles.title}>
          Explore
        </Text>
        <Text variant="bodyLarge" style={styles.subtitle}>
          Coming soon...
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  content: {
    padding: 16,
    paddingTop: 60,
  },
  title: {
    color: '#FFFFFF',
    marginBottom: 8,
    fontWeight: 'bold',
  },
  subtitle: {
    color: '#B0B0B0',
  },
});