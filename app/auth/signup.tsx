import { useThemeContext } from '@/src/ThemeContext';
import { router } from 'expo-router';
import React, { useState } from 'react';
import { ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import { Appbar, Button, Text, TextInput, useTheme } from 'react-native-paper';

export default function SignupScreen() {
  const theme = useTheme();
  const { isDark } = useThemeContext();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [loading, setLoading] = useState(false);

  const isFormValid = () => {
    return (
      fullName.trim() !== '' &&
      email.trim() !== '' &&
      password.length >= 6 &&
      password === confirmPassword &&
      agreedToTerms
    );
  };

  const handleSignup = async () => {
    if (!isFormValid()) {
      return;
    }

    setLoading(true);
    // TODO: Implement actual signup logic
    console.log('Signup with:', { fullName, email, password });
    
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
            Create Account
          </Text>
        </View>

        {/* Form */}
        <View style={styles.form}>
          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: theme.colors.onBackground }]}>Full Name:</Text>
            <TextInput
              value={fullName}
              onChangeText={setFullName}
              placeholder="Jane Doe"
              mode="outlined"
              autoCapitalize="words"
              autoComplete="name"
              style={styles.input}
              outlineColor="#E5E5E5"
              activeOutlineColor="#000000"
              textColor={theme.colors.onBackground}
              placeholderTextColor="#999999"
              contentStyle={styles.inputContent}
            />
          </View>

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

          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: theme.colors.onBackground }]}>Confirm Password:</Text>
            <TextInput
              value={confirmPassword}
              onChangeText={setConfirmPassword}
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

          {/* Terms and Conditions Checkbox */}
          <TouchableOpacity 
            style={styles.checkboxContainer}
            onPress={() => setAgreedToTerms(!agreedToTerms)}
            activeOpacity={0.7}
          >
            <View style={[
              styles.checkbox,
              agreedToTerms && styles.checkboxChecked
            ]}>
              {agreedToTerms && (
                <Text style={styles.checkmark}>✓</Text>
              )}
            </View>
            <Text style={[styles.checkboxText, { color: theme.colors.onSurface }]}>
              I accept the{' '}
              <Text style={styles.linkText}>
                Terms and Conditions
              </Text>
            </Text>
          </TouchableOpacity>

          <Button
            mode="contained"
            onPress={() => {
              if (isFormValid() && !loading) {
                handleSignup();
              }
            }}
            loading={loading}
            style={[
              styles.createButton,
              !isFormValid() && styles.createButtonDisabled
            ]}
            labelStyle={styles.buttonLabel}
            buttonColor="#000000"
            textColor="#FFFFFF"
          >
            Create Account
          </Button>

          {/* Footer - closer to button */}
          <Text style={[styles.footerText, { color: theme.colors.onSurface }]}>
            Already have an account?{' '}
            <Text 
              style={styles.loginLink}
              onPress={() => router.push('/auth/login')}
            >
              Login
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
    marginBottom: 20,
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
    gap: 10,
  },
  inputGroup: {
    gap: 4,
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
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
    marginBottom: 6,
  },
  checkbox: {
    width: 18,
    height: 18,
    borderWidth: 2,
    borderColor: '#000000',
    borderRadius: 2,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  checkboxChecked: {
    backgroundColor: '#000000',
  },
  checkmark: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
  checkboxText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 18,
  },
  linkText: {
    color: '#0066CC',
    textDecorationLine: 'underline',
  },
  createButton: {
    paddingVertical: 10,
    borderRadius: 8,
    marginTop: 10,
    marginBottom: 10,
  },
  createButtonDisabled: {
    opacity: 0.6,
  },
  buttonLabel: {
    fontSize: 16,
    fontWeight: '600',
  },
  footerText: {
    fontSize: 13,
    textAlign: 'center',
    marginTop: 10,
    marginBottom: 20,
  },
  loginLink: {
    color: '#0066CC',
    fontWeight: '600',
  },
});