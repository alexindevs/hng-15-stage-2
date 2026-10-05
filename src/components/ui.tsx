import { ActivityIndicator, Pressable, StyleSheet, Text, TextInput, View, type TextInputProps, type ViewStyle } from "react-native";
import { colors, fonts, radius } from "../theme";

// Site .btn-gold / .btn-ghost: pill buttons, 600 weight.
export function Button({
  title,
  onPress,
  variant = "gold",
  disabled,
  loading,
  style,
}: {
  title: string;
  onPress?: () => void;
  variant?: "gold" | "ghost";
  disabled?: boolean;
  loading?: boolean;
  style?: ViewStyle;
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
      {loading ? (
        <ActivityIndicator color={variant === "gold" ? "#0a0a0a" : colors.bone} />
      ) : (
        <Text style={[s.btnText, { color: variant === "gold" ? "#0a0a0a" : colors.bone }]}>{title}</Text>
      )}
    </Pressable>
  );
}

export const Eyebrow = ({ children, gold }: { children: string; gold?: boolean }) => (
  <Text style={[s.eyebrow, gold && { color: colors.gold }]}>{children.toUpperCase()}</Text>
);

export const Input = (p: TextInputProps) => (
  <TextInput placeholderTextColor={colors.mute} {...p} style={[s.input, p.style]} />
);

export const Screen = ({ children, style }: { children?: React.ReactNode; style?: ViewStyle }) => (
  <View style={[{ flex: 1, backgroundColor: colors.ink }, style]}>{children}</View>
);

const s = StyleSheet.create({
  btn: { minHeight: 48, paddingHorizontal: 24, borderRadius: radius.pill, alignItems: "center", justifyContent: "center" },
  gold: { backgroundColor: colors.gold },
  ghost: { borderWidth: 1, borderColor: "rgba(244,241,234,0.28)" },
  btnText: { fontFamily: fonts.semi, fontSize: 15, letterSpacing: 0.3 },
  eyebrow: { fontFamily: fonts.body, fontSize: 11.5, letterSpacing: 2.5, color: colors.mute },
  input: {
    backgroundColor: colors.coal,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: radius.input,
    paddingHorizontal: 15,
    paddingVertical: 13,
    color: colors.bone,
    fontFamily: fonts.body,
    fontSize: 16,
  },
});
