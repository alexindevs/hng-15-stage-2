import { useRoute } from "@react-navigation/native";
import * as WebBrowser from "expo-web-browser";
import { useEffect, useState } from "react";
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, View } from "react-native";
import { Banner, Body, Button, Eyebrow, Field, H1, Loading, Pill, Screen } from "../components/ui";
import { useAuth } from "../context/AuthContext";
import { api, type Availability } from "../lib/api";
import { friendlyError } from "../lib/errors";
import { formatNaira } from "../lib/format";
import { colors, fonts } from "../theme";

type Fee = "pay_now" | "bank_transfer" | "at_viewing";

export default function BookScreen({ navigation }: { navigation: any }) {
  const initial = (useRoute().params as { slug?: string } | undefined)?.slug;
  const { session } = useAuth();
  const [av, setAv] = useState<Availability | null>(null);
  const [slug, setSlug] = useState(initial ?? "");
  const [day, setDay] = useState(0);
  const [slot, setSlot] = useState("");
  const [fee, setFee] = useState<Fee>("at_viewing");
  const [f, setF] = useState({ name: "", email: session?.user.email ?? "", phone: "", notes: "" });
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const set = (k: keyof typeof f) => (v: string) => setF((cur) => ({ ...cur, [k]: v }));

  useEffect(() => {
    api.availability().then((a) => {
      setAv(a);
      setSlug((cur) => (a.vehicles.some((v) => v.slug === cur) ? cur : a.vehicles[0]?.slug ?? ""));
      if (a.fee_kobo > 0 && a.paystack) setFee("pay_now");
    }).catch((e) => setErr(friendlyError(e, "We couldn't load viewing times. Please try again.")));
  }, []);

  async function submit() {
    setBusy(true);
    setErr("");
    try {
      const r = await api.book({ slug, slot, name: f.name, email: f.email, phone: f.phone, notes: f.notes || undefined, feeOption: fee });
      if (!r.ok) return setErr(r.error);
      if (r.redirectUrl) await WebBrowser.openBrowserAsync(r.redirectUrl);
      navigation.replace("Booking", { reference: r.reference });
    } catch (e) {
      setErr(friendlyError(e, "We couldn't book that viewing. Please try again."));
    } finally {
      setBusy(false);
    }
  }

  if (!av) return err ? <Screen style={{ padding: 24 }}><Banner text={err} /></Screen> : <Loading />;
  const days = av.days;
  const cur = days[day];
  return (
    <Screen>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <ScrollView contentContainerStyle={{ padding: 16, gap: 14 }} keyboardShouldPersistTaps="handled">
          <Eyebrow gold>Viewings by appointment</Eyebrow>
          <H1>Book a viewing</H1>
          <Body>See the vehicle in person before you decide. Choose a time and we will confirm your slot.</Body>

          <Text style={s.h}>1. Vehicle</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
            {av.vehicles.map((v) => <Pill key={v.slug} label={v.name} on={v.slug === slug} onPress={() => setSlug(v.slug)} />)}
          </ScrollView>

          <Text style={s.h}>2. Date and time (Lagos time)</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
            {days.map((d, i) => <Pill key={d.date} label={d.label} on={i === day} onPress={() => { setDay(i); setSlot(""); }} />)}
          </ScrollView>
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
            {cur?.slots.map((sl) => {
              const full = (av.booked[new Date(sl.iso).toISOString()] ?? 0) >= av.capacity;
              return <Pill key={sl.iso} label={full ? `${sl.label} (full)` : sl.label} on={slot === sl.iso} disabled={full} onPress={() => setSlot(sl.iso)} />;
            })}
          </View>

          <Text style={s.h}>3. Your details</Text>
          <Field label="Full name" value={f.name} onChangeText={set("name")} />
          <Field label="Email" value={f.email} onChangeText={set("email")} autoCapitalize="none" keyboardType="email-address" />
          <Field label="Phone" value={f.phone} onChangeText={set("phone")} keyboardType="phone-pad" />
          <Field label="Notes (optional)" value={f.notes} onChangeText={set("notes")} multiline />

          {av.fee_kobo > 0 && (
            <>
              <Text style={s.h}>4. Inspection fee: {formatNaira(av.fee_kobo)}</Text>
              <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
                {av.paystack && <Pill label="Pay now (card)" on={fee === "pay_now"} onPress={() => setFee("pay_now")} />}
                <Pill label="Bank transfer" on={fee === "bank_transfer"} onPress={() => setFee("bank_transfer")} />
                <Pill label="Pay at the viewing" on={fee === "at_viewing"} onPress={() => setFee("at_viewing")} />
              </View>
              <Text style={s.fine}>The inspection fee is non-refundable.</Text>
            </>
          )}
          {!!err && <Banner text={err} />}
          <Button title="Request viewing" onPress={submit} loading={busy} disabled={!slot || !slug} />
        </ScrollView>
      </KeyboardAvoidingView>
    </Screen>
  );
}

const s = StyleSheet.create({
  h: { fontFamily: fonts.display, fontSize: 19, color: colors.bone, marginTop: 8 },
  fine: { fontFamily: fonts.body, fontSize: 12, color: colors.mute },
});
