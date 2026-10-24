import { readFileSync } from "node:fs";
import { diffStatuses, notificationBody, parseMovementStatuses } from "./movementStatus";
import { decideNavigation, pageFromUrl, shareUrlOnSite } from "./navigationPolicy";

const html = readFileSync(new URL("../../index.html", import.meta.url), "utf8");
const snapshot = parseMovementStatuses(html);
const slugs = Object.keys(snapshot);

if (slugs.length < 8) {
  throw new Error("Expected the live registry to parse, got " + slugs.length);
}
if (snapshot["maricarmen"]?.status !== "Live") {
  throw new Error("maricarmen should be Live");
}
if (snapshot["france-schools"]?.status !== "Still on") {
  throw new Error("france-schools should be Still on");
}
if (snapshot["india-farmers"]?.status !== "Fulfilled") {
  throw new Error("india-farmers should be Fulfilled");
}
if (snapshot["nokings"]?.status !== "Still on") {
  throw new Error("nokings should stay Still on when it also appears in the pulse list");
}

const changed = diffStatuses(
  { "france-schools": { name: "France school movement", status: "Live" } },
  { "france-schools": { name: "France school movement", status: "Still on" } },
);
if (!notificationBody(changed).includes("Still on")) {
  throw new Error("Status change text missing");
}

if (decideNavigation("https://movementizer.com/?w=nokings", true) !== "allow") {
  throw new Error("Site navigation should stay in the app");
}
for (const path of ["/privacy", "/terms", "/support"]) {
  if (decideNavigation("https://movementizer.com" + path, true) !== "allow") {
    throw new Error(path + " should open inside the app");
  }
  if (decideNavigation(path, true) !== "allow") {
    throw new Error("Relative " + path + " should open inside the app");
  }
}
if (decideNavigation("javascript:alert(1)", true) !== "ignore") {
  throw new Error("Script URLs should not be opened");
}
if (decideNavigation("mailto:hridaya.8888@gmail.com", true) !== "external") {
  throw new Error("Mail links should leave the web view");
}

if (pageFromUrl("https://movementizer.com/privacy/") !== "privacy") {
  throw new Error("Privacy path should be recognized");
}
if (pageFromUrl("https://movementizer.com/terms") !== "terms") {
  throw new Error("Terms path should be recognized");
}
if (pageFromUrl("https://www.movementizer.com/support") !== "support") {
  throw new Error("Support path should be recognized");
}
if (pageFromUrl("https://movementizer.com/?w=nokings") !== "home") {
  throw new Error("A movement window is still the radar");
}

const radarAt = html.indexOf('id="radar"');
const privacyAt = html.indexOf('href="/privacy"');
const termsAt = html.indexOf('href="/terms"');
const supportAt = html.indexOf('href="/support"');
if (privacyAt < 0 || termsAt < 0 || supportAt < 0 || privacyAt > radarAt) {
  throw new Error("Privacy, Terms, and Support should be linked above the radar");
}
if (decideNavigation("https://www.youtube.com/watch?v=abc", true) !== "external") {
  throw new Error("External links should leave the app");
}
if (decideNavigation("https://www.youtube-nocookie.com/embed/abc", false) !== "allow") {
  throw new Error("Video frames should stay in the page");
}
if (shareUrlOnSite("https://movementizer.com/?w=nokings") === null) {
  throw new Error("Share URL on the site should be accepted");
}
if (shareUrlOnSite("https://example.com/") !== null) {
  throw new Error("Off-site share URL should be rejected");
}

console.log("checks ok", slugs.length, "windows");
