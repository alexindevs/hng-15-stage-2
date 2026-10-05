import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Linking from "expo-linking";
import * as WebBrowser from "expo-web-browser";
import type { Session } from "@supabase/supabase-js";
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { supabaseConfigured } from "../config";
import { supabase } from "../lib/supabase";

WebBrowser.maybeCompleteAuthSession();

type Result = { error?: string; notice?: string };
type Ctx = {
  session: Session | null;
  loading: boolean;
  guest: boolean;
  continueAsGuest: () => void;
  signInWithGoogle: () => Promise<Result>;
  signInWithPassword: (email: string, password: string) => Promise<Result>;
  signUpWithPassword: (email: string, password: string) => Promise<Result>;
  signOut: () => Promise<void>;
};
const AuthCtx = createContext<Ctx | null>(null);
const GUEST_KEY = "eo-guest-v1";
const NOT_CONFIGURED = "Supabase is not configured. Set EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY.";

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [guest, setGuest] = useState(false);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        setGuest((await AsyncStorage.getItem(GUEST_KEY)) === "1");
        if (supabaseConfigured) {
          const { data } = await supabase.auth.getSession(); // restores the persisted session
          if (alive) setSession(data.session);
        }
      } catch {
        // fall through: show login
      } finally {
        if (alive) setLoading(false);
      }
    })();
    const { data: sub } = supabase.auth.onAuthStateChange((_event, s) => setSession(s));
    return () => {
      alive = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  const continueAsGuest = useCallback(() => {
    setGuest(true);
    AsyncStorage.setItem(GUEST_KEY, "1").catch(() => {});
  }, []);

  // Google through Supabase Auth, same provider the website uses. PKCE: Supabase redirects back to the app
  // with ?code=..., which we exchange for a session (the website does the same in /auth/callback).
  const signInWithGoogle = useCallback<Ctx["signInWithGoogle"]>(async () => {
    if (!supabaseConfigured) return { error: NOT_CONFIGURED };
    const redirectTo = Linking.createURL("auth/callback");
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo, skipBrowserRedirect: true },
    });
    if (error || !data?.url) return { error: error?.message ?? "Could not start Google sign-in." };
    const res = await WebBrowser.openAuthSessionAsync(data.url, redirectTo);
    if (res.type !== "success") return {}; // cancelled / dismissed
    const parsed = Linking.parse(res.url);
    const code = parsed.queryParams?.code;
    if (typeof code !== "string") {
      const desc = parsed.queryParams?.error_description;
      return { error: typeof desc === "string" ? desc : "Google sign-in did not return a code. Check the Supabase Redirect URLs." };
    }
    const { error: exErr } = await supabase.auth.exchangeCodeForSession(code);
    return exErr ? { error: exErr.message } : {};
  }, []);

  const signInWithPassword = useCallback<Ctx["signInWithPassword"]>(async (email, password) => {
    if (!supabaseConfigured) return { error: NOT_CONFIGURED };
    const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
    return error ? { error: error.message } : {};
  }, []);

  const signUpWithPassword = useCallback<Ctx["signUpWithPassword"]>(async (email, password) => {
    if (!supabaseConfigured) return { error: NOT_CONFIGURED };
    const { data, error } = await supabase.auth.signUp({ email: email.trim(), password });
    if (error) return { error: error.message };
    return data.session ? {} : { notice: "Account created. Check your email to confirm it, then sign in." };
  }, []);

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
    setSession(null);
    setGuest(false);
    AsyncStorage.removeItem(GUEST_KEY).catch(() => {});
  }, []);

  const value = useMemo<Ctx>(
    () => ({ session, loading, guest, continueAsGuest, signInWithGoogle, signInWithPassword, signUpWithPassword, signOut }),
    [session, loading, guest, continueAsGuest, signInWithGoogle, signInWithPassword, signUpWithPassword, signOut],
  );
  return <AuthCtx.Provider value={value}>{children}</AuthCtx.Provider>;
}

export const useAuth = () => {
  const c = useContext(AuthCtx);
  if (!c) throw new Error("useAuth outside AuthProvider");
  return c;
};
