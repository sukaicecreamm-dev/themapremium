/* RP_PREMIUM_SPACE_V12 */

(function(){
  function onReady(fn){
    if(document.readyState === "loading") document.addEventListener("DOMContentLoaded", fn);
    else fn();
  }

  function rand(min,max){ return Math.random()*(max-min)+min; }

  function injectSpace(){
    if(document.getElementById("rp-space")) return;

    const space = document.createElement("div");
    space.id = "rp-space";

    // stars
    const starCount = 90;
    for(let i=0;i<starCount;i++){
      const s = document.createElement("div");
      s.className = "rp-star";
      s.style.left = rand(0,100).toFixed(2)+"%";
      s.style.top  = rand(0,100).toFixed(2)+"%";
      const size = rand(1,3);
      s.style.width = size+"px";
      s.style.height= size+"px";
      s.style.animationDelay = rand(0,4).toFixed(2)+"s";
      s.style.opacity = rand(0.35,0.95).toFixed(2);
      space.appendChild(s);
    }

    // planets (random position & color hue)
    const planets = [
      {w: 380, h: 380, x:-120, y: 45,  hue: 220, dur: 15},
      {w: 280, h: 280, x: 72,  y: 18,  hue: 55,  dur: 13},
      {w: 210, h: 210, x: 68,  y: 68,  hue: 300, dur: 17},
    ];

    planets.forEach((p,idx)=>{
      const pl = document.createElement("div");
      pl.className = "rp-planet";
      pl.style.width  = p.w+"px";
      pl.style.height = p.h+"px";
      pl.style.left = (p.x)+"%";
      pl.style.top  = (p.y)+"%";
      pl.style.animationDuration = p.dur+"s";
      pl.style.filter = `hue-rotate(${p.hue}deg) saturate(1.1)`;
      pl.style.opacity = idx===1 ? "0.92" : "0.96";
      space.appendChild(pl);
    });

    // meteors (loop random by CSS delay via style)
    for(let i=0;i<6;i++){
      const m = document.createElement("div");
      m.className = "rp-meteor";
      m.style.left = rand(-40,40).toFixed(1)+"vw";
      m.style.top  = rand(-40,10).toFixed(1)+"vh";
      m.style.animationDelay = rand(0,4.5).toFixed(2)+"s";
      m.style.animationDuration = rand(2.8,4.2).toFixed(2)+"s";
      m.style.opacity = rand(0.45,0.95).toFixed(2);
      space.appendChild(m);
    }

    document.body.prepend(space);
  }

 // ===== RP_WELCOME_FIX_V13 =====
function getLoggedName() {
  try {
    // Pterodactyl biasanya expose object ini ketika sudah login
    var u = window.PterodactylUser || window.user || null;
    if (u) {
      if (u.username) return String(u.username);
      if (u.name) return String(u.name);
      if (u.email) return String(u.email).split("@")[0];
    }
  } catch (e) {}

  // Fallback: cari teks user di navbar (kalau ada)
  var candidates = [
    '[data-testid="user-menu-button"]',
    'button[aria-haspopup="menu"]',
    'header button',
  ];
  for (var i = 0; i < candidates.length; i++) {
    var el = document.querySelector(candidates[i]);
    if (el && el.textContent) {
      var t = el.textContent.trim();
      // cegah ketangkep "Admin"
      if (t && !/^admin$/i.test(t) && t.length <= 32) return t;
    }
  }
  return null;
}

function showWelcome() {
  var name = getLoggedName();
  if (!name) return;

  // bikin toast welcome yang tidak ngeblock klik
  var toast = document.getElementById("rp-toast");
  if (!toast) {
    toast = document.createElement("div");
    toast.id = "rp-toast";
    toast.style.cssText =
      "position:fixed;right:14px;top:14px;z-index:99999;" +
      "pointer-events:none;" +   // IMPORTANT biar tombol di belakang tetep bisa diklik
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
    '</span> <span style="opacity:.8;font-weight:700;">✨</span>';

  toast.style.display = "block";
  clearTimeout(window.__rpToastT);
  window.__rpToastT = setTimeout(function () {
    toast.style.display = "none";
  }, 5000);
}

document.addEventListener("DOMContentLoaded", function () {
  // tampilkan hanya setelah login (bukan di /auth/login)
  if (location.pathname.indexOf("/auth/") === 0) return;
  setTimeout(showWelcome, 800);
});

  // tag buttons Start/Restart/Stop supaya kena class rp-btn
  function tagButtons(){
    // cari button yang textnya start/restart/stop
    const btns = Array.from(document.querySelectorAll("button"));
    btns.forEach(b=>{
      const tx = (b.textContent || "").trim().toLowerCase();
      if(tx === "start" || tx === "restart" || tx === "stop"){
        b.classList.add("rp-btn");
      }
    });
  }

  // audio: autoplay di iOS/Android sering diblok → kita "auto-try", kalau gagal kasih hint & play di first tap
  function setupAudio(){
    const SRC = "/media/bgm.mp3";
    let audio = document.getElementById("rp-bgm");
    if(!audio){
      audio = document.createElement("audio");
      audio.id = "rp-bgm";
      audio.src = SRC;
      audio.loop = true;
      audio.preload = "auto";
      audio.playsInline = true;
      audio.setAttribute("playsinline","");
      audio.setAttribute("webkit-playsinline","");
      audio.volume = 0.55;
      document.body.appendChild(audio);
    }

    // hint UI
    let hint = document.getElementById("rp-audiohint");
    if(!hint){
      hint = document.createElement("div");
      hint.id = "rp-audiohint";
      hint.innerHTML = `<div class="box">Tap sekali untuk aktifkan <b>music</b> 🎵</div>`;
      document.body.appendChild(hint);
    }

    const tryPlay = () => audio.play().then(()=>{
      hint.style.display = "none";
    }).catch(()=>{
      hint.style.display = "block";
    });

    // auto-try saat load
    setTimeout(tryPlay, 600);

    // pertama kali user sentuh layar → play berhasil (aturan browser)
    const once = () => {
      tryPlay();
      window.removeEventListener("pointerdown", once, true);
      window.removeEventListener("touchstart", once, true);
      window.removeEventListener("click", once, true);
    };
    window.addEventListener("pointerdown", once, true);
    window.addEventListener("touchstart", once, true);
    window.addEventListener("click", once, true);

    // kalau tab di-hide → pause biar gak crash di iOS, balik → coba play lagi
    document.addEventListener("visibilitychange", ()=>{
      if(document.hidden) audio.pause();
      else setTimeout(tryPlay, 300);
    });
  }

  onReady(function(){
    injectSpace();
    injectWelcome();
    setupAudio();
    tagButtons();
    setInterval(tagButtons, 1200);
  });
})();
