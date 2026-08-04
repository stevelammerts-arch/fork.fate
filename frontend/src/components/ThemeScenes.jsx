import React, { useState, useEffect, useRef } from "react";

const FALLING_SPRITES = Array.from({ length: 12 }).map((_, i) => ({
  left: `${(i * 8 + 4) % 94}%`,
  size: 22 + (i % 3) * 12,
  dur: 9 + (i % 5) * 2.2,
  delay: (i % 6) * 1.6,
}));

const FLYING_BIRDS = Array.from({ length: 8 }).map((_, i) => ({
  top: `${4 + i * 5}%`,
  size: 38 + (i % 3) * 20,
  dur: 14 + (i % 5) * 3,
  delay: -(i * 3.2),
  flap: 0.7 + (i % 3) * 0.16,
  flapDelay: -(i * 0.13),
}));

// Continuous rising plume from the winter cabin chimney: many overlapping
// puffs emitted ~1s apart so they merge into one cohesive column of smoke.
const CHIMNEY_SMOKE = Array.from({ length: 9 }).map((_, i) => ({
  size: 30 + (i % 3) * 8,
  dur: 9,
  delay: -(i * 1.0),
}));

// Fantasy "Dragon's Hoard": glittering gold sparkles across the treasure pile
// + slow water droplets falling from the cave ceiling with a ripple on landing.
const GOLD_GLITTER = Array.from({ length: 16 }).map((_, i) => ({
  left: `${8 + (i * 6.1 + (i % 4) * 3.2) % 84}%`,
  top: `${74 + ((i * 13) % 20)}%`,
  size: 3 + (i % 3) * 2,
  dur: 1.6 + ((i * 7) % 5) * 0.4,
  delay: ((i * 11) % 13) * 0.3,
}));
const CAVE_DRIPS = [
  { left: "22%", dur: 2.7, delay: 0 },
  { left: "54%", dur: 3.2, delay: 1.3 },
  { left: "79%", dur: 2.9, delay: 0.6 },
];

export const SEASONS = {
  fall: {
    grad: "linear-gradient(180deg,#FBF3E8 0%,#F5E6D0 55%,#EFDCC0 100%)",
    tree: "/fall-tree.png", treeOpacity: 0.72, ground: "/fall-ground.png", groundH: "h-[34vh]", groundOpacity: 0.9, decorRight: "/fall-jackolanterns.png", decorRightGlow: true, decorRightOpacity: 0.72, scarecrow: "/fall-scarecrow.png", groundPumpkins: true, owl: "/fall-owl.png", moon: true, squirrel: "/fall-squirrel.png",
    items: ["/leaf-red.png", "/leaf-orange.png", "/leaf-yellow.png", "/leaf-brown.png"], falling: true, hint: "#C0451B",
  },
  winter: {
    grad: "linear-gradient(180deg,#EAF3FA 0%,#DCEAF5 55%,#CFE0EE 100%)",
    tree: "/winter-tree.png", treeSide: "left", treeFlip: true, treeZ: "z-[2]",
    decorRight: "/winter-decor.png", decorRightBig: true, decorRightPos: "right-[-10%] sm:right-[-5%]", santa: "/santa-sleigh.png", chimney: { left: "58.5%", top: "16%" }, cardinal: "/winter-cardinal.png", snowmanArm: "/winter-arm.png",
    items: ["/flake-blue.png", "/flake-white.png", "/flake-silver.png"], falling: true, hint: "#2E77A6",
  },
  spring: {
    grad: "linear-gradient(180deg,#F3FBEF 0%,#FBEFF5 55%,#EFF7E6 100%)",
    tree: "/spring-tree.png", treeBig: true, ground: "/spring-ground2.png", decorLeft: "/spring-decor.png", decorLeftBig: true, rabbits: "/spring-rabbit.png",
    items: ["/blossom-pink.png", "/blossom-white.png", "/petal-coral.png"], falling: true, hint: "#D46A9F",
  },
  summer: {
    grad: "linear-gradient(180deg,#BFE8F7 0%,#8FD3EE 44%,#5FB8D9 62%,#F3E2B3 62%,#EAD199 100%)",
    tree: "/summer-tree.png", treeH: "h-[60svh] sm:h-[92vh] z-[3]", treeOpacity: 0.92, ocean: true, decorLeft: "/summer-decor.png", decorLeftBig: true, decorLeftW: "w-[50vw] max-w-none sm:w-[46vw]", decorLeftOpacity: 0.92, decorLeftZ: "z-[3]", sun: "/summer-sun.png", birds: "/summer-seagull.png",
    items: ["/summer-sun.png", "/summer-ball.png", "/summer-icecream.png"], falling: false, hint: "#E07E17", crabs: "/summer-crab.png", coconut: "/summer-coconut.png",
  },
};

