// The realm companions (fairy pixie, tiny dragon, tiki surfer): a shared
// patrol engine that lives on the page, visits sections, and pulls heists.
import { useState, useEffect, useRef } from "react";
import { summonToLogo, startleTitle, useHeistWitness, preloadHeistAudio, playHeistSound } from "./heistLib";

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
export function CompanionPatrol({ s1, s2, glow, dustCol = ["#FFF9D9", "#FFD36B"], heistKind = null, testid = "companion", flap = "ffPixieFlapA 0.48s linear infinite", flapBase = "ffPixieFlapB 0.48s linear infinite", emitY = 0, bob = "ffPixieBob 2.4s ease-in-out infinite" }) {
  const witnessRef = useHeistWitness(heistKind === "breath" ? "breath" : heistKind === "crash" ? "surf" : "pixie");
  useEffect(() => {
    preloadHeistAudio(heistKind === "crash" ? ["/surf-wipeout.mp3"] : heistKind === "breath" ? ["/dragon-whoosh.mp3"] : ["/fairy-laugh.mp3", "/pixie-chime.mp3"]);
  }, [heistKind]);
  const wrapRef = useRef(null);   // translated flight layer
  const faceRef = useRef(null);   // scaleX facing flip
  const trailRefs = useRef([]);
  const [casting, setCasting] = useState(false);
  const [burst, setBurst] = useState(null); // {x, y, w} burst over the logo
  const [jet, setJet] = useState(null);     // {sx, sy, tx, ty} flame stream
  const [knock, setKnock] = useState(null); // {x, y, w} crash-knocked medallion

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
        p.y = pos.y + (Math.random() - 0.5) * 26 + 6 + emitY;
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
      const r = el.getBoundingClientRect();
      const lookX = r.left + r.width / 2;
      if (heistKind === "crash") {
        // Wipeout: he plows straight into the medallion's face.
        return { x: lookX + r.width * 0.2, y: r.top + r.height / 2 + 4, lookX };
      }
      if (heistKind !== "breath") return anchorOf(el);
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
      cancelSummon = summonToLogo(heistKind, (med) => {
        const r = med && med.getBoundingClientRect();
        if (!r || !r.width) { running = false; if (!force) scheduleHeist(30000); return; }
        overrideEl = med;
        Object.assign(base, heistAnchorOf(med));
        if (heistKind === "crash") {
          // "Wipe Out" riff kicks in as he lines up his charge — the crash
          // lands right in the middle of the drum roll (clip is ~3.6s).
          playHeistSound("/surf-wipeout.mp3", 0.65);
        }
        timers.push(setTimeout(() => {           // a beat to fly up there
          const r2 = med.getBoundingClientRect();
          setCasting(true);
          setBurst({ x: r2.x, y: r2.y, w: r2.width });
          if (heistKind === "breath") {
            // Flame jet from the dragon's MOUTH, streaming horizontally
            // across into the medallion's heart (he hovers level with it).
            playHeistSound("/dragon-whoosh.mp3", 0.7);
            const c2x = r2.x + r2.width / 2, c2y = r2.y + r2.height / 2;
            const dir = c2x > pos.x ? 1 : -1; // the way he's facing
            setJet({ sx: pos.x + dir * MOUTH_DX, sy: pos.y + MOUTH_DY, tx: c2x, ty: c2y });
            timers.push(setTimeout(() => setJet(null), 1400));
          } else if (heistKind === "crash") {
            // Wipeout: the medallion is knocked flying on impact.
            setKnock({ x: r2.x, y: r2.y, w: r2.width });
            timers.push(setTimeout(() => setKnock(null), 1000));
          } else {
            // her giggle — plus a tiny sparkle chime as the coin poofs away
            playHeistSound("/fairy-laugh.mp3", 0.35);
            playHeistSound("/pixie-chime.mp3", 0.5);
          }
          timers.push(setTimeout(() => { med.style.visibility = "hidden"; startleTitle(); }, heistKind === "crash" ? 60 : 420));
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
    const heistEvent = heistKind === "breath" ? "ff:breath-heist" : heistKind === "crash" ? "ff:surf-heist" : "ff:pixie-heist";
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
          <div className="relative" style={{ width: 100, height: 100, animation: casting && heistKind === "crash" ? "ffBallHeistSpin 0.55s linear infinite" : bob, filter: `drop-shadow(0 0 7px ${glow})` }}>
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
      {knock && heistKind === "crash" && (
        <div className="absolute overflow-hidden bg-black ring-1 ring-white/25" style={{ left: knock.x, top: knock.y, width: knock.w, height: knock.w, borderRadius: "9999px", animation: "ffLogoKnockL 0.9s cubic-bezier(0.25,0.8,0.5,1) forwards" }} data-testid="surf-heist-logo">
          <img src="/logo-tiki.png" alt="" className="h-full w-full object-contain" style={{ borderRadius: "9999px" }} />
        </div>
      )}
      {burst && (
        <div className="absolute" style={{ left: burst.x, top: burst.y, width: burst.w, height: burst.w }} data-testid={heistKind === "breath" ? "dragon-scorch-burst" : heistKind === "crash" ? "surf-crash-burst" : "pixie-poof-burst"}>
          {Array.from({ length: 10 }, (_, i) => {
            const a = (i / 10) * Math.PI * 2;
            const d = burst.w * (0.55 + (i % 3) * 0.2);
            const cols = heistKind === "breath"
              ? (i % 2 ? "radial-gradient(circle, #FFFFFF, #FF8C3A 60%, transparent 82%)" : "radial-gradient(circle, #FFE9B0, #E01E26 60%, transparent 82%)")
              : heistKind === "crash"
                ? (i % 2 ? "radial-gradient(circle, #FFFFFF, #BFE9F4 60%, transparent 82%)" : "radial-gradient(circle, #E9FBFF, #74C6E6 60%, transparent 82%)")
                : (i % 2 ? "radial-gradient(circle, #FFFFFF, #8FF0B0 60%, transparent 82%)" : "radial-gradient(circle, #FFF9D9, #FFD36B 60%, transparent 82%)");
            return (
              <span
                key={`poof-${i}`}
                className="absolute left-1/2 top-1/2 rounded-full"
                style={{ width: 5 + (i % 3) * 2, height: 5 + (i % 3) * 2, "--dx": `${Math.cos(a) * d}px`, "--dy": `${Math.sin(a) * d}px`, background: cols, boxShadow: heistKind === "breath" ? "0 0 6px rgba(255,160,80,0.85)" : heistKind === "crash" ? "0 0 6px rgba(190,235,250,0.85)" : "0 0 6px rgba(255,244,200,0.8)", animation: "ffPoofSparkle 0.95s ease-out forwards" }}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}

