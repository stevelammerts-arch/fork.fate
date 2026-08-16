// Ambiance-realm logo heists: saucer abduction, dragon claw, reaper hands,
// soul snatch, tiki spear, steam spring/gears, coffee spill, reaper plate,
// unicorn charge. Each strikes the header medallion via the shared heist lib.
import { useState, useEffect } from "react";
import { LogoHeist, summonToLogo, startleTitle, useHeistWitness, preloadHeistAudio, playHeistSound } from "./heistLib";

/** Rare easter egg: the stealth saucer sneaks in and ABDUCTS the header logo.
 * First strike 20-40s after load, then again every 2.5-5 minutes (or
 * immediately on a `ff:abduct` window event, used for testing). The real logo
 * medallion is hidden while a clone rides the tractor beam up into the ship,
 * then drops back with a bounce. The patrol saucer hides during the heist. */
export function SaucerAbduction({ saucer, onActive }) {
  const [run, setRun] = useState(null);
  const [phase, setPhase] = useState(0); // 1 fly-in, 2 beam on, 3 lift, 4 leave
  const witnessRef = useHeistWitness("saucer");
  useEffect(() => { preloadHeistAudio(["/beam-riser.mp3"]); }, []);
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
        timers.push(setTimeout(() => {                                                      // beam on
          setPhase(2);
          // the tractor beam spools up — riser peaks as the coin enters the ship
          playHeistSound("/beam-riser.mp3", 0.6);
        }, 1380));
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


/** Dragon's Hoard heist: a scaled dragon claw snatches the medallion.
 * Claw art is 571x718 (red/gold, regenerated) with the circular grip void
 * centered at (50.5%, 43.4%), void ~44% of the art width. */
export function DragonHeist() {
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

/** Soul Snatch: the white spectre MATERIALIZES out of thin air BEHIND the
 * header medallion — his claws already bracketing it — hangs there for a few
 * haunted seconds while the soul-wail rings out, then vanishes and takes the
 * medallion with him. The logo pops back a beat later. First strike 45-75s
 * after load, then every 2.5-5 min (or instantly on a `ff:ghost-heist`
 * window event, used for testing). Ghost art is 695x1211; the pocket his
 * claws wrap sits at (36%, 26.5%) of the sprite box. */
export function GhostSnatchHeist() {
  const witnessRef = useHeistWitness("snatch");
  useEffect(() => { preloadHeistAudio(["/soul-wail-short.mp3"]); }, []);
  const [run, setRun] = useState(null);  // {cx, cy, w}
  const [phase, setPhase] = useState(0); // 1 materialize + linger, 2 vanish with the coin
  useEffect(() => {
    // Warm the sprite so his very first haunting doesn't pop in half-loaded.
    { const im = new Image(); im.src = "/reaper-ghost-1.png"; }
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
        timers.push(setTimeout(() => {
          // Our clone coin (rendered in FRONT of the ghost) takes over the
          // real medallion seamlessly, so he truly fades in BEHIND it.
          setPhase(1);
          med.style.visibility = "hidden";
          playHeistSound("/soul-wail-short.mp3", 0.55);
        }, 30));
        timers.push(setTimeout(() => { setPhase(2); startleTitle(); }, 4100)); // gone — and the coin goes with him
        timers.push(setTimeout(() => {
          med.style.visibility = "";
          med.style.animation = "none";
          void med.offsetWidth; // restart the pop on repeat hauntings
          med.style.animation = "ffLogoReturn 0.55s cubic-bezier(0.34,1.56,0.64,1)";
        }, 5400));
        timers.push(setTimeout(() => {
          setRun(null); setPhase(0); running = false;
          witnessRef.current(true);
          schedule(150000 + Math.random() * 150000); // haunts again in 2.5-5 min
        }, 6100));
      });
    };
    schedule(45000 + Math.random() * 30000);
    const force = () => start(true);
    window.addEventListener("ff:ghost-heist", force);
    return () => {
      clearTimeout(pending); timers.forEach(clearTimeout);
      if (cancelSummon) cancelSummon();
      window.removeEventListener("ff:ghost-heist", force);
      // Never leave the logo hidden if we unmount mid-haunt (theme switch).
      const img = document.querySelector('img[alt="Fork·Fate logo"]');
      if (img && img.parentElement) img.parentElement.style.visibility = "";
    };
  }, []); // witnessRef is a stable ref
  if (!run) return null;
  const { cx, cy, w } = run;
  const boxW = w * 2.75;
  const boxH = boxW * (1211 / 695);
  const gripX = 0.36, gripY = 0.265;
  return (
    <div className="pointer-events-none fixed inset-0 z-[50] select-none overflow-hidden" data-testid="ghost-snatch-heist">
      <div className="absolute" style={{ left: cx - boxW * gripX, top: cy - boxH * gripY, width: boxW, height: boxH, animation: phase === 2 ? "ffGhostVanish 1s ease-in forwards" : undefined }}>
        <div className="h-full w-full" style={{ animation: "ffGhostHold 3.4s ease-in-out infinite" }}>
          <img
            src="/reaper-ghost-1.png"
            alt=""
            className="absolute inset-0 h-full w-full object-contain"
            style={{ opacity: 0, filter: "blur(0.4px) drop-shadow(0 0 16px rgba(190,208,235,0.45))", animation: phase >= 1 ? "ffGhostMaterialize 1.6s ease-out both" : undefined }}
            data-testid="ghost-snatch-spectre"
          />
          {/* the coveted coin — rendered in FRONT so he appears behind it */}
          {phase >= 1 && (
            <div className="absolute overflow-hidden bg-black ring-1 ring-white/25" style={{ left: boxW * gripX - w / 2, top: boxH * gripY - w / 2, width: w, height: w, borderRadius: "9999px" }} data-testid="ghost-snatch-logo">
              <img src="/logo-mark.png" alt="" className="h-full w-full scale-110 object-contain" style={{ borderRadius: "9999px" }} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}


/** Tiki spear heist: a tiki hunter CHARGES across the screen from the
 * right to war drums, spear leveled — one jab and the medallion POPS like a
 * balloon in a burst of sparks. He struts on out the left edge while it
 * puffs itself back up. First strike 85-125s after load (staggered clear of
 * the surfer), then every 2.5-5 min (`ff:spear-heist` forces it, testing). */
export function TikiSpearHeist() {
  const witnessRef = useHeistWitness("spear");
  useEffect(() => { preloadHeistAudio(["/tiki-drums-short.mp3"]); }, []);
  const [run, setRun] = useState(null);    // {cx, cy, w}
  const [phase, setPhase] = useState(0);   // 0 offscreen right, 1 charge, 2 the jab beat, 3 charge off left
  const [pop, setPop] = useState(false);   // the medallion mid-POP
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
        const w = r.width;
        const cx = r.x + w / 2, cy = r.y + r.height / 2;
        setRun({ cx, cy, w });
        timers.push(setTimeout(() => {                     // CHARGE! (war drums)
          setPhase(1);
          playHeistSound("/tiki-drums-short.mp3", 0.9);
        }, 30));
        timers.push(setTimeout(() => {                     // the jab lands: POP!
          setPhase(2); setPop(true);
          med.style.visibility = "hidden"; startleTitle();
        }, 1200));
        timers.push(setTimeout(() => setPop(false), 2200));
        timers.push(setTimeout(() => setPhase(3), 2100));  // struts on out
        timers.push(setTimeout(() => {
          med.style.visibility = "";
          med.style.animation = "none";
          void med.offsetWidth; // restart the re-inflate on repeat strikes
          med.style.animation = "ffLogoReinflate 0.55s cubic-bezier(0.34,1.56,0.64,1)";
        }, 3450));
        timers.push(setTimeout(() => {
          setRun(null); setPhase(0); running = false;
          witnessRef.current(true);
          schedule(150000 + Math.random() * 150000); // again in 2.5-5 min
        }, 4300));
      });
    };
    schedule(85000 + Math.random() * 40000);
    const force = () => start(true);
    window.addEventListener("ff:spear-heist", force);
    return () => {
      clearTimeout(pending); timers.forEach(clearTimeout);
      if (cancelSummon) cancelSummon();
      window.removeEventListener("ff:spear-heist", force);
      // Never leave the logo hidden if we unmount mid-heist (theme switch).
      const img = document.querySelector('img[alt="Fork·Fate logo"]');
      if (img && img.parentElement) img.parentElement.style.visibility = "";
    };
  }, []); // witnessRef is a stable ref
  if (!run) return null;
  const { cx, cy, w } = run;
  const SH = w * 2.4;
  const SW = SH * (287 / 260); // tiki-man-spear.png natural aspect
  // He charges RIGHT-to-LEFT (sprite flipped), spear tip = LEFT edge of the
  // box, running ~47% down the art. Wrapper is positioned by its LEFT edge
  // (= the spear tip x): the tip lands right on the medallion's heart.
  const x = phase === 0 ? window.innerWidth + 60 : phase === 3 ? -(SW + w + 80) : cx - w * 0.1;
  const trans = phase === 1 ? "transform 1.15s cubic-bezier(0.3,0,0.7,1)"
    : phase === 3 ? "transform 1.2s cubic-bezier(0.55,0,0.85,0.5)" : "none";
  return (
    <div className="pointer-events-none fixed inset-0 z-[50] select-none overflow-hidden" data-testid="spear-heist">
      {/* the medallion POPPING like a balloon on the spear tip */}
      {pop && (<>
        <div className="absolute overflow-hidden bg-black ring-1 ring-white/25" style={{ left: cx - w / 2, top: cy - w / 2, width: w, height: w, borderRadius: "9999px", animation: "ffLogoPop 0.34s ease-in forwards" }} data-testid="spear-heist-logo-pop">
          <img src="/logo-tiki.png" alt="" className="h-full w-full object-contain" style={{ borderRadius: "9999px" }} />
        </div>
        <div className="absolute" style={{ left: cx, top: cy }} data-testid="spear-heist-burst">
          {Array.from({ length: 12 }, (_, i) => {
            const a = (i / 12) * Math.PI * 2;
            const d = w * (0.65 + (i % 3) * 0.24);
            return (
              <span key={`pop-${i}`} className="absolute rounded-full" style={{ width: 5 + (i % 3) * 3, height: 5 + (i % 3) * 3, "--dx": `${Math.cos(a) * d}px`, "--dy": `${Math.sin(a) * d}px`, background: i % 3 === 0 ? "radial-gradient(circle, #FFFFFF, #FBE3C0 60%, transparent 82%)" : i % 3 === 1 ? "radial-gradient(circle, #FBE3C0, #F0A24E 60%, transparent 82%)" : "radial-gradient(circle, #F0A24E, #E0451B 62%, transparent 82%)", boxShadow: "0 0 6px rgba(240,162,78,0.9)", animation: "ffPoofSparkle 0.95s ease-out forwards" }} />
            );
          })}
        </div>
      </>)}
      <div className="absolute left-0 top-0" style={{ transform: `translate(${x}px, ${cy - SH * 0.47}px)`, transition: trans }}>
        <div style={{ transform: "scaleX(-1)" }}>
          <div style={{ width: SW, height: SH, animation: phase === 1 || phase === 3 ? "ffTikiStrut 0.28s linear infinite" : undefined }}>
            <img src="/tiki-man-spear.png" alt="" className="h-full w-full object-contain" style={{ filter: "drop-shadow(0 6px 12px rgba(0,0,0,0.45))" }} />
          </div>
        </div>
      </div>
    </div>
  );
}

