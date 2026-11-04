// Runs inside the site. Hides leftover record/upload controls and the
// website's Privacy / Terms / Support links, because the app bar is the
// one place for those. Opens the native share sheet from the Share button,
// and asks for a light haptic when a movement is opened. Android pull-down
// at the top of the page asks the shell to reload. iOS uses the WebView
// pull-to-refresh control.
export const BRIDGE_JS = `
(function () {
  if (window.__MOVEMENTIZER_BRIDGE__) return;
  window.__MOVEMENTIZER_BRIDGE__ = true;
  window.__MVZ_CAN_BACK__ = false;

  function post(payload) {
    if (!window.ReactNativeWebView || typeof window.ReactNativeWebView.postMessage !== "function") return;
    window.ReactNativeWebView.postMessage(JSON.stringify(payload));
  }

  function boot() {
    var style = document.getElementById("mvz-app-hide");
    if (!style) {
      style = document.createElement("style");
      style.id = "mvz-app-hide";
      style.textContent = "#record,#upload,.legal-nav{display:none !important}";
      (document.head || document.documentElement).appendChild(style);
    }

    function watchWindow() {
      var overlay = document.getElementById("window");
      if (!overlay || overlay.getAttribute("data-window-watch") === "1") return;
      overlay.setAttribute("data-window-watch", "1");
      var lastOpen = null;
      var report = function () {
        var open = !overlay.classList.contains("hidden");
        if (open === lastOpen) return;
        lastOpen = open;
        post({ type: "window", open: open });
      };
      new MutationObserver(report).observe(overlay, { attributes: true, attributeFilter: ["class"] });
      report();
    }

    function scan() {
      var dead = document.querySelectorAll("#record,#upload");
      for (var i = 0; i < dead.length; i++) dead[i].remove();
      watchWindow();
      var share = document.getElementById("share");
      if (!share || share.getAttribute("data-native-share") === "1" || share.getAttribute("data-app-share") === "1") return;
      share.setAttribute("data-app-share", "1");
      share.addEventListener("click", function (event) {
        event.preventDefault();
        event.stopPropagation();
        var slug = "";
        try { slug = new URLSearchParams(location.search).get("w") || ""; } catch (err) { slug = ""; }
        var heading = document.querySelector("#window h1");
        var title = (heading && heading.textContent ? heading.textContent : "Movementizer").trim();
        var url = "https://movementizer.com/?w=" + encodeURIComponent(slug);
        var text = title + " - a movement window on Movementizer, the Earth radar.";
        post({ type: "share", title: title, text: text, url: url });
      }, true);
    }

    scan();
    new MutationObserver(scan).observe(document.documentElement, { childList: true, subtree: true });

    document.addEventListener("click", function (event) {
      if (!event.isTrusted) return;
      var target = event.target;
      if (!target || !target.closest) return;
      var hit = target.closest(".card,[data-open],.rdot,.tile,.tk,.legal-nav a,a.status");
      if (!hit || hit.id === "share") return;
      post({ type: "haptic" });
    }, true);

    // iOS edge swipe. Only the left 28px can start it, and only while the shell
    // has set __MVZ_CAN_BACK__. A vertical move is left to the page. The shell
    // decides whether the swipe was long enough. Keep the 28 / 10 / 1.2
    // numbers in sync with edgeSwipe.ts.
    if (/iPhone|iPad|iPod/i.test(navigator.userAgent)) {
      var edge = null;
      document.addEventListener("touchstart", function (event) {
        edge = null;
        if (window.__MVZ_CAN_BACK__ !== true) return;
        if (!event.touches || event.touches.length !== 1) return;
        var t = event.touches[0];
        if (!t || t.clientX > 28) return;
        edge = { x: t.clientX, y: t.clientY, t: event.timeStamp, locked: null };
      }, { capture: true, passive: true });
      document.addEventListener("touchmove", function (event) {
        if (!edge || !event.touches || !event.touches[0]) return;
        var t = event.touches[0];
        var dx = t.clientX - edge.x;
        var dy = t.clientY - edge.y;
        if (edge.locked == null) {
          if (Math.abs(dx) < 10 && Math.abs(dy) < 10) return;
          edge.locked = dx > 10 && dx > Math.abs(dy) * 1.2 ? "back" : "page";
        }
        if (edge.locked !== "back") return;
        if (event.cancelable) event.preventDefault();
        post({ type: "edge-move", dx: dx });
      }, { capture: true, passive: false });
      function endEdge(event) {
        if (!edge) return;
        var locked = edge.locked;
        var start = edge;
        edge = null;
        if (locked !== "back") {
          post({ type: "edge-cancel" });
          return;
        }
        if (event.cancelable) event.preventDefault();
        var t = event.changedTouches && event.changedTouches[0];
        if (!t) {
          post({ type: "edge-cancel" });
          return;
        }
        post({
          type: "edge-end",
          dx: t.clientX - start.x,
          dy: t.clientY - start.y,
          dt: Math.max(1, event.timeStamp - start.t)
        });
      }
      document.addEventListener("touchend", endEdge, { capture: true, passive: false });
      document.addEventListener("touchcancel", function () {
        if (!edge) return;
        edge = null;
        post({ type: "edge-cancel" });
      }, { capture: true, passive: true });
    }

    if (/Android/i.test(navigator.userAgent)) {
      var startY = null;
      document.addEventListener("touchstart", function (event) {
        var target = event.target;
        if (target && target.closest && target.closest("#window,.share-menu")) {
          startY = null;
          return;
        }
        startY = window.scrollY <= 2 && event.touches && event.touches[0] ? event.touches[0].clientY : null;
      }, { passive: true });
      document.addEventListener("touchend", function (event) {
        if (startY == null || !event.changedTouches || !event.changedTouches[0]) return;
        var delta = event.changedTouches[0].clientY - startY;
        startY = null;
        if (delta > 90 && window.scrollY <= 2) post({ type: "refresh" });
      }, { passive: true });
    }
  }

  if (document.documentElement) boot();
  else document.addEventListener("DOMContentLoaded", boot);
})();
true;
`;

export const BACK_JS = `
(function () {
  var overlay = document.getElementById("window");
  var open = overlay && !overlay.classList.contains("hidden");
  if (open) {
    var close = document.getElementById("close-window");
    if (close) close.click();
    window.ReactNativeWebView.postMessage(JSON.stringify({ type: "back", handled: true }));
  } else {
    window.ReactNativeWebView.postMessage(JSON.stringify({ type: "back", handled: false }));
  }
})();
true;
`;
