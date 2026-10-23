import { banPoster, listQueue, setClipStatus, setTrusted, removeClipMedia } from "../../lib/ground/db.js";
import { adminOk, fail, json, problem, readJson } from "../../lib/ground/http.js";
import { cleanId } from "../../lib/ground/text.js";

export async function GET(request) {
  try {
    gate(request);
    const rows = await listQueue();
    return json({
      clips: rows.map((row) => ({
        id: row.id,
        slug: row.movement_slug,
        title: row.movement_title,
        kind: row.kind,
        caption: row.caption,
        place: row.place_note,
        handle: row.handle,
        posterId: row.poster_id,
        status: row.status,
        trusted: row.trusted,
        ai: row.ai_json,
        createdAt: row.created_at,
        durationSec: row.duration_sec,
        media: "/api/ground/media?id=" + row.id,
      })),
    });
  } catch (error) {
    return fail(error);
  }
}

export async function POST(request) {
  try {
    gate(request);
    const body = await readJson(request);
    const action = String(body && body.action || "");
    if (action === "approve" || action === "reject") {
      const id = cleanId(body.clipId);
      if (!id) throw problem("Missing clip.", 400);
      const status = action === "approve" ? "approved" : "rejected";
      await setClipStatus(id, status, { by: "admin" });
      if (status === "rejected") await removeClipMedia(id);
      return json({ ok: true, status });
    }
    if (action === "ban" || action === "trust" || action === "untrust") {
      const posterId = cleanId(body.posterId);
      if (!posterId) throw problem("Missing poster.", 400);
      if (action === "ban") {
        const removed = await banPoster(posterId);
        return json({ ok: true, removed });
      }
      const poster = await setTrusted(posterId, action === "trust");
      if (!poster) throw problem("Poster not found.", 404);
      return json({ ok: true, trusted: poster.trusted });
    }
    throw problem("Unknown action.", 400);
  } catch (error) {
    return fail(error);
  }
}

function gate(request) {
  if (!process.env.ADMIN_TOKEN) throw problem("ADMIN_TOKEN is not set.", 503);
  if (!adminOk(request)) throw problem("Admin sign-in failed.", 401);
}
