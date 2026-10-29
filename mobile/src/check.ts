import { readFileSync } from "node:fs";
import { chooseBackAction, shouldCommitEdgeBack } from "./edgeSwipe";
import { BRIDGE_JS } from "./inject";
import { diffStatuses, notificationBody, parseMovementStatuses } from "./movementStatus";
import { decideNavigation, pageFromUrl, shareUrlOnSite } from "./navigationPolicy";
import { TERMS_EFFECTIVE, TERMS_VERSION, termsAreCurrent } from "./termsGate";

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
const footerAt = html.indexOf("<footer>");
if (footerAt < 0 || footerAt < radarAt) {
  throw new Error("The footer should follow the radar");
}
const beforeFooter = html.slice(0, footerAt);
for (const path of ["/privacy", "/terms", "/support"]) {
  if (beforeFooter.includes('href="' + path + '"')) {
    throw new Error(path + " should not be linked above the footer");
  }
  if (!html.slice(footerAt).includes('href="' + path + '"')) {
    throw new Error(path + " should be linked once, in the footer");
  }
}
const termsPage = readFileSync(new URL("../../terms/index.html", import.meta.url), "utf8");
if (!termsPage.includes("Effective " + TERMS_EFFECTIVE)) {
  throw new Error("The stored terms version should match the date on the terms page");
}
if (!termsAreCurrent(TERMS_VERSION) || termsAreCurrent(null) || termsAreCurrent("2026-10-23")) {
  throw new Error("Only the current terms version should count as accepted");
}
if (!BRIDGE_JS.includes(".legal-nav{display:none")) {
  throw new Error("The app should hide the website legal links so the bar is the only place");
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

if (
  chooseBackAction({
    windowOpen: true,
    canGoBack: true,
    page: "home",
    hasWebView: true,
    offline: false,
  }) !== "window"
) {
  throw new Error("An open movement window should close before history");
}
if (
  chooseBackAction({
    windowOpen: false,
    canGoBack: false,
    page: "privacy",
    hasWebView: true,
    offline: false,
  }) !== "home"
) {
  throw new Error("Privacy with no history should return home");
}
if (
  chooseBackAction({
    windowOpen: false,
    canGoBack: true,
    page: "privacy",
    hasWebView: true,
    offline: false,
  }) !== "history"
) {
  throw new Error("Privacy with history should go back");
}
if (
  chooseBackAction({
    windowOpen: false,
    canGoBack: false,
    page: "home",
    hasWebView: true,
    offline: false,
  }) !== "none"
) {
  throw new Error("The home radar should not invent a back step");
}
if (
  chooseBackAction({
    windowOpen: false,
    canGoBack: false,
    page: "terms",
    hasWebView: true,
    offline: true,
  }) !== "none"
) {
  throw new Error("Offline should not navigate home");
}
if (!shouldCommitEdgeBack(80, 10, 200, true)) {
  throw new Error("A long right swipe should go back");
}
if (shouldCommitEdgeBack(20, 40, 200, true)) {
  throw new Error("A vertical move should not go back");
}
if (!shouldCommitEdgeBack(50, 5, 40, true)) {
  throw new Error("A short fast swipe should go back");
}
if (shouldCommitEdgeBack(80, 10, 200, false)) {
  throw new Error("A swipe should do nothing when Back is hidden");
}
if (shouldCommitEdgeBack(30, 5, 400, true)) {
  throw new Error("A short slow swipe should not go back");
}
if (!BRIDGE_JS.includes("clientX > 28") || !BRIDGE_JS.includes("dx > Math.abs(dy) * 1.2")) {
  throw new Error("The injected edge swipe should match the 28px zone and the 1.2 lock");
}
if (!BRIDGE_JS.includes("__MVZ_CAN_BACK__")) {
  throw new Error("The page should arm the edge swipe only when the shell says Back is available");
}

console.log("checks ok", slugs.length, "windows");
