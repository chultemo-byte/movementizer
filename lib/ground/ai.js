import { z } from "zod";
import { verdictFromModel } from "./moderation.js";

const schema = z.object({
  relevant: z.boolean(),
  nudity: z.boolean(),
  violence: z.boolean(),
  gore: z.boolean(),
  spam: z.boolean(),
  reason: z.string(),
});

export function aiConfigured() {
  if (process.env.GROUND_AI === "0") return false;
  if (process.env.AI_GATEWAY_API_KEY) return true;
  return process.env.GROUND_AI === "1" && Boolean(process.env.VERCEL_OIDC_TOKEN);
}

export async function screenStill({ bytes, mediaType, title, claim, caption }) {
  const { generateText, Output } = await import("ai");
  const result = await generateText({
    model: process.env.GROUND_AI_MODEL || "google/gemini-2.5-flash",
    output: Output.object({ schema, name: "clip_check" }),
    messages: [
      {
        role: "user",
        content: [
          { type: "text", text: prompt(title, claim, caption) },
          { type: "file", data: bytes, mediaType: mediaType || "image/jpeg" },
        ],
      },
    ],
  });
  return verdictFromModel(result.output);
}

function prompt(title, claim, caption) {
  return [
    "You are the first pass for Movementizer, a public registry of real movements.",
    "A person on the ground sent a still from a photo or video for this movement.",
    "Movement: " + title,
    "Claim: " + (claim || "(none)"),
    "Caption: " + (caption || "(none)"),
    "relevant is true when the still could plausibly be from that movement: a street, a crowd, a sign, a camp, a building, or the place named above.",
    "Nudity means sexual nudity. Gore means severe injury or a dead body shown as the subject. Spam means an ad, a meme with no scene, or a random object.",
    "Violence in a protest, such as police, smoke, or a shove, is expected. Mark violence true when you see it, but do not treat ordinary protest footage as gore.",
    "reason is one short sentence.",
  ].join("\n");
}
