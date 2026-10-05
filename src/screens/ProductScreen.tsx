import { Image } from "expo-image";
import { useRoute } from "@react-navigation/native";
import * as WebBrowser from "expo-web-browser";
import { useEffect, useState } from "react";
import { ActivityIndicator, FlatList, ScrollView, StyleSheet, Text, useWindowDimensions, View } from "react-native";
import { Button, Eyebrow, Screen } from "../components/ui";
import { SITE_URL } from "../config";
import { useCart } from "../context/CartContext";
import { assetUrl, formatKm, formatNaira } from "../lib/format";
import { fetchMedia, fetchProducts, type Product } from "../lib/products";
import { colors, fonts, radius } from "../theme";

export default function ProductScreen() {
  const { slug } = useRoute().params as { slug: string };
  const { add, lines } = useCart();
  const { width } = useWindowDimensions();
  const [p, setP] = useState<Product | null | undefined>(undefined);
  const [photos, setPhotos] = useState<string[]>([]);
  const [added, setAdded] = useState(false);

  useEffect(() => {
    (async () => {
      const found = (await fetchProducts()).find((x) => x.slug === slug) ?? null;
      setP(found);
      if (found) {
        const main = assetUrl(found.image_url);
        const extra = (await fetchMedia(found)).map((u) => assetUrl(u)!);
        const cut = assetUrl(found.cutout_url);
        setPhotos([main, ...extra, cut].filter((u): u is string => !!u));
      }
    })();
  }, [slug]);

  if (p === undefined) {
    return (
      <Screen style={{ justifyContent: "center" }}>
        <ActivityIndicator color={colors.gold} />
      </Screen>
    );
  }
  if (p === null) {
    return (
      <Screen style={{ justifyContent: "center", padding: 24 }}>
        <Text style={s.title}>Vehicle not found</Text>
      </Screen>
    );
  }

  const inCart = lines.find((l) => l.slug === p.slug)?.quantity ?? 0;
  const available = p.stock > 0;
  const specs: [string, string][] = [
    ["Year", p.year ? String(p.year) : "n/a"],
    ["Mileage", p.mileage_km != null ? formatKm(p.mileage_km) : "n/a"],
    ["Condition", p.condition ?? "n/a"],
    ["Category", p.category],
  ];

  return (
    <Screen>
      <ScrollView>
        {photos.length > 0 && (
          <FlatList
            data={photos}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            keyExtractor={(u) => u}
            renderItem={({ item }) => <Image source={item} contentFit="cover" style={{ width, height: (width * 3) / 4, backgroundColor: "#1d1a10" }} />}
          />
        )}
        <View style={{ padding: 20, gap: 18 }}>
          <View>
            <Eyebrow gold>{p.category}</Eyebrow>
            <Text style={s.title}>{p.name}</Text>
            <Text style={s.price}>{formatNaira(p.price_kobo)}</Text>
          </View>
          <View style={s.specs}>
            {specs.map(([k, v]) => (
              <View key={k} style={s.spec}>
                <Eyebrow>{k}</Eyebrow>
                <Text style={s.specVal}>{v}</Text>
              </View>
            ))}
          </View>
          <Text style={s.desc}>{p.description}</Text>
          <Text style={{ fontFamily: fonts.body, fontSize: 14, color: available ? colors.ok : colors.danger }}>
            {available ? `● ${p.stock === 1 ? "1 available" : `${p.stock} available`}` : "● Sold"}
          </Text>
          <Button
            title={!available ? "Sold out" : added ? "Added ✓" : inCart ? `Add to cart (${inCart} in cart)` : "Add to cart"}
            disabled={!available}
            onPress={() => {
              add({ slug: p.slug, name: p.name, price_kobo: p.price_kobo, category: p.category, max: p.stock, image: p.image_url });
              setAdded(true);
              setTimeout(() => setAdded(false), 1200);
            }}
          />
          {available && (
            <Button title="Book a viewing" variant="ghost" onPress={() => WebBrowser.openBrowserAsync(`${SITE_URL}/book?vehicle=${p.slug}`)} />
          )}
        </View>
      </ScrollView>
    </Screen>
  );
}

const s = StyleSheet.create({
  title: { fontFamily: fonts.display, fontSize: 30, color: colors.bone, letterSpacing: -0.5, marginTop: 6 },
  price: { fontFamily: fonts.semi, fontSize: 24, color: colors.gold, marginTop: 8 },
  specs: { flexDirection: "row", flexWrap: "wrap", gap: 1, backgroundColor: colors.line, borderRadius: radius.card, overflow: "hidden", borderWidth: 1, borderColor: colors.line },
  spec: { backgroundColor: colors.panel, padding: 14, width: "49.8%", gap: 6 },
  specVal: { fontFamily: fonts.body, fontSize: 15, color: colors.bone },
  desc: { fontFamily: fonts.body, fontSize: 15, lineHeight: 23, color: colors.mute },
});
