import { useFocusEffect, useRoute } from "@react-navigation/native";
import * as WebBrowser from "expo-web-browser";
import { useCallback, useState } from "react";
import { ScrollView, Text, View } from "react-native";
import { Banner, Body, Button, Card, Eyebrow, H1, KV, Loading, Screen, StatusPill } from "../components/ui";
import { api, type OrderDetail } from "../lib/api";
import { friendlyError } from "../lib/errors";
import { formatNaira } from "../lib/format";
import { colors, fonts } from "../theme";

export default function OrderScreen({ navigation }: { navigation: any }) {
  const { reference } = useRoute().params as { reference: string };
  const [d, setD] = useState<OrderDetail | null>(null);
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);

  // Reloads every time the screen is focused, so returning from Paystack re-verifies the payment server-side.
  useFocusEffect(
    useCallback(() => {
      api.order(reference).then(setD).catch((e) => setErr(friendlyError(e, "We couldn't load this order. Please try again.")));
    }, [reference]),
  );

  async function payNow() {
    setBusy(true);
    setErr("");
    try {
      const r = await api.payOrder(reference);
      if (!r.ok) return setErr(r.error);
      if (r.redirectUrl) await WebBrowser.openBrowserAsync(r.redirectUrl);
      setD(await api.order(reference));
    } catch (e) {
      setErr(friendlyError(e, "We couldn't start the payment. Please try again."));
    } finally {
      setBusy(false);
    }
  }

  if (!d) return err ? <Screen style={{ padding: 24 }}><Banner text={err} /></Screen> : <Loading />;
  const o = d.order;
  const paid = o.payment_status === "paid";
  return (
    <Screen>
      <ScrollView contentContainerStyle={{ padding: 16, gap: 14 }}>
        <Eyebrow gold>{d.awaiting_card ? "Awaiting payment" : "Order received"}</Eyebrow>
        <H1>{d.awaiting_card ? "Payment pending" : `Thank you, ${o.customer_name.split(" ")[0]}.`}</H1>
        <Body>
          Order <Text style={{ color: colors.gold, fontFamily: fonts.semi }}>{o.reference}</Text>{" "}
          {d.awaiting_card ? "is waiting for payment." : o.status === "cancelled" ? "was cancelled." : paid ? "is paid and confirmed." : "has been received."}
          {o.email_sent_at ? ` A confirmation email has been sent to ${o.customer_email}.` : ""}
        </Body>
        <View style={{ flexDirection: "row", gap: 8 }}>
          <StatusPill status={o.status} />
          <StatusPill status={o.payment_status} />
        </View>
        <Card>
          {o.order_items.map((i, n) => <KV key={n} k={`${i.name} × ${i.quantity}`} v={formatNaira(i.unit_price_kobo * i.quantity)} />)}
          <KV k="Total" v={formatNaira(o.total_kobo)} />
          <KV k="Deliver to" v={`${o.shipping_address}, ${o.city}, ${o.state}`} />
        </Card>
        {d.bank && !paid && (
          <Card style={{ borderColor: "rgba(212,175,55,0.4)" }}>
            <Eyebrow gold>Pay by bank transfer</Eyebrow>
            <KV k="Bank" v={d.bank.bank} />
            <KV k="Account name" v={d.bank.name} />
            <KV k="Account number" v={d.bank.number} />
            <KV k="Amount" v={formatNaira(o.total_kobo)} />
            <KV k="Payment reference" v={o.reference} />
          </Card>
        )}
        {!!err && <Banner text={err} />}
        {d.awaiting_card && <Button title="Pay now" onPress={payNow} loading={busy} />}
        <Button title="Continue browsing" variant="ghost" onPress={() => navigation.navigate("Tabs", { screen: "Shop" })} />
      </ScrollView>
    </Screen>
  );
}
