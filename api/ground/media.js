import { get } from "@vercel/blob";
import { getClip } from "../../lib/ground/db.js";
import { adminOk, blobAccess, fail, problem } from "../../lib/ground/http.js";
import { cleanId } from "../../lib/ground/text.js";

export async function GET(request) {
  try {
    const url = new URL(request.url);
    const id = cleanId(url.searchParams.get("id"));
    const viewer = cleanId(url.searchParams.get("viewer"));
    if (!id) throw problem("Missing clip.", 400);
    const clip = await getClip(id);
    if (!clip || clip.banned) throw problem("Clip not found.", 404);
    const owner = viewer && viewer === clip.poster_id;
    const allowed = adminOk(request) || clip.status === "approved" || owner;
    if (!allowed || clip.status === "rejected") throw problem("Clip not found.", 404);
    const result = await get(clip.blob_path, { access: blobAccess() });
    if (!result || result.statusCode !== 200 || !result.stream) throw problem("Clip not found.", 404);
    return new Response(result.stream, {
      headers: {
        "content-type": result.blob.contentType || clip.content_type || "application/octet-stream",
        "cache-control": clip.status === "approved" ? "public, max-age=300" : "private, no-store",
        "x-content-type-options": "nosniff",
      },
    });
  } catch (error) {
    return fail(error);
  }
}
