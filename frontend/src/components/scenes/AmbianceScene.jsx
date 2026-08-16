// Ambiance realm scenery (cyberscape / steampunk / tiki / fantasy / fairy):
// background art, ambient sprites, neon sign, gecko, torches — plus each
// realm's companions and heists.
import React, { useState, useEffect, useRef } from "react";
import { useHeistWitness, preloadHeistAudio, playHeistSound } from "./heistLib";
import { CompanionPatrol } from "./companion";
import { SaucerAbduction, DragonHeist, TikiSpearHeist, SteamSpringHeist, SteamGearsHeist, UnicornChargeHeist, HotPursuitHeist } from "./realmHeists";

// Fantasy "Dragon's Hoard": glittering gold sparkles across the treasure pile
// + slow water droplets falling from the cave ceiling with a ripple on landing.
const GOLD_GLITTER = Array.from({ length: 16 }).map((_, i) => ({
  left: `${8 + (i * 6.1 + (i % 4) * 3.2) % 84}%`,
  top: `${74 + ((i * 13) % 20)}%`,
  size: 3 + (i % 3) * 2,
  dur: 1.6 + ((i * 7) % 5) * 0.4,
  delay: ((i * 11) % 13) * 0.3,
}));

const TIKI_TORCHES = [
  { x: 145, y: 322, r: 52, d: 0.9, dl: 0 },     // left wall lantern
  { x: 268, y: 332, r: 46, d: 1.1, dl: -0.3 },  // left wall lantern 2
  { x: 128, y: 618, r: 44, d: 1.0, dl: -0.6 },  // table lamp, bottom-left
  { x: 510, y: 245, r: 58, d: 1.2, dl: -0.2 },  // hanging lantern
  { x: 712, y: 262, r: 56, d: 0.95, dl: -0.5 }, // hanging lantern 2
  { x: 845, y: 310, r: 48, d: 1.15, dl: -0.8 }, // hanging lantern 3
  { x: 773, y: 330, r: 36, d: 1.05, dl: -0.15 },// small hanging lamp
  { x: 963, y: 332, r: 42, d: 0.9, dl: -0.7 },  // wicker lantern right
  { x: 1163, y: 265, r: 50, d: 1.2, dl: -0.4 }, // right wall lantern
  { x: 963, y: 487, r: 26, d: 0.85, dl: -0.25 },// booth candle
  { x: 1168, y: 600, r: 30, d: 1.0, dl: -0.55 },// table candle right
];

/** Torch Nightfall: when fate deals a card in the Tiki Lounge, every
 * lantern and candle in the painted art flares up bright and dancing
 * firelight rolls across the whole lounge for a few seconds. */
function TikiTorchNightfall({ box }) {
  const [active, setActive] = useState(false);
  useEffect(() => {
    let t = null;
    const onDeal = () => { setActive(true); clearTimeout(t); t = setTimeout(() => setActive(false), 4600); };
    window.addEventListener("ff:fate-dealt", onDeal);
    return () => { clearTimeout(t); window.removeEventListener("ff:fate-dealt", onDeal); };
  }, []);
  if (!box) return null;
  const k = box.dw / 1264;
  return (
    <div className="pointer-events-none absolute inset-0 z-[2] transition-opacity duration-700" style={{ opacity: active ? 1 : 0 }} data-testid="tiki-torch-nightfall">
      {TIKI_TORCHES.map((t, i) => (
        <span
          key={`torch-${i}`}
          className="absolute rounded-full mix-blend-screen"
          style={{
            left: box.offX + (t.x - t.r) * k,
            top: box.offY + (t.y - t.r) * k,
            width: t.r * 2 * k,
            height: t.r * 2 * k,
            background: "radial-gradient(circle, rgba(255,198,98,0.9), rgba(255,142,42,0.4) 46%, rgba(255,120,30,0) 72%)",
            filter: "blur(2px)",
            animation: active ? `ffTorchFlare ${t.d}s ease-in-out ${t.dl}s infinite` : "none",
          }}
        />
      ))}
      {/* firelight dancing across the walls and floor */}
      <div className="absolute inset-0 mix-blend-overlay" style={{ background: "radial-gradient(120% 90% at 22% 38%, rgba(255,170,70,0.55), transparent 55%), radial-gradient(110% 90% at 78% 30%, rgba(255,150,50,0.5), transparent 55%)", animation: active ? "ffTorchDance 1.6s ease-in-out infinite" : "none" }} />
      <div className="absolute inset-0 mix-blend-screen" style={{ background: "radial-gradient(130% 100% at 50% 85%, rgba(255,150,60,0.3), transparent 60%)", animation: active ? "ffTorchDance 2.3s ease-in-out -0.7s infinite" : "none" }} />
    </div>
  );
}

const CAVE_DRIPS = [
  { left: "22%", dur: 2.7, delay: 0 },
  { left: "54%", dur: 3.2, delay: 1.3 },
  { left: "79%", dur: 2.9, delay: 0.6 },
];
// Hoard dragon's steam: TWO steady strings of smoke that sit EXACTLY on the
// white smoke painted in the art (not the nostrils themselves) — many small,
// tightly-staggered puffs (negative delays = stream already formed) that
// overlap into unbroken ribbons. Coords are px in the 1264x848 cave art.
// Hoard dragon's steam: TWO steady strings of smoke rising from his
// NOSTRILS (user-pinpointed: left nostril art(770,415), right art(828,419))
// and flowing out along the white smoke painted in the art — many small,
// tightly-staggered puffs (negative delays = stream already formed) that
// overlap into unbroken ribbons. Coords are px in the 1264x848 cave art.
const DRAGON_STEAM = [
  // right nostril: sweeps right along the painted plume, curling at the top
  ...Array.from({ length: 12 }, (_, i) => ({
    x: 828 + (i % 3) * 2, y: 419 + (i % 2) * 3, w: 17 + (i % 3) * 4, h: 19 + (i % 3) * 4,
    dx: 118 + (i % 4) * 7, dy: -(132 + (i % 3) * 14),
    dur: 6.2, delay: -(i * 0.517),
  })),
  // right nostril, second layer: offset + slower cycle so the two ribbons
  // weave through each other and the smoke never thins out
  ...Array.from({ length: 10 }, (_, i) => ({
    x: 832 + (i % 3) * 2, y: 423 + (i % 2) * 4, w: 19 + (i % 3) * 4, h: 21 + (i % 3) * 4,
    dx: 106 + (i % 4) * 8, dy: -(146 + (i % 3) * 12),
    dur: 7.4, delay: -(i * 0.74 + 0.37),
  })),
  // right nostril, third layer: widest, slowest billow riding above the rest
  ...Array.from({ length: 9 }, (_, i) => ({
    x: 836 + (i % 3) * 3, y: 426 + (i % 2) * 4, w: 21 + (i % 3) * 5, h: 23 + (i % 3) * 5,
    dx: 94 + (i % 4) * 9, dy: -(158 + (i % 3) * 13),
    dur: 8.6, delay: -(i * 0.956 + 0.62),
  })),
  // left nostril: exits angled DOWN along the snout, then lifts up-left
  ...Array.from({ length: 10 }, (_, i) => ({
    x: 770 + (i % 3) * 2, y: 415 + (i % 2) * 3, w: 14 + (i % 3) * 3, h: 16 + (i % 3) * 3,
    dx: -(50 + (i % 3) * 7), dy: -(86 + (i % 3) * 10),
    dur: 6.2, delay: -(i * 0.62 + 0.31), anim: "ffDragonSteamL",
  })),
  // left nostril, second layer
  ...Array.from({ length: 8 }, (_, i) => ({
    x: 766 + (i % 3) * 2, y: 420 + (i % 2) * 4, w: 16 + (i % 3) * 3, h: 18 + (i % 3) * 3,
    dx: -(42 + (i % 3) * 8), dy: -(96 + (i % 3) * 9),
    dur: 7.4, delay: -(i * 0.925 + 0.46), anim: "ffDragonSteamL",
  })),
];


const STEAM_PUFFS = [
  { left: "7%", size: 70, dur: 5.5, delay: 0 },
  { left: "15%", size: 54, dur: 6.5, delay: 2.2 },
  { left: "83%", size: 66, dur: 6, delay: 1.1 },
  { left: "91%", size: 50, dur: 7, delay: 3.3 },
];

// Constant plume venting from the pipe coupling just right of center on the wall.
const STEAM_JET = Array.from({ length: 7 }).map((_, i) => ({
  size: 22 + (i % 3) * 12,
  dur: 3.0 + (i % 3) * 0.7,
  delay: -(i * 0.5),
}));

// Second, lazier jet venting from the lower pipe on the left of the wall art.
const STEAM_JET_LOW = Array.from({ length: 6 }).map((_, i) => ({
  size: 28 + (i % 3) * 14,
  dur: 3.8 + (i % 3) * 0.8,
  delay: -(i * 0.65) - 0.3,
}));


// Third jet: low vent between the cabinet and the table — the most visible one
// on a phone, where the upper pipes sit near the top edge.
const STEAM_JET_FLOOR = Array.from({ length: 6 }).map((_, i) => ({
  size: 36 + (i % 3) * 16,
  dur: 4.2 + (i % 3) * 0.9,
  delay: -(i * 0.8) - 0.15,
}));

const CYBER_CARS = [
  // Each vehicle appears ONCE and flies a round trip (L->R, then back R->L
  // mirrored) so traffic moves both directions with no duplicate sprites.
  // dur = full round trip; negative delays start some mid-return so both
  // directions are flowing right from page load.
  // Distant traffic — small & high up, feels far away
  { top: "12%", topM: "40%", size: 96, dur: 28, delay: 0, spinner: true },
  { top: "9%", topM: "36%", size: 78, dur: 32, delay: 6 },
  { top: "19%", topM: "52%", size: 56, dur: 36, delay: -22, alt: true },
  // Close-up people bus — big, low and in front
  { top: "40%", topM: "58%", size: 300, dur: 54, delay: 3, bus: true },
  // Far-away transit bus — small, high up, drifting slowly in the distance
  { top: "6%", topM: "14%", size: 62, dur: 68, delay: -40, bus2: true },
];

// A dense mass of steel cables hanging + swaying from the roof (steampunk)
const STEAM_CABLES = Array.from({ length: 22 }).map((_, i) => ({
  left: `${(i * 4.6 + (i % 4) * 1.3)}%`,
  h: 16 + ((i * 37) % 26),        // 16-42vh lengths
  w: 2 + (i % 3),                 // 2-4px thick
  sway: 2.2 + ((i * 13) % 5) * 0.7, // 2.2-5deg amplitude
  dur: 4.2 + ((i * 7) % 6) * 0.55,  // 4.2-7s
  delay: ((i * 11) % 12) * 0.28,    // staggered
  plug: i % 3 === 0,
}));

// Fairy Gully pond ripples, anchored to IMAGE coordinates (fractions of the
// artwork) so they stay on the water no matter how object-cover crops the
// scene per screen size. Sizes are in source-image pixels.
const FAIRY_RIPPLES = [
  { fx: 0.24, fy: 0.700, size: 110, dur: 4.2, delay: 0 },
  { fx: 0.33, fy: 0.690, size: 150, dur: 5.2, delay: 1.6 },
  { fx: 0.41, fy: 0.672, size: 90, dur: 3.8, delay: 2.8 },
  { fx: 0.47, fy: 0.660, size: 70, dur: 4.6, delay: 3.7 },
];
const GULLY_NAT = { w: 896, h: 1200 };

/** Track how an object-cover image maps into its container: returns the
 * displayed image box {offX, offY, dw, dh} so children can be positioned in
 * image-fraction coordinates. */
function useCoverAnchor(natW, natH) {
  const ref = useRef(null);
  const [box, setBox] = useState(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const update = () => {
      const { width: cw, height: ch } = el.getBoundingClientRect();
      const scale = Math.max(cw / natW, ch / natH);
      const dw = natW * scale, dh = natH * scale;
      setBox({ offX: (cw - dw) / 2, offY: (ch - dh) / 2, dw, dh });
    };
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, [natW, natH]);
  return [ref, box];
}

export const AMBIANCE = {
  cyber: { grad: "linear-gradient(180deg,#070A16 0%,#0C1030 46%,#160A28 100%)", skyline: "/cyber-skyline.png", neon: "/cyber-neon-logo.png", cars: "/cyber-car.png", cars2: "/cyber-car2.png", spinner: "/cyber-spinner-suv.png", bus: "/cyber-bus.png", bus2: "/cyber-bus2.png", saucer: "/cyber-saucer-mech.png", saucerFront: "/cyber-saucer-mech-front.png", rain: true, accent: "#22E0E0", sky: "#C77DFF" },
  steam: { grad: "linear-gradient(180deg,#17100A 0%,#241708 55%,#130C06 100%)", wall: "/steam-wall-full.png", golemLeft: "/steam-golem-left.png?v=503", golemRight: "/steam-golem-right.png?v=501", steam: true, roofCables: true, floor: true, accent: "#D9A44E", sky: "#F1D9A6" },
  tiki:  { grad: "linear-gradient(180deg,#2A140A 0%,#3A1C0E 46%,#180D07 100%)", lounge: "/tiki-lounge-full.png", accent: "#F0A24E", sky: "#FBE3C0" },
  fantasy: { grad: "linear-gradient(180deg,#1A0E08 0%,#120A06 55%,#080503 100%)", hoard: "/fantasy-cave.jpg", accent: "#E6B23A", sky: "#F3D9A0" },
  fairy: { grad: "linear-gradient(180deg,#0B1F14 0%,#123024 50%,#081710 100%)", gully: "/fairy-gully.png", accent: "#5EE0A8", sky: "#CFF5DC" },
};

// Fairy Gully ambience: drifting will-o'-wisps + tiny fluttering butterflies.
const FAIRY_WISPS = [
  { left: "8%", top: "62%", size: 26, dur: 9.5, delay: 0 },
  { left: "20%", top: "74%", size: 18, dur: 11, delay: -3 },
  { left: "33%", top: "58%", size: 22, dur: 8.5, delay: -6 },
  { left: "47%", top: "70%", size: 16, dur: 12, delay: -1.5 },
  { left: "60%", top: "64%", size: 24, dur: 10, delay: -4.5 },
  { left: "72%", top: "76%", size: 19, dur: 9, delay: -7.5 },
  { left: "85%", top: "60%", size: 27, dur: 11.5, delay: -2.5 },
  { left: "93%", top: "72%", size: 15, dur: 8, delay: -5.5 },
];
const FAIRY_BUTTERFLIES = [
  { left: "12%", top: "30%", size: 15, dur: 13, delay: 0, flap: 0.28, c1: "#F2A0E0", c2: "#C86BD8", alt: false },
  { left: "68%", top: "22%", size: 12, dur: 16, delay: -4, flap: 0.34, c1: "#8FD3FF", c2: "#5B9EF0", alt: true },
  { left: "40%", top: "44%", size: 17, dur: 14, delay: -8, flap: 0.25, c1: "#FFD36B", c2: "#F0A24E", alt: false },
  { left: "82%", top: "48%", size: 11, dur: 17, delay: -2, flap: 0.31, c1: "#B7A0FF", c2: "#8A6BE0", alt: true },
  { left: "25%", top: "16%", size: 13, dur: 15, delay: -11, flap: 0.29, c1: "#8FF0B0", c2: "#4ECf8A", alt: true },
  { left: "55%", top: "34%", size: 14, dur: 12, delay: -6, flap: 0.27, c1: "#FF9FA8", c2: "#E86B7C", alt: false },
];

