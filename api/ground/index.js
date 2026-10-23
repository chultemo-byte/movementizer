import { listFeed } from "../../lib/ground/db.js";
import { blobAccess, fail, json, problem } from "../../lib/ground/http.js";
import { publicLabel } from "../../lib/ground/moderation.js";
import { cleanId, cleanSlug } from "../../lib/ground/text.js";

export async function GET(request) {
  try {
    const url = new URL(request.url);
    const slug = cleanSlug(url.searchParams.get("slug"));
    const viewer = cleanId(url.searchParams.get("viewer")) || "";
    if (!slug) throw problem("Unknown movement.", 400);
    const rows = await listFeed(slug, viewer);
    return json({
      blobAccess: blobAccess(),
      clips: rows.map((row) => ({
        id: row.id,
        kind: row.kind,
        caption: row.caption,
        place: row.place_note,
        handle: row.handle,
        posterId: row.poster_id,
        status: row.status,
        label: row.status === "approved" ? "" : publicLabel(row.status),
        createdAt: row.created_at,
        durationSec: row.duration_sec,
        mine: row.poster_id === viewer,
        media: "/api/ground/media?id=" + row.id,
      })),
    });
  } catch (error) {
    return fail(error);
  }
}
