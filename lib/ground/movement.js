export function movementFromHtml(html, slug) {
  const source = String(html || "");
  const needle = `data-slug="${slug}"`;
  const at = source.indexOf(needle);
  if (at < 0) return null;
  const around = source.slice(at, at + 2500);
  const claim = /data-claim="([^"]*)"/.exec(around);
  const title = /<strong>([^<]*)<\/strong>/.exec(around);
  return {
    title: decode(title ? title[1] : slug),
    claim: decode(claim ? claim[1] : ""),
  };
}

function decode(value) {
  return String(value || "")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .trim();
}
