import { Image } from "expo-image";
import { useRoute } from "@react-navigation/native";
import { useEffect, useState } from "react";
import { FlatList, ScrollView, StyleSheet, Text, useWindowDimensions, View } from "react-native";
import { ProductCard } from "../components/ProductCard";
import { Body, Button, Eyebrow, H2, Loading, Screen } from "../components/ui";
import { useCart } from "../context/CartContext";
import { api, type Config } from "../lib/api";
import { assetUrl, cleanDescription, formatKm, formatNaira } from "../lib/format";
import type { Product } from "../lib/products";
import { colors, fonts, radius } from "../theme";

export default function ProductScreen({ navigation }: { navigation: any }) {
  const { slug } = useRoute().params as { slug: string };
  const { add, lines } = useCart();
  const { width } = useWindowDimensions();
  const [p, setP] = useState<Product | null | undefined>(undefined);
  const [photos, setPhotos] = useState<string[]>([]);
  const [related, setRelated] = useState<Product[]>([]);
  const [cfg, setCfg] = useState<Config | null>(null);
  const [added, setAdded] = useState(false);

  useEffect(() => {
    setP(undefined);
    api.product(slug)
      .then((r) => {
        setP(r.product);
        setRelated(r.related);
        setPhotos(r.media.filter((m) => m.kind === "image").map((m) => assetUrl(m.url)!).filter(Boolean));
      })
      .catch(() => setP(null));
    api.config().then(setCfg).catch(() => {});
  }, [slug]);

  if (p === undefined) return <Loading />;
  if (p === null) {
    return (
      <Screen style={{ justifyContent: "center", padding: 24 }}>
        <H2>Vehicle not found</H2>
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
            keyExtractor={(u, i) => `${i}${u}`}
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
          <Body>{cleanDescription(p.description)}</Body>
          <Text style={{ fontFamily: fonts.body, fontSize: 14, color: available ? colors.ok : colors.danger }}>
            {available ? `● ${p.stock === 1 ? "1 available" : `${p.stock} available`}` : "● Sold"}
          </Text>
          <View style={{ gap: 10 }}>
            {available && <Button title="Book a viewing" onPress={() => navigation.navigate("Book", { slug: p.slug })} />}
            <Button
              variant="ghost"
              title={!available ? "Sold out" : added ? "Added ✓" : inCart ? `Add to cart (${inCart} in cart)` : "Add to cart"}
              disabled={!available}
              onPress={() => {
                add({ slug: p.slug, name: p.name, price_kobo: p.price_kobo, category: p.category, max: p.stock, image: p.image_url });
                setAdded(true);
                setTimeout(() => setAdded(false), 1200);
              }}
            />
            {inCart > 0 && <Button title="Go to cart" variant="ghost" onPress={() => navigation.navigate("Tabs", { screen: "Cart" })} />}
          </View>
          {cfg && (
            <Text style={s.fine}>
              Viewings carry a {formatNaira(cfg.inspection_fee_kobo)} inspection fee. {cfg.fee_policy} Prefer to buy now? Add it to your cart and check out.
            </Text>
          )}
          {related.length > 0 && (
            <View style={{ gap: 14, marginTop: 14 }}>
              <H2>More {p.category.toLowerCase()}</H2>
              {related.map((r) => <ProductCard key={r.slug} p={r} onPress={() => navigation.push("Product", { slug: r.slug })} />)}
            </View>
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
  fine: { fontFamily: fonts.body, fontSize: 12, color: colors.mute, lineHeight: 18 },
});
