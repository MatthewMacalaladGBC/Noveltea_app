import { useAuth } from '@/src/context/AuthContext';
import { router } from 'expo-router';
import { useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { ActivityIndicator, Button, Text, TextInput, useTheme } from 'react-native-paper';

const BASE_URL = (process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:8080').replace(/\/$/, '');

export default function ChangePasswordScreen() {
  const theme = useTheme();
  const { token } = useAuth();

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSave = async () => {
    setErrorMsg(null);

    if (!currentPassword || !newPassword || !confirmPassword) {
      setErrorMsg('Please fill in all fields.');
      return;
    }
    if (newPassword.length < 8) {
      setErrorMsg('New password must be at least 8 characters.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setErrorMsg('New passwords do not match.');
      return;
    }
    if (newPassword === currentPassword) {
      setErrorMsg('New password must be different from your current password.');
      return;
    }

    setSaving(true);
    try {
      const res = await fetch(`${BASE_URL}/users/password`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ currentPassword, newPassword }),
      });

      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || `Request failed with status ${res.status}`);
      }

      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setSuccess(true);
      setTimeout(() => router.back(), 2000);
    } catch (e: any) {
      setErrorMsg(e?.message ?? 'Something went wrong. Try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
      contentContainerStyle={styles.content}
      keyboardShouldPersistTaps="handled"
    >
      <Text
        variant="bodyMedium"
        style={[styles.hint, { color: theme.colors.onSurface }]}
      >
        Enter your current password, then choose a new one.
      </Text>

      <TextInput
        label="Current password"
        value={currentPassword}
        onChangeText={setCurrentPassword}
        mode="outlined"
        secureTextEntry={!showCurrent}
        right={
          <TextInput.Icon
            icon={showCurrent ? 'eye-off' : 'eye'}
            onPress={() => setShowCurrent(v => !v)}
          />
        }
        style={styles.input}
      />

      <TextInput
        label="New password"
        value={newPassword}
        onChangeText={setNewPassword}
        mode="outlined"
        secureTextEntry={!showNew}
        right={
          <TextInput.Icon
            icon={showNew ? 'eye-off' : 'eye'}
            onPress={() => setShowNew(v => !v)}
          />
        }
        style={styles.input}
      />

      <TextInput
        label="Confirm new password"
        value={confirmPassword}
        onChangeText={setConfirmPassword}
        mode="outlined"
        secureTextEntry={!showConfirm}
        right={
          <TextInput.Icon
            icon={showConfirm ? 'eye-off' : 'eye'}
            onPress={() => setShowConfirm(v => !v)}
          />
        }
        style={styles.input}
      />

      {newPassword.length > 0 && newPassword.length < 8 && (
        <Text style={[styles.validationText, { color: theme.colors.error }]}>
          Password must be at least 8 characters
        </Text>
      )}

      {confirmPassword.length > 0 && newPassword !== confirmPassword && (
        <Text style={[styles.validationText, { color: theme.colors.error }]}>
          Passwords do not match
        </Text>
      )}

      {errorMsg && (
        <View style={[styles.errorBanner, { backgroundColor: '#fecaca' }]}>
          <Text style={{ color: '#b91c1c', fontWeight: '600', textAlign: 'center' }}>
            {errorMsg}
          </Text>
        </View>
      )}

      {success && (
        <View style={[styles.successBanner, { backgroundColor: '#4ade80' }]}>
          <Text style={{ color: '#fff', fontWeight: '600', textAlign: 'center' }}>
            ✓ Password changed successfully!
          </Text>
        </View>
      )}

      <Button
        mode="contained"
        onPress={handleSave}
        disabled={saving || success}
        style={styles.saveButton}
        buttonColor={theme.colors.onBackground}
        textColor={theme.colors.background}
        labelStyle={styles.saveLabel}
      >
        {saving ? <ActivityIndicator size={16} color={theme.colors.background} /> : 'Update password'}
      </Button>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 20, paddingTop: 24 },
  hint: {
    opacity: 0.6,
    marginBottom: 24,
    lineHeight: 20,
  },
  input: {
    marginBottom: 16,
  },
  validationText: {
    fontSize: 13,
    marginTop: -8,
    marginBottom: 12,
    marginLeft: 4,
  },
  errorBanner: {
    padding: 14,
    borderRadius: 10,
    marginBottom: 12,
  },
  successBanner: {
    padding: 14,
    borderRadius: 10,
    marginBottom: 12,
  },
  saveButton: {
    marginTop: 8,
    borderRadius: 10,
  },
  saveLabel: {
    fontSize: 15,
    fontWeight: '600',
  },
});