/** SVG-only butterfly with fluttering wings: each wing folds toward the body
 * axis (scaleX at the body origin) — reused by the scene and reveal flourish. */
export function ButterflySprite({ size, c1, c2, flap }) {
  return (
    <svg viewBox="0 0 20 14" style={{ width: size, overflow: "visible", filter: `drop-shadow(0 0 3px ${c1}66)` }}>
      <g style={{ transformOrigin: "10px 7px", animation: `ffWingFold ${flap}s ease-in-out infinite` }}>
        <ellipse cx="5.6" cy="4.6" rx="4.8" ry="3.8" fill={c1} opacity="0.92" />
        <ellipse cx="6.8" cy="10" rx="3.4" ry="2.7" fill={c2} opacity="0.9" />
      </g>
      <g style={{ transformOrigin: "10px 7px", animation: `ffWingFold ${flap}s ease-in-out infinite` }}>
        <ellipse cx="14.4" cy="4.6" rx="4.8" ry="3.8" fill={c1} opacity="0.92" />
        <ellipse cx="13.2" cy="10" rx="3.4" ry="2.7" fill={c2} opacity="0.9" />
      </g>
      <rect x="9.35" y="2.6" width="1.3" height="9" rx="0.65" fill="#2A2118" />
    </svg>
  );
}

/** Tiny butterfly flitting along a wavy ambient path with fluttering wings. */
export function FlutterButterfly({ b, z = 3 }) {
  return (
    <div
      className="pointer-events-none absolute"
      style={{ left: b.left, top: b.top, zIndex: z, animation: `${b.alt ? "ffFlit2" : "ffFlit1"} ${b.dur}s ease-in-out ${b.delay}s infinite alternate` }}
      data-testid="fairy-butterfly"
    >
      <ButterflySprite size={b.size} c1={b.c1} c2={b.c2} flap={b.flap} />
    </div>
  );
}

const TIKI_FLAME_FRAMES = ["/tiki-flame-1.png", "/tiki-flame-2.png", "/tiki-flame-3.png", "/tiki-flame-4.png", "/tiki-flame-5.png"];
const TIKI_FLAME_FRAMES_GEN = ["/tiki-flame-gen-1.png", "/tiki-flame-gen-2.png", "/tiki-flame-gen-3.png", "/tiki-flame-gen-4.png"];

const GECKO_FLOOR_LOOP_MS = 19000;
const GECKO_CHASE_MS = 4600;

/** Floor gecko + rare fly-chase micro-moment. Every ~35-80s a fly buzzes by
 * and the gecko bolts after it, lunges, misses, and trots back. The chase is
 * armed only at the 19s loop boundary (where the loop keyframes have him at
 * translateX(0) facing right) so swapping animations never teleports him. */
function TikiFloorGecko() {
  const [chase, setChase] = useState(false);
  const loopStartRef = useRef(Date.now());
  useEffect(() => {
    let t1, t2, t3;
    const arm = () => {
      const elapsed = (Date.now() - loopStartRef.current) % GECKO_FLOOR_LOOP_MS;
      t2 = setTimeout(() => {
        setChase(true);
        t3 = setTimeout(() => {
          setChase(false);
          loopStartRef.current = Date.now(); // loop restarts fresh after the swap
          schedule();
        }, GECKO_CHASE_MS);
      }, (GECKO_FLOOR_LOOP_MS - elapsed) % GECKO_FLOOR_LOOP_MS);
    };
    const schedule = () => { t1 = setTimeout(arm, 35000 + Math.random() * 45000); };
    schedule();
    const force = () => { clearTimeout(t1); clearTimeout(t2); loopStartRef.current = Date.now(); arm(); };
    window.addEventListener("ff:gecko-chase", force);
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); window.removeEventListener("ff:gecko-chase", force); };
  }, []);
  return (
    <div className="absolute z-[3]" style={{ left: "6%", bottom: "2vh", width: "clamp(54px, 6vw, 78px)" }} data-testid="tiki-gecko-floor">
      {chase && (
        <div className="absolute left-0" style={{ top: -6, animation: `ffTikiFly ${GECKO_CHASE_MS}ms linear forwards` }} data-testid="tiki-fly">
          <span className="block rounded-full" style={{ width: 7, height: 5, background: "radial-gradient(circle at 35% 35%, #4A3A26, #171008 70%)", boxShadow: "0 -2px 2px rgba(240,230,200,0.35)", animation: "ffFlyJitter 0.14s linear infinite alternate" }} />
        </div>
      )}
      <div style={{ animation: chase ? `ffGeckoChase ${GECKO_CHASE_MS}ms linear forwards` : "ffGeckoFloor 19s linear infinite" }}>
        <img src="/tiki-gecko.png" alt="" className="w-full" style={{ animation: chase ? "ffGeckoChaseGait 0.35s ease-in-out infinite" : "ffGeckoFloorGait 19s linear infinite", transformOrigin: "50% 100%" }} />
      </div>
    </div>
  );
}


/** Cyberscape neon sign — with the "Neon Wreck" heist baked in: every so
 * often a flying car sputters out of traffic, CRUNCHES into the sign, and
 * the neon tubes flutter out (bzzz bzzz bzzz) before humming back to life.
 * First wreck 30-60s after load, then every 3-6 min (`ff:neon-crash`
 * forces one, used for testing). */
function CyberNeonSign({ neon }) {
  const witnessRef = useHeistWitness("wreck");
  useEffect(() => { preloadHeistAudio(["/neon-crunch.mp3", "/neon-bzz.mp3"]); }, []);
  const [crash, setCrash] = useState(0); // 1 careening in, 2 impact + neons shorting, 3 humming back on
  // The sticky banner's height varies by device — measure its real bottom and
  // hang the sign safely below it, so no crash ever plays behind the header.
  const [signTop, setSignTop] = useState(null);
  useEffect(() => {
    const measure = () => {
      const bar = document.querySelector('[data-testid="sponsor-marquee"], [data-testid="sponsor-marquee-empty"]');
      const hdr = document.querySelector("header");
      const bottom = Math.max(
        bar ? bar.getBoundingClientRect().bottom : 0,
        hdr ? hdr.getBoundingClientRect().bottom : 0
      );
      setSignTop(Math.max(bottom + 16, window.innerHeight * 0.16));
    };
    measure();
    const settle = setTimeout(measure, 1500); // re-measure after fonts/layout settle
    window.addEventListener("resize", measure);
    return () => { clearTimeout(settle); window.removeEventListener("resize", measure); };
  }, []);
  useEffect(() => {
    const timers = [];
    let pending = null;
    let poll = null;
    let running = false;
    const play = (src, vol) => playHeistSound(src, vol);
    const schedule = (ms) => { clearTimeout(pending); pending = setTimeout(start, ms); };
    const bail = () => { running = false; schedule(30000); };
    // The whole cyberscape is a FIXED backdrop — page content rolls right over
    // the sign once the user scrolls. So before a wreck, pull them back up to
    // the skyline for good viewing (same courtesy as the medallion heists).
    const go = () => {
      window.__ffHeistCooldownUntil = Date.now() + 90000 + Math.random() * 30000; // claim the heist slot
      setCrash(1);                                          // careens out of traffic
      timers.push(setTimeout(() => {                        // CRUNCH
        setCrash(2);
        play("/neon-crunch.mp3", 0.7);
      }, 2300));
      timers.push(setTimeout(() => play("/neon-bzz.mp3", 0.55), 2550)); // bzzz bzzz bzzz
      timers.push(setTimeout(() => setCrash(3), 6200));     // ...and hums back to life
      timers.push(setTimeout(() => {
        setCrash(0); running = false;
        witnessRef.current(true);
        schedule(180000 + Math.random() * 180000);          // next wreck in 3-6 min
      }, 7600));
    };
    const start = () => {
      if (running) return;
      running = true;
      if (window.__ffFateBusy) { bail(); return; }          // never talk over fate
      if (Date.now() < (window.__ffHeistCooldownUntil || 0)) { bail(); return; } // one heist at a time
      if (window.scrollY <= 40) { go(); return; }
      window.scrollTo({ top: 0, behavior: "smooth" });
      const t0 = Date.now();
      poll = setInterval(() => {
        if (window.scrollY <= 2 || Date.now() - t0 > 2500) {
          clearInterval(poll);
          timers.push(setTimeout(() => (window.__ffFateBusy ? bail() : go()), 250)); // settle beat
        }
      }, 90);
    };
    schedule(30000 + Math.random() * 30000);
    window.addEventListener("ff:neon-crash", start);
    return () => { clearTimeout(pending); clearInterval(poll); timers.forEach(clearTimeout); window.removeEventListener("ff:neon-crash", start); };
  }, []); // witnessRef is a stable ref
  const out = crash === 2; // tubes shorting out
  return (
    <div className="absolute left-1/2 z-[1] w-[62vw] max-w-xs -translate-x-1/2" style={{ top: signTop ?? "26%" }} data-testid="cyber-neon">
      <div className="absolute left-1/2 top-1/2 h-[135%] w-[135%] -translate-x-1/2 -translate-y-1/2 rounded-full" style={{ background: "radial-gradient(circle, rgba(199,125,255,0.42), rgba(34,224,224,0.18) 46%, transparent 70%)", filter: "blur(26px)", animation: out ? "ffNeonHaloShort 3.9s linear forwards" : "ffNeonFlash 3.4s ease-in-out infinite" }} />
      <img src={neon} alt="" className="relative w-full object-contain" data-testid="cyber-neon-sign" style={{ animation: out ? "ffNeonShort 3.9s linear forwards" : crash === 3 ? "ffNeonRevive 1.2s steps(6,end) both, ffNeonFloat 6s ease-in-out infinite" : "ffNeonFloat 6s ease-in-out infinite" }} />
      {/* the doomed car: sputters up from the streets below, crunches into the sign's underside, tumbles */}
      {(crash === 1 || crash === 2) && (
        <div className="absolute" style={{ right: "16%", top: "62%", animation: crash === 1 ? "ffCarHoverUp 2.3s cubic-bezier(0.35,0.2,0.55,1) forwards" : "ffCarTumble 1.15s cubic-bezier(0.45,0.1,0.8,0.5) forwards" }} data-testid="neon-crash-car">
          <img src="/cyber-car2.png" alt="" className="w-[16vw] max-w-[86px] object-contain" style={{ transform: "scaleX(-1)", animation: crash === 1 ? "ffCarSputter 0.4s linear infinite" : "none", filter: "drop-shadow(0 0 8px rgba(34,224,224,0.5))" }} />
        </div>
      )}
      {/* impact flash + neon glass sparks */}
      {crash === 2 && (
        <div className="absolute" style={{ right: "20%", top: "58%" }} data-testid="neon-crash-sparks">
          <span className="absolute rounded-full" style={{ left: -18, top: -18, width: 36, height: 36, background: "radial-gradient(circle, #FFFFFF, rgba(199,125,255,0.6) 45%, transparent 75%)", animation: "ffPoofSparkle 0.5s ease-out forwards" }} />
          {Array.from({ length: 10 }, (_, i) => {
            const a = (i / 10) * Math.PI * 2;
            const d = 26 + (i % 3) * 16;
            return (
              <span key={`spark-${i}`} className="absolute rounded-full" style={{ width: 4 + (i % 3) * 2, height: 4 + (i % 3) * 2, "--dx": `${Math.cos(a) * d}px`, "--dy": `${Math.sin(a) * d}px`, background: i % 2 ? "#22E0E0" : "#C77DFF", boxShadow: `0 0 6px ${i % 2 ? "#22E0E0" : "#C77DFF"}`, animation: "ffPoofSparkle 0.85s ease-out forwards" }} />
            );
          })}
        </div>
      )}
    </div>
  );
}


/** Soft woodstove crackle looping near the left golem's smoldering belly grate.
 * Desktop-only (he's hidden on mobile); follows the global mute live. */
function useFurnaceCrackle(enabled) {
  useEffect(() => {
    if (!enabled) return undefined;
    if (!window.matchMedia("(min-width: 640px)").matches) return undefined;
    const a = new Audio("/golem-furnace-crackle.mp3");
    a.loop = true;
    a.volume = 0.14;
    a.preload = "auto";
    const sync = () => {
      const muted = localStorage.getItem("ff_muted") === "1";
      if (muted) { if (!a.paused) a.pause(); }
      else if (a.paused) a.play().catch(() => {});
    };
    sync();
    const iv = setInterval(sync, 1500);
    return () => { clearInterval(iv); a.pause(); a.src = ""; };
  }, [enabled]);
}

/** Rare 'furnace blast' for the left golem: gears grind inside, then a thick
 * stream of fire, sparks and embers spews from his belly grate.
 * Desktop-only (he's hidden on mobile); `ff:furnace-blast` forces it. */
function useFurnaceBlast(enabled) {
  const [ph, setPh] = useState(0); // 0 idle, 1 gears grinding (glow surges), 2 fire spews, 3 burning down (embers cool on the floor)
  const witnessRef = useHeistWitness("furnace");
  useEffect(() => {
    if (!enabled) return undefined;
    if (!window.matchMedia("(min-width: 640px)").matches) return undefined;
    preloadHeistAudio(["/golem-gears.mp3", "/golem-fire-blast.mp3"]);
    let timers = [];
    let pending;
    const schedule = (min, spread) => { pending = setTimeout(run, min + Math.random() * spread); };
    const run = (forced = false) => {
      // HEIST TRAFFIC CONTROL: never start while fate is shuffling/revealing or
      // another heist holds the floor (medallion heists scroll the page to the
      // logo — colliding with a golem show means the user misses both).
      if (!forced && (window.__ffFateBusy || Date.now() < (window.__ffHeistCooldownUntil || 0))) { schedule(25000, 20000); return; }
      // Reserve the stage: blast runs 7.4s + a breather before the next act.
      window.__ffHeistCooldownUntil = Math.max(window.__ffHeistCooldownUntil || 0, Date.now() + 20000);
      timers.forEach(clearTimeout); timers = [];
      setPh(1);
      playHeistSound("/golem-gears.mp3", 0.5);
      timers.push(setTimeout(() => {
        setPh(2);
        playHeistSound("/golem-fire-blast.mp3", 0.55);
      }, 2000));
      timers.push(setTimeout(() => setPh(3), 5200));            // fire burns down; embers glow on the floor
      timers.push(setTimeout(() => { setPh(0); witnessRef.current(true); schedule(200000, 160000); }, 7400));
    };
    schedule(70000, 60000);
    const force = () => { clearTimeout(pending); run(true); };
    window.addEventListener("ff:furnace-blast", force);
    return () => { clearTimeout(pending); timers.forEach(clearTimeout); window.removeEventListener("ff:furnace-blast", force); };
  }, [enabled]);
  return ph;
}

/** Rare 'awakening' for the right golem: head raises, eyes glow smoky green,
 * one heavy step forward with the right leg, steps back, powers down.
 * First 45-85s after load, then every 3-5.5 min (`ff:golem-wake` forces it). */
