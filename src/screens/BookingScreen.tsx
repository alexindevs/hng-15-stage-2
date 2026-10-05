import { useFocusEffect, useRoute } from "@react-navigation/native";
import * as WebBrowser from "expo-web-browser";
import { useCallback, useState } from "react";
import { ScrollView, Text } from "react-native";
import { Banner, Body, Button, Card, Eyebrow, H1, KV, Loading, Screen, StatusPill } from "../components/ui";
import { api, type BookingDetail } from "../lib/api";
import { formatNaira, formatSlot } from "../lib/format";
import { colors, fonts } from "../theme";

const NOTE: Record<string, string> = {
  pending: "We are holding your slot while we confirm it. You will get an email as soon as it is approved.",
  confirmed: "Your viewing is confirmed. See you then.",
  declined: "We could not confirm this slot. Please book another time.",
  cancelled: "This booking was cancelled.",
  completed: "This viewing has taken place.",
};

export default function BookingScreen({ navigation }: { navigation: any }) {
  const { reference } = useRoute().params as { reference: string };
  const [d, setD] = useState<BookingDetail | null>(null);
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);

  useFocusEffect(
    useCallback(() => {
      api.booking(reference).then(setD).catch((e) => setErr(e.message));
    }, [reference]),
  );

  async function pay() {
    setBusy(true);
    setErr("");
    try {
      const r = await api.payBooking(reference);
      if (!r.ok) return setErr(r.error);
      if (r.redirectUrl) await WebBrowser.openBrowserAsync(r.redirectUrl);
      setD(await api.booking(reference));
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Could not start payment.");
    } finally {
      setBusy(false);
    }
  }

  if (!d) return err ? <Screen style={{ padding: 24 }}><Banner text={err} /></Screen> : <Loading />;
  const b = d.booking;
  const feeText =
    b.fee_kobo <= 0 ? "None"
    : `${formatNaira(b.fee_kobo)} · ${b.fee_status === "paid" ? "paid" : b.fee_option === "pay_now" ? "awaiting payment" : b.fee_option === "bank_transfer" ? "awaiting bank transfer" : "payable at viewing"}`;
  return (
    <Screen>
      <ScrollView contentContainerStyle={{ padding: 16, gap: 14 }}>
        <Eyebrow gold>Viewing request</Eyebrow>
        <H1>Thanks, {b.customer_name.split(" ")[0]}.</H1>
        <StatusPill status={b.status} />
        <Body>{NOTE[b.status] ?? NOTE.pending}{b.email_sent_at ? ` A confirmation was emailed to ${b.customer_email}.` : ""}</Body>
        <Card>
          <KV k="Reference" v={b.reference} />
          <KV k="Vehicle" v={b.product_name} />
          <KV k="When" v={`${formatSlot(b.slot_start)} (Lagos time)`} />
          <KV k="Where" v={d.address} />
          <KV k="Inspection fee" v={feeText} />
        </Card>
        {d.bank && (
          <Card style={{ borderColor: "rgba(212,175,55,0.4)" }}>
            <Eyebrow gold>Pay by bank transfer</Eyebrow>
            <KV k="Bank" v={d.bank.bank} />
            <KV k="Account name" v={d.bank.name} />
            <KV k="Account number" v={d.bank.number} />
            <KV k="Amount" v={formatNaira(b.fee_kobo)} />
            <KV k="Payment reference" v={b.reference} />
          </Card>
        )}
        {b.fee_kobo > 0 && <Text style={{ fontFamily: fonts.body, fontSize: 12, color: colors.mute }}>{d.fee_policy}</Text>}
        {!!err && <Banner text={err} />}
        {d.can_pay_online && <Button title={`Pay ${formatNaira(b.fee_kobo)} online`} onPress={pay} loading={busy} />}
        <Button title="Keep browsing" variant="ghost" onPress={() => navigation.navigate("Tabs", { screen: "Shop" })} />
      </ScrollView>
    </Screen>
  );
}
