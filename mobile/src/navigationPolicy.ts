export const SITE_URL = "https://movementizer.com";

const SITE_HOSTS = new Set(["movementizer.com", "www.movementizer.com"]);

export type NavDecision = "allow" | "external" | "ignore";

export function decideNavigation(
  url: string,
  isTopFrame: boolean | undefined,
  mainDocumentURL?: string,
): NavDecision {
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return "ignore";
  }
  if (parsed.protocol === "about:") return "allow";
  const web = parsed.protocol === "http:" || parsed.protocol === "https:";
  if (!web) return "external";
  if (isSubframe(parsed, isTopFrame, mainDocumentURL)) return "allow";
  if (SITE_HOSTS.has(parsed.hostname)) return "allow";
  return "external";
}

function isSubframe(parsed: URL, isTopFrame: boolean | undefined, mainDocumentURL?: string): boolean {
  if (isTopFrame === false) return true;
  if (isTopFrame === true) return false;
  if (!mainDocumentURL) return false;
  try {
    const main = new URL(mainDocumentURL);
    return SITE_HOSTS.has(main.hostname) && main.href !== parsed.href;
  } catch {
    return false;
  }
}

export function shareUrlOnSite(url: string): string | null {
  try {
    const parsed = new URL(url);
    if (parsed.protocol !== "https:") return null;
    if (!SITE_HOSTS.has(parsed.hostname)) return null;
    return parsed.toString();
  } catch {
    return null;
  }
}
