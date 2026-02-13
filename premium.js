/* RP_PREMIUM_SPACE_FINAL_V1 */
(function () {
  function onReady(fn) {
    if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", fn);
    else fn();
  }
  function rand(min, max) { return Math.random() * (max - min) + min; }

  // ========= SPACE BG =========
  function injectSpace() {
    if (document.getElementById("rp-space")) return;

    var space = document.createElement("div");
    space.id = "rp-space";

    // stars
    var starCount = 120;
    for (var i = 0; i < starCount; i++) {
      var s = document.createElement("div");
      s.className = "rp-star";
      s.style.left = rand(0, 100).toFixed(2) + "%";
      s.style.top = rand(0, 100).toFixed(2) + "%";
      var size = rand(1, 3);
      s.style.width = size + "px";
      s.style.height = size + "px";
      s.style.animationDelay = rand(0, 5).toFixed(2) + "s";
      s.style.opacity = rand(0.35, 0.95).toFixed(2);
      space.appendChild(s);
    }

    // planets
    var planets = [
      { w: 360, h: 360, x: -18, y: 10, hue: 220, dur: 16, op: 0.95 },
      { w: 260, h: 260, x: 72, y: 8, hue: 60, dur: 14, op: 0.92 },
      { w: 200, h: 200, x: 66, y: 62, hue: 300, dur: 18, op: 0.94 },
    ];

    planets.forEach(function (p, idx) {
      var pl = document.createElement("div");
      pl.className = "rp-planet";
      pl.style.width = p.w + "px";
      pl.style.height = p.h + "px";
      pl.style.left = p.x + "%";
      pl.style.top = p.y + "%";
      pl.style.animationDuration = p.dur + "s";
      pl.style.filter = "hue-rotate(" + p.hue + "deg) saturate(1.15)";
      pl.style.opacity = String(p.op);
      space.appendChild(pl);
    });

    // meteors
    for (var m = 0; m < 8; m++) {
      var met = document.createElement("div");
      met.className = "rp-meteor";
      met.style.left = rand(-40, 40).toFixed(1) + "vw";
      met.style.top = rand(-40, 10).toFixed(1) + "vh";
      met.style.animationDelay = rand(0, 6).toFixed(2) + "s";
      met.style.animationDuration = rand(2.6, 4.6).toFixed(2) + "s";
      met.style.opacity = rand(0.45, 0.95).toFixed(2);
      space.appendChild(met);
    }

    document.body.prepend(space);
  }

  // ========= USERNAME (NO "ADMIN" FALLBACK) =========
  function getLoggedName() {
    try {
      var u = window.PterodactylUser || window.user || null;
      if (u) {
        if (u.username) return String(u.username);
        if (u.name) return String(u.name);
        if (u.email) return String(u.email).split("@")[0];
      }
    } catch (e) {}

    // fallback DOM (avoid Admin)
    var selectors = [
      '[data-testid="user-menu-button"]',
      'button[aria-haspopup="menu"]',
      'header button',
    ];
    for (var i = 0; i < selectors.length; i++) {
      var el = document.querySelector(selectors[i]);
      if (el && el.textContent) {
        var t = el.textContent.trim();
        if (t && !/^admin$/i.test(t) && t.length <= 32) return t;
      }
    }
    return null;
  }

  // ========= WELCOME TOAST (NOT BLOCK CLICK) =========
  function showWelcome() {
    var name = getLoggedName();
    if (!name) return;

    var toast = document.getElementById("rp-toast");
    if (!toast) {
      toast = document.createElement("div");
      toast.id = "rp-toast";
      toast.style.cssText =
        "position:fixed;right:14px;top:14px;z-index:99999;" +
        "pointer-events:none;" +
        "padding:10px 12px;border-radius:14px;" +
        "border:1px solid rgba(255,255,255,.14);" +
        "background:rgba(0,0,0,.45);backdrop-filter:blur(14px);" +
        "box-shadow:0 16px 60px rgba(0,0,0,.45);" +
        "color:#fff;font-weight:800;";
      document.body.appendChild(toast);
    }

    toast.innerHTML =
      'Welcome kak <span style="font-weight:900;background:linear-gradient(90deg,#ff3bd4,#38d6ff,#7c4dff);-webkit-background-clip:text;background-clip:text;color:transparent;">' +
      name +
      "</span> <span style='opacity:.85;font-weight:700;'>✨</span>";

    toast.style.display = "block";
    clearTimeout(window.__rpToastT);
    window.__rpToastT = setTimeout(function () {
      toast.style.display = "none";
    }, 5200);
  }

  // ========= BUTTON TAGGER (Start/Restart/Stop) =========
  function tagButtons() {
    var btns = Array.prototype.slice.call(document.querySelectorAll("button"));
    btns.forEach(function (b) {
      var tx = (b.textContent || "").trim().toLowerCase();
      if (tx === "start" || tx === "restart" || tx === "stop") b.classList.add("rp-btn");
    });
  }

  // ========= MUSIC AUTOPLAY (NO DOMAIN) =========
  function setupAudio() {
    var SRC = "/media/bgm.mp3"; // tanpa domain (auto ikut domain panel)
    var audio = document.getElementById("rp-bgm");
    if (!audio) {
      audio = document.createElement("audio");
      audio.id = "rp-bgm";
      audio.src = SRC;
      audio.loop = true;
      audio.preload = "auto";
      audio.volume = 0.55;
      audio.setAttribute("playsinline", "");
      audio.setAttribute("webkit-playsinline", "");
      audio.style.display = "none";
      document.body.appendChild(audio);
    }

    // hint UI (muncul hanya kalau autoplay diblokir)
    var hint = document.getElementById("rp-audiohint");
    if (!hint) {
      hint = document.createElement("div");
      hint.id = "rp-audiohint";
      hint.style.cssText =
        "position:fixed;left:14px;bottom:14px;z-index:99999;" +
        "padding:10px 12px;border-radius:14px;" +
        "border:1px solid rgba(255,255,255,.14);" +
        "background:rgba(0,0,0,.45);backdrop-filter:blur(14px);" +
        "box-shadow:0 16px 60px rgba(0,0,0,.45);" +
        "color:#fff;font-weight:800;display:none;";
      hint.innerHTML = 'Tap sekali untuk aktifkan <b style="color:#fff;">music</b> 🎵';
      document.body.appendChild(hint);
    }

    function tryPlay() {
      var p = audio.play();
      if (p && p.then) {
        p.then(function () { hint.style.display = "none"; })
         .catch(function () { hint.style.display = "block"; });
      }
    }

    // try on load
    setTimeout(tryPlay, 600);

    // play on first user interaction
    var once = function () {
      tryPlay();
      window.removeEventListener("pointerdown", once, true);
      window.removeEventListener("touchstart", once, true);
      window.removeEventListener("click", once, true);
      window.removeEventListener("keydown", once, true);
    };
    window.addEventListener("pointerdown", once, true);
    window.addEventListener("touchstart", once, true);
    window.addEventListener("click", once, true);
    window.addEventListener("keydown", once, true);

    // visibility change safety (iOS)
    document.addEventListener("visibilitychange", function () {
      if (document.hidden) audio.pause();
      else setTimeout(tryPlay, 300);
    });
  }

  onReady(function () {
    injectSpace();
    setupAudio();
    tagButtons();
    setInterval(tagButtons, 1200);

    // welcome only after login (not on /auth/*)
    if (location.pathname.indexOf("/auth/") !== 0) {
      setTimeout(showWelcome, 900);
    }
  });
})();
