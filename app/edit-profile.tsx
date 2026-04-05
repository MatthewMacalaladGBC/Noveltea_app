import { useAuth } from '@/src/context/AuthContext';
import { useThemeContext } from '@/src/ThemeContext';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as ImagePicker from 'expo-image-picker';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { Alert, Image, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { ActivityIndicator, Avatar, Button, Switch, Text, TextInput, useTheme } from 'react-native-paper';

const BASE_URL = (process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:8080').replace(/\/$/, '');

function avatarStorageKey(userId: number) {
  return `noveltea_avatar_${userId}`;
}

export default function EditProfileScreen() {
  const theme = useTheme();
  const { isDark } = useThemeContext();
  const { user, token, refreshUser } = useAuth();

  const [username, setUsername] = useState(user?.username ?? '');
  const [bio, setBio] = useState(user?.bio ?? '');
  const [privacy, setPrivacy] = useState(user?.privacy ?? false);
  const [avatarUri, setAvatarUri] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!user) return;
    AsyncStorage.getItem(avatarStorageKey(user.userId))
      .then(stored => { if (stored) setAvatarUri(stored); })
      .catch(() => {});
  }, [user]);

  const handlePickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission required', 'Allow photo access to set a profile picture.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.3,
      base64: true,
    });

    if (!result.canceled && result.assets[0]) {
      const asset = result.assets[0];

      if (!asset.base64) {
        Alert.alert('Error', 'Could not read image data. Try a different photo.');
        return;
      }

      const dataUri = `data:image/jpeg;base64,${asset.base64}`;
      setAvatarUri(dataUri);

      if (user) {
        try {
          await AsyncStorage.setItem(avatarStorageKey(user.userId), dataUri);
          await AsyncStorage.setItem('noveltea_last_user_id', String(user.userId));
        } catch (e) {
          Alert.alert('Error', 'Could not save image. The file may be too large — try a smaller photo.');
        }
      }
    }
  };

  const handleSave = async () => {
    if (!token || !user) return;
    setSaving(true);
    try {
      const response = await fetch(`${BASE_URL}/users/profile`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          username: username.trim() || undefined,
          bio: bio.trim() || undefined,
          privacy,
        }),
      });
      if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        throw new Error(body.message ?? 'Failed to save profile');
      }
      await refreshUser();
      router.back();
    } catch (e: any) {
      Alert.alert('Error', e.message ?? 'Could not save changes. Try again.');
    } finally {
      setSaving(false);
    }
  };

  if (!user) return null;

  const avatarLabel = user.username.charAt(0).toUpperCase();

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
      contentContainerStyle={styles.content}
      keyboardShouldPersistTaps="handled"
    >
      <View style={styles.avatarSection}>
        <Pressable onPress={handlePickImage} style={styles.avatarPressable}>
          {avatarUri ? (
            <Image source={{ uri: avatarUri }} style={styles.avatarImage} />
          ) : (
            <Avatar.Text
              size={90}
              label={avatarLabel}
              style={[styles.avatarFallback, { backgroundColor: theme.colors.primary }]}
            />
          )}
          <View style={[styles.avatarBadge, { backgroundColor: theme.colors.onBackground }]}>
            <Text style={[styles.avatarBadgeText, { color: theme.colors.background }]}>+</Text>
          </View>
        </Pressable>
        <Text style={[styles.avatarHint, { color: theme.colors.onSurface }]}>
          Tap to change photo
        </Text>
      </View>

      <View style={styles.fields}>
        <TextInput
          label="Display name"
          value={username}
          onChangeText={setUsername}
          mode="outlined"
          autoCapitalize="none"
          style={styles.input}
        />
        <TextInput
          label="Bio"
          value={bio}
          onChangeText={setBio}
          mode="outlined"
          multiline
          numberOfLines={3}
          style={styles.input}
          placeholder="Add a short bio..."
        />

        <View style={[styles.toggleRow, { borderColor: theme.colors.outline }]}>
          <View style={styles.toggleInfo}>
            <Text variant="bodyLarge" style={{ color: theme.colors.onBackground }}>
              Private account
            </Text>
            <Text variant="bodySmall" style={{ color: theme.colors.onSurface, opacity: 0.7 }}>
              Only approved followers can see your profile
            </Text>
          </View>
          <Switch value={privacy} onValueChange={setPrivacy} color={theme.colors.primary} />
        </View>
      </View>

      <Button
        mode="contained"
        onPress={handleSave}
        disabled={saving}
        style={styles.saveButton}
        buttonColor={theme.colors.onBackground}
        textColor={theme.colors.background}
        labelStyle={styles.saveLabel}
      >
        {saving ? <ActivityIndicator size={16} color={theme.colors.background} /> : 'Save changes'}
      </Button>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { paddingBottom: 40 },
  avatarSection: { alignItems: 'center', paddingTop: 32, paddingBottom: 24 },
  avatarPressable: { position: 'relative' },
  avatarImage: { width: 90, height: 90, borderRadius: 45 },
  avatarFallback: { borderRadius: 45 },
  avatarBadge: {
    position: 'absolute', bottom: 2, right: 2,
    width: 26, height: 26, borderRadius: 13,
    alignItems: 'center', justifyContent: 'center',
  },
  avatarBadgeText: { fontSize: 18, lineHeight: 22, fontWeight: '500' },
  avatarHint: { marginTop: 10, fontSize: 13, opacity: 0.6 },
  fields: { paddingHorizontal: 20, gap: 12 },
  input: { fontSize: 15 },
  toggleRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    borderWidth: 1, borderRadius: 8, paddingHorizontal: 14, paddingVertical: 12, marginTop: 4,
  },
  toggleInfo: { flex: 1, paddingRight: 12 },
  saveButton: { marginHorizontal: 20, marginTop: 28, borderRadius: 10 },
  saveLabel: { fontSize: 15, fontWeight: '600' },
});
