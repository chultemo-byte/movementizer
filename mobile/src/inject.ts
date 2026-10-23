// Runs inside the site. Hides leftover record/upload controls, opens the
// native share sheet from the Share button, and asks for a light haptic
// when a movement is opened. Android pull-down at the top of the page
// asks the shell to reload. iOS uses the WebView pull-to-refresh control.
export const BRIDGE_JS = `
(function () {
  if (window.__MOVEMENTIZER_BRIDGE__) return;
  window.__MOVEMENTIZER_BRIDGE__ = true;

  function post(payload) {
    if (!window.ReactNativeWebView || typeof window.ReactNativeWebView.postMessage !== "function") return;
    window.ReactNativeWebView.postMessage(JSON.stringify(payload));
  }

  function boot() {
    var style = document.getElementById("mvz-app-hide");
    if (!style) {
      style = document.createElement("style");
      style.id = "mvz-app-hide";
      style.textContent = "#record,#upload{display:none !important}";
      (document.head || document.documentElement).appendChild(style);
    }

    function scan() {
      var dead = document.querySelectorAll("#record,#upload");
      for (var i = 0; i < dead.length; i++) dead[i].remove();
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
      var target = event.target;
      if (!target || !target.closest) return;
      var hit = target.closest(".card,[data-open],.rdot,.tile,.tk");
      if (!hit || hit.id === "share") return;
      post({ type: "haptic" });
    }, true);

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
