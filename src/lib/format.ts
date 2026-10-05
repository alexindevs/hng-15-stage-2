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

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const hourLabel = (h: number) => `${h % 12 || 12}:00 ${h < 12 ? "AM" : "PM"}`;

export const formatDate = (iso: string) => {
  const d = new Date(iso);
  return `${d.getDate()} ${MONTHS[d.getMonth()]} ${d.getFullYear()}`;
};

/** "Mon 5 Oct, 10:00 AM" in Lagos time (UTC+1), same as the site's formatSlot. */
export function formatSlot(iso: string) {
  const l = new Date(new Date(iso).getTime() + 3600_000);
  return `${DAYS[l.getUTCDay()]} ${l.getUTCDate()} ${MONTHS[l.getUTCMonth()]}, ${hourLabel(l.getUTCHours())}`;
}
