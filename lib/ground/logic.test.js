import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { movementFromHtml } from "./movement.js";
import { decideStatus, statusAfterReports, verdictFromModel } from "./moderation.js";
import { captionProblem, cleanHandle, termsStamp } from "./text.js";

test("caption filter rejects a link and allows a plain sentence", () => {
  assert.equal(captionProblem("People in the square"), null);
  assert.match(captionProblem("see https://example.com"), /links/i);
  assert.match(captionProblem("this is porn"), /not allowed/i);
});

test("handles stay anonymous and short", () => {
  assert.equal(cleanHandle("Cedar-12"), "cedar-12");
  assert.equal(cleanHandle("lantern-4401"), "lantern-4401");
  assert.equal(cleanHandle("a real name"), null);
});

test("terms stamp rejects an empty value", () => {
  assert.equal(termsStamp(""), null);
  assert.ok(termsStamp(new Date().toISOString()));
});

test("clear junk is rejected and protest violence waits for a person", () => {
  const gore = verdictFromModel({ relevant: true, nudity: false, violence: true, gore: true, spam: false, reason: "Injury." });
  assert.equal(gore.reject, true);
  const protest = verdictFromModel({ relevant: true, nudity: false, violence: true, gore: false, spam: false, reason: "A crowd." });
  assert.equal(protest.reject, false);
  assert.equal(decideStatus({ trusted: false, aiConfigured: true, verdict: protest }), "needs_review");
  assert.equal(decideStatus({ trusted: true, aiConfigured: true, verdict: protest }), "approved");
  assert.equal(decideStatus({ trusted: true, aiConfigured: true, verdict: gore }), "rejected");
  assert.equal(decideStatus({ trusted: false, aiConfigured: false, verdict: null }), "pending");
  assert.equal(decideStatus({ trusted: true, aiConfigured: false, verdict: null }), "approved");
});

test("three reports hide an approved clip", () => {
  assert.equal(statusAfterReports("approved", 2), "approved");
  assert.equal(statusAfterReports("approved", 3), "hidden");
  assert.equal(statusAfterReports("pending", 5), "pending");
});

test("the live registry can name a movement for the check", () => {
  const html = readFileSync(new URL("../../index.html", import.meta.url), "utf8");
  const found = movementFromHtml(html, "maricarmen");
  assert.ok(found);
  assert.match(found.title, /Maricarmen/);
  assert.match(found.claim, /Housing/);
});
