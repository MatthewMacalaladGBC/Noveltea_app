import { useAuth } from '@/src/context/AuthContext';
import { router } from 'expo-router';
import React, { useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { Button, Text, TextInput, useTheme } from 'react-native-paper';

export default function LoginScreen() {
  const theme = useTheme();
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async () => {
    setLoading(true);
    setError(null);
    try {
      await login(email, password);
      router.replace('/(tabs)');
    } catch (e: any) {
      setError(e.message ?? 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={true}
        scrollEnabled={true}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text variant="displaySmall" style={[styles.appName, { color: theme.colors.onBackground }]}>
            NovelTea
          </Text>
          <Text variant="headlineSmall" style={[styles.title, { color: theme.colors.onBackground }]}>
            Login
          </Text>
        </View>

        {/* Form */}
        <View style={styles.form}>
          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: theme.colors.onBackground }]}>Email:</Text>
            <TextInput
              value={email}
              onChangeText={setEmail}
              placeholder="someone@email.com"
              mode="outlined"
              keyboardType="email-address"
              autoCapitalize="none"
              autoComplete="email"
              style={styles.input}
              outlineColor="#E5E5E5"
              activeOutlineColor="#000000"
              textColor={theme.colors.onBackground}
              placeholderTextColor="#999999"
              contentStyle={styles.inputContent}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: theme.colors.onBackground }]}>Password:</Text>
            <TextInput
              value={password}
              onChangeText={setPassword}
              placeholder="**********"
              mode="outlined"
              secureTextEntry
              autoCapitalize="none"
              autoComplete="password"
              style={styles.input}
              outlineColor="#E5E5E5"
              activeOutlineColor="#000000"
              textColor={theme.colors.onBackground}
              placeholderTextColor="#999999"
              contentStyle={styles.inputContent}
            />
          </View>

          {/* Forgot Password Link */}
          <Text
            style={styles.forgotPassword}
            onPress={() => console.log('Forgot password')}
          >
            Forgot password?
          </Text>

          {error && (
            <Text style={styles.errorText}>{error}</Text>
          )}

          <Button
            mode="contained"
            onPress={() => {
              if (email && password && !loading) {
                handleLogin();
              }
            }}
            loading={loading}
            style={[
              styles.loginButton,
              (!email || !password) && styles.loginButtonDisabled
            ]}
            labelStyle={styles.buttonLabel}
            buttonColor="#000000"
            textColor="#FFFFFF"
          >
            Login
          </Button>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={[styles.footerText, { color: theme.colors.onSurface }]}>
            Don't have an account?{' '}
            <Text 
              style={styles.signupLink}
              onPress={() => router.push('/auth/signup')}
            >
              Create Account
            </Text>
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 32,
    paddingTop: 80,
    paddingBottom: 40,
  },
  header: {
    marginBottom: 24,
    alignItems: 'center',
  },
  appName: {
    fontSize: 30,
    fontWeight: 'bold',
    marginBottom: 6,
    textAlign: 'center',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  form: {
    gap: 14,
  },
  inputGroup: {
    gap: 6,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
  },
  input: {
    backgroundColor: '#FFFFFF',
    height: 48,
  },
  inputContent: {
    paddingHorizontal: 4,
  },
  forgotPassword: {
    fontSize: 13,
    textDecorationLine: 'underline',
    color: '#000000',
    alignSelf: 'flex-start',
    marginTop: 4,
  },
  loginButton: {
    paddingVertical: 10,
    borderRadius: 8,
    marginTop: 16,
    marginBottom: 10,
  },
  loginButtonDisabled: {
    opacity: 0.6,
  },
  buttonLabel: {
    fontSize: 16,
    fontWeight: '600',
  },
  footer: {
    alignItems: 'center',
    marginTop: 10,
  },
  footerText: {
    fontSize: 13,
  },
  signupLink: {
    color: '#0066CC',
    fontWeight: '600',
  },
  errorText: {
    fontSize: 13,
    color: '#CC0000',
    textAlign: 'center',
  },
});