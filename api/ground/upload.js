import { handleUpload } from "@vercel/blob/client";
import { assertCanPost, insertClip, upsertPoster } from "../../lib/ground/db.js";
import { blobAccess, fail, problem } from "../../lib/ground/http.js";
import { MAX_VIDEO_BYTES, ALLOWED_TYPES } from "../../lib/ground/limits.js";
import { parseClientPayload, pathMatches } from "../../lib/ground/payload.js";

export async function POST(request) {
  let body;
  try {
    body = await request.json();
  } catch {
    return fail(problem("Missing upload body.", 400));
  }
  try {
    const result = await handleUpload({
      body,
      request,
      onBeforeGenerateToken: async (pathname, clientPayload) => {
        const payload = parseClientPayload(clientPayload);
        if (!pathMatches(pathname, payload)) throw problem("Unexpected file name.", 400);
        const poster = await upsertPoster({
          id: payload.posterId,
          handle: payload.handle,
          termsAt: payload.termsAt,
        });
        await assertCanPost(poster);
        return {
          allowedContentTypes: ALLOWED_TYPES,
          maximumSizeInBytes: MAX_VIDEO_BYTES,
          addRandomSuffix: false,
          tokenPayload: JSON.stringify(payload),
        };
      },
      onUploadCompleted: async ({ blob, tokenPayload }) => {
        const payload = JSON.parse(tokenPayload || "{}");
        await insertClip({
          id: payload.id,
          slug: payload.slug,
          title: payload.title,
          posterId: payload.posterId,
          handle: payload.handle,
          kind: payload.kind,
          blobPath: blob.pathname,
          contentType: blob.contentType || payload.contentType,
          caption: payload.caption,
          place: payload.place,
          durationSec: payload.durationSec,
          bytes: payload.bytes,
        });
      },
    });
    return Response.json({ ...result, access: blobAccess() });
  } catch (error) {
    return fail(error);
  }
}
