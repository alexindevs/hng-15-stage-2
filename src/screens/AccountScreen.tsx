import { useFocusEffect } from "@react-navigation/native";
import { useCallback, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { Banner, Body, Button, Card, Eyebrow, H1, H2, Screen, StatusPill } from "../components/ui";
import { useAuth } from "../context/AuthContext";
import { api, type BookingRow, type OrderRow } from "../lib/api";
import { friendlyError } from "../lib/errors";
import { formatDate, formatNaira, formatSlot } from "../lib/format";
import { colors, fonts } from "../theme";

export default function AccountScreen({ navigation }: { navigation: any }) {
  const { session, signOut } = useAuth();
  const [orders, setOrders] = useState<OrderRow[]>([]);
  const [bookings, setBookings] = useState<BookingRow[]>([]);
  const [err, setErr] = useState("");

  useFocusEffect(
    useCallback(() => {
      if (!session) return;
      Promise.all([api.orders(), api.bookings()])
        .then(([o, b]) => {
          setOrders(o.items);
          setBookings(b.items);
          setErr("");
        })
        .catch((e) => setErr(friendlyError(e, "We couldn't load your orders and viewings.")));
    }, [session]),
  );

  if (!session) {
    return (
      <Screen style={{ justifyContent: "center", padding: 24, gap: 12 }}>
        <H1>Your account</H1>
        <Body>Sign in to see your orders and viewings.</Body>
        <Button title="Sign in" onPress={() => navigation.navigate("Login")} style={{ marginTop: 12 }} />
      </Screen>
    );
  }
  return (
    <Screen>
      <ScrollView contentContainerStyle={{ padding: 16, gap: 12 }}>
        <Eyebrow gold>Signed in</Eyebrow>
        <H1 style={{ fontSize: 24 }}>{session.user.email ?? "Account"}</H1>
        {!!err && <Banner text={err} />}

        <H2 style={{ marginTop: 10 }}>Viewings</H2>
        {bookings.length === 0 && <Body>No viewings yet.</Body>}
        {bookings.map((b) => (
          <Pressable key={b.reference} onPress={() => navigation.navigate("Booking", { reference: b.reference })}>
            <Card style={{ gap: 6 }}>
              <Text style={s.title}>{b.product_name}</Text>
              <Text style={s.mute}>{formatSlot(b.slot_start)} · {b.reference}</Text>
              <StatusPill status={b.status} />
            </Card>
          </Pressable>
        ))}

        <H2 style={{ marginTop: 10 }}>Orders</H2>
        {orders.length === 0 && <Body>No orders yet.</Body>}
        {orders.map((o) => (
          <Pressable key={o.reference} onPress={() => navigation.navigate("Order", { reference: o.reference })}>
            <Card style={{ gap: 6 }}>
              <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
                <Text style={s.title}>{o.reference}</Text>
                <Text style={[s.title, { color: colors.gold }]}>{formatNaira(o.total_kobo)}</Text>
              </View>
              <Text style={s.mute}>{formatDate(o.created_at)}</Text>
              <View style={{ flexDirection: "row", gap: 8 }}>
                <StatusPill status={o.status} />
                <StatusPill status={o.payment_status} />
              </View>
            </Card>
          </Pressable>
        ))}

        <Button title="Sign out" variant="ghost" onPress={signOut} style={{ marginTop: 16 }} />
      </ScrollView>
    </Screen>
  );
}

const s = StyleSheet.create({
  title: { fontFamily: fonts.semi, fontSize: 15, color: colors.bone },
  mute: { fontFamily: fonts.body, fontSize: 13, color: colors.mute },
});
