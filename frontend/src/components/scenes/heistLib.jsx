// Shared heist plumbing: the header-medallion "summon", the startled title
// hop, first-sighting witness toasts, and the generic grab-from-below engine.
import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { useLang } from "../../i18n/i18n";
import { HEISTS, recordHeistSeen, readHeistsSeen } from "../../lib/rituals";
import { awardPoints, EARN } from "../../lib/points";
import { showHerald, hideHerald, engageSpotlight, releaseSpotlight, HERALD_MS } from "./witnessStage";

/** Every heist strikes the header logo. If the user has scrolled it out of
 * view (mobile, mid-list), smoothly pull the page back to the top first so
 * they never miss the show, then hand back the medallion element to measure.
 * Returns a cancel function for unmount-mid-scroll safety. */
export function summonToLogo(kind, done, force = false) {
  // Never interrupt the show: if fate is mid-shuffle or mid-reveal (Home
  // keeps window.__ffFateBusy up to date), bow out — every heist treats a
  // null medallion as "try again in ~30s".
  if (window.__ffFateBusy) { done(null); return () => {}; }
  const played = (window.__ffHeistKindsPlayed = window.__ffHeistKindsPlayed || {});
  // One heist at a time, with a breather: realms run several heists on
  // independent timers, so without a global cool-down the strikes cluster
  // back-to-back. A bounced heist simply retries in ~30s.
  // An intentional player tap (force) always earns the gag — it skips the
  // cooldown and the once-per-visit latch, but still reserves them after so
  // the background timers never chain replays off a forced strike.
  if (!force) {
    if (Date.now() < (window.__ffHeistCooldownUntil || 0)) { done(null); return () => {}; }
    // EACH heist kind is a rare treat: once per realm visit (different kinds
    // may each strike once, spaced by the global cooldown). Home clears this
    // registry whenever the player enters a different realm (or reloads).
    if (played[kind]) { done(null); return () => {}; }
  }
  const img = document.querySelector('img[alt="Fork·Fate logo"]');
  const med = img && img.parentElement;
  const r = med && med.getBoundingClientRect();
  if (!r || !r.width) { done(null); return () => {}; }
  const reserve = () => {
    window.__ffHeistCooldownUntil = Date.now() + 90000 + Math.random() * 30000;
    played[kind] = true;
  };
  if (r.top >= 0 && r.bottom <= window.innerHeight) { reserve(); done(med); return () => {}; }
  // HOLD THE STAGE while the herald plays + we scroll up (~4.75s max): without
  // this a golem show (awakening step / furnace blast) could start mid-scroll
  // and end up overlapping the medallion heist. A short provisional hold keeps
  // them parked; it expires on its own if we bail below.
  window.__ffHeistCooldownUntil = Math.max(window.__ffHeistCooldownUntil || 0, Date.now() + 9500);
  // WITNESS PROTOCOL: users read a sudden auto-scroll as a glitch and scroll
  // right back, missing the show. Announce it first (themed herald, ~2s), THEN
  // pull them up; the spotlight (vignette + scroll lock) engages at strike and
  // releases when the heist records its witness.
  showHerald(kind);
  let poll, settle;
  const heraldT = setTimeout(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
    const t0 = Date.now();
    poll = setInterval(() => {
      if (window.scrollY <= 2 || Date.now() - t0 > 2500) {
        clearInterval(poll);
        // Re-check right before striking: fate may have turned busy mid-scroll.
        settle = setTimeout(() => {
          if (window.__ffFateBusy) { hideHerald(); done(null); return; }
          reserve(); engageSpotlight(); done(med);
        }, 250); // settle beat before measuring
      }
    }, 90);
  }, HERALD_MS);
  return () => { clearTimeout(heraldT); clearInterval(poll); clearTimeout(settle); hideHerald(); releaseSpotlight(); };
}


/** First-time heist sightings earn a toast pointing at the Collection. */

