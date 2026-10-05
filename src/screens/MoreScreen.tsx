import { Ionicons } from "@expo/vector-icons";
import { Pressable, ScrollView, StyleSheet, Text } from "react-native";
import { Eyebrow, H1, Screen } from "../components/ui";
import { colors, fonts, radius } from "../theme";

const ITEMS = [
  { to: "Book", label: "Book a viewing", icon: "calendar-outline" },
  { to: "Gallery", label: "Gallery", icon: "images-outline" },
  { to: "About", label: "About us", icon: "information-circle-outline" },
  { to: "Contact", label: "Contact", icon: "call-outline" },
] as const;

export default function MoreScreen({ navigation }: { navigation: any }) {
  return (
    <Screen>
      <ScrollView contentContainerStyle={{ padding: 16, gap: 10 }}>
        <Eyebrow gold>Ego Olisa Enterprises</Eyebrow>
        <H1 style={{ marginBottom: 8 }}>More</H1>
        {ITEMS.map((i) => (
          <Pressable key={i.to} onPress={() => navigation.navigate(i.to)} style={s.row}>
            <Ionicons name={i.icon} size={22} color={colors.gold} />
            <Text style={s.label}>{i.label}</Text>
            <Ionicons name="chevron-forward" size={18} color={colors.mute} />
          </Pressable>
        ))}
      </ScrollView>
    </Screen>
  );
}

const s = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "center", gap: 14, backgroundColor: colors.panel, borderRadius: radius.card, borderWidth: 1, borderColor: colors.line, padding: 18 },
  label: { flex: 1, fontFamily: fonts.semi, fontSize: 16, color: colors.bone },
});
