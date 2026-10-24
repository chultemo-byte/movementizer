export type StatusName = "Live" | "Still on" | "Fulfilled";

export type Snapshot = Record<string, { name: string; status: StatusName }>;

const SECTIONS: [string, StatusName][] = [
  ["live", "Live"],
  ["still", "Still on"],
  ["fulfilled", "Fulfilled"],
];

export function parseMovementStatuses(html: string): Snapshot {
  const snapshot: Snapshot = {};
  for (const [id, status] of SECTIONS) {
    const section = sectionHtml(html, id);
    if (!section) continue;
    const card = /data-slug="([^"]+)"[\s\S]*?<strong>([^<]*)<\/strong>/g;
    let match: RegExpExecArray | null;
    while ((match = card.exec(section))) {
      const slug = match[1];
      if (!slug || snapshot[slug]) continue;
      const name = decodeText(match[2] || slug);
      snapshot[slug] = { name, status };
    }
  }
  return snapshot;
}

function sectionHtml(html: string, id: string): string | null {
  const pattern = new RegExp(`<section\\b[^>]*\\bid="${id}"[^>]*>([\\s\\S]*?)<\\/section>`, "i");
  const match = pattern.exec(html);
  return match ? match[1] : null;
}

function decodeText(value: string): string {
  return value
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, " ")
    .trim();
}

export function diffStatuses(prev: Snapshot, next: Snapshot): string[] {
  const lines: string[] = [];
  for (const slug of Object.keys(next)) {
    const current = next[slug];
    const previous = prev[slug];
    if (!current) continue;
    if (!previous) {
      lines.push(`${current.name} is now on the radar (${current.status}).`);
    } else if (previous.status !== current.status) {
      lines.push(`${current.name} is now ${current.status}.`);
    }
  }
  return lines;
}

export function notificationBody(lines: string[]): string {
  if (lines.length === 0) return "";
  if (lines.length === 1) return lines[0];
  if (lines.length === 2) return `${lines[0]} ${lines[1]}`;
  return `${lines.length} windows changed. Open the radar to read them.`;
}
