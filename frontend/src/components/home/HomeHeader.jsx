import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Palette, Sparkles, ShoppingBag, Store, Volume2, VolumeX } from "lucide-react";
import { useLang } from "../../i18n/i18n";
import NearbyHelp from "../NearbyHelp";
import ReigningChampBadge from "../ReigningChampBadge";
import FavoritesDrawer from "../FavoritesDrawer";
import InstallAppButton from "../InstallAppButton";
import BecomeSponsorDialog from "../BecomeSponsorDialog";

/** Steampunk: a faint watch-tick every 0.75s — the same cadence as the gear
 * notching behind the medallion — so the banner quietly keeps time. Every so
 * often a random steam burst hisses out, venting a volley of puffs from
 * behind the medallion (`ff:steam-burst` forces one, used for testing). */
function GearTicker() {
  const [burst, setBurst] = useState(0); // keyed puff volley behind the logo
  useEffect(() => {
    const tick = new Audio("/gear-tick.mp3");
    tick.volume = 0.12;
    const id = setInterval(() => {
      if (document.hidden || localStorage.getItem("ff_muted") === "1") return;
      try { tick.currentTime = 0; tick.play().catch(() => {}); } catch {}
    }, 750);
    // random steam bursts here and there (12-32s apart, varying strength)
    let steamTimer = null;
    let clearTimer = null;
    const vent = () => {
      if (localStorage.getItem("ff_muted") !== "1") {
        try { const s = new Audio("/steam-burst.mp3"); s.volume = 0.14 + Math.random() * 0.12; s.play().catch(() => {}); } catch {}
      }
      setBurst(Date.now()); // the vent blows even with the sound off
      clearTimeout(clearTimer);
      clearTimer = setTimeout(() => setBurst(0), 2400);
    };
    const scheduleSteam = () => {
      steamTimer = setTimeout(() => {
        if (!document.hidden) vent();
        scheduleSteam();
      }, 12000 + Math.random() * 20000);
    };
    scheduleSteam();
    window.addEventListener("ff:steam-burst", vent);
    return () => { clearInterval(id); clearTimeout(steamTimer); clearTimeout(clearTimer); window.removeEventListener("ff:steam-burst", vent); };
  }, []);
  if (!burst) return null;
  return (
    <div key={burst} className="pointer-events-none absolute -inset-3" data-testid="steam-logo-burst">
      {[0, 1, 2, 3, 4].map((i) => (
        <span
          key={i}
          className="absolute rounded-full"
          style={{
            left: `${16 + i * 16}%`, top: `${40 - (i % 2) * 12}%`,
            width: 13 + (i % 3) * 5, height: 13 + (i % 3) * 5,
            background: "radial-gradient(circle, rgba(238,233,223,0.9), rgba(200,195,185,0.35) 55%, transparent 75%)",
            filter: "blur(1.5px)",
            animation: `ffBreakPuff 1.5s ease-out ${(i * 0.16).toFixed(2)}s both`,
          }}
        />
      ))}
    </div>
  );
}

/**
 * Sticky Home header: logo, language toggle, theme menu (+ first-visit hint),
 * guided/shop/nearby/champ/sound controls, sponsor CTA and favorites drawer.
 * Purely presentational — all state lives in Home.
 */
