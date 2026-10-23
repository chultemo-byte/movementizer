import { MAX_CAPTION, MAX_PLACE, MAX_REASON } from "./limits.js";

const WORDS = [
  "cedar", "harbor", "lantern", "pebble", "north", "quiet", "amber", "river",
  "field", "spark", "willow", "copper", "maple", "stone", "cloud", "brook",
];

const BLOCKED = [
  /\b(porn|porno|xxx|onlyfans|nude|nudes)\b/i,
  /\b(nigger|nigga|faggot|retard|kike|spic|chink)\b/i,
  /\b(kill yourself|kys)\b/i,
];

export function makeHandle() {
  const word = WORDS[Math.floor(Math.random() * WORDS.length)];
  const n = 1000 + Math.floor(Math.random() * 9000);
  return word + "-" + n;
}

export function cleanHandle(value) {
  const handle = String(value || "").trim().toLowerCase();
  if (!/^[a-z][a-z0-9-]{2,22}$/.test(handle)) return null;
  return handle;
}

export function cleanSlug(value) {
  const slug = String(value || "").trim().toLowerCase();
  if (!/^[a-z0-9-]{1,80}$/.test(slug)) return null;
  return slug;
}

export function cleanId(value) {
  const id = String(value || "").trim().toLowerCase();
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/.test(id)) return null;
  return id;
}

export function cleanCaption(value) {
  return String(value || "").replace(/\s+/g, " ").trim().slice(0, MAX_CAPTION);
}

export function captionProblem(value) {
  const text = cleanCaption(value);
  if (!text) return null;
  if (text.length > MAX_CAPTION) return "Caption is too long.";
  const links = text.match(/https?:\/\//gi);
  if (links && links.length > 0) return "Leave links out of the caption.";
  if (/(.)\1{11,}/.test(text)) return "Rewrite the caption.";
  for (const pattern of BLOCKED) {
    if (pattern.test(text)) return "That caption is not allowed. Rewrite it.";
  }
  return null;
}

export function cleanPlace(value, optedIn) {
  if (!optedIn) return null;
  const place = String(value || "").replace(/\s+/g, " ").trim().slice(0, MAX_PLACE);
  return place || null;
}

export function cleanReason(value) {
  const reason = String(value || "").replace(/\s+/g, " ").trim().slice(0, MAX_REASON);
  if (reason.length < 3) return null;
  return reason;
}

export function termsStamp(value) {
  const time = Date.parse(String(value || ""));
  if (!Number.isFinite(time)) return null;
  const now = Date.now();
  if (time > now + 5 * 60 * 1000) return null;
  if (now - time > 1000 * 60 * 60 * 24 * 365 * 5) return null;
  return new Date(time).toISOString();
}
