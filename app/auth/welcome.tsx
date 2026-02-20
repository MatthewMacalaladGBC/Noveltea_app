import { useThemeContext } from '@/src/ThemeContext';
import { router } from 'expo-router';
import React from 'react';
import { Image, StyleSheet, TouchableOpacity, View } from 'react-native';
import { Button, Text, useTheme } from 'react-native-paper';

export default function AuthWelcomeScreen() {
  const theme = useTheme();
  const { isDark } = useThemeContext();

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      {/* Logo and App Name - positioned at top */}
      <View style={styles.logoSection}>
        <TouchableOpacity
          style={styles.logoContainer}
          onPress={() => router.replace('/(tabs)')}
          activeOpacity={0.7}
        >
          <Image 
            source={require('@/assets/images/Noveltea-logo.png')}
            style={styles.logoImage}
            resizeMode="contain"
          />
          <Text variant="displayMedium" style={[styles.appName, { color: theme.colors.onBackground }]}>
            NovelTea
          </Text>
        </TouchableOpacity>
      </View>

      {/* Spacer to push buttons down */}
      <View style={styles.spacer} />

      {/* Buttons - positioned at bottom */}
      <View style={styles.buttonSection}>
        <Button
          mode="contained"
          onPress={() => router.push('/auth/login')}
          style={styles.loginButton}
          labelStyle={styles.buttonLabel}
          buttonColor="#000000"
          textColor="#FFFFFF"
        >
          Login
        </Button>

        <Button
          mode="outlined"
          onPress={() => router.push('/auth/signup')}
          style={styles.createAccountButton}
          labelStyle={[styles.buttonLabel, { color: theme.colors.onBackground }]}
          textColor={theme.colors.onBackground}
        >
          Create Account
        </Button>

        <Button
          mode="text"
          onPress={() => router.replace('/(tabs)')}
          style={styles.guestButton}
          labelStyle={[styles.guestButtonLabel, { color: theme.colors.onSurface }]}
        >
          Continue as Guest
        </Button>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 32,
    paddingTop: 100,
    paddingBottom: 200,
  },
  logoSection: {
    alignItems: 'center',
  },
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  logoImage: {
    width: 60,
    height: 60,
  },
  appName: {
    fontSize: 42,
    fontWeight: 'bold',
  },
  spacer: {
    flex: 1,
  },
  buttonSection: {
    gap: 16,
    width: '100%',
  },
  loginButton: {
    paddingVertical: 8,
    borderRadius: 8,
  },
  createAccountButton: {
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: '#000000',
  },
  guestButton: {
    paddingVertical: 4,
  },
  buttonLabel: {
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: 0,
  },
  guestButtonLabel: {
    fontSize: 15,
    fontWeight: '400',
  },
});