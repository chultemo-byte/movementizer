export const SITE_URL = "https://movementizer.com";

const SITE_HOSTS = new Set(["movementizer.com", "www.movementizer.com"]);

export type NavDecision = "allow" | "external" | "ignore";
export type SitePage = "home" | "privacy" | "terms" | "support" | "other";

const PAGE_PATHS: Record<Exclude<SitePage, "home" | "other">, string> = {
  privacy: "/privacy",
  terms: "/terms",
  support: "/support",
};

export function parseSiteUrl(url: string): URL | null {
  try {
    return new URL(url);
  } catch {
    try {
      return new URL(url, SITE_URL);
    } catch {
      return null;
    }
  }
}

export function pageFromUrl(url: string): SitePage {
  const parsed = parseSiteUrl(url);
  if (!parsed || !SITE_HOSTS.has(parsed.hostname)) return "other";
  const path = parsed.pathname.replace(/\/+$/, "") || "/";
  if (path === "/") return "home";
  if (path === PAGE_PATHS.privacy) return "privacy";
  if (path === PAGE_PATHS.terms) return "terms";
  if (path === PAGE_PATHS.support) return "support";
  return "other";
}

export function decideNavigation(
  url: string,
  isTopFrame: boolean | undefined,
  mainDocumentURL?: string,
): NavDecision {
  const parsed = parseSiteUrl(url);
  if (!parsed) return "ignore";
  if (parsed.protocol === "about:") return "allow";
  if (parsed.protocol === "javascript:" || parsed.protocol === "data:") return "ignore";
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
