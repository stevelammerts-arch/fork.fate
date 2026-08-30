// Seasonal-realm logo heists: beach ball, crab, snowman, owl, petal gust,
// cardinal tip. Each strikes the header medallion via the shared heist lib.
import { useState, useEffect } from "react";
import { summonToLogo, startleTitle, useHeistWitness, preloadHeistAudio, playHeistSound } from "./heistLib";

/** Summer heist #1: a runaway beach ball arcs in spinning — usually punted up
 * from the LEFT edge but ~40% of the time from the RIGHT, at a slightly
 * different height every strike — BONKS the header medallion clean off its
 * perch (the logo tumbles away), then squats in the logo's spot for a beat
 * acting innocent before rolling off the far side — and the logo bounces
 * back. First strike 25-45s after load, then every 2.5-5 min (or instantly
 * on a `ff:ball-heist` window event, used for testing). */
export function SummerBallHeist() {
  const witnessRef = useHeistWitness("ball");
  const [run, setRun] = useState(null);   // {cx, cy, w}
  const [phase, setPhase] = useState(0);  // 0 offscreen, 1 flight, 2 sits in the spot, 3 rolls off
  const [knock, setKnock] = useState(false); // the bonked-away medallion clone
  useEffect(() => {
    const timers = [];
    let pending = null;
    let running = false;
    let cancelSummon = null;
    const schedule = (ms) => { clearTimeout(pending); pending = setTimeout(() => start(false), ms); };
    const start = (force) => {
      if (running) return;
      running = true;
      cancelSummon = summonToLogo((med) => {
        const r = med && med.getBoundingClientRect();
        if (!r || !r.width) { running = false; if (!force) schedule(30000); return; }
        setRun({
          cx: r.x + r.width / 2, cy: r.y + r.height / 2, w: r.width,
          // Keep it unpredictable: ~40% of strikes punt in from the RIGHT
          // edge instead, and the launch height varies a little every time.
          side: Math.random() < 0.4 ? "right" : "left",
          // ...and half the time it rebounds BACK the way it came
          back: Math.random() < 0.5,
          dip: 260 + Math.random() * 160,
        });
        timers.push(setTimeout(() => setPhase(1), 30));   // incoming!
        timers.push(setTimeout(() => {                     // BONK
          setPhase(2); setKnock(true);
          med.style.visibility = "hidden"; startleTitle();
        }, 900));
        timers.push(setTimeout(() => setKnock(false), 1850));
        timers.push(setTimeout(() => setPhase(3), 2300));  // rolls off
        timers.push(setTimeout(() => {
          med.style.visibility = "";
          med.style.animation = "none";
          void med.offsetWidth; // restart the pop on repeat strikes
          med.style.animation = "ffLogoReturn 0.55s cubic-bezier(0.34,1.56,0.64,1)";
        }, 2600));
        timers.push(setTimeout(() => {
          setRun(null); setPhase(0); running = false;
          witnessRef.current(true);
          schedule(150000 + Math.random() * 150000); // again in 2.5-5 min
        }, 3400));
      });
    };
    schedule(25000 + Math.random() * 20000);
    const force = () => start(true);
    window.addEventListener("ff:ball-heist", force);
    return () => {
      clearTimeout(pending); timers.forEach(clearTimeout);
      if (cancelSummon) cancelSummon();
      window.removeEventListener("ff:ball-heist", force);
      // Never leave the logo hidden if we unmount mid-heist (theme switch).
      const img = document.querySelector('img[alt="Fork·Fate logo"]');
      if (img && img.parentElement) img.parentElement.style.visibility = "";
    };
  }, []); // witnessRef is a stable ref
  if (!run) return null;
  const { cx, cy, w, side, back, dip } = run;
  const ballW = w * 1.42; // ball art has padding — this renders it medallion-sized
  // punted up from low off a random edge; exits bouncing away down the far
  // side — or rebounds back off the side it came from
  const fromLeft = side !== "right";
  const exitRight = back ? !fromLeft : fromLeft;
  const sx = fromLeft ? -ballW - 40 : window.innerWidth + ballW + 40;
  const sy = cy + Math.min(dip, window.innerHeight * 0.42);
  const exitX = exitRight ? cx + window.innerWidth * 0.35 : cx - window.innerWidth * 0.35;
  const x = phase === 0 ? sx : phase === 3 ? exitX : cx;
  const y = phase === 0 ? sy : phase === 3 ? window.innerHeight + ballW : cy;
  const trans = phase === 1 ? "transform 0.87s cubic-bezier(0.3,0,0.68,1)" : phase === 3 ? "transform 0.85s cubic-bezier(0.5,0.05,0.85,0.5)" : "none";
  return (
    <div className="pointer-events-none fixed inset-0 z-[50] select-none overflow-hidden" data-testid="ball-heist">
      {/* the bonked medallion tumbling away */}
      {knock && (
        <div className="absolute overflow-hidden bg-[#F5F0E6] ring-1 ring-[#E4E4E7]" style={{ left: cx - w / 2, top: cy - w / 2, width: w, height: w, borderRadius: "9999px", animation: "ffLogoKnock 0.9s cubic-bezier(0.25,0.8,0.5,1) forwards" }} data-testid="ball-heist-logo">
          <img src="/logo-mark-light.png" alt="" className="h-full w-full scale-110 object-contain" style={{ borderRadius: "9999px" }} />
        </div>
      )}
      <div className="absolute left-0 top-0" style={{ transform: `translate(${x - ballW / 2}px, ${y - ballW / 2}px)`, transition: trans }}>
        <img
          src="/summer-ball.png"
          alt=""
          className="block object-contain"
          style={{
            width: ballW, height: ballW,
            filter: "drop-shadow(0 4px 10px rgba(0,0,0,0.3))",
            animation: phase === 2 ? "ffBallSettle 0.6s ease-out" : phase === 3 ? `ffBallHeistSpin 0.7s linear infinite${exitRight ? "" : " reverse"}` : phase === 1 ? `ffBallHeistSpin 0.7s linear infinite${fromLeft ? "" : " reverse"}` : undefined,
          }}
        />
      </div>
    </div>
  );
}

/** Summer heist #3 — MINE! MINE! MINE!: five curious seagull heads pop out
 * one at a time around the medallion's rim (squawking their "mine!" claim),
 * then duck away as a gull swoops off with the whole medallion in its feet.
 * First strike ~2-3 min after load (staggered clear of the ball + crab),
 * then every 3-6 min (`ff:gull-heist` forces it, used for testing). */
