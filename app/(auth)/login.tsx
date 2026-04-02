import { authApi } from "@/src/api/client";
import { router } from "expo-router";
import * as SecureStore from "expo-secure-store";
import { useState } from "react";
import { Alert, Pressable, StyleSheet, Text, TextInput, View } from "react-native";

export default function LoginScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleLogin() {
    if (!email || !password) {
      Alert.alert("Missing fields", "Please enter your email and password.");
      return;
    }

    try {
      setLoading(true);
      const data = await authApi.login(email.trim().toLowerCase(), password);

      // Store token and basic user info for use across the app
      await SecureStore.setItemAsync("token", data.accessToken);
      await SecureStore.setItemAsync("userId", String(data.user.userId));
      await SecureStore.setItemAsync("username", data.user.username);

      router.replace("/(tabs)");
    } catch (error: any) {
      Alert.alert("Login failed", error.message || "Invalid email or password.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <View style={styles.container}>
      <Text style={styles.brand}>NovelTea</Text>
      <Text style={styles.title}>Login</Text>

      <Text style={styles.label}>Email:</Text>
      <TextInput
        style={styles.input}
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
      />

      <Text style={styles.label}>Password:</Text>
      <TextInput
        style={styles.input}
        value={password}
        onChangeText={setPassword}
        secureTextEntry
      />

      <Pressable onPress={() => Alert.alert("Coming soon", "Forgot password coming soon.")}>
        <Text style={styles.forgot}>Forgot password?</Text>
      </Pressable>

      <Pressable
        style={[styles.primaryBtn, loading && styles.primaryBtnDisabled]}
        onPress={handleLogin}
        disabled={loading}
      >
        <Text style={styles.primaryBtnText}>{loading ? "Logging in..." : "Login"}</Text>
      </Pressable>

      <Pressable onPress={() => router.back()}>
        <Text style={styles.backLink}>Back</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff", paddingHorizontal: 24, paddingTop: 80 },
  brand: { fontSize: 28, fontWeight: "800", textAlign: "center" },
  title: { fontSize: 14, fontWeight: "700", textAlign: "center", marginTop: 8, marginBottom: 30 },

  label: { fontSize: 12, color: "#333", marginBottom: 6, marginTop: 12 },
  input: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },

  forgot: { marginTop: 10, fontSize: 11, color: "#444", textDecorationLine: "underline" },

  primaryBtn: {
    marginTop: 14,
    width: "100%",
    backgroundColor: "#000",
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: "center",
  },
  primaryBtnDisabled: { backgroundColor: "#555" },
  primaryBtnText: { color: "#fff", fontWeight: "700" },

  backLink: { marginTop: 18, textAlign: "center", color: "#555", textDecorationLine: "underline" },
});