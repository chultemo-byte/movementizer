import { MAX_VIDEO_BYTES, MAX_VIDEO_SECONDS } from "./limits.js";
import { problem } from "./http.js";
import {
  captionProblem,
  cleanCaption,
  cleanHandle,
  cleanId,
  cleanPlace,
  cleanSlug,
  termsStamp,
} from "./text.js";

const EXT = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "video/mp4": "mp4",
  "video/webm": "webm",
  "video/quicktime": "mov",
};

export function parseClientPayload(raw) {
  let data;
  try {
    data = JSON.parse(String(raw || ""));
  } catch {
    throw problem("The upload is missing its details.", 400);
  }
  const id = cleanId(data.clipId);
  const posterId = cleanId(data.posterId);
  const handle = cleanHandle(data.handle);
  const slug = cleanSlug(data.slug);
  const termsAt = termsStamp(data.termsAt);
  const caption = cleanCaption(data.caption);
  const place = cleanPlace(data.place, Boolean(data.placeOptIn));
  const kind = data.kind === "video" ? "video" : data.kind === "photo" ? "photo" : null;
  const contentType = String(data.contentType || "");
  const bytes = Number(data.bytes);
  const durationSec = data.durationSec == null ? null : Number(data.durationSec);
  const title = String(data.title || slug || "").replace(/\s+/g, " ").trim().slice(0, 160);
  if (!id || !posterId || !handle || !slug || !termsAt || !kind || !title) {
    throw problem("The upload is missing a required field.", 400);
  }
  if (!EXT[contentType]) throw problem("Use a photo (JPEG, PNG, WebP) or a video (MP4, WebM, MOV).", 400);
  if (kind === "photo" && !contentType.startsWith("image/")) throw problem("That file is not a photo.", 400);
  if (kind === "video" && !contentType.startsWith("video/")) throw problem("That file is not a video.", 400);
  const captionError = captionProblem(caption);
  if (captionError) throw problem(captionError, 400);
  if (!Number.isFinite(bytes) || bytes < 1 || bytes > MAX_VIDEO_BYTES) {
    throw problem("The file is too large. Keep video under 32 MB and photos under 8 MB.", 400);
  }
  if (kind === "photo" && bytes > 8 * 1024 * 1024) throw problem("That photo is over 8 MB.", 400);
  if (kind === "video") {
    if (!Number.isFinite(durationSec) || durationSec < 0.2 || durationSec > MAX_VIDEO_SECONDS + 0.5) {
      throw problem("Video must be 60 seconds or less.", 400);
    }
  }
  return {
    id,
    posterId,
    handle,
    slug,
    title,
    termsAt,
    caption,
    place,
    kind,
    contentType,
    bytes: Math.round(bytes),
    durationSec: kind === "video" ? Math.round(durationSec * 10) / 10 : null,
    ext: EXT[contentType],
  };
}

export function pathMatches(pathname, payload) {
  return pathname === `ground/${payload.id}.${payload.ext}`;
}
