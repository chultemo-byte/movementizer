import * as FileSystem from "expo-file-system/legacy";
import * as ImageManipulator from "expo-image-manipulator";
import * as ImagePicker from "expo-image-picker";
import * as VideoThumbnails from "expo-video-thumbnails";
import { SITE_URL } from "./navigationPolicy";

const MAX_VIDEO_SECONDS = 60;
const MAX_VIDEO_BYTES = 32 * 1024 * 1024;
const MAX_IMAGE_BYTES = 8 * 1024 * 1024;

export type GroundRequest = {
  action?: string;
  slug?: string;
  title?: string;
  caption?: string;
  handle?: string;
  place?: string;
  placeOptIn?: boolean;
  termsAt?: string;
  posterId?: string;
};

type Prepared = {
  uri: string;
  type: string;
  name: string;
  kind: "photo" | "video";
  bytes: number;
  durationSec: number | null;
  poster: string;
};

export async function captureGroundClip(request: GroundRequest): Promise<string | null | "cancelled"> {
  const action = request.action || "";
  const camera = action === "record-video" || action === "record-photo";
  if (camera) {
    const cam = await ImagePicker.requestCameraPermissionsAsync();
    if (!cam.granted) return "Camera permission is off.";
  } else {
    const library = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!library.granted) return "Photo library permission is off.";
  }

  const picked = camera
    ? await ImagePicker.launchCameraAsync({
        mediaTypes: action === "record-video" ? ["videos"] : ["images"],
        videoMaxDuration: MAX_VIDEO_SECONDS,
        videoQuality: ImagePicker.UIImagePickerControllerQualityType.Medium,
        exif: false,
      })
    : await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ["images", "videos"],
        videoMaxDuration: MAX_VIDEO_SECONDS,
        exif: false,
      });
  if (picked.canceled || !picked.assets[0]) return "cancelled";

  const prepared = await prepareAsset(picked.assets[0]);
  const payload = {
    clipId: globalThis.crypto.randomUUID(),
    posterId: request.posterId,
    handle: request.handle,
    slug: request.slug,
    title: request.title,
    caption: request.caption || "",
    place: request.placeOptIn ? request.place || "" : "",
    placeOptIn: Boolean(request.placeOptIn),
    termsAt: request.termsAt,
    kind: prepared.kind,
    contentType: prepared.type,
    bytes: prepared.bytes,
    durationSec: prepared.durationSec,
  };
  const pathname = "ground/" + payload.clipId + "." + extFor(prepared.type);
  await putPrivateBlob(pathname, prepared.uri, prepared.type, JSON.stringify(payload));
  const screened = await fetch(SITE_URL + "/api/ground/screen", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      clipId: payload.clipId,
      viewerId: payload.posterId,
      poster: prepared.poster,
    }),
  });
  const screenedBody = await screened.json().catch(() => ({}));
  if (!screened.ok) {
    const message = typeof screenedBody.error === "string" ? screenedBody.error : "The clip was not posted.";
    throw new Error(message);
  }
  return null;
}

// The Blob client package pulls in Node modules, so the app speaks the
// client-upload handshake directly: token from our API, then a binary PUT.
async function putPrivateBlob(pathname: string, fileUri: string, contentType: string, clientPayload: string): Promise<void> {
  const tokenResponse = await fetch(SITE_URL + "/api/ground/upload", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      type: "blob.generate-client-token",
      payload: { pathname, clientPayload, multipart: false },
    }),
  });
  const tokenBody = await tokenResponse.json().catch(() => ({}));
  const token = typeof tokenBody.clientToken === "string" ? tokenBody.clientToken : "";
  if (!tokenResponse.ok || !token) {
    throw new Error(typeof tokenBody.error === "string" ? tokenBody.error : "The upload could not start.");
  }
  const storeId = token.split("_")[3] || "";
  if (!storeId) throw new Error("The upload token was not valid.");
  const url = "https://vercel.com/api/blob/?" + new URLSearchParams({ pathname }).toString();
  const uploaded = await FileSystem.uploadAsync(url, fileUri, {
    httpMethod: "PUT",
    uploadType: FileSystem.FileSystemUploadType.BINARY_CONTENT,
    headers: {
      authorization: "Bearer " + token,
      "content-type": contentType,
      "x-content-type": contentType,
      "x-vercel-blob-access": "private",
      "x-vercel-blob-store-id": storeId,
      "x-api-version": "13",
      "x-api-blob-request-attempt": "0",
      "x-api-blob-request-id": storeId + ":" + Date.now() + ":" + Math.random().toString(16).slice(2),
    },
  });
  if (uploaded.status < 200 || uploaded.status >= 300) {
    let message = "The clip was not posted.";
    try {
      const parsed = JSON.parse(uploaded.body) as { error?: string };
      if (parsed.error) message = parsed.error;
    } catch {
      message = "The clip was not posted.";
    }
    throw new Error(message);
  }
}

async function prepareAsset(asset: ImagePicker.ImagePickerAsset): Promise<Prepared> {
  const video = asset.type === "video" || (asset.duration != null && asset.duration > 0);
  if (video) {
    const durationSec = (asset.duration || 0) / 1000;
    if (durationSec > MAX_VIDEO_SECONDS + 0.5) throw new Error("Video must be 60 seconds or less.");
    const info = await FileSystem.getInfoAsync(asset.uri);
    const bytes = info.exists && "size" in info && info.size ? info.size : asset.fileSize || 0;
    if (!bytes || bytes > MAX_VIDEO_BYTES) throw new Error("That video is over 32 MB.");
    let poster = "";
    try {
      const thumb = await VideoThumbnails.getThumbnailAsync(asset.uri, { time: 200 });
      const small = await ImageManipulator.manipulateAsync(thumb.uri, [{ resize: { width: 640 } }], {
        compress: 0.7,
        format: ImageManipulator.SaveFormat.JPEG,
        base64: true,
      });
      poster = small.base64 || "";
    } catch {
      poster = "";
    }
    const type = asset.mimeType || "video/mp4";
    return { uri: asset.uri, type, name: "ground", kind: "video", bytes, durationSec, poster };
  }

  const saved = await ImageManipulator.manipulateAsync(
    asset.uri,
    [{ resize: { width: 1600 } }],
    { compress: 0.82, format: ImageManipulator.SaveFormat.JPEG, base64: true },
  );
  const info = await FileSystem.getInfoAsync(saved.uri);
  const bytes = info.exists && "size" in info && info.size ? info.size : 0;
  if (!bytes || bytes > MAX_IMAGE_BYTES) throw new Error("That photo is over 8 MB.");
  return {
    uri: saved.uri,
    type: "image/jpeg",
    name: "ground.jpg",
    kind: "photo",
    bytes,
    durationSec: null,
    poster: saved.base64 || "",
  };
}

function extFor(type: string): string {
  if (type === "image/png") return "png";
  if (type === "image/webp") return "webp";
  if (type === "video/webm") return "webm";
  if (type === "video/quicktime") return "mov";
  if (type === "video/mp4") return "mp4";
  return "jpg";
}
