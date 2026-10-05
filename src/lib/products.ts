import catalog from "../data/catalog.json";
import { api, type Product } from "./api";

export type { Product };

// Offline fallback only (same bundled catalogue the site falls back to). Normal path is GET /api/products.
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

let cache: Product[] | null = null;

export async function fetchProducts(force = false): Promise<Product[]> {
  if (cache && !force) return cache;
  try {
    cache = (await api.products()).items;
  } catch {
    if (!cache) cache = fallback;
  }
  return cache;
}
