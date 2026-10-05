import catalog from "../data/catalog.json";
import { supabaseConfigured } from "../config";
import { supabase } from "./supabase";

// Mirrors hng-15-stage-1/src/lib/products.ts (the site reads the same `products` table).
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

const fallback: Product[] = catalog.map((p) => ({
  id: p.slug,
  slug: p.slug,
  name: p.name,
  description: p.description,
  category: p.category,
  price_kobo: p.price_kobo,
  image_url: p.image,
  cutout_url: p.cutout,
  year: p.year,
  mileage_km: p.mileage_km,
  condition: p.condition,
  stock: p.stock,
}));

/** Same query as the site: active products, oldest first. Falls back to the bundled catalogue like the site does. */
export async function fetchProducts(): Promise<Product[]> {
  if (!supabaseConfigured) return fallback;
  const { data, error } = await supabase.from("products").select("*").eq("active", true).order("created_at");
  if (error || !data?.length) return fallback;
  return data as Product[];
}

/** Extra photos for a listing (public `listing_media` table); empty for the bundled catalogue. */
export async function fetchMedia(p: Product): Promise<string[]> {
  if (!supabaseConfigured || p.id === p.slug) return [];
  const { data } = await supabase.from("listing_media").select("kind, url").eq("product_id", p.id).order("sort");
  return (data ?? []).filter((m) => m.kind !== "video").map((m) => m.url as string);
}