/** Steampunk heist: the medallion RATTLES loose, then BOINGS out of its
 * socket on a coiled brass spring like a popped watch face — wobbles there
 * a moment, then the spring gives out and it drops clean off the screen.
 * First strike 40-70s after load, then every 2.5-5 min (`ff:spring-heist`
 * forces it, used for testing). */
export function SteamSpringHeist() {
  const witnessRef = useHeistWitness("spring");
  const [run, setRun] = useState(null);     // {cx, cy, w}
  const [stage, setStage] = useState(null); // "sprung" | "fall"
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
        timers.push(setTimeout(() => {                    // the socket rattles...
          med.style.animation = "none";
          void med.offsetWidth;
          med.style.animation = "ffMedRattle 0.75s linear";
        }, 30));
        timers.push(setTimeout(() => {                    // BOING! out it pops
          med.style.visibility = "hidden"; startleTitle();
          setStage("sprung");
        }, 850));
        timers.push(setTimeout(() => setStage("fall"), 3700)); // the spring gives out
        timers.push(setTimeout(() => {
          setStage(null);
          med.style.visibility = "";
          med.style.animation = "none";
          void med.offsetWidth; // restart the pop on repeat strikes
          med.style.animation = "ffLogoReturn 0.55s cubic-bezier(0.34,1.56,0.64,1)";
        }, 4750));
        timers.push(setTimeout(() => {
          setRun(null); running = false;
          witnessRef.current(true);
          schedule(150000 + Math.random() * 150000); // again in 2.5-5 min
        }, 5500));
      });
    };
    schedule(40000 + Math.random() * 30000);
    const force = () => start(true);
    window.addEventListener("ff:spring-heist", force);
    return () => {
      clearTimeout(pending); timers.forEach(clearTimeout);
      if (cancelSummon) cancelSummon();
      window.removeEventListener("ff:spring-heist", force);
      // Never leave the logo hidden if we unmount mid-heist (theme switch).
      const img = document.querySelector('img[alt="Fork·Fate logo"]');
      if (img && img.parentElement) img.parentElement.style.visibility = "";
    };
  }, []); // witnessRef is a stable ref
  if (!run || !stage) return null;
  const { cx, cy, w } = run;
  const springH = Math.round(w * 1.15);
  return (
    <div className="pointer-events-none fixed inset-0 z-[50] select-none overflow-hidden" data-testid="spring-heist">
      {/* the BLACK HOLE left in the socket the medallion sprang out of */}
      <div className="absolute" data-testid="spring-heist-socket" style={{ left: cx - w / 2, top: cy - w / 2, width: w, height: w, borderRadius: "9999px", background: "radial-gradient(circle at 42% 36%, #171009 0%, #0A0603 45%, #000 78%)", boxShadow: "inset 0 5px 12px rgba(0,0,0,0.95), inset 0 -2px 5px rgba(0,0,0,0.85), inset 3px 0 8px rgba(0,0,0,0.7), 0 0 0 2px rgba(122,86,40,0.5)" }} />
      {/* assembly hinged at the socket: coiled spring + the popped watch face */}
      <div className="absolute" style={{ left: cx, top: cy, transformOrigin: "50% 0", animation: stage === "sprung" ? "ffSpringPop 0.5s cubic-bezier(0.34,1.56,0.64,1) both, ffSpringWobble 2.6s ease-in-out 0.5s both" : "none" }}>
        {/* the brass coil */}
        <svg width={24} height={springH} viewBox="0 0 24 70" preserveAspectRatio="none" className="absolute left-1/2 -translate-x-1/2" style={{ top: 0, transformOrigin: "50% 0", animation: stage === "fall" ? "ffSpringRecoil 0.6s ease-out forwards" : "none", filter: "drop-shadow(0 1px 2px rgba(0,0,0,0.6))" }} data-testid="spring-heist-coil">
          <path d="M12 0 C 26 5, -2 11, 12 16 C 26 21, -2 27, 12 32 C 26 37, -2 43, 12 48 C 26 53, -2 59, 12 64 L 12 70" stroke="#B98A44" strokeWidth="3.4" fill="none" strokeLinecap="round" />
        </svg>
        {/* the watch face (brass-bezel medallion) dangling at the spring's end */}
        <div className="absolute overflow-hidden bg-black" style={{ left: -w / 2, top: springH - 2, width: w, height: w, borderRadius: "9999px", boxShadow: "0 0 0 3px #B98A44, 0 6px 14px rgba(0,0,0,0.55)", animation: stage === "fall" ? "ffLogoFallOff 0.95s cubic-bezier(0.4,0,0.9,0.6) forwards" : "none" }} data-testid="spring-heist-logo">
          <img src="/logo-mark.png" alt="" className="h-full w-full scale-110 object-contain" style={{ borderRadius: "9999px" }} />
        </div>
      </div>
    </div>
  );
}

/** Steampunk heist #3 — PEEK-A-BOO: the medallion rattles and POPS clean off
 * its socket... and out of the black hole it leaves behind, the right
 * sentinel's head slowly rises — glances left, glances right — then sinks
 * back into the darkness. A fresh face pops back on after. First strike
 * ~2.5-4 min after load (staggered clear of the spring + gears heists),
 * then every 3-6 min (`ff:peek-heist` forces it, used for testing). */
