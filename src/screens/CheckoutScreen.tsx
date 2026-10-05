import * as WebBrowser from "expo-web-browser";
import { useEffect, useState } from "react";
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, View } from "react-native";
import { Banner, Button, Card, Eyebrow, Field, H1, Pill, Screen } from "../components/ui";
import { useAuth } from "../context/AuthContext";
import { useCart } from "../context/CartContext";
import { api } from "../lib/api";
import { formatNaira } from "../lib/format";
import { colors, fonts } from "../theme";

type Method = "paystack" | "bank_transfer" | "pay_on_delivery";

export default function CheckoutScreen({ navigation }: { navigation: any }) {
  const { lines, totalKobo, clear } = useCart();
  const { session } = useAuth();
  const [f, setF] = useState({ name: "", email: session?.user.email ?? "", phone: "", address: "", city: "", state: "", notes: "" });
  const [method, setMethod] = useState<Method>("pay_on_delivery");
  const [paystack, setPaystack] = useState(false);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const set = (k: keyof typeof f) => (v: string) => setF((cur) => ({ ...cur, [k]: v }));

  useEffect(() => {
    api.config().then((c) => {
      setPaystack(c.paystack);
      if (c.paystack) setMethod("paystack");
    }).catch(() => {});
  }, []);

  async function submit() {
    setBusy(true);
    setErr("");
    try {
      const r = await api.checkout({
        name: f.name, email: f.email, phone: f.phone, address: f.address, city: f.city, state: f.state,
        notes: f.notes || undefined,
        paymentMethod: method,
        items: lines.map((l) => ({ slug: l.slug, quantity: l.quantity })),
      });
      if (!r.ok) return setErr(r.error);
      clear();
      if (r.redirectUrl) await WebBrowser.openBrowserAsync(r.redirectUrl); // Paystack hosted checkout
      navigation.replace("Order", { reference: r.reference });
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Could not place the order.");
    } finally {
      setBusy(false);
    }
  }

  if (!lines.length) {
    return (
      <Screen style={{ justifyContent: "center", padding: 24, gap: 12 }}>
        <H1>Your cart is empty</H1>
        <Button title="Browse vehicles" onPress={() => navigation.navigate("Tabs", { screen: "Shop" })} />
      </Screen>
    );
  }
  return (
    <Screen>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <ScrollView contentContainerStyle={{ padding: 16, gap: 14 }} keyboardShouldPersistTaps="handled">
          <Eyebrow gold>Checkout</Eyebrow>
          <H1>Your details</H1>
          <Field label="Full name" value={f.name} onChangeText={set("name")} textContentType="name" />
          <Field label="Email" value={f.email} onChangeText={set("email")} autoCapitalize="none" keyboardType="email-address" textContentType="emailAddress" />
          <Field label="Phone" value={f.phone} onChangeText={set("phone")} keyboardType="phone-pad" textContentType="telephoneNumber" />
          <Field label="Address" value={f.address} onChangeText={set("address")} textContentType="fullStreetAddress" />
          <View style={{ flexDirection: "row", gap: 10 }}>
            <View style={{ flex: 1 }}><Field label="City" value={f.city} onChangeText={set("city")} /></View>
            <View style={{ flex: 1 }}><Field label="State" value={f.state} onChangeText={set("state")} /></View>
          </View>
          <Field label="Notes (optional)" value={f.notes} onChangeText={set("notes")} multiline />

          <Text style={s.h}>Payment</Text>
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
            {paystack && <Pill label="Card (Paystack)" on={method === "paystack"} onPress={() => setMethod("paystack")} />}
            <Pill label="Bank transfer" on={method === "bank_transfer"} onPress={() => setMethod("bank_transfer")} />
            <Pill label="Pay on delivery" on={method === "pay_on_delivery"} onPress={() => setMethod("pay_on_delivery")} />
          </View>

          <Card style={{ gap: 8 }}>
            {lines.map((l) => (
              <View key={l.slug} style={s.row}>
                <Text style={s.mute}>{l.name} × {l.quantity}</Text>
                <Text style={s.val}>{formatNaira(l.price_kobo * l.quantity)}</Text>
              </View>
            ))}
            <View style={[s.row, { borderTopWidth: 1, borderTopColor: colors.line, paddingTop: 10 }]}>
              <Text style={s.total}>Total</Text>
              <Text style={[s.total, { color: colors.gold }]}>{formatNaira(totalKobo)}</Text>
            </View>
          </Card>
          {!!err && <Banner text={err} />}
          <Button title={method === "paystack" ? "Pay now" : "Place order"} onPress={submit} loading={busy} />
        </ScrollView>
      </KeyboardAvoidingView>
    </Screen>
  );
}

const s = StyleSheet.create({
  h: { fontFamily: fonts.display, fontSize: 20, color: colors.bone, marginTop: 6 },
  row: { flexDirection: "row", justifyContent: "space-between", gap: 12 },
  mute: { fontFamily: fonts.body, color: colors.mute, flex: 1 },
  val: { fontFamily: fonts.body, color: colors.bone },
  total: { fontFamily: fonts.semi, fontSize: 17, color: colors.bone },
});
