import { HIDE_AFTER_REPORTS } from "./limits.js";

export function verdictFromModel(raw) {
  const source = raw && typeof raw === "object" ? raw : {};
  const flags = [];
  if (source.nudity) flags.push("nudity");
  if (source.violence) flags.push("violence");
  if (source.gore) flags.push("gore");
  if (source.spam) flags.push("spam");
  if (source.relevant === false) flags.push("irrelevant");
  const reject = Boolean(source.nudity || source.gore || source.spam || source.relevant === false);
  const reason = String(source.reason || "").replace(/\s+/g, " ").trim().slice(0, 400);
  return { flags, reject, reason };
}

export function decideStatus({ trusted, aiConfigured, verdict }) {
  if (verdict && verdict.reject) return "rejected";
  if (trusted) return "approved";
  if (!aiConfigured || !verdict) return "pending";
  return "needs_review";
}

export function statusAfterReports(status, reportCount) {
  if (status === "approved" && reportCount >= HIDE_AFTER_REPORTS) return "hidden";
  return status;
}

export function publicLabel(status) {
  if (status === "pending" || status === "needs_review") return "Under review";
  if (status === "rejected") return "Not posted";
  if (status === "hidden") return "Removed";
  return "";
}
