// Seasonal realm scenery (fall / winter / spring / summer): background art,
// falling sprites, gust snow, chimney smoke — plus that season's heists.
import { useState } from "react";
import { SummerBallHeist, SummerCrabHeist, SnowmanHeist, CardinalTipHeist, OwlHeist, SpringPetalHeist } from "./seasonHeists";

// Golden-hour sun path: individual shimmering glints down the water instead
// of a solid streak — narrow near the horizon, wider and fainter near shore.
const SUN_GLINTS = Array.from({ length: 9 }).map((_, i) => ({
  top: `${i * 11 + 2}%`,
  w: 40 + i * 10,
  op: 0.55 - i * 0.05,
  dur: 2.4 + (i % 3) * 0.9,
  delay: (i % 4) * 0.55,
  dx: (i % 2 ? -1 : 1) * (2 + i * 1.5),
}));

const FALLING_SPRITES = Array.from({ length: 12 }).map((_, i) => ({
  left: `${(i * 8 + 4) % 94}%`,
  size: 22 + (i % 3) * 12,
  dur: 9 + (i % 5) * 2.2,
  delay: (i % 6) * 1.6,
}));

// Spring feather-petals: each pairs a slow linear fall with its own C-arc
// swing rhythm. A third of them zig-zag tighter (narrow, quick arcs); the
// rest sweep wide and lazy. Negative delays pre-populate the sky on load.
const PETALS = Array.from({ length: 24 }).map((_, i) => {
  const tight = i % 3 === 2;
  const white = i % 4 === 1; // a sprinkle of pale petals for contrast
  return {
    left: `${(i * 37 + 6) % 94}%`,
    size: 15 + (i % 4) * 5,
    fall: 18 + (i % 5) * 3,
    swing: tight ? 2.4 + (i % 3) * 0.5 : 4.6 + (i % 4) * 0.9,
    sx: tight ? "3vw" : "7vw",
    sy: tight ? "1.4vh" : "2.8vh",
    delay: -((i * 2.9) % 20),
    swingDelay: -((i * 1.7) % 6),
    src: white ? "/petal-white.png" : "/petal-pink.png",
    op: white ? 0.75 : 0.6,
  };
});

const FLYING_BIRDS = Array.from({ length: 8 }).map((_, i) => ({
  top: `${4 + i * 5}%`,
  size: 38 + (i % 3) * 20,
  dur: 14 + (i % 5) * 3,
  delay: -(i * 3.2),
  cycle: 2.6 + (i % 3) * 0.5, // one full flap-flap-flap... then glide
  flapDelay: -(i * 0.13),
}));

// Chimney puffs: distinct light puffs pop out every ~1.6s, each rising,
// drifting and swelling on its own before fading — puff... puff... puff.
const CHIMNEY_SMOKE = Array.from({ length: 5 }).map((_, i) => ({
  size: 26 + (i % 3) * 9,
  dur: 8,
  delay: -(i * 1.6),
  drift: 16 + (i % 3) * 9, // px of sideways drift as it rises
}));

// Torch Nightfall: every painted light source in the tiki lounge art
// (lanterns, hanging lamps, candles — px in the 1264x848 canvas). When fate
// deals a card they all flare up and throw dancing firelight for a few beats.

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
    gustSnow: true, hint: "#2E77A6",
  },
  spring: {
    grad: "linear-gradient(180deg,#F3FBEF 0%,#FBEFF5 55%,#EFF7E6 100%)",
    tree: "/spring-tree.png", treeBig: true, ground: "/spring-ground2.png", decorLeft: "/spring-decor.png", decorLeftBig: true, rabbits: "/spring-rabbit.png",
    items: ["/blossom-pink.png", "/blossom-white.png", "/petal-pink.png"], falling: true, petalFeather: true, hint: "#D46A9F",
  },
  summer: {
    grad: "linear-gradient(180deg,#8FC4E8 0%,#A9D3EC 26%,#F7D9A8 40%,#FFBE7D 45%,#5FB8D9 62%,#F7E3B0 62%,#EDD49B 100%)",
    tree: "/summer-tree.png", treeH: "h-[60svh] sm:h-[92vh] z-[3]", treeOpacity: 0.92, ocean: true, decorLeft: "/summer-decor.png", decorLeftBig: true, decorLeftW: "w-[50vw] max-w-none sm:w-[46vw]", decorLeftOpacity: 0.92, decorLeftZ: "z-[3]", birds: "/summer-seagull.png",
    items: ["/summer-sun.png", "/summer-ball.png", "/summer-icecream.png"], falling: false, hint: "#E07E17", crabs: "/summer-crab.png", coconut: "/summer-coconut.png", sunHorizon: true,
  },
};