export function SteamPeekHeist() {
  const witnessRef = useHeistWitness("peek");
  useEffect(() => { preloadHeistAudio(["/stash-pop.mp3", "/golem-gears.mp3", "/arm-zap.mp3", "/steam-boing.mp3"]); }, []);
  const [run, setRun] = useState(null);     // {cx, cy, w}
  const [stage, setStage] = useState(null); // "pop" | "rise" | "look" | "lock" | "duck" | "sink" | "hole"
  useEffect(() => {
    const timers = [];
    let pending = null;
    let running = false;
    let cancelSummon = null;
    const schedule = (ms) => { clearTimeout(pending); pending = setTimeout(() => start(false), ms); };
    const start = (force, forceScare) => {
      if (running) return;
      running = true;
      // JUMP-SCARE variant (~1 in 3): mid-glance he SNAPS to center, locks
      // eyes with the viewer — lenses flaring — then ducks away in a blink.
      const scare = forceScare !== undefined ? !!forceScare : Math.random() < 0.35;
      cancelSummon = summonToLogo((med) => {
        const r = med && med.getBoundingClientRect();
        if (!r || !r.width) { running = false; if (!force) schedule(30000); return; }
        setRun({ cx: r.x + r.width / 2, cy: r.y + r.height / 2, w: r.width });
        timers.push(setTimeout(() => {                    // the socket rattles...
          med.style.animation = "none";
          void med.offsetWidth;
          med.style.animation = "ffMedRattle 0.75s linear";
        }, 30));
        timers.push(setTimeout(() => {                    // POP! clean off the socket
          med.style.visibility = "hidden"; startleTitle();
          setStage("pop");
          playHeistSound("/stash-pop.mp3", 0.6);
        }, 850));
        timers.push(setTimeout(() => {                    // ...something stirs in the hole
          setStage("rise");
          playHeistSound("/golem-gears.mp3", 0.35);
        }, 1500));
        timers.push(setTimeout(() => setStage("look"), 2600)); // glances left... then right
        const finish = (holeAt, returnAt, doneAt) => {
          timers.push(setTimeout(() => setStage("hole"), holeAt)); // empty socket beat
          timers.push(setTimeout(() => {
            setStage(null); setRun(null);
            med.style.visibility = "";
            med.style.animation = "none";
            void med.offsetWidth; // a fresh face pops back on
            med.style.animation = "ffLogoReturn 0.55s cubic-bezier(0.34,1.56,0.64,1)";
          }, returnAt));
          timers.push(setTimeout(() => {
            running = false;
            witnessRef.current(true);
            schedule(180000 + Math.random() * 180000); // again in 3-6 min
          }, doneAt));
        };
        if (scare) {
          timers.push(setTimeout(() => {                  // SNAP — he's looking AT YOU
            setStage("lock");
            playHeistSound("/arm-zap.mp3", 0.3);
          }, 3550));
          timers.push(setTimeout(() => {                  // ...and DUCKS in a blink
            setStage("duck");
            playHeistSound("/steam-boing.mp3", 0.45);
          }, 4800));
          finish(5150, 5850, 6550);
        } else {
          timers.push(setTimeout(() => {                  // ...and sinks back into the dark
            setStage("sink");
            playHeistSound("/golem-gears.mp3", 0.25);
          }, 5100));
          finish(6100, 6800, 7500);
        }
      });
    };
    schedule(150000 + Math.random() * 90000);
    const force = (e) => start(true, e && e.detail ? e.detail.scare : undefined);
    window.addEventListener("ff:peek-heist", force);
    return () => {
      clearTimeout(pending); timers.forEach(clearTimeout);
      if (cancelSummon) cancelSummon();
      window.removeEventListener("ff:peek-heist", force);
      // Never leave the logo hidden if we unmount mid-heist (theme switch).
      const img = document.querySelector('img[alt="Fork·Fate logo"]');
      if (img && img.parentElement) img.parentElement.style.visibility = "";
    };
  }, []); // witnessRef is a stable ref
  if (!run || !stage) return null;
  const { cx, cy, w } = run;
  const up = stage === "rise" || stage === "look" || stage === "lock";
  return (
    <div className="pointer-events-none fixed inset-0 z-[50] select-none overflow-hidden" data-testid="peek-heist">
      {/* the medallion POPPING off + brass sparkle burst (one-shot at "pop") */}
      {stage === "pop" && (<>
        <div className="absolute overflow-hidden bg-black ring-1 ring-white/25" style={{ left: cx - w / 2, top: cy - w / 2, width: w, height: w, borderRadius: "9999px", animation: "ffLogoPop 0.4s ease-in forwards" }} data-testid="peek-heist-logo-pop">
          <img src="/logo-mark.png" alt="" className="h-full w-full scale-110 object-contain" style={{ borderRadius: "9999px" }} />
        </div>
        <div className="absolute" style={{ left: cx, top: cy }} data-testid="peek-heist-burst">
          {Array.from({ length: 10 }, (_, i) => {
            const a = (i / 10) * Math.PI * 2;
            const d = w * (0.6 + (i % 3) * 0.22);
            return (
              <span key={`pk-${i}`} className="absolute rounded-full" style={{ width: 4 + (i % 3) * 3, height: 4 + (i % 3) * 3, "--dx": `${Math.cos(a) * d}px`, "--dy": `${Math.sin(a) * d}px`, background: i % 2 ? "radial-gradient(circle, #F1D9A6, #D9A44E 60%, transparent 82%)" : "radial-gradient(circle, #FFFFFF, #B98A44 60%, transparent 82%)", boxShadow: "0 0 6px rgba(217,164,78,0.9)", animation: "ffPoofSparkle 0.9s ease-out forwards" }} />
            );
          })}
        </div>
      </>)}
      {/* the BLACK HOLE left in the socket — the head peeks out of THIS */}
      <div className="absolute overflow-hidden" data-testid="peek-heist-socket" style={{ left: cx - w / 2, top: cy - w / 2, width: w, height: w, borderRadius: "9999px", background: "radial-gradient(circle at 42% 36%, #171009 0%, #0A0603 45%, #000 78%)", boxShadow: "inset 0 5px 12px rgba(0,0,0,0.95), inset 0 -2px 5px rgba(0,0,0,0.85), inset 3px 0 8px rgba(0,0,0,0.7), 0 0 0 2px rgba(122,86,40,0.5)" }}>
        {/* the right sentinel's head: rises from the darkness, then the
            look animation swivels it left and right */}
        <div className="absolute" data-testid="peek-heist-head" style={{
          left: "14%", top: "6%", width: "72%",
          transform: up ? "translateY(0)" : "translateY(150%)",
          transition: stage === "rise" ? "transform 1s cubic-bezier(0.3,0,0.4,1)"
            : stage === "sink" ? "transform 0.9s cubic-bezier(0.55,0,0.85,0.6)"
            : stage === "duck" ? "transform 0.25s cubic-bezier(0.6,0,1,0.6)" : "none",
        }}>
          <div className="relative" style={{ animation: stage === "look" ? "ffPeekLook 2.4s ease-in-out forwards" : stage === "lock" ? "ffPeekLock 1.25s cubic-bezier(0.2,1.2,0.4,1) forwards" : "none" }}>
            <img src="/steam-peek-head.png" alt="" className="w-full object-contain" style={{ filter: stage === "lock" ? "brightness(1) drop-shadow(0 0 10px rgba(124,224,138,0.5))" : "brightness(0.85) drop-shadow(0 0 6px rgba(124,224,138,0.25))", transition: "filter 0.2s ease" }} />
            {/* JUMP-SCARE: both lenses FLARE while he's staring you down */}
            {stage === "lock" && (
              <div data-testid="peek-scare-eyes">
                <span className="absolute rounded-full" style={{ left: "25%", top: "56.5%", width: "18%", aspectRatio: "1", background: "radial-gradient(circle, rgba(210,255,220,1), rgba(110,240,150,0.65) 52%, transparent 78%)", mixBlendMode: "screen", filter: "blur(1px)", animation: "ffPeekEyeFlare 1.25s ease-out forwards" }} />
                <span className="absolute rounded-full" style={{ left: "62.5%", top: "56.5%", width: "18%", aspectRatio: "1", background: "radial-gradient(circle, rgba(210,255,220,1), rgba(110,240,150,0.65) 52%, transparent 78%)", mixBlendMode: "screen", filter: "blur(1px)", animation: "ffPeekEyeFlare 1.25s ease-out 0.05s forwards" }} />
              </div>
            )}
          </div>
        </div>
        {/* faint green eye-glow wash breathing while he's up (surges on lock) */}
        <div className="absolute inset-0 rounded-full" style={{ background: stage === "lock" ? "radial-gradient(circle at 50% 58%, rgba(124,224,138,0.32), transparent 66%)" : "radial-gradient(circle at 50% 62%, rgba(124,224,138,0.16), transparent 62%)", mixBlendMode: "screen", opacity: up ? 1 : 0, transition: "opacity 0.8s ease, background 0.25s ease" }} />
      </div>
    </div>
  );
}


function BrassGear({ size, color = "#B98A44", dur = 4, rev = false, anim, style = {} }) {
  return (
    <div className="absolute" style={{ width: size, height: size, animation: anim !== undefined ? anim : `ffSpin ${dur}s linear infinite ${rev ? "reverse" : ""}`, ...style }}>
      <svg viewBox="0 0 100 100" className="h-full w-full">
        {Array.from({ length: 8 }, (_, i) => (
          <rect key={i} x={44} y={2} width={12} height={18} rx={2.5} fill={color} transform={`rotate(${i * 45} 50 50)`} />
        ))}
        <circle cx="50" cy="50" r="34" fill={color} />
        <circle cx="50" cy="50" r="12" fill="#1A120A" />
      </svg>
    </div>
  );
}

