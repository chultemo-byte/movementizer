import { aiConfigured, screenStill } from "../../lib/ground/ai.js";
import { getClip, removeClipMedia, setClipStatus } from "../../lib/ground/db.js";
import { fail, json, problem, readJson } from "../../lib/ground/http.js";
import { decideStatus, publicLabel } from "../../lib/ground/moderation.js";
import { movementFromHtml } from "../../lib/ground/movement.js";
import { cleanId } from "../../lib/ground/text.js";

export async function POST(request) {
  try {
    const body = await readJson(request);
    const clipId = cleanId(body && body.clipId);
    const viewer = cleanId(body && body.viewerId);
    if (!clipId || !viewer) throw problem("Missing clip.", 400);
    const clip = await ownClip(clipId, viewer);
    if (clip.status !== "pending" && clip.status !== "needs_review") {
      return json({ status: clip.status, label: publicLabel(clip.status) });
    }
    if (!aiConfigured()) {
      const status = decideStatus({ trusted: clip.trusted, aiConfigured: false, verdict: null });
      if (status !== clip.status) await setClipStatus(clipId, status, { skipped: true });
      return json({ status, label: publicLabel(status), skipped: true });
    }
    const poster = decodePoster(body && body.poster);
    if (!poster) throw problem("A still frame is required for the check.", 400);
    const context = await movementContext(request, clip.movement_slug, clip.movement_title);
    try {
      const verdict = await screenStill({
        bytes: poster,
        mediaType: "image/jpeg",
        title: context.title,
        claim: context.claim,
        caption: clip.caption,
      });
      const status = decideStatus({ trusted: clip.trusted, aiConfigured: true, verdict });
      await setClipStatus(clipId, status, verdict);
      if (status === "rejected") await removeClipMedia(clipId);
      return json({ status, label: publicLabel(status) });
    } catch {
      return json({ status: "pending", label: publicLabel("pending"), skipped: true });
    }
  } catch (error) {
    return fail(error);
  }
}

async function ownClip(clipId, viewer) {
  for (let attempt = 0; attempt < 10; attempt += 1) {
    const clip = await getClip(clipId);
    if (clip) {
      if (clip.poster_id !== viewer) throw problem("That clip is not yours.", 403);
      return clip;
    }
    if (attempt < 9) await new Promise((resolve) => setTimeout(resolve, 500));
  }
  throw problem("That clip is not ready yet. Try again in a moment.", 409);
}

function decodePoster(value) {
  const text = String(value || "").replace(/^data:image\/jpeg;base64,/, "");
  if (!text || text.length > 1_800_000) return null;
  try {
    const bytes = Buffer.from(text, "base64");
    if (bytes.length < 32 || bytes.length > 1_200_000) return null;
    return bytes;
  } catch {
    return null;
  }
}

async function movementContext(request, slug, fallbackTitle) {
  try {
    const host = request.headers.get("x-forwarded-host") || request.headers.get("host");
    const proto = request.headers.get("x-forwarded-proto") || "https";
    if (!host) return { title: fallbackTitle, claim: "" };
    const response = await fetch(proto + "://" + host + "/", { headers: { accept: "text/html" } });
    if (!response.ok) return { title: fallbackTitle, claim: "" };
    return movementFromHtml(await response.text(), slug) || { title: fallbackTitle, claim: "" };
  } catch {
    return { title: fallbackTitle, claim: "" };
  }
}
