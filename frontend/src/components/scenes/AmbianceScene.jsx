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
  steam: { grad: "linear-gradient(180deg,#17100A 0%,#241708 55%,#130C06 100%)", wall: "/steam-wall-full.png", console: "/steam-console.png", device: "/steam-arc-device.png", steam: true, roofCables: true, floor: true, accent: "#D9A44E", sky: "#F1D9A6" },
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


export function AmbianceScene({ theme, cfg, heistEpoch = 0 }) {
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
      {cfg.console && (
        <div className="absolute bottom-0 left-[-22%] z-[4] h-[52vh] sm:left-[-2%] sm:h-[74vh]" style={{ aspectRatio: "848 / 1264" }} data-testid="steam-console">
          <img src={cfg.console} alt="" className="absolute inset-0 h-full w-full object-contain" />
          {/* Brass goggles set down on the console's desk shelf — anchored to the
              cabinet's own box so they stay in scale with it on any screen. */}
          <div className="absolute" data-testid="steam-goggles-prop" style={{ left: "28%", top: "57.6%", width: "18%", transform: "rotate(-5deg)" }}>
            <div className="absolute left-1/2 -translate-x-1/2" style={{ bottom: "-10%", width: "130%", height: "38%", background: "radial-gradient(ellipse, rgba(0,0,0,0.85), rgba(0,0,0,0) 66%)" }} />
            <img src="/steam-goggles-shelf.png" alt="" className="relative w-full object-contain" style={{ filter: "drop-shadow(0 4px 5px rgba(0,0,0,0.9)) brightness(1.22) contrast(1.05)" }} />
          </div>
        </div>
      )}
      {cfg.device && (
        <div className="absolute bottom-0 right-[-5%] z-[3] h-[40vh] sm:right-[3%] sm:h-[46vh]" style={{ aspectRatio: "545 / 970", transform: "scaleX(-1)" }}>
          <img src={cfg.device} alt="" className="absolute inset-0 h-full w-full object-contain opacity-90" />
          <div className="absolute" style={{ left: "43.5%", width: "12.5%", top: "2%", height: "22%" }}>
            <div className="absolute inset-0 rounded-full" style={{ background: "radial-gradient(ellipse at 50% 50%, rgba(120,210,255,0.22), rgba(120,210,255,0) 70%)", animation: "ffArcGlow 0.13s steps(2,end) infinite" }} />
            <div className="absolute inset-x-0 top-0" style={{ height: "24%", animation: "ffArcClimb 1.7s ease-in-out infinite" }}>
              <svg viewBox="0 0 40 12" preserveAspectRatio="none" className="h-full w-full" style={{ overflow: "visible" }}>
                <polyline points="0,6 6,2 13,9 20,3 27,10 34,4 40,7" fill="none" stroke="#CBF3FF" strokeWidth="1" strokeLinejoin="round" strokeLinecap="round" style={{ filter: "drop-shadow(0 0 2px #4CC8FF) drop-shadow(0 0 5px #7A5CFF)", animation: "ffArcFlicker 0.1s steps(2,end) infinite" }} />
              </svg>
            </div>
          </div>
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
          {/* Plague doctor mask abandoned on the dusty floor, soft ground shadow */}
          <div className="absolute" data-testid="steam-mask-prop" style={{ left: "52%", bottom: "1.4vh" }}>
            <div className="absolute left-1/2 -translate-x-1/2" style={{ bottom: "-0.5vh", width: "14vh", height: "2vh", background: "radial-gradient(ellipse, rgba(0,0,0,0.55), rgba(0,0,0,0) 70%)" }} />
            <img src="/steam-mask-floor.png" alt="" className="relative object-contain" style={{ width: "13vh" }} />
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