/** Steampunk heist #2: the medallion swings open like a pocket-watch DOOR,
 * baring live spinning gearworks — until the works BREAK: gears grind to a
 * jam, one pops out with a screw, smoke coughs up... then the door drops
 * clean off its hinge and every gear and the mainspring spill out of the
 * bare socket. A fresh face pops back on after. First strike 110-150s after
 * load (staggered clear of the spring), then every 2.5-5 min
 * (`ff:gears-heist` forces it, used for testing). */
export function SteamGearsHeist() {
  const witnessRef = useHeistWitness("gears");
  useEffect(() => { preloadHeistAudio(["/steam-gears-run.mp3", "/steam-boing.mp3"]); }, []);
  const [run, setRun] = useState(null);     // {cx, cy, w}
  const [stage, setStage] = useState(null); // "open" | "break" | "collapse"
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
        const clank = (src, vol) => playHeistSound(src, vol);
        timers.push(setTimeout(() => {                    // the case creaks open
          med.style.visibility = "hidden"; startleTitle();
          setStage("open");
          clank("/steam-gears-run.mp3", 0.7); // the works whirring away (runs up to the break)
        }, 30));
        timers.push(setTimeout(() => {                    // the works give out — BOING
          setStage("break");
          clank("/steam-boing.mp3", 0.75);
        }, 2900));
        timers.push(setTimeout(() => setStage("collapse"), 4400)); // door off, gears spill
        timers.push(setTimeout(() => {
          setStage(null); setRun(null);
          med.style.visibility = "";
          med.style.animation = "none";
          void med.offsetWidth; // a fresh face pops back on
          med.style.animation = "ffLogoReturn 0.55s cubic-bezier(0.34,1.56,0.64,1)";
        }, 6200));
        timers.push(setTimeout(() => {
          running = false;
          witnessRef.current(true);
          schedule(150000 + Math.random() * 150000); // again in 2.5-5 min
        }, 6900));
      });
    };
    schedule(110000 + Math.random() * 40000);
    const force = () => start(true);
    window.addEventListener("ff:gears-heist", force);
    return () => {
      clearTimeout(pending); timers.forEach(clearTimeout);
      if (cancelSummon) cancelSummon();
      window.removeEventListener("ff:gears-heist", force);
      // Never leave the logo hidden if we unmount mid-heist (theme switch).
      const img = document.querySelector('img[alt="Fork·Fate logo"]');
      if (img && img.parentElement) img.parentElement.style.visibility = "";
    };
  }, []); // witnessRef is a stable ref
  if (!run || !stage) return null;
  const { cx, cy, w } = run;
  const jam = stage !== "open" ? "ffGearJam 0.5s ease-out forwards" : undefined;
  return (
    <div className="pointer-events-none fixed inset-0 z-[50] select-none overflow-hidden" data-testid="gears-heist">
      {/* broken bits flying out of the works */}
      {stage === "break" && (<>
        <div className="absolute" style={{ left: cx, top: cy, animation: "ffPartFly 1.2s cubic-bezier(0.3,0,0.8,0.6) forwards" }} data-testid="gears-heist-flying-gear">
          <BrassGear size={w * 0.3} dur={0.5} anim={undefined} style={{ position: "relative" }} />
        </div>
        <div className="absolute rounded-full" style={{ left: cx - 4, top: cy - 4, width: 9, height: 9, background: "radial-gradient(circle at 35% 35%, #E8C588, #8A6428)", animation: "ffPartFly2 1s cubic-bezier(0.3,0,0.8,0.6) forwards" }} />
        {[0, 1, 2].map((i) => (
          <span key={`bp-${i}`} className="absolute rounded-full" style={{ left: cx - 8 + i * 9, top: cy - w * 0.42, width: 13 + i * 4, height: 13 + i * 4, background: "radial-gradient(circle, rgba(225,220,210,0.75), rgba(160,155,148,0.3) 55%, transparent 75%)", filter: "blur(1.5px)", mixBlendMode: "screen", animation: `ffBreakPuff 1.3s ease-out ${i * 0.35}s infinite` }} />
        ))}
      </>)}
      {/* the grand collapse: the door drops off its hinge, then every gear
          and the mainspring tumble out of the bare socket one by one */}
      {stage === "collapse" && (<>
        <div className="absolute" style={{ left: cx - w / 2 + w * 0.04, top: cy - w / 2 + w * 0.24, animation: "ffGearDrop 0.95s cubic-bezier(0.4,0,0.9,0.6) 0.25s both" }}>
          <BrassGear size={w * 0.56} anim="none" style={{ position: "relative" }} />
        </div>
        <div className="absolute" style={{ left: cx - w / 2 + w * 0.5, top: cy - w / 2 + w * 0.08, animation: "ffGearDrop 0.95s cubic-bezier(0.4,0,0.9,0.6) 0.5s both" }}>
          <BrassGear size={w * 0.42} color="#D9A44E" anim="none" style={{ position: "relative" }} />
        </div>
        <svg viewBox="0 0 24 70" className="absolute" style={{ left: cx - w / 2 + w * 0.16, top: cy - w / 2 + w * 0.6, width: w * 0.14, height: w * 0.34, rotate: "90deg", animation: "ffGearDrop 0.95s cubic-bezier(0.4,0,0.9,0.6) 0.72s both" }}>
          <path d="M12 0 C 26 5, -2 11, 12 16 C 26 21, -2 27, 12 32 C 26 37, -2 43, 12 48 C 26 53, -2 59, 12 64 L 12 70" stroke="#B98A44" strokeWidth="4" fill="none" strokeLinecap="round" />
        </svg>
      </>)}
      {/* the opened case, hinged at its LEFT edge like a pocket watch */}
      <div className="absolute" style={{ left: cx - w / 2, top: cy - w / 2, width: w, height: w, perspective: "600px" }}>
        {/* the works: spinning brass gears inside the case */}
        <div className="absolute inset-0 overflow-hidden ring-1 ring-[#B98A44]" style={{ borderRadius: "9999px", background: "radial-gradient(circle at 40% 35%, #241708, #120B05 75%)", boxShadow: "inset 0 2px 8px rgba(0,0,0,0.9)" }} data-testid="gears-heist-works">
          {stage !== "collapse" && (<>
            <BrassGear size={w * 0.56} dur={5} anim={jam} style={{ left: w * 0.04, top: w * 0.24 }} />
            <BrassGear size={w * 0.42} dur={3.6} rev color="#D9A44E" anim={jam} style={{ left: w * 0.5, top: w * 0.08 }} />
            {/* the mainspring coiled at the bottom of the works */}
            <svg viewBox="0 0 24 70" className="absolute" style={{ left: w * 0.16, top: w * 0.6, width: w * 0.14, height: w * 0.34, transform: "rotate(90deg)" }}>
              <path d="M12 0 C 26 5, -2 11, 12 16 C 26 21, -2 27, 12 32 C 26 37, -2 43, 12 48 C 26 53, -2 59, 12 64 L 12 70" stroke="#B98A44" strokeWidth="4" fill="none" strokeLinecap="round" />
            </svg>
          </>)}
          {/* the little gear vacates its post when the works break */}
          {stage === "open" && <BrassGear size={w * 0.32} dur={2.6} style={{ left: w * 0.56, top: w * 0.55 }} />}
          {/* glint sweeping across the works (stops when broken) */}
          {stage === "open" && <div className="absolute inset-0" style={{ background: "linear-gradient(115deg, transparent 30%, rgba(255,226,160,0.22) 46%, transparent 60%)", animation: "ffTikiTwinkle 2.2s ease-in-out infinite" }} />}
        </div>
        {/* the logo DOOR: hinged open — and it drops clean off in the collapse */}
        <div className="absolute inset-0" style={{ animation: stage === "collapse" ? "ffDoorFall 1.05s cubic-bezier(0.4,0,0.9,0.6) forwards" : "none" }}>
          <div className="absolute inset-0" style={{ transformStyle: "preserve-3d", transformOrigin: "0% 50%", animation: "ffLidOpen 0.9s cubic-bezier(0.34,1.56,0.64,1) forwards" }} data-testid="gears-heist-lid">
            <div className="absolute inset-0 overflow-hidden bg-black" style={{ borderRadius: "9999px", backfaceVisibility: "hidden", boxShadow: "0 0 0 2px #B98A44, 0 6px 14px rgba(0,0,0,0.55)" }}>
              <img src="/logo-mark.png" alt="" className="h-full w-full scale-110 object-contain" style={{ borderRadius: "9999px" }} />
            </div>
            <div className="absolute inset-0" style={{ borderRadius: "9999px", transform: "rotateY(180deg)", backfaceVisibility: "hidden", background: "radial-gradient(circle at 45% 40%, #C89A54, #8A6428 78%)", boxShadow: "0 0 0 2px #B98A44" }} />
          </div>
        </div>
      </div>
    </div>
  );
}


