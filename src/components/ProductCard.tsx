import { Image } from "expo-image";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { formatKm, formatNaira, assetUrl } from "../lib/format";
import type { Product } from "../lib/products";
import { colors, fonts, radius } from "../theme";
import { Eyebrow } from "./ui";

export function ProductCard({ p, onPress }: { p: Product; onPress: () => void }) {
  const meta = [p.year, p.mileage_km != null ? formatKm(p.mileage_km) : null, p.condition].filter(Boolean).join(" · ");
  const cutout = assetUrl(p.cutout_url);
  const photo = assetUrl(p.image_url);
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [s.card, pressed && { borderColor: colors.gold }]}>
      <View style={s.media}>
        {cutout ? (
          <Image source={cutout} contentFit="contain" style={s.cutout} />
        ) : photo ? (
          <Image source={photo} contentFit="cover" style={StyleSheet.absoluteFill} />
        ) : null}
        {p.stock <= 0 && (
          <View style={s.sold}>
            <Text style={s.soldText}>Sold</Text>
          </View>
        )}
      </View>
      <View style={s.body}>
        <Eyebrow>{p.category}</Eyebrow>
        <Text style={s.title}>{p.name}</Text>
        {!!meta && <Text style={s.meta}>{meta}</Text>}
        <View style={s.row}>
          <Text style={s.price}>{formatNaira(p.price_kobo)}</Text>
          <Text style={s.view}>View →</Text>
        </View>
      </View>
    </Pressable>
  );
}

const s = StyleSheet.create({
  card: { backgroundColor: colors.panel, borderRadius: radius.card, borderWidth: 1, borderColor: colors.line, overflow: "hidden" },
  media: { aspectRatio: 4 / 3, backgroundColor: "#1d1a10" },
  cutout: { position: "absolute", left: "8%", right: "8%", bottom: "8%", top: "10%" },
  sold: { position: "absolute", left: 12, top: 12, backgroundColor: "rgba(0,0,0,0.7)", borderRadius: radius.pill, paddingHorizontal: 12, paddingVertical: 4 },
  soldText: { color: colors.bone, fontFamily: fonts.body, fontSize: 12 },
  body: { padding: 18, gap: 6 },
  title: { fontFamily: fonts.display, fontSize: 20, color: colors.bone, letterSpacing: -0.3 },
  meta: { fontFamily: fonts.body, fontSize: 13.5, color: colors.mute },
  row: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingTop: 10 },
  price: { fontFamily: fonts.semi, fontSize: 16, color: colors.gold },
  view: { fontFamily: fonts.body, fontSize: 13.5, color: "rgba(244,241,234,0.7)" },
});