function useGolemWake(enabled) {
  const [ph, setPh] = useState(0); // 0 asleep, 1 awake, 2 leg lifts, 3 foot plants fwd (leaning), 4 leg lifts back, 5 stands, 6 powering down
  const witnessRef = useHeistWitness("awakening");
  useEffect(() => {
    if (!enabled) return undefined;
    ["/steam-golem-right-awake.png?v=501", "/steam-golem-right-step.png?v=501", "/steam-golem-right-lift.png?v=501"].forEach((s) => { const im = new Image(); im.src = s; });
    preloadHeistAudio(["/golem-wake-up.mp3", "/golem-step-forward.mp3", "/golem-thud.wav", "/golem-step-back.mp3", "/golem-power-down.mp3"]);
    let timers = [];
    let pending;
    const schedule = (min, spread) => { pending = setTimeout(run, min + Math.random() * spread); };
    const run = (forced = false) => {
      // HEIST TRAFFIC CONTROL: defer if fate is busy or another heist has the
      // floor, and reserve the stage for the full 10.9s show + a breather so
      // medallion heists can't scroll the page away mid-awakening.
      if (!forced && (window.__ffFateBusy || Date.now() < (window.__ffHeistCooldownUntil || 0))) { schedule(25000, 20000); return; }
      window.__ffHeistCooldownUntil = Math.max(window.__ffHeistCooldownUntil || 0, Date.now() + 25000);
      timers.forEach(clearTimeout); timers = [];
      setPh(1);                                                  // rumble + head raises, eyes ignite
      playHeistSound("/golem-wake-up.mp3", 0.5);
      timers.push(setTimeout(() => setPh(2), 2300));             // right knee lifts, body leans in
      timers.push(setTimeout(() => {                             // foot plants forward
        setPh(3);
        playHeistSound("/golem-step-forward.mp3", 0.55);
      }, 3400));
      timers.push(setTimeout(() => {                             // FLOOR THUD: flat foot hits the ground mid-settle
        playHeistSound("/golem-thud.wav", 0.65);
      }, 3950));
      timers.push(setTimeout(() => {                             // (holds the stomp for a beat, then) leg lifts back off the floor
        setPh(4);
        playHeistSound("/golem-step-back.mp3", 0.55);
      }, 6600));
      timers.push(setTimeout(() => setPh(5), 7700));             // rotates back to a stand
      timers.push(setTimeout(() => {                             // head lowers, eyes die out
        setPh(6);
        playHeistSound("/golem-power-down.mp3", 0.5);
      }, 9300));
      timers.push(setTimeout(() => { setPh(0); witnessRef.current(true); schedule(180000, 150000); }, 10900));
    };
    schedule(45000, 40000);
    const force = () => { clearTimeout(pending); run(true); };
    window.addEventListener("ff:golem-wake", force);
    return () => { clearTimeout(pending); timers.forEach(clearTimeout); window.removeEventListener("ff:golem-wake", force); };
  }, [enabled]);
  return ph;
}

/** THE ARM DROP: the apprentice's left arm starts freshly MOUNTED on his open
 * shoulder socket — until the weld gives out: sparks spit in warning, the arm
 * tears loose, falls, and slams the floor with a thump + dust kick. The
 * mechanics quietly bolt it back on a few minutes later so the show repeats.
 * Phases: 0 attached, 1 weld failing (spark warning), 2 falling, 3 landed
 * (thump + dust + burst), 4 resting on the floor, 5 re-mount fade.
 * First drop 50-90s after load (`ff:arm-drop` forces it, used for testing). */
function useArmDrop(enabled) {
  const [ph, setPh] = useState(0);
  const witnessRef = useHeistWitness("armdrop");
  useEffect(() => {
    if (!enabled) return undefined;
    if (!window.matchMedia("(min-width: 640px)").matches) return undefined;
    preloadHeistAudio(["/golem-thud.wav", "/arm-zap.mp3"]);
    let timers = [];
    let pending;
    const schedule = (min, spread) => { pending = setTimeout(run, min + Math.random() * spread); };
    const run = (forced = false) => {
      // HEIST TRAFFIC CONTROL: same courtesy as the golem shows
      if (!forced && (window.__ffFateBusy || Date.now() < (window.__ffHeistCooldownUntil || 0))) { schedule(25000, 20000); return; }
      window.__ffHeistCooldownUntil = Math.max(window.__ffHeistCooldownUntil || 0, Date.now() + 15000);
      timers.forEach(clearTimeout); timers = [];
      setPh(1);                                                  // the weld starts failing — sparks spit at the socket
      timers.push(setTimeout(() => {                             // it tears loose — ZAP + spark shower
        setPh(2);
        playHeistSound("/arm-zap.mp3", 0.5);
      }, 1600));
      timers.push(setTimeout(() => {                             // SLAM: floor thump, dust kick, spark burst
        setPh(3);
        playHeistSound("/golem-thud.wav", 0.65);
      }, 2450));
      timers.push(setTimeout(() => { setPh(4); witnessRef.current(true); }, 3400));
      const rest = 160000 + Math.random() * 80000;               // lies there 2.5-4 min
      timers.push(setTimeout(() => setPh(5), 3400 + rest));      // fades off the floor...
      timers.push(setTimeout(() => { setPh(0); schedule(60000, 60000); }, 4300 + rest)); // ...re-mounted on the socket
    };
    schedule(50000, 40000);
    const force = () => { clearTimeout(pending); run(true); };
    window.addEventListener("ff:arm-drop", force);
    return () => { clearTimeout(pending); timers.forEach(clearTimeout); window.removeEventListener("ff:arm-drop", force); };
  }, [enabled]);
  return ph;
}

/** TRAP SNAP: a third rat — the CHEESE THIEF — creeps along the corner from
 * the right, stops at the mousetrap, nibbles at the trigger... SNAP! It
 * barely escapes with the cheese in tow. The trap sits sprung and empty a
 * few minutes until the mechanics re-bait it. Phases: 0 baited, 1 sneaking
 * in, 2 nibbling, 3 SNAP + escape, 4 sprung/empty. `ff:trap-snap` forces. */
function useTrapSnap(enabled) {
  const [ph, setPh] = useState(0);
  const witnessRef = useHeistWitness("cheesethief");
  useEffect(() => {
    if (!enabled) return undefined;
    if (!window.matchMedia("(min-width: 640px)").matches) return undefined;
    preloadHeistAudio(["/stash-pop.mp3"]);
    let timers = [];
    let pending;
    const schedule = (min, spread) => { pending = setTimeout(run, min + Math.random() * spread); };
    const run = (forced = false) => {
      // a corner-of-the-eye show: only defers to an active fate reveal
      if (!forced && window.__ffFateBusy) { schedule(20000, 15000); return; }
      timers.forEach(clearTimeout); timers = [];
      setPh(1);                                       // thief sneaks in from the right
      timers.push(setTimeout(() => setPh(2), 2300));  // nibbles at the trigger...
      timers.push(setTimeout(() => {                  // SNAP! barely escapes, cheese in tow
        setPh(3);
        playHeistSound("/stash-pop.mp3", 0.6);
      }, 3700));
      timers.push(setTimeout(() => { setPh(4); witnessRef.current(true); }, 4900));
      const rest = 150000 + Math.random() * 90000;    // sprung + empty for 2.5-4 min
      timers.push(setTimeout(() => { setPh(0); schedule(60000, 90000); }, 4900 + rest)); // re-baited
    };
    schedule(70000, 50000);
    const force = () => { clearTimeout(pending); run(true); };
    window.addEventListener("ff:trap-snap", force);
    return () => { clearTimeout(pending); timers.forEach(clearTimeout); window.removeEventListener("ff:trap-snap", force); };
  }, [enabled]);
  return ph;
}

