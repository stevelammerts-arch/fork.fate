// SEASONAL DRIFT layer: while a limited-time season is live, its exclusive
// effect (hearts, souls, steins, sparks, clovers, petals, butterflies, kites,
// fireworks, wishbones, aurora...) sweeps the screen every few minutes.
// Mounted for EVERY realm from RealmLayers — takeovers claim "All realms" and
// mean it. First sighting records the seasonal fate (Collection page);
// witnessable ONLY inside the season's window. `ff:season-drift` forces one.
import { useState, useEffect, useMemo } from "react";
import { toast } from "sonner";
import { activeSeason, recordSeasonalSeen } from "../../lib/seasons";

function useSeasonalDrift() {
  const [on, setOn] = useState(false);
  const season = useMemo(() => activeSeason(), []);
  useEffect(() => {
    if (!season) return undefined;
    let timers = [];
    let pending;
    const schedule = (min, spread) => { pending = setTimeout(run, min + Math.random() * spread); };
    const run = () => {
      timers.forEach(clearTimeout); timers = [];
      setOn(true);
      timers.push(setTimeout(() => {
        const first = recordSeasonalSeen(season.fateKey);
        if (first) {
          toast("Seasonal fate witnessed!", {
            description: `${season.fateName} — ${season.name}`,
            duration: 8000,
            style: { background: "#17101B", border: `1px solid ${season.accent}`, color: season.accent },
          });
        }
      }, 5000));
      timers.push(setTimeout(() => { setOn(false); schedule(160000, 120000); }, 11000));
    };
    schedule(35000, 45000);
    const force = () => { clearTimeout(pending); run(); };
    window.addEventListener("ff:season-drift", force);
    return () => { clearTimeout(pending); timers.forEach(clearTimeout); window.removeEventListener("ff:season-drift", force); };
  }, [season]);
  return { season, seasonOn: on };
}

