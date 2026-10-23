import { neon } from "@neondatabase/serverless";
import { del } from "@vercel/blob";
import { HIDE_AFTER_REPORTS, POSTS_PER_HOUR } from "./limits.js";
import { problem } from "./http.js";

let sql;
let ready;

export function databaseConfigured() {
  return Boolean(process.env.DATABASE_URL);
}

function getSql() {
  if (!process.env.DATABASE_URL) throw problem("DATABASE_URL is not set.", 503);
  if (!sql) sql = neon(process.env.DATABASE_URL);
  return sql;
}

export async function ensureSchema() {
  if (ready) return;
  const db = getSql();
  await db`CREATE TABLE IF NOT EXISTS posters (
    id TEXT PRIMARY KEY,
    handle TEXT NOT NULL,
    trusted BOOLEAN NOT NULL DEFAULT FALSE,
    banned BOOLEAN NOT NULL DEFAULT FALSE,
    terms_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  )`;
  await db`CREATE TABLE IF NOT EXISTS clips (
    id TEXT PRIMARY KEY,
    movement_slug TEXT NOT NULL,
    movement_title TEXT NOT NULL,
    poster_id TEXT NOT NULL,
    handle TEXT NOT NULL,
    kind TEXT NOT NULL,
    blob_path TEXT NOT NULL,
    content_type TEXT NOT NULL,
    caption TEXT NOT NULL DEFAULT '',
    place_note TEXT,
    status TEXT NOT NULL,
    ai_json JSONB,
    duration_sec NUMERIC,
    bytes INTEGER,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  )`;
  await db`CREATE TABLE IF NOT EXISTS reports (
    id TEXT PRIMARY KEY,
    clip_id TEXT NOT NULL,
    reporter_id TEXT NOT NULL,
    reason TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (clip_id, reporter_id)
  )`;
  await db`CREATE INDEX IF NOT EXISTS clips_slug_created ON clips (movement_slug, created_at DESC)`;
  await db`CREATE INDEX IF NOT EXISTS clips_status_created ON clips (status, created_at)`;
  ready = true;
}

export async function upsertPoster({ id, handle, termsAt }) {
  await ensureSchema();
  const db = getSql();
  const rows = await db`
    INSERT INTO posters (id, handle, terms_at)
    VALUES (${id}, ${handle}, ${termsAt})
    ON CONFLICT (id) DO UPDATE SET handle = EXCLUDED.handle, terms_at = COALESCE(posters.terms_at, EXCLUDED.terms_at)
    RETURNING id, handle, trusted, banned
  `;
  return rows[0];
}

export async function recentPostCount(posterId) {
  await ensureSchema();
  const db = getSql();
  const rows = await db`
    SELECT COUNT(*)::int AS n FROM clips
    WHERE poster_id = ${posterId} AND created_at > NOW() - INTERVAL '1 hour'
  `;
  return rows[0]?.n || 0;
}

export async function assertCanPost(poster) {
  if (poster.banned) throw problem("This poster is blocked from posting.", 403);
  const count = await recentPostCount(poster.id);
  if (count >= POSTS_PER_HOUR) throw problem("Too many posts in the last hour. Wait and try again.", 429);
}

export async function insertClip(clip) {
  await ensureSchema();
  const db = getSql();
  await db`
    INSERT INTO clips (
      id, movement_slug, movement_title, poster_id, handle, kind, blob_path, content_type,
      caption, place_note, status, duration_sec, bytes
    ) VALUES (
      ${clip.id}, ${clip.slug}, ${clip.title}, ${clip.posterId}, ${clip.handle}, ${clip.kind},
      ${clip.blobPath}, ${clip.contentType}, ${clip.caption}, ${clip.place}, 'pending',
      ${clip.durationSec}, ${clip.bytes}
    )
    ON CONFLICT (id) DO NOTHING
  `;
}

