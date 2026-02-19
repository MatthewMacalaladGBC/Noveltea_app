import { View, Text, StyleSheet, TextInput, Pressable } from "react-native";
import { router } from "expo-router";

export default function Register() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>NovelTea</Text>
      <Text style={styles.subtitle}>Create Account</Text>

      <Text style={styles.label}>Full Name:</Text>
      <TextInput style={styles.input} />

      <Text style={styles.label}>Email:</Text>
      <TextInput style={styles.input} keyboardType="email-address" />

      <Text style={styles.label}>Password:</Text>
      <TextInput style={styles.input}  secureTextEntry />

      <Text style={styles.label}>Confirm Password:</Text>
      <TextInput style={styles.input} secureTextEntry />

      <Text style={styles.terms}>
        I accept the <Text style={styles.termsLink}>Terms and Conditions</Text>
      </Text>

      <Pressable style={styles.primaryBtn} onPress={() => router.push("/(tabs)")}>
        <Text style={styles.primaryBtnText}>Create Account</Text>
      </Pressable>

      <Pressable onPress={() => router.back()}>
        <Text style={styles.bottomLink}>
          Already have an account? <Text style={styles.bottomLinkStrong}>Login</Text>
        </Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff", paddingHorizontal: 24, paddingTop: 70 },
  title: { fontSize: 32, fontWeight: "800", textAlign: "center" },
  subtitle: { fontSize: 16, fontWeight: "700", textAlign: "center", marginTop: 10, marginBottom: 30 },

  label: { fontSize: 12, color: "#333", marginBottom: 6, marginTop: 10 },
  input: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },

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
  primaryBtnText: { color: "#fff", fontWeight: "700" },

  bottomLink: { marginTop: 18, textAlign: "center", color: "#444" },
  bottomLinkStrong: { fontWeight: "800", textDecorationLine: "underline" },
});
