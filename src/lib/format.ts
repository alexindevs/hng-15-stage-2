import { SITE_URL } from "../config";

// Same output as the site's formatNaira (kobo integers -> NGN). Written by hand because Hermes' Intl support is partial.
export const formatNaira = (kobo: number) => {
  const naira = Math.round(kobo / 100);
  return "₦" + String(naira).replace(/\B(?=(\d{3})+(?!\d))/g, ",");
};

export const formatKm = (km: number) => String(km).replace(/\B(?=(\d{3})+(?!\d))/g, ",") + " km";

/** Catalogue paths like /vehicles/x.jpg live on the website; Supabase Storage URLs are already absolute. */
export const assetUrl = (path: string | null | undefined) =>
  !path ? null : /^https?:\/\//.test(path) ? path : `${SITE_URL}${path.startsWith("/") ? "" : "/"}${path}`;
