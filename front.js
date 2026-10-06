(function () {
  const RANK = { live: 3, still: 2, done: 1 };
  const LABEL = { live: "Live", still: "Still on", done: "Fulfilled" };
  const reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const status = {};
  const name = {};
  const order = [];
  document.querySelectorAll(".card[data-slug]").forEach((c) => {
    const s = c.dataset.slug;
    if (!(s in name)) { name[s] = (c.querySelector("strong") || {}).textContent || s; order.push(s); }
    const band = c.closest("#live") ? "live" : c.closest("#still") ? "still" : c.closest("#fulfilled") ? "done" : null;
    if (band && (!status[s] || RANK[band] > RANK[status[s]])) status[s] = band;
  });

  function el(tag, cls, html) { const e = document.createElement(tag); if (cls) e.className = cls; if (html != null) e.innerHTML = html; return e; }
  function esc(s) { return String(s == null ? "" : s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c])); }
  function open(slug) { const c = document.querySelector('.card[data-slug="' + slug + '"]'); if (c) c.click(); }
  function pill(st) { return st ? `<span class="pill ${st}">${LABEL[st]}</span>` : ""; }

  document.body.classList.add("front");

  // Status pills on the Biggest pulses list (state taken from the sections below).
  document.querySelectorAll(".pings .card").forEach((c) => {
    const st = status[c.dataset.slug];
    if (st && !c.querySelector(".pill")) c.insertAdjacentHTML("beforeend", pill(st));
  });

  // Ticker: Live + Still on, existing card text only.
  const tick = [];
  document.querySelectorAll("#live .card, #still .card").forEach((c) => {
    const st = c.closest("#live") ? "live" : "still";
    const t = (sel) => ((c.querySelector(sel) || {}).textContent || "").trim();
    tick.push({ slug: c.dataset.slug, st, text: [t("strong"), t(".place"), t(".claim")].filter(Boolean).join(" · ") });
  });
  if (tick.length) {
    const bar = el("div", "ticker");
    bar.setAttribute("aria-label", "Live and still-on movements");
    const track = el("div", "ticker-track");
    const run = (dup) => tick.map((x) => `<button type="button" class="tk ${x.st}" data-open="${esc(x.slug)}"${dup ? ' tabindex="-1" aria-hidden="true"' : ""}><b>${LABEL[x.st]}</b>${esc(x.text)}</button>`).join("");
    track.innerHTML = run(false) + (reduce ? "" : run(true));
    track.style.setProperty("--dur", Math.max(40, tick.length * 9) + "s");
    bar.appendChild(track);
    document.body.insertBefore(bar, document.body.firstChild);
  }

  // Counts, derived from the sections on this page.
  const mast = document.querySelector(".mast");
  const law = mast && mast.querySelector(".law");
  const n = { live: 0, still: 0, done: 0 };
  Object.values(status).forEach((s) => n[s]++);
  if (law) {
    law.insertAdjacentHTML("afterend", `<p class="tally"><span><b>${order.length}</b> windows</span><span class="live"><b>${n.live}</b> live</span><span class="still"><b>${n.still}</b> still on</span><span class="done"><b>${n.done}</b> fulfilled</span></p>`);
  }

  // Radar: one clickable dot per movement. Ring = state (live inner, still middle, fulfilled outer).
  const dish = document.querySelector(".radar .dish");
  if (dish) {
    dish.removeAttribute("aria-hidden");
    dish.setAttribute("role", "group");
    dish.setAttribute("aria-label", "Earth radar: one dot per movement");
    const rings = { live: 0.26, still: 0.52, done: 0.78 };
    const offs = { live: 30, still: 75, done: 10 };
    ["live", "still", "done"].forEach((st) => {
      const list = order.filter((s) => status[s] === st);
      list.forEach((s, i) => {
        const a = (offs[st] + (360 / list.length) * i) * Math.PI / 180;
        const r = rings[st] * 50;
        const b = el("button", "rdot " + st, `<span class="lbl">${esc(name[s])} <i>${LABEL[st]}</i></span>`);
        b.type = "button";
        b.style.left = (50 + r * Math.cos(a)) + "%";
        b.style.top = (50 + r * Math.sin(a)) + "%";
        b.style.setProperty("--d", (i * 0.37).toFixed(2) + "s");
        b.setAttribute("aria-label", name[s] + " — " + LABEL[st]);
        b.dataset.open = s;
        if ((Math.cos(a)) > 0.35) b.classList.add("flip");
        dish.appendChild(b);
      });
    });
    const wrap = el("div", "dish-wrap");
    dish.parentNode.insertBefore(wrap, dish);
    wrap.appendChild(dish);
    wrap.appendChild(el("p", "legend", `<span class="live">Live</span><span class="still">Still on</span><span class="done">Fulfilled</span>`));
  }

  document.addEventListener("click", (e) => {
    const t = e.target.closest("[data-open]");
    if (t) { e.preventDefault(); open(t.dataset.open); }
  });

  // Media-dependent parts: hero reel + card thumbnails.
  function withMedia() {
    const B = window.MOVEMENT_BANNERS || {};
    const M = window.MOVEMENT_MEDIA || {};
    const poster = (id) => "https://i.ytimg.com/vi/" + id + "/mqdefault.jpg";

    document.querySelectorAll(".card[data-slug]").forEach((c) => {
      const b = B[c.dataset.slug];
      if (!b || c.querySelector(".thumb")) return;
      const t = el("span", "thumb");
      t.setAttribute("aria-hidden", "true");
      t.innerHTML = `<img src="${poster(b.id)}" alt="" loading="lazy" decoding="async" width="320" height="180" />`;
      c.insertBefore(t, c.firstChild);
    });

    if (!mast || mast.querySelector(".reel")) return;
    const posters = order.filter((s) => B[s]).map((s) => ({ s, img: poster(B[s].id), credit: "Video poster · " + B[s].channel }));
    const photos = order.filter((s) => M[s] && M[s].photos && M[s].photos.length).map((s) => {
      const p = M[s].photos[0];
      return { s, img: "https://upload.wikimedia.org/wikipedia/commons/thumb/" + p.h + "/" + p.f + "/330px-" + p.f, credit: "Photo · " + p.author + " · " + p.license + " · Wikimedia Commons" };
    });
    if (!posters.length && !photos.length) return;
    const reel = el("div", "reel");
    reel.setAttribute("aria-label", "Movements in real media. Select one to open its window.");
    const row = (items, dir) => {
      const r = el("div", "reel-row " + dir);
      const tiles = (dup) => items.map((x, i) => `<button type="button" class="tile" data-open="${esc(x.s)}" title="${esc(name[x.s] + " — " + x.credit)}"${dup ? ' tabindex="-1" aria-hidden="true"' : ""}><img src="${esc(x.img)}" alt="" loading="lazy" decoding="async" style="--k:${(i % 5) * 1.7}s" /><span class="cap">${pill(status[x.s])}<strong>${esc(name[x.s])}</strong><small>${esc(x.credit)}</small></span></button>`).join("");
      const tr = el("div", "reel-track", tiles(false) + (reduce ? "" : tiles(true)));
      tr.style.setProperty("--dur", Math.max(50, items.length * 7) + "s");
      r.appendChild(tr);
      return r;
    };
    if (posters.length) reel.appendChild(row(posters, "ltr"));
    if (photos.length) reel.appendChild(row(photos, "rtl"));
    mast.appendChild(reel);
  }
  if (window.MOVEMENT_MEDIA_READY) withMedia();
  else document.addEventListener("movement-media", withMedia, { once: true });
})();
