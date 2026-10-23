import { randomUUID } from "node:crypto";
import { addReport } from "../../lib/ground/db.js";
import { fail, json, problem, readJson } from "../../lib/ground/http.js";
import { captionProblem, cleanId, cleanReason } from "../../lib/ground/text.js";

export async function POST(request) {
  try {
    const body = await readJson(request);
    const clipId = cleanId(body && body.clipId);
    const reporterId = cleanId(body && body.reporterId);
    const reason = cleanReason(body && body.reason);
    if (!clipId || !reporterId || !reason) throw problem("Say why you are reporting this clip.", 400);
    const blocked = captionProblem(reason);
    if (blocked) throw problem(blocked, 400);
    const result = await addReport({ id: randomUUID(), clipId, reporterId, reason });
    return json({ ok: true, hidden: result.hidden });
  } catch (error) {
    return fail(error);
  }
}