// Witness key -> the heist's own force event: lets the toast replay a show
// the user only caught the tail of. Kinds without an event get no Replay.
export const REPLAY_EVENTS = {
  dragon: "ff:heist", grave: "ff:heist",
  ball: "ff:ball-heist", gulls: "ff:gull-heist", splat: "ff:poop-heist",
  crab: "ff:crab-heist", snowman: "ff:snowman-heist", owl: "ff:owl-heist",
  petals: "ff:petal-heist", cardinal: "ff:cardinal-heist", stash: "ff:stash-heist",
  saucer: "ff:abduct", snatch: "ff:ghost-heist", spear: "ff:spear-heist",
  spring: "ff:spring-heist", peek: "ff:peek-heist", gears: "ff:gears-heist",
  coffee: "ff:coffee-heist", plate: "ff:plate-heist", unicorn: "ff:unicorn-heist",
  pursuit: "ff:pursuit-heist", wreck: "ff:neon-crash",
  furnace: "ff:furnace-blast", awakening: "ff:golem-wake",
  armdrop: "ff:arm-drop", cheesethief: "ff:trap-snap",
};

export function replayHeist(key) {
  const ev = REPLAY_EVENTS[key];
  if (!ev || window.__ffFateBusy) return false;
  // Clear the one-per-visit latch + cooldown so the encore actually plays.
  window.__ffHeistCooldownUntil = 0;
  if (window.__ffHeistKindsPlayed) delete window.__ffHeistKindsPlayed[key];
  window.dispatchEvent(new Event(ev));
  return true;
}

export function useHeistWitness(key) {
  const { t } = useLang();
  const navigate = useNavigate();
  const ref = useRef(null);
  ref.current = (announce) => {
    releaseSpotlight(); // show's over: unlock scrolling, lift the vignette
    const first = recordHeistSeen(key);
    awardPoints(EARN.heist, `Heist: ${key}`);
    if (!first || !announce) return first;
    const heist = HEISTS.find((h) => h.key === key);
    const replayable = !!REPLAY_EVENTS[key];
    toast(t("Heist witnessed!"), {
      description: `${heist ? t(heist.name) : ""} · +${EARN.heist} pts`,
      action: replayable
        ? { label: t("Replay"), onClick: () => replayHeist(key) }
        : { label: t("Collection"), onClick: () => navigate("/rituals") },
      cancel: replayable ? { label: t("Collection"), onClick: () => navigate("/rituals") } : undefined,
      duration: 8000,
    });
    // SEAL TOAST: if that was the realm's FINAL fate, the golden seal ignites
    if (heist) {
      const seenAll = readHeistsSeen();
      const set = HEISTS.filter((h) => h.realm === heist.realm);
      if (set.length > 1 && set.every((h) => seenAll[h.key]?.count)) {
        setTimeout(() => {
          toast(t("Realm Seal earned!"), {
            description: `${t(heist.realm)} — ${t("every fate witnessed")}`,
            action: { label: t("Collection"), onClick: () => navigate("/rituals") },
            duration: 9000,
            style: { background: "linear-gradient(135deg, #2A1F0A 0%, #4A3510 100%)", border: "1px solid #E6B23A", color: "#F3D9A0" },
          });
        }, 1600);
      }
    }
    return first;
  };
  return ref;
}

/** Warmed heist audio bank: on live mobile, `new Audio(src).play()` at the
 * strike moment had to download + decode first, landing the sound seconds
 * behind the visuals. Heists preload their clips at mount (long before the
 * multi-minute strike timers fire) and play from the warm element. */
const _audioBank = {};

export function preloadHeistAudio(srcs) {
  for (const src of srcs) {
    if (_audioBank[src]) continue;
    try {
      const a = new Audio(src);
      a.preload = "auto";
      a.load();
      _audioBank[src] = a;
    } catch { /* audio unavailable */ }
  }
}

/** Play from the warmed bank (fresh-element fallback), honoring global mute. */
export function playHeistSound(src, vol = 0.7) {
  try {
    if (localStorage.getItem("ff_muted") === "1") return;
    let a = _audioBank[src];
    if (a) {
      try { a.pause(); a.currentTime = 0; } catch { a = null; }
    }
    if (!a) a = new Audio(src);
    a.volume = vol;
    a.play().catch(() => {});
  } catch { /* audio unavailable */ }
}

/** The Fork·Fate title does a startled little hop when its medallion is
 * stolen by any of the realm heists. */
export function startleTitle() {
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
export function LogoHeist({ sprite, aspect, gripX, gripY, widthMult, cloneSrc, shadow, testid, heistKey, cloneScale = 1 }) {
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
      cancelSummon = summonToLogo(heistKey, (med) => {
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

