import AsyncStorage from "@react-native-async-storage/async-storage";
import { AppState } from "react-native";
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { api, type ServerCart } from "../lib/api";
import { useAuth } from "./AuthContext";

// Same line shape and storage key as the website's CartProvider. Guests: device-only (AsyncStorage).
// Signed in: the cart is also stored in Supabase through the Next.js API (/api/cart), so it follows the account.
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

export function CartProvider({ children }: { children: ReactNode }) {
  const { session } = useAuth();
  const userId = session?.user.id ?? null;
  const [lines, setLines] = useState<CartLine[]>([]);
  const [ready, setReady] = useState(false);
  const [sync, setSync] = useState<Ctx["sync"]>("local");
  const [syncError, setSyncError] = useState("");

  const linesRef = useRef(lines);
  linesRef.current = lines;
  const synced = useRef(false); // initial merge with the server cart finished for the current user
  const skipPush = useRef(false); // the next lines change came from the server; do not echo it back
  const version = useRef(0); // bumps on every user edit so stale server responses are ignored
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

  // Sign-in: merge the device cart into the account cart (higher quantity wins), save it, adopt the server's version.
  // Sign-out: empty the device cart so the next person on this phone does not inherit it.
  useEffect(() => {
    if (!ready) return;
    if (!userId) {
      synced.current = false;
      setSync("local");
      if (prevUser.current) {
        skipPush.current = true;
        setLines([]);
      }
      prevUser.current = null;
      return;
    }
    prevUser.current = userId;
    synced.current = false;
    let cancelled = false;
    (async () => {
      setSync("syncing");
      try {
        const server = await api.getCart();
        const merged = new Map<string, number>();
        for (const i of server.items) merged.set(i.slug, i.quantity);
        for (const l of linesRef.current) merged.set(l.slug, Math.max(merged.get(l.slug) ?? 0, l.quantity));
        const result = await api.putCart([...merged].map(([slug, quantity]) => ({ slug, quantity })));
        if (cancelled) return;
        skipPush.current = true;
        setLines(fromServer(result));
        synced.current = true;
        setSync("synced");
        setSyncError("");
      } catch (e) {
        if (cancelled) return;
        setSync("error");
        setSyncError(e instanceof Error ? e.message : "Could not sync cart.");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [ready, userId]);

  // Push every user edit to the server (debounced); the server's answer (current prices, stock caps) replaces local lines.
  useEffect(() => {
    if (!ready || !userId) return;
    if (skipPush.current) {
      skipPush.current = false;
      return;
    }
    if (!synced.current) return;
    const v = ++version.current;
    setSync("syncing");
    const t = setTimeout(async () => {
      try {
        const result = await api.putCart(linesRef.current.map((l) => ({ slug: l.slug, quantity: l.quantity })));
        if (v !== version.current) return; // user edited again meanwhile
        skipPush.current = true;
        setLines(fromServer(result));
        setSync("synced");
        setSyncError("");
      } catch (e) {
        if (v !== version.current) return;
        setSync("error");
        setSyncError(e instanceof Error ? e.message : "Could not sync cart.");
      }
    }, 300);
    return () => clearTimeout(t);
  }, [lines, ready, userId]);

  // Pick up changes made elsewhere (the website) when the app returns to the foreground, and every 20 seconds.
  useEffect(() => {
    if (!ready || !userId) return;
    const refresh = async () => {
      if (!synced.current) return;
      const v = version.current;
      try {
        const next = fromServer(await api.getCart());
        if (v !== version.current) return; // edited locally while loading
        const key = (ls: CartLine[]) => JSON.stringify(ls.map((l) => [l.slug, l.quantity]));
        if (key(next) !== key(linesRef.current)) {
          skipPush.current = true;
          setLines(next);
        }
      } catch {
        // keep the local cart; the next edit or refresh retries
      }
    };
    const timer = setInterval(refresh, 20_000);
    const sub = AppState.addEventListener("change", (s) => {
      if (s === "active") refresh();
    });
    return () => {
      clearInterval(timer);
      sub.remove();
    };
  }, [ready, userId]);

  const add = useCallback<Ctx["add"]>((l, qty = 1) => {
    setLines((cur) => {
      const found = cur.find((x) => x.slug === l.slug);
      if (found) return cur.map((x) => (x.slug === l.slug ? { ...x, quantity: Math.min(x.quantity + qty, l.max) } : x));
      return [...cur, { ...l, quantity: Math.min(qty, l.max) }];
    });
  }, []);
  const setQty = useCallback((slug: string, qty: number) => {
    setLines((cur) =>
      cur.flatMap((x) => (x.slug !== slug ? [x] : qty <= 0 ? [] : [{ ...x, quantity: Math.min(qty, x.max) }])),
    );
  }, []);
  const remove = useCallback((slug: string) => setLines((c) => c.filter((x) => x.slug !== slug)), []);
  const clear = useCallback(() => setLines([]), []);

  const value = useMemo<Ctx>(
    () => ({
      lines,
      ready,
      sync,
      syncError,
      count: lines.reduce((n, l) => n + l.quantity, 0),
      totalKobo: lines.reduce((n, l) => n + l.quantity * l.price_kobo, 0),
      add,
      setQty,
      remove,
      clear,
    }),
    [lines, ready, sync, syncError, add, setQty, remove, clear],
  );
  return <CartCtx.Provider value={value}>{children}</CartCtx.Provider>;
}

export const useCart = () => {
  const c = useContext(CartCtx);
  if (!c) throw new Error("useCart outside CartProvider");
  return c;
};