export function HomeHeader({
  light, ghost, theme, themeHint, dismissThemeHint, hintColor, onOpenThemePicker,
  muted, toggleMuted, onGuided, zip, coords,
  favorites, removeFavorite, dealFromFavorites, groupMode,
  sponsorOpen, setSponsorOpen,
}) {
  const { t, lang, setLang } = useLang();
  return (
    <header className={`sticky top-0 z-30 border-b ${light ? "border-[#E4E4E7] bg-white/85 backdrop-blur-xl shadow-sm" : "border-[#E2E4E7] bg-[#0E0E0E]"}`}>
      <div className="mx-auto flex max-w-6xl flex-col gap-3 px-4 py-4 md:flex-row md:items-center md:justify-between md:gap-3 md:px-12 md:py-6">
        <div className="flex items-center gap-2 md:gap-3">
          <div className="relative shrink-0">
            {/* Steampunk: a brass gear slightly larger than the medallion,
                clicking clockwise behind it like a watch escapement */}
            {theme === "steam" && <GearTicker />}
            {theme === "steam" && (
              <div className="pointer-events-none absolute left-1/2 top-1/2 w-[134%] -translate-x-1/2 -translate-y-1/2" style={{ aspectRatio: "1" }} data-testid="steam-logo-gear">
                <div className="h-full w-full" style={{ animation: "ffLogoGearTick 36s steps(48, end) infinite", filter: "drop-shadow(0 1px 3px rgba(0,0,0,0.55))" }}>
                  <svg viewBox="0 0 100 100" className="h-full w-full">
                    {Array.from({ length: 12 }, (_, i) => (
                      <rect key={i} x={45.5} y={1} width={9} height={16} rx={2} fill="#B98A44" transform={`rotate(${i * 30} 50 50)`} />
                    ))}
                    <circle cx="50" cy="50" r="38" fill="#B98A44" />
                    <circle cx="50" cy="50" r="38" fill="none" stroke="#8A6428" strokeWidth="2" />
                  </svg>
                </div>
              </div>
            )}
            <div className={`relative h-12 w-12 overflow-hidden rounded-full md:h-16 md:w-16 ${light ? "ring-1 bg-[#F5F0E6] ring-[#E4E4E7]" : theme === "fairy" ? "bg-black ring-2 ring-[#E6B23A]" : "ring-1 bg-black ring-white/25"}`}>
            <img
              src={theme === "cyber" ? "/cyber-neon-logo.png" : theme === "fantasy" ? "/logo-ouroboros.png" : theme === "tiki" ? "/logo-tiki.png" : (light ? "/logo-mark-light.png" : "/logo-mark.png")}
              alt="Fork·Fate logo"
              className={`h-12 w-12 object-contain md:h-16 md:w-16 ${theme === "cyber" ? "p-0.5" : theme === "fantasy" || theme === "tiki" ? "" : "scale-110"}`}
              style={theme === "fairy" ? { filter: "hue-rotate(115deg) saturate(1.25) brightness(1.05)" } : undefined}
            />
            <motion.div
              className="pointer-events-none absolute inset-0"
              initial={{ x: "-130%" }}
              animate={{ x: ["-130%", "130%"] }}
              transition={{ duration: 2.6, delay: 0.5, repeat: Infinity, repeatDelay: 5, ease: "easeInOut" }}
              style={{ background: "linear-gradient(115deg, transparent 46%, rgba(255,255,255,0.85) 50%, transparent 54%)" }}
            />
            </div>
          </div>
          <span data-testid="ff-title" className={`inline-block font-serif text-3xl font-semibold tracking-tight md:text-5xl ${light ? "text-[#18181B]" : "text-white"}`}>
            Fork·Fate
          </span>
        </div>
        <div className="flex flex-wrap items-center justify-start gap-2 md:justify-end md:gap-3">
          <div data-testid="language-toggle" className={`inline-flex items-center rounded-full border p-0.5 ${ghost}`}>
            {["en", "es"].map((l) => (
              <button
                key={l}
                type="button"
                onClick={() => setLang(l)}
                data-testid={`lang-${l}`}
                aria-label={l === "es" ? "Español" : "English"}
                className={`rounded-full px-2.5 py-1 text-xs font-bold transition-colors sm:text-sm ${lang === l ? "bg-[#E01E26] text-white" : "opacity-70 hover:opacity-100"}`}
              >
                {l.toUpperCase()}
              </button>
            ))}
          </div>
          <div className="relative">
            <button
              type="button"
              onClick={() => { dismissThemeHint(); onOpenThemePicker(); }}
              data-testid="theme-menu-button"
              aria-label="Choose a theme"
              className={`inline-flex items-center gap-1.5 rounded-full border bg-transparent px-3 py-1.5 text-xs font-bold transition-colors sm:gap-2 sm:px-4 sm:py-2.5 sm:text-sm ${ghost}`}
            >
              <Palette className="h-4 w-4" /> <span>{t("Theme")}</span>
            </button>
            {themeHint && (
              <div data-testid="theme-hint" style={{ backgroundColor: hintColor }} className="absolute left-1/2 top-full z-40 mt-2 flex -translate-x-1/2 items-center gap-2 whitespace-nowrap rounded-full px-3 py-1.5 text-xs font-bold text-white shadow-lg">
                {t("Pick a theme")} 🍂
                <button onClick={dismissThemeHint} aria-label="Dismiss theme hint" className="opacity-80 hover:opacity-100">✕</button>
              </div>
            )}
          </div>
          <button
            onClick={onGuided}
            data-testid="relaunch-guided-button"
            title="Start the guided ritual"
            className={`inline-flex items-center gap-1.5 rounded-full border bg-transparent px-3 py-1.5 text-xs font-bold transition-colors sm:gap-2 sm:px-4 sm:py-2.5 sm:text-sm ${ghost}`}
          >
            <Sparkles className="h-4 w-4 text-[#E01E26]" /> <span>{t("Guided")}</span>
          </button>
          <Link
            to="/shop"
            data-testid="header-shop-link"
            title="Fork·Fate merch shop"
            className={`inline-flex items-center gap-1.5 rounded-full border bg-transparent px-3 py-1.5 text-xs font-bold transition-colors sm:gap-2 sm:px-4 sm:py-2.5 sm:text-sm ${ghost}`}
          >
            <ShoppingBag className="h-4 w-4 text-[#E01E26]" /> <span>{t("Shop")}</span>
          </Link>
          <NearbyHelp
            light={light}
            zip={zip}
            lat={coords?.lat ?? null}
            lng={coords?.lng ?? null}
          />
          <ReigningChampBadge light={light} />
          <button
            onClick={toggleMuted}
            data-testid="sound-toggle-button"
            title={muted ? "Sound off — click to enable the reveal sound" : "Sound on — click to mute"}
            aria-label={muted ? "Enable sound" : "Mute sound"}
            className={`inline-flex items-center justify-center rounded-full border bg-transparent p-2 transition-colors sm:p-2.5 ${ghost}`}
          >
            {muted ? <VolumeX className="h-4 w-4 text-[#8A8F95]" /> : <Volume2 className="h-4 w-4 text-[#E01E26]" />}
          </button>
          <BecomeSponsorDialog
            variant="link"
            open={sponsorOpen}
            onOpenChange={setSponsorOpen}
            hideTrigger
          />
          {/* Desktop: dedicated Sponsor button */}
          <button
            type="button"
            onClick={() => setSponsorOpen(true)}
            data-testid="header-sponsor-link"
            className={`hidden items-center gap-2 rounded-full border bg-transparent px-4 py-2.5 text-sm font-bold transition-colors sm:inline-flex ${ghost}`}
          >
            <Store className="h-4 w-4 text-[#E01E26]" /> {t("Sponsor your spot")}
          </button>
          <FavoritesDrawer favorites={favorites} onRemove={removeFavorite} onDeal={dealFromFavorites} groupMode={groupMode} />
          <InstallAppButton />
          {/* Mobile: compact Sponsor pill — adding a spot is a sponsor-only
              action now, so the old Add/Sponsor dropdown is collapsed to a
              single direct trigger. */}
          <button
            type="button"
            onClick={() => setSponsorOpen(true)}
            data-testid="mobile-sponsor-button"
            className="inline-flex items-center gap-1.5 rounded-full bg-[#E01E26] px-3 py-1.5 text-xs font-bold text-white transition-colors hover:bg-[#B3141A] sm:hidden"
          >
            <Store className="h-4 w-4" /> {t("Sponsor")}
          </button>
        </div>
      </div>
    </header>
  );
}
