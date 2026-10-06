import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Linking from "expo-linking";
import * as WebBrowser from "expo-web-browser";
import type { Session } from "@supabase/supabase-js";
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { supabaseConfigured } from "../config";
import { googleStartUrl } from "../lib/api";
import { friendlyAuthMessage } from "../lib/errors";
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
const NOT_CONFIGURED = "Sign-in isn't available right now. Please try again later.";
const GOOGLE_FAILED = "We couldn't complete Google sign-in. Please try again.";

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

  // Google sign-in goes through the Next.js API: /api/auth/google redirects to Supabase's Google flow and Supabase
  // returns to the app deep link with #access_token & #refresh_token, which we turn into a persisted session.
  const signInWithGoogle = useCallback<Ctx["signInWithGoogle"]>(async () => {
    if (!supabaseConfigured) return { error: NOT_CONFIGURED };
    const redirectTo = Linking.createURL("auth/callback");
    const res = await WebBrowser.openAuthSessionAsync(googleStartUrl(redirectTo), redirectTo);
    if (res.type !== "success") {
      // Usually means Supabase did not accept the redirect and sent the browser to the website instead.
      return res.type === "cancel" || res.type === "dismiss"
        ? { error: "Sign-in didn't finish. Please try again." }
        : {};
    }
    const hashIdx = res.url.indexOf("#");
    const params = new URLSearchParams(hashIdx >= 0 ? res.url.slice(hashIdx + 1) : res.url.split("?")[1] ?? "");
    const access_token = params.get("access_token");
    const refresh_token = params.get("refresh_token");
    if (!access_token || !refresh_token) {
      console.warn("[auth] Google sign-in returned no session", res.url.split("#")[0], "redirect:", redirectTo);
      return { error: GOOGLE_FAILED };
    }
    const { error } = await supabase.auth.setSession({ access_token, refresh_token });
    return error ? { error: friendlyAuthMessage(error.message, GOOGLE_FAILED) } : {};
  }, []);

  const signInWithPassword = useCallback<Ctx["signInWithPassword"]>(async (email, password) => {
    if (!supabaseConfigured) return { error: NOT_CONFIGURED };
    const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
    return error ? { error: friendlyAuthMessage(error.message) } : {};
  }, []);

  const signUpWithPassword = useCallback<Ctx["signUpWithPassword"]>(async (email, password) => {
    if (!supabaseConfigured) return { error: NOT_CONFIGURED };
    const { data, error } = await supabase.auth.signUp({ email: email.trim(), password });
    if (error) return { error: friendlyAuthMessage(error.message, "We couldn't create your account. Please try again.") };
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