export async function getClip(id) {
  await ensureSchema();
  const db = getSql();
  const rows = await db`
    SELECT c.*, p.banned, p.trusted
    FROM clips c JOIN posters p ON p.id = c.poster_id
    WHERE c.id = ${id}
  `;
  return rows[0] || null;
}

export async function listFeed(slug, viewerId) {
  await ensureSchema();
  const db = getSql();
  return db`
    SELECT c.id, c.kind, c.caption, c.place_note, c.handle, c.poster_id, c.status, c.created_at, c.duration_sec
    FROM clips c
    JOIN posters p ON p.id = c.poster_id
    WHERE c.movement_slug = ${slug}
      AND p.banned = FALSE
      AND (
        c.status = 'approved'
        OR (c.poster_id = ${viewerId} AND c.status IN ('pending', 'needs_review', 'rejected', 'hidden'))
      )
    ORDER BY c.created_at DESC
    LIMIT 40
  `;
}

export async function listQueue() {
  await ensureSchema();
  const db = getSql();
  return db`
    SELECT c.id, c.movement_slug, c.movement_title, c.kind, c.caption, c.place_note, c.handle,
           c.poster_id, c.status, c.ai_json, c.created_at, c.duration_sec, p.trusted
    FROM clips c
    JOIN posters p ON p.id = c.poster_id
    WHERE c.status IN ('pending', 'needs_review') AND p.banned = FALSE
    ORDER BY c.created_at ASC
    LIMIT 80
  `;
}

export async function setClipStatus(id, status, aiJson) {
  await ensureSchema();
  const db = getSql();
  await db`
    UPDATE clips
    SET status = ${status}, ai_json = COALESCE(${aiJson ? JSON.stringify(aiJson) : null}::jsonb, ai_json)
    WHERE id = ${id}
  `;
}

export async function addReport({ id, clipId, reporterId, reason }) {
  await ensureSchema();
  const db = getSql();
  const clip = await getClip(clipId);
  if (!clip || clip.status !== "approved" || clip.banned) throw problem("That clip is not public.", 404);
  if (clip.poster_id === reporterId) throw problem("You cannot report your own clip.", 400);
  await db`
    INSERT INTO reports (id, clip_id, reporter_id, reason)
    VALUES (${id}, ${clipId}, ${reporterId}, ${reason})
    ON CONFLICT (clip_id, reporter_id) DO NOTHING
  `;
  const rows = await db`SELECT COUNT(*)::int AS n FROM reports WHERE clip_id = ${clipId}`;
  const count = rows[0]?.n || 0;
  let hidden = false;
  if (count >= HIDE_AFTER_REPORTS) {
    await db`UPDATE clips SET status = 'hidden' WHERE id = ${clipId} AND status = 'approved'`;
    hidden = true;
  }
  return { count, hidden };
}

export async function setTrusted(posterId, trusted) {
  await ensureSchema();
  const db = getSql();
  const rows = await db`
    UPDATE posters SET trusted = ${trusted} WHERE id = ${posterId} RETURNING id, handle, trusted
  `;
  return rows[0] || null;
}

export async function banPoster(posterId) {
  await ensureSchema();
  const db = getSql();
  const clips = await db`
    SELECT id, blob_path FROM clips
    WHERE poster_id = ${posterId} AND status <> 'rejected'
  `;
  await db`UPDATE posters SET banned = TRUE, trusted = FALSE WHERE id = ${posterId}`;
  await db`UPDATE clips SET status = 'rejected' WHERE poster_id = ${posterId}`;
  await removeBlobs(clips.map((row) => row.blob_path));
  return clips.length;
}

export async function removeClipMedia(id) {
  const clip = await getClip(id);
  if (!clip) return;
  await removeBlobs([clip.blob_path]);
}

async function removeBlobs(paths) {
  const list = paths.filter(Boolean);
  if (!list.length) return;
  try {
    await del(list);
  } catch {
    // The row is already updated. A missed delete can be retried by an admin.
  }
}
