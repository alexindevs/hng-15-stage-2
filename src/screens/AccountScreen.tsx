import { useCallback, useEffect, useState } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { Button, Eyebrow, Screen } from "../components/ui";
import { useAuth } from "../context/AuthContext";
import { formatNaira } from "../lib/format";
import { supabase } from "../lib/supabase";
import { colors, fonts, radius } from "../theme";

type Order = { reference: string; status: string; payment_status: string; total_kobo: number; created_at: string };
type Booking = { reference: string; product_name: string; status: string; slot_start: string };

export default function AccountScreen({ onSignIn }: { onSignIn: () => void }) {
  const { session, signOut } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [err, setErr] = useState("");

  const load = useCallback(async () => {
    if (!session) return;
    // RLS policies in the site's schema.sql let a signed-in user read their own rows.
    const [o, b] = await Promise.all([
      supabase.from("orders").select("reference,status,payment_status,total_kobo,created_at").order("created_at", { ascending: false }),
      supabase.from("bookings").select("reference,product_name,status,slot_start").order("created_at", { ascending: false }),
    ]);
    if (o.error || b.error) setErr((o.error ?? b.error)!.message);
    else setErr("");
    setOrders((o.data as Order[]) ?? []);
    setBookings((b.data as Booking[]) ?? []);
  }, [session]);
  useEffect(() => {
    load();
  }, [load]);

  if (!session) {
    return (
      <Screen style={{ justifyContent: "center", padding: 24, gap: 12 }}>
        <Text style={s.h1}>Your account</Text>
        <Text style={s.mute}>Sign in to see your orders and viewings.</Text>
        <Button title="Sign in" onPress={onSignIn} style={{ marginTop: 12 }} />
      </Screen>
    );
  }

  return (
    <Screen>
      <ScrollView contentContainerStyle={{ padding: 16, gap: 14 }}>
        <Eyebrow gold>Signed in</Eyebrow>
        <Text style={s.h1}>{session.user.email ?? "Account"}</Text>
        {!!err && <Text style={{ color: colors.danger, fontFamily: fonts.body }}>{err}</Text>}

        <Text style={s.h2}>Orders</Text>
        {orders.length === 0 && <Text style={s.mute}>No orders yet.</Text>}
        {orders.map((o) => (
          <View key={o.reference} style={s.card}>
            <Text style={s.ref}>{o.reference}</Text>
            <Text style={s.mute}>{o.status} · {o.payment_status} · {new Date(o.created_at).toLocaleDateString()}</Text>
            <Text style={s.total}>{formatNaira(o.total_kobo)}</Text>
          </View>
        ))}

        <Text style={s.h2}>Viewings</Text>
        {bookings.length === 0 && <Text style={s.mute}>No viewings booked.</Text>}
        {bookings.map((b) => (
          <View key={b.reference} style={s.card}>
            <Text style={s.ref}>{b.product_name}</Text>
            <Text style={s.mute}>{b.reference} · {b.status}</Text>
            <Text style={s.mute}>{new Date(b.slot_start).toLocaleString()}</Text>
          </View>
        ))}

        <Button title="Sign out" variant="ghost" onPress={signOut} style={{ marginTop: 16 }} />
      </ScrollView>
    </Screen>
  );
}

const s = StyleSheet.create({
  h1: { fontFamily: fonts.display, fontSize: 26, color: colors.bone, letterSpacing: -0.4 },
  h2: { fontFamily: fonts.display, fontSize: 20, color: colors.bone, marginTop: 10 },
  mute: { fontFamily: fonts.body, fontSize: 13.5, color: colors.mute },
  card: { backgroundColor: colors.panel, borderRadius: radius.card, borderWidth: 1, borderColor: colors.line, padding: 16, gap: 4 },
  ref: { fontFamily: fonts.semi, fontSize: 15, color: colors.bone },
  total: { fontFamily: fonts.semi, color: colors.gold, marginTop: 4 },
});
