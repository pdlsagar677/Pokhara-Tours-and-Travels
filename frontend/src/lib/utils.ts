import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const npr = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "NPR",
  maximumFractionDigits: 0,
});

export function formatNPR(value: number): string {
  if (!Number.isFinite(value)) return "—";
  return npr.format(value);
}

// Coerce a `?next=` value into a same-origin pathname. `router.push` accepts
// protocol-relative URLs ("//evil.com") and full URLs and will navigate away,
// so the post-login redirect must validate that the target is a local path
// starting with a single `/` and not `//` or `/\` (which the browser would
// interpret as a host).
// Built via `new RegExp` from a string so the source file doesn't have to
// contain literal control characters.
const UNSAFE_NEXT_CHARS = new RegExp("[\\s\\x00-\\x1f\\x7f]", "g");

export function safeNextPath(raw: string | null | undefined): string {
  if (!raw) return "/";
  const trimmed = raw.replace(UNSAFE_NEXT_CHARS, "");
  if (trimmed.length === 0 || trimmed.length > 256) return "/";
  if (trimmed[0] !== "/") return "/";
  // `//evil.com` is parsed as protocol-relative. `/\evil.com` is treated as
  // a host on some browsers. Block both second-char escapes.
  if (trimmed[1] === "/" || trimmed[1] === "\\") return "/";
  return trimmed;
}