/** Café heist: a runaway cup of hot coffee slides onto the banner, tips over
 * and pours — the spill washes under the medallion and MELTS it away like a
 * sugar cube (squash + drips), then the cup slinks off still tipped and the
 * logo re-forms. First strike 30-50s after load, then every 2.5-5 min
 * (`ff:coffee-heist` forces it, used for testing). Cup art 220x135, side
 * view, handle right. */
export function CoffeeSpillHeist() {
  const witnessRef = useHeistWitness("coffee");
  const [run, setRun] = useState(null);    // {cx, cy, w}
  const [phase, setPhase] = useState(0);   // 0 offscreen right, 1 slid in, 2 tipped + pouring, 4 slinks off
  const [melt, setMelt] = useState(false); // the medallion mid-melt
  const [fade, setFade] = useState(false); // spill evaporating
  useEffect(() => {
    ["/cafe-cup-side.png"].forEach((s) => { const im = new Image(); im.src = s; });
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
        timers.push(setTimeout(() => setPhase(1), 30));      // slides in beside the logo
        timers.push(setTimeout(() => setPhase(2), 1450));    // tips over — the pour begins
        timers.push(setTimeout(() => {                       // the spill reaches the medallion: MELT
          setMelt(true);
          med.style.visibility = "hidden"; startleTitle();
        }, 2450));
        timers.push(setTimeout(() => { setMelt(false); setFade(true); }, 4500)); // dissolved; spill dries up
        timers.push(setTimeout(() => setPhase(4), 5200));    // the cup slinks away, still tipped
        timers.push(setTimeout(() => {
          med.style.visibility = "";
          med.style.animation = "none";
          void med.offsetWidth; // restart the pop on repeat strikes
          med.style.animation = "ffLogoReturn 0.55s cubic-bezier(0.34,1.56,0.64,1)";
        }, 5700));
        timers.push(setTimeout(() => {
          setRun(null); setPhase(0); setFade(false); running = false;
          witnessRef.current(true);
          schedule(150000 + Math.random() * 150000); // spills again in 2.5-5 min
        }, 6900));
      });
    };
    schedule(30000 + Math.random() * 20000);
    const force = () => start(true);
    window.addEventListener("ff:coffee-heist", force);
    return () => {
      clearTimeout(pending); timers.forEach(clearTimeout);
      if (cancelSummon) cancelSummon();
      window.removeEventListener("ff:coffee-heist", force);
      // Never leave the logo hidden if we unmount mid-heist (theme switch).
      const img = document.querySelector('img[alt="Fork·Fate logo"]');
      if (img && img.parentElement) img.parentElement.style.visibility = "";
    };
  }, []); // witnessRef is a stable ref
  if (!run) return null;
  const { cx, cy, w } = run;
  const cupW = w * 1.55, cupH = cupW * (135 / 220);
  const cupLeft = cx + w * 0.72, cupTop = cy - cupH * 0.62;
  const slideX = phase === 0 ? window.innerWidth - cupLeft + 80 : phase === 4 ? window.innerWidth - cupLeft + 120 : 0;
  return (
    <div className="pointer-events-none fixed inset-0 z-[50] select-none overflow-hidden" data-testid="coffee-heist">
      {/* the pour: a thin stream falling from the tipped lip toward the logo */}
      {phase >= 2 && (
        <div
          className="absolute"
          data-testid="coffee-heist-stream"
          style={{
            left: cx + w * 0.42, top: cy - w * 0.52, width: 7, height: w * 0.82,
            transformOrigin: "50% 0%", borderRadius: 4,
            background: "linear-gradient(180deg, #6B4226, #8A5A2E 55%, #A06B38)",
            boxShadow: "0 0 6px rgba(138,90,46,0.55)",
            animation: "ffCoffeeStream 0.5s ease-out forwards",
            opacity: fade ? 0 : undefined, transition: "opacity 0.5s ease-out",
          }}
        />
      )}
      {/* the spreading puddle washing across under the title */}
      {phase >= 2 && (
        <div
          className="absolute"
          data-testid="coffee-heist-puddle"
          style={{
            left: cx - w * 1.5, top: cy + w * 0.22, width: w * 3, height: w * 0.55,
            borderRadius: "9999px",
            background: "radial-gradient(ellipse at 60% 40%, rgba(160,107,56,0.9), rgba(138,90,46,0.8) 55%, rgba(107,66,38,0.5) 80%, rgba(107,66,38,0) 100%)",
            boxShadow: "inset 0 2px 6px rgba(255,240,220,0.35)",
            animation: "ffPuddleSpread 1.5s cubic-bezier(0.2,0.7,0.3,1) forwards",
            opacity: fade ? 0 : undefined, transition: "opacity 0.8s ease-out",
          }}
        />
      )}
      {/* the medallion melting like a sugar cube */}
      {melt && (
        <>
          <div
            className="absolute overflow-hidden bg-[#F5F0E6] ring-1 ring-[#E4E4E7]"
            data-testid="coffee-heist-logo-melt"
            style={{
              left: cx - w / 2, top: cy - w / 2, width: w, height: w, borderRadius: "9999px",
              transformOrigin: "50% 100%",
              animation: "ffLogoMelt 1.9s cubic-bezier(0.45,0,0.6,1) forwards",
            }}
          >
            <img src="/logo-mark-light.png" alt="" className="h-full w-full scale-110 object-contain" style={{ borderRadius: "9999px" }} />
          </div>
          {/* syrupy drips sliding off the melting face */}
          {Array.from({ length: 4 }, (_, i) => (
            <span
              key={`drip-${i}`}
              className="absolute rounded-full"
              style={{
                left: cx - w * 0.32 + i * w * 0.21, top: cy + w * 0.32,
                width: 6 + (i % 2) * 3, height: 16 + (i % 3) * 8,
                background: "linear-gradient(180deg, #A06B38, #6B4226)",
                "--fall": `${w * (0.5 + (i % 3) * 0.22)}px`,
                animation: `ffMeltDrip 1.15s ease-in ${0.25 + i * 0.18}s forwards`,
                opacity: 0,
              }}
            />
          ))}
        </>
      )}
      {/* the runaway cup — slides in upright, tips, and slinks off still tipped */}
      <div className="absolute left-0 top-0" style={{ transform: `translate(${cupLeft + slideX}px, ${cupTop}px)`, transition: phase === 1 || phase === 2 ? "transform 1.0s cubic-bezier(0.25,0.9,0.35,1)" : phase === 4 ? "transform 1.1s cubic-bezier(0.5,0.05,0.85,0.5)" : "none" }} data-testid="coffee-heist-cup">
        <div style={{ width: cupW, height: cupH, transformOrigin: "14% 86%", animation: phase >= 2 ? "ffCupTipOver 0.75s cubic-bezier(0.5,0,0.6,1.2) forwards" : undefined }}>
          <img src="/cafe-cup-side.png" alt="" className="h-full w-full object-contain" style={{ filter: "drop-shadow(0 5px 10px rgba(90,60,30,0.35))" }} />
        </div>
        {/* wisp of steam while it's still upright */}
        {phase < 2 && (
          <span className="absolute rounded-full" style={{ left: cupW * 0.42, top: -cupH * 0.3, width: 8, height: 22, background: "linear-gradient(180deg, rgba(255,255,255,0), rgba(255,255,255,0.55))", filter: "blur(2px)", animation: "ffSteam 1.6s ease-in-out infinite" }} />
        )}
      </div>
    </div>
  );
}

/** Dark-realm heist: the little reaper drifts up beside the medallion and —
 * one flick of dark magic — transmutes it into the very plate of glowing food
 * his master is holding. Dinner hovers there a few beats, then he flicks it
 * back and drifts off. First strike 35-60s after load, then every 2.5-5 min
 * (`ff:plate-heist` forces it, used for testing). Plate art 300x180, cut
 * straight from the big reaper's hands. */
