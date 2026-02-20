import { useThemeContext } from '@/src/ThemeContext';
import { router } from 'expo-router';
import React, { useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { Appbar, Button, Text, TextInput, useTheme } from 'react-native-paper';

export default function LoginScreen() {
  const theme = useTheme();
  const { isDark } = useThemeContext();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    setLoading(true);
    // TODO: Implement actual login logic
    console.log('Login with:', email, password);
    
    // Simulate API call
    setTimeout(() => {
      setLoading(false);
      router.replace('/(tabs)');
    }, 1000);
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={true}
        scrollEnabled={true}
      >
        {/* Back button */}
        <Appbar.Header style={{ backgroundColor: 'transparent', elevation: 0, marginBottom: -16 }}>
          <Appbar.BackAction onPress={() => router.push('/auth/welcome')} color={theme.colors.onBackground} />
        </Appbar.Header>

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
    paddingTop: 20,
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
});