import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { useLang } from "../i18n/i18n";
import { HEISTS, recordHeistSeen } from "../lib/rituals";

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

/** Rare easter egg: the stealth saucer sneaks in and ABDUCTS the header logo.
 * First strike 20-40s after load, then again every 2.5-5 minutes (or
 * immediately on a `ff:abduct` window event, used for testing). The real logo
 * medallion is hidden while a clone rides the tractor beam up into the ship,
 * then drops back with a bounce. The patrol saucer hides during the heist. */
function SaucerAbduction({ saucer, onActive }) {
  const [run, setRun] = useState(null);
  const [phase, setPhase] = useState(0); // 1 fly-in, 2 beam on, 3 lift, 4 leave
  const witnessRef = useHeistWitness("saucer");
  useEffect(() => {
    const timers = [];
    let pending = null;
    let running = false;
    let cancelSummon = null;
    const schedule = (ms) => { clearTimeout(pending); pending = setTimeout(() => start(false), ms); };
    const start = (force) => {
      if (running) return;
      running = true;
      // Scroll the user back up to the header first — the show is up there.
      cancelSummon = summonToLogo((med) => {
        const r = med && med.getBoundingClientRect();
        if (!r || !r.width) { running = false; if (!force) schedule(30000); return; }
        const cx = r.x + r.width / 2, cy = r.y + r.height / 2;
        // Hover point: below-right of the logo so the beam angles up at it
        const sx = Math.min(cx + 170, window.innerWidth - 100);
        const sy = cy + 130;
        setRun({ cx, cy, w: r.width, sx, sy });
        onActive(true);
        timers.push(setTimeout(() => setPhase(1), 30));                                     // fly in
        timers.push(setTimeout(() => setPhase(2), 1380));                                   // beam on
        timers.push(setTimeout(() => { setPhase(3); med.style.visibility = "hidden"; startleTitle(); }, 1830)); // lift
        timers.push(setTimeout(() => setPhase(4), 3200));                                   // beam off + leave
        timers.push(setTimeout(() => {
          med.style.visibility = "";
          med.style.animation = "none";
          void med.offsetWidth; // restart the bounce on repeat strikes
          med.style.animation = "ffLogoReturn 0.55s cubic-bezier(0.34,1.56,0.64,1)";
        }, 4200));
        timers.push(setTimeout(() => {
          setRun(null); setPhase(0); onActive(false); running = false;
          witnessRef.current(true);
          schedule(150000 + Math.random() * 150000); // strikes again in 2.5-5 min
        }, 4900));
      });
    };
    schedule(20000 + Math.random() * 20000);
    const force = () => start(true);
    window.addEventListener("ff:abduct", force);
    return () => {
      clearTimeout(pending); timers.forEach(clearTimeout);
      if (cancelSummon) cancelSummon();
      window.removeEventListener("ff:abduct", force);
      // If we unmount mid-heist (theme switch), never leave the logo hidden.
      const img = document.querySelector('img[alt="Fork·Fate logo"]');
      if (img && img.parentElement) img.parentElement.style.visibility = "";
    };
  }, [onActive]);
  if (!run) return null;
  const { cx, cy, w, sx, sy } = run;
  const sw = 122;
  const beamOn = phase === 2 || phase === 3;
  // Beam cone: apex at the saucer, aimed at the logo (default cone points +y)
  const dx = cx - sx, dy = cy - sy;
  const len = Math.hypot(dx, dy) + w * 0.4;
  const ang = Math.atan2(-dx, dy) * 180 / Math.PI;
  const saucerX = phase === 0 ? window.innerWidth + 180 : phase === 4 ? -260 : sx;
  return (
    <div className="pointer-events-none fixed inset-0 z-[50] select-none overflow-hidden" data-testid="cyber-abduction">
      {/* saucer: darts in from the right, hovers, then flees left */}
      <div className="absolute left-0 top-0" style={{ transform: `translate(${saucerX - sw / 2}px, ${sy - sw * 0.23}px)`, transition: phase === 4 ? "transform 0.9s cubic-bezier(0.5,0,0.9,0.6)" : "transform 1.3s cubic-bezier(0.2,0.9,0.3,1)" }}>
        <div className="relative" style={{ width: sw, aspectRatio: "240 / 109", animation: "ffSaucerHover 2.8s ease-in-out infinite" }}>
          <img src={saucer} alt="" className="absolute inset-0 block h-full w-full object-contain" style={{ filter: "drop-shadow(0 0 9px rgba(34,224,224,0.35))" }} />
          <span className="absolute rounded-full" style={{ left: "44%", top: "22%", width: "4.5%", aspectRatio: "1", background: "radial-gradient(circle, #FF7A6E 0%, #FF2B1E 45%, rgba(255,43,30,0) 78%)", boxShadow: "0 0 6px 2px rgba(255,50,35,0.75)", animation: "ffSaucerBeacon 1.6s steps(1,end) infinite" }} />
        </div>
      </div>
      {/* tractor beam: anchored at the saucer's hover point, aimed at the logo */}
      <div className="absolute" style={{ left: sx, top: sy, width: 0, height: 0 }}>
        <div style={{ position: "absolute", left: -w * 0.9, top: 0, width: w * 1.8, height: len, transformOrigin: "50% 0%", transform: `rotate(${ang}deg)`, clipPath: "polygon(40% 0, 60% 0, 100% 100%, 0 100%)", background: "linear-gradient(180deg, rgba(34,224,224,0.55), rgba(34,224,224,0.22) 62%, rgba(34,224,224,0.06) 100%)", opacity: beamOn ? 1 : 0, transition: "opacity 0.4s ease" }} data-testid="cyber-abduction-beam" />
      </div>
      {/* logo clone: mounts over the real medallion while the beam locks on
          (invisible overlap), then rides the beam up into the ship */}
      {(phase === 2 || phase === 3) && (
        <div className="absolute left-0 top-0" style={{ transform: phase === 3 ? `translate(${sx - w / 2}px, ${sy - w / 2}px) scale(0.12) rotate(340deg)` : `translate(${cx - w / 2}px, ${cy - w / 2}px)`, opacity: phase === 3 ? 0.25 : 1, transition: "transform 1.25s cubic-bezier(0.55,0,0.8,0.5), opacity 0.5s ease 0.85s" }} data-testid="cyber-abduction-logo">
          <div className="overflow-hidden rounded-full bg-black ring-1 ring-white/25" style={{ width: w, height: w }}>
            <img src="/cyber-neon-logo.png" alt="" className="h-full w-full object-contain p-0.5" />
          </div>
        </div>
      )}
    </div>
  );
}

