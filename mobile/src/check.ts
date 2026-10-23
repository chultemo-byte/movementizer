import { readFileSync } from "node:fs";
import { diffStatuses, notificationBody, parseMovementStatuses } from "./movementStatus";
import { decideNavigation, shareUrlOnSite } from "./navigationPolicy";

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
