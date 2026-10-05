// EXPO_PUBLIC_* values are inlined at bundle time; keep them as literal process.env.X references.
export const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL ?? "";
export const SUPABASE_KEY = process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? "";
export const SITE_URL = (process.env.EXPO_PUBLIC_SITE_URL ?? "http://localhost:3000").replace(/\/$/, "");
export const supabaseConfigured = Boolean(SUPABASE_URL && SUPABASE_KEY);
export const SHOP_NAME = "Ego Olisa Enterprises";