/** Every heist strikes the header logo. If the user has scrolled it out of
 * view (mobile, mid-list), smoothly pull the page back to the top first so
 * they never miss the show, then hand back the medallion element to measure.
 * Returns a cancel function for unmount-mid-scroll safety. */
function summonToLogo(done) {
  const img = document.querySelector('img[alt="Fork·Fate logo"]');
  const med = img && img.parentElement;
  const r = med && med.getBoundingClientRect();
  if (!r || !r.width) { done(null); return () => {}; }
  if (r.top >= 0 && r.bottom <= window.innerHeight) { done(med); return () => {}; }
  window.scrollTo({ top: 0, behavior: "smooth" });
  const t0 = Date.now();
  let settle;
  const poll = setInterval(() => {
    if (window.scrollY <= 2 || Date.now() - t0 > 2500) {
      clearInterval(poll);
      settle = setTimeout(() => done(med), 250); // settle beat before measuring
    }
  }, 90);
  return () => { clearInterval(poll); clearTimeout(settle); };
}

/** Home sections the pixie "supervises" — she only visits what's on screen
 * and darts to whatever the user touches. */
const PIXIE_SPOTS = [
  '[data-testid="ff-title"]',
  '[data-testid="zip-input"]',
  '[data-testid="use-my-location-button"]',
  '[data-testid="radius-control"]',
  '[data-testid="mode-toggle"]',
  '[data-testid="filters-toggle"]',
  '[data-testid="fate-of-day-card"]',
  '[data-testid="sort-select"]',
];

/** Shared companion engine (pixie, tiny dragon, ...): lives on the page like
 * the cyber probe — flits from section to section, hovering beside whatever's
 * on screen like it's supervising, darts straight to any section the user
 * touches, celebrates dealt fates and pouts at re-shuffles. Movement is a
 * rAF lerp chasing a target point; a particle emitter sheds glowing dust.
 * heistKind: "poof" = the fairy wand-poofs the header medallion; "breath" =
 * the dragon torches it with a jet of flame. */
