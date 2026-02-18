import { View, Text, StyleSheet, Pressable } from "react-native";
import { router } from "expo-router";

export default function AuthHome() {
  return (
    <View style={styles.container}>
      <View style={styles.logoRow}>
        <Text style={styles.logoIcon}>📖</Text>
        <Text style={styles.logoText}>NovelTea</Text>
      </View>

      <Pressable style={styles.primaryBtn} onPress={() => router.push("/(auth)/login")}>
        <Text style={styles.primaryBtnText}>Login</Text>
      </Pressable>

      <Pressable style={styles.outlineBtn} onPress={() => router.push("/(auth)/register")}>
        <Text style={styles.outlineBtnText}>Create Account</Text>
      </Pressable>

      <Pressable onPress={() => router.push("/(tabs)")}>
        <Text style={styles.linkText}>Continue as Guest</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
  },
  logoRow: { flexDirection: "row", alignItems: "center", marginBottom: 40 },
  logoIcon: { fontSize: 28, marginRight: 10 },
  logoText: { fontSize: 28, fontWeight: "800" },

  primaryBtn: {
    width: "100%",
    backgroundColor: "#000",
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: "center",
    marginBottom: 12,
  },
  primaryBtnText: { color: "#fff", fontWeight: "700" },

  outlineBtn: {
    width: "100%",
    borderWidth: 1,
    borderColor: "#000",
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: "center",
    marginBottom: 18,
  },
  outlineBtnText: { color: "#000", fontWeight: "700" },

  linkText: { color: "#555", textDecorationLine: "underline" },
});
