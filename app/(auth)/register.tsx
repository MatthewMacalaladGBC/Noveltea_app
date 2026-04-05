import { authApi } from "@/src/api/client";
import DateTimePicker from "@react-native-community/datetimepicker";
import { router } from "expo-router";
import * as SecureStore from "expo-secure-store";
import { useState } from "react";
import { Alert, Pressable, ScrollView, StyleSheet, Text, TextInput } from "react-native";

export default function Register() {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [date, setDate] = useState(new Date());
  const [showPicker, setShowPicker] = useState(false);
  const [loading, setLoading] = useState(false);

  function formatDate(d: Date): string {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  }

  function calculateAge(dob: string): number {
    const birth = new Date(dob);
    const today = new Date();
    let age = today.getFullYear() - birth.getFullYear();
    const m = today.getMonth() - birth.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
    return age;
  }

  async function handleRegister() {
    if (!username || !email || !password || !confirmPassword || !dateOfBirth) {
      Alert.alert("Missing fields", "Please fill in all fields.");
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert("Password mismatch", "Passwords do not match.");
      return;
    }

    const age = calculateAge(dateOfBirth);
    if (age < 13) {
      Alert.alert("Age requirement", "You must be at least 13 years old to create an account.");
      return;
    }
    
     console.log("Submitting dateOfBirth:", dateOfBirth);
     
         try {
      setLoading(true);

      const data = await authApi.register(
        username.trim(),
        email.trim().toLowerCase(),
        password,
        dateOfBirth
      );

      await SecureStore.setItemAsync("token", data.accessToken);
      await SecureStore.setItemAsync("userId", String(data.user.userId));
      await SecureStore.setItemAsync("username", data.user.username);

      router.push("/(tabs)");
    } catch (error: any) {
      Alert.alert("Registration failed", error.message || "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>NovelTea</Text>
      <Text style={styles.subtitle}>Create Account</Text>

      <Text style={styles.label}>Username:</Text>
      <TextInput
        style={styles.input}
        value={username}
        onChangeText={setUsername}
        autoCapitalize="none"
      />

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

      <Text style={styles.label}>Confirm Password:</Text>
      <TextInput
        style={styles.input}
        value={confirmPassword}
        onChangeText={setConfirmPassword}
        secureTextEntry
      />

      <Text style={styles.label}>
        Date of Birth: <Text style={styles.hint}>(must be 13+)</Text>
      </Text>
      <Pressable style={styles.input} onPress={() => setShowPicker(true)}>
        <Text style={dateOfBirth ? styles.dateText : styles.datePlaceholder}>
          {dateOfBirth || "Select your date of birth"}
        </Text>
      </Pressable>

      {showPicker && (
        <DateTimePicker
          value={date}
          mode="date"
          maximumDate={new Date()}
          onChange={(event, selectedDate) => {
            setShowPicker(false);
            if (selectedDate) {
              setDate(selectedDate);
              setDateOfBirth(formatDate(selectedDate));
            }
          }}
        />
      )}

      {dateOfBirth ? (
        <Text style={styles.verified}>✓ Age verified — you're good to go!</Text>
      ) : null}

      <Text style={styles.terms}>
        I accept the <Text style={styles.termsLink}>Terms and Conditions</Text>
      </Text>

      <Pressable
        style={[styles.primaryBtn, loading && styles.primaryBtnDisabled]}
        onPress={handleRegister}
        disabled={loading}
      >
        <Text style={styles.primaryBtnText}>
          {loading ? "Creating account..." : "Create Account"}
        </Text>
      </Pressable>

      <Pressable onPress={() => router.back()}>
        <Text style={styles.bottomLink}>
          Already have an account? <Text style={styles.bottomLinkStrong}>Login</Text>
        </Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { backgroundColor: "#fff", paddingHorizontal: 24, paddingTop: 70, paddingBottom: 40 },
  title: { fontSize: 32, fontWeight: "800", textAlign: "center" },
  subtitle: { fontSize: 16, fontWeight: "700", textAlign: "center", marginTop: 10, marginBottom: 30 },

  label: { fontSize: 12, color: "#333", marginBottom: 6, marginTop: 10 },
  hint: { fontSize: 11, color: "#999" },

  input: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    justifyContent: "center",
  },

  dateText: { color: "#000" },
  datePlaceholder: { color: "#aaa" },
  verified: { fontSize: 12, color: "green", marginTop: 6 },

  terms: { marginTop: 14, fontSize: 12, color: "#444" },
  termsLink: { textDecorationLine: "underline", fontWeight: "700" },

  primaryBtn: {
    marginTop: 18,
    width: "100%",
    backgroundColor: "#000",
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: "center",
  },
  primaryBtnDisabled: { backgroundColor: "#555" },
  primaryBtnText: { color: "#fff", fontWeight: "700" },

  bottomLink: { marginTop: 18, textAlign: "center", color: "#444" },
  bottomLinkStrong: { fontWeight: "800", textDecorationLine: "underline" },
});