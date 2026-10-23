import { upload } from "@vercel/blob/client";

window.movementizerUpload = function movementizerUpload(file, payload, access) {
  const ext = extFor(payload.contentType);
  return upload("ground/" + payload.clipId + "." + ext, file, {
    access: access === "public" ? "public" : "private",
    handleUploadUrl: "/api/ground/upload",
    contentType: payload.contentType,
    clientPayload: JSON.stringify(payload),
  });
};

function extFor(type) {
  if (type === "image/png") return "png";
  if (type === "image/webp") return "webp";
  if (type === "video/mp4") return "mp4";
  if (type === "video/webm") return "webm";
  if (type === "video/quicktime") return "mov";
  return "jpg";
}
