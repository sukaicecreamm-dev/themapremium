/* RP_PREMIUM_SPACE_FINAL_V2 */
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
    space.setAttribute("data-rp-parallax", "1");

    // stars
    var starCount = 140;
    for (var i = 0; i < starCount; i++) {
      var s = document.createElement("div");
      s.className = "rp-star";
      s.style.left = rand(0, 100).toFixed(2) + "%";
      s.style.top = rand(0, 100).toFixed(2) + "%";
      var size = rand(1, 3.2);
      s.style.width = size + "px";
      s.style.height = size + "px";
      s.style.animationDelay = rand(0, 5).toFixed(2) + "s";
      s.style.opacity = rand(0.35, 0.95).toFixed(2);
      space.appendChild(s);
    }

    // planets
    var planets = [
      { w: 380, h: 380, x: -18, y: 12, hue: 220, dur: 16, op: 0.95 },
      { w: 280, h: 280, x: 72, y: 10, hue: 55,  dur: 14, op: 0.92 },
      { w: 210, h: 210, x: 66, y: 62, hue: 300, dur: 18, op: 0.94 },
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
    for (var m = 0; m < 10; m++) {
      var met = document.createElement("div");
      met.className = "rp-meteor";
      met.style.left = rand(-40, 40).toFixed(1) + "vw";
      met.style.top = rand(-40, 10).toFixed(1) + "vh";
      met.style.animationDelay = rand(0, 7).toFixed(2) + "s";
      met.style.animationDuration = rand(2.6, 4.8).toFixed(2) + "s";
      met.style.opacity = rand(0.45, 0.95).toFixed(2);
      space.appendChild(met);
    }

    // EXTRA objects (circle/square/tri) biar gak sepi & gak ori
    var shapes = 26;
    var types = ["circle", "square", "tri"];
    for (var j = 0; j < shapes; j++) {
      var sh = document.createElement("div");
      var t = types[Math.floor(rand(0, types.length))];
      sh.className = "rp-shape " + t;
      sh.style.left = rand(0, 100).toFixed(2) + "%";
      sh.style.top  = rand(0, 100).toFixed(2) + "%";
      sh.style.opacity = rand(0.18, 0.62).toFixed(2);
      sh.style.animationDelay = rand(0, 6).toFixed(2) + "s";
      sh.style.animationDuration = rand(7, 15).toFixed(2) + "s";
      sh.style.filter = "hue-rotate(" + rand(0, 360).toFixed(0) + "deg) saturate(1.15)";
      space.appendChild(sh);
    }

    document.body.prepend(space);

    // mouse parallax (halus, aman mobile)
    var px = 0, py = 0;
    window.addEventListener("mousemove", function (e) {
      px = (e.clientX / window.innerWidth - 0.5) * 12;
      py = (e.clientY / window.innerHeight - 0.5) * 10;
      space.style.transform = "translate3d(" + (-px) + "px," + (-py) + "px,0)";
    }, { passive: true });
  }

  // ========= USERNAME (NO ADMIN FIX) =========
  function getLoggedName() {
    try {
      var u = window.PterodactylUser || window.user || null;
      if (u) {
        if (u.username) return String(u.username);
        if (u.name) return String(u.name);
        if (u.email) return String(u.email).split("@")[0];
      }
    } catch (e) {}

    // fallback: cari text user di header, tapi jangan ambil "Admin"
    var selectors = [
      '[data-testid="user-menu-button"]',
      'button[aria-haspopup="menu"]',
      'header button',
      'header [role="button"]'
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

  // ========= WELCOME TOAST: muncul 5 detik tiap 15 detik =========
  function ensureToast() {
    var toast = document.getElementById("rp-toast");
    if (toast) return toast;

    toast = document.createElement("div");
    toast.id = "rp-toast";
    toast.style.cssText =
      "position:fixed;right:14px;top:14px;z-index:99999;" +
      "pointer-events:none;" +
      "padding:10px 12px;border-radius:14px;" +
      "border:1px solid rgba(255,255,255,.14);" +
      "background:rgba(0,0,0,.45);backdrop-filter:blur(14px);" +
      "box-shadow:0 16px 60px rgba(0,0,0,.45);" +
      "color:#fff;font-weight:800;display:none;";
    document.body.appendChild(toast);
    return toast;
  }

  function showWelcomeOnce() {
    var name = getLoggedName();
    if (!name) return;

    var toast = ensureToast();
    toast.innerHTML =
      'Welcome kak <span style="font-weight:900;background:linear-gradient(90deg,#ff3bd4,#38d6ff,#7c4dff,#49ffa6);-webkit-background-clip:text;background-clip:text;color:transparent;">' +
      name +
      "</span> <span style='opacity:.85;font-weight:700;'>✨</span>";

    toast.style.display = "block";
    clearTimeout(window.__rpToastHide);
    window.__rpToastHide = setTimeout(function () {
      toast.style.display = "none";
    }, 5000);
  }

  function loopWelcome() {
    // jangan tampil di login page
    if (location.pathname.indexOf("/auth/") === 0) return;
    showWelcomeOnce();
    // setiap 15 detik muncul lagi
    setInterval(showWelcomeOnce, 15000);
  }

  // ========= TAG ALL BUTTONS (biar gak ori) =========
  function tagButtons() {
    var wanted = [
      "start","restart","stop",
      "upload","new file","create directory",
      "move","archive","delete",
      "save","create","submit","confirm"
    ];

    var btns = Array.prototype.slice.call(
      document.querySelectorAll("button, a[role='button'], [role='button']")
    );

    btns.forEach(function (b) {
      var tx = (b.textContent || "").trim().toLowerCase();
      var aria = (b.getAttribute("aria-label") || "").trim().toLowerCase();
      var name = tx || aria;

      if (!name) return;
      if (wanted.indexOf(name) !== -1) b.classList.add("rp-btn");
    });
  }

  function watchButtons() {
    try {
      var mo = new MutationObserver(function () { tagButtons(); });
      mo.observe(document.body, { childList: true, subtree: true });
    } catch (e) {}
  }

  // ========= MUSIC AUTOPLAY (NO DOMAIN) =========
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
      hint.innerHTML = 'Tap sekali untuk aktifkan <b style="color:#fff">music</b> 🎵';
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
    watchButtons();
    loopWelcome();
    setInterval(tagButtons, 1200);
  });
})();
