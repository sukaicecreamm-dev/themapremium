/* RP_PREMIUM_SPACE_FINAL_V1_FULL */
(function () {
  function onReady(fn) {
    if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", fn);
    else fn();
  }
  function rand(min, max) { return Math.random() * (max - min) + min; }

  // ================== SPACE BG ==================
  function injectSpace() {
    if (document.getElementById("rp-space")) return;

    var space = document.createElement("div");
    space.id = "rp-space";
    space.setAttribute("data-rp-parallax", "1");

    // stars
    var starCount = 170;
    for (var i = 0; i < starCount; i++) {
      var s = document.createElement("div");
      s.className = "rp-star";
      s.style.left = rand(0, 100).toFixed(2) + "%";
      s.style.top  = rand(0, 100).toFixed(2) + "%";
      var size = rand(1, 3.2);
      s.style.width  = size + "px";
      s.style.height = size + "px";
      s.style.animationDelay = rand(0, 6).toFixed(2) + "s";
      s.style.opacity = rand(0.35, 0.95).toFixed(2);
      space.appendChild(s);
    }

    // planets (vw/vh biar konsisten)
    var planets = [
      { w: 380, h: 380, l: -10, t: 16, hue: 220, dur: 16, op: 0.94 },
      { w: 280, h: 280, l:  72, t: 10, hue:  60, dur: 14, op: 0.90 },
      { w: 220, h: 220, l:  66, t: 62, hue: 300, dur: 18, op: 0.92 },
    ];
    planets.forEach(function (p) {
      var pl = document.createElement("div");
      pl.className = "rp-planet";
      pl.style.width  = p.w + "px";
      pl.style.height = p.h + "px";
      pl.style.left = p.l + "vw";
      pl.style.top  = p.t + "vh";
      pl.style.animationDuration = p.dur + "s";
      pl.style.filter = "hue-rotate(" + p.hue + "deg) saturate(1.15)";
      pl.style.opacity = String(p.op);
      space.appendChild(pl);
    });

    // meteors
    for (var m = 0; m < 10; m++) {
      var met = document.createElement("div");
      met.className = "rp-meteor";
      met.style.left = rand(-50, 30).toFixed(1) + "vw";
      met.style.top  = rand(-40, 15).toFixed(1) + "vh";
      met.style.animationDelay = rand(0, 7).toFixed(2) + "s";
      met.style.animationDuration = rand(2.6, 4.8).toFixed(2) + "s";
      met.style.opacity = rand(0.45, 0.95).toFixed(2);
      space.appendChild(met);
    }

    // EXTRA: floating shapes (kotak/segitiga/circle)
    var shapeCount = 22;
    var types = ["circle", "square", "tri"];
    for (var k = 0; k < shapeCount; k++) {
      var sh = document.createElement("div");
      var t = types[Math.floor(rand(0, types.length))];
      sh.className = "rp-shape " + t;
      sh.style.left = rand(0, 100).toFixed(2) + "%";
      sh.style.top  = rand(0, 100).toFixed(2) + "%";
      sh.style.opacity = rand(0.20, 0.60).toFixed(2);
      sh.style.animationDuration = rand(8.5, 16.5).toFixed(2) + "s";
      sh.style.animationDelay = rand(0, 6.5).toFixed(2) + "s";
      if (t !== "tri") {
        var sz = rand(14, 30);
        sh.style.width = sz + "px";
        sh.style.height = sz + "px";
      }
      space.appendChild(sh);
    }

    document.body.prepend(space);

    // parallax ringan (tidak berat)
    var px = 0, py = 0;
    window.addEventListener("pointermove", function (e) {
      var w = window.innerWidth || 1;
      var h = window.innerHeight || 1;
      var nx = (e.clientX / w - 0.5);
      var ny = (e.clientY / h - 0.5);
      px = nx * 10;
      py = ny * 10;
      space.style.transform = "translate3d(" + px.toFixed(2) + "px," + py.toFixed(2) + "px,0)";
    }, { passive: true });
  }

  // ================== USERNAME (ANTI ADMIN PALSU) ==================
  function safeText(t) {
    if (!t) return null;
    t = String(t).replace(/\s+/g, " ").trim();
    if (!t) return null;
    if (t.length > 32) return null;
    if (/^admin$/i.test(t)) return null;
    if (/^pterodactyl$/i.test(t)) return null;
    if (/^showing your servers$/i.test(t)) return null;
    return t;
  }

  function getLoggedName() {
    try {
      var u = window.PterodactylUser || window.user || window.__USER__ || null;
      if (u) {
        var a = safeText(u.username) || safeText(u.name);
        if (a) return a;
        if (u.email) {
          var e = safeText(String(u.email).split("@")[0]);
          if (e) return e;
        }
      }
    } catch (e) {}

    // cari user menu / avatar area (lebih aman dari card "Admin")
    var selectors = [
      '[data-testid*="user"]',
      '[class*="UserMenu"]',
      '[class*="userMenu"]',
      '[aria-label*="account" i]',
      '[aria-label*="user" i]',
      'button[aria-haspopup="menu"]',
      'header [role="button"]',
    ];
    for (var i = 0; i < selectors.length; i++) {
      var el = document.querySelector(selectors[i]);
      if (el && el.textContent) {
        var t = safeText(el.textContent);
        if (t) return t;
      }
    }
    return null;
  }

  // ================== WELCOME TOAST (NO BLOCK CLICK) ==================
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
        "color:#fff;font-weight:900;";
      document.body.appendChild(toast);
    }

    if (!document.getElementById("rp-wel-style")) {
      var st = document.createElement("style");
      st.id = "rp-wel-style";
      st.textContent =
        "@keyframes rpWelG{0%{background-position:0% 50%}50%{background-position:100% 50%}100%{background-position:0% 50%}}";
      document.head.appendChild(st);
    }

    toast.innerHTML =
      'Welcome kak <span style="font-weight:950;background:linear-gradient(90deg,#ff3bd4,#38d6ff,#7c4dff,#49ffa6,#ffcc4a);background-size:300% 100%;-webkit-background-clip:text;background-clip:text;color:transparent;display:inline-block;animation:rpWelG 4.6s ease-in-out infinite;">' +
      name +
      "</span> <span style='opacity:.9'>✨</span>";

    toast.style.display = "block";
    clearTimeout(window.__rpToastT);
    window.__rpToastT = setTimeout(function () {
      toast.style.display = "none";
    }, 5200);
  }

  // ================== BUTTON TAGGER (Start/Restart/Stop) ==================
  function tagButtons() {
    var btns = Array.prototype.slice.call(document.querySelectorAll("button"));
    btns.forEach(function (b) {
      var tx = (b.textContent || "").replace(/\s+/g, " ").trim().toLowerCase();
      if (tx === "start" || tx === "restart" || tx === "stop") b.classList.add("rp-btn");
    });
  }

  // ================== MUSIC AUTOPLAY (NO DOMAIN) ==================
  function setupAudio() {
    var SRC = "/media/bgm.mp3";
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

    var hint = document.getElementById("rp-audiohint");
    if (!hint) {
      hint = document.createElement("div");
      hint.id = "rp-audiohint";
      hint.innerHTML = "Tap sekali untuk aktifkan music 🎵";
      document.body.appendChild(hint);
    }

    function tryPlay() {
      var p = audio.play();
      if (p && p.then) {
        p.then(function () { hint.style.display = "none"; })
         .catch(function () { hint.style.display = "block"; });
      }
    }

    setTimeout(tryPlay, 600);

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

    if (location.pathname.indexOf("/auth/") !== 0) {
      setTimeout(showWelcome, 1100);
      setTimeout(showWelcome, 2600);
    }
  });
})();
