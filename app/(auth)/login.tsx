import { View, Text, StyleSheet, TextInput, Pressable } from "react-native";
import { router } from "expo-router";

export default function LoginScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.brand}>NovelTea</Text>
      <Text style={styles.title}>Login</Text>

      <Text style={styles.label}>Email:</Text>
      <TextInput
        style={styles.input}
        keyboardType="email-address"
        autoCapitalize="none"
      />

      <Text style={styles.label}>Password:</Text>
      <TextInput style={styles.input} secureTextEntry />

      <Pressable onPress={() => alert("Forgot password coming soon")}>
        <Text style={styles.forgot}>Forgot password?</Text>
      </Pressable>

      <Pressable style={styles.primaryBtn} onPress={() => router.replace("/(tabs)")}>
        <Text style={styles.primaryBtnText}>Login</Text>
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
  primaryBtnText: { color: "#fff", fontWeight: "700" },

  backLink: { marginTop: 18, textAlign: "center", color: "#555", textDecorationLine: "underline" },
});
