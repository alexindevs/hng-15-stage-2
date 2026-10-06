import AsyncStorage from "@react-native-async-storage/async-storage";
import { AppState } from "react-native";
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { api, type ServerCart } from "../lib/api";
import { friendlyError } from "../lib/errors";
import { backoffMs, withRetry } from "../lib/retry";
import { supabase } from "../lib/supabase";
import { useAuth } from "./AuthContext";

// Same line shape and storage key as the website's CartProvider. Guests: device-only (AsyncStorage).
// Signed in: the cart also lives in Supabase through the Next.js API (/api/cart):
//  - on sign-in the device cart is merged into the account cart (higher quantity wins);
//  - every edit is sent as a per-item operation, in order, so edits from different devices combine;
//  - a websocket broadcast reports changes made elsewhere; the Cart screen also polls every 5 seconds.
export type CartLine = {
  slug: string;
  name: string;
  price_kobo: number;
  category: string;
  quantity: number;
  max: number;
  image?: string | null;
};
type Ctx = {
  lines: CartLine[];
  count: number;
  totalKobo: number;
  add: (l: Omit<CartLine, "quantity">, qty?: number) => void;
  setQty: (slug: string, qty: number) => void;
  remove: (slug: string) => void;
  clear: () => void;
  /** Re-read the account cart now (the Cart screen polls this every 5 seconds). No-op for guests. */
  refresh: () => Promise<void>;
  ready: boolean;
  /** "local" = guest / not synced yet, "synced" = saved to the account, "error" = last sync failed (still saved on device). */
  sync: "local" | "syncing" | "synced" | "error";
  syncError: string;
};
const CartCtx = createContext<Ctx | null>(null);
const KEY = "eo-cart-v1";

const fromServer = (c: ServerCart): CartLine[] =>
  c.items.map((i) => ({
    slug: i.slug,
    name: i.name,
    price_kobo: i.price_kobo,
    category: i.category,
    quantity: i.quantity,
    max: i.stock,
    image: i.image_url,
  }));
const sameCart = (a: CartLine[], b: CartLine[]) =>
  JSON.stringify(a.map((l) => [l.slug, l.quantity])) === JSON.stringify(b.map((l) => [l.slug, l.quantity]));

