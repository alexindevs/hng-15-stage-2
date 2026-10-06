import { useState } from "react";
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Button, Eyebrow, Input } from "../components/ui";
import { friendlyError } from "../lib/errors";
import { SHOP_NAME } from "../config";
import { useAuth } from "../context/AuthContext";
import { colors, fonts, radius } from "../theme";

export default function LoginScreen() {
  const { signInWithGoogle, signInWithPassword, signUpWithPassword, continueAsGuest } = useAuth();
  const [mode, setMode] = useState<"in" | "up">("in");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState<"google" | "email" | null>(null);
  const [err, setErr] = useState("");
  const [notice, setNotice] = useState("");

  async function run(kind: "google" | "email", fn: () => Promise<{ error?: string; notice?: string }>) {
    setBusy(kind);
    setErr("");
    setNotice("");
    try {
      const r = await fn();
      if (r.error) setErr(r.error);
      else if (r.notice) setNotice(r.notice);
      // success: onAuthStateChange sets the session and the navigator swaps screens
    } catch (e) {
      setErr(friendlyError(e));
    } finally {
      setBusy(null);
    }
  }

  const submitEmail = () => {
    if (!email.trim() || !password) return setErr("Enter your email and password.");
    run("email", () => (mode === "in" ? signInWithPassword(email, password) : signUpWithPassword(email, password)));
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.ink }}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <ScrollView contentContainerStyle={s.scroll} keyboardShouldPersistTaps="handled">
          <Text style={s.brand}>{SHOP_NAME.toUpperCase()}</Text>
          <View style={s.card}>
            <Eyebrow>Welcome back</Eyebrow>
            <Text style={s.h1}>{mode === "in" ? "Sign in" : "Create account"}</Text>
            <Text style={s.sub}>Sign in to track your orders and viewings. You can also browse as a guest.</Text>

            <Button title="Continue with Google" onPress={() => run("google", signInWithGoogle)} loading={busy === "google"} disabled={busy !== null} style={{ marginTop: 22 }} />

            <View style={s.divider}>
              <View style={s.line} />
              <Text style={s.or}>or with email</Text>
              <View style={s.line} />
            </View>

            <Input value={email} onChangeText={setEmail} placeholder="Email" autoCapitalize="none" autoCorrect={false} keyboardType="email-address" textContentType="emailAddress" />
            <Input value={password} onChangeText={setPassword} placeholder="Password" secureTextEntry autoCapitalize="none" textContentType="password" style={{ marginTop: 10 }} onSubmitEditing={submitEmail} />
            <Button title={mode === "in" ? "Sign in" : "Sign up"} variant="ghost" onPress={submitEmail} loading={busy === "email"} disabled={busy !== null} style={{ marginTop: 14 }} />

            {!!err && <Text accessibilityRole="alert" style={s.err}>{err}</Text>}
            {!!notice && <Text style={s.notice}>{notice}</Text>}

            <Text style={s.switch} onPress={() => { setMode(mode === "in" ? "up" : "in"); setErr(""); setNotice(""); }}>
              {mode === "in" ? "No account? Sign up with email" : "Have an account? Sign in"}
            </Text>
          </View>
          <Text style={s.guest} onPress={continueAsGuest}>Continue as guest</Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  scroll: { flexGrow: 1, justifyContent: "center", padding: 20, gap: 22 },
  brand: { fontFamily: fonts.display, fontSize: 22, letterSpacing: 3, color: colors.gold, textAlign: "center" },
  card: { backgroundColor: colors.panel, borderRadius: radius.panel, borderWidth: 1, borderColor: colors.line, padding: 26 },
  h1: { fontFamily: fonts.display, fontSize: 34, color: colors.bone, marginTop: 8, letterSpacing: -0.5 },
  sub: { fontFamily: fonts.body, fontSize: 14, color: colors.mute, marginTop: 10, lineHeight: 20 },
  divider: { flexDirection: "row", alignItems: "center", gap: 10, marginVertical: 20 },
  line: { flex: 1, height: 1, backgroundColor: colors.line },
  or: { fontFamily: fonts.body, fontSize: 12, color: colors.mute },
  err: { fontFamily: fonts.body, color: colors.danger, marginTop: 14, fontSize: 14 },
  notice: { fontFamily: fonts.body, color: colors.ok, marginTop: 14, fontSize: 14 },
  switch: { fontFamily: fonts.body, color: colors.gold, textAlign: "center", marginTop: 18, fontSize: 14 },
  guest: { fontFamily: fonts.body, color: colors.mute, textAlign: "center", fontSize: 14, padding: 8 },
});