export function SeasonalDriftLayer() {
  const { season, seasonOn } = useSeasonalDrift();
  if (!seasonOn || !season) return null;
  return (
    <div className="pointer-events-none fixed inset-0 z-[45] select-none overflow-hidden" data-testid="seasonal-drift">
      {season.effect === "hearts" && [0, 1, 2, 3, 4, 5, 6].map((i) => (
        <div key={`sh-${i}`} className="absolute left-0" style={{ top: `${8 + (i * 11) % 55}%`, animation: `ffSeasonDrift ${7 + (i % 3) * 1.7}s linear ${i * 0.75}s forwards`, opacity: 0 }}>
          <svg width={22 + (i % 3) * 10} height={22 + (i % 3) * 10} viewBox="0 0 32 32" style={{ filter: `drop-shadow(0 0 6px ${season.accent})`, animation: `ffSeasonBob ${2 + (i % 3) * 0.5}s ease-in-out infinite` }}>
            <path d="M16 29 C4 20 1 12 5 7 C9 2 15 4 16 9 C17 4 23 2 27 7 C31 12 28 20 16 29 Z" fill={season.accent} opacity="0.85" />
          </svg>
        </div>
      ))}
      {season.effect === "beachballs" && [0, 1, 2, 3, 4, 5].map((i) => (
        <div key={`sb-${i}`} className="absolute inset-0" style={{ animation: "ffSeasonBallFade 11s linear forwards" }}>
          <div className="absolute inset-0" style={{ animation: `ffSeasonBallX ${4.6 + (i % 4) * 1.3}s ease-in-out ${-i * 1.7}s infinite alternate${i % 2 ? " reverse" : ""}` }}>
            <div style={{ animation: `ffSeasonBallY ${1.5 + (i % 3) * 0.45}s cubic-bezier(0.45,0,0.75,0.6) ${-i * 0.6}s infinite alternate` }}>
              <img src="/summer-ball.png" alt="" className="object-contain" style={{ width: `${7 + (i % 3) * 2.5}vh`, filter: "drop-shadow(0 4px 8px rgba(0,0,0,0.3))", animation: `ffBallHeistSpin ${0.9 + (i % 3) * 0.4}s linear infinite${i % 2 ? " reverse" : ""}` }} />
            </div>
          </div>
        </div>
      ))}
      {season.effect === "wisps" && [0, 1, 2, 3, 4].map((i) => (
        <div key={`sw-${i}`} className="absolute left-0" style={{ top: `${10 + (i * 13) % 48}%`, animation: `ffSeasonDrift ${9 + (i % 3) * 2}s linear ${i * 1.1}s forwards`, opacity: 0 }}>
          <div style={{ width: `${5 + (i % 3) * 2}vh`, height: `${2.4 + (i % 3)}vh`, borderRadius: "9999px", background: "radial-gradient(ellipse, rgba(230,225,255,0.75), rgba(185,165,227,0.25) 60%, transparent 80%)", filter: "blur(4px)", animation: `ffSeasonBob ${2.6 + (i % 2)}s ease-in-out infinite` }} />
        </div>
      ))}
      {season.effect === "steins" && [0, 1, 2, 3, 4, 5].map((i) => (
        <div key={`st-${i}`} className="absolute left-0" style={{ top: `${10 + (i * 12) % 52}%`, animation: `ffSeasonDrift ${8 + (i % 3) * 1.8}s linear ${i * 0.9}s forwards`, opacity: 0 }}>
          <svg width={28 + (i % 3) * 10} height={28 + (i % 3) * 10} viewBox="0 0 32 32" style={{ filter: `drop-shadow(0 0 6px ${season.accent})`, animation: `ffSeasonBob ${2.2 + (i % 3) * 0.5}s ease-in-out infinite` }}>
            <path d="M7 10 h14 v16 a2 2 0 0 1 -2 2 H9 a2 2 0 0 1 -2 -2 Z" fill="#F0B429" opacity="0.92" />
            <path d="M21 13 h2.6 a3.4 3.4 0 0 1 3.4 3.4 v3.2 a3.4 3.4 0 0 1 -3.4 3.4 H21 v-2.6 h2.4 a1 1 0 0 0 1 -1 v-2.8 a1 1 0 0 0 -1 -1 H21 Z" fill="#D99B1F" opacity="0.92" />
            <ellipse cx="14" cy="9.4" rx="8.2" ry="3.2" fill="#FFF7E0" />
            <circle cx="9.6" cy="7.6" r="2.4" fill="#FFF7E0" />
            <circle cx="14.8" cy="6.6" r="2.8" fill="#FFF7E0" />
            <circle cx="19.4" cy="7.8" r="2.2" fill="#FFF7E0" />
            <rect x="9.4" y="13" width="2" height="11" rx="1" fill="#FFE9B0" opacity="0.65" />
            <rect x="13.2" y="13" width="2" height="11" rx="1" fill="#FFE9B0" opacity="0.45" />
          </svg>
        </div>
      ))}
      {season.effect === "sparks" && [0, 1, 2, 3, 4, 5, 6, 7].map((i) => (
        <div key={`sp-${i}`} className="absolute bottom-0" style={{ left: `${6 + (i * 12.5) % 88}%`, animation: `ffSeasonRise ${7.5 + (i % 3) * 1.6}s ease-out ${i * 0.85}s forwards`, opacity: 0 }}>
          <svg width={16 + (i % 3) * 8} height={16 + (i % 3) * 8} viewBox="0 0 24 24" style={{ filter: `drop-shadow(0 0 7px ${season.accent})`, animation: `ffSeasonBob ${1.6 + (i % 3) * 0.4}s ease-in-out infinite` }}>
            <path d="M12 1 L14.2 9.8 L23 12 L14.2 14.2 L12 23 L9.8 14.2 L1 12 L9.8 9.8 Z" fill={season.accent} opacity="0.9" />
          </svg>
        </div>
      ))}
      {season.effect === "clovers" && [0, 1, 2, 3, 4, 5].map((i) => (
        <div key={`cl-${i}`} className="absolute left-0" style={{ top: `${9 + (i * 12) % 52}%`, animation: `ffSeasonDrift ${7.5 + (i % 3) * 1.8}s linear ${i * 0.9}s forwards`, opacity: 0 }}>
          <svg width={24 + (i % 3) * 10} height={24 + (i % 3) * 10} viewBox="0 0 32 32" style={{ filter: `drop-shadow(0 0 6px ${season.accent})`, animation: `ffSeasonSpinSlow ${5 + (i % 3)}s linear infinite` }}>
            <circle cx="11" cy="11" r="6.2" fill={season.accent} opacity="0.9" />
            <circle cx="21" cy="11" r="6.2" fill={season.accent} opacity="0.9" />
            <circle cx="11" cy="21" r="6.2" fill={season.accent} opacity="0.9" />
            <circle cx="21" cy="21" r="6.2" fill={season.accent} opacity="0.9" />
            <path d="M16 18 L13 30" stroke="#2FA355" strokeWidth="2.4" strokeLinecap="round" />
          </svg>
        </div>
      ))}
      {season.effect === "petals" && [0, 1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
        <div key={`pt-${i}`} className="absolute top-0" style={{ left: `${4 + (i * 11) % 90}%`, animation: `ffSeasonFall ${7 + (i % 4) * 1.5}s linear ${i * 0.7}s forwards`, opacity: 0 }}>
          <svg width={16 + (i % 3) * 7} height={16 + (i % 3) * 7} viewBox="0 0 24 24" style={{ filter: `drop-shadow(0 0 5px ${season.accent})`, animation: `ffSeasonBob ${2 + (i % 3) * 0.5}s ease-in-out infinite` }}>
            <path d="M12 2 C18 6 19 14 12 22 C5 14 6 6 12 2 Z" fill={season.accent} opacity="0.85" />
          </svg>
        </div>
      ))}
      {season.effect === "butterflies" && [0, 1, 2, 3, 4].map((i) => (
        <div key={`bf-${i}`} className="absolute left-0" style={{ top: `${10 + (i * 13) % 50}%`, animation: `ffSeasonDrift ${8 + (i % 3) * 2}s ease-in-out ${i * 1.1}s forwards`, opacity: 0 }}>
          <div style={{ animation: `ffSeasonBob ${1.3 + (i % 3) * 0.35}s ease-in-out infinite` }}>
            <svg width={26 + (i % 3) * 10} height={22 + (i % 3) * 8} viewBox="0 0 36 28" style={{ filter: `drop-shadow(0 0 6px ${season.accent})`, animation: "ffSeasonFlap 0.34s ease-in-out infinite" }}>
              <ellipse cx="10" cy="10" rx="9" ry="8" fill={season.accent} opacity="0.9" />
              <ellipse cx="26" cy="10" rx="9" ry="8" fill={season.accent} opacity="0.9" />
              <ellipse cx="11.5" cy="21" rx="6.5" ry="5.5" fill={season.accent} opacity="0.7" />
              <ellipse cx="24.5" cy="21" rx="6.5" ry="5.5" fill={season.accent} opacity="0.7" />
              <rect x="16.6" y="4" width="2.8" height="21" rx="1.4" fill="#2B2B33" />
            </svg>
          </div>
        </div>
      ))}
      {season.effect === "kites" && [0, 1, 2, 3].map((i) => (
        <div key={`kt-${i}`} className="absolute left-0" style={{ top: `${6 + (i * 11) % 34}%`, animation: `ffSeasonDrift ${9 + (i % 3) * 2}s linear ${i * 1.4}s forwards`, opacity: 0 }}>
          <svg width={34 + (i % 3) * 12} height={52 + (i % 3) * 16} viewBox="0 0 40 64" style={{ filter: `drop-shadow(0 0 6px ${season.accent})`, animation: `ffSeasonBob ${2.4 + (i % 2) * 0.6}s ease-in-out infinite` }}>
            <path d="M20 2 L36 20 L20 40 L4 20 Z" fill={season.accent} opacity="0.9" />
            <path d="M20 2 L20 40 M4 20 L36 20" stroke="rgba(0,0,0,0.28)" strokeWidth="1.6" />
            <path d="M20 40 C16 46 24 50 20 56 C17 60 22 62 20 64" stroke={season.accent} strokeWidth="2" fill="none" opacity="0.8" />
            <circle cx="14" cy="48" r="2.4" fill={season.accent} opacity="0.85" />
            <circle cx="24" cy="55" r="2.4" fill={season.accent} opacity="0.85" />
          </svg>
        </div>
      ))}
      {season.effect === "fireworks" && [0, 1, 2, 3, 4].map((i) => {
        const hues = ["#FF5A5A", "#FFD75E", "#6FC8FF", "#C77DFF", "#7CD992"];
        return (
          <div key={`fw-${i}`} className="absolute" style={{ left: `${12 + (i * 19) % 74}%`, top: `${10 + (i * 13) % 38}%`, animation: `ffSeasonBurst 2.6s ease-out ${i * 1.7}s forwards`, opacity: 0 }}>
            <svg width="120" height="120" viewBox="0 0 120 120" style={{ filter: `drop-shadow(0 0 10px ${hues[i]})` }}>
              {[...Array(12)].map((_, r) => {
                const a = (r / 12) * Math.PI * 2;
                return <line key={r} x1={60 + Math.cos(a) * 14} y1={60 + Math.sin(a) * 14} x2={60 + Math.cos(a) * 54} y2={60 + Math.sin(a) * 54} stroke={hues[i]} strokeWidth="3" strokeLinecap="round" opacity="0.9" />;
              })}
              <circle cx="60" cy="60" r="6" fill="#FFF7E0" />
            </svg>
          </div>
        );
      })}
      {season.effect === "wishbones" && [0, 1, 2, 3, 4].map((i) => (
        <div key={`wb-${i}`} className="absolute left-0" style={{ top: `${10 + (i * 12) % 50}%`, animation: `ffSeasonDrift ${8 + (i % 3) * 1.8}s linear ${i * 1}s forwards`, opacity: 0 }}>
          <svg width={26 + (i % 3) * 10} height={30 + (i % 3) * 11} viewBox="0 0 28 32" style={{ filter: `drop-shadow(0 0 6px ${season.accent})`, animation: `ffSeasonSpinSlow ${6 + (i % 3)}s linear infinite` }}>
            <path d="M14 30 C13 20 10 12 4 4 M14 30 C15 20 18 12 24 4" stroke={season.accent} strokeWidth="4.4" strokeLinecap="round" fill="none" opacity="0.92" />
            <circle cx="4" cy="4" r="3" fill={season.accent} />
            <circle cx="24" cy="4" r="3" fill={season.accent} />
          </svg>
        </div>
      ))}
      {season.effect === "aurora" && (
        <div className="absolute inset-x-0" style={{ top: "6%", height: "22%", background: "linear-gradient(100deg, transparent 0%, rgba(80,230,180,0.28) 22%, rgba(120,180,255,0.34) 48%, rgba(190,130,255,0.26) 74%, transparent 100%)", filter: "blur(14px)", animation: "ffSeasonAurora 11s ease-in-out forwards" }} />
      )}
    </div>
  );
}
