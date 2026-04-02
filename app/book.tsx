import { useLocalSearchParams } from "expo-router";
import { Text, View } from "react-native";

export default function BookScreen() {
  const { id } = useLocalSearchParams();
  return (
    <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
      <Text style={{ fontSize: 18, fontWeight: "700" }}>Book Details: {String(id)}</Text>
    </View>
  );
}
