// Bump this when the terms page date changes. A phone that agreed to an
// older value sees the accept screen again.
export const TERMS_VERSION = "2026-10-25";
export const TERMS_EFFECTIVE = "25 October 2026";

export function termsAreCurrent(stored: string | null): boolean {
  return stored === TERMS_VERSION;
}
