import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Palette, ChevronDown, Moon, Sun, Leaf, Snowflake, Flower2, Umbrella, Zap, Cog, Wine, Swords, Check, Sparkles, ShoppingBag, Store, Volume2, VolumeX } from "lucide-react";
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from "../ui/dropdown-menu";
import { setTheme } from "../../hooks/useTheme";
import { useLang } from "../../i18n/i18n";
import NearbyHelp from "../NearbyHelp";
import ReigningChampBadge from "../ReigningChampBadge";
import FavoritesDrawer from "../FavoritesDrawer";
import InstallAppButton from "../InstallAppButton";
import BecomeSponsorDialog from "../BecomeSponsorDialog";

/**
 * Sticky Home header: logo, language toggle, theme menu (+ first-visit hint),
 * guided/shop/nearby/champ/sound controls, sponsor CTA and favorites drawer.
 * Purely presentational — all state lives in Home.
 */
export function HomeHeader({
  light, ghost, theme, themeHint, dismissThemeHint, hintColor,
  muted, toggleMuted, onGuided, zip, coords,
  favorites, removeFavorite, dealFromFavorites, groupMode,
  sponsorOpen, setSponsorOpen,
}) {
  const { t, lang, setLang } = useLang();
  return (
    <header className={`sticky top-0 z-30 border-b ${light ? "border-[#E4E4E7] bg-white/85 backdrop-blur-xl shadow-sm" : "border-[#E2E4E7] bg-[#0E0E0E]"}`}>
      <div className="mx-auto flex max-w-6xl flex-col gap-3 px-4 py-4 md:flex-row md:items-center md:justify-between md:gap-3 md:px-12 md:py-6">
        <div className="flex items-center gap-2 md:gap-3">
          <div className={`relative h-12 w-12 shrink-0 overflow-hidden rounded-full ring-1 md:h-16 md:w-16 ${light ? "bg-[#F5F0E6] ring-[#E4E4E7]" : "bg-black ring-white/25"}`}>
            <img
              src={theme === "cyber" ? "/cyber-neon-logo.png" : theme === "fantasy" ? "/logo-crest-gold.png" : (light ? "/logo-mark-light.png" : "/logo-mark.png")}
              alt="Fork·Fate logo"
              className={`h-12 w-12 object-contain md:h-16 md:w-16 ${theme === "cyber" ? "p-0.5" : "scale-110"}`}
            />
            <motion.div
              className="pointer-events-none absolute inset-0"
              initial={{ x: "-130%" }}
              animate={{ x: ["-130%", "130%"] }}
              transition={{ duration: 2.6, delay: 0.5, repeat: Infinity, repeatDelay: 5, ease: "easeInOut" }}
              style={{ background: "linear-gradient(115deg, transparent 46%, rgba(255,255,255,0.85) 50%, transparent 54%)" }}
            />
          </div>
          <span className={`font-serif text-3xl font-semibold tracking-tight md:text-5xl ${light ? "text-[#18181B]" : "text-white"}`}>
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
            <DropdownMenu onOpenChange={(o) => o && dismissThemeHint()}>
              <DropdownMenuTrigger asChild>
                <button
                  data-testid="theme-menu-button"
                  aria-label="Choose a theme"
                  className={`inline-flex items-center gap-1.5 rounded-full border bg-transparent px-3 py-1.5 text-xs font-bold transition-colors sm:gap-2 sm:px-4 sm:py-2.5 sm:text-sm ${ghost}`}
                >
                  <Palette className="h-4 w-4" /> <span>{t("Theme")}</span> <ChevronDown className="h-3.5 w-3.5 opacity-70" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" data-testid="theme-menu" className="w-40">
                <DropdownMenuItem data-testid="theme-option-dark" onClick={() => setTheme("dark")} className="gap-2">
                  <Moon className="h-4 w-4" /> {t("Dark")} {theme === "dark" && <Check className="ml-auto h-4 w-4" />}
                </DropdownMenuItem>
                <DropdownMenuItem data-testid="theme-option-light" onClick={() => setTheme("light")} className="gap-2">
                  <Sun className="h-4 w-4" /> {t("Light")} {theme === "light" && <Check className="ml-auto h-4 w-4" />}
                </DropdownMenuItem>
                <DropdownMenuItem data-testid="theme-option-fall" onClick={() => setTheme("fall")} className="gap-2">
                  <Leaf className="h-4 w-4" /> {t("Fall")} {theme === "fall" && <Check className="ml-auto h-4 w-4" />}
                </DropdownMenuItem>
                <DropdownMenuItem data-testid="theme-option-winter" onClick={() => setTheme("winter")} className="gap-2">
                  <Snowflake className="h-4 w-4" /> {t("Winter")} {theme === "winter" && <Check className="ml-auto h-4 w-4" />}
                </DropdownMenuItem>
                <DropdownMenuItem data-testid="theme-option-spring" onClick={() => setTheme("spring")} className="gap-2">
                  <Flower2 className="h-4 w-4" /> {t("Spring")} {theme === "spring" && <Check className="ml-auto h-4 w-4" />}
                </DropdownMenuItem>
                <DropdownMenuItem data-testid="theme-option-summer" onClick={() => setTheme("summer")} className="gap-2">
                  <Umbrella className="h-4 w-4" /> {t("Summer")} {theme === "summer" && <Check className="ml-auto h-4 w-4" />}
                </DropdownMenuItem>
                <DropdownMenuItem data-testid="theme-option-cyber" onClick={() => setTheme("cyber")} className="gap-2">
                  <Zap className="h-4 w-4" /> {t("Cyberpunk")} {theme === "cyber" && <Check className="ml-auto h-4 w-4" />}
                </DropdownMenuItem>
                <DropdownMenuItem data-testid="theme-option-steam" onClick={() => setTheme("steam")} className="gap-2">
                  <Cog className="h-4 w-4" /> {t("Steampunk")} {theme === "steam" && <Check className="ml-auto h-4 w-4" />}
                </DropdownMenuItem>
                <DropdownMenuItem data-testid="theme-option-tiki" onClick={() => setTheme("tiki")} className="gap-2">
                  <Wine className="h-4 w-4" /> {t("Tiki Lounge")} {theme === "tiki" && <Check className="ml-auto h-4 w-4" />}
                </DropdownMenuItem>
                <DropdownMenuItem data-testid="theme-option-fantasy" onClick={() => setTheme("fantasy")} className="gap-2">
                  <Swords className="h-4 w-4" /> {t("Dragon's Hoard")} {theme === "fantasy" && <Check className="ml-auto h-4 w-4" />}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
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
