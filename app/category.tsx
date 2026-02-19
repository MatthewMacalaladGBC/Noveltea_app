import { View, Text } from "react-native";
import { useLocalSearchParams } from "expo-router";

export default function CategoryScreen() {
  const { name } = useLocalSearchParams();
  return (
    <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
      <Text style={{ fontSize: 18, fontWeight: "700" }}>Category: {String(name)}</Text>
    </View>
  );
}
