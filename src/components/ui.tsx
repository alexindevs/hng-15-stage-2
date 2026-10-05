import { ActivityIndicator, Pressable, StyleSheet, Text, TextInput, View, type TextInputProps, type ViewStyle } from "react-native";
import { colors, fonts, radius } from "../theme";

// Site .btn-gold / .btn-ghost: pill buttons, 600 weight.
export function Button({
  title, onPress, variant = "gold", disabled, loading, style,
}: {
  title: string; onPress?: () => void; variant?: "gold" | "ghost"; disabled?: boolean; loading?: boolean; style?: ViewStyle;
}) {
  const off = disabled || loading;
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      disabled={off}
      style={({ pressed }) => [
        s.btn,
        variant === "gold" ? s.gold : s.ghost,
        pressed && (variant === "gold" ? { backgroundColor: colors.goldSoft } : { borderColor: colors.gold }),
        off && { opacity: 0.5 },
        style,
      ]}
    >
      {loading ? <ActivityIndicator color={variant === "gold" ? "#0a0a0a" : colors.bone} /> : (
        <Text style={[s.btnText, { color: variant === "gold" ? "#0a0a0a" : colors.bone }]}>{title}</Text>
      )}
    </Pressable>
  );
}

export const Eyebrow = ({ children, gold, dark }: { children: string; gold?: boolean; dark?: boolean }) => (
  <Text style={[s.eyebrow, gold && { color: colors.gold }, dark && { color: "rgba(22,20,15,0.6)" }]}>{children.toUpperCase()}</Text>
);

export const Input = (p: TextInputProps) => <TextInput placeholderTextColor={colors.mute} {...p} style={[s.input, p.multiline && { minHeight: 100, textAlignVertical: "top" }, p.style]} />;

export const Field = ({ label, ...p }: TextInputProps & { label: string }) => (
  <View style={{ gap: 6 }}>
    <Text style={s.label}>{label}</Text>
    <Input {...p} />
  </View>
);

export const Screen = ({ children, style }: { children?: React.ReactNode; style?: ViewStyle }) => (
  <View style={[{ flex: 1, backgroundColor: colors.ink }, style]}>{children}</View>
);

export const H1 = ({ children, style }: { children: React.ReactNode; style?: object }) => <Text style={[s.h1, style]}>{children}</Text>;
export const H2 = ({ children, style }: { children: React.ReactNode; style?: object }) => <Text style={[s.h2, style]}>{children}</Text>;
export const Body = ({ children, style }: { children: React.ReactNode; style?: object }) => <Text style={[s.body, style]}>{children}</Text>;

export function Pill({ label, on, onPress, disabled }: { label: string; on?: boolean; onPress: () => void; disabled?: boolean }) {
  return (
    <Pressable onPress={onPress} disabled={disabled} style={[s.pill, on && s.pillOn, disabled && { opacity: 0.35 }]}>
      <Text style={[s.pillText, on && { color: "#0a0a0a" }]}>{label}</Text>
    </Pressable>
  );
}

export const Card = ({ children, style }: { children: React.ReactNode; style?: ViewStyle }) => <View style={[s.card, style]}>{children}</View>;

export const KV = ({ k, v }: { k: string; v: string }) => (
  <View style={s.kv}>
    <Text style={s.kvK}>{k}</Text>
    <Text style={s.kvV}>{v}</Text>
  </View>
);

const TONES: Record<string, string> = {
  pending: colors.gold, confirmed: colors.ok, paid: colors.ok, shipped: colors.ok, delivered: colors.ok, completed: colors.mute,
  declined: colors.danger, cancelled: colors.mute, failed: colors.danger, unpaid: colors.gold,
};
export const StatusPill = ({ status }: { status: string }) => (
  <View style={[s.status, { borderColor: TONES[status] ?? colors.line }]}>
    <Text style={[s.statusText, { color: TONES[status] ?? colors.mute }]}>{status.toUpperCase()}</Text>
  </View>
);

export const Banner = ({ text, tone = "error" }: { text: string; tone?: "error" | "ok" }) => (
  <Text accessibilityRole="alert" style={{ fontFamily: fonts.body, fontSize: 14, color: tone === "error" ? colors.danger : colors.ok }}>{text}</Text>
);

export const Loading = () => (
  <Screen style={{ justifyContent: "center" }}>
    <ActivityIndicator color={colors.gold} />
  </Screen>
);

const s = StyleSheet.create({
  btn: { minHeight: 48, paddingHorizontal: 24, borderRadius: radius.pill, alignItems: "center", justifyContent: "center" },
  gold: { backgroundColor: colors.gold },
  ghost: { borderWidth: 1, borderColor: "rgba(244,241,234,0.28)" },
  btnText: { fontFamily: fonts.semi, fontSize: 15, letterSpacing: 0.3 },
  eyebrow: { fontFamily: fonts.body, fontSize: 11.5, letterSpacing: 2.5, color: colors.mute },
  label: { fontFamily: fonts.body, fontSize: 13, color: colors.mute },
  input: { backgroundColor: colors.coal, borderWidth: 1, borderColor: colors.line, borderRadius: radius.input, paddingHorizontal: 15, paddingVertical: 13, color: colors.bone, fontFamily: fonts.body, fontSize: 16 },
  h1: { fontFamily: fonts.display, fontSize: 32, color: colors.bone, letterSpacing: -0.5 },
  h2: { fontFamily: fonts.display, fontSize: 24, color: colors.bone, letterSpacing: -0.3 },
  body: { fontFamily: fonts.body, fontSize: 15, lineHeight: 23, color: colors.mute },
  pill: { borderWidth: 1, borderColor: "rgba(244,241,234,0.28)", borderRadius: radius.pill, paddingHorizontal: 16, paddingVertical: 9 },
  pillOn: { backgroundColor: colors.gold, borderColor: colors.gold },
  pillText: { fontFamily: fonts.semi, fontSize: 13.5, color: colors.bone },
  card: { backgroundColor: colors.panel, borderRadius: radius.card, borderWidth: 1, borderColor: colors.line, padding: 18 },
  kv: { flexDirection: "row", justifyContent: "space-between", gap: 16, paddingVertical: 11, borderBottomWidth: 1, borderBottomColor: colors.line },
  kvK: { fontFamily: fonts.body, fontSize: 14, color: colors.mute },
  kvV: { fontFamily: fonts.body, fontSize: 14, color: colors.bone, flexShrink: 1, textAlign: "right" },
  status: { alignSelf: "flex-start", borderWidth: 1, borderRadius: radius.pill, paddingHorizontal: 12, paddingVertical: 4 },
  statusText: { fontFamily: fonts.semi, fontSize: 11, letterSpacing: 1.8 },
});
