import "react-native-url-polyfill/auto";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { AppState } from "react-native";
import { createClient } from "@supabase/supabase-js";
import { SUPABASE_KEY, SUPABASE_URL } from "../config";

// Same Supabase project as the website. The session is persisted in AsyncStorage.
// Placeholder values keep createClient from throwing when env vars are missing; callers check supabaseConfigured.
export const supabase = createClient(SUPABASE_URL || "http://localhost:54321", SUPABASE_KEY || "missing-key", {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
    flowType: "pkce", // the website's /auth/callback also uses PKCE (exchangeCodeForSession)
  },
});

// Only refresh tokens while the app is in the foreground (Supabase React Native guidance).
AppState.addEventListener("change", (state) => {
  if (state === "active") supabase.auth.startAutoRefresh();
  else supabase.auth.stopAutoRefresh();
});
