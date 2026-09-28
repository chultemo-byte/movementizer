const legends = {
  live: [
    { slug: "maricarmen", name: "Ni una Maricarmen más", place: "Madrid", claim: "Housing. No more evictions." },
    { slug: "georgia", name: "Georgia pro-Europe", place: "Tbilisi", claim: "Prisoners, laws, European course." }
  ],
  still: [
    { slug: "26septembre", name: "Mouvement du 26 septembre", place: "France", claim: "Climate, life, peace, social justice." },
    { slug: "flamingo", name: "Flamingo Revolution", place: "Albania / Tirana", claim: "Land, coast, flamingos, corruption." },
    { slug: "serbia", name: "Serbian student movement", place: "Novi Sad / Belgrade", claim: "After the station collapse." },
    { slug: "nokings", name: "No Kings", place: "United States", claim: "Alive between mass days." },
    { slug: "50c", name: "No 50°C summers", place: "Switzerland", claim: "Climate after the record-hot summer." },
    { slug: "savesoil", name: "Save Soil", place: "Earth", claim: "Living soil for the children." }
  ],
  fulfilled: [
    { slug: "india-farmers", name: "India farmers", place: "Delhi borders", claim: "Three farm laws repealed." },
    { slug: "kenya-finance", name: "Kenya Finance Bill", place: "Nairobi", claim: "2024 finance bill withdrawn." },
    { slug: "bangladesh", name: "Bangladesh July Revolution", place: "Dhaka", claim: "The uprising as a street stills." },
    { slug: "nepal-genz", name: "Nepal Gen Z", place: "Kathmandu", claim: "Ban off. Government out. New vote." },
    { slug: "korea", name: "South Korea anti-martial-law", place: "Seoul", claim: "Yoon removed. That campaign stills." },
    { slug: "bulgaria", name: "Bulgaria budget protests", place: "Sofia", claim: "Budget pulled. Government resigned." }
  ]
};

const all = [...legends.live, ...legends.still, ...legends.fulfilled];

function card(m) {
  return `<button type="button" class="card" data-slug="${m.slug}">
    <p class="place">${m.place}</p>
    <h3>${m.name}</h3>
    <p class="claim">${m.claim}</p>
  </button>`;
}

function fill(band, items) {
  const root = document.querySelector(`[data-band="${band}"]`);
  if (!root) return;
  root.innerHTML = items.map(card).join("");
}

function openWindow(m) {
  const box = document.getElementById("window");
  if (!box) return;
  box.classList.remove("hidden");
  box.innerHTML = `
    <div class="window">
      <p class="place">${m.place}</p>
      <h2>${m.name}</h2>
      <p>${m.claim}</p>
      <p>This window is for real video only. When the street stills, the same window stays as memory.</p>
      <div class="actions">
        <button type="button" id="record">Record video</button>
        <button type="button" id="upload">Upload video</button>
        <button type="button" class="ghost" id="close">Close</button>
      </div>
      <p class="note" id="note">Related files will go to Internet Archive and Filecoin.</p>
    </div>`;
  history.replaceState(null, "", "?w=" + m.slug);
  document.getElementById("close").onclick = closeWindow;
  document.getElementById("record").onclick = function () {
    document.getElementById("note").textContent = "Record opens the camera in this window next.";
  };
  document.getElementById("upload").onclick = function () {
    document.getElementById("note").textContent = "Upload puts real ground video into this window next.";
  };
}

function closeWindow() {
  const box = document.getElementById("window");
  box.classList.add("hidden");
  box.innerHTML = "";
  history.replaceState(null, "", "./");
}

fill("live", legends.live);
fill("still", legends.still);
fill("fulfilled", legends.fulfilled);

document.addEventListener("click", function (e) {
  const btn = e.target.closest(".card");
  if (!btn) return;
  const m = all.find((x) => x.slug === btn.dataset.slug);
  if (m) openWindow(m);
});

document.getElementById("window").addEventListener("click", function (e) {
  if (e.target.id === "window") closeWindow();
});

const start = new URLSearchParams(location.search).get("w");
const found = all.find((m) => m.slug === start);
if (found) openWindow(found);
