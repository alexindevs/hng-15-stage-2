import { useRoute } from "@react-navigation/native";
import { useCallback, useEffect, useMemo, useState } from "react";
import { FlatList, RefreshControl, ScrollView, StyleSheet, Text, View } from "react-native";
import { ProductCard } from "../components/ProductCard";
import { Eyebrow, H1, Input, Loading, Pill, Screen } from "../components/ui";
import { fetchProducts, type Product } from "../lib/products";
import { colors, fonts } from "../theme";

type Sort = "newest" | "price_asc" | "price_desc";

// Filters mirror the site's FilterBar: category, max price, minimum year, sort.
const PRICE_CAPS = [
  { label: "Any price", v: 0 },
  { label: "≤ ₦10M", v: 1_000_000_000 },
  { label: "≤ ₦30M", v: 3_000_000_000 },
  { label: "≤ ₦60M", v: 6_000_000_000 },
];

export default function ShopScreen({ navigation }: { navigation: any }) {
  const route = useRoute();
  const initialCat = (route.params as { category?: string } | undefined)?.category;
  const [items, setItems] = useState<Product[] | null>(null);
  const [cat, setCat] = useState(initialCat ?? "All");
  const [q, setQ] = useState("");
  const [cap, setCap] = useState(0);
  const [year, setYear] = useState("");
  const [sort, setSort] = useState<Sort>("newest");
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (initialCat) setCat(initialCat);
  }, [initialCat]);
  const load = useCallback(async (force = false) => setItems(await fetchProducts(force)), []);
  useEffect(() => {
    load();
  }, [load]);

  const cats = useMemo(() => ["All", ...Array.from(new Set((items ?? []).map((p) => p.category)))], [items]);
  const shown = useMemo(() => {
    const minYear = Number(year) || 0;
    const term = q.trim().toLowerCase();
    const list = (items ?? []).filter(
      (p) =>
        (cat === "All" || p.category === cat) &&
        (!cap || p.price_kobo <= cap) &&
        (!minYear || (p.year ?? 0) >= minYear) &&
        (!term || `${p.name} ${p.description}`.toLowerCase().includes(term)),
    );
    if (sort === "price_asc") return [...list].sort((a, b) => a.price_kobo - b.price_kobo);
    if (sort === "price_desc") return [...list].sort((a, b) => b.price_kobo - a.price_kobo);
    return list;
  }, [items, cat, cap, year, sort, q]);

  if (!items) return <Loading />;
  return (
    <Screen>
      <FlatList
        data={shown}
        keyExtractor={(p) => p.slug}
        contentContainerStyle={{ padding: 16, gap: 16 }}
        keyboardShouldPersistTaps="handled"
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            tintColor={colors.gold}
            onRefresh={async () => {
              setRefreshing(true);
              await load(true);
              setRefreshing(false);
            }}
          />
        }
        ListHeaderComponent={
          <View style={{ gap: 12, marginBottom: 4 }}>
            <View>
              <Eyebrow gold>Our stock</Eyebrow>
              <H1 style={{ marginTop: 4 }}>The showroom</H1>
            </View>
            <Input value={q} onChangeText={setQ} placeholder="Search vehicles" autoCorrect={false} />
            <Row>{cats.map((c) => <Pill key={c} label={c} on={c === cat} onPress={() => setCat(c)} />)}</Row>
            <Row>{PRICE_CAPS.map((p) => <Pill key={p.label} label={p.label} on={p.v === cap} onPress={() => setCap(p.v)} />)}</Row>
            <View style={{ flexDirection: "row", gap: 10, alignItems: "center" }}>
              <Text style={s.lbl}>Year from</Text>
              <Input value={year} onChangeText={setYear} placeholder="e.g. 2018" keyboardType="number-pad" maxLength={4} style={{ flex: 1 }} />
            </View>
            <Row>
              <Pill label="Newest" on={sort === "newest"} onPress={() => setSort("newest")} />
              <Pill label="Price: low to high" on={sort === "price_asc"} onPress={() => setSort("price_asc")} />
              <Pill label="Price: high to low" on={sort === "price_desc"} onPress={() => setSort("price_desc")} />
            </Row>
            <Text style={s.lbl}>{shown.length} vehicle{shown.length === 1 ? "" : "s"}</Text>
          </View>
        }
        ListEmptyComponent={<Text style={s.empty}>No vehicles match these filters.</Text>}
        renderItem={({ item }) => <ProductCard p={item} onPress={() => navigation.navigate("Product", { slug: item.slug })} />}
      />
    </Screen>
  );
}

const Row = ({ children }: { children: React.ReactNode }) => (
  <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }} keyboardShouldPersistTaps="handled">
    {children}
  </ScrollView>
);

const s = StyleSheet.create({
  lbl: { fontFamily: fonts.body, fontSize: 13, color: colors.mute },
  empty: { color: colors.mute, fontFamily: fonts.body, textAlign: "center", paddingVertical: 40 },
});
