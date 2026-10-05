import { Image } from "expo-image";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { Body, Button, Eyebrow, H1, H2, Screen } from "../components/ui";
import { assetUrl } from "../lib/format";
import { colors, fonts, radius } from "../theme";

// Copy mirrors hng-15-stage-1/src/app/(site)/about/page.tsx.
const VALUES = [
  { t: "Clear pricing", d: "The price, year, mileage and condition sit on every listing. What you see is what we quote." },
  { t: "Look before you leap", d: "Every vehicle can be viewed in person. Book a slot, bring a mechanic if you like, take your time." },
  { t: "Flexible payment", d: "Pay online, by transfer, or when you collect. We keep the paperwork straightforward." },
];

export default function AboutScreen({ navigation }: { navigation: any }) {
  return (
    <Screen>
      <ScrollView>
        <View style={{ padding: 16, gap: 14 }}>
          <Eyebrow>About us</Eyebrow>
          <H1 style={{ fontSize: 36 }}>Vehicles sold the straightforward way.</H1>
          <Body>
            Ego Olisa Enterprises sells cars, SUVs, pickups, motorcycles and bicycles in Lagos. We list what we have, show you the price, and let you see it in person before you spend a naira.
          </Body>
          <View style={{ flexDirection: "row", gap: 10 }}>
            <Button title="Browse vehicles" onPress={() => navigation.navigate("Tabs", { screen: "Shop" })} style={{ flex: 1 }} />
            <Button title="Contact us" variant="ghost" onPress={() => navigation.navigate("Contact")} style={{ flex: 1 }} />
          </View>
          <Image source={assetUrl("/vehicles/suv-white-fortuner.jpg")} contentFit="cover" style={s.img} />
        </View>
        <View style={s.band}>
          {VALUES.map((v, i) => (
            <View key={v.t} style={s.card}>
              <Text style={{ fontFamily: fonts.display, color: colors.gold }}>0{i + 1}</Text>
              <Text style={s.cardT}>{v.t}</Text>
              <Body style={{ fontSize: 14, lineHeight: 21 }}>{v.d}</Body>
            </View>
          ))}
        </View>
        <View style={{ padding: 28, alignItems: "center", gap: 10 }}>
          <H2 style={{ textAlign: "center", fontSize: 30 }}>Come and see for yourself.</H2>
          <Body style={{ textAlign: "center" }}>Choose a vehicle, pick a time, and we will have it ready.</Body>
          <Button title="Book a viewing" onPress={() => navigation.navigate("Book")} style={{ marginTop: 8 }} />
        </View>
      </ScrollView>
    </Screen>
  );
}

const s = StyleSheet.create({
  img: { width: "100%", aspectRatio: 4 / 5, borderRadius: radius.panel, borderWidth: 1, borderColor: colors.line, marginTop: 8 },
  band: { backgroundColor: colors.coal, borderTopWidth: 1, borderBottomWidth: 1, borderColor: colors.line, padding: 16, gap: 12, paddingVertical: 32 },
  card: { backgroundColor: colors.ink, borderRadius: radius.card, borderWidth: 1, borderColor: colors.line, padding: 20, gap: 8 },
  cardT: { fontFamily: fonts.display, fontSize: 22, color: colors.bone },
});
