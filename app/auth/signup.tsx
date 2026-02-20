import { useThemeContext } from '@/src/ThemeContext';
import { router } from 'expo-router';
import React, { useMemo, useState } from 'react';
import { Platform, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import { Appbar, Button, Text, TextInput, useTheme } from 'react-native-paper';

// emulator-safe base URL for Android
const API_URL =
  process.env.EXPO_PUBLIC_API_URL ||
  (Platform.OS === 'android' ? 'http://10.0.2.2:8080' : 'http://localhost:8080');

console.log('SIGNUP SCREEN LOADED: app/auth/signup.tsx', { API_URL });

// Manual date picker
function DatePicker({ onConfirm, theme }: { onConfirm: (d: Date) => void; theme: any }) {
  const currentYear = new Date().getFullYear();
  const [day, setDay] = useState('');
  const [month, setMonth] = useState('');
  const [year, setYear] = useState('');
  const [err, setErr] = useState('');

  const confirm = () => {
    const d = parseInt(day, 10);
    const m = parseInt(month, 10) - 1;
    const y = parseInt(year, 10);

    if (!d || m < 0 || m > 11 || !y || y < 1900 || y > currentYear) {
      setErr('Please enter a valid date.');
      return;
    }

    const date = new Date(y, m, d);
    if (Number.isNaN(date.getTime())) {
      setErr('Please enter a valid date.');
      return;
    }

    // age check (13+)
    const now = new Date();
    let age = now.getFullYear() - y;
    const birthdayThisYear = new Date(now.getFullYear(), m, d);
    if (now < birthdayThisYear) age -= 1;

    if (age < 13) {
      setErr('You must be at least 13 years old to sign up.');
      return;
    }

    setErr('');
    onConfirm(date);
  };

  return (
    <View style={{ gap: 10 }}>
      <View style={{ flexDirection: 'row', gap: 8 }}>
        <TextInput
          label="Day"
          value={day}
          onChangeText={(t) => setDay(t.replace(/\D/g, '').slice(0, 2))}
          keyboardType="numeric"
          mode="outlined"
          style={{ flex: 1, backgroundColor: '#fff' }}
          outlineColor="#E5E5E5"
          activeOutlineColor="#000"
          textColor={theme.colors.onBackground}
          placeholder="DD"
        />

        <TextInput
          label="Month"
          value={month}
          onChangeText={(t) => setMonth(t.replace(/\D/g, '').slice(0, 2))}
          keyboardType="numeric"
          mode="outlined"
          style={{ flex: 1, backgroundColor: '#fff' }}
          outlineColor="#E5E5E5"
          activeOutlineColor="#000"
          textColor={theme.colors.onBackground}
          placeholder="MM"
        />

        <TextInput
          label="Year"
          value={year}
          onChangeText={(t) => setYear(t.replace(/\D/g, '').slice(0, 4))}
          keyboardType="numeric"
          mode="outlined"
          style={{ flex: 2, backgroundColor: '#fff' }}
          outlineColor="#E5E5E5"
          activeOutlineColor="#000"
          textColor={theme.colors.onBackground}
          placeholder="YYYY"
        />
      </View>

      {err ? <Text style={{ color: '#CC0000', fontSize: 12 }}>{err}</Text> : null}

      <Button mode="contained" onPress={confirm} buttonColor="#000" textColor="#fff" style={{ borderRadius: 8 }}>
        Confirm Date
      </Button>
    </View>
  );
}

//  Helper: extract Spring validation messages
function extractErrorMessage(data: any): string {
  if (!data) return 'Registration failed. Please try again.';

  // common single message
  if (typeof data.message === 'string' && data.message.trim()) return data.message;

  // sometimes: { error: "..." }
  if (typeof data.error === 'string' && data.error.trim()) return data.error;

  // sometimes: { errors: ["a", "b"] }
  if (Array.isArray(data.errors) && data.errors.length) return data.errors.join(', ');

  // sometimes: { errors: { field: "msg" } }
  if (data.errors && typeof data.errors === 'object') {
    const parts = Object.entries(data.errors).map(([k, v]) => `${k}: ${String(v)}`);
    if (parts.length) return parts.join('\n');
  }

  // Spring-style: { fieldErrors: [{field, defaultMessage}] }
  if (Array.isArray(data.fieldErrors) && data.fieldErrors.length) {
    return data.fieldErrors.map((e: any) => `${e.field}: ${e.defaultMessage}`).join('\n');
  }

  // Spring Validation: { violations: [{field, message}] }
  if (Array.isArray(data.violations) && data.violations.length) {
    return data.violations.map((v: any) => `${v.field}: ${v.message}`).join('\n');
  }

  // last resort
  try {
    return JSON.stringify(data);
  } catch {
    return 'Registration failed. Please try again.';
  }
}

// Main signup screen
export default function SignupScreen() {
  const theme = useTheme();
  const { isDark } = useThemeContext();

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [loading, setLoading] = useState(false);

  const [dateOfBirth, setDateOfBirth] = useState<Date | null>(null);
  const [showDatePicker, setShowDatePicker] = useState(false);

  const [error, setError] = useState<string | null>(null);

  const formatDate = (d: Date) =>
    d.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });

  const isFormValid = useMemo(() => {
    return (
      fullName.trim() !== '' &&
      email.trim() !== '' &&
      password.length >= 6 &&
      password === confirmPassword &&
      agreedToTerms &&
      dateOfBirth !== null
    );
  }, [fullName, email, password, confirmPassword, agreedToTerms, dateOfBirth]);

  const handleDateConfirmed = (d: Date) => {
    setDateOfBirth(d);
    setShowDatePicker(false);
  };

  const handleSignup = async () => {
    // extra guard (so we NEVER send blank username)
    console.log("FULLNAME RIGHT BEFORE SEND =", fullName);
    const username = fullName.trim();
    if (!username) {
      setError('Please enter your full name.');
      return;
    }
    if (!isFormValid || loading) return;

    setLoading(true);
    setError(null);

    try {
      const payload = {
        username,
        email: email.trim(),
        password,
      };

      // debug logs
      console.log('➡️ REGISTER payload:', payload);
      console.log('➡️ REGISTER url:', `${API_URL}/auth/register`);

      const res = await fetch(`${API_URL}/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json().catch(() => null);

      console.log('⬅️ REGISTER status:', res.status);
      console.log('⬅️ REGISTER response:', data);

      if (!res.ok) {
        throw new Error(extractErrorMessage(data));
      }

      // go to login after success
      router.replace('/auth/login');
    } catch (e: any) {
      setError(e?.message ?? 'Registration failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        <Appbar.Header style={{ backgroundColor: 'transparent', elevation: 0, marginBottom: -16 }}>
          <Appbar.BackAction onPress={() => router.push('/auth/welcome')} color={theme.colors.onBackground} />
        </Appbar.Header>

        <View style={styles.header}>
          <Text variant="displaySmall" style={[styles.appName, { color: theme.colors.onBackground }]}>
            NovelTea
          </Text>
          <Text variant="headlineSmall" style={[styles.title, { color: theme.colors.onBackground }]}>
            Create Account
          </Text>
        </View>

        <View style={styles.form}>
          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: theme.colors.onBackground }]}>Full Name:</Text>
            <TextInput
              value={fullName}
              onChangeText={setFullName}
              placeholder="Jane Doe"
              mode="outlined"
              autoCapitalize="words"
              style={styles.input}
              outlineColor="#E5E5E5"
              activeOutlineColor="#000000"
              textColor={theme.colors.onBackground}
              placeholderTextColor="#999999"
              contentStyle={styles.inputContent}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: theme.colors.onBackground }]}>
              Date of Birth: <Text style={{ color: '#999', fontWeight: '400', fontSize: 12 }}>(must be 13+)</Text>
            </Text>

            <TouchableOpacity
              style={[
                styles.dobButton,
                { borderColor: showDatePicker ? '#000' : '#E5E5E5', backgroundColor: '#fff' },
              ]}
              onPress={() => setShowDatePicker(!showDatePicker)}
              activeOpacity={0.7}
            >
              <Text style={{ color: dateOfBirth ? theme.colors.onBackground : '#999999', fontSize: 15 }}>
                {dateOfBirth ? formatDate(dateOfBirth) : 'Select your date of birth'}
              </Text>
              <Text style={{ fontSize: 16 }}>📅</Text>
            </TouchableOpacity>

            {showDatePicker && (
              <View style={[styles.datePickerBox, { backgroundColor: theme.colors.surface }]}>
                <DatePicker onConfirm={handleDateConfirmed} theme={theme} />
              </View>
            )}

            {dateOfBirth && !showDatePicker && <Text style={styles.ageSuccess}>✓ Age verified — you’re good to go!</Text>}
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
              style={styles.input}
              outlineColor="#E5E5E5"
              activeOutlineColor="#000000"
              textColor={theme.colors.onBackground}
              placeholderTextColor="#999999"
              contentStyle={styles.inputContent}
            />
            {confirmPassword.length > 0 && password !== confirmPassword && (
              <Text style={styles.ageError}>Passwords do not match.</Text>
            )}
          </View>

          <TouchableOpacity style={styles.checkboxContainer} onPress={() => setAgreedToTerms(!agreedToTerms)} activeOpacity={0.7}>
            <View style={[styles.checkbox, agreedToTerms && styles.checkboxChecked]}>
              {agreedToTerms && <Text style={styles.checkmark}>✓</Text>}
            </View>
            <Text style={[styles.checkboxText, { color: theme.colors.onSurface }]}>
              I accept the <Text style={styles.linkText}>Terms and Conditions</Text>
            </Text>
          </TouchableOpacity>

          {error ? <Text style={styles.errorText}>{error}</Text> : null}

          <Button
            mode="contained"
            onPress={handleSignup}
            loading={loading}
            disabled={!isFormValid || loading}
            style={[styles.createButton, (!isFormValid || loading) && styles.createButtonDisabled]}
            labelStyle={styles.buttonLabel}
            buttonColor="#000000"
            textColor="#FFFFFF"
          >
            Create Account
          </Button>

          <Text style={[styles.footerText, { color: theme.colors.onSurface }]}>
            Already have an account?{' '}
            <Text style={styles.loginLink} onPress={() => router.push('/auth/login')}>
              Login
            </Text>
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: { paddingHorizontal: 32, paddingTop: 20, paddingBottom: 40 },
  header: { marginBottom: 20, alignItems: 'center' },
  appName: { fontSize: 30, fontWeight: 'bold', marginBottom: 6, textAlign: 'center' },
  title: { fontSize: 20, fontWeight: 'bold', textAlign: 'center' },

  form: { gap: 10 },
  inputGroup: { gap: 4 },
  label: { fontSize: 14, fontWeight: '500' },
  input: { backgroundColor: '#FFFFFF', height: 48 },
  inputContent: { paddingHorizontal: 4 },

  dobButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    height: 52,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderRadius: 4,
  },
  datePickerBox: {
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E5E5',
    marginTop: 6,
  },

  ageError: { color: '#CC0000', fontSize: 12, marginTop: 2 },
  ageSuccess: { color: '#16a34a', fontSize: 12, marginTop: 4, fontWeight: '500' },

  checkboxContainer: { flexDirection: 'row', alignItems: 'center', marginTop: 6, marginBottom: 6 },
  checkbox: {
    width: 18,
    height: 18,
    borderWidth: 2,
    borderColor: '#000',
    borderRadius: 2,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  checkboxChecked: { backgroundColor: '#000000' },
  checkmark: { color: '#FFFFFF', fontSize: 12, fontWeight: 'bold' },
  checkboxText: { flex: 1, fontSize: 13, lineHeight: 18 },
  linkText: { color: '#0066CC', textDecorationLine: 'underline' },

  errorText: { color: '#CC0000', fontSize: 13, textAlign: 'center', marginTop: 6 },

  createButton: { paddingVertical: 10, borderRadius: 8, marginTop: 10, marginBottom: 10 },
  createButtonDisabled: { opacity: 0.6 },

  buttonLabel: { fontSize: 16, fontWeight: '600' },
  footerText: { fontSize: 13, textAlign: 'center', marginTop: 10, marginBottom: 20 },
  loginLink: { color: '#0066CC', fontWeight: '600' },
});