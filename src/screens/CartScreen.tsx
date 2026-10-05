import { Image } from "expo-image";
import { FlatList, Pressable, StyleSheet, Text, View } from "react-native";
import { Button, Eyebrow, Screen } from "../components/ui";
import { useCart, type CartLine } from "../context/CartContext";
import { assetUrl, formatNaira } from "../lib/format";
import { colors, fonts, radius } from "../theme";

export default function CartScreen({ navigation }: { navigation: any }) {
  const { lines, totalKobo, ready, sync, syncError } = useCart();
  if (!ready) return <Screen />;

  if (!lines.length) {
    return (
      <Screen style={s.emptyWrap}>
        <View style={s.empty}>
          <Text style={s.h1}>Your cart is empty</Text>
          <Text style={s.mute}>Browse the showroom and add a vehicle.</Text>
          <Button title="Browse vehicles" onPress={() => navigation.navigate("Shop")} style={{ marginTop: 20 }} />
        </View>
      </Screen>
    );
  }

  return (
    <Screen>
      <FlatList
        data={lines}
        keyExtractor={(l) => l.slug}
        contentContainerStyle={{ padding: 16, gap: 12 }}
        ListHeaderComponent={
          <View style={{ marginBottom: 4, gap: 6 }}>
            <Text style={s.h1}>Your cart</Text>
            <Text style={[s.mute, { textAlign: "center" }, sync === "error" && { color: colors.danger }]}>
              {sync === "synced" ? "Saved to your account" : sync === "syncing" ? "Syncing…" : sync === "error" ? `Saved on this device. Sync failed: ${syncError}` : "Saved on this device. Sign in to keep it on your account."}
            </Text>
          </View>
        }
        renderItem={({ item }) => <Line l={item} onOpen={() => navigation.navigate("Product", { slug: item.slug })} />}
        ListFooterComponent={
          <View style={s.summary}>
            <Text style={s.h2}>Summary</Text>
            <View style={s.totalRow}>
              <Text style={s.totalLabel}>Total</Text>
              <Text style={s.total}>{formatNaira(totalKobo)}</Text>
            </View>
            <Button title="Checkout" onPress={() => navigation.navigate("Checkout")} style={{ marginTop: 18 }} />
            <Button title="Keep browsing" variant="ghost" onPress={() => navigation.navigate("Shop")} style={{ marginTop: 12 }} />
          </View>
        }
      />
    </Screen>
  );
}

function Line({ l, onOpen }: { l: CartLine; onOpen: () => void }) {
  const { setQty, remove } = useCart();
  const img = assetUrl(l.image);
  return (
    <View style={s.line}>
      <Pressable onPress={onOpen} style={s.top}>
        {img ? <Image source={img} contentFit="cover" style={s.thumb} /> : <View style={s.thumb} />}
        <View style={{ flex: 1, gap: 3 }}>
          <Eyebrow>{l.category}</Eyebrow>
          <Text style={s.name}>{l.name}</Text>
          <Text style={s.mute}>{formatNaira(l.price_kobo)} each</Text>
        </View>
      </Pressable>
      <View style={s.controls}>
        <View style={s.stepper}>
          <Pressable accessibilityLabel="Decrease quantity" style={s.stepBtn} onPress={() => setQty(l.slug, l.quantity - 1)}>
            <Text style={s.stepText}>−</Text>
          </Pressable>
          <Text style={s.qty}>{l.quantity}</Text>
          <Pressable
            accessibilityLabel="Increase quantity"
            style={[s.stepBtn, l.quantity >= l.max && { opacity: 0.4 }]}
            disabled={l.quantity >= l.max}
            onPress={() => setQty(l.slug, l.quantity + 1)}
          >
            <Text style={s.stepText}>+</Text>
          </Pressable>
        </View>
        <Text style={s.lineTotal}>{formatNaira(l.price_kobo * l.quantity)}</Text>
        <Pressable onPress={() => remove(l.slug)} hitSlop={8}>
          <Text style={s.remove}>Remove</Text>
        </Pressable>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  emptyWrap: { justifyContent: "center", padding: 20 },
  empty: { borderWidth: 1, borderStyle: "dashed", borderColor: colors.line, borderRadius: radius.panel, padding: 32, alignItems: "center" },
  h1: { fontFamily: fonts.display, fontSize: 30, color: colors.bone, letterSpacing: -0.4, textAlign: "center" },
  h2: { fontFamily: fonts.display, fontSize: 20, color: colors.bone },
  mute: { fontFamily: fonts.body, fontSize: 13.5, color: colors.mute, marginTop: 4 },
  line: { backgroundColor: colors.panel, borderRadius: radius.card, borderWidth: 1, borderColor: colors.line, padding: 14, gap: 14 },
  top: { flexDirection: "row", gap: 12, alignItems: "center" },
  thumb: { width: 72, height: 56, borderRadius: 8, backgroundColor: "#1d1a10" },
  name: { fontFamily: fonts.display, fontSize: 18, color: colors.bone },
  controls: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  stepper: { flexDirection: "row", alignItems: "center", gap: 10 },
  stepBtn: { width: 36, height: 36, borderRadius: 18, borderWidth: 1, borderColor: "rgba(244,241,234,0.28)", alignItems: "center", justifyContent: "center" },
  stepText: { color: colors.bone, fontSize: 18, fontFamily: fonts.body },
  qty: { color: colors.bone, fontFamily: fonts.semi, fontSize: 16, minWidth: 22, textAlign: "center" },
  lineTotal: { fontFamily: fonts.semi, fontSize: 16, color: colors.gold },
  remove: { fontFamily: fonts.body, fontSize: 13.5, color: colors.mute },
  summary: { backgroundColor: colors.panel, borderRadius: radius.card, borderWidth: 1, borderColor: colors.line, padding: 20, marginTop: 4 },
  totalRow: { flexDirection: "row", justifyContent: "space-between", borderTopWidth: 1, borderTopColor: colors.line, marginTop: 14, paddingTop: 14 },
  totalLabel: { fontFamily: fonts.body, fontSize: 18, color: colors.bone },
  total: { fontFamily: fonts.semi, fontSize: 18, color: colors.gold },
  note: { fontFamily: fonts.body, fontSize: 12, color: colors.mute, marginTop: 10, textAlign: "center" },
});
