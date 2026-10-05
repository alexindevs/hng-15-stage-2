import { useCallback, useEffect, useMemo, useState } from "react";
import { ActivityIndicator, FlatList, Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from "react-native";
import { ProductCard } from "../components/ProductCard";
import { Eyebrow, Screen } from "../components/ui";
import { fetchProducts, type Product } from "../lib/products";
import { colors, fonts, radius } from "../theme";

export default function ShopScreen({ navigation }: { navigation: any }) {
  const [items, setItems] = useState<Product[] | null>(null);
  const [cat, setCat] = useState("All");
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => setItems(await fetchProducts()), []);
  useEffect(() => {
    load();
  }, [load]);

  const cats = useMemo(() => ["All", ...Array.from(new Set((items ?? []).map((p) => p.category)))], [items]);
  const shown = useMemo(() => (items ?? []).filter((p) => cat === "All" || p.category === cat), [items, cat]);

  if (!items) {
    return (
      <Screen style={{ justifyContent: "center" }}>
        <ActivityIndicator color={colors.gold} />
      </Screen>
    );
  }
  return (
    <Screen>
      <FlatList
        data={shown}
        keyExtractor={(p) => p.slug}
        contentContainerStyle={{ padding: 16, gap: 16 }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            tintColor={colors.gold}
            onRefresh={async () => {
              setRefreshing(true);
              await load();
              setRefreshing(false);
            }}
          />
        }
        ListHeaderComponent={
          <View style={{ gap: 12, marginBottom: 4 }}>
            <View>
              <Eyebrow gold>Showroom</Eyebrow>
              <Text style={s.h1}>The showroom</Text>
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
              {cats.map((c) => (
                <Pressable key={c} onPress={() => setCat(c)} style={[s.pill, c === cat && s.pillOn]}>
                  <Text style={[s.pillText, c === cat && { color: "#0a0a0a" }]}>{c}</Text>
                </Pressable>
              ))}
            </ScrollView>
          </View>
        }
        ListEmptyComponent={<Text style={s.empty}>No vehicles in this category.</Text>}
        renderItem={({ item }) => <ProductCard p={item} onPress={() => navigation.navigate("Product", { slug: item.slug })} />}
      />
    </Screen>
  );
}

const s = StyleSheet.create({
  h1: { fontFamily: fonts.display, fontSize: 32, color: colors.bone, letterSpacing: -0.5, marginTop: 4 },
  pill: { borderWidth: 1, borderColor: "rgba(244,241,234,0.28)", borderRadius: radius.pill, paddingHorizontal: 16, paddingVertical: 8 },
  pillOn: { backgroundColor: colors.gold, borderColor: colors.gold },
  pillText: { fontFamily: fonts.semi, fontSize: 13.5, color: colors.bone },
  empty: { color: colors.mute, fontFamily: fonts.body, textAlign: "center", paddingVertical: 40 },
});