export function ReaperPlateHeist() {
  const witnessRef = useHeistWitness("plate");
  const [run, setRun] = useState(null);    // {cx, cy, w}
  const [phase, setPhase] = useState(0);   // 0 offscreen left, 1 hover beside logo, 4 drift off right
  const [plate, setPlate] = useState(false);
  const [burst, setBurst] = useState(0);   // sparkle burst counter (0 none, 1 cast, 2 revert)
  useEffect(() => {
    ["/reaper-plate.png", "/reaper-fly-1.png", "/reaper-fly-2.png"].forEach((s) => { const im = new Image(); im.src = s; });
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
        timers.push(setTimeout(() => setPhase(1), 30));      // drifts in beside the logo
        timers.push(setTimeout(() => setBurst(1), 1550));    // the cast: dark sparkles swirl
        timers.push(setTimeout(() => {                       // ...and dinner is served
          setPlate(true);
          med.style.visibility = "hidden"; startleTitle();
        }, 1800));
        timers.push(setTimeout(() => setBurst(2), 5100));    // the counter-spell
        timers.push(setTimeout(() => {
          setPlate(false);
          med.style.visibility = "";
          med.style.animation = "none";
          void med.offsetWidth; // restart the pop on repeat strikes
          med.style.animation = "ffLogoReturn 0.55s cubic-bezier(0.34,1.56,0.64,1)";
        }, 5350));
        timers.push(setTimeout(() => setPhase(4), 5900));    // drifts away, work done
        timers.push(setTimeout(() => {
          setRun(null); setPhase(0); setBurst(0); running = false;
          witnessRef.current(true);
          schedule(150000 + Math.random() * 150000); // serves again in 2.5-5 min
        }, 7300));
      });
    };
    schedule(35000 + Math.random() * 25000);
    const force = () => start(true);
    window.addEventListener("ff:plate-heist", force);
    return () => {
      clearTimeout(pending); timers.forEach(clearTimeout);
      if (cancelSummon) cancelSummon();
      window.removeEventListener("ff:plate-heist", force);
      // Never leave the logo hidden if we unmount mid-heist (theme switch).
      const img = document.querySelector('img[alt="Fork·Fate logo"]');
      if (img && img.parentElement) img.parentElement.style.visibility = "";
    };
  }, []); // witnessRef is a stable ref
  if (!run) return null;
  const { cx, cy, w } = run;
  const RW = w * 1.45, RH = RW * (260 / 195);
  const hoverLeft = cx - w * 0.85 - RW, hoverTop = cy - RH * 0.5;
  const x = phase === 0 ? -(hoverLeft + RW + 90) : phase === 4 ? window.innerWidth - hoverLeft + 90 : 0;
  const PW = w * 1.85, PH = PW * (180 / 300);
  return (
    <div className="pointer-events-none fixed inset-0 z-[50] select-none overflow-hidden" data-testid="plate-heist">
      {/* dark-magic sparkles swirling off the medallion */}
      {burst > 0 && (
        <div key={`burst-${burst}`} className="absolute" style={{ left: cx, top: cy }} data-testid="plate-heist-burst">
          {Array.from({ length: 12 }, (_, i) => {
            const a = (i / 12) * Math.PI * 2;
            const d = w * (0.6 + (i % 3) * 0.24);
            return (
              <span key={`spark-${i}`} className="absolute rounded-full" style={{ width: 5 + (i % 3) * 3, height: 5 + (i % 3) * 3, "--dx": `${Math.cos(a) * d}px`, "--dy": `${Math.sin(a) * d}px`, background: i % 3 === 0 ? "radial-gradient(circle, #E8DFFF, #8E7BB8 60%, transparent 82%)" : i % 3 === 1 ? "radial-gradient(circle, #FF9A8E, #E01E26 60%, transparent 82%)" : "radial-gradient(circle, #B8A8E0, #2A2038 62%, transparent 82%)", boxShadow: "0 0 7px rgba(142,123,184,0.85)", animation: "ffPoofSparkle 0.95s ease-out forwards" }} />
            );
          })}
        </div>
      )}
      {/* dinner, served in the medallion's place — hovering with a hungry glow */}
      {plate && (
        <div className="absolute" style={{ left: cx - PW / 2, top: cy - PH / 2, width: PW, height: PH, animation: "ffPixieBob 3.2s ease-in-out infinite" }} data-testid="plate-heist-plate">
          <img src="/reaper-plate.png" alt="" className="h-full w-full object-contain" style={{ animation: "ffPlateReveal 0.55s cubic-bezier(0.34,1.56,0.64,1) both, ffPlateGlow 1.7s ease-in-out 0.55s infinite" }} />
        </div>
      )}
      {/* the little reaper, hovering beside his handiwork */}
      <div className="absolute left-0 top-0" style={{ transform: `translate(${hoverLeft + x}px, ${hoverTop}px)`, transition: phase === 1 ? "transform 1.25s cubic-bezier(0.25,0.9,0.35,1)" : phase === 4 ? "transform 1.25s cubic-bezier(0.5,0.05,0.85,0.5)" : "none" }} data-testid="plate-heist-reaper">
        <div className="relative" style={{ width: RW, height: RH, animation: "ffPixieBob 3.6s ease-in-out infinite", filter: "drop-shadow(0 0 9px rgba(140,110,200,0.45))" }}>
          <img src="/reaper-fly-1.png" alt="" className="absolute inset-0 h-full w-full object-contain" style={{ animation: "ffReaperFrameInv 2.6s ease-in-out infinite" }} />
          <img src="/reaper-fly-2.png" alt="" className="absolute inset-0 h-full w-full object-contain" style={{ animation: "ffReaperFrame 2.6s ease-in-out infinite" }} />
        </div>
      </div>
    </div>
  );
}

/** Fairy Gully heist: a white unicorn thunders across the banner right-to-left
 * and punts the medallion clean off the screen with its golden horn, never
 * breaking stride. First strike 40-65s after load, then every 2.5-5 min
 * (`ff:unicorn-heist` forces it, used for testing). Unicorn art 360x177
 * galloping LEFT, horn tip at (1.5%, 30%) of the sprite box. */
export function UnicornChargeHeist() {
  const witnessRef = useHeistWitness("unicorn");
  const [run, setRun] = useState(null);    // {cx, cy, w}
  const [phase, setPhase] = useState(0);   // 0 offscreen right, 1 charge, 3 gallop off left
  const [knock, setKnock] = useState(false);
  useEffect(() => {
    ["/fairy-unicorn.png"].forEach((s) => { const im = new Image(); im.src = s; });
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
        timers.push(setTimeout(() => setPhase(1), 30));      // CHARGE!
        timers.push(setTimeout(() => {                       // the horn connects: PUNT
          setKnock(true);
          med.style.visibility = "hidden"; startleTitle();
        }, 1080));
        timers.push(setTimeout(() => setPhase(3), 1150));    // never breaks stride
        timers.push(setTimeout(() => setKnock(false), 2050));
        timers.push(setTimeout(() => {
          med.style.visibility = "";
          med.style.animation = "none";
          void med.offsetWidth; // restart the pop on repeat strikes
          med.style.animation = "ffLogoReturn 0.55s cubic-bezier(0.34,1.56,0.64,1)";
        }, 2650));
        timers.push(setTimeout(() => {
          setRun(null); setPhase(0); running = false;
          witnessRef.current(true);
          schedule(150000 + Math.random() * 150000); // charges again in 2.5-5 min
        }, 3600));
      });
    };
    schedule(40000 + Math.random() * 25000);
    const force = () => start(true);
    window.addEventListener("ff:unicorn-heist", force);
    return () => {
      clearTimeout(pending); timers.forEach(clearTimeout);
      if (cancelSummon) cancelSummon();
      window.removeEventListener("ff:unicorn-heist", force);
      // Never leave the logo hidden if we unmount mid-heist (theme switch).
      const img = document.querySelector('img[alt="Fork·Fate logo"]');
      if (img && img.parentElement) img.parentElement.style.visibility = "";
    };
  }, []); // witnessRef is a stable ref
  if (!run) return null;
  const { cx, cy, w } = run;
  const UW = w * 3.0, UH = UW * (177 / 360);
  // Gallops RIGHT-to-LEFT; horn tip = (1.5%, 30%) of the box, so the wrapper
  // sits so the tip lands square on the medallion's heart at impact.
  const x = phase === 0 ? window.innerWidth + 80 : phase === 3 ? -(UW + 140) : cx - UW * 0.015;
  const trans = phase === 1 ? "transform 1.05s cubic-bezier(0.3,0,0.7,1)"
    : phase === 3 ? "transform 1.05s cubic-bezier(0.55,0,0.85,0.5)" : "none";
  return (
    <div className="pointer-events-none fixed inset-0 z-[50] select-none overflow-hidden" data-testid="unicorn-heist">
      {/* the punted medallion, spinning away off the left edge */}
      {knock && (<>
        <div className="absolute overflow-hidden bg-black ring-2 ring-[#E6B23A]" style={{ left: cx - w / 2, top: cy - w / 2, width: w, height: w, borderRadius: "9999px", animation: "ffLogoKnockL 0.9s cubic-bezier(0.25,0.8,0.5,1) forwards" }} data-testid="unicorn-heist-logo">
          <img src="/logo-mark.png" alt="" className="h-full w-full scale-110 object-contain" style={{ borderRadius: "9999px", filter: "hue-rotate(115deg) saturate(1.25) brightness(1.05)" }} />
        </div>
        {/* fae sparkles bursting off the horn strike */}
        <div className="absolute" style={{ left: cx, top: cy }} data-testid="unicorn-heist-burst">
          {Array.from({ length: 12 }, (_, i) => {
            const a = (i / 12) * Math.PI * 2;
            const d = w * (0.65 + (i % 3) * 0.24);
            return (
              <span key={`fae-${i}`} className="absolute rounded-full" style={{ width: 5 + (i % 3) * 3, height: 5 + (i % 3) * 3, "--dx": `${Math.cos(a) * d}px`, "--dy": `${Math.sin(a) * d}px`, background: i % 3 === 0 ? "radial-gradient(circle, #FFFFFF, #FFF3C4 60%, transparent 82%)" : i % 3 === 1 ? "radial-gradient(circle, #FFF3C4, #E6B23A 60%, transparent 82%)" : "radial-gradient(circle, #C4FFE0, #5EE0A8 62%, transparent 82%)", boxShadow: "0 0 7px rgba(230,178,58,0.9)", animation: "ffPoofSparkle 0.95s ease-out forwards" }} />
            );
          })}
        </div>
      </>)}
      {/* the unicorn at full gallop */}
      <div className="absolute left-0 top-0" style={{ transform: `translate(${x}px, ${cy - UH * 0.3}px)`, transition: trans }} data-testid="unicorn-heist-runner">
        <div style={{ width: UW, height: UH, animation: phase === 1 || phase === 3 ? "ffTikiStrut 0.32s linear infinite" : undefined }}>
          <img src="/fairy-unicorn.png" alt="" className="h-full w-full object-contain" style={{ filter: "drop-shadow(0 6px 14px rgba(20,40,30,0.45)) drop-shadow(0 0 10px rgba(94,224,168,0.35))" }} />
        </div>
      </div>
    </div>
  );
}