// Winter gust snow: a THICK flurry of tiny flecks carried sideways on the
// wind — each rides the same gust profile at its own height, speed and size.
const GUST_SNOW = Array.from({ length: 70 }).map((_, i) => ({
  top: `${(i * 29 + 3) % 86}%`,
  size: 1.5 + (i % 5),
  dur: 4.5 + (i % 8) * 0.9,
  delay: -((i * 1.3) % 12),
  op: 0.4 + (i % 5) * 0.13,
  dip: 6 + (i % 7) * 4, // how far it sinks (vh) while crossing
}));

export function SeasonScene({ theme, cfg, heistEpoch = 0 }) {
  // Per-visit variety: the sailboat joins its voyage at a random point (so it
  // may first appear from either side, mid-tack), and the rolling beach ball
  // picks a random shore to enter from.
  const [flair] = useState(() => ({
    sailDelay: -(Math.random() * 100),
    ballReverse: Math.random() < 0.5 ? " reverse" : "",
  }));
  return (<>
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
        {cfg.sunHorizon && (<>
          {/* golden-hour bloom in the sky around the sun */}
          <div className="absolute inset-x-0 top-0" style={{ height: "45%", background: "radial-gradient(ellipse 64vw 36vh at 34% 100%, rgba(255,190,110,0.55), rgba(255,170,90,0.2) 48%, rgba(255,170,90,0) 74%)" }} />
          {/* realistic glowing sun disc, half-dipped at the waterline — the
              sea (painted after) clips its lower limb */}
          <div className="absolute" data-testid="summer-horizon-sun" style={{ left: "34%", top: "45%", width: "min(22vw, 208px)", aspectRatio: "1 / 1", transform: "translate(-50%, -38%)", borderRadius: "9999px", background: "radial-gradient(circle, #FFFBE8 0%, #FFE9A8 34%, #FFC96B 62%, #FFA94F 82%, rgba(255,160,70,0) 100%)", boxShadow: "0 0 70px 28px rgba(255,190,110,0.55)", animation: "ffGlow 6s ease-in-out infinite" }} />
        </>)}
        <div className="absolute inset-x-0" style={{ top: "45%", height: "20%", background: "linear-gradient(180deg,#2C86C4 0%,#3CA0D4 38%,#74C6E6 80%,#BFE9F4 100%)" }} />
        <div className="ff-sea-shimmer absolute inset-x-0 overflow-hidden" style={{ top: "46%", height: "17.5%" }}>
          <div className="ff-sea-wave ff-sea-wave-a" />
          <div className="ff-sea-wave ff-sea-wave-b" />
        </div>
        {cfg.sunHorizon && (<>
          {/* warm wash on the far water + the shimmering sun-path reflection */}
          <div className="absolute inset-x-0" style={{ top: "45%", height: "8%", background: "linear-gradient(180deg, rgba(255,180,100,0.34), rgba(255,180,100,0))" }} />
          <div className="absolute" data-testid="summer-sun-path" style={{ left: "34%", top: "45.3%", width: "min(20vw, 190px)", height: "19%", transform: "translateX(-50%)" }}>
            {SUN_GLINTS.map((g, i) => (
              <span key={`glint-${i}`} className="absolute rounded-full" style={{ left: `calc(50% + ${g.dx}px)`, top: g.top, width: g.w, height: 3.5, transform: "translateX(-50%)", background: "linear-gradient(90deg, rgba(255,214,140,0) 0%, rgba(255,226,160,0.95) 50%, rgba(255,214,140,0) 100%)", opacity: g.op, filter: "blur(1.2px)", animation: `ffGlow ${g.dur}s ease-in-out ${g.delay}s infinite` }} />
            ))}
          </div>
        </>)}
        {/* tiny sailboat tacking slowly back and forth along the horizon —
            faces right on the outbound leg, flips for the return */}
        <div className="absolute left-[4%] z-[1]" style={{ top: "41.5%", animation: "ffSailVoyage 100s ease-in-out infinite", animationDelay: `${flair.sailDelay}s` }} data-testid="summer-sailboat">
          <div style={{ animation: "ffSailTack 100s step-end infinite", animationDelay: `${flair.sailDelay}s` }}>
            <img src="/summer-sailboat.png" alt="" className="w-9 opacity-85 sm:w-10" style={{ animation: "ffSailBob 4.6s ease-in-out infinite", transformOrigin: "50% 88%" }} />
          </div>
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
          {CHIMNEY_SMOKE.map((s, i) => (
            <span key={`smoke-${i}`} className="ff-chimney-smoke" style={{ left: cfg.chimney.left, top: cfg.chimney.top, width: s.size, height: s.size, marginTop: -s.size, "--drift": `${s.drift}px`, animationDuration: `${s.dur}s`, animationDelay: `${s.delay}s` }} />
          ))}
          {cfg.snowmanArm && (
            <div className="absolute w-[6%]" style={{ left: "11.5%", top: "61.5%", animation: "ffSnowmanWave 34s linear infinite", transformOrigin: "92% 92%" }} data-testid="winter-snowman-arm">
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
        {/* two tiny cottontails, three photo frames each: legs gathered on
            the ground, stretched mid-hop, and standing UPRIGHT for mid-pause
            look-arounds and turns (the mirror flip hides behind the
            camera-facing pose, so turning reads as sit-up-spin-drop) */}
        <div className="absolute bottom-[2.5%] left-[14%] z-[3]" style={{ animation: "ffRabbitPatrol 18s linear infinite" }} data-testid="spring-rabbit-1">
          <div className="relative" style={{ animation: "ffRabbitGait 18s linear infinite", transformOrigin: "50% 100%" }}>
            <img src="/spring-rabbit-sit.png" alt="" className="w-10 opacity-95 sm:w-12" style={{ animation: "ffRabbitGround 18s linear infinite" }} />
            <img src={cfg.rabbits} alt="" className="absolute inset-0 w-10 opacity-95 sm:w-12" style={{ animation: "ffRabbitAir 18s linear infinite" }} />
            <img src="/spring-rabbit-up.png" alt="" className="absolute bottom-0 left-1/2 opacity-95" style={{ width: "30%", transform: "translateX(-50%)", animation: "ffRabbitUpright 18s linear infinite" }} />
          </div>
        </div>
        <div className="absolute bottom-[5%] right-[30%] z-[3]" style={{ animation: "ffRabbitPatrolL 20s linear infinite", animationDelay: "2.5s" }} data-testid="spring-rabbit-2">
          <div className="relative" style={{ animation: "ffRabbitGait 20s linear infinite", animationDelay: "2.5s", transformOrigin: "50% 100%" }}>
            <img src="/spring-rabbit-sit.png" alt="" className="w-8 opacity-90 sm:w-10" style={{ animation: "ffRabbitGround 20s linear infinite", animationDelay: "2.5s" }} />
            <img src={cfg.rabbits} alt="" className="absolute inset-0 w-8 opacity-90 sm:w-10" style={{ animation: "ffRabbitAir 20s linear infinite", animationDelay: "2.5s" }} />
            <img src="/spring-rabbit-up.png" alt="" className="absolute bottom-0 left-1/2 opacity-90" style={{ width: "30%", transform: "translateX(-50%)", animation: "ffRabbitUpright 20s linear infinite", animationDelay: "2.5s" }} />
          </div>
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
        <div className="absolute bottom-[4%] left-0 z-[3]" style={{ animation: `ffBallTravel 13s linear infinite${flair.ballReverse}` }} data-testid="summer-beachball">
          <div style={{ animation: "ffBallBounce 1.6s infinite" }}>
            <img src="/summer-ball.png" alt="" className="w-10 opacity-90 sm:w-12" style={{ animation: `ffBallSpin 2.2s linear infinite${flair.ballReverse}` }} />
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
      {cfg.falling && cfg.petalFeather && PETALS.map((p, i) => (
        // feather-fall petals: outer span = steady linear descent, inner
        // span = side-to-side C-arc swing, img = edge-on flutter
        <span key={`petal-${i}`} className="absolute top-0" data-testid={i === 0 ? "spring-petal" : undefined} style={{ left: p.left, animation: `ffPetalFall ${p.fall}s linear ${p.delay}s infinite` }}>
          <span className="inline-block" style={{ "--sx": p.sx, "--sy": p.sy, animation: `ffPetalSwing ${p.swing}s linear ${p.swingDelay}s infinite` }}>
            <img src={p.src} alt="" style={{ width: p.size, height: p.size, opacity: p.op, animation: `ffPetalRock ${2.8 + (i % 3)}s ease-in-out infinite` }} />
          </span>
        </span>
      ))}
      {cfg.falling && !cfg.petalFeather && FALLING_SPRITES.map((l, i) => {
        const src = cfg.items[i % cfg.items.length];
        const s = src.includes("petal") ? l.size * 0.58 : l.size; // lone petals fall smaller than whole blossoms
        return (
          <img key={`leaf-${l.left}-${l.dur}-${i}`} src={src} alt="" className="absolute top-0 opacity-40"
            style={{ left: l.left, width: s, height: s, animation: `ffLeafFall ${l.dur}s linear ${l.delay}s infinite` }} />
        );
      })}
      {cfg.gustSnow && GUST_SNOW.map((f, i) => (
        <span key={`gust-${i}`} className="ff-gust-snow" style={{ top: f.top, width: f.size, height: f.size, "--op": f.op, "--dip": `${f.dip}vh`, animationDuration: `${f.dur}s`, animationDelay: `${f.delay}s` }} />
      ))}
      {cfg.birds && FLYING_BIRDS.map((b, i) => (
        <div key={`bird-${i}`} className="absolute left-0 z-[2]" style={{ top: b.top, animation: `ffGullCruise ${b.dur}s linear ${b.delay}s infinite`, willChange: "transform", backfaceVisibility: "hidden" }}>
          {/* rises on the wingbeats, sinks into the glide, banking gently */}
          <div style={{ animation: `ffGullBob ${b.cycle}s ease-in-out ${b.flapDelay}s infinite` }}>
            <img src={cfg.birds} alt="" className="ff-gull block opacity-90 drop-shadow-sm" style={{ width: b.size, animationDuration: `${b.cycle}s`, animationDelay: `${b.flapDelay}s` }} />
          </div>
        </div>
      ))}
    </div>
    {theme === "summer" && <SummerBallHeist key={`bh-${heistEpoch}`} />}
    {theme === "summer" && <SummerCrabHeist key={`crh-${heistEpoch}`} />}
    {theme === "winter" && <SnowmanHeist key={`sh-${heistEpoch}`} />}
    {theme === "winter" && <CardinalTipHeist key={`cth-${heistEpoch}`} />}
    {theme === "fall" && <OwlHeist key={`oh-${heistEpoch}`} />}
    {theme === "spring" && <SpringPetalHeist key={`sph-${heistEpoch}`} />}
  </>);
}


