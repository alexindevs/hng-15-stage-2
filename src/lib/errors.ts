import { ApiError } from "./retry";

export const GENERIC = "Something went wrong. Please try again.";
const NETWORK = "Can't connect. Check your internet and try again.";

// Anything that mentions internals (config, tokens, JSON shapes, stack-like text) must never reach a user.
const TECHNICAL = /supabase|credential|token|jwt|env\b|expo|localhost|configured|json|undefined|null|[{}()[\]<>]|\b[45]\d\d\b/i;

/** Returns the message when it reads like something written for customers, otherwise the fallback. */
export function cleanMessage(msg: unknown, fallback = GENERIC): string {
  if (typeof msg !== "string") return fallback;
  const m = msg.trim();
  return m && m.length <= 140 && !TECHNICAL.test(m) ? m : fallback;
}

/** Friendly wording for sign-in errors that Supabase reports as plain strings. */
export function friendlyAuthMessage(msg: string, fallback = "We couldn't sign you in. Please try again."): string {
  const m = msg.toLowerCase();
  if (m.includes("invalid login credentials")) return "That email or password isn't right.";
  if (m.includes("email not confirmed")) return "Please confirm your email address first, then sign in.";
  if (m.includes("already registered") || m.includes("already been registered")) return "An account with this email already exists. Try signing in instead.";
  if (m.includes("password should be") || m.includes("weak password")) return "Choose a stronger password (at least 6 characters).";
  if (m.includes("valid email") || m.includes("invalid email")) return "Enter a valid email address.";
  if (m.includes("rate limit") || m.includes("too many")) return "Too many attempts. Please wait a moment and try again.";
  return fallback;
}

/** Turns any thrown value into a message that is safe and helpful to show on screen. */
export function friendlyError(e: unknown, fallback = GENERIC): string {
  if (e instanceof ApiError) {
    if (e.status === 0) return NETWORK;
    if (e.status === 401) return "Please sign in again to continue.";
    if (e.status === 429) return "Too many attempts. Please wait a moment and try again.";
    if (e.status >= 500) return "Something went wrong on our end. Please try again.";
    if (e.status === 404 || e.status === 409) return cleanMessage(e.message, fallback);
    return fallback;
  }
  if (e instanceof Error && /network request failed|failed to fetch|timeout/i.test(e.message)) return NETWORK;
  return fallback;
}