export function SeasonScene({ theme, cfg }) {
  return (
    <div className="ff-theme-scene pointer-events-none fixed inset-0 z-0 select-none overflow-hidden" data-testid={`season-scene-${theme}`}>
      <div className="absolute inset-0" style={{ background: cfg.grad }} />
      {cfg.ground && <img src={cfg.ground} alt="" className={`pointer-events-none absolute bottom-0 left-0 z-0 w-full select-none object-cover object-bottom opacity-[0.6] ${cfg.groundH || "h-[46vh]"}`} style={{ maskImage: "linear-gradient(to top, rgba(0,0,0,1) 45%, rgba(0,0,0,0) 100%)", WebkitMaskImage: "linear-gradient(to top, rgba(0,0,0,1) 45%, rgba(0,0,0,0) 100%)", ...(cfg.groundOpacity ? { opacity: cfg.groundOpacity } : {}) }} data-testid="spring-ground" />}
      {cfg.ocean && (<>
        <svg width="0" height="0" className="absolute" aria-hidden="true">
          <filter id="ff-sea-warp" x="-20%" y="-20%" width="140%" height="140%">
            <feTurbulence type="turbulence" baseFrequency="0.006 0.02" numOctaves="2" seed="7" result="n" />
            <feDisplacementMap in="SourceGraphic" in2="n" scale="20" xChannelSelector="R" yChannelSelector="G" />
          </filter>
        </svg>
        <div className="absolute inset-x-0" style={{ top: "45%", height: "20%", background: "linear-gradient(180deg,#2C86C4 0%,#3CA0D4 38%,#74C6E6 80%,#BFE9F4 100%)" }} />
        <div className="ff-sea-shimmer absolute inset-x-0 overflow-hidden" style={{ top: "46%", height: "17.5%" }}>
          <div className="ff-sea-wave ff-sea-wave-a" />
          <div className="ff-sea-wave ff-sea-wave-b" />
        </div>
        <div className="absolute inset-x-0" style={{ top: "63.5%", height: "2.4%", background: "linear-gradient(180deg,rgba(255,255,255,0) 0%,rgba(255,255,255,0.9) 55%,rgba(255,255,255,0) 100%)", filter: "blur(1.5px)" }} />
        <div className="absolute inset-x-0" style={{ top: "65%", height: "5%", background: "linear-gradient(180deg,rgba(196,168,110,0.55),rgba(196,168,110,0))" }} />
      </>)}
      {cfg.sun && <img src={cfg.sun} alt="" className="absolute right-[24%] top-[5%] w-20 opacity-40" style={{ animation: "ffGlow 5s ease-in-out infinite" }} />}
      {cfg.santa && (
        <div className="absolute left-0 top-0 z-[4] sm:z-[1]" style={{ animation: "ffSantaFly 26s ease-in-out infinite" }} data-testid="winter-santa">
          <img src={cfg.santa} alt="" className="w-28 opacity-70 drop-shadow-[0_3px_10px_rgba(120,150,180,0.3)] sm:w-40" style={{ animation: "ffSantaBob 2.6s ease-in-out infinite", filter: "blur(0.5px)" }} />
        </div>
      )}
      <img src={cfg.tree} alt="" className={`absolute bottom-0 ${cfg.treeSide === "left" ? "left-0" : "right-0"} w-auto max-w-[96vw] object-contain opacity-[0.32] ${cfg.treeH ? cfg.treeH : (cfg.treeBig ? "h-[70svh] sm:h-[106vh] z-[2]" : "h-[46svh] sm:h-[86vh]")} ${cfg.treeZ || ""}`} style={{ maxWidth: cfg.treeBig ? "88vw" : undefined, transform: cfg.treeFlip ? "scaleX(-1)" : undefined, ...(cfg.treeOpacity ? { opacity: cfg.treeOpacity } : {}) }} />
      {cfg.cardinal && (
        <div className="absolute z-[3] w-7 left-[33%] top-[53.8%] sm:w-11 sm:left-[12.2%] sm:top-[13%]" style={{ animation: "ffCardinalVisitB 52s linear infinite", opacity: 0 }} data-testid="winter-cardinal-tree">
          <div style={{ transform: "scaleX(-1)" }}>
            <img src="/winter-cardinal-fly.png" alt="" className="w-full" style={{ animation: "ffCardinalFlyShowB 52s linear infinite, ffCardinalFlap 0.24s ease-in-out infinite alternate", transformOrigin: "50% 60%" }} />
            <img src={cfg.cardinal} alt="" className="absolute inset-0 w-full opacity-0" style={{ animation: "ffCardinalPerchShowB 52s linear infinite, ffCardinalLookB 52s linear infinite", transformOrigin: "50% 100%" }} />
          </div>
        </div>
      )}
      {cfg.decorRight && (cfg.chimney ? (
        <div className={`absolute bottom-0 ${cfg.decorRightPos || "right-[3%]"} ${cfg.decorRightBig ? "w-[92vw] max-w-none sm:w-[48vw]" : "w-[36vw] max-w-md sm:w-[24vw]"}`} style={{ aspectRatio: "1264 / 848" }} data-testid="winter-cabin">
          <img src={cfg.decorRight} alt="" className="absolute inset-0 h-full w-full object-contain opacity-[0.32]" />
          <span className="ff-chimney-column" style={{ left: cfg.chimney.left, top: cfg.chimney.top }} />
          {CHIMNEY_SMOKE.map((s, i) => (
            <span key={`smoke-${i}`} className="ff-chimney-smoke" style={{ left: cfg.chimney.left, top: cfg.chimney.top, width: s.size, height: s.size, animationDuration: `${s.dur}s`, animationDelay: `${s.delay}s` }} />
          ))}
          {cfg.snowmanArm && (
            <div className="absolute w-[6%]" style={{ left: "11.5%", top: "61.5%", animation: "ffSnowmanWave 34s linear infinite", transformOrigin: "92% 92%", opacity: 0 }} data-testid="winter-snowman-arm">
              <img src={cfg.snowmanArm} alt="" className="w-full" />
            </div>
          )}
          {cfg.cardinal && (
            <div className="absolute w-[6.5%]" style={{ left: "43%", top: "14%", animation: "ffCardinalVisitA 52s linear infinite" }} data-testid="winter-cardinal">
              <img src="/winter-cardinal-fly.png" alt="" className="w-full" style={{ animation: "ffCardinalFlyShowA 52s linear infinite, ffCardinalFlap 0.24s ease-in-out infinite alternate", transformOrigin: "50% 60%" }} />
              <img src={cfg.cardinal} alt="" className="absolute inset-0 w-full opacity-0" style={{ animation: "ffCardinalPerchShowA 52s linear infinite, ffCardinalLookA 52s linear infinite", transformOrigin: "50% 100%" }} />
            </div>
          )}
        </div>
      ) : (
        <img src={cfg.decorRight} alt="" className={`absolute bottom-0 ${cfg.decorRightPos || "right-[3%]"} object-contain opacity-[0.32] ${cfg.decorRightBig ? "w-[92vw] max-w-none sm:w-[48vw]" : "w-[36vw] max-w-md sm:w-[24vw]"}`} style={{ ...(cfg.decorRightGlow ? { animation: "ffGlow 3.6s ease-in-out infinite" } : {}), ...(cfg.decorRightOpacity ? { opacity: cfg.decorRightOpacity } : {}) }} />
      ))}
      {cfg.decorLeft && <img src={cfg.decorLeft} alt="" className={`absolute bottom-0 left-0 object-contain opacity-[0.32] sm:left-[2%] ${cfg.decorLeftZ || ""} ${cfg.decorLeftW ? cfg.decorLeftW : (cfg.decorLeftBig ? "w-[92vw] max-w-none sm:w-[48vw]" : "w-42vw] max-w-sm sm:w-[26vw]")}`} style={cfg.decorLeftOpacity ? { opacity: cfg.decorLeftOpacity } : undefined} />}
      {cfg.rabbits && (<>
        {/* two tiny cottontails: one patrols the gazebo lawn, one the tree side */}
        <div className="absolute bottom-[2.5%] left-[14%] z-[3]" style={{ animation: "ffRabbitPatrol 18s linear infinite" }} data-testid="spring-rabbit-1">
          <img src={cfg.rabbits} alt="" className="w-10 opacity-95 sm:w-12" style={{ animation: "ffRabbitGait 18s linear infinite", transformOrigin: "50% 100%" }} />
        </div>
        <div className="absolute bottom-[5%] right-[30%] z-[3]" style={{ animation: "ffRabbitPatrolL 20s linear infinite", animationDelay: "2.5s" }} data-testid="spring-rabbit-2">
          <img src={cfg.rabbits} alt="" className="w-8 opacity-90 sm:w-10" style={{ animation: "ffRabbitGait 20s linear infinite", animationDelay: "2.5s", transformOrigin: "50% 100%" }} />
        </div>
      </>)}
      {cfg.scarecrow && (
        <div className="absolute bottom-0 left-[1%] z-[2] h-[34vh] sm:left-[3%] sm:h-[46vh]" style={{ aspectRatio: "766 / 1585" }} data-testid="fall-scarecrow">
          <img src={cfg.scarecrow} alt="" className="h-full w-full object-contain opacity-[0.72]" />
          {/* raven visits the scarecrow's crossbar tip now and then */}
          <div className="absolute w-[26%]" style={{ left: "1%", top: "7.5%", animation: "ffRavenVisit 44s linear infinite", opacity: 0 }} data-testid="fall-raven">
            <img src="/reaper-raven-fly.png" alt="" className="w-full" style={{ animation: "ffRavenFlyShow 44s linear infinite, ffCardinalFlap 0.26s ease-in-out infinite alternate", transformOrigin: "50% 60%" }} />
            <img src="/reaper-raven.png" alt="" className="absolute inset-0 w-full opacity-0" style={{ animation: "ffRavenPerchShow 44s linear infinite, ffRavenLook 44s linear infinite", transformOrigin: "50% 100%" }} />
          </div>
          <span className="absolute rounded-full" style={{ left: "61.4%", top: "13.3%", width: "6.5%", height: "3.2%", background: "radial-gradient(circle, rgba(255,55,30,1), rgba(255,20,0,0.5) 45%, rgba(255,0,0,0) 72%)", filter: "blur(1px)", animation: "ffEyeFlash 5s ease-in-out infinite" }} />
          <span className="absolute rounded-full" style={{ left: "67.6%", top: "16.3%", width: "6%", height: "3%", background: "radial-gradient(circle, rgba(255,55,30,1), rgba(255,20,0,0.5) 45%, rgba(255,0,0,0) 72%)", filter: "blur(1px)", animation: "ffEyeFlash 5s ease-in-out infinite" }} />
        </div>
      )}
      {cfg.groundPumpkins && <img src="/fall-pumpkins-mid.png" alt="" className="absolute bottom-0 left-1/2 z-[3] w-[35vw] max-w-none -translate-x-1/2 object-contain opacity-[0.72] sm:w-[21vw]" style={{ animation: "ffGlow 3.4s ease-in-out infinite" }} />}
      {cfg.squirrel && (
        <div className="absolute bottom-[1.5%] left-[20%] z-[4]" style={{ animation: "ffSquirrelDart 14s linear infinite" }} data-testid="fall-squirrel">
          <img src="/fall-acorn.png" alt="" className="absolute -right-2 bottom-0 w-4 opacity-0" style={{ animation: "ffAcornShow 14s linear infinite" }} data-testid="fall-acorn" />
          <img src={cfg.squirrel} alt="" className="w-14 sm:w-16" style={{ animation: "ffSquirrelGait 14s linear infinite", transformOrigin: "60% 100%" }} />
        </div>
      )}
      {cfg.crabs && (<>
        {/* two red crabs skittering sideways along the foreground sand strip —
            z-[4] + near-opaque so they read as IN FRONT of the translucent
            chairs/palm rather than ghosting through them */}
        <div className="absolute bottom-[2%] left-[30%] z-[4]" style={{ animation: "ffCrabDodge 18s linear infinite" }} data-testid="summer-crab-1">
          <img src={cfg.crabs} alt="" className="w-12 opacity-95 sm:w-14" />
        </div>
        <div className="absolute bottom-[9%] right-[18%] z-[2]" style={{ animation: "ffCrabSkitter 17s linear infinite reverse", animationDelay: "3s" }} data-testid="summer-crab-2">
          <img src={cfg.crabs} alt="" className="w-9 opacity-90 sm:w-10" />
        </div>
        {/* breeze-blown beach ball bouncing across the sand */}
        <div className="absolute bottom-[4%] left-0 z-[3]" style={{ animation: "ffBallTravel 13s linear infinite" }} data-testid="summer-beachball">
          <div style={{ animation: "ffBallBounce 1.6s infinite" }}>
            <img src="/summer-ball.png" alt="" className="w-10 opacity-90 sm:w-12" style={{ animation: "ffBallSpin 2.2s linear infinite" }} />
          </div>
        </div>
        {/* a coconut drops from the palm now and then and thuds into the sand */}
        {cfg.coconut && (
          <div className="ff-coconut absolute z-[2] w-4 left-[63%] top-[60.5%] sm:w-5 sm:left-[89%] sm:top-[39.5%]" style={{ animation: "ffCoconutFall 18s linear infinite", opacity: 0 }} data-testid="summer-coconut">
            <img src={cfg.coconut} alt="" className="w-full" />
            <span className="absolute -bottom-1 left-1/2 h-2 w-6 rounded-full bg-[#E8D5A8] opacity-0" style={{ animation: "ffCocoPuff 18s linear infinite", filter: "blur(1.5px)" }} />
          </div>
        )}
      </>)}
      {cfg.moon && <div className="absolute top-[6%] left-[24%] z-[1] aspect-square w-[24vw] rounded-full sm:left-[27%] sm:w-[14vw]" style={{ background: "radial-gradient(circle at 42% 40%, #FCF4DA 0%, #EDDCAB 60%, #D6C084 100%)", boxShadow: "0 0 90px 34px rgba(255,240,205,0.38), 0 0 44px 14px rgba(255,246,222,0.55)", opacity: 0.6 }} />}
      {cfg.owl && <img src={cfg.owl} alt="" className="absolute top-[13%] left-[30%] z-[2] w-[13vw] max-w-[150px] object-contain opacity-[0.72] sm:w-[9vw]" />}
      {cfg.falling && FALLING_SPRITES.map((l, i) => (
        <img key={`leaf-${l.left}-${l.dur}-${i}`} src={cfg.items[i % cfg.items.length]} alt="" className="absolute top-0 opacity-40"
          style={{ left: l.left, width: l.size, height: l.size, animation: `ffLeafFall ${l.dur}s linear ${l.delay}s infinite` }} />
      ))}
      {cfg.birds && FLYING_BIRDS.map((b, i) => (
        <div key={`bird-${i}`} className="absolute left-0" style={{ top: b.top, animation: `ffFly ${b.dur}s linear ${b.delay}s infinite`, willChange: "transform", backfaceVisibility: "hidden" }}>
          <img src={cfg.birds} alt="" className="ff-gull block opacity-40 drop-shadow-sm" style={{ width: b.size, animationDuration: `${b.flap}s`, animationDelay: `${b.flapDelay}s` }} />
        </div>
      ))}
    </div>
  );
}


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
  // Distant traffic — small & high up, feels far away
  { top: "12%", topM: "40%", size: 96, dur: 13, delay: 0, rev: false, spinner: true },
  { top: "9%", topM: "36%", size: 78, dur: 15, delay: 4, rev: false },
  { top: "19%", topM: "52%", size: 56, dur: 18, delay: 7, rev: true },
  // Close-up people bus — big, low and in front
  { top: "40%", topM: "58%", size: 300, dur: 26, delay: 2, rev: false, bus: true },
  // Far-away transit bus — small, high up, drifting slowly in the distance
  { top: "6%", topM: "14%", size: 62, dur: 34, delay: 15, rev: true, bus2: true },
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
  cyber: { grad: "linear-gradient(180deg,#070A16 0%,#0C1030 46%,#160A28 100%)", skyline: "/cyber-skyline.png", neon: "/cyber-neon-logo.png", cars: "/cyber-car.png", cars2: "/cyber-car2.png", spinner: "/cyber-spinner-suv.png", bus: "/cyber-bus.png", bus2: "/cyber-bus2.png", rain: true, accent: "#22E0E0", sky: "#C77DFF" },
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

