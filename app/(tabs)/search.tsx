import { View, Text, StyleSheet, TextInput, Pressable } from "react-native";
import { router } from "expo-router";

const BROWSE_ITEMS = [
  { label: "Genre", route: "/category" },
  { label: "Author", route: "/author" },
  { label: "Most Popular", route: "/trending" },
  { label: "Trending", route: "/trending" },
  { label: "Language", route: "/language" },
  { label: "Release Date", route: "/release" },
  { label: "Featured Lists", route: "/lists" },
];

export default function SearchScreen() {
  return (
    <View style={styles.container}>
      {/* Header */}
      <Text style={styles.header}>Search</Text>

      {/* Search bar */}
      <View style={styles.searchBox}>
        <Text style={styles.searchIcon}>🔍</Text>
        <TextInput
          style={styles.searchInput}
        />
      </View>

      {/* Browse by */}
      <Text style={styles.sectionTitle}>Browse by</Text>

      {BROWSE_ITEMS.map((item) => (
        <Pressable
          key={item.label}
          style={styles.row}
          onPress={() => router.push(item.route)}
        >
          <Text style={styles.rowText}>{item.label}</Text>
          <Text style={styles.arrow}>›</Text>
        </Pressable>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    paddingHorizontal: 16,
    paddingTop: 14,
  },

  header: {
    fontSize: 22,
    fontWeight: "800",
    marginBottom: 12,
  },

  searchBox: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 10,
    paddingHorizontal: 10,
    height: 40,
    marginBottom: 20,
  },
  searchIcon: { marginRight: 6 },
  searchInput: { flex: 1 },

  sectionTitle: {
    fontSize: 14,
    fontWeight: "700",
    marginBottom: 10,
  },

  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  rowText: { fontSize: 14 },
  arrow: { fontSize: 18, color: "#999" },
});
