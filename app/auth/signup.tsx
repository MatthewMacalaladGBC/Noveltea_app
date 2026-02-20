import { useThemeContext } from '@/src/ThemeContext';
import { router } from 'expo-router';
import React, { useState } from 'react';
import { ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import { Appbar, Button, Text, TextInput, useTheme } from 'react-native-paper';

// ─── Manual date picker (no extra packages needed) ────────────────────────────
function DatePicker({ onConfirm, theme }: { onConfirm: (d: Date) => void; theme: any }) {
  const currentYear = new Date().getFullYear();
  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  const [day, setDay]     = useState('');
  const [month, setMonth] = useState('');
  const [year, setYear]   = useState('');
  const [err, setErr]     = useState('');

  const confirm = () => {
    const d = parseInt(day), m = parseInt(month) - 1, y = parseInt(year);
    if (!d || !m && m !== 0 || !y || y < 1900 || y > currentYear) {
      setErr('Please enter a valid date.');
      return;
    }
    const date = new Date(y, m, d);
    const age = currentYear - y - (new Date() < new Date(new Date().getFullYear(), m, d) ? 1 : 0);
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
        {/* Day */}
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
        {/* Month */}
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
        {/* Year */}
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
      <Button
        mode="contained"
        onPress={confirm}
        buttonColor="#000"
        textColor="#fff"
        style={{ borderRadius: 8 }}
      >
        Confirm Date
      </Button>
    </View>
  );
}

// ─── Main signup screen ───────────────────────────────────────────────────────
export default function SignupScreen() {
  const theme = useTheme();
  const { isDark } = useThemeContext();
  const [fullName, setFullName]             = useState('');
  const [email, setEmail]                   = useState('');
  const [password, setPassword]             = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [agreedToTerms, setAgreedToTerms]   = useState(false);
  const [loading, setLoading]               = useState(false);
  const [dateOfBirth, setDateOfBirth]       = useState<Date | null>(null);
  const [showDatePicker, setShowDatePicker] = useState(false);

  const formatDate = (d: Date) =>
    d.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });

  const isFormValid = () =>
    fullName.trim() !== '' &&
    email.trim() !== '' &&
    password.length >= 6 &&
    password === confirmPassword &&
    agreedToTerms &&
    dateOfBirth !== null;

  const handleSignup = async () => {
    if (!isFormValid()) return;
    setLoading(true);
    console.log('Signup:', { fullName, email, password, dateOfBirth });
    setTimeout(() => {
      setLoading(false);
      router.replace('/(tabs)');
    }, 1000);
  };

  const handleDateConfirmed = (d: Date) => {
    setDateOfBirth(d);
    setShowDatePicker(false);
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={true}
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
          {/* Full Name */}
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

          {/* Date of Birth */}
          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: theme.colors.onBackground }]}>
              Date of Birth: <Text style={{ color: '#999', fontWeight: '400', fontSize: 12 }}>(must be 13+)</Text>
            </Text>

            {/* DOB trigger button */}
            <TouchableOpacity
              style={[
                styles.dobButton,
                {
                  borderColor: showDatePicker ? '#000' : '#E5E5E5',
                  backgroundColor: '#fff',
                },
              ]}
              onPress={() => setShowDatePicker(!showDatePicker)}
              activeOpacity={0.7}
            >
              <Text style={{ color: dateOfBirth ? theme.colors.onBackground : '#999999', fontSize: 15 }}>
                {dateOfBirth ? formatDate(dateOfBirth) : 'Select your date of birth'}
              </Text>
              <Text style={{ fontSize: 16 }}>📅</Text>
            </TouchableOpacity>

            {/* Inline date picker */}
            {showDatePicker && (
              <View style={[styles.datePickerBox, { backgroundColor: theme.colors.surface }]}>
                <DatePicker onConfirm={handleDateConfirmed} theme={theme} />
              </View>
            )}

            {/* Success badge */}
            {dateOfBirth && !showDatePicker && (
              <Text style={styles.ageSuccess}>✓ Age verified — you're good to go!</Text>
            )}
          </View>

          {/* Email */}
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

          {/* Password */}
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

          {/* Confirm Password */}
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

          {/* Terms */}
          <TouchableOpacity
            style={styles.checkboxContainer}
            onPress={() => setAgreedToTerms(!agreedToTerms)}
            activeOpacity={0.7}
          >
            <View style={[styles.checkbox, agreedToTerms && styles.checkboxChecked]}>
              {agreedToTerms && <Text style={styles.checkmark}>✓</Text>}
            </View>
            <Text style={[styles.checkboxText, { color: theme.colors.onSurface }]}>
              I accept the{' '}
              <Text style={styles.linkText}>Terms and Conditions</Text>
            </Text>
          </TouchableOpacity>

          {/* Submit */}
          <Button
            mode="contained"
            onPress={() => { if (isFormValid() && !loading) handleSignup(); }}
            loading={loading}
            style={[styles.createButton, !isFormValid() && styles.createButtonDisabled]}
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
  container:    { flex: 1 },
  scrollContent: { paddingHorizontal: 32, paddingTop: 20, paddingBottom: 40 },
  header:       { marginBottom: 20, alignItems: 'center' },
  appName:      { fontSize: 30, fontWeight: 'bold', marginBottom: 6, textAlign: 'center' },
  title:        { fontSize: 20, fontWeight: 'bold', textAlign: 'center' },
  form:         { gap: 10 },
  inputGroup:   { gap: 4 },
  label:        { fontSize: 14, fontWeight: '500' },
  input:        { backgroundColor: '#FFFFFF', height: 48 },
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
  ageError:   { color: '#CC0000', fontSize: 12, marginTop: 2 },
  ageSuccess: { color: '#16a34a', fontSize: 12, marginTop: 4, fontWeight: '500' },

  checkboxContainer: { flexDirection: 'row', alignItems: 'center', marginTop: 6, marginBottom: 6 },
  checkbox:          { width: 18, height: 18, borderWidth: 2, borderColor: '#000', borderRadius: 2, justifyContent: 'center', alignItems: 'center', marginRight: 10 },
  checkboxChecked:   { backgroundColor: '#000000' },
  checkmark:         { color: '#FFFFFF', fontSize: 12, fontWeight: 'bold' },
  checkboxText:      { flex: 1, fontSize: 13, lineHeight: 18 },
  linkText:          { color: '#0066CC', textDecorationLine: 'underline' },

  createButton:         { paddingVertical: 10, borderRadius: 8, marginTop: 10, marginBottom: 10 },
  createButtonDisabled: { opacity: 0.6 },
  buttonLabel:          { fontSize: 16, fontWeight: '600' },
  footerText:           { fontSize: 13, textAlign: 'center', marginTop: 10, marginBottom: 20 },
  loginLink:            { color: '#0066CC', fontWeight: '600' },
});