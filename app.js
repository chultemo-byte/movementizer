const legends = {
  live: [
    { slug: "georgia", name: "Georgia pro-Europe", place: "Tbilisi", claim: "Prisoners, laws, European course." },
    { slug: "maricarmen", name: "Ni una Maricarmen más", place: "Madrid", claim: "Housing. No more evictions." }
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
const overlay = document.getElementById("window");

function card(m) {
  const el = document.createElement("button");
  el.type = "button";
  el.className = "window";
  el.innerHTML = `<div class="name">${m.name}</div><div class="meta">${m.place} — ${m.claim}</div>`;
  el.addEventListener("click", () => openWindow(m));
  return el;
}

function fill() {
  document.querySelectorAll("[data-band]").forEach((grid) => {
    grid.innerHTML = "";
    (legends[grid.dataset.band] || []).forEach((m) => grid.appendChild(card(m)));
  });
}

function openWindow(m) {
  if (!overlay) return;
  overlay.classList.remove("hidden");
  overlay.innerHTML = `
    <div class="sheet">
      <button type="button" class="close" id="close-window">← legends</button>
      <h1>${m.name}</h1>
      <p class="meta">${m.place}. ${m.claim}</p>
      <p>This window is registered. Real video only. When the street stills, this same window becomes memory.</p>
      <div class="actions">
        <button type="button" id="record">Record video</button>
        <button type="button" id="upload">Upload video</button>
      </div>
    </div>`;
  overlay.querySelector("#close-window").onclick = closeWindow;
  overlay.querySelector("#record").onclick = () => alert("Record will open the camera in this window.");
  overlay.querySelector("#upload").onclick = () => alert("Upload will put real video into this window.");
  history.replaceState(null, "", "?w=" + m.slug);
}

function closeWindow() {
  if (!overlay) return;
  overlay.classList.add("hidden");
  overlay.innerHTML = "";
  history.replaceState(null, "", "./");
}

fill();

const start = new URLSearchParams(location.search).get("w");
const found = all.find((m) => m.slug === start);
if (found) openWindow(found);