export function SummerGullHeist() {
  const witnessRef = useHeistWitness("gulls");
  useEffect(() => { preloadHeistAudio(["/gull-mine.mp3"]); }, []);
  const [run, setRun] = useState(null);     // {cx, cy, w}
  const [heads, setHeads] = useState(0);    // how many heads are out (0-5)
  const [stage, setStage] = useState(null); // "heads" | "retract" | "fly"
  useEffect(() => {
    const timers = [];
    let pending = null;
    let running = false;
    let cancelSummon = null;
    const schedule = (ms) => { clearTimeout(pending); pending = setTimeout(() => start(false), ms); };
    const start = (force) => {
      if (running) return;
      running = true;
      cancelSummon = summonToLogo((med) => {
        const r = med && med.getBoundingClientRect();
        if (!r || !r.width) { running = false; if (!force) schedule(30000); return; }
        setRun({ cx: r.x + r.width / 2, cy: r.y + r.height / 2, w: r.width });
        setStage("heads");
        playHeistSound("/gull-mine.mp3", 0.6);              // "mine! mine! mine!"
        [0, 1, 2, 3, 4].forEach((i) => {                    // heads pop out one at a time
          timers.push(setTimeout(() => setHeads(i + 1), 60 + i * 920));
        });
        timers.push(setTimeout(() => setStage("retract"), 5150)); // heads duck away...
        timers.push(setTimeout(() => {                       // ...and a gull makes off with the medallion
          setStage("fly");
          med.style.visibility = "hidden"; startleTitle();
        }, 5550));
        timers.push(setTimeout(() => {
          med.style.visibility = "";
          med.style.animation = "none";
          void med.offsetWidth; // the medallion bounces back home
          med.style.animation = "ffLogoReturn 0.55s cubic-bezier(0.34,1.56,0.64,1)";
        }, 7400));
        timers.push(setTimeout(() => {
          setRun(null); setStage(null); setHeads(0); running = false;
          witnessRef.current(true);
          schedule(180000 + Math.random() * 180000); // again in 3-6 min
        }, 8200));
      });
    };
    schedule(130000 + Math.random() * 50000);
    const force = () => start(true);
    window.addEventListener("ff:gull-heist", force);
    return () => {
      clearTimeout(pending); timers.forEach(clearTimeout);
      if (cancelSummon) cancelSummon();
      window.removeEventListener("ff:gull-heist", force);
      // Never leave the logo hidden if we unmount mid-heist (theme switch).
      const img = document.querySelector('img[alt="Fork·Fate logo"]');
      if (img && img.parentElement) img.parentElement.style.visibility = "";
    };
  }, []); // witnessRef is a stable ref
  if (!run || !stage) return null;
  const { cx, cy, w } = run;
  // five heads ringing the medallion — each neck is planted ON the logo rim
  // and the head radiates outward (rotated along its spoke), so they read as
  // popping out from BEHIND the medallion
  const SPOTS = [
    { a: -90, tilt: -8 },   // straight up
    { a: -30, tilt: 10 },   // upper right
    { a: -150, tilt: -10 }, // upper left
    { a: 15, tilt: 8 },     // right side
    { a: 165, tilt: -9 },   // left side
  ];
  const headW = w * 0.4;              // small — the medallion stays the star
  const headH = headW * (236 / 240);  // art is 240x236
  const gullW = w * 2.3;
  return (
    <div className="pointer-events-none fixed inset-0 z-[50] select-none overflow-hidden" data-testid="gull-heist">
      {/* the rim gang: quizzical heads popping out one at a time */}
      {stage !== "fly" && SPOTS.map((s, i) => {
        if (i >= heads) return null;
        const rad = (s.a * Math.PI) / 180;
        // neck base sits just inside the rim; the head grows outward from it
        const nx = cx + Math.cos(rad) * w * 0.46;
        const ny = cy + Math.sin(rad) * w * 0.46;
        return (
          <div key={`gh-${i}`} className="absolute" data-testid={`gull-head-${i}`} style={{
            left: nx - headW / 2, top: ny - headH, width: headW,
            transformOrigin: "50% 100%",
            "--gx": `${-Math.cos(rad) * w * 0.34}px`, "--gy": `${-Math.sin(rad) * w * 0.34}px`, "--gr": `${s.a + 90}deg`,
            animation: stage === "retract" ? "ffGullRetreat 0.35s ease-in forwards" : "ffGullPeek 0.55s cubic-bezier(0.34,1.56,0.64,1) forwards",
          }}>
            <img src="/summer-gull-head.png" alt="" className="w-full object-contain" style={{ filter: "drop-shadow(0 3px 6px rgba(0,0,0,0.3))", animation: `ffGullTilt ${1.3 + (i % 3) * 0.35}s ease-in-out ${i * 0.2}s infinite`, transformOrigin: "50% 85%", "--tl": `${s.tilt}deg` }} />
          </div>
        );
      })}
      {/* the getaway: a gull flaps off with the medallion in its feet */}
      {stage === "fly" && (
        <div className="absolute" data-testid="gull-heist-getaway" style={{
          left: cx, top: cy,
          animation: "ffGullCarryOff 1.9s cubic-bezier(0.5,0.05,0.75,0.45) forwards",
        }}>
          <div style={{ animation: "ffGullCarryBob 0.7s ease-in-out infinite" }}>
            <div className="relative" style={{ width: gullW, aspectRatio: "305 / 243", marginLeft: -gullW * 0.5, marginTop: -gullW * 0.72 }}>
              <img src="/summer-gull-fly-1.png" alt="" className="absolute inset-0 h-full w-full object-contain" style={{ filter: "drop-shadow(0 4px 10px rgba(0,0,0,0.25))", animation: "ffWingA 0.42s steps(1,end) infinite" }} />
              <img src="/summer-gull-fly-2.png" alt="" className="absolute inset-0 h-full w-full object-contain" style={{ filter: "drop-shadow(0 4px 10px rgba(0,0,0,0.25))", animation: "ffWingB 0.42s steps(1,end) infinite" }} />
            </div>
            <div className="absolute overflow-hidden bg-[#F5F0E6] ring-1 ring-[#E4E4E7]" style={{ left: -w / 2, top: -w * 0.22, width: w, height: w, borderRadius: "9999px" }}>
              <img src="/logo-mark-light.png" alt="" className="h-full w-full scale-110 object-contain" style={{ borderRadius: "9999px" }} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/** Summer heist #4 — SPLAT!: a gull cruises across the top of the screen and
 * scores a direct hit on the banner glass — SPLAT — then a windshield wiper
 * squeaks out of nowhere and wipes it clean. Rare: first strike 3-5 min
 * after load, then every 5-9 min (`ff:poop-heist` forces it). */
export function SummerPoopHeist() {
  const witnessRef = useHeistWitness("splat");
  useEffect(() => { preloadHeistAudio(["/wiper-squeak.mp3"]); }, []);
  const [run, setRun] = useState(null); // {x, y} splat spot (% of viewport)
  const [ph, setPh] = useState(0);      // 1 gull crosses, 2 splat!, 3 wiper
  useEffect(() => {
    const timers = [];
    let pending = null;
    let running = false;
    const schedule = (ms) => { clearTimeout(pending); pending = setTimeout(start, ms); };
    const start = () => {
      if (running) return;
      running = true;
      setRun({ x: 34 + Math.random() * 32, y: 9 + Math.random() * 7 });
      setPh(1);                                          // incoming, high and casual
      timers.push(setTimeout(() => setPh(2), 1500));     // ...SPLAT
      timers.push(setTimeout(() => {                     // the wiper arrives, squeaking
        setPh(3);
        playHeistSound("/wiper-squeak.mp3", 0.55);
      }, 4100));
      timers.push(setTimeout(() => {
        setPh(0); setRun(null); running = false;
        witnessRef.current(true);
        schedule(300000 + Math.random() * 240000);       // again in 5-9 min
      }, 6300));
    };
    schedule(180000 + Math.random() * 120000);
    const force = () => start();
    window.addEventListener("ff:poop-heist", force);
    return () => { clearTimeout(pending); timers.forEach(clearTimeout); window.removeEventListener("ff:poop-heist", force); };
  }, []); // witnessRef is a stable ref
  if (!run || !ph) return null;
  const { x, y } = run;
  return (
    <div className="pointer-events-none fixed inset-0 z-[50] select-none overflow-hidden" data-testid="poop-heist">
      {/* the culprit: one gull cruising the very top, L->R */}
      {ph <= 2 && (
        <div className="absolute left-0" style={{ top: "2.5%", animation: "ffPoopGullSweep 3.6s linear forwards" }} data-testid="poop-heist-gull">
          <div className="relative" style={{ width: "min(9vw, 110px)", aspectRatio: "305 / 243", transform: "scaleX(-1)" }}>
            <img src="/summer-gull-fly-1.png" alt="" className="absolute inset-0 h-full w-full object-contain" style={{ animation: "ffWingA 0.42s steps(1,end) infinite" }} />
            <img src="/summer-gull-fly-2.png" alt="" className="absolute inset-0 h-full w-full object-contain" style={{ animation: "ffWingB 0.42s steps(1,end) infinite" }} />
          </div>
        </div>
      )}
      {/* the mess, stuck to the glass */}
      {ph >= 2 && (
        <div className="absolute" style={{ left: `${x}%`, top: `${y}%`, animation: ph === 3 ? "ffSplatWipe 1.9s linear forwards" : "ffSplatPop 0.28s cubic-bezier(0.34,1.56,0.64,1) both" }} data-testid="poop-heist-splat">
          <div className="relative" style={{ width: 52, height: 44 }}>
            {[[16, 8, 26, 20, 0], [2, 16, 20, 16, -15], [30, 18, 19, 15, 20], [12, 22, 24, 15, 8], [36, 6, 13, 11, 0]].map(([l, t, w2, h2, r], i) => (
              <span key={`sp-${i}`} className="absolute" style={{ left: l, top: t, width: w2, height: h2, borderRadius: "58% 42% 55% 45% / 52% 55% 45% 48%", transform: `rotate(${r}deg)`, background: "radial-gradient(ellipse at 42% 36%, #FDFCF7 0%, #F1EEE2 55%, #DCD8C8 100%)", boxShadow: "inset 0 -1px 2px rgba(120,115,95,0.35), 0 1px 2px rgba(0,0,0,0.18)" }} />
            ))}
            {/* the slow drips */}
            <span className="absolute" style={{ left: 22, top: 32, width: 5, height: 15, borderRadius: "45% 55% 50% 50% / 30% 30% 70% 70%", background: "linear-gradient(180deg, #F1EEE2, #E6E2D2)" }} />
            <span className="absolute" style={{ left: 34, top: 30, width: 4, height: 10, borderRadius: "45% 55% 50% 50% / 30% 30% 70% 70%", background: "linear-gradient(180deg, #F1EEE2, #E6E2D2)" }} />
          </div>
        </div>
      )}
      {/* the wiper: sweeps up over the mess, squeaks back, gone */}
      {ph === 3 && (
        <div className="absolute" style={{ left: `calc(${x}% + 26px)`, top: `calc(${y}% + 88px)` }} data-testid="poop-heist-wiper">
          <div style={{ width: 7, height: 92, marginLeft: -3.5, marginTop: -92, transformOrigin: "50% 100%", animation: "ffWiperSweep 1.9s ease-in-out forwards" }}>
            {/* rubber blade + arm */}
            <span className="absolute inset-x-0 top-0" style={{ height: 58, borderRadius: 4, background: "linear-gradient(90deg, #2A2A2E, #4A4A52 50%, #232327)", boxShadow: "0 1px 3px rgba(0,0,0,0.4)" }} />
            <span className="absolute" style={{ left: 2, top: 54, width: 3, height: 38, background: "linear-gradient(90deg, #55555E, #33333A)", borderRadius: 2 }} />
          </div>
          {/* pivot nut */}
          <span className="absolute rounded-full" style={{ left: -5, top: -5, width: 10, height: 10, background: "radial-gradient(circle at 35% 35%, #6A6A74, #2E2E34)", boxShadow: "0 1px 2px rgba(0,0,0,0.4)" }} />
        </div>
      )}
    </div>
  );
}

/** Summer heist #2: a little red crab scuttles in from the RIGHT side of the
 * banner at medallion height, hoists the medallion overhead, and hauls it
 * away sideways off the LEFT edge — then it bounces back home. First strike
 * 70-110s after load (staggered clear of the beach ball), then every 2.5-5
 * min (or instantly on a `ff:crab-heist` window event, used for testing). */
export function SummerCrabHeist() {
  const witnessRef = useHeistWitness("crab");
  const [run, setRun] = useState(null);   // {cx, cy, w}
  const [phase, setPhase] = useState(0);  // 0 offscreen right, 1 scuttle in, 2 hoist, 3 haul away left
  useEffect(() => {
    const timers = [];
    let pending = null;
    let running = false;
    let cancelSummon = null;
    const schedule = (ms) => { clearTimeout(pending); pending = setTimeout(() => start(false), ms); };
    const start = (force) => {
      if (running) return;
      running = true;
      cancelSummon = summonToLogo((med) => {
        const r = med && med.getBoundingClientRect();
        if (!r || !r.width) { running = false; if (!force) schedule(30000); return; }
        setRun({ cx: r.x + r.width / 2, cy: r.y + r.height / 2, w: r.width });
        timers.push(setTimeout(() => setPhase(1), 30));   // scuttle over
        timers.push(setTimeout(() => {                     // hoist!
          setPhase(2);
          med.style.visibility = "hidden"; startleTitle();
        }, 2300));
        timers.push(setTimeout(() => setPhase(3), 3050));  // haul it away
        timers.push(setTimeout(() => {
          med.style.visibility = "";
          med.style.animation = "none";
          void med.offsetWidth; // restart the pop on repeat strikes
          med.style.animation = "ffLogoReturn 0.55s cubic-bezier(0.34,1.56,0.64,1)";
        }, 5750));
        timers.push(setTimeout(() => {
          setRun(null); setPhase(0); running = false;
          witnessRef.current(true);
          schedule(150000 + Math.random() * 150000); // again in 2.5-5 min
        }, 6500));
      });
    };
    schedule(70000 + Math.random() * 40000);
    const force = () => start(true);
    window.addEventListener("ff:crab-heist", force);
    return () => {
      clearTimeout(pending); timers.forEach(clearTimeout);
      if (cancelSummon) cancelSummon();
      window.removeEventListener("ff:crab-heist", force);
      // Never leave the logo hidden if we unmount mid-heist (theme switch).
      const img = document.querySelector('img[alt="Fork·Fate logo"]');
      if (img && img.parentElement) img.parentElement.style.visibility = "";
    };
  }, []); // witnessRef is a stable ref
  if (!run) return null;
  const { cx, cy, w } = run;
  const crabW = w * 1.7;
  const crabH = crabW * (77 / 160);
  const x = phase === 0 ? window.innerWidth + crabW : phase === 3 ? -(crabW / 2 + w + 60) : cx;
  const trans = phase === 1 ? "transform 2.15s cubic-bezier(0.3,0,0.62,1)" : phase === 3 ? "transform 2.5s cubic-bezier(0.45,0.05,0.75,0.6)" : "none";
  return (
    <div className="pointer-events-none fixed inset-0 z-[50] select-none overflow-hidden" data-testid="crab-heist">
      <div className="absolute left-0 top-0" style={{ transform: `translate(${x - crabW / 2}px, ${cy - crabH * 0.22}px)`, transition: trans }}>
        <div className="relative" style={{ width: crabW, height: crabH, animation: phase === 1 || phase === 3 ? "ffCrabHaulBob 0.36s linear infinite" : undefined }}>
          {/* the hoisted medallion riding overhead in his claws */}
          {(phase === 2 || phase === 3) && (
            <div className="absolute overflow-hidden bg-[#F5F0E6] ring-1 ring-[#E4E4E7]" style={{ left: crabW / 2 - w / 2, top: -(w * 0.92), width: w, height: w, borderRadius: "9999px", animation: "ffCrabHoist 0.5s cubic-bezier(0.34,1.56,0.64,1)" }} data-testid="crab-heist-logo">
              <img src="/logo-mark-light.png" alt="" className="h-full w-full scale-110 object-contain" style={{ borderRadius: "9999px" }} />
            </div>
          )}
          <img src="/summer-crab.png" alt="" className="absolute inset-0 h-full w-full object-contain" style={{ filter: "drop-shadow(0 4px 8px rgba(0,0,0,0.28))" }} />
        </div>
      </div>
    </div>
  );
}

/** Winter heist: a smiling carrot-nosed snowman slides onto the RIGHT side
 * of the banner — then a snowy gust howls across and blows his HEAD clean
 * off to the LEFT. The head bonks the medallion out of its perch and sits
 * in its place looking pleased for a few seconds, until the breeze carries
 * it off and the logo pops back (his body shuffles off after it). First
 * strike 25-45s after load, then every 2.5-5 min (or instantly on a
 * `ff:snowman-heist` window event, used for testing). Body art 316x320,
 * head art 207x220 (carrot points LEFT; a matching wink frame overlays
 * briefly while the head sits in the logo spot). */
export function SnowmanHeist() {
  const witnessRef = useHeistWitness("snowman");
  useEffect(() => { preloadHeistAudio(["/snow-gust.mp3"]); }, []);
  const [run, setRun] = useState(null);   // {cx, cy, w}
  const [phase, setPhase] = useState(0);  // 1 slide in, 2 gust rips the head off, 3 head sits in the logo spot, 4 blown away
  const [gust, setGust] = useState(false);   // snow streaks howling right-to-left
  const [knock, setKnock] = useState(false); // the bonked-away medallion clone
  useEffect(() => {
    // Warm the sprites so the very first strike doesn't pop in half-loaded.
    ["/snowman-body.png", "/snowman-head.png", "/snowman-head-wink.png"].forEach((s) => { const im = new Image(); im.src = s; });
    const timers = [];
    let pending = null;
    let running = false;
    let cancelSummon = null;
    const schedule = (ms) => { clearTimeout(pending); pending = setTimeout(() => start(false), ms); };
    const start = (force) => {
      if (running) return;
      running = true;
      cancelSummon = summonToLogo((med) => {
        const r = med && med.getBoundingClientRect();
        if (!r || !r.width) { running = false; if (!force) schedule(30000); return; }
        setRun({ cx: r.x + r.width / 2, cy: r.y + r.height / 2, w: r.width });
        timers.push(setTimeout(() => setPhase(1), 30));    // shuffles in, all smiles
        const howl = (vol) => playHeistSound("/snow-gust.mp3", vol);        timers.push(setTimeout(() => { setGust(true); howl(0.75); }, 2300)); // the wind picks up...
        timers.push(setTimeout(() => setPhase(2), 2700));   // ...and POP, off comes the head
        timers.push(setTimeout(() => {                      // BONK — it takes the logo's perch
          setPhase(3); setKnock(true);
          med.style.visibility = "hidden"; startleTitle();
        }, 3550));
        timers.push(setTimeout(() => { setKnock(false); setGust(false); }, 4450));
        timers.push(setTimeout(() => { setGust(true); howl(0.55); }, 6900)); // the breeze returns for him
        timers.push(setTimeout(() => setPhase(4), 7100));   // head tumbles off, body shuffles away
        timers.push(setTimeout(() => {
          med.style.visibility = "";
          med.style.animation = "none";
          void med.offsetWidth; // restart the pop on repeat strikes
          med.style.animation = "ffLogoReturn 0.55s cubic-bezier(0.34,1.56,0.64,1)";
        }, 7900));
        timers.push(setTimeout(() => setGust(false), 8400));
        timers.push(setTimeout(() => {
          setRun(null); setPhase(0); running = false;
          witnessRef.current(true);
          schedule(150000 + Math.random() * 150000); // blows back in 2.5-5 min
        }, 9100));
      }, force); // player taps force the gag straight through the latch
    };
    schedule(25000 + Math.random() * 20000);
    const force = () => start(true);
    window.addEventListener("ff:snowman-heist", force);
    return () => {
      clearTimeout(pending); timers.forEach(clearTimeout);
      if (cancelSummon) cancelSummon();
      window.removeEventListener("ff:snowman-heist", force);
      // Never leave the logo hidden if we unmount mid-heist (theme switch).
      const img = document.querySelector('img[alt="Fork·Fate logo"]');
      if (img && img.parentElement) img.parentElement.style.visibility = "";
    };
  }, []); // witnessRef is a stable ref
  if (!run) return null;
  const { cx, cy, w } = run;
  const vw = window.innerWidth, vh = window.innerHeight;
  const headW = w * 1.5, headH = headW * (220 / 207);
  const bodyW = w * 2.4, bodyH = bodyW * (320 / 316);
  const bodyLeft = vw - bodyW - 24;
  const bodyTop = cy + headH * 0.5 - bodyH * 0.14; // neck tucks right up under the head
  const hx = bodyLeft + bodyW * 0.53, hy = cy; // head perched on the neck, level with the logo
  const slide = bodyW + 90;
  // head centre + tumble per phase (lands upright: -340 settles to -360 ≡ 0)
  const hcx = phase === 0 ? hx + slide : phase < 2 ? hx : phase < 4 ? cx : cx - vw * 0.4;
  const hcy = phase === 0 ? hy : phase < 2 ? hy : phase < 4 ? cy : cy + vh * 0.75;
  const hrot = phase < 2 ? 0 : phase === 2 ? -340 : phase === 3 ? -360 : -1080;
  const headTrans =
    phase === 1 ? "transform 0.9s cubic-bezier(0.25,0.9,0.35,1)"
    : phase === 2 ? "transform 0.85s cubic-bezier(0.35,0,0.55,1)"
    : phase === 3 ? "transform 0.35s ease-out"
    : phase === 4 ? "transform 0.85s cubic-bezier(0.5,0.05,0.85,0.5)" : "none";
  const bodyX = phase === 0 || phase >= 4 ? slide : 0;
  return (
    <div className="pointer-events-none fixed inset-0 z-[50] select-none overflow-hidden" data-testid="snowman-heist">
      {/* the snowy gust: white streaks + flecks howling right-to-left */}
      {gust && Array.from({ length: 14 }, (_, i) => {
        const dot = i % 3 === 0;
        return (
          <span
            key={`gust-${i}`}
            className="absolute rounded-full"
            data-testid={i === 0 ? "snowman-gust" : undefined}
            style={{
              left: vw, top: cy - 44 + ((i * 37) % 130),
              width: dot ? 5 : 90 + ((i * 53) % 70), height: dot ? 5 : 2.5,
              background: dot ? "radial-gradient(circle, #FFFFFF, #BFDFF5 60%, rgba(191,223,245,0) 80%)" : "linear-gradient(90deg, rgba(191,223,245,0), rgba(240,250,255,0.98), rgba(191,223,245,0))",
              boxShadow: dot ? "0 0 6px rgba(130,180,225,0.7)" : "0 1px 5px rgba(120,170,215,0.6)",
              animation: `ffSnowGust 1.05s linear ${(i * 0.07).toFixed(2)}s both`,
            }}
          />
        );
      })}
      {/* the bonked medallion tumbling away downwind (left) */}
      {knock && (
        <div className="absolute overflow-hidden bg-[#F5F0E6] ring-1 ring-[#E4E4E7]" style={{ left: cx - w / 2, top: cy - w / 2, width: w, height: w, borderRadius: "9999px", animation: "ffLogoKnockL 0.9s cubic-bezier(0.25,0.8,0.5,1) forwards" }} data-testid="snowman-heist-logo">
          <img src="/logo-mark-light.png" alt="" className="h-full w-full scale-110 object-contain" style={{ borderRadius: "9999px" }} />
        </div>
      )}
      {/* impact flurry as the head takes the perch */}
      {knock && (
        <div className="absolute" style={{ left: cx, top: cy }}>
          {Array.from({ length: 8 }, (_, i) => {
            const a = (i / 8) * Math.PI * 2;
            const d = w * (0.6 + (i % 3) * 0.22);
            return (
              <span key={`flur-${i}`} className="absolute rounded-full" style={{ width: 5 + (i % 3) * 2, height: 5 + (i % 3) * 2, "--dx": `${Math.cos(a) * d}px`, "--dy": `${Math.sin(a) * d}px`, background: i % 2 ? "radial-gradient(circle, #FFFFFF, #DCEEFA 60%, transparent 82%)" : "radial-gradient(circle, #F2FAFF, #B7DCF2 60%, transparent 82%)", boxShadow: "0 0 6px rgba(220,240,255,0.85)", animation: "ffPoofSparkle 0.95s ease-out forwards" }} />
            );
          })}
        </div>
      )}
      {/* the headless body, waiting patiently on the right */}
      <div className="absolute" style={{ left: bodyLeft, top: bodyTop, width: bodyW, height: bodyH, transform: `translateX(${bodyX}px)`, transition: phase === 1 ? "transform 0.9s cubic-bezier(0.25,0.9,0.35,1)" : phase === 4 ? "transform 0.9s cubic-bezier(0.5,0.05,0.85,0.5)" : "none" }} data-testid="snowman-body">
        <img src="/snowman-body.png" alt="" className="h-full w-full object-contain" style={{ transformOrigin: "50% 100%", animation: phase === 2 ? "ffSnowLean 0.6s ease-in-out" : undefined, filter: "drop-shadow(0 4px 10px rgba(30,60,90,0.35))" }} />
      </div>
      {/* the head: smiling through the whole ordeal */}
      <div className="absolute" style={{ left: 0, top: 0, width: headW, height: headH, transform: `translate(${hcx - headW / 2}px, ${hcy - headH / 2}px) rotate(${hrot}deg)`, transition: headTrans }} data-testid="snowman-head">
        <img src="/snowman-head.png" alt="" className="h-full w-full object-contain" style={{ filter: "drop-shadow(0 4px 10px rgba(30,60,90,0.35))" }} />
        {/* settled in the logo's perch, he throws a cheeky wink */}
        {phase === 3 && (
          <img src="/snowman-head-wink.png" alt="" className="absolute inset-0 h-full w-full object-contain" style={{ opacity: 0, animation: "ffHeadWink 3.4s ease-in-out forwards", filter: "drop-shadow(0 4px 10px rgba(30,60,90,0.35))" }} data-testid="snowman-head-wink" />
        )}
      </div>
    </div>
  );
}

/** Fall heist: a great horned owl swoops in from the RIGHT on beating wings,
 * closes its talons around the medallion and carries it clean off the LEFT
 * edge into the autumn sky. The logo pops back a beat later. First strike
 * 25-45s after load, then every 2.5-5 min (or instantly on a `ff:owl-heist`
 * window event, used for testing). Owl art 329x340 flying LEFT, open talons
 * at (17%, 87%) of the sprite box. */
export function OwlHeist() {
  const witnessRef = useHeistWitness("owl");
  useEffect(() => { preloadHeistAudio(["/owl-hoot.mp3", "/wing-whoosh.mp3"]); }, []);
  const [run, setRun] = useState(null);   // {cx, cy, w}
  const [phase, setPhase] = useState(0);  // 1 dive down-left, 2 swoop up to the logo, 3 the clamp beat, 4 carries it off
  useEffect(() => {
    // Warm the sprite so the very first strike doesn't pop in half-loaded.
    { const im = new Image(); im.src = "/owl-fly-1.png"; }
    const timers = [];
    let pending = null;
    let running = false;
    let cancelSummon = null;
    const schedule = (ms) => { clearTimeout(pending); pending = setTimeout(() => start(false), ms); };
    const start = (force) => {
      if (running) return;
      running = true;
      cancelSummon = summonToLogo((med) => {
        const r = med && med.getBoundingClientRect();
        if (!r || !r.width) { running = false; if (!force) schedule(30000); return; }
        const medImg = med.querySelector("img");
        const medCs = getComputedStyle(med);
        setRun({
          cx: r.x + r.width / 2, cy: r.y + r.height / 2, w: r.width,
          src: (medImg && medImg.getAttribute("src")) || "/logo-mark.png",
          bg: medCs.backgroundColor,
          imgFilter: medImg ? getComputedStyle(medImg).filter : "none",
        });
        const cry = (src, vol) => playHeistSound(src, vol);
        timers.push(setTimeout(() => {                     // dives DOWN out of the sky, hooting
          setPhase(1);
          cry("/owl-hoot.mp3", 0.45);
        }, 30));
        timers.push(setTimeout(() => {                     // hauls up toward the medallion
          setPhase(2);
          cry("/wing-whoosh.mp3", 0.5);
        }, 1000));
        timers.push(setTimeout(() => {                     // talons CLAMP shut on it
          setPhase(3);
          med.style.visibility = "hidden"; startleTitle();
        }, 1780));
        timers.push(setTimeout(() => setPhase(4), 2310));  // carries it off
        timers.push(setTimeout(() => {
          med.style.visibility = "";
          med.style.animation = "none";
          void med.offsetWidth; // restart the pop on repeat strikes
          med.style.animation = "ffLogoReturn 0.55s cubic-bezier(0.34,1.56,0.64,1)";
        }, 3630));
        timers.push(setTimeout(() => {
          setRun(null); setPhase(0); running = false;
          witnessRef.current(true);
          schedule(150000 + Math.random() * 150000); // hunts again in 2.5-5 min
        }, 4430));
      });
    };
    schedule(25000 + Math.random() * 20000);
    const force = () => start(true);
    window.addEventListener("ff:owl-heist", force);
    return () => {
      clearTimeout(pending); timers.forEach(clearTimeout);
      if (cancelSummon) cancelSummon();
      window.removeEventListener("ff:owl-heist", force);
      // Never leave the logo hidden if we unmount mid-heist (theme switch).
      const img = document.querySelector('img[alt="Fork·Fate logo"]');
      if (img && img.parentElement) img.parentElement.style.visibility = "";
    };
  }, []); // witnessRef is a stable ref
  if (!run) return null;
  const { cx, cy, w, src, bg, imgFilter } = run;
  const vw = window.innerWidth, vh = window.innerHeight;
  const owlW = w * 3.5, owlH = owlW * (340 / 329);
  const gx = 0.17, gy = 0.87; // open-talon pocket in the sprite box
  const gripLeft = cx - owlW * gx, gripTop = cy - owlH * gy;
  // The J-swoop: off-screen top-right -> DIVES down-left into mid-screen
  // (impossible to miss on mobile) -> hauls back UP to the medallion -> off.
  const x = phase === 0 ? vw + 40 : phase === 1 ? vw * 0.5 - owlW * 0.5 : phase === 4 ? -owlW - vw * 0.12 : gripLeft;
  const y = phase === 0 ? gripTop - 80 : phase === 1 ? gripTop + vh * 0.42 : phase === 4 ? gripTop - vh * 0.32 : gripTop;
  const trans = phase === 1 ? "transform 0.95s cubic-bezier(0.4,0.1,0.7,1)"
    : phase === 2 ? "transform 0.75s cubic-bezier(0.25,0.6,0.35,1)"
    : phase === 4 ? "transform 1.3s cubic-bezier(0.55,0.05,0.8,0.4)" : "none";
  return (
    <div className="pointer-events-none fixed inset-0 z-[50] select-none overflow-hidden" data-testid="owl-heist">
      <div className="absolute left-0 top-0" style={{ transform: `translate(${x}px, ${y}px)`, transition: trans }}>
        <div className="relative" style={{ width: owlW, height: owlH, filter: "drop-shadow(0 6px 14px rgba(40,25,10,0.45))" }}>
          {/* the snatched medallion riding in his talons */}
          {phase >= 3 && (
            <div className="absolute overflow-hidden ring-1 ring-black/30" style={{ left: owlW * gx - w / 2, top: owlH * gy - w / 2, width: w, height: w, borderRadius: "9999px", backgroundColor: bg }} data-testid="owl-heist-logo">
              <img src={src} alt="" className="h-full w-full scale-110 object-contain" style={{ borderRadius: "9999px", filter: imgFilter }} />
            </div>
          )}
          <img src="/owl-fly-1.png" alt="" className="absolute inset-0 h-full w-full object-contain" style={{ animation: "ffOwlGlide 1.3s ease-in-out infinite", rotate: phase === 1 ? "16deg" : phase === 2 ? "-11deg" : phase === 4 ? "7deg" : "0deg", transition: "rotate 0.7s ease-in-out" }} />
        </div>
      </div>
    </div>
  );
}

/** Spring heist: a warm gust rushes across the page carrying a blizzard of
 * cherry blossom petals right-to-left — the wave slams into the medallion
 * and knocks it clean off the LEFT edge of the screen. It pops back once
 * the wind dies down. First strike 25-45s after load, then every 2.5-5 min
 * (or instantly on a `ff:petal-heist` window event, used for testing). */
const PETALS = Array.from({ length: 60 }, (_, i) => ({
  top: 2 + ((i * 37) % 94),               // vh
  delay: ((i * 53) % 160) / 100,          // s
  dur: 1.7 + ((i * 29) % 80) / 100,       // s
  size: 9 + (i % 6) * 2,                  // px
  drift: -80 + ((i * 61) % 160),          // px of vertical wander
  tone: i % 3,
}));
const PETAL_TONES = ["#FFB7CD", "#F8C8DC", "#FFD7E6"];
export function SpringPetalHeist() {
  const witnessRef = useHeistWitness("petals");
  useEffect(() => { preloadHeistAudio(["/spring-wind.mp3"]); }, []);
  const [run, setRun] = useState(null);   // {cx, cy, w}
  const [phase, setPhase] = useState(0);  // 1 the gust sweeps, 2 the coin is knocked away
  useEffect(() => {
    const timers = [];
    let pending = null;
    let running = false;
    let cancelSummon = null;
    const schedule = (ms) => { clearTimeout(pending); pending = setTimeout(() => start(false), ms); };
    const start = (force) => {
      if (running) return;
      running = true;
      cancelSummon = summonToLogo((med) => {
        const r = med && med.getBoundingClientRect();
        if (!r || !r.width) { running = false; if (!force) schedule(30000); return; }
        setRun({ cx: r.x + r.width / 2, cy: r.y + r.height / 2, w: r.width });
        timers.push(setTimeout(() => {                     // the gust picks up
          setPhase(1);
          playHeistSound("/spring-wind.mp3", 0.7);
        }, 30));
        timers.push(setTimeout(() => {                     // the wave-front slams the coin
          setPhase(2);
          med.style.visibility = "hidden"; startleTitle();
        }, 1250));
        timers.push(setTimeout(() => {
          med.style.visibility = "";
          med.style.animation = "none";
          void med.offsetWidth; // restart the pop on repeat strikes
          med.style.animation = "ffLogoReturn 0.55s cubic-bezier(0.34,1.56,0.64,1)";
        }, 4200));
        timers.push(setTimeout(() => {
          setRun(null); setPhase(0); running = false;
          witnessRef.current(true);
          schedule(150000 + Math.random() * 150000); // blows through again in 2.5-5 min
        }, 5000));
      });
    };
    schedule(25000 + Math.random() * 20000);
    const force = () => start(true);
    window.addEventListener("ff:petal-heist", force);
    return () => {
      clearTimeout(pending); timers.forEach(clearTimeout);
      if (cancelSummon) cancelSummon();
      window.removeEventListener("ff:petal-heist", force);
      // Never leave the logo hidden if we unmount mid-heist (theme switch).
      const img = document.querySelector('img[alt="Fork·Fate logo"]');
      if (img && img.parentElement) img.parentElement.style.visibility = "";
    };
  }, []); // witnessRef is a stable ref
  if (!run) return null;
  const { cx, cy, w } = run;
  const vw = window.innerWidth;
  return (
    <div className="pointer-events-none fixed inset-0 z-[50] select-none overflow-hidden" data-testid="petal-heist">
      {/* the blossom blizzard streaming right-to-left across the whole page */}
      {phase >= 1 && PETALS.map((p, i) => (
        <img
          key={`petal-${i}`}
          src="/petal-pink.png"
          alt=""
          className="absolute"
          data-testid={i === 0 ? "petal-heist-petal" : undefined}
          style={{
            left: vw, top: `${p.top}vh`,
            width: p.size * 1.15,
            "--pd": `${p.drift}px`,
            opacity: 0,
            filter: p.tone === 2 ? "blur(1px) brightness(1.08)" : p.tone === 1 ? "hue-rotate(-8deg)" : undefined,
            animation: `ffPetalSweep ${p.dur}s linear ${p.delay}s both`,
          }}
        />
      ))}
      {/* the medallion knocked clean off the screen, riding the gust */}
      {phase === 2 && (
        <div className="absolute overflow-hidden bg-[#F5F0E6] ring-1 ring-[#E4E4E7]" style={{ left: cx - w / 2, top: cy - w / 2, width: w, height: w, borderRadius: "9999px", animation: "ffLogoKnockL 0.95s cubic-bezier(0.3,0.4,0.5,1) forwards" }} data-testid="petal-heist-logo">
          <img src="/logo-mark-light.png" alt="" className="h-full w-full scale-110 object-contain" style={{ borderRadius: "9999px" }} />
        </div>
      )}
    </div>
  );
}


export function CardinalTipHeist() {
  const witnessRef = useHeistWitness("cardinal");
  const [run, setRun] = useState(null);    // {cx, cy, w}
  const [phase, setPhase] = useState(0);   // 0 offscreen right, 1 fly to perch, 2 perched + teeter, 3 the fall, 4 fly off
  useEffect(() => {
    ["/winter-cardinal.png", "/winter-cardinal-fly.png"].forEach((s) => { const im = new Image(); im.src = s; });
    const timers = [];
    let pending = null;
    let running = false;
    let cancelSummon = null;
    const schedule = (ms) => { clearTimeout(pending); pending = setTimeout(() => start(false), ms); };
    const start = (force) => {
      if (running) return;
      running = true;
      cancelSummon = summonToLogo((med) => {
        const r = med && med.getBoundingClientRect();
        if (!r || !r.width) { running = false; if (!force) schedule(30000); return; }
        setRun({ cx: r.x + r.width / 2, cy: r.y + r.height / 2, w: r.width });
        timers.push(setTimeout(() => setPhase(1), 30));      // flutters in for a landing
        timers.push(setTimeout(() => {                       // touchdown — the perch teeters
          setPhase(2);
          med.style.visibility = "hidden"; startleTitle();
        }, 1450));
        timers.push(setTimeout(() => setPhase(3), 2850));    // over she goes!
        timers.push(setTimeout(() => setPhase(4), 3950));    // the bird beats it
        timers.push(setTimeout(() => {
          med.style.visibility = "";
          med.style.animation = "none";
          void med.offsetWidth; // restart the pop on repeat strikes
          med.style.animation = "ffLogoReturn 0.55s cubic-bezier(0.34,1.56,0.64,1)";
        }, 4350));
        timers.push(setTimeout(() => {
          setRun(null); setPhase(0); running = false;
          witnessRef.current(true);
          schedule(150000 + Math.random() * 150000); // rests again in 2.5-5 min
        }, 5400));
      });
    };
    schedule(30000 + Math.random() * 25000);
    const force = () => start(true);
    window.addEventListener("ff:cardinal-heist", force);
    return () => {
      clearTimeout(pending); timers.forEach(clearTimeout);
      if (cancelSummon) cancelSummon();
      window.removeEventListener("ff:cardinal-heist", force);
      // Never leave the logo hidden if we unmount mid-heist (theme switch).
      const img = document.querySelector('img[alt="Fork·Fate logo"]');
      if (img && img.parentElement) img.parentElement.style.visibility = "";
    };
  }, []); // witnessRef is a stable ref
  if (!run) return null;
  const { cx, cy, w } = run;
  const vw = window.innerWidth;
  const FW = w * 1.05, FH = FW * (141 / 220);   // flying box
  const PW = w * 0.95, PH = PW * (123 / 200);   // perched box
  // Bird position: perched bottom-center sits on the medallion's crown.
  const perchX = cx - PW / 2, perchY = cy - w / 2 - PH + w * 0.06;
  const bx = phase === 0 ? vw + 70 : phase === 4 ? vw + 90 : perchX;
  const by = phase === 0 ? perchY - w * 1.1 : phase === 3 ? perchY - w * 0.55 : phase === 4 ? perchY - w * 1.4 : perchY;
  const birdTrans = phase === 1 ? "transform 1.3s cubic-bezier(0.25,0.9,0.35,1)"
    : phase === 3 ? "transform 0.45s cubic-bezier(0.2,0.9,0.4,1)"
    : phase === 4 ? "transform 1.1s cubic-bezier(0.5,0.05,0.85,0.5)" : "none";
  const flying = phase !== 2;
  return (
    <div className="pointer-events-none fixed inset-0 z-[50] select-none overflow-hidden" data-testid="cardinal-heist">
      {/* the medallion: teeters under the bird, then tips off its perch */}
      {(phase === 2 || phase === 3) && (
        <div
          className="absolute overflow-visible"
          style={{ left: cx - w / 2, top: cy - w / 2, width: w, height: w, transformOrigin: "100% 100%", animation: phase === 2 ? "ffMedTeeter 1.4s ease-in-out forwards" : "ffLogoFallOff 0.9s cubic-bezier(0.45,0,0.8,0.6) forwards" }}
          data-testid="cardinal-heist-logo"
        >
          <div className="h-full w-full overflow-hidden bg-[#F5F0E6] ring-1 ring-[#E4E4E7]" style={{ borderRadius: "9999px" }}>
            <img src="/logo-mark-light.png" alt="" className="h-full w-full scale-110 object-contain" style={{ borderRadius: "9999px" }} />
          </div>
        </div>
      )}
      {/* the featherweight herself */}
      <div className="absolute left-0 top-0" style={{ transform: `translate(${bx}px, ${by}px)`, transition: birdTrans }} data-testid="cardinal-heist-bird">
        <div style={{ transform: phase === 4 ? "scaleX(-1)" : undefined }}>
          <div className="relative" style={{ width: flying ? FW : PW, height: flying ? FH : PH, transformOrigin: "80% 100%", animation: phase === 2 ? "ffMedTeeter 1.4s ease-in-out forwards" : undefined }}>
            {flying ? (
              <img src="/winter-cardinal-fly.png" alt="" className="h-full w-full object-contain" style={{ animation: "ffCardinalFlap 0.24s ease-in-out infinite alternate", transformOrigin: "50% 60%", filter: "drop-shadow(0 4px 8px rgba(30,60,90,0.35))" }} />
            ) : (
              <img src="/winter-cardinal.png" alt="" className="h-full w-full object-contain" style={{ filter: "drop-shadow(0 4px 8px rgba(30,60,90,0.35))" }} />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

/** Fall heist: WINTER STASH. The little squirrel scampers in along the header
 * with the rabbit-style pose rig (leap sprite mid-hop, crouch sprite between
 * hops), an acorn in its cheeks. It stops beside the medallion, stands upright
 * and checks both ways, then stuffs the acorn behind the logo — which bulges,
 * strains... and BURSTS clean off as the squirrel's entire hidden cache of
 * acorns explodes out and tumbles all the way down to the ground. The squirrel
 * panics, snatches one nut back, and bolts. The logo pops back into place with
 * one acorn tip still peeking out from behind it for the rest of the visit.
 * First strike 40-70s after load, then every 2.5-5 min (`ff:stash-heist`
 * forces it). Poses: /fall-squirrel.png (run/leap, 260x139), -sit (260x138),
 * -up (260x159), -hold (260x147, acorn in paws); all face RIGHT. */
export function WinterStashHeist() {
  const witnessRef = useHeistWitness("stash");
  const [run, setRun] = useState(null);    // {cx, cy, w}
  const [ph, setPh] = useState(0);         // 0 staged, 1 scamper in, 2 look around, 3 stash, 4 calm sit, 5 panic, 6 grab, 7 bolt
  const [face, setFace] = useState("R");   // brief look-left flips
  const [acorn, setAcorn] = useState(null);// carried acorn: "paws" -> "slot" -> null
  const [burst, setBurst] = useState(false);
  const [peek, setPeek] = useState(null);  // the tip left peeking after the heist
  useEffect(() => {
    preloadHeistAudio(["/stash-rustle.mp3", "/stash-pop.mp3", "/stash-chatter.mp3"]);
    ["/fall-squirrel.png", "/fall-squirrel-sit.png", "/fall-squirrel-up.png", "/fall-squirrel-hold.png", "/fall-acorn.png"].forEach((s) => { const im = new Image(); im.src = s; });
    const timers = [];
    let pending = null;
    let running = false;
    let cancelSummon = null;
    const schedule = (ms) => { clearTimeout(pending); pending = setTimeout(() => start(false), ms); };
    const start = (force) => {
      if (running) return;
      running = true;
      cancelSummon = summonToLogo((med) => {
        const r = med && med.getBoundingClientRect();
        if (!r || !r.width) { running = false; if (!force) schedule(30000); return; }
        setRun({ cx: r.x + r.width / 2, cy: r.y + r.height / 2, w: r.width });
        setPeek(null);
        timers.push(setTimeout(() => { setPh(1); setAcorn("paws"); }, 30));   // scampers in, nut in cheeks
        timers.push(setTimeout(() => setPh(2), 2300));                        // upright... anyone watching?
        timers.push(setTimeout(() => setFace("L"), 2650));                    // glance left
        timers.push(setTimeout(() => setFace("R"), 3050));                    // glance right
        timers.push(setTimeout(() => { setPh(3); setAcorn("slot"); playHeistSound("/stash-rustle.mp3", 0.5); }, 3450)); // stuffs it behind the logo
        timers.push(setTimeout(() => {                                        // the medallion bulges
          setAcorn(null);
          med.style.transition = "transform 0.35s cubic-bezier(0.34,1.56,0.64,1)";
          med.style.transform = "scale(1.09) rotate(-6deg)";
        }, 4050));
        timers.push(setTimeout(() => {                                        // pats it flat... almost
          setPh(4);
          med.style.transform = "scale(1.03) rotate(-2deg)";
        }, 4600));
        timers.push(setTimeout(() => {                                        // it's straining...
          med.style.animation = "ffStashStrain 0.42s ease-in-out 2";
        }, 5300));
        timers.push(setTimeout(() => {                                        // BURSTS OPEN — nut avalanche
          setBurst(true); setPh(5);
          playHeistSound("/stash-pop.mp3", 0.7);
          med.style.animation = "none"; med.style.transform = ""; med.style.transition = "";
          med.style.visibility = "hidden"; startleTitle();
        }, 5900));
        timers.push(setTimeout(() => playHeistSound("/stash-chatter.mp3", 0.55), 6150)); // outraged squirrel chatter
        timers.push(setTimeout(() => setPh(6), 7400));                        // snatches one nut back
        timers.push(setTimeout(() => setPh(7), 7900));                        // bolts for the trees
        timers.push(setTimeout(() => {                                        // logo pops back — one tip peeking
          med.style.visibility = "";
          med.style.animation = "none";
          void med.offsetWidth;
          med.style.animation = "ffLogoReturn 0.55s cubic-bezier(0.34,1.56,0.64,1)";
          setPeek({ cx: r.x + r.width / 2, cy: r.y + r.height / 2, w: r.width });
        }, 9700));
        timers.push(setTimeout(() => {
          setRun(null); setPh(0); setBurst(false); setFace("R"); running = false;
          witnessRef.current(true);
          schedule(150000 + Math.random() * 150000);
        }, 10900));
      });
    };
    schedule(40000 + Math.random() * 30000);
    const force = () => start(true);
    window.addEventListener("ff:stash-heist", force);
    return () => {
      clearTimeout(pending); timers.forEach(clearTimeout);
      if (cancelSummon) cancelSummon();
      window.removeEventListener("ff:stash-heist", force);
      const img = document.querySelector('img[alt="Fork·Fate logo"]');
      if (img && img.parentElement) {
        img.parentElement.style.visibility = "";
        img.parentElement.style.transform = "";
        img.parentElement.style.transition = "";
      }
    };
  }, []); // witnessRef is a stable ref
  if (!run && !peek) return null;
  const g = run || peek;
  const { cx, cy, w } = g;
  const vh = window.innerHeight;
  const SW = w * 1.5, SH = SW * 0.62;              // pose box (tallest pose is 159/260)
  const baseY = cy + w * 0.5;                       // squirrel feet share the logo's bottom line
  const stopX = cx - w * 0.5 - SW * 0.82;           // parks just left of the medallion
  const sqX = ph === 0 ? -(SW + 60) : ph >= 7 ? -(SW + 80) : ph === 3 ? stopX + w * 0.22 : stopX;
  const sqTrans = ph === 1 ? "left 2.1s linear" : ph === 7 ? "left 1.7s linear" : ph === 3 ? "left 0.4s ease-out" : "none";
  const moving = ph === 1 || ph === 7;
  const pose = moving ? "move" : ph === 2 || ph === 5 ? "up" : ph === 3 || ph === 6 ? "hold" : "sit";
  const faceL = ph >= 7 || face === "L";
  const nutFall = vh - cy - w * 0.6;                // how far the avalanche drops to the ground
  const poseImg = (src, key, on, extraAnim) => (
    <img key={key} src={src} alt="" className="absolute bottom-0 left-0 w-full object-contain object-bottom"
      style={{ opacity: extraAnim ? 1 : on ? 1 : 0, animation: extraAnim, filter: "drop-shadow(0 3px 5px rgba(60,40,20,0.35))" }} />
  );
  return (
    <div className="pointer-events-none fixed inset-0 z-[50] select-none overflow-hidden" data-testid="stash-heist">
      {/* the medallion blasted off its perch by the nut avalanche */}
      {burst && run && (
        <div className="absolute overflow-hidden bg-black ring-2 ring-[#B5651D]" style={{ left: cx - w / 2, top: cy - w / 2, width: w, height: w, borderRadius: "9999px", animation: "ffLogoBlownUp 1.4s cubic-bezier(0.3,0.6,0.6,1) forwards" }} data-testid="stash-heist-logo">
          <img src="/logo-mark.png" alt="" className="h-full w-full scale-110 object-contain" style={{ borderRadius: "9999px" }} />
        </div>
      )}
      {/* the entire hidden cache tumbles all the way down to the ground */}
      {burst && run && (
        <div className="absolute" style={{ left: cx, top: cy }} data-testid="stash-heist-nuts">
          {Array.from({ length: 13 }, (_, i) => (
            <img key={`nut-${i}`} src="/fall-acorn.png" alt="" className="absolute max-w-none"
              style={{ width: w * (0.24 + (i % 3) * 0.05), "--dx": `${((i / 12) - 0.5) * w * 5.2}px`, "--fy": `${nutFall - (i % 4) * 14}px`,
                animation: `ffNutTumble ${(1.5 + (i % 5) * 0.14).toFixed(2)}s cubic-bezier(0.35,0,0.75,0.7) ${(i * 0.045).toFixed(2)}s forwards`, opacity: 0 }} />
          ))}
        </div>
      )}
      {/* the carried acorn slipping from its paws into the slot behind the logo */}
      {acorn && run && (
        <img src="/fall-acorn.png" alt="" className="absolute" data-testid="stash-heist-acorn"
          style={{ width: w * 0.32, left: acorn === "paws" ? stopX + SW * 0.6 : cx - w * 0.3, top: acorn === "paws" ? baseY - SH * 0.52 : cy - w * 0.16,
            transform: acorn === "slot" ? "scale(0.6) rotate(40deg)" : "rotate(-12deg)",
            transition: "left 0.55s ease-in, top 0.55s ease-in, transform 0.55s ease-in" }} />
      )}
      {/* the squirrel — rabbit-style pose rig */}
      {run && (
        <div className="absolute" style={{ left: sqX, top: baseY - SH, width: SW, height: SH, transition: sqTrans }} data-testid="stash-heist-squirrel">
          <div className="relative h-full w-full" style={{ transform: faceL ? "scaleX(-1)" : "none", animation: ph === 5 ? "ffStashPanic 0.55s steps(1,end) 3" : undefined }}>
            <div className="relative h-full w-full" style={{ animation: moving ? "ffStashBob 0.36s ease-in-out infinite" : undefined }}>
              {poseImg("/fall-squirrel.png", "p-run", false, moving ? "ffStashAir 0.36s linear infinite" : undefined)}
              {poseImg("/fall-squirrel-sit.png", "p-sit", pose === "sit", moving ? "ffStashGround 0.36s linear infinite" : undefined)}
              {poseImg("/fall-squirrel-up.png", "p-up", pose === "up")}
              {poseImg("/fall-squirrel-hold.png", "p-hold", pose === "hold")}
              {/* the nut in its cheeks on the way in */}
              {ph === 1 && <img src="/fall-acorn.png" alt="" className="absolute" style={{ width: "22%", right: "4%", top: "34%", transform: "rotate(-18deg)" }} />}
            </div>
          </div>
        </div>
      )}
      {/* one acorn tip left peeking out from behind the medallion */}
      {peek && (
        <div className="absolute overflow-hidden" data-testid="stash-heist-peek"
          style={{ left: cx + w * 0.12, top: cy - w * 0.72, width: w * 0.34, height: w * 0.24 }}>
          <img src="/fall-acorn.png" alt="" style={{ width: "100%", transform: "rotate(64deg) translateY(18%)", opacity: 0.95 }} />
        </div>
      )}
    </div>
  );
}
