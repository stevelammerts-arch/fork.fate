import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { useLang } from "../../i18n/i18n";

const SHAKES_NEEDED = 5;
const SNOWFLAKES = 26;

// Icy jingle per shake: a short burst of high-passed noise (respects mute).
function makeJingler() {
  try {
    if (localStorage.getItem("ff_muted") === "1") return () => {};
    const Ctx = window.AudioContext || window.webkitAudioContext;
    const ctx = new Ctx();
    return () => {
      try {
        const len = Math.floor(ctx.sampleRate * 0.11);
        const buf = ctx.createBuffer(1, len, ctx.sampleRate);
        const data = buf.getChannelData(0);
        for (let i = 0; i < len; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / len);
        const bp = ctx.createBiquadFilter();
        bp.type = "bandpass";
        bp.frequency.value = 5200;
        bp.Q.value = 1.4;
        const g = ctx.createGain();
        g.gain.value = 0.13;
        const src = ctx.createBufferSource();
        src.buffer = buf;
        src.connect(bp).connect(g).connect(ctx.destination);
        src.start();
      } catch (e) { /* audio */ }
    };
  } catch (e) {
    return () => {};
  }
}

// Deterministic pseudo-random per flake so re-renders don't reshuffle.
function rnd(i, salt) {
  const h = ((i + 7) * 2654435761 + salt * 97911) >>> 0;
  return (h % 1000) / 1000;
}

/** Winter rare ritual: a realistic snow globe (snowman inside). Each tap
 * shakes the globe harder and whips the flakes into a blizzard; after enough
 * shakes the snow settles and the fate is revealed with sleigh bells. */
export function SnowGlobe({ onDone }) {
  const { t } = useLang();
  const [shakes, setShakes] = useState(0);
  const [settling, setSettling] = useState(false);
  const doneRef = useRef(false);
  const jingleRef = useRef(null);
  const [wobbleKey, setWobbleKey] = useState(0);

  const shake = () => {
    if (settling) return;
    if (!jingleRef.current) jingleRef.current = makeJingler();
    jingleRef.current();
    setWobbleKey((k) => k + 1);
    const next = shakes + 1;
    setShakes(next);
    if (next >= SHAKES_NEEDED) {
      setTimeout(() => {
        setSettling(true);
        const bells = new Audio("/reveal-santa.wav");
        bells.volume = 0.85;
        if (localStorage.getItem("ff_muted") !== "1") bells.play().catch(() => {});
        setTimeout(() => { if (!doneRef.current) { doneRef.current = true; onDone?.(); } }, 2400);
      }, 380);
    }
  };

  // Reset on (re)mount so StrictMode's simulated unmount can't poison the
  // guard; a real unmount still cancels the pending onDone.
  useEffect(() => { doneRef.current = false; return () => { doneRef.current = true; }; }, []);

  const intensity = 4 + shakes * 2.5;
  // Flakes swirl faster with every shake; before the first shake they drift.
  const swirlDur = shakes === 0 ? 7 : Math.max(0.7, 2.6 - shakes * 0.4);

  return (
    <motion.div
      className="absolute inset-0 z-40 overflow-hidden rounded-2xl"
      style={{ background: "radial-gradient(circle at 50% 25%, #17466E 0%, #081726 78%)" }}
      initial={{ opacity: 0 }}
      animate={{ opacity: settling ? [1, 1, 0] : 1 }}
      transition={settling ? { duration: 2.4, times: [0, 0.82, 1] } : { duration: 0.4 }}
      data-testid="snow-globe-cover"
    >
      <div className="pointer-events-none absolute left-1/2 top-3 z-20 -translate-x-1/2 whitespace-nowrap rounded-full bg-black/60 px-4 py-1 font-sans text-[11px] font-bold uppercase tracking-[0.2em] text-[#BFE0FF]" data-testid="rare-fate-badge">
        ✦ {t("Rare fate")} ✦
      </div>

      <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 pt-4">
        <motion.div
          key={wobbleKey}
          animate={settling ? { rotate: 0 } : { rotate: [0, -intensity, intensity, -intensity * 0.6, intensity * 0.6, 0] }}
          transition={{ duration: 0.45 }}
          style={{ transformOrigin: "50% 85%" }}
          onClick={shake}
          className="relative cursor-pointer touch-none"
          data-testid="snow-globe"
          role="button"
          aria-label={t("Shake the snow globe")}
        >
          <img
            src="/snow-globe.png"
            alt=""
            className="h-64 w-auto select-none object-contain"
            style={{ filter: "drop-shadow(0 10px 18px rgba(0,0,0,0.55))" }}
            draggable={false}
          />
          {/* swirling snow, clipped to the glass sphere (over the snowman) */}
          <div className="pointer-events-none absolute overflow-hidden rounded-full" style={{ left: "50%", top: "40.5%", width: "88%", aspectRatio: "1", transform: "translate(-50%, -50%)" }} data-testid="snow-globe-flakes">
            {Array.from({ length: SNOWFLAKES }, (_, i) => (
              <span
                key={i}
                className="absolute rounded-full bg-white"
                style={{
                  left: `${8 + rnd(i, 1) * 82}%`,
                  top: `${6 + rnd(i, 2) * 80}%`,
                  width: 2 + Math.round(rnd(i, 3) * 3),
                  height: 2 + Math.round(rnd(i, 3) * 3),
                  opacity: 0.55 + rnd(i, 4) * 0.45,
                  filter: "blur(0.4px)",
                  animation: settling
                    ? `ffGlobeSettle ${1.4 + rnd(i, 5) * 0.9}s ease-in forwards`
                    : `ffGlobeSwirl ${swirlDur * (0.75 + rnd(i, 6) * 0.5)}s linear infinite ${i % 2 ? "reverse" : ""}`,
                }}
              />
            ))}
          </div>
        </motion.div>

        {!settling ? (
          <>
            <p className="font-serif text-lg italic text-[#DCEBFF]" data-testid="snow-globe-prompt">{t("Shake the snow globe!")}</p>
            <div className="flex gap-1.5" data-testid="snow-globe-dots">
              {Array.from({ length: SHAKES_NEEDED }, (_, i) => (
                <span key={i} className={`h-2.5 w-2.5 rounded-full transition-colors ${i < shakes ? "bg-[#8FC6FF]" : "bg-white/20"}`} />
              ))}
            </div>
          </>
        ) : (
          <p className="font-serif text-lg font-bold uppercase tracking-[0.15em] text-[#BFE0FF]" data-testid="snow-globe-done">{t("The fate settles in the snow!")}</p>
        )}
      </div>
    </motion.div>
  );
}
