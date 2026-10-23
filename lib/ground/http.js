import { timingSafeEqual } from "node:crypto";

export function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "no-store",
    },
  });
}

export async function readJson(request) {
  try {
    return await request.json();
  } catch {
    return null;
  }
}

export function fail(error) {
  const status = Number(error && error.status) || 500;
  const message = status === 500 ? "Something went wrong." : String(error.message || "Request failed.");
  return json({ error: message }, status);
}

export function problem(message, status) {
  const error = new Error(message);
  error.status = status;
  return error;
}

export function adminOk(request) {
  const expected = process.env.ADMIN_TOKEN || "";
  if (!expected) return false;
  const header = request.headers.get("authorization") || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : "";
  if (!token || token.length !== expected.length) return false;
  return timingSafeEqual(Buffer.from(token), Buffer.from(expected));
}

export function blobAccess() {
  return process.env.BLOB_ACCESS === "public" ? "public" : "private";
}