function CompanionPatrol({ s1, s2, glow, dustCol = ["#FFF9D9", "#FFD36B"], heistKind = null, testid = "companion", flap = "ffPixieFlapA 0.48s linear infinite", flapBase = "ffPixieFlapB 0.48s linear infinite" }) {
  const witnessRef = useHeistWitness(heistKind === "breath" ? "breath" : "pixie");
  const wrapRef = useRef(null);   // translated flight layer
  const faceRef = useRef(null);   // scaleX facing flip
  const trailRefs = useRef([]);
  const [casting, setCasting] = useState(false);
  const [burst, setBurst] = useState(null); // {x, y, w} burst over the logo
  const [jet, setJet] = useState(null);     // {sx, sy, tx, ty} flame stream

  useEffect(() => {
    const pos = { x: -80, y: window.innerHeight * 0.45 };
    // Pixie-dust emitter: short-lived gold sparkles BURST out of her and
    // fade (no floating chains). Rhythmic pops while she hovers, extra dust
    // shaken loose while she's darting fast.
    const dust = Array.from({ length: 28 }, () => ({ x: 0, y: 0, vx: 0, vy: 0, life: 0, ttl: 1 }));
    let burstIn = 20; // frames until the next pop
    // Moods: a landed fate makes her celebrate (dust fountain by the card);
    // re-shuffling a dealt fate makes her pout (sink, turn away, no dust).
    let celebrateUntil = 0;
    let poutUntil = 0;
    let sink = 0;
    const spawn = (n) => {
      for (const p of dust) {
        if (n <= 0) break;
        if (p.life > 0) continue;
        p.x = pos.x + (Math.random() - 0.5) * 34;
        p.y = pos.y + (Math.random() - 0.5) * 26 + 6;
        p.vx = (Math.random() - 0.5) * 3.4;
        p.vy = (Math.random() - 0.35) * 2.6 + 0.4;
        p.ttl = 20 + Math.random() * 20;
        p.life = p.ttl;
        n -= 1;
      }
    };
    // `base` = the section anchor she's watching; `target` = base plus a
    // restless micro-dart offset so she flits around it like a real pixie.
    const base = { x: window.innerWidth * 0.4, y: 150, lookX: window.innerWidth * 0.5 };
    const target = { ...base };
    let currentEl = null;
    let overrideEl = null; // during the heist she locks onto the medallion
    let facing = 1;
    let curSide = 1; // which side of the section she's observing from
    let raf, dwell, heistPending, cancelSummon;
    let running = false;
    const timers = [];

    const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
    // Hover beside the section on the chosen side; if that side doesn't fit
    // (mobile-wide sections) perch above the matching corner instead.
    // lookX = the section's center — what she turns to watch.
    const anchorOf = (el, side = 1) => {
      const r = el.getBoundingClientRect();
      const lookX = r.left + r.width / 2;
      const yBeside = clamp(r.top + r.height * 0.25, 74, window.innerHeight - 64);
      if (side === 1 && r.right + 26 <= window.innerWidth - 46) return { x: r.right + 26, y: yBeside, lookX };
      if (side === -1 && r.left - 26 >= 44) return { x: r.left - 26, y: yBeside, lookX };
      const ax = side === -1 ? r.left + 24 : r.right - 34;
      return { x: clamp(ax, 44, window.innerWidth - 46), y: clamp(r.top - 36, 74, window.innerHeight - 64), lookX };
    };
    const visible = (el) => {
      const r = el.getBoundingClientRect();
      return r.width > 0 && r.bottom > 90 && r.top < window.innerHeight - 80;
    };
    // Breath heist: he flies up LEVEL with the medallion — hovering beside
    // it, facing it — so the flame streams straight across from his mouth
    // into its heart. Mouth offset measured from the sprite art (100px box).
    const MOUTH_DX = 33, MOUTH_DY = 7;
    const heistAnchorOf = (el) => {
      if (heistKind !== "breath") return anchorOf(el);
      const r = el.getBoundingClientRect();
      const lookX = r.left + r.width / 2;
      const y = clamp(r.top + r.height / 2 - MOUTH_DY, 40, window.innerHeight - 64);
      if (r.right + 64 <= window.innerWidth - 40) return { x: r.right + 64, y, lookX };
      return { x: Math.max(44, r.left - 64), y, lookX };
    };
    // Nothing watchable on screen (user scrolled deep)? Free-roam: flit
    // about the middle of wherever they are instead of parking at the top.
    const roam = () => {
      currentEl = null;
      base.x = window.innerWidth * (0.15 + Math.random() * 0.7);
      base.y = window.innerHeight * (0.25 + Math.random() * 0.45);
      base.lookX = base.x + (Math.random() > 0.5 ? 120 : -120);
    };
    const pickSpot = () => {
      const els = PIXIE_SPOTS.map((s) => document.querySelector(s)).filter((el) => el && visible(el) && el !== currentEl);
      if (els.length) {
        currentEl = els[Math.floor(Math.random() * els.length)];
        curSide = Math.random() > 0.5 ? 1 : -1; // fresh side each visit
        Object.assign(base, anchorOf(currentEl, curSide));
      } else {
        roam();
      }
    };

    // Track the watched section as the page scrolls; re-pick the moment it
    // leaves the screen. While roaming, the wander cadence handles re-picks.
    const anchorTick = setInterval(() => {
      const el = overrideEl || currentEl;
      if (el && document.contains(el) && visible(el)) Object.assign(base, overrideEl ? heistAnchorOf(el) : anchorOf(el, curSide));
      else if (!running && el) pickSpot();
    }, 350);

    // Micro-darts + cross-swoops: near her spot she flits in quick hops, and
    // sometimes swings clear across to observe from the OPPOSITE side.
    // Mid-flight she heads straight for the anchor.
    let jitter;
    const dart = () => {
      const d = Math.hypot(base.x - pos.x, base.y - pos.y);
      if (running) {
        // Heist run: fly dead straight to the strike perch, no playful hops,
        // so the flame lines up level with the medallion.
        target.x = base.x; target.y = base.y;
      } else if (Date.now() < poutUntil) {
        // Sulking: no playful hops, she just sits there.
        target.x = base.x; target.y = base.y;
      } else if (d < 80) {
        if (currentEl && !running && Math.random() < 0.22) {
          curSide = -curSide;
          Object.assign(base, anchorOf(currentEl, curSide));
          target.x = base.x; target.y = base.y;
        } else {
          target.x = base.x + (Math.random() - 0.5) * 46;
          target.y = base.y + (Math.random() - 0.5) * 34;
        }
      } else {
        target.x = base.x; target.y = base.y;
      }
      target.lookX = base.lookX;
      jitter = setTimeout(dart, 650 + Math.random() * 750);
    };
    dart();

    const wander = () => {
      if (!running) {
        // Mischief dash: sometimes she tears off to a random spot first.
        if (Math.random() < 0.25) {
          roam();
          dwell = setTimeout(wander, 1500 + Math.random() * 900);
          return;
        }
        pickSpot();
      }
      dwell = setTimeout(wander, 6500 + Math.random() * 4500);
    };
    dwell = setTimeout(wander, 1200);

    // She watches what YOU do: darts to whatever section you touch.
    const onTouch = (e) => {
      if (running || !(e.target instanceof Element)) return;
      const hit = e.target.closest(PIXIE_SPOTS.join(","));
      if (!hit) return;
      currentEl = hit;
      Object.assign(base, anchorOf(hit));
      clearTimeout(dwell);
      dwell = setTimeout(wander, 7500);
    };
    document.addEventListener("pointerdown", onTouch, true);
    document.addEventListener("focusin", onTouch, true);

    // Fate dealt: she zips over beside the revealed card and fountains dust.
    const onDealt = () => {
      if (running) return;
      celebrateUntil = Date.now() + 2600;
      poutUntil = 0;
      currentEl = null;
      base.x = clamp(window.innerWidth * 0.5 + Math.min(150, window.innerWidth * 0.28), 44, window.innerWidth - 46);
      base.y = window.innerHeight * 0.3;
      base.lookX = window.innerWidth * 0.5;
      spawn(10);
      clearTimeout(dwell);
      dwell = setTimeout(wander, 5200);
    };
    // Fate rejected (re-shuffle): she pouts — sinks, turns away, no dust.
    const onReshuffle = () => {
      if (running) return;
      poutUntil = Date.now() + 3200;
      celebrateUntil = 0;
      clearTimeout(dwell);
      dwell = setTimeout(wander, 3600);
    };
    window.addEventListener("ff:fate-dealt", onDealt);
    window.addEventListener("ff:reshuffle", onReshuffle);

    // Flight loop: quick darty lerp to the target, wake lerps after her.
    // Facing follows her REAL velocity — if she's moving she faces that way
    // (no backwards flying); only once she truly settles does she turn to
    // LOOK AT what she's watching (lookX) — never off-screen.
    const step = () => {
      const prevX = pos.x;
      pos.x += (target.x - pos.x) * 0.13;
      pos.y += (target.y - pos.y) * 0.13;
      const vx = pos.x - prevX;
      const now = Date.now();
      const pouting = now < poutUntil;
      let f = facing;
      if (Math.abs(vx) > 0.9) f = vx > 0 ? 1 : -1;
      else if (target.lookX != null && Math.abs(target.lookX - pos.x) > 8) {
        // Pouting = she turns her BACK on the whole affair.
        f = (target.lookX > pos.x ? 1 : -1) * (pouting ? -1 : 1);
      }
      if (f !== facing) { facing = f; if (faceRef.current) faceRef.current.style.transform = `scaleX(${f})`; }
      sink += ((pouting ? 30 : 0) - sink) * 0.08; // sulky slump down
      if (wrapRef.current) wrapRef.current.style.transform = `translate(${pos.x - 50}px, ${pos.y - 50 + sink}px)`;
      // Emit: a pop of 5 every ~0.5-0.9s, loose dust while flying fast, a
      // full fountain while celebrating — and nothing at all while sulking.
      const speed = Math.hypot(target.x - pos.x, target.y - pos.y) * 0.13;
      if (!pouting) {
        if (--burstIn <= 0) { spawn(5); burstIn = 30 + Math.random() * 24; }
        if (speed > 3) spawn(1);
        if (now < celebrateUntil) spawn(2);
      }
      dust.forEach((p, i) => {
        const el = trailRefs.current[i];
        if (!el) return;
        if (p.life <= 0) { el.style.opacity = "0"; return; }
        p.life -= 1;
        p.x += p.vx;
        p.y += p.vy;
        el.style.transform = `translate(${p.x}px, ${p.y}px)`;
        el.style.opacity = String(Math.min(1, (p.life / p.ttl) * 1.4).toFixed(2));
      });
      raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);

    // ---- Medallion heist: fly up, then poof it (wand) or torch it (fire) ----
    const scheduleHeist = (ms) => { clearTimeout(heistPending); heistPending = setTimeout(() => heist(false), ms); };
    const heist = (force) => {
      if (running) return;
      running = true;
      cancelSummon = summonToLogo((med) => {
        const r = med && med.getBoundingClientRect();
        if (!r || !r.width) { running = false; if (!force) scheduleHeist(30000); return; }
        overrideEl = med;
        Object.assign(base, heistAnchorOf(med));
        timers.push(setTimeout(() => {           // a beat to fly up there
          const r2 = med.getBoundingClientRect();
          setCasting(true);
          setBurst({ x: r2.x, y: r2.y, w: r2.width });
          if (heistKind === "breath") {
            // Flame jet from the dragon's MOUTH, streaming horizontally
            // across into the medallion's heart (he hovers level with it).
            const c2x = r2.x + r2.width / 2, c2y = r2.y + r2.height / 2;
            const dir = c2x > pos.x ? 1 : -1; // the way he's facing
            setJet({ sx: pos.x + dir * MOUTH_DX, sy: pos.y + MOUTH_DY, tx: c2x, ty: c2y });
            timers.push(setTimeout(() => setJet(null), 1400));
          } else if (localStorage.getItem("ff_muted") !== "1") {
            try { const g = new Audio("/fairy-laugh.mp3"); g.volume = 0.35; g.play().catch(() => {}); } catch {}
          }
          timers.push(setTimeout(() => { med.style.visibility = "hidden"; startleTitle(); }, 420));
          timers.push(setTimeout(() => setCasting(false), 1200));
          timers.push(setTimeout(() => {
            const r3 = med.getBoundingClientRect();
            setBurst({ x: r3.x, y: r3.y, w: r3.width });
            med.style.visibility = "";
            med.style.animation = "none";
            void med.offsetWidth; // restart the pop on repeat strikes
            med.style.animation = "ffLogoReturn 0.55s cubic-bezier(0.34,1.56,0.64,1)";
          }, 2600));
          timers.push(setTimeout(() => {
            setBurst(null); overrideEl = null; running = false;
            witnessRef.current(true);
            pickSpot();
            scheduleHeist(150000 + Math.random() * 150000); // again in 2.5-5 min
          }, 3500));
        }, 1900));
      });
    };
    if (heistKind) scheduleHeist(45000 + Math.random() * 30000);
    const heistEvent = heistKind === "breath" ? "ff:breath-heist" : "ff:pixie-heist";
    const force = () => { if (heistKind) heist(true); };
    window.addEventListener(heistEvent, force);

    return () => {
      cancelAnimationFrame(raf); clearTimeout(dwell); clearTimeout(jitter); clearInterval(anchorTick);
      clearTimeout(heistPending); timers.forEach(clearTimeout);
      if (cancelSummon) cancelSummon();
      document.removeEventListener("pointerdown", onTouch, true);
      document.removeEventListener("focusin", onTouch, true);
      window.removeEventListener("ff:fate-dealt", onDealt);
      window.removeEventListener("ff:reshuffle", onReshuffle);
      window.removeEventListener(heistEvent, force);
      // Never leave the logo hidden if we unmount mid-poof (theme switch).
      const img = document.querySelector('img[alt="Fork·Fate logo"]');
      if (img && img.parentElement) img.parentElement.style.visibility = "";
    };
  }, []); // witnessRef is a stable ref

  return (
    <div className="pointer-events-none fixed inset-0 z-[45] select-none overflow-hidden" data-testid={`${testid}-layer`}>
      {Array.from({ length: 28 }, (_, i) => (
        <span
          key={`pxd-${i}`}
          ref={(el) => { trailRefs.current[i] = el; }}
          className="absolute left-0 top-0 rounded-full"
          style={{ opacity: 0, width: 3 + (i % 4), height: 3 + (i % 4), background: `radial-gradient(circle, ${dustCol[0]}, ${dustCol[1]} 55%, transparent 80%)`, boxShadow: `0 0 5px ${dustCol[1]}` }}
        />
      ))}
      <div ref={wrapRef} className="absolute left-0 top-0" data-testid={testid}>
        <div ref={faceRef}>
          <div className="relative" style={{ width: 100, height: 100, animation: "ffPixieBob 2.4s ease-in-out infinite", filter: `drop-shadow(0 0 7px ${glow})` }}>
            <img src={s1} alt="" className="absolute inset-0 h-full w-full object-contain" style={{ animation: flapBase }} />
            <img src={s2} alt="" className="absolute inset-0 h-full w-full object-contain opacity-0" style={{ animation: flap }} />
            {casting && heistKind === "poof" && (
              <span className="absolute rounded-full" style={{ left: 78, top: 28, width: 18, height: 18, background: "radial-gradient(circle, #FFF9D9, #FFD36B 55%, transparent 78%)", boxShadow: "0 0 10px #FFD36B, 0 0 22px rgba(255,211,107,0.7)", animation: "ffWandStar 1.15s ease-out forwards" }} data-testid="pixie-wand-star" />
            )}
          </div>
        </div>
      </div>
      {jet && (
        <div className="absolute left-0 top-0" data-testid="dragon-flame-jet">
          {Array.from({ length: 14 }, (_, i) => {
            const spread = (i % 5 - 2) * 7;
            return (
              <span
                key={`jet-${i}`}
                className="absolute rounded-full"
                style={{
                  left: jet.sx, top: jet.sy,
                  width: 7 + (i % 3) * 4, height: 7 + (i % 3) * 4,
                  "--dx": `${jet.tx - jet.sx + spread}px`,
                  "--dy": `${jet.ty - jet.sy + (i % 4 - 1.5) * 6}px`,
                  background: i % 3 === 0
                    ? "radial-gradient(circle, #FFFFFF, #FFD36B 55%, transparent 80%)"
                    : i % 3 === 1
                      ? "radial-gradient(circle, #FFE9B0, #FF8C3A 55%, transparent 80%)"
                      : "radial-gradient(circle, #FF8C3A, #E01E26 60%, transparent 82%)",
                  boxShadow: "0 0 8px rgba(255,140,58,0.9)",
                  animation: `ffFlameJet 0.5s ease-in ${(i * 0.055).toFixed(2)}s both`,
                }}
              />
            );
          })}
        </div>
      )}
      {burst && (
        <div className="absolute" style={{ left: burst.x, top: burst.y, width: burst.w, height: burst.w }} data-testid={heistKind === "breath" ? "dragon-scorch-burst" : "pixie-poof-burst"}>
          {Array.from({ length: 10 }, (_, i) => {
            const a = (i / 10) * Math.PI * 2;
            const d = burst.w * (0.55 + (i % 3) * 0.2);
            const cols = heistKind === "breath"
              ? (i % 2 ? "radial-gradient(circle, #FFFFFF, #FF8C3A 60%, transparent 82%)" : "radial-gradient(circle, #FFE9B0, #E01E26 60%, transparent 82%)")
              : (i % 2 ? "radial-gradient(circle, #FFFFFF, #8FF0B0 60%, transparent 82%)" : "radial-gradient(circle, #FFF9D9, #FFD36B 60%, transparent 82%)");
            return (
              <span
                key={`poof-${i}`}
                className="absolute left-1/2 top-1/2 rounded-full"
                style={{ width: 5 + (i % 3) * 2, height: 5 + (i % 3) * 2, "--dx": `${Math.cos(a) * d}px`, "--dy": `${Math.sin(a) * d}px`, background: cols, boxShadow: heistKind === "breath" ? "0 0 6px rgba(255,160,80,0.85)" : "0 0 6px rgba(255,244,200,0.8)", animation: "ffPoofSparkle 0.95s ease-out forwards" }}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}

/** First-time heist sightings earn a toast pointing at the Collection. */
function useHeistWitness(key) {
  const { t } = useLang();
  const navigate = useNavigate();
  const ref = useRef(null);
  ref.current = (announce) => {
    const first = recordHeistSeen(key);
    if (!first || !announce) return first;
    const heist = HEISTS.find((h) => h.key === key);
    toast(t("Heist witnessed!"), {
      description: heist ? t(heist.name) : undefined,
      action: { label: t("Collection"), onClick: () => navigate("/rituals") },
      duration: 6000,
    });
    return first;
  };
  return ref;
}

/** The Fork·Fate title does a startled little hop when its medallion is
 * stolen by any of the realm heists. */
function startleTitle() {
  const el = document.querySelector('[data-testid="ff-title"]');
  if (!el) return;
  el.style.animation = "none";
  void el.offsetWidth; // restart on repeat strikes
  el.style.animation = "ffTitleStartle 0.7s cubic-bezier(0.3,1.5,0.5,1)";
}

/** Shared "grab the header logo from below" easter egg: a themed grabber
 * (dragon claw, skeletal hands) rises from the bottom of the screen, clamps
 * around the logo medallion and drags it down; the logo bounces back a beat
 * later. First strike 25-45s after load, then every 2.5-5 minutes (or
 * immediately on a `ff:heist` window event, used for testing).
 * Geometry: `gripX/gripY` are the grip point as fractions of the sprite box,
 * `widthMult` scales the sprite relative to the medallion, `aspect` = natural
 * height/width of the sprite art. */
function LogoHeist({ sprite, aspect, gripX, gripY, widthMult, cloneSrc, shadow, testid, heistKey, cloneScale = 1 }) {
  const [run, setRun] = useState(null);
  const [phase, setPhase] = useState(0); // 1 rise, 2 clamp, 3 yank down
  const witnessRef = useHeistWitness(heistKey);
  useEffect(() => {
    const timers = [];
    let pending = null;
    let running = false;
    let cancelSummon = null;
    const schedule = (ms) => { clearTimeout(pending); pending = setTimeout(() => start(false), ms); };
    const start = (force) => {
      if (running) return;
      running = true;
      // Scroll the user back up to the header first — the show is up there.
      cancelSummon = summonToLogo((med) => {
        const r = med && med.getBoundingClientRect();
        if (!r || !r.width) { running = false; if (!force) schedule(30000); return; }
        setRun({ cx: r.x + r.width / 2, cy: r.y + r.height / 2, w: r.width });
        timers.push(setTimeout(() => setPhase(1), 30));                                          // rise up to the logo
        timers.push(setTimeout(() => { setPhase(2); med.style.visibility = "hidden"; startleTitle(); }, 1180)); // clamp shut on it
        timers.push(setTimeout(() => setPhase(3), 1800));                                        // yank it down below
        timers.push(setTimeout(() => {
          med.style.visibility = "";
          med.style.animation = "none";
          void med.offsetWidth; // restart the bounce on repeat strikes
          med.style.animation = "ffLogoReturnUp 0.55s cubic-bezier(0.34,1.56,0.64,1)";
        }, 2950));
        timers.push(setTimeout(() => {
          setRun(null); setPhase(0); running = false;
          witnessRef.current(true);
          schedule(150000 + Math.random() * 150000); // strikes again in 2.5-5 min
        }, 3650));
      });
    };
    schedule(25000 + Math.random() * 20000);
    const force = () => start(true);
    window.addEventListener("ff:heist", force);
    return () => {
      clearTimeout(pending); timers.forEach(clearTimeout);
      if (cancelSummon) cancelSummon();
      window.removeEventListener("ff:heist", force);
      // If we unmount mid-heist (theme switch), never leave the logo hidden.
      const img = document.querySelector('img[alt="Fork·Fate logo"]');
      if (img && img.parentElement) img.parentElement.style.visibility = "";
    };
  }, []);
  if (!run) return null;
  const { cx, cy, w } = run;
  const boxW = w * widthMult;
  const boxH = boxW * aspect;
  const left = cx - boxW * gripX;
  const gripTop = cy - boxH * gripY;
  const y = phase === 0 ? window.innerHeight + 60 : phase === 3 ? window.innerHeight + boxH : gripTop;
  return (
    <div className="pointer-events-none fixed inset-0 z-[50] select-none overflow-hidden" data-testid={testid}>
      <div
        className="absolute left-0 top-0"
        style={{
          transform: `translate(${left}px, ${y}px)`,
          transition: phase === 3 ? "transform 0.7s cubic-bezier(0.6,0,0.9,0.55)" : "transform 1.1s cubic-bezier(0.2,0.85,0.3,1)",
        }}
      >
        <div className="relative" style={{ width: boxW, height: boxH, animation: phase === 2 ? "ffClawClench 0.5s ease-in-out" : undefined }}>
          {/* the stolen medallion: mounts in the grip the instant the grabber clamps */}
          {(phase === 2 || phase === 3) && (
            <div
              className="absolute overflow-hidden bg-black ring-1 ring-white/25"
              style={{ left: boxW * gripX - (w * cloneScale) / 2, top: boxH * gripY - (w * cloneScale) / 2, width: w * cloneScale, height: w * cloneScale, borderRadius: "9999px" }}
              data-testid={`${testid}-logo`}
            >
              <img src={cloneSrc} alt="" className="h-full w-full scale-110 object-contain" style={{ borderRadius: "9999px" }} />
            </div>
          )}
          <img src={sprite} alt="" className="absolute inset-0 h-full w-full object-contain" style={{ filter: shadow }} />
        </div>
      </div>
    </div>
  );
}

/** Dragon's Hoard heist: a scaled dragon claw snatches the medallion.
 * Claw art is 571x718 (red/gold, regenerated) with the circular grip void
 * centered at (50.5%, 43.4%), void ~44% of the art width. */
function DragonHeist() {
  return (
    <LogoHeist
      sprite="/dragon-claw2.png"
      aspect={718 / 571}
      gripX={0.505}
      gripY={0.434}
      widthMult={2.4}
      cloneScale={1.25}
      cloneSrc="/logo-ouroboros.png"
      shadow="drop-shadow(0 8px 16px rgba(0,0,0,0.6))"
      testid="dragon-heist"
      heistKey="dragon"
    />
  );
}

/** Reaper heist: two skeletal hands rise from the grave, clutch the medallion
 * and drag it under. Hands art is 848x1264, clutch centered at (50%, 65%). */
export function ReaperHeist() {
  return (
    <LogoHeist
      sprite="/skeleton-hands.png"
      aspect={1264 / 848}
      gripX={0.5}
      gripY={0.65}
      widthMult={2.55}
      cloneSrc="/logo-mark.png"
      shadow="drop-shadow(0 0 12px rgba(224,30,38,0.35)) drop-shadow(0 8px 16px rgba(0,0,0,0.7))"
      testid="reaper-heist"
      heistKey="grave"
    />
  );
}

export function AmbianceScene({ theme, cfg }) {
  const [mobile, setMobile] = useState(false);
  const [abducting, setAbducting] = useState(false);
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
    {cfg.saucer && <SaucerAbduction saucer={cfg.saucer} onActive={setAbducting} />}
    {cfg.gully && <CompanionPatrol s1="/fairy-pixie-1.png" s2="/fairy-pixie-2.png" glow="rgba(94,224,168,0.7)" heistKind="poof" testid="fairy-pixie" />}
    {theme === "fantasy" && <CompanionPatrol s1="/dragon-tiny-1.png" s2="/dragon-tiny-2.png" glow="rgba(255,140,50,0.7)" dustCol={["#FFE9B0", "#FF8C3A"]} heistKind="breath" testid="tiny-dragon" flap="ffDragonFlap 3.4s linear infinite" flapBase="ffDragonFlapInv 3.4s linear infinite" />}
    {theme === "fantasy" && <DragonHeist />}
  </>);
}