export function AmbianceScene({ theme, cfg }) {
  const [mobile, setMobile] = useState(false);
  const [anchorRef, coverBox] = useCoverAnchor(GULLY_NAT.w, GULLY_NAT.h);
  useEffect(() => {
    const mq = window.matchMedia("(max-width: 640px)");
    const on = () => setMobile(mq.matches);
    on();
    mq.addEventListener("change", on);
    return () => mq.removeEventListener("change", on);
  }, []);
  const flameFrames = (typeof localStorage !== "undefined" && localStorage.getItem("ff_flame") === "gen")
    ? TIKI_FLAME_FRAMES_GEN : TIKI_FLAME_FRAMES;
  return (
    <div ref={anchorRef} className="ff-theme-scene pointer-events-none fixed inset-0 z-0 select-none overflow-hidden" data-testid={`ambiance-scene-${theme}`}>
      <div className="absolute inset-0" style={{ background: cfg.grad }} />
      {cfg.hoard && (<>
        <img src={cfg.hoard} alt="" className="absolute inset-0 z-[1] h-full w-full object-cover opacity-90" style={{ objectPosition: "center center" }} data-testid="fantasy-hoard-bg" />
        <div className="absolute inset-0 z-[1]" style={{ background: "linear-gradient(180deg, rgba(10,7,5,0.55) 0%, rgba(10,7,5,0.12) 34%, rgba(10,7,5,0.28) 70%, rgba(8,5,3,0.72) 100%)" }} />
        <div className="absolute inset-0 z-[1]" style={{ background: "radial-gradient(ellipse at 50% 80%, rgba(230,160,60,0.30), rgba(224,86,30,0.10) 44%, transparent 72%)", mixBlendMode: "screen", animation: "ffCaveFlicker 3.4s ease-in-out infinite" }} data-testid="fantasy-firelight" />
        <img src="/fantasy-eyes.png" alt="" className="pointer-events-none absolute inset-0 z-[2] h-full w-full object-cover" style={{ objectPosition: "center center", mixBlendMode: "screen", animation: "ffEyeGlow 2.4s ease-in-out infinite" }} data-testid="fantasy-eyes" />
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
      </>)}
      {cfg.skyline && <img src={cfg.skyline} alt="" className="absolute bottom-0 left-0 w-full object-cover opacity-70" style={{ maxHeight: "52vh" }} />}
      {cfg.rain && <div className="absolute inset-0 ff-rain" />}
      {cfg.cars && CYBER_CARS.map((c, i) => (
        <div key={`car-${i}`} className={`absolute left-0 ${c.bus ? "z-[5]" : c.bus2 ? "z-[2]" : c.spinner ? "z-[4]" : "z-[3]"}`}
          style={{ top: mobile ? c.topM : c.top, willChange: "transform", backfaceVisibility: "hidden", WebkitBackfaceVisibility: "hidden", animation: `${c.rev ? "ffFlyRev" : "ffFly"} ${c.dur}s linear ${c.delay}s infinite both` }}>
          {c.bus && <span className="pointer-events-none absolute bottom-0 left-1/2 -translate-x-1/2" style={{ width: "60%", height: "42%", background: "radial-gradient(ellipse at center, rgba(34,224,224,0.7) 0%, rgba(34,224,224,0.32) 44%, rgba(34,224,224,0) 72%)", filter: "blur(5px)" }} />}
          <img src={c.bus ? cfg.bus : (c.bus2 ? cfg.bus2 : (c.spinner ? cfg.spinner : (c.rev ? cfg.cars2 : cfg.cars)))} alt="" className="relative block object-contain opacity-90"
            style={{ width: c.size, filter: c.bus ? "none" : `drop-shadow(0 0 ${c.spinner ? 12 : 8}px rgba(34,224,224,${c.spinner ? 0.65 : 0.5}))`, ...(c.bus ? { maskImage: "linear-gradient(to bottom, #000 72%, rgba(0,0,0,0.68) 90%, rgba(0,0,0,0.48) 100%)", WebkitMaskImage: "linear-gradient(to bottom, #000 72%, rgba(0,0,0,0.68) 90%, rgba(0,0,0,0.48) 100%)" } : {}) }} />
        </div>
      ))}
      {cfg.neon && (
        <div className="absolute left-1/2 top-[15%] z-[1] w-[62vw] max-w-xs -translate-x-1/2" data-testid="cyber-neon">
          <div className="absolute left-1/2 top-1/2 h-[135%] w-[135%] -translate-x-1/2 -translate-y-1/2 rounded-full" style={{ background: "radial-gradient(circle, rgba(199,125,255,0.42), rgba(34,224,224,0.18) 46%, transparent 70%)", filter: "blur(26px)", animation: "ffNeonFlash 3.4s ease-in-out infinite" }} />
          <img src={cfg.neon} alt="" className="relative w-full object-contain" style={{ animation: "ffNeonFloat 6s ease-in-out infinite" }} />
        </div>
      )}
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
        {/* tiki gecko: lightning-fast sprints along the bar floor with freezes */}
        <div className="absolute bottom-[2.5%] left-[12%] z-[3]" style={{ animation: "ffGeckoDart 16s linear infinite" }} data-testid="tiki-gecko">
          <img src="/tiki-gecko.png" alt="" className="w-10 sm:w-12" style={{ animation: "ffGeckoGait 16s linear infinite", transformOrigin: "50% 100%" }} />
        </div>
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
  );
}
