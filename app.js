const overlay = document.getElementById("window");
let currentCard = null;
const COMMONS = "https://upload.wikimedia.org/wikipedia/commons/";
const LICENSES = {
  "CC0": "https://creativecommons.org/publicdomain/zero/1.0/",
  "CC BY 2.0": "https://creativecommons.org/licenses/by/2.0/",
  "CC BY 2.0 kr": "https://creativecommons.org/licenses/by/2.0/kr/",
  "CC BY 3.0": "https://creativecommons.org/licenses/by/3.0/",
  "CC BY 4.0": "https://creativecommons.org/licenses/by/4.0/",
  "CC BY-SA 4.0": "https://creativecommons.org/licenses/by-sa/4.0/",
  "GODL-India": "https://data.gov.in/sites/default/files/Gazette_Notification_OGDL.pdf"
};

function esc(s) {
  return String(s == null ? "" : s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}

function mediaHTML(slug) {
  const m = (window.MOVEMENT_MEDIA || {})[slug];
  if (!m) return "";
  let out = "";
  if (m.photos && m.photos.length) {
    out += `<h2 class="media-h">Photos</h2><div class="gallery">` + m.photos.map((p) => {
      const src = COMMONS + "thumb/" + p.h + "/" + p.f + "/500px-" + p.f;
      const page = "https://commons.wikimedia.org/wiki/File:" + p.f;
      const lic = LICENSES[p.license] || page;
      return `
      <figure>
        <a href="${esc(page)}" target="_blank" rel="noopener"><img src="${esc(src)}" width="500" height="375" alt="${esc(p.caption)}" loading="lazy" decoding="async" /></a>
        <figcaption>${esc(p.caption)}<span class="credit">Photo: ${esc(p.author)} · <a href="${esc(lic)}" target="_blank" rel="noopener license">${esc(p.license)}</a> · <a href="${esc(page)}" target="_blank" rel="noopener">Wikimedia Commons</a></span></figcaption>
      </figure>`;
    }).join("") + `</div>`;
  }
  const b = (window.MOVEMENT_BANNERS || {})[slug];
  const vids = (m.videos || []).filter((v) => !b || v.id !== b.id);
  if (vids.length) {
    out += `<h2 class="media-h">Video</h2><div class="videos">` + vids.map((v) => `
      <figure>
        <button type="button" class="yt" data-yt="${esc(v.id)}" aria-label="Play video: ${esc(v.title)}">
          <img src="https://i.ytimg.com/vi/${esc(v.id)}/hqdefault.jpg" alt="" loading="lazy" decoding="async" />
          <span class="play" aria-hidden="true"></span>
        </button>
        <figcaption>${esc(v.title)}<span class="credit">Video: ${esc(v.channel)} · ${esc(v.date)} · <a href="https://www.youtube.com/watch?v=${esc(v.id)}" target="_blank" rel="noopener">YouTube</a></span></figcaption>
      </figure>`).join("") + `</div>`;
  }
  if (m.sources && m.sources.length) {
    out += `<h2 class="media-h">Sources</h2><ul class="sources">` + m.sources.map((s) => `
      <li><a href="${esc(s.url)}" target="_blank" rel="noopener">${esc(s.title)}</a> <span class="credit">${esc(s.outlet)} · ${esc(s.date)}</span></li>`).join("") + `</ul>`;
  }
  return out ? `<section class="media">${out}</section>` : "";
}

function bannerHTML(slug) {
  const b = (window.MOVEMENT_BANNERS || {})[slug];
  if (!b) return "";
  const poster = "https://i.ytimg.com/vi/" + b.id + "/" + (b.poster || "hqdefault") + ".jpg";
  return `
      <figure class="banner">
        <button type="button" class="yt" data-yt="${esc(b.id)}" aria-label="Play video: ${esc(b.title)}">
          <img src="${esc(poster)}" alt="" decoding="async" />
          <span class="play" aria-hidden="true"></span>
        </button>
        <figcaption><b>${esc(b.channel)}</b> · ${esc(b.title)}<span class="credit">${Number(b.views).toLocaleString("en-US")} views as of ${esc(b.checked)} · <a href="https://www.youtube.com/watch?v=${esc(b.id)}" target="_blank" rel="noopener">YouTube</a></span></figcaption>
      </figure>`;
}

function playVideo(btn) {
  const id = btn.dataset.yt;
  const frame = document.createElement("iframe");
  frame.src = "https://www.youtube-nocookie.com/embed/" + encodeURIComponent(id) + "?autoplay=1&rel=0";
  frame.title = btn.getAttribute("aria-label") || "Video";
  frame.allow = "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share";
  frame.referrerPolicy = "strict-origin-when-cross-origin";
  frame.allowFullscreen = true;
  frame.className = "yt-frame";
  btn.replaceWith(frame);
}

function openWindow(card) {
  if (!overlay || !card) return;
  currentCard = card;
  const name = card.querySelector("strong").textContent;
  const place = card.dataset.place;
  const claim = card.dataset.claim;
  overlay.classList.remove("hidden");
  overlay.innerHTML = `
    <div class="sheet">${bannerHTML(card.dataset.slug)}
      <button type="button" class="close" id="close-window">Back to the registry</button>
      <h1>${name}</h1>
      <p class="meta">${place}. ${claim}</p>
      <p id="window-note">This window is registered. Real video belongs here. When the street stills, the window stays.</p>
      ${mediaHTML(card.dataset.slug)}
      <div class="actions">
        <button type="button" id="record">Record video</button>
        <button type="button" id="upload">Upload video</button>
      </div>
    </div>`;
  overlay.querySelector("#close-window").onclick = closeWindow;
  overlay.querySelector("#record").onclick = () => startRecord();
  overlay.querySelector("#upload").onclick = () => startUpload();
  overlay.querySelectorAll(".yt").forEach((b) => b.addEventListener("click", () => playVideo(b)));
  const sheet = overlay.querySelector(".sheet");
  if (sheet) sheet.scrollTop = 0;
  history.replaceState(null, "", "?w=" + card.dataset.slug);
}

function closeWindow() {
  overlay.classList.add("hidden");
  overlay.innerHTML = "";
  currentCard = null;
  history.replaceState(null, "", "./");
}

function startRecord() {
  const note = overlay.querySelector("#window-note");
  if (note) note.textContent = "Camera for this window is next. The record will stay with this movement.";
}

function startUpload() {
  const note = overlay.querySelector("#window-note");
  if (note) note.textContent = "Upload for this window is next. Files will also go to Internet Archive and Filecoin.";
}

document.querySelectorAll(".card").forEach((card) => {
  card.addEventListener("click", () => openWindow(card));
});

if (overlay) {
  overlay.addEventListener("click", (e) => { if (e.target === overlay) closeWindow(); });
}
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape" && overlay && !overlay.classList.contains("hidden")) closeWindow();
});

function loadMedia(done) {
  const css = document.createElement("link");
  css.rel = "stylesheet";
  css.href = "media.css";
  document.head.appendChild(css);
  const js = document.createElement("script");
  js.src = "media.js";
  js.onload = js.onerror = () => {
    const bj = document.createElement("script");
    bj.src = "banners.js";
    bj.onload = bj.onerror = done;
    document.head.appendChild(bj);
  };
  document.head.appendChild(js);
}

loadMedia(() => {
  window.MOVEMENT_MEDIA_READY = true;
  document.dispatchEvent(new Event("movement-media"));
  if (currentCard && !overlay.classList.contains("hidden")) openWindow(currentCard);
});

const slug = new URLSearchParams(location.search).get("w");
if (slug) {
  const card = document.querySelector('.card[data-slug="' + slug + '"]');
  if (card) openWindow(card);
}
