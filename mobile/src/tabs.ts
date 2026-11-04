// Bottom tabs the iPhone actually has. Each one opens a band that is
// already on the radar, or the on-device Alerts switch. Nothing here is
// a feature the page does not already show.
export type Band = "live" | "still" | "fulfilled";

export type Tab = {
  id: "radar" | "live" | "still" | "fulfilled" | "alerts";
  label: string;
  band: Band | null;
};

export const TABS: readonly Tab[] = [
  { id: "radar", label: "Radar", band: null },
  { id: "live", label: "Live", band: "live" },
  { id: "still", label: "Still on", band: "still" },
  { id: "fulfilled", label: "Fulfilled", band: "fulfilled" },
  { id: "alerts", label: "Alerts", band: null },
];

export function bandForTab(id: Tab["id"]): Band | null {
  const tab = TABS.find((item) => item.id === id);
  return tab ? tab.band : null;
}

export function bandScript(band: Band | null): string {
  return `window.__MVZ_SET_BAND__ && window.__MVZ_SET_BAND__(${JSON.stringify(band)}); true;`;
}