export function AmbianceScene({ theme, cfg, heistEpoch = 0 }) {
  const golemWake = useGolemWake(!!cfg.golemRight);
  const blastPh = useFurnaceBlast(!!cfg.golemLeft);
  const armPh = useArmDrop(!!cfg.golemLeft);
  const trapPh = useTrapSnap(!!cfg.golemLeft);
  // any golem event running → the strapped rack robot powers up in response
  const workshopEvent = (golemWake >= 1 && golemWake <= 5) || blastPh >= 1;
  // WORKSHOP TROPHY: seeing the rack robot power up (head straight, solid
  // green lenses) counts as its own hidden Collection fate. Recorded 3s into
  // the power-up so the viewer has actually seen it; desktop-only since the
  // rack itself is hidden below sm.
  const witnessWorkshop = useHeistWitness("workshop");
  useEffect(() => {
    if (!workshopEvent || !cfg.golemLeft) return undefined;
    if (!window.matchMedia("(min-width: 640px)").matches) return undefined;
    const t = setTimeout(() => witnessWorkshop.current(true), 3000);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [workshopEvent, cfg.golemLeft]);
  useFurnaceCrackle(!!cfg.golemLeft);
  const [mobile, setMobile] = useState(false);
  const [abducting, setAbducting] = useState(false);
  const [chase, setChase] = useState(null); // null | { dir: 1 (L->R) | -1 (R->L) }
  // Occasional police pursuit across the cyber skyline: first one ~25-60s in,
  // then every ~50-140s, entering from a random side. 9s mount (7s run + tail).
  useEffect(() => {
    if (!cfg.cars) return;
    let t1, t2;
    const schedule = (min, spread) => {
      t1 = setTimeout(() => {
        setChase({ dir: Math.random() < 0.5 ? 1 : -1 });
        t2 = setTimeout(() => { setChase(null); schedule(50000, 90000); }, 11000);
      }, min + Math.random() * spread);
    };
    schedule(25000, 35000);
    return () => { clearTimeout(t1); clearTimeout(t2); setChase(null); };
  }, [cfg.cars]);
  const [anchorRef, coverBox] = useCoverAnchor(GULLY_NAT.w, GULLY_NAT.h);
  const [loungeRef, loungeBox] = useCoverAnchor(1264, 848);
  const setSceneRef = (el) => { anchorRef.current = el; loungeRef.current = el; };
  useEffect(() => {
    const mq = window.matchMedia("(max-width: 640px)");
    const on = () => setMobile(mq.matches);
    on();
    mq.addEventListener("change", on);
    return () => mq.removeEventListener("change", on);
  }, []);
  const flameFrames = (typeof localStorage !== "undefined" && localStorage.getItem("ff_flame") === "gen")
    ? TIKI_FLAME_FRAMES_GEN : TIKI_FLAME_FRAMES;
  return (<>
    <div ref={setSceneRef} className="ff-theme-scene pointer-events-none fixed inset-0 z-0 select-none overflow-hidden" data-testid={`ambiance-scene-${theme}`}>
      <div className="absolute inset-0" style={{ background: cfg.grad }} />
      {cfg.hoard && (<>
        <img src={cfg.hoard} alt="" className="absolute inset-0 z-[1] h-full w-full object-cover opacity-90" style={{ objectPosition: "center center" }} data-testid="fantasy-hoard-bg" />
        <div className="absolute inset-0 z-[1]" style={{ background: "linear-gradient(180deg, rgba(10,7,5,0.55) 0%, rgba(10,7,5,0.12) 34%, rgba(10,7,5,0.28) 70%, rgba(8,5,3,0.72) 100%)" }} />
        <div className="absolute inset-0 z-[1]" style={{ background: "radial-gradient(ellipse at 50% 80%, rgba(230,160,60,0.30), rgba(224,86,30,0.10) 44%, transparent 72%)", mixBlendMode: "screen", animation: "ffCaveFlicker 3.4s ease-in-out infinite" }} data-testid="fantasy-firelight" />
        <img src="/fantasy-eyes.png" alt="" className="pointer-events-none absolute inset-0 z-[2] h-full w-full object-cover" style={{ objectPosition: "center center", mixBlendMode: "screen", animation: "ffEyeGlow 2.4s ease-in-out infinite" }} data-testid="fantasy-eyes" />
        {/* Living nostril steam: pinned to the artwork through the same
            1264x848 object-cover mapping the lounge anchor measures. */}
        {loungeBox && DRAGON_STEAM.map((s, i) => {
          const k = loungeBox.dw / 1264;
          return (
            <span
              key={`dsteam-${i}`}
              className="ff-dragon-steam pointer-events-none absolute z-[2]"
              data-testid="dragon-nostril-steam"
              style={{
                left: loungeBox.offX + s.x * k - (s.w * k) / 2,
                top: loungeBox.offY + s.y * k - s.h * k,
                width: s.w * k,
                height: s.h * k,
                "--sx": `${s.dx * k}px`,
                "--sy": `${s.dy * k}px`,
                animation: `${s.anim || "ffDragonSteam"} ${s.dur}s linear ${s.delay}s infinite`,
              }}
            />
          );
        })}
        {GOLD_GLITTER.map((g, i) => (
          <span key={`glit-${i}`} className="pointer-events-none absolute z-[2] rounded-full" style={{ left: g.left, top: g.top, width: g.size, height: g.size, background: "radial-gradient(circle, #FFF6D5, rgba(255,220,130,0.6) 42%, rgba(255,220,130,0) 74%)", animation: `ffGoldTwinkle ${g.dur}s ease-in-out ${g.delay}s infinite` }} />
        ))}
        {CAVE_DRIPS.map((d, i) => (
          <React.Fragment key={`drip-${i}`}>
            <span className="pointer-events-none absolute z-[3]" style={{ left: d.left, top: 0, width: 3, height: 12, borderRadius: "0 0 3px 3px", background: "linear-gradient(180deg, rgba(40,60,72,0.04), rgba(58,88,104,0.72))", animation: `ffDripFall ${d.dur}s cubic-bezier(0.55,0,0.95,0.5) ${d.delay}s infinite` }} />
            <span className="pointer-events-none absolute z-[3] rounded-full border" style={{ left: d.left, top: "88vh", width: 16, height: 5, borderColor: "rgba(58,88,104,0.5)", animation: `ffDripRipple ${d.dur}s ease-out ${d.delay}s infinite` }} />
          </React.Fragment>
        ))}
      </>)}
      {cfg.gully && (<>
        <img src={cfg.gully} alt="" className="absolute inset-0 z-[1] h-full w-full object-cover opacity-95" style={{ objectPosition: "center center" }} data-testid="fairy-gully-bg" />
        <div className="absolute inset-0 z-[1]" style={{ background: "linear-gradient(180deg, rgba(6,18,12,0.5) 0%, rgba(6,18,12,0.1) 32%, rgba(6,18,12,0.22) 68%, rgba(4,12,8,0.68) 100%)" }} />
        {/* Will-o'-wisps: glowing teal orbs drifting up through the gully */}
        {FAIRY_WISPS.map((w, i) => (
          <span key={`wisp-${i}`} className="pointer-events-none absolute z-[2] rounded-full" style={{ left: w.left, top: w.top, width: w.size, height: w.size, background: "radial-gradient(circle, rgba(214,255,236,0.95), rgba(94,224,168,0.55) 40%, rgba(64,208,168,0) 72%)", filter: "blur(1px)", animation: `ffWispDrift ${w.dur}s ease-in-out ${w.delay}s infinite, ffWispGlow ${(w.dur / 3).toFixed(1)}s ease-in-out ${w.delay}s infinite` }} data-testid="fairy-wisp" />
        ))}
        {/* Pond ripples: expanding rings pinned to the water in the artwork
            (image-fraction coords mapped through the object-cover crop) */}
        {coverBox && FAIRY_RIPPLES.map((r, i) => {
          const s = r.size * (coverBox.dw / GULLY_NAT.w);
          return (
            <span key={`rip-${i}`} className="pointer-events-none absolute z-[2]" style={{ left: coverBox.offX + r.fx * coverBox.dw - s / 2, top: coverBox.offY + r.fy * coverBox.dh - s / 2, width: s, height: s, transform: "scaleY(0.32)" }} data-testid="fairy-ripple">
              <span className="absolute inset-0 rounded-full border" style={{ borderColor: "rgba(214,240,255,0.55)", boxShadow: "0 0 6px rgba(180,225,255,0.35)", animation: `ffRippleRing ${r.dur}s ease-out ${r.delay}s infinite` }} />
              <span className="absolute inset-0 rounded-full border" style={{ borderColor: "rgba(214,240,255,0.35)", animation: `ffRippleRing ${r.dur}s ease-out ${r.delay + r.dur * 0.35}s infinite` }} />
            </span>
          );
        })}
        {/* Tiny butterflies with fluttering wings */}
        {FAIRY_BUTTERFLIES.map((b, i) => (
          <FlutterButterfly key={`bf-${i}`} b={b} />
        ))}
        {/* The painted fairies' wings BEAT: two AI-edited patches of the same
            artwork (wings raised / wings swept down, feathered edges) cross-
            fade over the base painting (wings mid). Anchored to the measured
            cover box so the patches stay glued to the fairies at any size.
            Patch rect in image px: (450,380)-(896,830) of the 896x1200 art
            (right edge = artwork edge so no painted wing tips peek out). */}
        {coverBox && [
          { name: "up", anim: "ffWingUp" },
          { name: "down", anim: "ffWingDown" },
        ].map((f) => (
          <img
            key={`wings-${f.name}`}
            src={`/fairy-wings-${f.name}.png`}
            alt=""
            data-testid={`fairy-wings-${f.name}`}
            className="pointer-events-none absolute z-[2]"
            style={{
              left: coverBox.offX + (450 / GULLY_NAT.w) * coverBox.dw,
              top: coverBox.offY + (380 / GULLY_NAT.h) * coverBox.dh,
              width: ((896 - 450) / GULLY_NAT.w) * coverBox.dw,
              opacity: 0,
              animation: `${f.anim} 1s ease-in-out infinite`,
            }}
          />
        ))}
      </>)}
      {cfg.skyline && <img src={cfg.skyline} alt="" className="absolute bottom-0 left-0 w-full object-cover opacity-70" style={{ maxHeight: "52vh" }} />}
      {cfg.rain && <div className="absolute inset-0 ff-rain" />}
      {cfg.cars && CYBER_CARS.map((c, i) => (
        <div key={`car-${i}`} className={`absolute left-0 ${c.bus ? "z-[6]" : c.bus2 ? "z-[2]" : c.spinner ? "z-[5]" : "z-[3]"}`}
          style={{ top: mobile ? c.topM : c.top, willChange: "transform", backfaceVisibility: "hidden", WebkitBackfaceVisibility: "hidden", animation: `${c.bus ? "ffFlyBusBoth" : "ffFlyBoth"} ${c.dur}s linear ${c.delay}s infinite both` }}>
          {c.bus && (<>
            {/* broad soft under-glow, breathing slowly */}
            <span className="pointer-events-none absolute" style={{ left: "20%", bottom: "-2%", width: "60%", height: "40%", transformOrigin: "50% 0%", background: "radial-gradient(ellipse at center, rgba(34,224,224,0.4) 0%, rgba(34,224,224,0.18) 46%, rgba(34,224,224,0) 72%)", filter: "blur(9px)", animation: "ffThrusterHaze 2.6s ease-in-out infinite" }} />
            {/* engine plumes under each hover pod (pods sit ~26% / ~77% across the sprite) */}
            <span className="pointer-events-none absolute" style={{ left: "20%", bottom: "-6%", width: "13%", height: "36%", transformOrigin: "50% 0%", background: "radial-gradient(ellipse at 50% 18%, rgba(150,255,246,0.9) 0%, rgba(34,224,224,0.5) 40%, rgba(34,224,224,0) 74%)", filter: "blur(6px)", animation: "ffThrusterPlume 1.1s ease-in-out infinite" }} />
            <span className="pointer-events-none absolute" style={{ left: "70.5%", bottom: "-6%", width: "13%", height: "36%", transformOrigin: "50% 0%", background: "radial-gradient(ellipse at 50% 18%, rgba(150,255,246,0.9) 0%, rgba(34,224,224,0.5) 40%, rgba(34,224,224,0) 74%)", filter: "blur(6px)", animation: "ffThrusterPlume 1.35s ease-in-out -0.45s infinite" }} />
          </>)}
          <img src={c.bus ? cfg.bus : (c.bus2 ? cfg.bus2 : (c.spinner ? cfg.spinner : (c.alt ? cfg.cars2 : cfg.cars)))} alt="" className="relative block object-contain opacity-90"
            style={{ width: c.size, filter: c.bus ? "none" : `drop-shadow(0 0 ${c.spinner ? 12 : 8}px rgba(34,224,224,${c.spinner ? 0.65 : 0.5}))`, ...(c.bus ? { maskImage: "linear-gradient(to bottom, #000 72%, rgba(0,0,0,0.68) 90%, rgba(0,0,0,0.48) 100%)", WebkitMaskImage: "linear-gradient(to bottom, #000 72%, rgba(0,0,0,0.68) 90%, rgba(0,0,0,0.48) 100%)" } : {}) }} />
        </div>
      ))}
      {cfg.cars && chase && (<>
        {/* the prey: pulls over for the unit... then bolts */}
        <div className="absolute left-0 z-[4]" data-testid="cyber-chase-car"
          style={{ top: mobile ? "40%" : "22%", animation: `${chase.dir === 1 ? "ffChaseRun" : "ffChaseRunRev"} 9s both` }}>
          <img src={cfg.cars} alt="" className="block object-contain opacity-95"
            style={{ width: mobile ? 66 : 94, opacity: 0.85, transform: chase.dir === 1 ? "none" : "scaleX(-1)", filter: "drop-shadow(0 0 8px rgba(34,224,224,0.5))" }} />
        </div>
        {/* the law: black/white unit 07 on its own pursuit line, gap held open */}
        <div className="absolute left-0 z-[4]" data-testid="cyber-chase-police"
          style={{ top: mobile ? "40.4%" : "22.4%", animation: `${chase.dir === 1 ? "ffChasePursuitRun" : "ffChasePursuitRunRev"} 9s both` }}>
          <div className="relative">
            {/* strobing halo washes the whole unit red/blue */}
            <span className="pointer-events-none absolute -inset-4" style={{ background: "radial-gradient(ellipse at 42% 30%, rgba(255,45,85,0.45), transparent 68%)", filter: "blur(8px)", animation: "ffCopFlashA 0.55s steps(1,end) infinite" }} />
            <span className="pointer-events-none absolute -inset-4" style={{ background: "radial-gradient(ellipse at 58% 30%, rgba(64,120,255,0.5), transparent 68%)", filter: "blur(8px)", animation: "ffCopFlashB 0.55s steps(1,end) infinite" }} />
            {/* flashing blooms sitting exactly on the sprite's baked beacons */}
            <span className="pointer-events-none absolute rounded-full" style={{ left: chase.dir === 1 ? "45.7%" : "49.1%", top: "-4%", width: "7%", aspectRatio: "1", background: "radial-gradient(circle, rgba(255,45,85,1) 30%, rgba(255,45,85,0) 70%)", boxShadow: "0 0 16px 8px rgba(255,45,85,0.95)", animation: "ffCopFlashA 0.55s steps(1,end) infinite" }} />
            <span className="pointer-events-none absolute rounded-full" style={{ left: chase.dir === 1 ? "51.9%" : "43%", top: "-3%", width: "7%", aspectRatio: "1", background: "radial-gradient(circle, rgba(64,120,255,1) 30%, rgba(64,120,255,0) 70%)", boxShadow: "0 0 16px 8px rgba(64,120,255,0.95)", animation: "ffCopFlashB 0.55s steps(1,end) infinite" }} />
            <img src={chase.dir === 1 ? "/cyber-police.png" : "/cyber-police-left.png"} alt="" className="block object-contain opacity-95"
              style={{ width: mobile ? 60 : 86, opacity: 0.88, filter: "drop-shadow(0 0 8px rgba(120,150,255,0.45))" }} />
          </div>
        </div>
      </>)}
      {cfg.neon && <CyberNeonSign neon={cfg.neon} />}
      {cfg.wall && <img src={cfg.wall} alt="" className="absolute inset-0 z-[1] h-full w-full object-cover opacity-60" style={{ objectPosition: "center top" }} />}
      {cfg.lounge && (<>
        <img src={cfg.lounge} alt="" className="absolute inset-0 z-[1] h-full w-full object-cover opacity-90" style={{ objectPosition: "center center" }} data-testid="tiki-lounge-bg" />
        <div className="absolute inset-0 z-[1]" style={{ background: "linear-gradient(180deg, rgba(20,10,4,0.55) 0%, rgba(20,10,4,0.15) 30%, rgba(20,10,4,0.25) 70%, rgba(20,10,4,0.7) 100%)" }} />
        {/* String-light glows on the SAME 1264x848 canvas + identical object-cover,
            so they always align with the painted bulbs. 3 interleaved groups flicker
            independently for a random twinkle. */}
        {[
          { src: "/tiki-string-1.png", d: 2.4, dl: 0 },
          { src: "/tiki-string-2.png", d: 3.1, dl: -1.3 },
          { src: "/tiki-string-3.png", d: 2.7, dl: -0.6 },
        ].map((s, i) => (
          <img
            key={`tiki-string-${i}`}
            src={s.src}
            alt=""
            data-testid={`tiki-string-lights-${i}`}
            className="pointer-events-none absolute inset-0 z-[2] h-full w-full object-cover mix-blend-screen"
            style={{ objectPosition: "center center", animation: `ffTikiTwinkle ${s.d}s ease-in-out ${s.dl}s infinite` }}
          />
        ))}
        {/* Flaming tiki cocktail — 3 flame frames on the same canvas cross-fade
            (staggered) so it stays aligned to the drink and flickers gently. */}
        {["/tiki-flame-red-1.png", "/tiki-flame-red-2.png", "/tiki-flame-red-3.png"].map((src, i) => (
          <img
            key={`tiki-flame-${i}`}
            src={src}
            alt=""
            data-testid={`tiki-drink-flame-${i}`}
            className="pointer-events-none absolute inset-0 z-[2] h-full w-full object-cover mix-blend-screen"
            style={{ objectPosition: "center center", animation: `ffTikiFlame 1.2s ease-in-out ${(-0.4 * i).toFixed(1)}s infinite` }}
          />
        ))}
        {/* tiki gecko: anchored to the painted bar via the measured cover box
            (canvas 1264x848) so he stays glued to the counter on any device.
            On mobile his home base shifts RIGHT of the counter's front-left
            corner (painted at ~canvas 480) and the far leg is shorter — at
            full range he crowded/slid off both counter ends on phones. */}
        {loungeBox && (
          <div className="absolute z-[3]" style={{ left: loungeBox.offX + (mobile ? 570 : 520) * (loungeBox.dw / 1264), top: loungeBox.offY + (mobile ? 526 : 533) * (loungeBox.dw / 1264), width: 46 * (loungeBox.dw / 1264), "--s": `${loungeBox.dw / 1264}px`, "--gx": mobile ? 180 : 300, "--gy": mobile ? -27 : -45, animation: "ffGeckoBar 16s linear infinite" }} data-testid="tiki-gecko">
            <img src="/tiki-gecko.png" alt="" className="w-full" style={{ animation: "ffGeckoGait 16s linear infinite", transformOrigin: "50% 100%" }} />
          </div>
        )}
        {/* totem climber: tan/green-spotted top-down gecko scaling the carved
            totem left of the back-bar (the path the user drew) — climbs up
            in sprints, looks around, flips head-down and descends */}
        {loungeBox && (
          <div className="absolute z-[3]" style={{ left: loungeBox.offX + 422 * (loungeBox.dw / 1264), top: loungeBox.offY + 420 * (loungeBox.dw / 1264), width: 26 * (loungeBox.dw / 1264), "--s": `${loungeBox.dw / 1264}px`, animation: "ffGeckoClimb 20s linear infinite" }} data-testid="tiki-gecko-totem">
            <img src="/tiki-gecko-top.png" alt="" className="w-full" style={{ filter: "drop-shadow(1px 2px 2px rgba(0,0,0,0.45))" }} />
          </div>
        )}
        {/* second gecko scuttling along the floor — occasionally chases a fly */}
        <TikiFloorGecko />
        {/* Torch Nightfall: all the lounge lights flare when fate deals */}
        <TikiTorchNightfall box={loungeBox} />
      </>)}
      {cfg.gears && <img src={cfg.gears} alt="" className="absolute bottom-[9vh] right-[9%] z-[2] w-[26vw] max-w-[190px] object-contain opacity-55" style={{ animation: "ffSpin 22s linear infinite" }} />}
      {cfg.golemLeft && (
        <div className="absolute bottom-0 left-[-10%] z-[4] hidden h-[72vh] sm:left-[-3%] sm:block sm:h-[78vh]" style={{ aspectRatio: "684 / 1222" }} data-testid="steam-golem-left">
          {/* soft ground shadow so the sleeping sentinel sits on the floor */}
          <div className="absolute left-1/2 -translate-x-1/2" style={{ bottom: "-0.6vh", width: "88%", height: "3.6vh", background: "radial-gradient(ellipse, rgba(0,0,0,0.7), rgba(0,0,0,0) 68%)" }} />
          <img src={cfg.golemLeft} alt="" className="absolute inset-0 h-full w-full object-contain" style={{ filter: "drop-shadow(0 6px 10px rgba(0,0,0,0.55)) brightness(0.92)", animation: blastPh >= 1 && blastPh < 3 ? "ffGolemRumble 0.5s linear infinite" : undefined }} />
          {/* FURNACE BLAST: glow surge while the gears grind, then fire spews */}
          {blastPh >= 1 && (
            <div className="absolute" style={{ left: "52%", top: "36%", width: "29%", height: "16.5%", opacity: blastPh === 3 ? 0 : 1, transition: "opacity 1.4s ease-out" }} data-testid="furnace-blast-surge">
              <span className="absolute inset-0" style={{ borderRadius: "45%", background: "radial-gradient(ellipse at 50% 55%, rgba(255,175,60,0.75), rgba(255,110,25,0.4) 45%, rgba(200,60,10,0.15) 68%, transparent 85%)", mixBlendMode: "screen", filter: "blur(4px)", animation: "ffFurnaceSmolder 0.7s ease-in-out infinite" }} />
            </div>
          )}
          {blastPh === 2 && (
            <div className="absolute" style={{ left: "64%", top: "39.5%", width: "33%", height: "10%" }} data-testid="furnace-blast-jet">
              {/* thick fire stream: red sheath, orange body, white-hot core */}
              <span className="absolute" style={{ left: 0, top: "-24%", width: "100%", height: "148%", transformOrigin: "0% 50%", borderRadius: "40% 100% 100% 40% / 50% 50% 50% 50%", background: "linear-gradient(90deg, rgba(210,60,10,0.85), rgba(230,80,15,0.55) 55%, rgba(200,50,10,0) 96%)", filter: "blur(3px)", animation: "ffFurnaceJet 3.1s cubic-bezier(0.3,0,0.5,1) forwards" }} />
              <span className="absolute" style={{ left: 0, top: "-6%", width: "88%", height: "112%", transformOrigin: "0% 50%", borderRadius: "40% 100% 100% 40% / 50% 50% 50% 50%", background: "linear-gradient(90deg, rgba(255,140,30,0.95), rgba(255,110,25,0.7) 55%, rgba(255,90,20,0) 95%)", filter: "blur(2px)", animation: "ffFurnaceJet 3.1s cubic-bezier(0.3,0,0.5,1) -0.06s forwards" }} />
              <span className="absolute" style={{ left: 0, top: "18%", width: "66%", height: "64%", transformOrigin: "0% 50%", borderRadius: "40% 100% 100% 40% / 50% 50% 50% 50%", background: "linear-gradient(90deg, rgba(255,246,200,1), rgba(255,205,90,0.9) 55%, rgba(255,160,50,0) 94%)", filter: "blur(1px)", animation: "ffFurnaceJet 3.1s cubic-bezier(0.3,0,0.5,1) -0.12s forwards" }} />
              {/* sparks whipping out of the stream */}
              {[
                { sx: "16vh", sy: "-5vh", d: 0.7, dl: 0.15, s: 0.8 }, { sx: "22vh", sy: "-2vh", d: 0.9, dl: 0.4, s: 1 },
                { sx: "19vh", sy: "3vh", d: 0.8, dl: 0.7, s: 0.7 }, { sx: "25vh", sy: "6vh", d: 1.1, dl: 0.25, s: 0.9 },
                { sx: "13vh", sy: "-7vh", d: 0.75, dl: 1.0, s: 0.6 }, { sx: "27vh", sy: "1vh", d: 1.0, dl: 1.3, s: 1 },
                { sx: "18vh", sy: "8vh", d: 0.95, dl: 1.6, s: 0.8 }, { sx: "23vh", sy: "-4vh", d: 0.85, dl: 1.9, s: 0.7 },
                { sx: "15vh", sy: "5vh", d: 0.9, dl: 2.2, s: 0.9 }, { sx: "21vh", sy: "-6vh", d: 0.8, dl: 2.45, s: 0.6 },
              ].map((p, pi) => (
                <span key={`spark-${pi}`} className="absolute rounded-full" style={{ left: "4%", top: "42%", width: `${0.8 * p.s}vh`, height: `${0.8 * p.s}vh`, background: "radial-gradient(circle, #FFF2C4, #FFB03A 70%)", boxShadow: "0 0 6px 2px rgba(255,160,50,0.8)", "--sx": p.sx, "--sy": p.sy, animation: `ffSparkFly ${p.d}s ease-out ${p.dl}s infinite` }} />
              ))}
              {/* fire bits that arc out, HIT THE FLOOR and bounce around */}
              {[
                { bx: "7vh", d: 1.7, dl: 0.2, s: 1 }, { bx: "13vh", d: 2.0, dl: 0.5, s: 0.8 },
                { bx: "19vh", d: 2.3, dl: 0.8, s: 1.1 }, { bx: "10vh", d: 1.9, dl: 1.2, s: 0.7 },
                { bx: "24vh", d: 2.6, dl: 1.5, s: 0.9 }, { bx: "16vh", d: 2.2, dl: 1.9, s: 1 },
                { bx: "21vh", d: 2.4, dl: 2.2, s: 0.75 }, { bx: "28vh", d: 2.7, dl: 0.35, s: 0.85 },
                { bx: "11vh", d: 1.8, dl: 1.7, s: 0.95 }, { bx: "26vh", d: 2.5, dl: 2.5, s: 0.7 },
                { bx: "15vh", d: 2.1, dl: 2.8, s: 1.05 }, { bx: "31vh", d: 2.9, dl: 1.05, s: 0.8 },
              ].map((p, pi) => (
                <span key={`bounce-${pi}`} className="absolute rounded-full" style={{ left: "5%", top: "48%", width: `${1.05 * p.s}vh`, height: `${1.05 * p.s}vh`, background: "radial-gradient(circle, #FFE9A8, #FF9A3C 55%, #B34710 90%)", boxShadow: "0 0 6px 2px rgba(255,140,45,0.7)", "--bx": p.bx, animation: `ffSparkBounce ${p.d}s linear ${p.dl}s infinite` }} data-testid="furnace-blast-bouncer" />
              ))}
              {/* FIREWORK EMBERS: fountain of embers launching up + out of the
                  grate, arcing over like a roman candle before raining down */}
              {[
                { fx: "9vh", fy: "-13vh", d: 1.5, dl: 0.1, s: 1 }, { fx: "15vh", fy: "-16vh", d: 1.7, dl: 0.35, s: 0.8 },
                { fx: "4vh", fy: "-18vh", d: 1.6, dl: 0.6, s: 0.9 }, { fx: "21vh", fy: "-11vh", d: 1.8, dl: 0.85, s: 1.1 },
                { fx: "-4vh", fy: "-14vh", d: 1.55, dl: 1.1, s: 0.7 }, { fx: "12vh", fy: "-20vh", d: 1.9, dl: 1.35, s: 1 },
                { fx: "25vh", fy: "-9vh", d: 1.7, dl: 1.6, s: 0.85 }, { fx: "-7vh", fy: "-10vh", d: 1.5, dl: 1.85, s: 0.75 },
                { fx: "18vh", fy: "-15vh", d: 1.8, dl: 2.1, s: 0.95 }, { fx: "6vh", fy: "-21vh", d: 2.0, dl: 2.35, s: 0.8 },
                { fx: "28vh", fy: "-13vh", d: 1.9, dl: 0.5, s: 0.7 }, { fx: "-2vh", fy: "-17vh", d: 1.65, dl: 1.5, s: 1.05 },
                { fx: "14vh", fy: "-8vh", d: 1.45, dl: 2.55, s: 0.9 }, { fx: "10vh", fy: "-24vh", d: 2.1, dl: 0.95, s: 0.65 },
              ].map((p, pi) => (
                <span key={`fw-${pi}`} className="absolute rounded-full" style={{ left: "4%", top: "42%", width: `${0.85 * p.s}vh`, height: `${0.85 * p.s}vh`, background: "radial-gradient(circle, #FFF4CC, #FFB44A 55%, #D2601A 90%)", boxShadow: "0 0 7px 2px rgba(255,165,55,0.85)", "--fx": p.fx, "--fy": p.fy, animation: `ffEmberFw ${p.d}s linear ${p.dl}s infinite` }} data-testid="furnace-blast-firework" />
              ))}
            </div>
          )}
          {/* BURN-DOWN: the landed fire bits keep glowing on the floor for a
              beat, flickering as they cool, then wink out one by one */}
          {blastPh === 3 && (
            <div className="absolute" style={{ left: "64%", top: "39.5%", width: "33%", height: "10%" }} data-testid="furnace-blast-embers">
              {[
                { bx: "7vh", d: 1.5, dl: 0, s: 1 }, { bx: "13vh", d: 1.9, dl: 0.15, s: 0.8 },
                { bx: "19vh", d: 2.2, dl: 0.05, s: 1.05 }, { bx: "10vh", d: 1.7, dl: 0.3, s: 0.7 },
                { bx: "24vh", d: 2.4, dl: 0.1, s: 0.9 }, { bx: "16vh", d: 2.0, dl: 0.4, s: 0.95 },
                { bx: "21vh", d: 1.8, dl: 0.25, s: 0.75 }, { bx: "28vh", d: 2.3, dl: 0.2, s: 0.85 },
                { bx: "31vh", d: 1.6, dl: 0.5, s: 0.65 },
              ].map((p, pi) => (
                <span key={`emb-${pi}`} className="absolute rounded-full" style={{ left: "5%", top: "48%", width: `${0.95 * p.s}vh`, height: `${0.95 * p.s}vh`, transform: `translate(${p.bx}, 43vh)`, background: "radial-gradient(circle, #FFD98A, #FF8A32 55%, #8A3410 90%)", boxShadow: "0 0 6px 2px rgba(255,130,40,0.6)", animation: `ffEmberDie ${p.d}s ease-in ${p.dl}s forwards` }} data-testid="furnace-ember-rest" />
              ))}
            </div>
          )}
          {/* ember eyes: smolder like the furnace in his belly. GOLEM DUET —
              when his brother awakens across the room, these eyes flicker
              awake in response, then settle back to their smolder. */}
          {[
            { cx: 75.5, cy: 16.5, s: 6.4 },
            { cx: 82, cy: 18, s: 5.8 },
          ].map((e, ei) => (
            <div key={`eye-${ei}`} className="absolute" data-testid="golem-eye-glow" style={{ left: `${e.cx - e.s / 2}%`, top: `${e.cy - e.s * 0.28}%`, width: `${e.s}%`, aspectRatio: "1" }}>
              <span className="absolute inset-0 rounded-full" style={{ background: "radial-gradient(circle, rgba(255,170,60,0.8) 0%, rgba(255,110,25,0.42) 40%, rgba(200,60,10,0.14) 65%, transparent 80%)", mixBlendMode: "screen", filter: "blur(1px)", animation: "ffFurnaceSmolder 3.1s ease-in-out infinite" }} />
              <span className="absolute rounded-full" style={{ left: "32%", top: "32%", width: "36%", height: "36%", background: "radial-gradient(circle, rgba(255,232,150,0.95), rgba(255,160,60,0.5) 60%, transparent 80%)", mixBlendMode: "screen", animation: "ffFurnaceSmolder 2.2s ease-in-out -1.1s infinite" }} />
              {golemWake >= 1 && golemWake <= 5 && (
                <span className="absolute inset-[-35%] rounded-full" data-testid="golem-duet-flicker" style={{ background: "radial-gradient(circle, rgba(255,236,170,0.95), rgba(255,175,60,0.55) 42%, rgba(255,120,30,0.2) 65%, transparent 80%)", mixBlendMode: "screen", filter: "blur(1px)", opacity: 0, animation: `ffBroFlicker 1.9s linear ${1.1 + ei * 0.12}s 3` }} />
              )}
            </div>
          ))}
          {/* smoldering furnace: embers breathing behind the belly grate */}
          <div className="absolute" style={{ left: "54%", top: "37.5%", width: "25%", height: "13.5%" }} data-testid="golem-furnace-glow">
            <div className="absolute inset-0" style={{ borderRadius: "42%", background: "radial-gradient(ellipse at 50% 55%, rgba(255,120,30,0.5), rgba(220,70,15,0.28) 48%, rgba(160,40,8,0.12) 70%, transparent 86%)", mixBlendMode: "screen", filter: "blur(3px)", animation: "ffFurnaceSmolder 3.4s ease-in-out infinite" }} />
            <div className="absolute" style={{ left: "28%", top: "38%", width: "44%", height: "40%", borderRadius: "50%", background: "radial-gradient(circle, rgba(255,195,85,0.45), rgba(255,120,30,0.18) 55%, transparent 78%)", mixBlendMode: "screen", filter: "blur(4px)", animation: "ffFurnaceSmolder 2.1s ease-in-out -0.8s infinite" }} />
          </div>
          {/* black/gray coal smoke curling out of the stacks behind his head */}
          {[
            { left: "41%", top: "-3%", scale: 1 },
            { left: "64%", top: "0.5%", scale: 0.85 },
          ].map((s, si) => (
            <div key={`stack-${si}`} className="absolute" style={{ left: s.left, top: s.top }} data-testid="golem-stack-smoke">
              {[0, 1, 2, 3, 4].map((i) => (
                <span key={`puff-${i}`} className="absolute rounded-full" style={{ width: `${(4.4 + i * 0.6) * s.scale}vh`, height: `${(4.4 + i * 0.6) * s.scale}vh`, background: "radial-gradient(circle, rgba(98,98,106,0.85), rgba(58,58,66,0.6) 48%, rgba(36,36,42,0.3) 68%, transparent 80%)", filter: "blur(1.5px)", animation: `${i % 2 ? "ffGolemSmokeB" : "ffGolemSmoke"} ${4.4 + i * 0.6}s ease-out ${i * 0.9}s infinite` }} />
              ))}
            </div>
          ))}
        </div>
      )}
      {/* GOLEM DUET (mobile): at phone widths the left brother lives off-screen,
          so his answering eye-flicker bleeds in as an amber glow from the edge —
          two stacked "eyes" pulsing with the same irregular flicker. */}
      {cfg.golemLeft && golemWake >= 1 && golemWake <= 5 && (
        <div className="absolute left-0 z-[4] sm:hidden" data-testid="golem-duet-flicker-mobile" style={{ top: "26vh", height: "34vh", width: "22vw", pointerEvents: "none" }}>
          <span className="absolute inset-0" style={{ background: "radial-gradient(ellipse at 0% 50%, rgba(255,185,75,0.5), rgba(255,140,40,0.2) 45%, transparent 72%)", mixBlendMode: "screen", filter: "blur(6px)", opacity: 0, animation: "ffBroFlicker 1.9s linear 1.1s 3" }} />
          <span className="absolute rounded-full" style={{ left: "-4vw", top: "30%", width: "9vw", aspectRatio: "1", background: "radial-gradient(circle, rgba(255,225,140,0.9), rgba(255,165,60,0.45) 55%, transparent 78%)", mixBlendMode: "screen", filter: "blur(2px)", opacity: 0, animation: "ffBroFlicker 1.9s linear 1.22s 3" }} />
          <span className="absolute rounded-full" style={{ left: "-4.5vw", top: "52%", width: "8vw", aspectRatio: "1", background: "radial-gradient(circle, rgba(255,225,140,0.85), rgba(255,165,60,0.4) 55%, transparent 78%)", mixBlendMode: "screen", filter: "blur(2px)", opacity: 0, animation: "ffBroFlicker 1.9s linear 1.1s 3" }} />
        </div>
      )}
      {cfg.golemRight && (
        <div className="absolute bottom-0 right-[-5%] z-[3] block h-[72vh] sm:right-[-1%] sm:h-[78vh]" style={{ aspectRatio: "696 / 1180" }} data-testid="steam-golem-right">
          <div className="absolute left-1/2 -translate-x-1/2" style={{ bottom: "-0.6vh", width: "88%", height: "3.6vh", background: "radial-gradient(ellipse, rgba(0,0,0,0.7), rgba(0,0,0,0) 68%)" }} />
          {/* pose stack: sleeping / awake / knee lifted / foot planted forward */}
          <div className="absolute inset-0" style={{ transformOrigin: "50% 100%", animation: golemWake === 1 ? "ffGolemRumble 0.4s linear 3" : golemWake === 2 || golemWake === 4 ? "ffGolemStepLift 1.2s cubic-bezier(0.4,0,0.5,1) forwards" : golemWake === 3 || golemWake === 5 ? "ffGolemStepSettle 1.2s cubic-bezier(0.45,0,0.55,1)" : undefined }}>
            <img src={cfg.golemRight} alt="" className="absolute inset-0 h-full w-full object-contain" style={{ opacity: golemWake === 0 || golemWake === 6 ? 1 : 0, transition: "opacity 0.5s ease", filter: "drop-shadow(0 6px 10px rgba(0,0,0,0.55)) brightness(0.92)" }} />
            <img src="/steam-golem-right-awake.png?v=501" alt="" className="absolute inset-0 h-full w-full object-contain" style={{ opacity: golemWake === 1 || golemWake === 5 ? 1 : 0, transition: "opacity 0.5s ease", filter: "drop-shadow(0 6px 10px rgba(0,0,0,0.55)) brightness(0.92)" }} data-testid="golem-wake-awake" />
            <img src="/steam-golem-right-lift.png?v=501" alt="" className="absolute inset-0 h-full w-full object-contain" style={{ opacity: golemWake === 2 || golemWake === 4 ? 1 : 0, transition: "opacity 0.5s ease", filter: "drop-shadow(0 6px 10px rgba(0,0,0,0.55)) brightness(0.92)" }} data-testid="golem-wake-lift" />
            <img src="/steam-golem-right-step.png?v=501" alt="" className="absolute inset-0 h-full w-full object-contain" style={{ opacity: golemWake === 3 ? 1 : 0, transition: "opacity 0.5s ease", filter: "drop-shadow(0 6px 10px rgba(0,0,0,0.55)) brightness(0.92)" }} data-testid="golem-wake-step" />
            {/* smoky green aura around the head while he's awake */}
            {golemWake >= 1 && golemWake <= 5 && (
              <div className="absolute" style={{ left: "22%", top: "1%", width: "26%", aspectRatio: "1" }} data-testid="golem-wake-aura">
                <span className="absolute inset-0 rounded-full" style={{ background: "radial-gradient(circle, rgba(110,255,170,0.3), rgba(70,220,140,0.12) 50%, transparent 76%)", mixBlendMode: "screen", filter: "blur(4px)", animation: "ffFurnaceSmolder 2.4s ease-in-out infinite" }} />
              </div>
            )}
            {/* steam bursts vent at every pose change to mask the swap */}
            {golemWake >= 1 && (
              <div key={`burst-${golemWake}`} className="absolute" style={{ left: "40%", top: "14%" }} data-testid="golem-wake-burst">
                {[0, 1, 2].map((i) => (
                  <span key={`b-${i}`} className="absolute rounded-full" style={{ left: `${(i - 1) * 26}px`, width: `${5 + i}vh`, height: `${5 + i}vh`, background: "radial-gradient(circle, rgba(250,248,240,0.8), rgba(230,227,218,0.4) 52%, transparent 76%)", filter: "blur(2px)", animation: `ffGolemSmoke ${1.3 + i * 0.25}s ease-out forwards` }} />
                ))}
              </div>
            )}
            {/* FLOOR THUD dust kick: puffs burst out low from the forward foot
                as it slams flat onto the floor (delayed to the contact moment) */}
            {golemWake === 3 && (
              <div key="thud-dust" className="absolute" style={{ left: "30%", top: "94.5%" }} data-testid="golem-thud-dust">
                {[0, 1, 2, 3, 4, 5].map((i) => (
                  <span key={`d-${i}`} className="absolute rounded-full" style={{ width: `${2.4 + (i % 3) * 0.9}vh`, height: `${2 + (i % 3) * 0.7}vh`, background: "radial-gradient(circle, rgba(188,168,138,0.5), rgba(142,124,98,0.28) 55%, transparent 78%)", filter: "blur(2px)", opacity: 0, "--dx": `${(i - 2.5) * 3.4}vh`, animation: `ffThudDust ${0.85 + i * 0.11}s ease-out ${0.55 + (i % 3) * 0.06}s forwards` }} />
                ))}
              </div>
            )}
          </div>
          {[
            { left: "52%", top: "2%", scale: 0.9 },
            { left: "61%", top: "0.5%", scale: 1 },
            { left: "68.5%", top: "2.5%", scale: 0.75 },
          ].map((s, si) => (
            <div key={`vent-${si}`} className="absolute" style={{ left: s.left, top: s.top }} data-testid="golem-stack-steam">
              {[0, 1, 2, 3].map((i) => (
                <span key={`wisp-${i}`} className="absolute rounded-full" style={{ width: `${(3.6 + i * 0.55) * s.scale}vh`, height: `${(3.6 + i * 0.55) * s.scale}vh`, background: "radial-gradient(circle, rgba(252,250,244,0.75), rgba(236,233,226,0.42) 50%, rgba(220,217,210,0.18) 68%, transparent 80%)", filter: "blur(2px)", animation: `${i % 2 ? "ffGolemSmokeB" : "ffGolemSmoke"} ${4.2 + i * 0.65}s ease-out ${i * 1.05 + si * 0.4}s infinite` }} />
              ))}
            </div>
          ))}
        </div>
      )}
      {/* oil leak layer: mirrors the right golem's box but sits ABOVE the arc
          device (z-4) so the streams + puddle are never hidden behind the table */}
      {cfg.golemRight && (
        <div className="absolute bottom-0 right-[-5%] z-[4] block h-[72vh] sm:right-[-1%] sm:h-[78vh]" style={{ aspectRatio: "696 / 1180" }} data-testid="steam-golem-right-oil">
          {/* oil leak: two glossy runs smeared across the cuff and hand... */}
          <div className="absolute" style={{ left: "82.2%", top: "60.5%", width: "5.4%", height: "16.5%" }} data-testid="golem-oil-streak">
            <div className="absolute" style={{ left: "6%", top: "0", width: "42%", height: "100%", borderRadius: "45%", background: "linear-gradient(180deg, rgba(18,14,10,0) 0%, rgba(22,17,11,0.5) 16%, rgba(14,11,7,0.72) 55%, rgba(8,6,4,0.85) 100%)", filter: "blur(0.6px)" }} />
            <div className="absolute" style={{ left: "58%", top: "6%", width: "36%", height: "88%", borderRadius: "45%", background: "linear-gradient(180deg, rgba(18,14,10,0) 0%, rgba(20,16,10,0.45) 22%, rgba(12,9,6,0.7) 60%, rgba(8,6,4,0.8) 100%)", filter: "blur(0.7px)" }} />
            <div className="absolute" style={{ left: "16%", top: "10%", width: "13%", height: "78%", borderRadius: "45%", background: "linear-gradient(180deg, rgba(150,138,105,0.4), rgba(70,62,45,0.12))", filter: "blur(1px)", animation: "ffOilGlisten 3.2s ease-in-out infinite" }} />
            <div className="absolute" style={{ left: "66%", top: "16%", width: "11%", height: "70%", borderRadius: "45%", background: "linear-gradient(180deg, rgba(150,138,105,0.35), rgba(70,62,45,0.1))", filter: "blur(1px)", animation: "ffOilGlisten 4.1s ease-in-out -1.4s infinite" }} />
          </div>
          {/* ...viscous streams fanned across the hand, each on its own rhythm... */}
          {[
            { left: "80%", top: "68%", h: "28.2%", w: "2%", dur: 4.6, delay: 1.6 },
            { left: "84.2%", top: "76.8%", h: "19.6%", w: "2.3%", dur: 3.6, delay: 0 },
            { left: "88.3%", top: "65%", h: "31.2%", w: "2%", dur: 5.2, delay: 3.1 },
          ].map((L, li) => (
            <div key={`oil-lane-${li}`} className="absolute" style={{ left: L.left, top: L.top, width: L.w, height: L.h }} data-testid="golem-oil-lane">
              <span className="absolute" style={{ left: "16%", width: "62%", borderRadius: "46% / 10%", background: "linear-gradient(90deg, rgba(12,9,6,0.96) 0%, rgba(150,138,105,0.55) 34%, rgba(60,50,34,0.9) 55%, rgba(6,5,3,0.98) 100%)", boxShadow: "0 0 3px rgba(0,0,0,0.85)", filter: "blur(0.3px)", animation: `ffOilStream ${L.dur}s cubic-bezier(0.45,0,0.75,0.55) ${L.delay}s infinite` }} data-testid="golem-oil-drip" />
            </div>
          ))}
          {/* ...into a slick puddle that RIPPLES where each stream lands */}
          <div className="absolute" style={{ left: "77%", top: "95.9%", width: "14.5%", height: "1.9%" }} data-testid="golem-oil-puddle">
            <div className="absolute inset-0 rounded-full" style={{ background: "radial-gradient(ellipse at 50% 50%, rgba(10,8,5,0.95) 0%, rgba(14,11,7,0.85) 55%, rgba(16,12,8,0) 80%)", animation: "ffOilGlisten 4.4s ease-in-out infinite, ffPuddleWobble 3.6s ease-in-out infinite" }} />
            <div className="absolute rounded-full" style={{ left: "30%", top: "22%", width: "34%", height: "34%", background: "radial-gradient(ellipse, rgba(170,158,120,0.4), rgba(90,80,58,0) 70%)", filter: "blur(1px)", animation: "ffOilGlisten 3.6s ease-in-out -1.2s infinite" }} />
            {/* ripple rings under each stream, timed to that stream's landing */}
            {[
              { x: "28%", dur: 4.6, delay: 1.6 },
              { x: "57%", dur: 3.6, delay: 0 },
              { x: "85%", dur: 5.2, delay: 3.1 },
            ].map((R, ri) => (
              <React.Fragment key={`ring-${ri}`}>
                <span className="absolute rounded-full border" data-testid="golem-oil-ripple" style={{ left: R.x, top: "8%", width: "30%", height: "74%", borderColor: "rgba(150,138,105,0.55)", animation: `ffOilRing ${R.dur}s linear ${R.delay}s infinite` }} />
                <span className="absolute rounded-full border" style={{ left: R.x, top: "20%", width: "20%", height: "52%", borderColor: "rgba(170,158,120,0.4)", animation: `ffOilRing ${R.dur}s linear ${R.delay + 0.25}s infinite` }} />
              </React.Fragment>
            ))}
          </div>
        </div>
      )}
      {/* WORKSHOP PROPS: valve pedestal (L), robot on assembly rack (M), alchemy bench (R) */}
      {cfg.golemLeft && [
        { src: "/steam-valve-pedestal.png?v=501", ar: "433 / 735", cls: "left-[calc(50%-70vh)] bottom-[3vh] h-[25vh]", tid: "steam-valve-pedestal",
          lamps: [
            // front-face fixtures: mounted ON the two oval hatch housings
            { x: 27.5, y: 43.9, c: "#FFB03A", d: 1.7, dl: 0.1 }, { x: 27.5, y: 59.9, c: "#7CE08A", d: 2.2, dl: 0.7 },
            // the sprite's real bulb column on the right face
            { x: 70.9, y: 40, c: "#FFB03A", d: 2.4, dl: 0 }, { x: 70.9, y: 50.2, c: "#FF5540", d: 1.9, dl: 0.5 }, { x: 70.9, y: 59, c: "#FF8A3A", d: 2.1, dl: 1 }, { x: 70.9, y: 67.9, c: "#FF5540", d: 1.6, dl: 1.5 },
          ] },
        { src: "/steam-robot-rack.png?v=501", ar: "558 / 742", cls: "left-[calc(50%-22vh)] -translate-x-1/2 bottom-[0.5vh] h-[78vh]", tid: "steam-robot-rack",
          lamps: [{ x: 71.3, y: 29.4, c: "#FFB03A", d: 2.1, dl: 0.3 }, { x: 71.3, y: 33.1, c: "#FF7A30", d: 1.7, dl: 0.9 }],
          eye: { x: 30.7, y: 20.8 },
          alert: "/steam-robot-rack-alert.png?v=501",
          alertEyes: [{ x: 33.3, y: 15.4 }, { x: 39.7, y: 15.4 }],
          sparks: { x: 65, y: 39 } },
        { src: "/steam-alchemy-bench.png?v=501", ar: "966 / 765", cls: "left-[calc(50%+3vh)] bottom-[3vh] h-[22.5vh]", tid: "steam-alchemy-bench",
          lamps: [{ x: 56.1, y: 38.2, c: "#FFB03A", d: 1.6, dl: 0 }, { x: 61.7, y: 39, c: "#FFB03A", d: 2.3, dl: 0.5 }, { x: 73.5, y: 41.6, c: "#FF5540", d: 1.9, dl: 1.1 }] },
      ].map((p) => (
        <div key={p.tid} className={`absolute z-[3] hidden sm:block ${p.cls}`} style={{ aspectRatio: p.ar }} data-testid={p.tid}>
          <div className="absolute left-1/2 -translate-x-1/2" style={{ bottom: "-0.5vh", width: "90%", height: "2.6vh", background: "radial-gradient(ellipse, rgba(0,0,0,0.65), rgba(0,0,0,0) 68%)" }} />
          <img src={p.src} alt="" className="absolute inset-0 h-full w-full object-contain" style={{ filter: "drop-shadow(0 5px 8px rgba(0,0,0,0.5)) brightness(0.94)" }} />
          {/* WORKSHOP EVENTS: while a golem event plays, the strapped robot
              powers up — head straightens (alert pose cross-fade) and both
              eye lenses hold a solid green glow until the event ends */}
          {p.alert && (
            <img src={p.alert} alt="" className="absolute inset-0 h-full w-full object-contain" data-testid="rack-alert-pose" style={{ filter: "drop-shadow(0 5px 8px rgba(0,0,0,0.5)) brightness(0.94)", opacity: workshopEvent ? 1 : 0, transition: "opacity 0.7s ease" }} />
          )}
          {p.lamps.map((L, li) => (
            <span key={`lamp-${li}`} className="absolute rounded-full" style={{ left: `${L.x}%`, top: `${L.y}%`, width: "5%", aspectRatio: "1", background: `radial-gradient(circle, ${L.c}, transparent 70%)`, mixBlendMode: "screen", filter: "blur(1px)", animation: `ffLampBlink ${L.d}s steps(2, jump-none) ${L.dl}s infinite` }} />
          ))}
          {p.eye && !(p.alert && workshopEvent) && (
            <span className="absolute rounded-full" data-testid="rack-robot-eye" style={{ left: `${p.eye.x}%`, top: `${p.eye.y}%`, width: "4.5%", aspectRatio: "1", background: "radial-gradient(circle, rgba(140,255,180,0.95), rgba(80,220,140,0.4) 55%, transparent 75%)", mixBlendMode: "screen", filter: "blur(0.5px)", boxShadow: "0 0 8px 2px rgba(90,230,150,0.5)", animation: "ffEyeFlutter 6.5s linear infinite" }} />
          )}
          {p.alertEyes && workshopEvent && p.alertEyes.map((e, ei) => (
            <span key={`alert-eye-${ei}`} className="absolute rounded-full" data-testid="rack-alert-eye" style={{ left: `${e.x}%`, top: `${e.y}%`, width: "4.5%", aspectRatio: "1", background: "radial-gradient(circle, rgba(150,255,190,1), rgba(80,225,145,0.5) 55%, transparent 75%)", mixBlendMode: "screen", filter: "blur(0.5px)", boxShadow: "0 0 10px 3px rgba(90,235,155,0.65)" }} />
          ))}
          {/* WELD SPARKS from the open shoulder socket — hidden while the arm
              is MOUNTED (ph 0/1); ph 1 instead shows the weld FAILING burst */}
          {p.sparks && armPh >= 2 && (
            <div className="absolute" data-testid="rack-arm-sparks" style={{ left: `${p.sparks.x}%`, top: `${p.sparks.y}%` }}>
              <span className="absolute rounded-full" style={{ left: "-1.6vh", top: "-1.6vh", width: "3.2vh", height: "3.2vh", background: "radial-gradient(circle, rgba(255,240,200,0.95), rgba(255,170,70,0.5) 45%, transparent 75%)", mixBlendMode: "screen", filter: "blur(1px)", opacity: 0, animation: "ffWeldFlash 4.2s linear infinite" }} />
              {[0, 1, 2, 3, 4, 5, 6].map((i) => (
                <span key={`spk-${i}`} className="absolute" style={{ width: "0.55vh", height: "0.55vh", borderRadius: "9999px", background: i % 2 ? "#FFD98A" : "#FF9A3A", boxShadow: "0 0 5px 1px rgba(255,180,80,0.85)", opacity: 0, "--sx": `${[3.2, 5.4, 1.6, -2.2, 4.4, -1.2, 2.6][i]}vh`, "--sy": `${[5.5, 8.2, 9.4, 6.8, 4, 8.8, 7.6][i]}vh`, animation: `ffArmSpark 4.2s linear ${i * 0.055}s infinite` }} />
              ))}
            </div>
          )}
          {p.sparks && armPh === 1 && (
            <div className="absolute" data-testid="rack-arm-sparks-failing" style={{ left: `${p.sparks.x}%`, top: `${p.sparks.y}%` }}>
              <span className="absolute rounded-full" style={{ left: "-1.8vh", top: "-1.8vh", width: "3.6vh", height: "3.6vh", background: "radial-gradient(circle, rgba(255,244,210,1), rgba(255,170,70,0.6) 45%, transparent 75%)", mixBlendMode: "screen", filter: "blur(1px)", opacity: 0, animation: "ffWeldFlash 0.55s linear infinite" }} />
              {[0, 1, 2, 3, 4, 5, 6].map((i) => (
                <span key={`fspk-${i}`} className="absolute" style={{ width: "0.6vh", height: "0.6vh", borderRadius: "9999px", background: i % 2 ? "#FFE9A8" : "#FF9A3A", boxShadow: "0 0 6px 2px rgba(255,190,90,0.95)", opacity: 0, "--sx": `${[3.6, 5.8, 1.2, -2.8, 4.8, -1.6, 2.2][i]}vh`, "--sy": `${[4.5, 7.2, 8.4, 5.8, 3.4, 7.8, 6.6][i]}vh`, animation: `ffArmSpark 0.55s linear ${i * 0.055}s infinite` }} />
              ))}
            </div>
          )}
        </div>
      ))}
      {/* THE ARM DROP — MOUNTED POSE: the intact arm hangs on the socket
          (clean pauldron, no torn parts). Shudders while the weld fails,
          then detaches: quick tilt + drop + fade as the falling frame takes
          over below for a smooth two-frame hand-off. */}
      {cfg.golemLeft && armPh <= 2 && (
        <div className="absolute z-[3] hidden sm:block" data-testid="steam-arm-mounted" style={{
          left: "calc(50% - 17.7vh)", bottom: "17.5vh", width: "9.1vh", aspectRatio: "86 / 299",
          transformOrigin: "50% 6%",
          animation: armPh === 1 ? "ffArmShudder 0.28s linear infinite" : armPh === 2 ? "ffArmDetach 0.4s ease-in forwards" : undefined,
        }}>
          <img src="/steam-arm-mounted.png?v=517" alt="" className="absolute inset-0 h-full w-full object-contain" style={{ filter: "drop-shadow(0 4px 7px rgba(0,0,0,0.55)) brightness(0.92)" }} />
        </div>
      )}
      {/* BREAK-AWAY SPARK SHOWER: erupts from the shoulder socket the instant
          the weld gives and the arm tears loose (one-shot, with the zap) */}
      {cfg.golemLeft && armPh === 2 && (
        <div className="absolute z-[4] hidden sm:block" data-testid="arm-break-shower" style={{ left: "calc(50% - 13.2vh)", bottom: "48vh" }}>
          <span className="absolute rounded-full" style={{ left: "-3vh", top: "-3vh", width: "6vh", height: "6vh", background: "radial-gradient(circle, rgba(255,248,220,1), rgba(255,180,80,0.6) 40%, transparent 72%)", mixBlendMode: "screen", filter: "blur(1.5px)", animation: "ffSparkShower 0.55s ease-out forwards", "--sx": "0vh", "--sy": "0vh" }} />
          {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13].map((i) => (
            <span key={`bs-${i}`} className="absolute" style={{ width: `${0.55 + (i % 3) * 0.15}vh`, height: `${0.55 + (i % 3) * 0.15}vh`, borderRadius: "9999px", background: i % 2 ? "#FFE9A8" : "#FF9A3A", boxShadow: "0 0 6px 2px rgba(255,190,90,0.95)", "--sx": `${[-6, -3, 2, 6, -8, 4, 8, -5, 1, -2, 7, -7, 3, 5][i]}vh`, "--sy": `${[-7, -9, -8, -5, -2, -10, -3, 3, 6, 8, 2, 5, -6, 7][i]}vh`, animation: `ffSparkShower ${0.55 + (i % 4) * 0.12}s ease-out ${(i % 3) * 0.04}s forwards` }} />
          ))}
        </div>
      )}
      {/* THE ARM DROP — FALLING/FLOOR: the torn arm tumbles in from the
          socket and lands where it rests. Box sits at the REST spot; the
          pre-fall pose is a translate+rotate about the torn shoulder. */}
      {cfg.golemLeft && (
        <div className="absolute bottom-[0.6vh] left-[calc(50%-36.5vh)] z-[3] hidden sm:block" style={{ width: "29vh", aspectRatio: "1287 / 513" }} data-testid="steam-arm-floor">
          {/* ground shadow appears once the arm is down */}
          <div className="absolute left-1/2 -translate-x-1/2" style={{ bottom: "-0.4vh", width: "86%", height: "2vh", background: "radial-gradient(ellipse, rgba(0,0,0,0.6), rgba(0,0,0,0) 68%)", opacity: armPh >= 3 && armPh < 5 ? 1 : 0, transition: "opacity 0.45s ease" }} />
          {/* LANDING DUST: kicks out low when the arm slams down */}
          {armPh === 3 && (
            <div className="absolute" style={{ left: "38%", bottom: "0.2vh" }} data-testid="arm-drop-dust">
              {[0, 1, 2, 3, 4].map((i) => (
                <span key={`ad-${i}`} className="absolute rounded-full" style={{ width: `${2.2 + (i % 3) * 0.9}vh`, height: `${1.9 + (i % 3) * 0.7}vh`, background: "radial-gradient(circle, rgba(188,168,138,0.5), rgba(142,124,98,0.28) 55%, transparent 78%)", filter: "blur(2px)", opacity: 0, "--dx": `${(i - 2) * 4.2}vh`, animation: `ffThudDust ${0.8 + i * 0.1}s ease-out ${(i % 3) * 0.05}s forwards` }} />
              ))}
            </div>
          )}
          <div className="absolute inset-0" data-testid="arm-drop-body" style={{
            transformOrigin: "12% 45%",
            transform: armPh <= 1 ? "translate(19.8vh, -41.1vh) rotate(60deg)" : "translate(0, 0) rotate(0deg)",
            transition: armPh === 2 ? "transform 0.85s cubic-bezier(0.5, 0, 0.9, 0.6), opacity 0.25s ease" : armPh === 5 ? "opacity 0.8s ease" : armPh === 0 ? "none" : "none",
            opacity: armPh <= 1 || armPh === 5 ? 0 : 1,
            animation: armPh === 3 ? "ffArmSettle 0.55s cubic-bezier(0.3,1.4,0.5,1)" : undefined,
          }}>
            {/* his LEFT arm — palm down, thumb toward the viewer (fingers point right) */}
            <img src="/steam-arm-left.png?v=517" alt="" className="absolute inset-0 h-full w-full object-contain" style={{ filter: "drop-shadow(0 3px 5px rgba(0,0,0,0.5)) brightness(0.92)" }} />
            {/* BUST-OFF SPARKS at the torn shoulder end: a hot burst right as it
                lands, then the slow just-ripped-loose loop while it rests */}
            {armPh === 3 && (
              <div className="absolute" data-testid="floor-arm-sparks-burst" style={{ left: "9%", top: "32%" }}>
                <span className="absolute rounded-full" style={{ left: "-2.6vh", top: "-2.6vh", width: "5.2vh", height: "5.2vh", background: "radial-gradient(circle, rgba(255,246,215,1), rgba(255,175,75,0.6) 42%, transparent 74%)", mixBlendMode: "screen", filter: "blur(1.5px)", animation: "ffSparkShower 0.6s ease-out forwards", "--sx": "0vh", "--sy": "0vh" }} />
                {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11].map((i) => (
                  <span key={`ab-${i}`} className="absolute" style={{ width: `${0.55 + (i % 3) * 0.12}vh`, height: `${0.55 + (i % 3) * 0.12}vh`, borderRadius: "9999px", background: i % 2 ? "#FFD98A" : "#FF9A3A", boxShadow: "0 0 6px 2px rgba(255,185,85,0.95)", "--sx": `${[-5, -2.5, 1.5, -6.5, 3, -1, 4.5, -4, 2, 6, -3.5, 5][i]}vh`, "--sy": `${[-6, -8.5, -7, -4, -5.5, -9.5, -3.5, -2, -7.5, -5, -3, -8][i]}vh`, animation: `ffSparkShower ${0.55 + (i % 4) * 0.13}s ease-out ${(i % 3) * 0.05}s forwards` }} />
                ))}
              </div>
            )}
            {armPh >= 4 && (
              <div className="absolute" data-testid="floor-arm-sparks" style={{ left: "9%", top: "32%" }}>
                <span className="absolute rounded-full" style={{ left: "-1.4vh", top: "-1.4vh", width: "2.8vh", height: "2.8vh", background: "radial-gradient(circle, rgba(255,240,200,0.95), rgba(255,170,70,0.5) 45%, transparent 75%)", mixBlendMode: "screen", filter: "blur(1px)", opacity: 0, animation: "ffWeldFlash 4.2s linear 2.1s infinite" }} />
                {[0, 1, 2, 3, 4, 5, 6].map((i) => (
                  <span key={`aspk-${i}`} className="absolute" style={{ width: "0.5vh", height: "0.5vh", borderRadius: "9999px", background: i % 2 ? "#FFD98A" : "#FF9A3A", boxShadow: "0 0 5px 1px rgba(255,180,80,0.85)", opacity: 0, "--sx": `${[-2.6, -1.2, 0.8, -3.4, 1.8, -0.6, 2.4][i]}vh`, "--sy": `${[-3.8, -5.4, -4.6, -2.6, -3.2, -6, -2.2][i]}vh`, animation: `ffArmSpark 4.2s linear ${2.1 + i * 0.055}s infinite` }} />
                ))}
              </div>
            )}
          </div>
        </div>
      )}
      {/* Plague doctor mask abandoned on the floor NEXT TO THE PUMP (top-level
          z-3 so the rack's frame post can't draw over it; desktop-only) */}
      {cfg.golemLeft && (
        <div className="absolute z-[3] hidden sm:block" data-testid="steam-mask-prop" style={{ left: "calc(50% - 56vh)", bottom: "0.9vh" }}>
          <div className="absolute left-1/2 -translate-x-1/2" style={{ bottom: "-0.5vh", width: "14vh", height: "2vh", background: "radial-gradient(ellipse, rgba(0,0,0,0.55), rgba(0,0,0,0) 70%)" }} />
          <img src="/steam-mask-floor.png" alt="" className="relative object-contain" style={{ width: "12vh" }} />
        </div>
      )}
      {cfg.roofCables && STEAM_CABLES.map((c, i) => (
        <div key={`cable-${i}`} className="absolute top-0 z-[3]" style={{ left: c.left, width: c.w, height: `${c.h}vh`, transformOrigin: "top center", animation: `ffCableSway ${c.dur}s ease-in-out ${c.delay}s infinite`, "--sw": `${c.sway}deg` }}>
          <div className="h-full w-full rounded-b-full" style={{ background: "linear-gradient(90deg,#0E0A06 0%,#3A2818 42%,#6B4A2A 50%,#3A2818 58%,#0E0A06 100%)", boxShadow: "0 1px 3px rgba(0,0,0,0.6)" }} />
          {c.plug && <div className="absolute left-1/2 h-2.5 w-2.5 -translate-x-1/2 rounded-full" style={{ bottom: -6, background: "radial-gradient(circle at 35% 30%, #E0B063, #6B4A1A 70%)", boxShadow: "0 1px 2px rgba(0,0,0,0.6)" }} />}
        </div>
      ))}
      {cfg.steam && STEAM_PUFFS.map((s, i) => (
        <div key={`steam-${i}`} className="absolute bottom-[42vh] rounded-full" style={{ left: s.left, width: s.size, height: s.size, background: "radial-gradient(circle, rgba(255,244,224,0.5), rgba(255,244,224,0) 70%)", animation: `ffSteam ${s.dur}s ease-in ${s.delay}s infinite` }} />
      ))}
      {cfg.steam && (
        <div className="absolute z-[2]" style={{ left: "59.5%", top: "16vw" }} data-testid="steam-jet">
          {STEAM_JET.map((p, i) => (
            <div key={`jet-${i}`} className="absolute -translate-x-1/2 rounded-full" style={{ width: p.size, height: p.size, background: "radial-gradient(circle, rgba(255,250,240,0.7), rgba(255,250,240,0) 70%)", filter: "blur(2px)", animation: `ffSteam ${p.dur}s ease-in ${p.delay}s infinite` }} />
          ))}
        </div>
      )}
      {/* Two extra vents anchored to the open pipe mouths painted in the wall art.
          The box below reproduces the wall image's object-cover geometry
          (848x1264, centred, top-aligned) so the puffs stay on the pipes at any
          screen size — percentages here are image coordinates, not viewport ones. */}
      {cfg.steam && (
        <div
          className="pointer-events-none absolute z-[3]"
          data-testid="steam-vents"
          style={{
            left: "50%",
            top: 0,
            transform: "translateX(-50%)",
            width: "max(100vw, calc(100vh * 0.67089))",
            height: "max(100vh, calc(100vw * 1.49057))",
          }}
        >
          {[
            { id: "low", left: "45.4%", top: "80.7%", puffs: STEAM_JET_LOW },
            { id: "floor", left: "55.7%", top: "80.7%", puffs: STEAM_JET_FLOOR },
          ].map((v) => (
            <div key={v.id} className="absolute" style={{ left: v.left, top: v.top }} data-testid={`steam-jet-${v.id}`}>
              {v.puffs.map((p, i) => (
                <div
                  key={`${v.id}-${i}`}
                  className="absolute -translate-x-1/2 rounded-full"
                  style={{ width: p.size, height: p.size, background: "radial-gradient(circle, rgba(255,248,236,0.6), rgba(255,248,236,0) 72%)", filter: "blur(3px)", animation: `ffSteam ${p.dur}s ease-in ${p.delay}s infinite` }}
                />
              ))}
            </div>
          ))}
        </div>
      )}
      {cfg.bar && <img src={cfg.bar} alt="" className="absolute bottom-0 left-1/2 w-[86vw] max-w-xl -translate-x-1/2 object-contain opacity-85 sm:w-[46vw]" />}
      {cfg.glow && <div className="absolute bottom-[10vh] left-1/2 h-56 w-56 -translate-x-1/2 rounded-full sm:h-72 sm:w-72" style={{ background: "radial-gradient(circle, rgba(255,150,50,0.45), rgba(255,150,50,0) 70%)", animation: "ffTorchGlow 2.3s ease-in-out infinite" }} />}
      {cfg.torchLeft && <>
        <img src={cfg.torchLeft} alt="" className="absolute bottom-0 left-[-7%] h-[30vh] w-auto object-contain opacity-95 sm:h-[38vh]" />
        <img src={cfg.torchLeft} alt="" className="absolute bottom-0 right-[-7%] h-[30vh] w-auto object-contain opacity-95 sm:h-[38vh]" style={{ transform: "scaleX(-1)" }} />
        {cfg.torchFlame && (<>
          <div className="absolute bottom-0 left-[-7%] h-[30vh] sm:h-[38vh]" style={{ aspectRatio: "848 / 1264", animation: "ffFlame 1.9s ease-in-out infinite" }}>
            {flameFrames.map((f, i) => (
              <img key={`fl-${f}`} src={f} alt="" className="absolute inset-0 h-full w-full object-contain" style={{ opacity: 0, animation: `ffFlameCycle ${(flameFrames.length * 0.14).toFixed(2)}s linear infinite`, animationDelay: `${-(i * 0.14).toFixed(2)}s` }} />
            ))}
          </div>
          <div className="absolute bottom-0 right-[-7%] h-[30vh] sm:h-[38vh]" style={{ aspectRatio: "848 / 1264", transform: "scaleX(-1)", animation: "ffFlame 2.1s ease-in-out infinite" }}>
            {flameFrames.map((f, i) => (
              <img key={`fr-${f}`} src={f} alt="" className="absolute inset-0 h-full w-full object-contain" style={{ opacity: 0, animation: `ffFlameCycle ${(flameFrames.length * 0.14).toFixed(2)}s linear infinite`, animationDelay: `${-(i * 0.14).toFixed(2)}s` }} />
            ))}
          </div>
        </>)}
      </>}
      {cfg.totemRight && <img src={cfg.totemRight} alt="" className="absolute bottom-0 right-[7%] h-[34vh] object-contain opacity-90 sm:h-[42vh]" />}
      {cfg.torch && <>
        <img src={cfg.torch} alt="" className="absolute bottom-0 left-[1%] h-[62vh] object-contain opacity-90" style={{ transformOrigin: "bottom", animation: "ffFlame 1.7s ease-in-out infinite" }} />
        <img src={cfg.torch} alt="" className="absolute bottom-0 right-[1%] h-[62vh] object-contain opacity-90" style={{ transform: "scaleX(-1)", transformOrigin: "bottom", animation: "ffFlame 2.1s ease-in-out infinite" }} />
      </>}
      {cfg.floor && (
        <div className="absolute inset-x-0 bottom-0 z-[2]" style={{ height: "14vh" }} data-testid="steam-floor">
          <div className="absolute inset-0" style={{ background: "linear-gradient(180deg,#2c1d0e 0%,#1b1209 42%,#0d0906 100%)", boxShadow: "0 -10px 28px rgba(0,0,0,0.55)" }} />
          <div className="absolute inset-0 opacity-40" style={{ backgroundImage: "repeating-linear-gradient(90deg, rgba(0,0,0,0.55) 0px, rgba(0,0,0,0.55) 2px, transparent 2px, transparent 140px)" }} />
          <div className="absolute inset-x-0 top-[46%] h-px" style={{ background: "rgba(0,0,0,0.5)" }} />
          <div className="absolute inset-x-0 top-0 h-[3px]" style={{ background: "linear-gradient(90deg, transparent, rgba(217,164,78,0.55) 20%, rgba(240,200,120,0.7) 50%, rgba(217,164,78,0.55) 80%, transparent)" }} />
          <div className="absolute inset-x-0 top-[3px] h-[10px]" style={{ background: "linear-gradient(180deg, rgba(217,164,78,0.22), transparent)" }} />
          {/* POWER CABLES: black rubber runs weaving all over the bare floor,
              crossing and overlapping each other between the machines */}
          <svg className="absolute inset-0 h-full w-full" viewBox="0 0 1000 140" preserveAspectRatio="none" data-testid="steam-floor-cables">
            {/* long run snaking wall-to-wall */}
            <path d="M -20 30 C 120 72, 260 14, 400 56 C 540 96, 680 24, 820 52 C 900 66, 960 38, 1020 52" fill="none" stroke="#020202" strokeWidth="7" opacity="0.95" />
            <path d="M -20 28.5 C 120 70.5, 260 12.5, 400 54.5 C 540 94.5, 680 22.5, 820 50.5 C 900 64.5, 960 36.5, 1020 50.5" fill="none" stroke="#333029" strokeWidth="1.4" opacity="0.55" />
            {/* second run weaving the other way — crosses the first twice */}
            <path d="M -20 78 C 140 38, 300 108, 460 68 C 620 30, 760 102, 1020 62" fill="none" stroke="#040404" strokeWidth="8" opacity="0.95" />
            <path d="M -20 76 C 140 36, 300 106, 460 66 C 620 28, 760 100, 1020 60" fill="none" stroke="#3A362E" strokeWidth="1.6" opacity="0.5" />
            {/* foreground run drooping low, overlapping both */}
            <path d="M -20 112 C 180 84, 340 124, 520 94 C 700 66, 850 118, 1020 96" fill="none" stroke="#030303" strokeWidth="9" opacity="0.95" />
            <path d="M -20 110 C 180 82, 340 122, 520 92 C 700 64, 850 116, 1020 94" fill="none" stroke="#37332B" strokeWidth="1.8" opacity="0.5" />
            {/* a loose length doubling back on itself mid-floor */}
            <path d="M 190 122 C 320 58, 430 132, 560 78 C 650 42, 710 112, 830 102" fill="none" stroke="#050505" strokeWidth="6" opacity="0.92" />
            {/* thin stray wire cutting diagonally across everything */}
            <path d="M -20 52 C 220 94, 520 26, 1020 112" fill="none" stroke="#060606" strokeWidth="3.5" opacity="0.9" />
            {/* dark iron couplings clamped where runs pass */}
            <rect x="352" y="48" width="16" height="13" rx="2.5" fill="#141210" stroke="#3A362E" strokeWidth="1.2" opacity="0.95" />
            <rect x="640" y="34" width="15" height="13" rx="2.5" fill="#141210" stroke="#3A362E" strokeWidth="1.2" opacity="0.95" />
            <rect x="500" y="88" width="18" height="15" rx="3" fill="#171411" stroke="#3A362E" strokeWidth="1.2" opacity="0.95" />
            <rect x="828" y="98" width="15" height="14" rx="2.5" fill="#141210" stroke="#3A362E" strokeWidth="1.2" opacity="0.95" />
          </svg>
          {/* MOUSETRAP set against the wall base — the rats scurry right past
              it. Cheese is a separate overlay so the thief can STEAL it;
              the base is the sprung/empty trap art. */}
          <div className="absolute hidden sm:block" data-testid="steam-mousetrap" style={{ left: "calc(50% + 36vh)", bottom: "12.8vh", width: "7.5vh", aspectRatio: "1245 / 505" }}>
            <img src="/steam-mousetrap-empty.png" alt="" className="absolute inset-0 h-full w-full object-contain" style={{ filter: "drop-shadow(0 2px 3px rgba(0,0,0,0.55)) brightness(1.08)", animation: trapPh === 3 ? "ffTrapJolt 0.4s ease-out" : undefined }} />
            {trapPh < 3 && (
              <img src="/steam-cheese.png" alt="" className="absolute" data-testid="trap-cheese" style={{ left: "68%", top: "13.5%", width: "12.8%", filter: "brightness(1.08)" }} />
            )}
          </div>
          {/* THE CHEESE THIEF: creeps in from the right, nibbles, SNAP —
              flees left with the cheese by a whisker */}
          {trapPh >= 1 && trapPh <= 3 && (
            <div className="absolute hidden sm:block" data-testid="cheese-thief" style={{
              left: "calc(50% + 42.5vh)", bottom: "12.6vh",
              animation: trapPh === 1 ? "ffThiefIn 2.3s cubic-bezier(0.2,0.7,0.4,1) forwards" : trapPh === 3 ? "ffThiefFlee 1.15s cubic-bezier(0.5,0,0.8,0.4) forwards" : "none",
            }}>
              <div style={{ transform: "scaleX(-1)" }}>
                <img src="/steam-rat.png" alt="" className="object-contain" style={{ height: "3vh", filter: "brightness(1.05) contrast(1.05) drop-shadow(0 2px 2px rgba(0,0,0,0.55))", animation: trapPh === 2 ? "ffThiefNibble 0.5s ease-in-out infinite" : "ffRatScurry 0.2s linear infinite" }} />
              </div>
              {trapPh === 3 && (
                <img src="/steam-cheese.png" alt="" className="absolute" style={{ left: "-1.3vh", top: "0.5vh", width: "2.2vh" }} />
              )}
            </div>
          )}
          {/* WORKSHOP RATS: two of them scurry along the wall/floor corner,
              back and forth at constant speed — their turnarounds happen
              hidden BEHIND the left/right golems (rats are z-2, golems z-3/4).
              Desktop-only, like the rest of the workshop set-dressing. */}
          {[
            { h: 3.4, dur: 8.5, delay: 0, bottom: 12.0, tid: "steam-rat-1" },
            { h: 2.7, dur: 11.5, delay: -4.6, bottom: 12.7, tid: "steam-rat-2" },
          ].map((rt) => (
            <div key={rt.tid} className="absolute left-0 hidden landscape:block" data-testid={rt.tid} style={{ bottom: `${rt.bottom}vh`, animation: `ffRatRun ${rt.dur}s linear ${rt.delay}s infinite alternate` }}>
              <div style={{ animation: `ffRatFace ${rt.dur * 2}s steps(1,end) ${rt.delay}s infinite` }}>
                <img src="/steam-rat.png" alt="" className="object-contain" style={{ height: `${rt.h}vh`, filter: "brightness(1.08) contrast(1.06) drop-shadow(0 2px 2px rgba(0,0,0,0.55))", animation: "ffRatScurry 0.22s linear infinite" }} />
              </div>
            </div>
          ))}
          {/* Brass goggles set down on the ground in front of the half-built robot
              (desktop-only: on mobile the rack is hidden and the right golem's
              feet occupy this spot — live bug: goggles showed under his feet) */}
          <div className="absolute hidden sm:block" data-testid="steam-goggles-prop" style={{ left: "calc(50% + 40vh)", bottom: "0.8vh", transform: "rotate(-6deg)" }}>
            <div className="absolute left-1/2 -translate-x-1/2" style={{ bottom: "-0.4vh", width: "9vh", height: "1.4vh", background: "radial-gradient(ellipse, rgba(0,0,0,0.6), rgba(0,0,0,0) 70%)" }} />
            <img src="/steam-goggles-shelf.png" alt="" className="relative object-contain" style={{ width: "7.5vh", filter: "drop-shadow(0 3px 4px rgba(0,0,0,0.8)) brightness(1.18)" }} />
          </div>
        </div>
      )}
    </div>
    {/* Stealth saucer: its own fixed layer ABOVE the page content (z-30 —
        over words/cards at z-10, under the header z-40 and dialogs). The
        turn is 3 steps: side -> front (eye locks on the user) -> mirrored
        side. A small red beacon dot blinks on the hull (no body flash). */}
    {cfg.saucer && (
      <div className="pointer-events-none fixed inset-0 z-[30] select-none overflow-hidden" style={{ visibility: abducting ? "hidden" : undefined }} data-testid="cyber-saucer-layer">
        <div className="absolute left-0 top-0" style={{ willChange: "transform", animation: "ffSaucerPatrol 60s ease-in-out infinite" }} data-testid="cyber-saucer">
          <div className="relative" style={{ width: "clamp(96px, 13vw, 150px)", aspectRatio: "240 / 109", animation: "ffSaucerHover 2.8s ease-in-out infinite" }}>
            {/* faint cyan search-beam: sweeps down from the belly during hover
                stops, like it's scanning the city below (painted under sprite) */}
            <div className="absolute" style={{ left: "50%", top: "66%", width: "260%", height: "42vh", transform: "translateX(-50%)", opacity: 0, animation: "ffSaucerBeamOn 60s linear infinite" }} data-testid="cyber-saucer-beam">
              <div className="h-full w-full" style={{ transformOrigin: "50% 0%", animation: "ffSaucerBeamSweep 4s ease-in-out infinite alternate", clipPath: "polygon(46.5% 0, 53.5% 0, 100% 100%, 0 100%)", background: "linear-gradient(180deg, rgba(34,224,224,0.36) 0%, rgba(34,224,224,0.14) 45%, rgba(34,224,224,0) 90%)" }} />
            </div>
            {/* side profile (faces LEFT; scaleX flips handled by the face anim) */}
            <div className="absolute inset-0" style={{ animation: "ffSaucerSideFace 60s ease-in-out infinite" }}>
              <img src={cfg.saucer} alt="" className="absolute inset-0 block h-full w-full object-contain" style={{ filter: "drop-shadow(0 0 9px rgba(34,224,224,0.35))" }} />
              <span className="absolute rounded-full" style={{ left: "44%", top: "22%", width: "4.5%", aspectRatio: "1", background: "radial-gradient(circle, #FF7A6E 0%, #FF2B1E 45%, rgba(255,43,30,0) 78%)", boxShadow: "0 0 6px 2px rgba(255,50,35,0.75)", animation: "ffSaucerBeacon 1.6s steps(1,end) infinite" }} data-testid="cyber-saucer-beacon" />
            </div>
            {/* head-on view: the eye lens stares straight at the user mid-turn */}
            <div className="absolute inset-0" style={{ opacity: 0, animation: "ffSaucerFrontFace 60s ease-in-out infinite" }}>
              <img src={cfg.saucerFront} alt="" className="absolute inset-0 block h-full w-full object-contain" style={{ filter: "drop-shadow(0 0 9px rgba(34,224,224,0.35))" }} />
              <span className="absolute rounded-full" style={{ left: "48%", top: "16%", width: "4.5%", aspectRatio: "1", background: "radial-gradient(circle, #FF7A6E 0%, #FF2B1E 45%, rgba(255,43,30,0) 78%)", boxShadow: "0 0 6px 2px rgba(255,50,35,0.75)", animation: "ffSaucerBeacon 1.6s steps(1,end) infinite" }} />
            </div>
          </div>
        </div>
      </div>
    )}
    {cfg.saucer && <SaucerAbduction key={`sa-${heistEpoch}`} saucer={cfg.saucer} onActive={setAbducting} />}
    {cfg.cars && <HotPursuitHeist key={`hp-${heistEpoch}`} />}
    {cfg.gully && <CompanionPatrol s1="/fairy-pixie-1.png" s2="/fairy-pixie-2.png" glow="rgba(94,224,168,0.7)" heistKind="poof" testid="fairy-pixie" />}
    {cfg.gully && <UnicornChargeHeist />}
    {theme === "fantasy" && <CompanionPatrol s1="/dragon-tiny-1.png" s2="/dragon-tiny-2.png" glow="rgba(255,140,50,0.7)" dustCol={["#FFE9B0", "#FF8C3A"]} heistKind="breath" testid="tiny-dragon" flap="ffDragonFlap 3.4s linear infinite" flapBase="ffDragonFlapInv 3.4s linear infinite" />}
    {theme === "fantasy" && <DragonHeist key={`dh-${heistEpoch}`} />}
    {cfg.lounge && <CompanionPatrol s1="/tiki-man-surf.png" s2="/tiki-man-surf.png" glow="rgba(116,198,230,0.55)" dustCol={["#FFFFFF", "#74C6E6"]} heistKind="crash" testid="tiki-surfer" flap="none" flapBase="none" emitY={38} bob="ffTikiSurfBob 1.7s ease-in-out infinite" />}
    {cfg.lounge && <TikiSpearHeist key={`th-${heistEpoch}`} />}
    {theme === "steam" && <SteamSpringHeist key={`ssh-${heistEpoch}`} />}
    {theme === "steam" && <SteamGearsHeist key={`sgh-${heistEpoch}`} />}
  </>);
}


