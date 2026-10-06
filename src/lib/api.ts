import { SITE_URL } from "../config";
import { ApiError } from "./retry";
import { supabase } from "./supabase";

// Client for the Next.js API (hng-15-stage-1/src/app/api). Auth: Authorization: Bearer <Supabase access token>.
export type Product = {
  id: string;
  slug: string;
  name: string;
  description: string;
  category: string;
  price_kobo: number;
  image_url: string | null;
  cutout_url: string | null;
  year: number | null;
  mileage_km: number | null;
  condition: string | null;
  stock: number;
};
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
export type Bank = { bank: string; name: string; number: string };
export type Config = {
  contact: { phone: string; whatsapp: string; email: string; address: string; hours: readonly (readonly string[])[] };
  inspection_fee_kobo: number;
  fee_policy: string;
  paystack: boolean;
};
export type Slot = { iso: string; label: string };
export type Day = { date: string; label: string; slots: Slot[] };
export type Availability = {
  days: Day[];
  booked: Record<string, number>;
  capacity: number;
  fee_kobo: number;
  paystack: boolean;
  vehicles: { slug: string; name: string }[];
};
export type OrderItem = { name: string; quantity: number; unit_price_kobo: number };
export type OrderDetail = {
  order: {
    reference: string;
    status: string;
    payment_status: string;
    payment_method: "pay_on_delivery" | "bank_transfer" | "paystack";
    total_kobo: number;
    customer_name: string;
    customer_email: string;
    shipping_address: string;
    city: string;
    state: string;
    created_at: string;
    email_sent_at: string | null;
    order_items: OrderItem[];
  };
  awaiting_card: boolean;
  bank: Bank | null;
};
export type BookingDetail = {
  booking: {
    reference: string;
    product_name: string;
    customer_name: string;
    customer_email: string;
    slot_start: string;
    status: string;
    fee_kobo: number;
    fee_option: string;
    fee_status: string;
    email_sent_at: string | null;
  };
  address: string;
  fee_policy: string;
  can_pay_online: boolean;
  bank: Bank | null;
};
export type OrderRow = { reference: string; status: string; payment_status: string; payment_method: string; total_kobo: number; created_at: string };
export type BookingRow = { reference: string; product_name: string; slot_start: string; status: string; fee_kobo: number; fee_status: string };
export type ActionResult = { ok: true; reference?: string; redirectUrl?: string } | { ok: false; error: string };

type Mode = "required" | "optional" | "none";

async function req<T>(path: string, opts: { method?: string; body?: unknown; auth?: Mode } = {}): Promise<T> {
  const mode = opts.auth ?? "none";
  const headers: Record<string, string> = { "Content-Type": "application/json", Accept: "application/json" };
  if (mode !== "none") {
    const { data } = await supabase.auth.getSession(); // refreshes the token when it is about to expire
    const token = data.session?.access_token;
    if (token) headers.Authorization = `Bearer ${token}`;
    else if (mode === "required") throw new ApiError("Not signed in.", 401);
  }
  let res: Response;
  try {
    res = await fetch(`${SITE_URL}/api${path}`, {
      method: opts.method ?? "GET",
      headers,
      body: opts.body === undefined ? undefined : JSON.stringify(opts.body),
    });
  } catch {
    throw new ApiError(`Cannot reach the shop server at ${SITE_URL}. Check EXPO_PUBLIC_SITE_URL and your connection.`, 0);
  }
  const json = await res.json().catch(() => null);
  // Action endpoints answer { ok:false, error } with a 4xx; return those to the caller instead of throwing.
  if (json && typeof json === "object" && "ok" in json) return json as T;
  if (!res.ok) throw new ApiError((json && json.error) || `Request failed (${res.status})`, res.status);
  return json as T;
}

export const api = {
  me: () => req<{ id: string; email: string | null; name: string | null }>("/auth/me", { auth: "required" }),
  config: () => req<Config>("/config"),
  products: () => req<{ items: Product[]; categories: string[] }>("/products"),
  product: (slug: string) =>
    req<{ product: Product; media: { kind: "image" | "video"; url: string; plate?: boolean }[]; related: Product[] }>(`/products/${encodeURIComponent(slug)}`),
  getCart: () => req<ServerCart>("/cart", { auth: "required" }),
  putCart: (items: { slug: string; quantity: number }[]) => req<ServerCart>("/cart", { method: "PUT", body: { items }, auth: "required" }),
  // Per-item operations: edits from different devices combine instead of overwriting each other.
  addToCart: (slug: string, quantity: number) => req<ServerCart>("/cart", { method: "POST", body: { slug, quantity }, auth: "required" }),
  setCartQty: (slug: string, quantity: number) =>
    req<ServerCart>(`/cart/${encodeURIComponent(slug)}`, { method: "PATCH", body: { quantity }, auth: "required" }),
  removeFromCart: (slug: string) => req<ServerCart>(`/cart/${encodeURIComponent(slug)}`, { method: "DELETE", auth: "required" }),
  clearCart: () => req<ServerCart>("/cart", { method: "DELETE", auth: "required" }),
  checkout: (body: unknown) => req<ActionResult>("/checkout", { method: "POST", body, auth: "optional" }),
  orders: () => req<{ items: OrderRow[] }>("/orders", { auth: "required" }),
  order: (ref: string) => req<OrderDetail>(`/orders/${encodeURIComponent(ref)}`),
  payOrder: (ref: string) => req<ActionResult>(`/orders/${encodeURIComponent(ref)}/pay`, { method: "POST" }),
  availability: () => req<Availability>("/bookings/availability"),
  book: (body: unknown) => req<ActionResult>("/bookings", { method: "POST", body, auth: "optional" }),
  bookings: () => req<{ items: BookingRow[] }>("/bookings", { auth: "required" }),
  booking: (ref: string) => req<BookingDetail>(`/bookings/${encodeURIComponent(ref)}`),
  payBooking: (ref: string) => req<ActionResult>(`/bookings/${encodeURIComponent(ref)}/pay`, { method: "POST" }),
  contact: (body: unknown) => req<ActionResult>("/contact", { method: "POST", body }),
};

/** Where the app sends the user to start Google sign-in (the Next.js API redirects on to Supabase/Google). */
export const googleStartUrl = (redirectTo: string) => `${SITE_URL}/api/auth/google?redirect_to=${encodeURIComponent(redirectTo)}`;