/** Cyberscape heist: HOT PURSUIT. The police chase screams LEFT-to-RIGHT
 * across the header under full siren, doubles back on the medallion's line —
 * and the fleeing car slams nose-first into the logo, knocking it clean off
 * the screen. The wreck sputters and coughs smoke while the cruiser skids to
 * a stop beside it, lights strobing... then the wreck tumbles out of the sky
 * and the unit peels off. First strike 35-60s after load, then every
 * 2.5-5 min (`ff:pursuit-heist` forces it, used for testing).
 * Prey art /cyber-car.png faces RIGHT (1264x848 box, visible car x 8.6-93.3%,
 * visual centre y ~49%); cruiser art 900x349 full-bleed, both facings. */
export function HotPursuitHeist() {
  const witnessRef = useHeistWitness("pursuit");
  const witnessTow = useHeistWitness("tow");
  const [run, setRun] = useState(null);  // {cx, cy, w}
  const [ph, setPh] = useState(0);       // 0 staged L, 1 first pass ->R, 2 restage R, 3 return+impact, 4 wreck falls, 5 unit flees | tow: 6 wrecker cruises across past cop+wreck, 7 backs up beeping, 8 hooked, 9 hauling, 10 unit flees
  const [variant, setVariant] = useState("fall"); // "fall" | rare "tow" cameo
  const [crash, setCrash] = useState(false);
  useEffect(() => {
    preloadHeistAudio(["/police-siren.mp3", "/logo-crash.mp3", "/tow-reverse-beep.wav"]);
    ["/cyber-car.png", "/cyber-police.png", "/cyber-police-left.png", "/cyber-tow.png"].forEach((s) => { const im = new Image(); im.src = s; });
    const timers = [];
    let pending = null;
    let running = false;
    let cancelSummon = null;
    const schedule = (ms) => { clearTimeout(pending); pending = setTimeout(() => start(false), ms); };
    const start = (force, forcedVariant) => {
      if (running) return;
      running = true;
      cancelSummon = summonToLogo((med) => {
        const r = med && med.getBoundingClientRect();
        if (!r || !r.width) { running = false; if (!force) schedule(30000); return; }
        const v = forcedVariant || (Math.random() < 0.35 ? "tow" : "fall");
        setVariant(v);
        setRun({ cx: r.x + r.width / 2, cy: r.y + r.height / 2, w: r.width });
        playHeistSound("/police-siren.mp3", 0.55);
        timers.push(setTimeout(() => setPh(1), 30));       // first pass, L->R
        timers.push(setTimeout(() => setPh(2), 2450));     // restage offscreen right, crash lane
        timers.push(setTimeout(() => setPh(3), 2600));     // doubles back, full speed at the logo
        timers.push(setTimeout(() => {                     // CRUNCH
          setCrash(true);
          playHeistSound("/logo-crash.mp3", 0.85);
          med.style.visibility = "hidden"; startleTitle();
        }, 3750));
        const logoBack = () => {
          med.style.visibility = "";
          med.style.animation = "none";
          void med.offsetWidth; // restart the pop on repeat strikes
          med.style.animation = "ffLogoReturn 0.55s cubic-bezier(0.34,1.56,0.64,1)";
        };
        const wrap = (doneMs, witness) => {
          timers.push(setTimeout(() => {
            setRun(null); setPh(0); setCrash(false); running = false;
            witness();
            schedule(150000 + Math.random() * 150000); // strikes again in 2.5-5 min
          }, doneMs));
        };
        if (v === "tow") {
          timers.push(setTimeout(() => setPh(6), 5700));   // wrecker cruises across the banner, past the cop + wreck
          timers.push(setTimeout(() => {                   // backs up to the wreck, alarm beeping
            setPh(7);
            playHeistSound("/tow-reverse-beep.wav", 0.5);
          }, 9400));
          timers.push(setTimeout(() => setPh(8), 12200));  // tow line hooks on
          timers.push(setTimeout(() => setPh(9), 12800));  // hauls the smoking wreck away
          timers.push(setTimeout(() => setPh(10), 14600)); // the unit peels off
          timers.push(setTimeout(logoBack, 15200));
          wrap(16200, () => { witnessTow.current(true); witnessRef.current(false); });
        } else {
          timers.push(setTimeout(() => setPh(4), 5700));   // the wreck drops out of the sky
          timers.push(setTimeout(() => setPh(5), 6800));   // the unit peels off
          timers.push(setTimeout(logoBack, 7400));
          wrap(8400, () => witnessRef.current(true));
        }
      });
    };
    schedule(35000 + Math.random() * 25000);
    const force = (e) => start(true, e && e.detail ? e.detail.variant : undefined);
    window.addEventListener("ff:pursuit-heist", force);
    return () => {
      clearTimeout(pending); timers.forEach(clearTimeout);
      if (cancelSummon) cancelSummon();
      window.removeEventListener("ff:pursuit-heist", force);
      // Never leave the logo hidden if we unmount mid-heist (theme switch).
      const img = document.querySelector('img[alt="Fork·Fate logo"]');
      if (img && img.parentElement) img.parentElement.style.visibility = "";
    };
  }, []); // witnessRef is a stable ref
  if (!run) return null;
  const { cx, cy, w } = run;
  const vw = window.innerWidth;
  const PW = w * 2.1, PH = PW * (848 / 1264);   // prey box (art has transparent padding)
  const CW = w * 1.6, CH = CW * (349 / 900);    // cruiser box (full-bleed art)
  const TW = w * 2.6, TH = TW * (624 / 1527);   // hover wrecker (rare tow cameo)
  // Lane 1 (first pass) sweeps just under the medallion; lane 2 is dead on it.
  const y1p = cy + w * 0.75 - PH * 0.49, y1c = cy + w * 0.82 - CH * 0.5;
  const y2p = cy - PH * 0.49, y2c = cy + w * 0.07 - CH * 0.5;
  const crashX = cx - PW * 0.067;               // flipped nose lands square on the medallion heart
  const towX = cx + w * 0.06 - TW * 0.97;       // wrecker parks so its boom hook lands on the wreck's nose
  const towY = (cy - PH * 0.49) + PH * 0.685 - TH; // shares the wreck's hover line
  const towHaulX = -(TW + PW + 560);
  const faceLeft = ph >= 2;
  let px, py, cxx, cyy, pTrans, cTrans;
  if (ph === 0) {
    px = -(PW + 60); py = y1p; cxx = -(PW + CW + 220); cyy = y1c; pTrans = cTrans = "none";
  } else if (ph === 1) {
    px = vw + 140; py = y1p; cxx = vw + 20 - CW * 0.2; cyy = y1c;
    pTrans = "transform 2.3s cubic-bezier(0.45,0,0.6,1)"; cTrans = "transform 2.3s cubic-bezier(0.45,0,0.6,1)";
  } else if (ph === 2) {
    px = vw + 90; py = y2p; cxx = vw + 90 + PW + 260; cyy = y2c; pTrans = cTrans = "none";
  } else {
    px = ph >= 9 ? crashX + (towHaulX - towX) : crashX; py = y2p; cyy = y2c;
    cxx = (ph === 5 || ph === 10) ? -(CW + 240) : crashX + PW * 0.95 + 6;
    pTrans = ph === 3 ? "transform 1.18s cubic-bezier(0.4,0,0.9,1)"      // slams in at full speed
      : ph === 9 ? "transform 1.7s cubic-bezier(0.55,0,0.8,0.7)" : "none"; // hauled off in lockstep with the wrecker
    cTrans = (ph === 5 || ph === 10) ? "transform 0.9s cubic-bezier(0.55,0,0.85,0.6)" : "transform 1.9s cubic-bezier(0.45,0,0.25,1)"; // trails, then skids to a stop clear of the wreck
  }
  // The wrecker: staged offscreen right on the wreck's hover line, cruises the
  // whole banner past the cop + wreck, then backs up beeping until the boom
  // hook sits over the wreck's nose, hooks on, and hauls it off.
  const towIn = ph >= 6;
  const towOverX = Math.max(towX - Math.min(vw * 0.24, 400), -TW * 0.35); // overshoot: clearly drove past the scene
  const towTx = ph >= 9 ? towHaulX : ph >= 7 ? towX : towIn ? towOverX : vw + 180;
  const towTy = towY;
  const towTrans = ph >= 9 ? "transform 1.7s cubic-bezier(0.55,0,0.8,0.7)"   // hauls off
    : ph >= 7 ? "transform 2.6s cubic-bezier(0.35,0,0.45,1)"                 // careful reverse
      : towIn ? "transform 3.4s cubic-bezier(0.3,0,0.35,1)" : "none";         // unhurried cruise across
  const lights = faceLeft ? { red: "49.1%", blue: "43%" } : { red: "45.7%", blue: "51.9%" };
  return (
    <div className="pointer-events-none fixed inset-0 z-[50] select-none overflow-hidden" data-testid="pursuit-heist">
      {/* the medallion, punted clean off the left edge by the impact */}
      {crash && (<>
        <div className="absolute overflow-hidden bg-black ring-2 ring-[#22E0E0]" style={{ left: cx - w / 2, top: cy - w / 2, width: w, height: w, borderRadius: "9999px", animation: "ffLogoKnockL 0.95s cubic-bezier(0.25,0.8,0.5,1) forwards" }} data-testid="pursuit-heist-logo">
          <img src="/logo-mark.png" alt="" className="h-full w-full scale-110 object-contain" style={{ borderRadius: "9999px" }} />
        </div>
        {/* impact sparks: neon shrapnel off the crumpled nose */}
        <div className="absolute" style={{ left: cx, top: cy }} data-testid="pursuit-heist-burst">
          {Array.from({ length: 14 }, (_, i) => {
            const a = (i / 14) * Math.PI * 2;
            const d = w * (0.7 + (i % 3) * 0.26);
            const col = i % 3 === 0 ? "#22E0E0" : i % 3 === 1 ? "#FF2D55" : "#4078FF";
            return (
              <span key={`spk-${i}`} className="absolute rounded-full" style={{ width: 4 + (i % 3) * 3, height: 4 + (i % 3) * 3, "--dx": `${Math.cos(a) * d}px`, "--dy": `${Math.sin(a) * d}px`, background: `radial-gradient(circle, #FFFFFF, ${col} 55%, transparent 82%)`, boxShadow: `0 0 8px ${col}`, animation: "ffPoofSparkle 0.9s ease-out forwards" }} />
            );
          })}
        </div>
      </>)}
      {/* the prey: flat out... then a hood ornament of the Fork·Fate header */}
      <div className="absolute left-0 top-0" style={{ transform: `translate(${px}px, ${py}px)`, transition: pTrans }} data-testid="pursuit-heist-prey">
        <div className="relative" style={{ width: PW, animation: variant === "fall" && ph >= 4 ? "ffCarTumble 1.05s cubic-bezier(0.5,0,0.85,0.6) forwards" : undefined, transform: variant === "tow" && ph >= 8 ? "rotate(-5deg)" : undefined, transformOrigin: "80% 60%", transition: "transform 0.5s ease" }}>
          <img src="/cyber-car.png" alt="" className="block object-contain" style={{ width: PW, opacity: 0.95, transform: faceLeft ? "scaleX(-1)" : "none", animation: crash ? "ffCarSputter 0.5s linear infinite" : undefined, filter: "drop-shadow(0 0 10px rgba(34,224,224,0.55))" }} />
          {/* smoke coughing off the crumpled nose */}
          {crash && [0, 1, 2].map((i) => (
            <span key={`smk-${i}`} className="absolute rounded-full" style={{ left: `${8 + i * 5}%`, top: "26%", width: PW * 0.11, height: PW * 0.11, background: "radial-gradient(circle, rgba(200,205,220,0.75), rgba(140,145,165,0.35) 55%, transparent 78%)", filter: "blur(2px)", animation: `ffPursuitSmoke 1.1s ease-out ${i * 0.36}s infinite` }} />
          ))}
        </div>
      </div>
      {/* the law: unit 07, lights blazing the whole way */}
      <div className="absolute left-0 top-0" style={{ transform: `translate(${cxx}px, ${cyy}px)`, transition: cTrans }} data-testid="pursuit-heist-police">
        <div className="relative" style={{ width: CW }}>
          {/* strobing halo washes the whole unit red/blue */}
          <span className="pointer-events-none absolute -inset-4" style={{ background: "radial-gradient(ellipse at 42% 30%, rgba(255,45,85,0.45), transparent 68%)", filter: "blur(8px)", animation: "ffCopFlashA 0.55s steps(1,end) infinite" }} />
          <span className="pointer-events-none absolute -inset-4" style={{ background: "radial-gradient(ellipse at 58% 30%, rgba(64,120,255,0.5), transparent 68%)", filter: "blur(8px)", animation: "ffCopFlashB 0.55s steps(1,end) infinite" }} />
          {/* flashing blooms sitting exactly on the sprite's baked beacons */}
          <span className="pointer-events-none absolute rounded-full" style={{ left: lights.red, top: "-4%", width: "7%", aspectRatio: "1", background: "radial-gradient(circle, rgba(255,45,85,1) 30%, rgba(255,45,85,0) 70%)", boxShadow: "0 0 16px 8px rgba(255,45,85,0.95)", animation: "ffCopFlashA 0.55s steps(1,end) infinite" }} />
          <span className="pointer-events-none absolute rounded-full" style={{ left: lights.blue, top: "-3%", width: "7%", aspectRatio: "1", background: "radial-gradient(circle, rgba(64,120,255,1) 30%, rgba(64,120,255,0) 70%)", boxShadow: "0 0 16px 8px rgba(64,120,255,0.95)", animation: "ffCopFlashB 0.55s steps(1,end) infinite" }} />
          <img src={faceLeft ? "/cyber-police-left.png" : "/cyber-police.png"} alt="" className="block w-full object-contain" style={{ opacity: 0.95, filter: "drop-shadow(0 0 8px rgba(120,150,255,0.45))" }} />
        </div>
      </div>
      {/* the wrecker: rare tow cameo — cruises across, backs up beeping, hooks the smoking wreck, hauls it away */}
      {variant === "tow" && crash && (
        <div className="absolute left-0 top-0" style={{ transform: `translate(${towTx}px, ${towTy}px)`, transition: towTrans }} data-testid="pursuit-heist-tow">
          <div className="relative" style={{ width: TW }}>
            {/* amber work beacon blinking on the cab roof */}
            <span className="pointer-events-none absolute rounded-full" style={{ left: "41%", top: "-3%", width: "5.5%", aspectRatio: "1", background: "radial-gradient(circle, rgba(255,190,60,1) 30%, rgba(255,190,60,0) 70%)", boxShadow: "0 0 14px 7px rgba(255,170,40,0.85)", animation: "ffCopFlashA 0.8s steps(1,end) infinite" }} />
            <img src="/cyber-tow.png" alt="" className="block w-full object-contain" style={{ opacity: 0.97, filter: "drop-shadow(0 0 10px rgba(34,224,224,0.45))" }} />
            {/* reverse lamp: white blink at the boom-side rear while backing up beeping */}
            {ph === 7 && (
              <span className="pointer-events-none absolute rounded-full" style={{ left: "92%", top: "42%", width: "5%", aspectRatio: "1", background: "radial-gradient(circle, rgba(255,255,255,1) 30%, rgba(255,255,255,0) 70%)", boxShadow: "0 0 14px 7px rgba(255,255,255,0.8)", animation: "ffCopFlashA 0.7s steps(1,end) infinite" }} data-testid="tow-reverse-lamp" />
            )}
            {/* hook-on flare when the boom latches the wreck's nose */}
            {ph >= 8 && ph < 9 && (
              <span className="pointer-events-none absolute rounded-full" style={{ left: "93%", top: "24%", width: "7%", aspectRatio: "1", background: "radial-gradient(circle, #FFFFFF, #22E0E0 55%, transparent 80%)", boxShadow: "0 0 14px rgba(34,224,224,0.95)", animation: "ffPoofSparkle 0.6s ease-out forwards" }} />
            )}
          </div>
        </div>
      )}
    </div>
  );
}

/** Winter heist: the little cardinal flutters down for a rest ON TOP of the
 * medallion — which teeters under the featherweight, tips right off its perch
 * and plummets. The startled bird flutters up and beats it. First strike
 * 30-55s after load, then every 2.5-5 min (`ff:cardinal-heist` forces it,
 * used for testing). Perched art 200x123, flying art 220x141, both face LEFT. */