export function CartProvider({ children }: { children: ReactNode }) {
  const { session } = useAuth();
  const userId = session?.user.id ?? null;
  const [lines, setLines] = useState<CartLine[]>([]);
  const [ready, setReady] = useState(false);
  const [sync, setSync] = useState<Ctx["sync"]>("local");
  const [syncError, setSyncError] = useState("");

  const linesRef = useRef(lines);
  linesRef.current = lines;
  const synced = useRef(false); // initial merge with the account cart finished for the current user
  const inflight = useRef(0); // queued/running operations; while > 0 server reads are ignored
  const chain = useRef<Promise<unknown>>(Promise.resolve());
  const prevUser = useRef<string | null>(null);

  useEffect(() => {
    AsyncStorage.getItem(KEY)
      .then((raw) => {
        if (raw) setLines(JSON.parse(raw));
      })
      .catch(() => {})
      .finally(() => setReady(true));
  }, []);
  useEffect(() => {
    if (!ready) return;
    AsyncStorage.setItem(KEY, JSON.stringify(lines)).catch(() => {});
  }, [lines, ready]);

  const userRef = useRef(userId);
  userRef.current = userId;
  const syncing = useRef(false);
  const failures = useRef(0); // consecutive failed first-sync attempts (drives the backoff)
  const nextTryAt = useRef(0); // earliest time the first sync may be retried (exponential backoff with jitter)

  // Merge the device cart into the account cart (higher quantity wins), save it, adopt the server's version.
  // Retried by refresh() until it succeeds (e.g. after a network or auth error).
  const initialSync = useCallback(async () => {
    const uid = userRef.current;
    if (!uid || syncing.current || Date.now() < nextTryAt.current) return;
    syncing.current = true;
    setSync("syncing");
    try {
      const server = await withRetry(() => api.getCart());
      const merged = new Map<string, number>();
      for (const i of server.items) merged.set(i.slug, i.quantity);
      for (const l of linesRef.current) merged.set(l.slug, Math.max(merged.get(l.slug) ?? 0, l.quantity));
      const result = await withRetry(() => api.putCart([...merged].map(([slug, quantity]) => ({ slug, quantity }))));
      if (userRef.current !== uid) return; // signed out / switched account meanwhile
      failures.current = 0;
      nextTryAt.current = 0;
      setLines(fromServer(result));
      synced.current = true;
      setSync("synced");
      setSyncError("");
    } catch (e) {
      if (userRef.current !== uid) return;
      nextTryAt.current = Date.now() + backoffMs(failures.current++, 1000, 60_000);
      setSync("error");
      console.warn("[cart] first sync failed", e);
      setSyncError(friendlyError(e, "We couldn't sync your cart."));
    } finally {
      syncing.current = false;
    }
  }, []);

  // Sign-in: sync. Sign-out: empty the device cart so the next person on this phone does not inherit it.
  useEffect(() => {
    if (!ready) return;
    synced.current = false;
    failures.current = 0;
    nextTryAt.current = 0;
    if (!userId) {
      setSync("local");
      if (prevUser.current) setLines([]);
      prevUser.current = null;
      return;
    }
    prevUser.current = userId;
    initialSync();
  }, [ready, userId, initialSync]);

  /** Sends one operation after all earlier ones; when the queue drains, adopts the server's answer. */
  const enqueue = useCallback((op: () => Promise<ServerCart>) => {
    if (!synced.current) return;
    inflight.current += 1;
    setSync("syncing");
    chain.current = chain.current.then(async () => {
      let result: ServerCart | null = null;
      let failed: string | null = null;
      try {
        result = await withRetry(op); // transient failures retry with exponential backoff + jitter, keeping order
      } catch (e) {
        console.warn("[cart] sync failed", e);
        failed = friendlyError(e, "We couldn't sync your cart.");
      }
      inflight.current -= 1;
      if (failed) {
        setSync("error");
        setSyncError(failed);
      } else if (inflight.current === 0 && result) {
        setLines(fromServer(result));
        setSync("synced");
        setSyncError("");
      }
    });
  }, []);

  // Re-read the account cart. Skipped while local edits are still being saved so they cannot be overwritten.
  const refresh = useCallback(async () => {
    if (!synced.current) {
      initialSync(); // earlier sync failed or has not run yet: try again
      return;
    }
    if (inflight.current > 0) return;
    try {
      const next = fromServer(await api.getCart());
      if (inflight.current > 0) return;
      if (!sameCart(next, linesRef.current)) setLines(next);
      setSync("synced");
      setSyncError("");
    } catch {
      // keep the local cart; the next refresh retries
    }
  }, [initialSync]);

  // Live updates: the database broadcasts "cart_changed" on a private channel only this user can join (websocket).
  // Also refresh when the app returns to the foreground. The Cart screen adds 5-second polling on top.
  useEffect(() => {
    if (!ready || !userId) return;
    let channel: ReturnType<typeof supabase.channel> | null = null;
    let debounce: ReturnType<typeof setTimeout> | undefined;
    let cancelled = false;
    (async () => {
      await supabase.realtime.setAuth();
      if (cancelled) return;
      channel = supabase
        .channel(`cart:${userId}`, { config: { private: true } })
        .on("broadcast", { event: "cart_changed" }, () => {
          clearTimeout(debounce);
          debounce = setTimeout(refresh, 150);
        })
        .subscribe();
    })();
    const sub = AppState.addEventListener("change", (st) => {
      if (st === "active") refresh();
    });
    return () => {
      cancelled = true;
      clearTimeout(debounce);
      if (channel) supabase.removeChannel(channel);
      sub.remove();
    };
  }, [ready, userId, refresh]);

  const add = useCallback<Ctx["add"]>(
    (l, qty = 1) => {
      setLines((cur) => {
        const found = cur.find((x) => x.slug === l.slug);
        if (found) return cur.map((x) => (x.slug === l.slug ? { ...x, quantity: Math.min(x.quantity + qty, l.max) } : x));
        return [...cur, { ...l, quantity: Math.min(qty, l.max) }];
      });
      enqueue(() => api.addToCart(l.slug, qty));
    },
    [enqueue],
  );
  const setQty = useCallback(
    (slug: string, qty: number) => {
      setLines((cur) =>
        cur.flatMap((x) => (x.slug !== slug ? [x] : qty <= 0 ? [] : [{ ...x, quantity: Math.min(qty, x.max) }])),
      );
      enqueue(() => api.setCartQty(slug, Math.max(0, qty)));
    },
    [enqueue],
  );
  const remove = useCallback(
    (slug: string) => {
      setLines((c) => c.filter((x) => x.slug !== slug));
      enqueue(() => api.removeFromCart(slug));
    },
    [enqueue],
  );
  const clear = useCallback(() => {
    setLines([]);
    enqueue(() => api.clearCart());
  }, [enqueue]);

  const value = useMemo<Ctx>(
    () => ({
      lines,
      ready,
      sync,
      syncError,
      refresh,
      count: lines.reduce((n, l) => n + l.quantity, 0),
      totalKobo: lines.reduce((n, l) => n + l.quantity * l.price_kobo, 0),
      add,
      setQty,
      remove,
      clear,
    }),
    [lines, ready, sync, syncError, refresh, add, setQty, remove, clear],
  );
  return <CartCtx.Provider value={value}>{children}</CartCtx.Provider>;
}

export const useCart = () => {
  const c = useContext(CartCtx);
  if (!c) throw new Error("useCart outside CartProvider");
  return c;
};
