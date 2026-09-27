const legends = {
  live: [
    { slug: "maricarmen", name: "Ni una Maricarmen m\u00e1s", place: "Madrid", claim: "Housing. No more evictions." },
    { slug: "georgia", name: "Georgia pro-Europe", place: "Tbilisi", claim: "Prisoners, laws, European course." }
  ],
  still: [
    { slug: "26septembre", name: "Mouvement du 26 septembre", place: "France", claim: "Climate, life, peace, social justice." },
    { slug: "flamingo", name: "Flamingo Revolution", place: "Albania / Tirana", claim: "Land, coast, flamingos, corruption." },
    { slug: "serbia", name: "Serbian student movement", place: "Novi Sad / Belgrade", claim: "After the station collapse." },
    { slug: "nokings", name: "No Kings", place: "United States", claim: "Alive between mass days." },
    { slug: "50c", name: "No 50\u00b0C summers", place: "Switzerland", claim: "Climate after the record-hot summer." },
    { slug: "savesoil", name: "Save Soil", place: "Earth", claim: "Living soil for the children." }
  ],
  done: [
    { slug: "india-farmers", name: "India farmers", place: "Delhi borders", claim: "Three farm laws repealed." },
    { slug: "kenya-finance", name: "Kenya Finance Bill", place: "Nairobi", claim: "2024 finance bill withdrawn." },
    { slug: "bangladesh", name: "Bangladesh July Revolution", place: "Dhaka", claim: "The uprising as a street stills." },
    { slug: "nepal-genz", name: "Nepal Gen Z", place: "Kathmandu", claim: "Ban off. Government out. New vote." },
    { slug: "korea", name: "South Korea anti-martial-law", place: "Seoul", claim: "Yoon removed. That campaign stills." },
    { slug: "bulgaria", name: "Bulgaria budget protests", place: "Sofia", claim: "Budget pulled. Government resigned." }
  ]
};

const params = new URLSearchParams(location.search);
const slug = params.get("w");
const all = [...legends.live, ...legends.still, ...legends.done];
const found = all.find((m) => m.slug === slug);

function card(m) {
  return `<a class="window" href="?w=${m.slug}"><div class="name">${m.name}</div><div class="meta">${m.place} \u2014 ${m.claim}</div></a>`;
}

function home() {
  return `
  <div class="wrap">
    <header>
      <h1>Movementizer</h1>
      <p>Register all active movements on Earth. Each movement its own window. Only real-time real video. Free of everything. When the street stills, the same window becomes beautiful memory and history \u2014 so you and your children\u2019s children can orient.</p>
    </header>
    <section class="band live"><h2>Live</h2><div class="list">${legends.live.map(card).join("")}</div></section>
    <section class="band still"><h2>Still on</h2><div class="list">${legends.still.map(card).join("")}</div></section>
    <section class="band done"><h2>Fulfilled</h2><div class="list">${legends.done.map(card).join("")}</div></section>
    <footer>Without time and space we are one. Only time and space has power for change.</footer>
  </div>`;
}

function windowPage(m) {
  return `
  <div class="wrap">
    <p><a href="./">\u2190 legends</a></p>
    <header>
      <h1>${m.name}</h1>
      <p>${m.place}. ${m.claim}</p>
    </header>
    <p>This window is for real video only. Upload and Record live here. Related files go to Internet Archive and Filecoin so the record cannot be erased.</p>
    <div class="actions">
      <button type="button" onclick="alert('Record will open the camera in this window.')">Record video</button>
      <button type="button" onclick="alert('Upload will put real video into this window.')">Upload video</button>
    </div>
  </div>`;
}

document.getElementById("app").innerHTML = found ? windowPage(found) : home();
