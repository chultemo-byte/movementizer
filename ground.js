(function () {
  const MAX_VIDEO_SECONDS = 60;
  const MAX_VIDEO_BYTES = 32 * 1024 * 1024;
  const MAX_IMAGE_BYTES = 8 * 1024 * 1024;
  const WORDS = ["cedar", "harbor", "lantern", "pebble", "north", "quiet", "amber", "river", "field", "spark", "willow", "copper", "maple", "stone", "cloud", "brook"];

  const idKey = "movementizer.ground.user";
  const handleKey = "movementizer.ground.handle";
  const termsKey = "movementizer.ground.terms";
  const blockKey = "movementizer.ground.blocked";

  function loadId() {
    let id = localStorage.getItem(idKey);
    if (!/^[0-9a-f-]{36}$/.test(id || "")) {
      id = crypto.randomUUID();
      localStorage.setItem(idKey, id);
    }
    return id;
  }

  function loadHandle() {
    let handle = localStorage.getItem(handleKey);
    if (!/^[a-z][a-z0-9-]{2,22}$/.test(handle || "")) {
      handle = WORDS[Math.floor(Math.random() * WORDS.length)] + "-" + (1000 + Math.floor(Math.random() * 9000));
      localStorage.setItem(handleKey, handle);
    }
    return handle;
  }

  function blockedSet() {
    try {
      const list = JSON.parse(localStorage.getItem(blockKey) || "[]");
      return new Set(Array.isArray(list) ? list : []);
    } catch {
      return new Set();
    }
  }

  function blockPoster(posterId) {
    const set = blockedSet();
    set.add(posterId);
    localStorage.setItem(blockKey, JSON.stringify([...set]));
  }

  function inApp() {
    return window.ReactNativeWebView && typeof window.ReactNativeWebView.postMessage === "function";
  }

  function postApp(payload) {
    window.ReactNativeWebView.postMessage(JSON.stringify(payload));
  }

  function boot() {
    const overlay = document.getElementById("window");
    if (!overlay) return;
    const inject = () => {
      const sheet = overlay.querySelector(".sheet");
      if (!sheet || sheet.querySelector(".ground")) return;
      const slug = new URLSearchParams(location.search).get("w");
      if (!slug) return;
      const title = ((sheet.querySelector("h1") || {}).textContent || slug).trim();
      sheet.appendChild(build(slug, title));
    };
    new MutationObserver(inject).observe(overlay, { childList: true });
    inject();
  }

  function build(slug, title) {
    const root = el("section", "ground");
    root.appendChild(el("h2", "ground-title", "From the ground"));
    root.appendChild(el("p", "ground-lead", "Record or upload what you can see. Clips stay under review until a person approves them. A random handle is enough. No real name."));
    const note = el("p", "ground-note");
    note.setAttribute("role", "status");
    root.appendChild(note);
    const feed = el("div", "ground-feed");
    root.appendChild(feed);
    const form = buildForm(slug, title, note, () => load(slug, feed, note));
    root.appendChild(form);
    window.__groundReload = () => {
      note.textContent = "Under review. Only you can see it until it is approved.";
      load(slug, feed, note);
    };
    window.__groundFail = (message) => { note.textContent = message || "The clip was not posted."; };
    load(slug, feed, note);
    return root;
  }

  function buildForm(slug, title, note, reload) {
    const form = el("form", "ground-form");
    form.addEventListener("submit", (event) => event.preventDefault());
    const handle = document.createElement("input");
    handle.className = "ground-input";
    handle.maxLength = 23;
    handle.value = loadHandle();
    handle.setAttribute("aria-label", "Handle");
    const caption = document.createElement("textarea");
    caption.className = "ground-input";
    caption.maxLength = 280;
    caption.rows = 2;
    caption.placeholder = "Caption, optional";
    const placeRow = el("label", "ground-check");
    const placeOn = document.createElement("input");
    placeOn.type = "checkbox";
    const place = document.createElement("input");
    place.className = "ground-input";
    place.maxLength = 80;
    place.placeholder = "Place name, only if you want it";
    place.disabled = true;
    placeOn.addEventListener("change", () => { place.disabled = !placeOn.checked; if (!placeOn.checked) place.value = ""; });
    placeRow.appendChild(placeOn);
    placeRow.appendChild(document.createTextNode(" Add a place name I type. Do not use my location."));
    const actions = el("div", "ground-actions");
    const record = button("Record");
    const upload = button("Upload");
    actions.append(record, upload);
    form.append(field("Handle", handle), caption, placeRow, place, actions);
    const preview = el("div", "ground-preview");
    form.appendChild(preview);

    record.addEventListener("click", () => {
      if (!ensureTerms(form)) return;
      chooseCapture(preview, (kind) => begin(kind, true));
    });
    upload.addEventListener("click", () => {
      if (!ensureTerms(form)) return;
      if (inApp()) return sendNative("upload");
      const input = document.createElement("input");
      input.type = "file";
      input.accept = "image/*,video/*";
      input.onchange = () => { if (input.files && input.files[0]) prepare(input.files[0]); };
      input.click();
    });

    function fields() {
      const handleValue = handle.value.trim().toLowerCase();
      localStorage.setItem(handleKey, handleValue);
      return {
        type: "ground",
        slug,
        title,
        caption: caption.value.trim(),
        handle: handleValue,
        place: placeOn.checked ? place.value.trim() : "",
        placeOptIn: placeOn.checked,
        termsAt: localStorage.getItem(termsKey),
        posterId: loadId(),
      };
    }

    function sendNative(action) {
      postApp(Object.assign({ action }, fields()));
      note.textContent = "Opening the camera tools on this phone.";
    }

    function begin(kind) {
      if (inApp()) return sendNative(kind === "video" ? "record-video" : "record-photo");
      if (kind === "photo") {
        const input = document.createElement("input");
        input.type = "file";
        input.accept = "image/*";
        input.capture = "environment";
        input.onchange = () => { if (input.files && input.files[0]) prepare(input.files[0]); };
        input.click();
        return;
      }
      recordVideo(preview, note).then((file) => { if (file) prepare(file); }).catch((error) => {
        note.textContent = error.message || "Camera is not available. Use Upload.";
      });
    }

    async function prepare(file) {
      note.textContent = "Preparing the file.";
      try {
        const ready = file.type.startsWith("video/") ? await checkVideo(file) : await compressImage(file);
        preview.replaceChildren();
        const objectUrl = URL.createObjectURL(ready);
        if (ready.type.startsWith("video/")) {
          const video = document.createElement("video");
          video.controls = true;
          video.src = objectUrl;
          preview.appendChild(video);
        } else {
          const img = document.createElement("img");
          img.alt = "";
          img.src = objectUrl;
          preview.appendChild(img);
        }
        const post = button("Post clip");
        preview.appendChild(post);
        post.addEventListener("click", () => publish(ready, fields(), note, reload));
      } catch (error) {
        note.textContent = error.message || "Could not use that file.";
      }
    }
    return form;
  }

  function chooseCapture(preview, onPick) {
    preview.replaceChildren();
    const video = button("Video");
    const photo = button("Photo");
    video.addEventListener("click", () => onPick("video"));
    photo.addEventListener("click", () => onPick("photo"));
    preview.append(video, photo);
  }

  function ensureTerms(form) {
    if (localStorage.getItem(termsKey)) return true;
    if (form.querySelector(".ground-terms")) return false;
    const box = el("div", "ground-terms");
    box.appendChild(el("p", "", "Zero tolerance for objectionable content. No sexual content, no gore, no threats, no harassment, no spam, and nothing that is not about this movement. There is no tolerance for sexual content involving a minor. Clips are not public until approved. We can remove a clip and ban the poster. By continuing you accept the terms."));
    const link = document.createElement("a");
    link.href = "/terms";
    link.textContent = "Read the terms";
    const row = el("div", "ground-actions");
    const accept = button("I accept");
    const cancel = button("Cancel");
    accept.addEventListener("click", () => {
      localStorage.setItem(termsKey, new Date().toISOString());
      box.remove();
    });
    cancel.addEventListener("click", () => box.remove());
    row.append(accept, cancel);
    box.append(link, row);
    form.prepend(box);
    return false;
  }

  async function publish(file, fields, note, reload) {
    if (!window.movementizerUpload) {
      note.textContent = "Upload is not available in this copy of the page.";
      return;
    }
    if (!/^[a-z][a-z0-9-]{2,22}$/.test(fields.handle)) {
      note.textContent = "Use a handle of letters, numbers, and hyphens.";
      return;
    }
    note.textContent = "Posting. It will not be public until it is approved.";
    const payload = {
      clipId: crypto.randomUUID(),
      posterId: fields.posterId,
      handle: fields.handle,
      slug: fields.slug,
      title: fields.title,
      caption: fields.caption,
      place: fields.place,
      placeOptIn: fields.placeOptIn,
      termsAt: fields.termsAt,
      kind: file.type.startsWith("video/") ? "video" : "photo",
      contentType: file.type,
      bytes: file.size,
      durationSec: file.groundDuration || null,
    };
    try {
      const access = await blobAccess();
      await window.movementizerUpload(file, payload, access);
      const poster = file.type.startsWith("video/") ? await frameFromVideo(file) : await blobToBase64(file);
      const screened = await fetch("/api/ground/screen", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ clipId: payload.clipId, viewerId: payload.posterId, poster }),
      });
      const screenedBody = await screened.json().catch(() => ({}));
      if (!screened.ok) throw new Error(screenedBody.error || "The clip was not posted.");
      note.textContent = screenedBody.status === "rejected"
        ? "Not posted."
        : screenedBody.status === "approved"
          ? "Posted."
          : "Under review. Only you can see it until it is approved.";
      reload();
    } catch (error) {
      note.textContent = error && error.message ? error.message : "The clip was not posted.";
    }
  }

  async function blobAccess() {
    return "private";
  }

  async function load(slug, feed, note) {
    const blocked = blockedSet();
    try {
      const response = await fetch("/api/ground?slug=" + encodeURIComponent(slug) + "&viewer=" + encodeURIComponent(loadId()));
      const data = await response.json().catch(() => null);
      if (!response.ok || !data) throw new Error((data && data.error) || "The ground feed is not connected yet.");
      feed.replaceChildren();
      const clips = (data.clips || []).filter((clip) => !blocked.has(clip.posterId));
      if (!clips.length) {
        feed.appendChild(el("p", "ground-empty", "No public clips yet. A new clip stays under review until it is approved."));
        return;
      }
      clips.forEach((clip) => feed.appendChild(renderClip(clip, slug, feed, note)));
    } catch (error) {
      feed.replaceChildren(el("p", "ground-empty", error.message || "The ground feed is not connected yet."));
    }
  }

  function renderClip(clip, slug, feed, note) {
    const item = el("article", "ground-clip");
    const mediaUrl = clip.media + (clip.mine ? "&viewer=" + encodeURIComponent(loadId()) : "");
    if (clip.status !== "rejected") {
      if (clip.kind === "video") {
        const video = document.createElement("video");
        video.controls = true;
        video.playsInline = true;
        video.src = mediaUrl;
        item.appendChild(video);
      } else {
        const img = document.createElement("img");
        img.alt = clip.caption || "Clip from the ground";
        img.src = mediaUrl;
        item.appendChild(img);
      }
    }
    const meta = el("p", "ground-meta", clip.handle + (clip.place ? " · " + clip.place : ""));
    item.appendChild(meta);
    if (clip.caption) item.appendChild(el("p", "ground-caption", clip.caption));
    if (clip.label) item.appendChild(el("p", "ground-label", clip.label));
    if (clip.status === "approved" && !clip.mine) {
      const row = el("div", "ground-actions");
      const report = button("Report");
      const block = button("Block");
      report.addEventListener("click", () => reportClip(clip, note));
      block.addEventListener("click", () => {
        blockPoster(clip.posterId);
        load(slug, feed, note);
      });
      row.append(report, block);
      item.appendChild(row);
    }
    return item;
  }

  async function reportClip(clip, note) {
    const reason = window.prompt("Why are you reporting this clip?");
    if (!reason) return;
    const response = await fetch("/api/ground/report", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ clipId: clip.id, reporterId: loadId(), reason }),
    });
    const data = await response.json().catch(() => ({}));
    note.textContent = response.ok ? (data.hidden ? "Reported. The clip is now hidden." : "Reported. Thank you.") : (data.error || "Report failed.");
  }

  function recordVideo(preview, note) {
    return new Promise((resolve, reject) => {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia || typeof MediaRecorder === "undefined") {
        const input = document.createElement("input");
        input.type = "file";
        input.accept = "video/*";
        input.capture = "environment";
        input.onchange = () => resolve(input.files && input.files[0]);
        input.click();
        return;
      }
      navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" }, audio: true }).then((stream) => {
        const video = document.createElement("video");
        video.muted = true;
        video.playsInline = true;
        video.srcObject = stream;
        video.play();
        preview.replaceChildren(video);
        const stop = button("Stop");
        preview.appendChild(stop);
        const mime = ["video/webm;codecs=vp9", "video/webm", "video/mp4"].find((type) => MediaRecorder.isTypeSupported(type)) || "";
        const recorder = new MediaRecorder(stream, mime ? { mimeType: mime, videoBitsPerSecond: 1000000 } : { videoBitsPerSecond: 1000000 });
        const chunks = [];
        recorder.ondataavailable = (event) => { if (event.data.size) chunks.push(event.data); };
        recorder.onstop = () => {
          stream.getTracks().forEach((track) => track.stop());
          const type = mime.split(";")[0] || "video/webm";
          const file = new File(chunks, type === "video/mp4" ? "ground.mp4" : "ground.webm", { type });
          file.groundDuration = Math.min(MAX_VIDEO_SECONDS, (Date.now() - started) / 1000);
          resolve(file);
        };
        const started = Date.now();
        const timer = setTimeout(() => { if (recorder.state !== "inactive") recorder.stop(); }, MAX_VIDEO_SECONDS * 1000);
        stop.addEventListener("click", () => { clearTimeout(timer); if (recorder.state !== "inactive") recorder.stop(); });
        recorder.start(1000);
        note.textContent = "Recording. It stops at 60 seconds.";
      }).catch(() => reject(new Error("Camera permission was denied. You can Upload a file instead.")));
    });
  }

  async function checkVideo(file) {
    if (file.size > MAX_VIDEO_BYTES) throw new Error("That video is over 32 MB.");
    const duration = file.groundDuration || await videoDuration(file);
    if (!Number.isFinite(duration) || duration > MAX_VIDEO_SECONDS + 0.4) throw new Error("Video must be 60 seconds or less.");
    file.groundDuration = duration;
    return file;
  }

  function videoDuration(file) {
    return new Promise((resolve, reject) => {
      const url = URL.createObjectURL(file);
      const video = document.createElement("video");
      video.preload = "metadata";
      video.onloadedmetadata = () => { URL.revokeObjectURL(url); resolve(video.duration); };
      video.onerror = () => { URL.revokeObjectURL(url); reject(new Error("Could not read that video.")); };
      video.src = url;
    });
  }

  function compressImage(file) {
    if (!file.type.startsWith("image/")) throw new Error("Use a photo or a video.");
    return new Promise((resolve, reject) => {
      const url = URL.createObjectURL(file);
      const img = new Image();
      img.onload = () => {
        const max = 1600;
        const scale = Math.min(1, max / Math.max(img.width, img.height));
        const canvas = document.createElement("canvas");
        canvas.width = Math.max(1, Math.round(img.width * scale));
        canvas.height = Math.max(1, Math.round(img.height * scale));
        canvas.getContext("2d").drawImage(img, 0, 0, canvas.width, canvas.height);
        canvas.toBlob((blob) => {
          URL.revokeObjectURL(url);
          if (!blob) return reject(new Error("Could not prepare that photo."));
          if (blob.size > MAX_IMAGE_BYTES) return reject(new Error("That photo is still over 8 MB."));
          resolve(new File([blob], "ground.jpg", { type: "image/jpeg" }));
        }, "image/jpeg", 0.82);
      };
      img.onerror = () => { URL.revokeObjectURL(url); reject(new Error("Could not read that photo.")); };
      img.src = url;
    });
  }

  function frameFromVideo(file) {
    return new Promise((resolve) => {
      const url = URL.createObjectURL(file);
      const video = document.createElement("video");
      video.muted = true;
      video.playsInline = true;
      video.onloadeddata = () => {
        try { video.currentTime = Math.min(0.2, (video.duration || 1) / 2); } catch (error) { finish(); }
      };
      video.onseeked = finish;
      video.onerror = () => { URL.revokeObjectURL(url); resolve(""); };
      function finish() {
        const canvas = document.createElement("canvas");
        canvas.width = Math.min(640, video.videoWidth || 640);
        const height = video.videoHeight || 360;
        canvas.height = Math.max(1, Math.round(height * (canvas.width / (video.videoWidth || 640))));
        canvas.getContext("2d").drawImage(video, 0, 0, canvas.width, canvas.height);
        URL.revokeObjectURL(url);
        const data = canvas.toDataURL("image/jpeg", 0.7);
        resolve(data.split(",")[1] || "");
      }
      video.src = url;
    });
  }

  function blobToBase64(file) {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result || "").split(",")[1] || "");
      reader.onerror = () => resolve("");
      reader.readAsDataURL(file);
    });
  }

  function field(label, input) {
    const wrap = el("label", "ground-field");
    wrap.append(el("span", "", label), input);
    return wrap;
  }

  function button(text) {
    const node = document.createElement("button");
    node.type = "button";
    node.textContent = text;
    return node;
  }

  function el(tag, className, text) {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text) node.textContent = text;
    return node;
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
  else boot();
})();
