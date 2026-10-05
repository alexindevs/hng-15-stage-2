import { SITE_URL } from "../config";
import { supabase } from "./supabase";

// Client for the Next.js API (hng-15-stage-1/src/app/api). Auth: Bearer <Supabase access token>.
export type ServerCartItem = {
  slug: string;
  name: string;
  category: string;
  price_kobo: number;
  image_url: string | null;
  cutout_url: string | null;
  stock: number;
  quantity: number;
};
export type ServerCart = { items: ServerCartItem[]; count: number; total_kobo: number };

async function call<T>(path: string, init?: { method?: string; body?: unknown }): Promise<T> {
  const { data } = await supabase.auth.getSession(); // returns a refreshed token when needed
  const token = data.session?.access_token;
  if (!token) throw new Error("Not signed in.");
  const res = await fetch(`${SITE_URL}/api${path}`, {
    method: init?.method ?? "GET",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: init?.body === undefined ? undefined : JSON.stringify(init.body),
  });
  const json = await res.json().catch(() => null);
  if (!res.ok) throw new Error((json && json.error) || `Request failed (${res.status})`);
  return json as T;
}

export const api = {
  me: () => call<{ id: string; email: string | null; name: string | null }>("/auth/me"),
  getCart: () => call<ServerCart>("/cart"),
  putCart: (items: { slug: string; quantity: number }[]) => call<ServerCart>("/cart", { method: "PUT", body: { items } }),
};

/** Where the app sends the user to start Google sign-in (the Next.js API redirects on to Supabase/Google). */
export const googleStartUrl = (redirectTo: string) => `${SITE_URL}/api/auth/google?redirect_to=${encodeURIComponent(redirectTo)}`;
