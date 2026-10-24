import type { SitePage } from "./navigationPolicy";

// Left-edge zone, in CSS pixels. Touches that start further in belong to the page
// (ticker, reel, dish), so they are not treated as back.
export const EDGE_START_PX = 28;
export const EDGE_DEADZONE_PX = 10;
export const EDGE_COMMIT_DX = 72;
export const EDGE_FLICK_DX = 42;
// PanResponder and this helper use px per millisecond.
export const EDGE_FLICK_V = 0.55;

export type BackAction = "window" | "history" | "home" | "none";

export function chooseBackAction(input: {
  windowOpen: boolean;
  canGoBack: boolean;
  page: SitePage;
  hasWebView: boolean;
  offline: boolean;
}): BackAction {
  if (input.windowOpen && input.hasWebView) return "window";
  if (input.canGoBack && input.hasWebView) return "history";
  if (input.page !== "home" && input.page !== "other" && !input.offline) return "home";
  return "none";
}

// A horizontal move to the right, clearly stronger than the vertical move.
export function isEdgeBackMove(dx: number, dy: number): boolean {
  return dx > EDGE_DEADZONE_PX && dx > Math.abs(dy) * 1.2;
}

export function shouldCommitEdgeBack(dx: number, dy: number, dtMs: number, canBack: boolean): boolean {
  if (!canBack) return false;
  if (!isEdgeBackMove(dx, dy)) return false;
  if (dx >= EDGE_COMMIT_DX) return true;
  const dt = dtMs > 0 ? dtMs : 1;
  const vx = dx / dt;
  return dx >= EDGE_FLICK_DX && vx >= EDGE_FLICK_V;
}
