import AsyncStorage from "@react-native-async-storage/async-storage";
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

// Same line shape and storage key as the website's CartProvider (hng-15-stage-1). The site's cart is
// browser localStorage only; there is no cart API, so this cart lives on the device (AsyncStorage).
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
};
const CartCtx = createContext<Ctx | null>(null);
const KEY = "eo-cart-v1";

export function CartProvider({ children }: { children: ReactNode }) {
  const [lines, setLines] = useState<CartLine[]>([]);
  const [ready, setReady] = useState(false);

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
      count: lines.reduce((n, l) => n + l.quantity, 0),
      totalKobo: lines.reduce((n, l) => n + l.quantity * l.price_kobo, 0),
      add,
      setQty,
      remove,
      clear,
    }),
    [lines, ready, add, setQty, remove, clear],
  );
  return <CartCtx.Provider value={value}>{children}</CartCtx.Provider>;
}

export const useCart = () => {
  const c = useContext(CartCtx);
  if (!c) throw new Error("useCart outside CartProvider");
  return c;
};
