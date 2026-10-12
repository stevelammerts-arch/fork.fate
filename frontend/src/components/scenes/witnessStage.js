// Witness stage: herald banner + spotlight vignette + scroll lock for realm
// heists. DOM-level on purpose — heists run outside React state so Home
// re-renders never interrupt a show.

// Themed teaser per summon kind: [en, es]. Composed as
// "Beware! {line} — LOOK UP!" / "¡Cuidado! {line} — ¡MIRA ARRIBA!"
const MID = {
  default: ["Something stirs in the realm", "Algo se agita en el reino"],
  dragon: ["A claw rises from the hoard", "Una garra surge del tesoro"],
  grave: ["Skeletal hands claw upward", "Manos esqueléticas emergen"],
  saucer: ["A saucer locks its beam", "Un platillo apunta su rayo"],
  wreck: ["That sign's in trouble", "Ese letrero está en apuros"],
  pursuit: ["Sirens scream across the skyline", "Sirenas cruzan el horizonte"],
  snatch: ["A cold presence materializes", "Una presencia fría se materializa"],
  plate: ["The little reaper drifts near", "El pequeño segador se acerca"],
  ball: ["A runaway beach ball bounces in", "Una pelota playera anda suelta"],
  crab: ["A little crab is on the move", "Un cangrejito está en marcha"],
  gulls: ["The gulls found something shiny", "Las gaviotas vieron algo brillante"],
  snowman: ["A gust brews in the snow", "Se forma una ráfaga en la nieve"],
  cardinal: ["A little bird comes to rest", "Un pajarito busca donde posarse"],
  owl: ["Silent wings cut the night", "Alas silenciosas cortan la noche"],
  petals: ["A warm gust gathers petals", "Una ráfaga arrastra pétalos"],
  stash: ["The squirrel is up to something", "La ardilla trama algo"],
  spear: ["War drums echo closer", "Los tambores de guerra se acercan"],
  spring: ["Something rattles loose", "Algo se está soltando"],
  gears: ["The gearworks grind strangely", "Los engranajes rechinan raro"],
  peek: ["Something stirs behind the crest", "Algo se mueve tras el medallón"],
  coffee: ["A hot spill is coming", "Se avecina un derrame caliente"],
  unicorn: ["Hooves thunder closer", "Se acercan cascos al galope"],
  poof: ["The third sister flits near", "La tercera hermana revolotea cerca"],
  breath: ["The tiny dragon draws a breath", "El dragoncito toma aire"],
  crash: ["The surfer's lost control", "El surfista perdió el control"],
};

export const HERALD_MS = 2000; // anticipation beat before the scroll begins

// Soft realm-themed chime that plays with the herald so heads turn mid-read.
const CHIME = {
  default: ["/pixie-chime.mp3", 0.4],
  grave: ["/soul-wail-short.mp3", 0.3],
  snatch: ["/soul-wail-short.mp3", 0.3],
  plate: ["/soul-wail-short.mp3", 0.3],
  dragon: ["/coin-clink.mp3", 0.5],
  breath: ["/coin-clink.mp3", 0.5],
  poof: ["/pixie-chime.mp3", 0.5],
  unicorn: ["/pixie-chime.mp3", 0.5],
  saucer: ["/beam-riser.mp3", 0.45],
  wreck: ["/beam-riser.mp3", 0.45],
  pursuit: ["/beam-riser.mp3", 0.45],
  gears: ["/steam-gears-run.mp3", 0.4],
  spring: ["/steam-gears-run.mp3", 0.4],
  peek: ["/steam-gears-run.mp3", 0.4],
  spear: ["/tiki-drums-short.mp3", 0.4],
  crash: ["/tiki-drums-short.mp3", 0.4],
  ball: ["/wing-whoosh.mp3", 0.55],
  crab: ["/wing-whoosh.mp3", 0.55],
  gulls: ["/wing-whoosh.mp3", 0.55],
  snowman: ["/snow-gust.mp3", 0.45],
  cardinal: ["/snow-gust.mp3", 0.45],
  owl: ["/leaf-rustle.mp3", 0.5],
  stash: ["/leaf-rustle.mp3", 0.5],
  petals: ["/spring-wind.mp3", 0.4],
  coffee: ["/barista-bell.mp3", 0.4],
};

function playChime(kind) {
  try {
    if (localStorage.getItem("ff_muted") === "1") return;
    const [src, vol] = CHIME[kind] || CHIME.default;
    const a = new Audio(src);
    a.volume = vol;
    a.play().catch(() => {});
  } catch { /* audio unavailable */ }
}

const lang = () => {
  try { return localStorage.getItem("ff_lang") === "es" ? "es" : "en"; } catch { return "en"; }
};

const EYE_SVG = '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/></svg>';

let heraldEl = null;
let heraldTimer = null;

export function showHerald(kind) {
  hideHerald();
  const es = lang() === "es";
  const mid = (MID[kind] || MID.default)[es ? 1 : 0];
  const el = document.createElement("div");
  el.className = "ff-herald";
  el.setAttribute("data-testid", "heist-herald");
  el.innerHTML = `<span class="ff-herald-eye">${EYE_SVG}</span><span>${es ? "¡Cuidado!" : "Beware!"} ${mid} — <b>${es ? "¡MIRA ARRIBA!" : "LOOK UP!"}</b></span>`;
  document.body.appendChild(el);
  heraldEl = el;
  playChime(kind);
  heraldTimer = setTimeout(hideHerald, 4600); // rides through the scroll, then fades
}

export function hideHerald() {
  clearTimeout(heraldTimer);
  const el = heraldEl;
  heraldEl = null;
  if (!el) return;
  el.classList.add("ff-herald-out");
  setTimeout(() => el.remove(), 450);
}

let vigEl = null;
let lockOn = false;
let safetyT = null;
const block = (e) => e.preventDefault();
const KEYS = ["ArrowDown", "ArrowUp", "PageDown", "PageUp", "Home", "End", " ", "Spacebar"];
const keyBlock = (e) => { if (KEYS.includes(e.key)) e.preventDefault(); };

/** Dim the page below the scenery and hold the scroll until the show ends. */
export function engageSpotlight() {
  if (!lockOn) {
    lockOn = true;
    document.documentElement.classList.add("ff-witness-lock");
    window.addEventListener("wheel", block, { passive: false });
    window.addEventListener("touchmove", block, { passive: false });
    window.addEventListener("keydown", keyBlock);
  }
  if (!vigEl) {
    vigEl = document.createElement("div");
    vigEl.className = "ff-witness-vignette";
    vigEl.setAttribute("data-testid", "witness-vignette");
    document.body.appendChild(vigEl);
    requestAnimationFrame(() => { if (vigEl) vigEl.classList.add("ff-witness-vignette-on"); });
  }
  clearTimeout(safetyT);
  safetyT = setTimeout(releaseSpotlight, 15000); // safety net: never trap the page
}

export function releaseSpotlight() {
  clearTimeout(safetyT);
  safetyT = null;
  if (lockOn) {
    lockOn = false;
    document.documentElement.classList.remove("ff-witness-lock");
    window.removeEventListener("wheel", block);
    window.removeEventListener("touchmove", block);
    window.removeEventListener("keydown", keyBlock);
  }
  const v = vigEl;
  vigEl = null;
  if (v) {
    v.classList.remove("ff-witness-vignette-on");
    setTimeout(() => v.remove(), 500);
  }
}
