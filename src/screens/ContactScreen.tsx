import { useEffect, useState } from "react";
import { KeyboardAvoidingView, Linking, Platform, Pressable, ScrollView, Text, View } from "react-native";
import { Banner, Body, Button, Card, Eyebrow, Field, H1, KV, Screen } from "../components/ui";
import { api, type Config } from "../lib/api";
import { friendlyError } from "../lib/errors";
import { colors, fonts } from "../theme";

export default function ContactScreen() {
  const [cfg, setCfg] = useState<Config | null>(null);
  const [f, setF] = useState({ name: "", email: "", phone: "", message: "" });
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [sent, setSent] = useState(false);
  const set = (k: keyof typeof f) => (v: string) => setF((c) => ({ ...c, [k]: v }));

  useEffect(() => {
    api.config().then(setCfg).catch(() => {});
  }, []);

  async function submit() {
    setBusy(true);
    setErr("");
    try {
      const r = await api.contact({ name: f.name, email: f.email, phone: f.phone || undefined, message: f.message });
      if (!r.ok) return setErr(r.error);
      setSent(true);
      setF({ name: "", email: "", phone: "", message: "" });
    } catch (e) {
      setErr(friendlyError(e, "We couldn't send your message. Please try again."));
    } finally {
      setBusy(false);
    }
  }

  const link = (label: string, value: string, url: string) => (
    <Pressable onPress={() => Linking.openURL(url)} style={{ paddingVertical: 11, borderBottomWidth: 1, borderBottomColor: colors.line }}>
      <Text style={{ fontFamily: fonts.body, fontSize: 13, color: colors.mute }}>{label}</Text>
      <Text style={{ fontFamily: fonts.semi, fontSize: 16, color: colors.gold, marginTop: 2 }}>{value}</Text>
    </Pressable>
  );

  return (
    <Screen>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <ScrollView contentContainerStyle={{ padding: 16, gap: 14 }} keyboardShouldPersistTaps="handled">
          <Eyebrow>Contact</Eyebrow>
          <H1>Get in touch.</H1>
          <Body>Questions about a vehicle, viewing or order? Message or call us.</Body>
          {cfg && (
            <Card>
              {link("Call", cfg.contact.phone, `tel:${cfg.contact.phone.replace(/\s/g, "")}`)}
              {link("WhatsApp", cfg.contact.phone, `https://wa.me/${cfg.contact.whatsapp}`)}
              {link("Email", cfg.contact.email, `mailto:${cfg.contact.email}`)}
              <KV k="Address" v={cfg.contact.address} />
              {cfg.contact.hours.map(([d, h]) => <KV key={d} k={d} v={h} />)}
            </Card>
          )}
          <Eyebrow gold>Send a message</Eyebrow>
          <Field label="Name" value={f.name} onChangeText={set("name")} />
          <Field label="Email" value={f.email} onChangeText={set("email")} autoCapitalize="none" keyboardType="email-address" />
          <Field label="Phone (optional)" value={f.phone} onChangeText={set("phone")} keyboardType="phone-pad" />
          <Field label="Message" value={f.message} onChangeText={set("message")} multiline />
          {!!err && <Banner text={err} />}
          {sent && <Banner tone="ok" text="Thanks, your message has been sent." />}
          <Button title="Send message" onPress={submit} loading={busy} />
          <View style={{ height: 20 }} />
        </ScrollView>
      </KeyboardAvoidingView>
    </Screen>
  );
}
