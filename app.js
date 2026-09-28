const overlay = document.getElementById("window");

function openWindow(card) {
  if (!overlay || !card) return;
  const name = card.querySelector("strong").textContent;
  const place = card.dataset.place;
  const claim = card.dataset.claim;
  overlay.classList.remove("hidden");
  overlay.innerHTML = `
    <div class="sheet">
      <button type="button" class="close" id="close-window">Back to the registry</button>
      <h1>${name}</h1>
      <p class="meta">${place}. ${claim}</p>
      <p>This window is registered. Real video belongs here. When the street stills, the window stays.</p>
      <div class="actions">
        <button type="button" id="record">Record video</button>
        <button type="button" id="upload">Upload video</button>
      </div>
    </div>`;
  overlay.querySelector("#close-window").onclick = closeWindow;
  overlay.querySelector("#record").onclick = () => startRecord();
  overlay.querySelector("#upload").onclick = () => startUpload();
  history.replaceState(null, "", "?w=" + card.dataset.slug);
}

function closeWindow() {
  overlay.classList.add("hidden");
  overlay.innerHTML = "";
  history.replaceState(null, "", "./");
}

function startRecord() {
  const note = overlay.querySelector(".sheet p:nth-of-type(2)");
  if (note) note.textContent = "Camera for this window is next. The record will stay with this movement.";
}

function startUpload() {
  const note = overlay.querySelector(".sheet p:nth-of-type(2)");
  if (note) note.textContent = "Upload for this window is next. Files will also go to Internet Archive and Filecoin.";
}

document.querySelectorAll(".card").forEach((card) => {
  card.addEventListener("click", () => openWindow(card));
});

const slug = new URLSearchParams(location.search).get("w");
if (slug) {
  const card = document.querySelector('.card[data-slug="' + slug + '"]');
  if (card) openWindow(card);
}
