import React, { useState, useRef, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { ShoppingBag, Fuel, Coffee, IceCream, Clock, Beer, UtensilsCrossed, Mountain, Tent } from "lucide-react";
import BecomeSponsorDialog from "../components/BecomeSponsorDialog";
import SponsorMarquee from "../components/SponsorMarquee";
import SocialShare from "../components/SocialShare";
import { useFavorites } from "../hooks/useFavorites";
import { useShake, requestMotionPermission } from "../hooks/useShake";
import { useShareTarget } from "../hooks/useShareTarget";
import GuidedFlow from "../components/GuidedFlow";
import ModeGuide from "../components/guided/ModeGuide";
import ThemeWelcomeDialog from "../components/ThemeWelcomeDialog";
import ParchmentIntro from "../components/ParchmentIntro";
import { HomeHeader } from "../components/home/HomeHeader";
import { HomeInfoSections } from "../components/home/HomeInfoSections";
import { HomeFooter } from "../components/home/HomeFooter";
import PubCrawlDialog from "../components/PubCrawlDialog";
import PassportDialog from "../components/PassportDialog";
import ModeChooserDialog from "../components/home/ModeChooserDialog";
import RevealStage from "../components/home/RevealStage";
import { PassportPicker } from "../components/home/PassportPicker";
import { GhostEscort, SteamRise } from "../components/home/ThemeFlourish";
import { GroupPicker } from "../components/home/GroupPicker";
import { HeroCopy } from "../components/home/HeroCopy";
import { LocationRadiusPanel } from "../components/home/LocationRadiusPanel";
import { ModeTabsGrid, CuisineSection } from "../components/home/ModeTabsGrid";
import { DealRow } from "../components/home/DealRow";
import { MoreWaysToPlay } from "../components/home/MoreWaysToPlay";
import { StatsRibbon } from "../components/home/StatsRibbon";
import { FloatingToggles } from "../components/home/FloatingToggles";
import { RealmLayers } from "../components/home/RealmLayers";
import { NearbyResults } from "../components/home/NearbyResults";
import { haptic } from "../lib/pwa";
import confetti from "canvas-confetti";
import {
  readStreak, bumpStreak, streakMilestone,
  FOOD_CUISINES, FOOD_GROUPS, DRINK_CUISINES, DESSERT_CUISINES, BAR_CUISINES, BAR_GROUPS, SHOP_CUISINES, FUEL_CUISINES, FUEL_GROUPS, EXPLORE_CUISINES, EXPLORE_GROUPS, STAY_CUISINES, CRAWL_TYPES, crawlLabelForType, orderCrawlRoute,
} from "./homeConstants";
import { useTheme } from "../hooks/useTheme";
import { useLang } from "../i18n/i18n";
import { trackEvent } from "../lib/analytics";
import { activeSeason } from "../lib/seasons";

// Numbered badge heading one step of the solo "A Table for One" flow.
const StepLabel = ({ n, children }) => (
  <div className="mb-2.5 flex items-center gap-2" data-testid={`solo-step-${n}`}>
    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#E01E26] font-sans text-xs font-bold text-white shadow-sm">{n}</span>
    <span className="font-sans text-xs font-bold uppercase tracking-[0.2em] text-[#6B7075]">{children}</span>
  </div>
);
import { recordRitualSeen, readRitualsSeen, RITUALS } from "../lib/rituals";
import { claimDaily, awardPoints, EARN } from "../lib/points";
import BlackoutRitual from "../components/BlackoutRitual";
import { recordFate } from "../lib/journal";
import { markCuisine } from "../lib/bingo";
import { readPassports, rememberPassport } from "../lib/passports";
import { SEASONS, AMBIANCE } from "../components/ThemeScenes";
import { ShuffleOverlay } from "../components/home/ShuffleOverlay";
import { RevealFlash } from "../components/home/RevealFlash";
import { CrawlSetupPanel } from "../components/home/CrawlSetupPanel";
import { shouldRareFate, rarePoolFor } from "../lib/rareFate";
import { SHUFFLE_LOOPS, playSound } from "../lib/sound";
import { haversineMi, resolveCoords, computeFateOfDay } from "../lib/geo";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;


export default function Home() {
  const { theme } = useTheme();
  const navigate = useNavigate();
  const { t } = useLang();
  const ambCfg = AMBIANCE[theme] || null;
  // Fall is a seasonal theme but reads DARK since the moonlit-forest makeover.
  const light = !(theme === "dark" || theme === "fall" || ambCfg);
  const seasonCfg = SEASONS[theme] || null;
  const season = seasonCfg ? theme : null;
  const auraAccent = ambCfg ? ambCfg.accent : (seasonCfg ? seasonCfg.hint : "#E01E26");
  const ghost = light
    ? "border-[#E4E4E7] text-[#3F3F46] hover:bg-[#F4F4F5]"
    : "border-white/25 text-white hover:bg-white/10";
  const labelColor = light ? undefined : (ambCfg ? ambCfg.sky : "#FFFFFF");
  const [themeHint, setThemeHint] = useState(() => {
    try { return localStorage.getItem("ff_theme_hint_seen") !== "1"; } catch (e) { return false; }
  });
  const dismissThemeHint = () => {
    setThemeHint(false);
    try { localStorage.setItem("ff_theme_hint_seen", "1"); } catch (e) { /* ignore */ }
  };
  useEffect(() => {
    if (!themeHint) return;
    const t = setTimeout(() => dismissThemeHint(), 6000);
    return () => clearTimeout(t);
  }, [themeHint]);
  // First-run "Choose your realm" window — appears before the guided ritual's
  // first step; sealed once so returning visitors go straight in.
  const [showThemeWelcome, setShowThemeWelcome] = useState(() => {
    try { return localStorage.getItem("ff_theme_chosen") !== "1"; } catch (e) { return false; }
  });
  const sealThemeChoice = () => {
    setShowThemeWelcome(false);
    // Realm sealed — ask which table fate deals at first (Solo/Groups/Crawls/Passports).
    setShowModeChooser(true);
    try { localStorage.setItem("ff_theme_chosen", "1"); } catch (e) { /* ignore */ }
    trackEvent("theme_welcome_done", { theme });
    dismissThemeHint();
  };
  const [showModeChooser, setShowModeChooser] = useState(false);
  // PARCHMENT FIELD GUIDE: shown once before the realm chooser on a brand-new
  // device; reopenable via the footer's "How to play" (ff:open-guide event).
  const [showGuide, setShowGuide] = useState(() => {
    try { return localStorage.getItem("ff_guide_seen") !== "1"; } catch (e) { return false; }
  });
  // The FIRST parchment close always leads into the realm chooser — even on
  // devices that sealed a realm before the guide existed. Footer reopens don't.
  const guideFirstRun = useRef(showGuide);
  const guideDone = () => {
    setShowGuide(false);
    if (guideFirstRun.current) {
      guideFirstRun.current = false;
      setShowThemeWelcome(true);
    }
  };
  useEffect(() => {
    const open = () => setShowGuide(true);
    window.addEventListener("ff:open-guide", open);
    return () => window.removeEventListener("ff:open-guide", open);
  }, []);
  const [mode, setMode] = useState("food");
  const [zip, setZip] = useState("");
  const [destination, setDestination] = useState("");
  const [coords, setCoords] = useState(null);
  const [geoLoading, setGeoLoading] = useState(false);
  const [selectedCuisines, setSelectedCuisines] = useState([]);
  const [openNow, setOpenNow] = useState(false);
  const [radius, setRadius] = useState(50);
  const [results, setResults] = useState([]);
  const [sortBy, setSortBy] = useState("default");

  const [loading, setLoading] = useState(false);
  const [spinning, setSpinning] = useState(false);
  const [result, setResult] = useState(null);
  const [groupMode, setGroupMode] = useState(false);
  const [sponsorOpen, setSponsorOpen] = useState(false);
  const [groupPicks, setGroupPicks] = useState(null);
  const [crawlMode, setCrawlMode] = useState(false);
  const [passportMode, setPassportMode] = useState(false);
  const [passportSize, setPassportSize] = useState(5);
  const [myPassports, setMyPassports] = useState(() => readPassports());
  // Freshly dealt passport shown in the crawl-style reveal window (code string).
  const [passportReveal, setPassportReveal] = useState(null);
  // The chip list is long; collapse it once fate has spoken so the reveal card
  // isn't buried under filters.
  // Every dropdown starts CLOSED on a fresh visit — the cuisine list only
  // opens when the user taps it.
  const [filtersOpen, setFiltersOpen] = useState(false);
  // "Double or Nothing": one reroll, but the new pick is final.
  const [locked, setLocked] = useState(false);
  // Rare-fate scratch surprise ("scratch" | null) + swipe-to-reroll budget.
  const [surpriseReveal, setSurpriseReveal] = useState(null);
  // True while a rare 8-ball is incoming: suppresses the full-screen shuffle
  // popup entirely — the magic happens inside the ball, no cards at all.
  const [rare8Ball, setRare8Ball] = useState(false);
  const [rerollsLeft, setRerollsLeft] = useState(3);
  // Set by the backend only for Explore searches with no chips picked — the deck
  // is biased by the forecast, so we say so instead of silently changing results.
  const [weather, setWeather] = useState(null);
  // Tapping the lit category tab turns it off: "anything goes" deals from the four
  // everyday categories at once instead of forcing a choice.
  const [allMode, setAllMode] = useState(false);
  const ANY_CATEGORIES = ["food", "drinks", "bars", "desserts"];
  // PASSPORT_CATEGORIES is derived from MODE_TABS below (defined after it).

  // Turning on a special mode reveals its panel BELOW the toggles. Land on the
  // panel's TOP (block: "center" dropped users into the middle of the form, past
  // the how-it-works steps), leaving a little breathing room above it.
  useEffect(() => {
    const id = passportMode ? "passport-picker" : groupMode ? "group-picker" : crawlMode ? "crawl-type-picker" : null;
    if (!id) return;
    const timer = setTimeout(() => {
      const el = document.querySelector(`[data-testid="${id}"]`);
      if (!el) return;
      const top = el.getBoundingClientRect().top + window.scrollY - 16;
      window.scrollTo({ top: Math.max(0, top), behavior: "smooth" });
    }, 120);
    return () => clearTimeout(timer);
  }, [passportMode, groupMode, crawlMode]);
  const [crawlType, setCrawlType] = useState("pubs");
  const [zipB, setZipB] = useState("");
  const [coordsB, setCoordsB] = useState(null);
  const [geoLoadingB, setGeoLoadingB] = useState(false);
  const [showCrawl, setShowCrawl] = useState(false);
  const [crawlEndpoints, setCrawlEndpoints] = useState({ origin: null, destination: null });
  const [crawlStops, setCrawlStops] = useState(null);
  const [fatesDealt, setFatesDealt] = useState(null);
  const [crawlsCompleted, setCrawlsCompleted] = useState(null);
  const [streak, setStreak] = useState(() => readStreak());
  const [flash, setFlash] = useState(null);
  const [flashHit, setFlashHit] = useState(false);
  const [revealFlash, setRevealFlash] = useState(false);
  const shuffleRef = useRef(null);
  const resultRef = useRef(null);
  const lastPickRef = useRef(null);
  const thunderRef = useRef(null);
  const grooveRef = useRef(null);
  // Card-riffle synthesised layer was removed — it produced a buzzing artefact on
  // mobile speakers underneath every theme's shuffle. Theme ambience now plays clean.
  const stopCards = () => {};
  const startCards = () => {};
  useEffect(() => () => { if (grooveRef.current) { try { grooveRef.current.pause(); } catch (e) { /* ignore */ } grooveRef.current = null; } }, []);
  const { favorites, isFavorite, toggleFavorite, removeFavorite } = useFavorites();
  // PWA share target: a friend shares a restaurant INTO Fork·Fate — saved to Favorites.
  useShareTarget({ t, isFavorite, toggleFavorite });
  const [showGuided, setShowGuided] = useState(true);

  // SCENERY MODE: fades every card/pill/word below the header so the realm
  // (heists, companions, sailboat…) can be admired. Session-only by design.
  const [scenery, setScenery] = useState(false);
  const toggleScenery = () => {
    setScenery((s) => {
      const on = !s;
      if (on) {
        try {
          if (!localStorage.getItem("ff_scenery_tip")) {
            localStorage.setItem("ff_scenery_tip", "1");
            toast(t("Enjoy the view — tap the eye to bring everything back"));
          }
        } catch (e) { /* storage unavailable */ }
      }
      return on;
    });
  };
  const [muted, setMuted] = useState(() => {
    try { return localStorage.getItem("ff_muted") === "1"; } catch { return false; }
  });
  const toggleMuted = () => {
    setMuted((m) => {
      const next = !m;
      try { localStorage.setItem("ff_muted", next ? "1" : "0"); } catch (e) { /* storage unavailable */ }
      return next;
    });
  };
  const [mysticalReveal, setMysticalReveal] = useState(false);

  // Heists check this before striking so they never interrupt the show
  // (mid-shuffle, mid-reveal, or while the guided intro is up). When fate
  // turns busy, heistEpoch bumps — remounting every heist layer so any strike
  // already mid-run aborts instantly (its unmount cleanup restores the logo).
  const [heistEpoch, setHeistEpoch] = useState(0);
  const [blackout, setBlackout] = useState(false); // BINGO blackout celebration
  useEffect(() => {
    const busy = !!(spinning || loading || surpriseReveal || showGuided || mysticalReveal || blackout);
    const was = window.__ffFateBusy;
    window.__ffFateBusy = busy;
    if (busy && !was) setHeistEpoch((n) => n + 1);
  }, [spinning, loading, surpriseReveal, showGuided, mysticalReveal, blackout]);

  const finishGuided = () => {
    setShowGuided(false);
  };

  const sealFate = ({ mode: m, zip: z, coords: c, radius: r, cuisines }) => {
    setMode(m);
    setZip(z || "");
    setCoords(c || null);
    setRadius(r);
    setSelectedCuisines(cuisines);
    setMysticalReveal(true);
    requestMotionPermission();
    finishGuided();
    trackEvent("seal_fate", { category: m, radius_mi: r, cuisine_count: (cuisines || []).length, theme });
    doSearch(cuisines, [], m, c || null, { zipArg: z || "", radiusArg: r });
  };

  useEffect(() => {
    if (result && mysticalReveal) {
      const t = setTimeout(() => setMysticalReveal(false), 3000);
      return () => clearTimeout(t);
    }
  }, [result, mysticalReveal]);

  useEffect(() => {
    if ((result || groupPicks) && resultRef.current) {
      setTimeout(() => {
        if (!resultRef.current) return;
        const y = resultRef.current.getBoundingClientRect().top + window.scrollY - 88;
        window.scrollTo({ top: Math.max(0, y), behavior: "smooth" });
      }, 120);
      // Gently nudge a home-screen install after fate has been dealt (once per device).
      setTimeout(() => window.dispatchEvent(new CustomEvent("ff:shuffle-success")), 2500);
    }
  }, [result, groupPicks]);

  useEffect(() => {
    axios.get(`${API}/stats/fates`).then(({ data }) => setFatesDealt(data.count)).catch(() => {});
    axios.get(`${API}/stats/crawls`).then(({ data }) => setCrawlsCompleted(data.count)).catch(() => {});
  }, []);

  const toggle = (setter, arr, val) =>
    setter(arr.includes(val) ? arr.filter((x) => x !== val) : [...arr, val]);

  // One source of truth for the 8 category tabs — reused by the main tab grid and
  // by the Passport panel, which needs its own visible category picker (users
  // couldn't tell what category a passport was being dealt from).
  const MODE_TABS = [
    { key: "food", label: t("Food"), Icon: UtensilsCrossed },
    { key: "drinks", label: t("Drinks"), Icon: Coffee },
    { key: "bars", label: t("Bars"), Icon: Beer },
    { key: "desserts", label: t("Desserts"), Icon: IceCream },
    { key: "shops", label: t("Shops"), Icon: ShoppingBag },
    { key: "fuel", label: t("Fuel & Go"), Icon: Fuel },
    { key: "explore", label: t("Explore"), Icon: Mountain },
    { key: "stay", label: t("Stay"), Icon: Tent },
  ];
  const modeLabel = MODE_TABS.find((m) => m.key === mode)?.label || mode;
  // Every category can be a passport: a brewery tour or a museum run can stretch
  // over a whole day (or a summer), which is a passport, not a one-night crawl.
  const PASSPORT_CATEGORIES = MODE_TABS.map((m) => m.key);
  const cuisineLabel = mode === "food" ? t("Cuisine") : mode === "drinks" ? t("Drink type") : mode === "bars" ? t("Bar type") : mode === "desserts" ? t("Dessert type") : mode === "shops" ? t("Shop type") : mode === "explore" ? t("Activity") : mode === "stay" ? t("Stay type") : t("Fuel type");

  const switchMode = (m) => {    if (m === mode) return;
    setMode(m);
    setSelectedCuisines([]);
    setResults([]);
    setResult(null);
    setGroupPicks(null);
  };

  const applyCrawlType = (t) => {
    if (t.mode !== mode) switchMode(t.mode);
    setSelectedCuisines([t.cuisine]);
    setCrawlType(t.key);
    setResult(null);
    setGroupPicks(null);
  };

  const activeCuisineGroups = mode === "explore" ? EXPLORE_GROUPS : mode === "food" ? FOOD_GROUPS : mode === "bars" ? BAR_GROUPS : mode === "fuel" ? FUEL_GROUPS : null;
  const cuisineList = mode === "food" ? FOOD_CUISINES : mode === "drinks" ? DRINK_CUISINES : mode === "bars" ? BAR_CUISINES : mode === "desserts" ? DESSERT_CUISINES : mode === "shops" ? SHOP_CUISINES : mode === "explore" ? EXPLORE_CUISINES : mode === "stay" ? STAY_CUISINES : FUEL_CUISINES;
  // Outdoor recreation and lodging are genuinely further out than dinner — a state
  // park or campground 80 miles away is a reasonable weekend answer, a taco place
  // 80 miles away is not. Default stays 50 for every tab.
  const radiusMax = mode === "explore" || mode === "stay" ? 150 : 100;

  // SEASON OPENING ALERT: the first visit while a limited-time season is live
  // gets a one-time announcement (per season, per year) so nobody misses one.
  useEffect(() => {
    const s = activeSeason();
    if (!s) return undefined;
    const mark = `${s.id}-${new Date().getFullYear()}`;
    try {
      if (localStorage.getItem("ff_season_announced") === mark) return undefined;
    } catch (e) { return undefined; }
    const tm = setTimeout(() => {
      try { localStorage.setItem("ff_season_announced", mark); } catch (e) { /* ignore */ }
      toast(t("A seasonal event is live!"), {
        description: `${s.name} (${s.start.replace("-", "/")} – ${s.end.replace("-", "/")}) — ${s.desc}`,
        duration: 12000,
        style: { background: "#17101B", border: `1px solid ${s.accent}`, color: s.accent },
      });
    }, 6000);
    return () => clearTimeout(tm);
  }, []); // once per load; t is stable enough for a fire-and-forget toast

  // SAVE-PROGRESS NUDGE: once a player has earned several trophies and never
  // backed up, gently point them at the Save Progress card — one time only.
  useEffect(() => {
    try {
      if (localStorage.getItem("ff_progress_saved") === "1") return undefined;
      if (localStorage.getItem("ff_backup_nudged") === "1") return undefined;
      const n = (k) => Object.keys(JSON.parse(localStorage.getItem(k) || "{}")).length;
      if (n("ff_rituals_seen") + n("ff_heists_seen") < 5) return undefined;
    } catch (e) { return undefined; }
    const tm = setTimeout(() => {
      try { localStorage.setItem("ff_backup_nudged", "1"); } catch (e) { /* ignore */ }
      toast(t("Your trophy shelf is growing!"), {
        description: t("Trophies live only on this device — save your progress once so a cache clear can't take them."),
        duration: 14000,
        action: {
          label: t("Save now"),
          onClick: () => {
            const el = document.querySelector('[data-testid="save-progress"]');
            if (!el) return;
            el.scrollIntoView({ behavior: "smooth", block: "center" });
            el.classList.add("ff-nudge-glow");
            setTimeout(() => el.classList.remove("ff-nudge-glow"), 3400);
          },
        },
      });
    }, 12000);
    return () => clearTimeout(tm);
  }, []); // once per load; t stable enough for a fire-and-forget toast

  // DAILY FATE POINTS: first visit of each day earns points (+streak bonus).
  useEffect(() => {
    const tm = setTimeout(() => {
      const res = claimDaily();
      if (!res) return;
      toast.success(`+${res.awarded} ${t("Fate Points")}`, {
        description: res.streak > 1
          ? `${res.streak}-${t("day streak! Balance:")} ${res.total}`
          : t("Come back tomorrow for a streak bonus."),
        duration: 6000,
      });
    }, 4000);
    return () => clearTimeout(tm);
  }, []); // once per load; t stable enough for a fire-and-forget toast

  // Every 10 deal taps (persisted per device) fate arrives as a RARE ritual
  // instead of the usual shuffle reveal.
  // Bump the daily streak and throw confetti + a toast the first time a
  // 7- or 30-day milestone is reached (once per streak run).
  const dealStreak = () => {
    const { count, saved } = bumpStreak();
    if (saved) toast(t("A grace day saved your streak — fate is merciful."), { duration: 5000 });
    const m = streakMilestone(count);
    if (m) {
      const colors = ["#E01E26", "#E6B23A", "#FFFFFF"];
      try {
        confetti({ particleCount: 90, spread: 70, startVelocity: 45, origin: { x: 0.12, y: 0.8 }, colors });
        confetti({ particleCount: 90, spread: 70, startVelocity: 45, origin: { x: 0.88, y: 0.8 }, colors });
        setTimeout(() => confetti({ particleCount: 150, spread: 110, startVelocity: 40, origin: { x: 0.5, y: 0.55 }, colors }), 400);
      } catch (e) { /* canvas unavailable */ }
      haptic(30);
      toast.success(
        m === 30 ? t("30-day streak! A month of fates — legendary.") : t("7-day streak! Fate favors the faithful."),
        { duration: 6000 }
      );
      trackEvent("streak_milestone", { days: m });
    }
    return count;
  };

  // Lands a fate: writes it into the on-device Fate Journal, stamps the
  // Cuisine Bingo card, then reveals it.
  const lastSearchRef = useRef(null);

  // FATE DUEL: lock in this pick + the search grounds, mint a share link the
  // rival opens at /d/<code> to spin the SAME location. Fate crowns a winner.
  const startDuel = async (card) => {
    try {
      const search = lastSearchRef.current
        || (card.lat != null ? { lat: card.lat, lng: card.lng, category: mode, radius_miles: 15 } : { category: mode });
      const { data } = await axios.post(`${API}/duels`, {
        challenger: localStorage.getItem("ff_duel_name") || "A challenger",
        pick: {
          id: card.id || "",
          name: card.name,
          cuisine: card.cuisine || "",
          address: card.address || "",
          image: card.photo_url || card.image || "",
        },
        search,
      });
      const code = data.code;
      try { localStorage.setItem(`ff_duel_mine_${code}`, "1"); } catch (e) { /* ignore */ }
      const url = `${window.location.origin}/d/${code}`;
      const text = t("I challenge you to a Fate Duel! Fate dealt me") + ` ${card.name} — ` + t("let it deal yours and see who fate favors:");
      trackEvent("duel_created", { mode });
      try {
        if (navigator.share) await navigator.share({ title: "Fate Duel", text, url });
        else await navigator.clipboard.writeText(`${text} ${url}`);
      } catch (e) { /* share sheet cancelled */ }
      toast.success(t("Duel created! Send the link, then watch the arena."), {
        action: { label: t("View duel"), onClick: () => navigate(`/d/${code}`) },
        duration: 8000,
      });
    } catch (e) {
      toast.error(t("Couldn't forge the duel — try again"));
    }
  };

  const landFate = (card, extra = {}) => {
    recordFate(card, { theme, mode, ...extra });
    const b = markCuisine(card.cuisine);
    if (b?.blackout) {
      // BLACKOUT: all 25 squares stamped — the rarest feat in the collection.
      recordRitualSeen("blackout");
      awardPoints(EARN.ritual, "Rare fate: Blackout");
      setBlackout(true);
      try {
        confetti({ particleCount: 160, spread: 100, startVelocity: 48, origin: { x: 0.5, y: 0.6 }, colors: ["#E6B23A", "#F5D98B", "#FFFFFF"] });
        setTimeout(() => confetti({ particleCount: 120, spread: 120, startVelocity: 40, origin: { x: 0.5, y: 0.4 }, colors: ["#E6B23A", "#C08A2E"] }), 600);
      } catch (e) { /* canvas unavailable */ }
      trackEvent("bingo_blackout", { stamps: b.stamps });
    } else if (b?.newLines) {
      try {
        confetti({ particleCount: 80, spread: 75, startVelocity: 38, origin: { x: 0.5, y: 0.7 }, colors: ["#E6B23A", "#E01E26", "#FFFFFF"] });
      } catch (e) { /* canvas unavailable */ }
      toast.success(t("BINGO! Line complete — stamp earned."), {
        action: { label: t("View card"), onClick: () => navigate("/bingo") },
        duration: 6000,
      });
      trackEvent("bingo_line", { stamps: b.stamps });
    } else if (b?.hit) {
      toast(`${t("Bingo square stamped:")} ${t(b.square)}`, { duration: 3500 });
    }
    setResult(card);
    // The pixie (and future companions) celebrate a landed fate.
    window.dispatchEvent(new Event("ff:fate-dealt"));
  };

  // Scratch completed: unveil with the full reveal fanfare (boom + flash).
  const surpriseDone = () => {
    // A fate counts as "witnessed" only once the ritual concludes; first-time
    // rituals earn a toast nudging the player to their collection.
    if (surpriseReveal) {
      const firstTime = !readRitualsSeen()[surpriseReveal]?.count;
      recordRitualSeen(surpriseReveal);
      awardPoints(EARN.ritual, `Rare fate: ${surpriseReveal}`);
      if (firstTime) {
        const ritual = RITUALS.find((r) => r.key === surpriseReveal);
        toast(t("New fate witnessed!"), {
          description: `${ritual ? t(ritual.name) : ""} · +${EARN.ritual} pts`,
          action: { label: t("Collection"), onClick: () => navigate("/rituals") },
          duration: 6000,
        });
      }
    }
    setSurpriseReveal(null);
    haptic(20);
    try {
      if (thunderRef.current) { thunderRef.current.currentTime = 0; thunderRef.current.play().catch(() => {}); }
      else playSound(theme === "light" ? "/barista-bell.mp3" : light ? "/reveal-tada.wav" : "/reveal-thunder-v4.mp3", 1.0);
    } catch (e) { /* audio unavailable */ }
    setRevealFlash(true);
    setTimeout(() => setRevealFlash(false), 1400);
    trackEvent("rare_fate_revealed", { category: mode, theme });
  };

  const runShuffle = (pool) => {
    // Re-shuffling away from a fate that was already dealt? The pixie pouts.
    if (result) window.dispatchEvent(new Event("ff:reshuffle"));
    setResult(null);
    setGroupPicks(null);
    setSurpriseReveal(null);
    setRare8Ball(false);
    setSpinning(true);
    setLocked(false);
    setFiltersOpen(false);
    setFlashHit(false);
    setRevealFlash(false);
    // Preload the reveal sound now (inside the click gesture) so it reliably plays.
    // Light mode: cheerful "Ta-Da!" chime. Dark mode: ominous thunderclap.
    // Tiki: tribal groove starts NOW during the shuffle; timpani boom lands on reveal.
    try {
      if (grooveRef.current) { try { grooveRef.current.pause(); } catch (e0) { /* ignore */ } grooveRef.current = null; }
      if (localStorage.getItem("ff_muted") !== "1") {
        const revealSrc = { light: "/barista-bell.mp3", cyber: "/reveal-cyber.mp3?v=3", tiki: "/reveal-drums-boom.wav", spring: "/reveal-koto.wav", steam: "/reveal-steam.wav", winter: "/reveal-santa.wav", fall: "/reveal-owl.wav?v=4", fantasy: "/reveal-dragon.mp3", fairy: "/reveal-fairy.wav" }[theme] || (light ? "/reveal-tada.wav" : "/reveal-thunder-v4.mp3");
        thunderRef.current = new Audio(revealSrc);
        thunderRef.current.volume = 1.0;
        thunderRef.current.load();
        // Themed ambience that starts during the shuffle. [src, volume, loop]
        const loop = SHUFFLE_LOOPS[theme];
        if (loop) {
          grooveRef.current = new Audio(loop[0]);
          grooveRef.current.loop = loop[2];
          grooveRef.current.volume = loop[1];
          grooveRef.current.play().catch(() => {});
        }
      } else {
        thunderRef.current = null;
        grooveRef.current = null;
      }
    } catch (e) { thunderRef.current = null; grooveRef.current = null; }
    // Decide the rare-fate surprise up front so the audio can adapt: the rare
    // rituals bring their own sounds (cymbal swell, wheel tick), so the spoken
    // voice cue must not talk over them.
    const rareFate = !groupMode && shouldRareFate();
    // Dark mode plays a spoken voice cue before the deck shuffles; realms with
    // their own shuffle bed (fall leaves, winter wind, tiki drums…) stay clean
    // so the voice never talks over them.
    if (!light && !rareFate && !SHUFFLE_LOOPS[theme]) playSound("/reveal-voice-v5.mp3", 1.0);
    // Reroll-if-closed: gently prefer open spots, but only when enough are open
    // to keep variety. Also avoid repeating the previous pick back-to-back.
    const openPool = pool.filter((p) => p.open_now);
    const varietyPool = openPool.length >= 5 ? openPool : pool;
    const avoidId = lastPickRef.current;
    const noRepeat = varietyPool.filter((p) => p.id !== avoidId);
    const candidates = noRepeat.length ? noRepeat : varietyPool;
    const pick = (exclude = new Set()) => {
      const avail = candidates.filter((c) => !exclude.has(c.id));
      const from = avail.length ? avail : candidates;
      return from[Math.floor(Math.random() * from.length)];
    };
    // Group mode deals 3 distinct candidates to vote on; single mode deals one.
    let chosen;
    let picks = null;
    if (groupMode) {
      const seen = new Set();
      picks = [];
      for (let g = 0; g < candidates.length && picks.length < 3; g++) {
        const c = pick(seen);
        if (!seen.has(c.id)) { seen.add(c.id); picks.push(c); }
      }
      chosen = picks[0];
    } else {
      chosen = pick();
    }
    lastPickRef.current = chosen?.id ?? null;
    // RARE FATE: skip the ticker (it would flash the winner's name) — after a
    // short dramatic beat, present the winner hidden behind a surprise ritual:
    // themed scratch foil, or a Magic 8-ball the user must shake.
    if (rareFate) {
      // Theme-exclusive ritual pools live in lib/rareFate.js.
      const pool2 = rarePoolFor(theme);
      let variant = pool2[Math.floor(Math.random() * pool2.length)];
      try {
        const forced = localStorage.getItem("ff_rare_force");
        if (pool2.includes(forced)) variant = forced;
      } catch (e) { /* ignore */ }
      // The 8-ball IS the whole ritual — no shuffling deck beforehand, it
      // appears almost instantly. Scratch/wheel keep a short dramatic beat.
      const beat = variant === "8ball" ? 150 : 900;
      if (variant === "8ball") setRare8Ball(true);
      shuffleRef.current = setTimeout(() => {
        try {
          if (variant !== "8ball") playSound("/card-deal.wav", 0.85);
          if (grooveRef.current) { try { grooveRef.current.pause(); } catch (e3) { /* ignore */ } grooveRef.current = null; }
        } catch (e) { /* audio unavailable */ }
        haptic(20);
        landFate(chosen);
        setSurpriseReveal(variant);
        setSpinning(false);
        setFlash(null);
        axios.post(`${API}/stats/fate-dealt`).then(({ data }) => setFatesDealt(data.count)).catch(() => {});
        setStreak(dealStreak());
        trackEvent("deal_result", { category: mode, theme, group: false, rare: variant });
      }, beat);
      return;
    }
    let i = 0;
    let delay = 55; // fast start
    const maxDelay = 300; // slow end
    // Random name on each flick. Walking the pool in order (pool[i % len]) made the
    // ticker look like it was counting down a list instead of shuffling a deck.
    let lastFlashIdx = -1;
    const nextFlash = () => {
      let idx = Math.floor(Math.random() * pool.length);
      if (pool.length > 1 && idx === lastFlashIdx) idx = (idx + 1) % pool.length;
      lastFlashIdx = idx;
      return pool[idx];
    };
    const step = () => {
      setFlash(nextFlash());
      i++;
      delay = delay * 1.16 + 4; // ease-out: each flick a bit slower
      if (delay < maxDelay) {
        shuffleRef.current = setTimeout(step, delay);
      } else {
        // Deck lands on the winner: boom + flash the instant the card is presented
        setFlash(chosen);
        shuffleRef.current = setTimeout(() => {
          setFlashHit(true);
          // Physical "clunk" haptic on the card-drop moment. Feels native on
          // iOS wrapper + Android; no-op harmless in browsers without vibrate.
          haptic(20);
          // Thunder boom + 3x screen flash hit exactly as the winner is revealed
          try {
            stopCards();
            playSound("/card-deal.wav", 0.85);  // crisp card-down snap on the reveal
            if (grooveRef.current) { try { grooveRef.current.pause(); } catch (e2) { /* ignore */ } grooveRef.current = null; }
            if (thunderRef.current) { thunderRef.current.currentTime = 0; thunderRef.current.play().catch(() => {}); }
            else playSound(theme === "light" ? "/barista-bell.mp3" : light ? "/reveal-tada.wav" : "/reveal-thunder-v4.mp3", 1.0);
          } catch (e) { /* audio unavailable */ }
          setRevealFlash(true);
          setTimeout(() => setRevealFlash(false), 1400);
          shuffleRef.current = setTimeout(() => {
            if (groupMode) setGroupPicks(picks);
            else landFate(chosen);
            setSpinning(false);
            setFlash(null);
            setFlashHit(false);
            axios.post(`${API}/stats/fate-dealt`).then(({ data }) => setFatesDealt(data.count)).catch(() => {});
            setStreak(dealStreak());
            trackEvent("deal_result", { category: mode, theme, group: !!groupMode });
          }, 2400);
        }, 140);
      }
    };
    // Let the voice cue lead in before the deck starts shuffling; the card-riffle
    // sound starts with the first flick so audio and motion begin together.
    shuffleRef.current = setTimeout(() => { startCards(); step(); }, 1200);
  };

  const doSearch = async (cuisinesArg, pricesArg, categoryArg, coordsArg = coords, opts = {}) => {
    if (spinning || loading) return;
    const z = (opts.zipArg !== undefined ? opts.zipArg : zip).trim();
    const rad = opts.radiusArg !== undefined ? opts.radiusArg : radius;
    if (!coordsArg && z && !/^\d{5}$/.test(z)) {
      toast.error("ZIP code should be 5 digits (or leave it blank)");
      return;
    }
    setLoading(true);
    try {
      const cats = allMode && !crawlMode && !passportMode ? ANY_CATEGORIES : [categoryArg];
      const body = {
        zip_code: coordsArg ? null : z || null,
        place_query: coordsArg || z ? null : (destination.trim() || null),
        lat: coordsArg?.lat ?? null,
        lng: coordsArg?.lng ?? null,
        price_levels: pricesArg,
        open_now: openNow,
        radius_miles: rad,
      };
      // Remembered so "Duel a friend" can replay the exact same grounds for the rival.
      lastSearchRef.current = { ...body, category: categoryArg, cuisines: cuisinesArg || [] };
      const batches = await Promise.all(
        cats.map((c) =>
          axios
            .post(`${API}/places/search`, { ...body, category: c, cuisines: cats.length > 1 ? [] : cuisinesArg })
            .then((r) => r.data)
            .catch(() => ({ restaurants: [], source: "curated" }))
        )
      );
      // Interleave so one category can't dominate the deck.
      const seen = new Set();
      const merged = [];
      for (let i = 0; i < 25; i++) {
        for (const b of batches) {
          const r = b.restaurants?.[i];
          if (r && !seen.has(r.id)) { seen.add(r.id); merged.push(r); }
        }
      }
      const data = { restaurants: merged, source: batches[0]?.source || "curated", weather: cats.length === 1 ? batches[0]?.weather : null };
      setResults(data.restaurants);
      setWeather(data.weather || null);
      if (!data.restaurants.length) {
        toast.error("No spots match those filters — try loosening them");
        return;
      }
      // Passport mode: bank N stops as a multi-day quest instead of one reveal.
      if (passportMode) {
        const size = Math.min(passportSize, data.restaurants.length);
        if (size < 3) {
          toast.error("Need at least 3 nearby spots for a passport — try a wider radius");
          return;
        }
        setResult(null);
        setGroupPicks(null);
        const picked = [...data.restaurants].sort(() => Math.random() - 0.5).slice(0, size);
        const stopsPayload = picked.map((r) => ({
          id: r.id, name: r.name, cuisine: r.cuisine, price: r.price, rating: r.rating,
          distance: r.distance, lat: r.lat, lng: r.lng, open_now: r.open_now, google_url: r.google_url,
        }));
        try {
          const { data: p } = await axios.post(`${API}/passports`, { mode: categoryArg, label: "", stops: stopsPayload });
          trackEvent("passport_created", { category: categoryArg, stops: size });
          rememberPassport({ code: p.code, label: "", mode: categoryArg, total: size });
          setMyPassports(readPassports());
          // Shuffle ritual first, then the reveal window opens with the fresh
          // passport already in hand (no blank "Opening…" beat). /p/CODE stays
          // for revisits, selfies, the ID page and the award.
          const initial = {
            code: p.code, mode: categoryArg, label: "", stops: stopsPayload,
            stamps: [], stamped: 0, verified: 0, fully_verified: false,
            total: size, completed_at: null, created_at: null,
            holder_name: "", has_holder_photo: false, published_at: null,
          };
          runCrawlShuffle(data.restaurants, picked[0], () => setPassportReveal({ code: p.code, initial }));
        } catch (err) {
          toast.error(err.response?.data?.detail || "Couldn't create that passport");
        }
        return;
      }
      // Crawl mode skips the single-reveal shuffle and opens a multi-stop route window.
      if (crawlMode) {
        if (data.restaurants.length < 2) {
          toast.error("Need at least 2 nearby spots to build a crawl — try a wider radius");
          return;
        }
        setResult(null);
        setGroupPicks(null);
        const maxStops = Math.min(6, data.restaurants.length);
        const picked = [...data.restaurants].sort(() => Math.random() - 0.5).slice(0, maxStops);
        const ordered = orderCrawlRoute(picked, coords, null);
        setCrawlStops(ordered);
        runCrawlShuffle(data.restaurants, ordered[0], () => setShowCrawl(true));
        axios.post(`${API}/stats/fate-dealt`).then(({ data: d }) => setFatesDealt(d.count)).catch(() => {});
        setStreak(dealStreak());
        trackEvent("deal_result", { category: categoryArg, theme, mode: "crawl" });
        return;
      }
      runShuffle(data.restaurants);
      setRerollsLeft(3);
    } catch (e) {
      toast.error(e.response?.data?.detail || "Search failed");
    } finally {
      setLoading(false);
    }
  };

  const spin = () => { requestMotionPermission(); doSearch(selectedCuisines, [], mode); };

  // Shake the phone to shuffle (once filters/location are in place). The hook
  // no-ops on devices without motion sensors; iOS permission is requested from
  // inside the Deal-button gesture above.
  useShake(() => {
    if (spinning || loading || showGuided || showCrawl) return;
    // A rare ritual owns the shake gesture (the 8-ball especially) — never
    // let the global shake-to-shuffle deal over it.
    if (surpriseReveal || showThemeWelcome) return;
    if (!zip.trim() && !coords) return;
    // The shake IS the ritual — page-shuffle whoosh + a firm buzz confirm it.
    playSound("/shake-shuffle.mp3", 0.9);
    haptic(25);
    trackEvent("shake_shuffle", { category: mode, theme });
    doSearch(selectedCuisines, [], mode);
  }, !spinning && !loading && !surpriseReveal);

  const useMyLocation = () => {
    if (!navigator.geolocation) {
      toast.error("Location isn't supported on this device");
      return;
    }
    setGeoLoading(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const c = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        setCoords(c);
        setZip("");
        setGeoLoading(false);
        toast.success("Location set — pick your radius, then hit Deal");
      },
      (err) => {
        setGeoLoading(false);
        toast.error(
          err.code === err.PERMISSION_DENIED
            ? "Location permission denied — enter a ZIP instead"
            : "Couldn't get your location — enter a ZIP instead"
        );
      },
      { enableHighAccuracy: false, timeout: 10000, maximumAge: 300000 }
    );
  };

  const useMyLocationB = () => {
    if (!navigator.geolocation) {
      toast.error("Location isn't supported on this device");
      return;
    }
    setGeoLoadingB(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setCoordsB({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setZipB("");
        setGeoLoadingB(false);
        toast.success("2nd location set");
      },
      () => { setGeoLoadingB(false); toast.error("Couldn't get that location — enter a ZIP instead"); },
      { enableHighAccuracy: false, timeout: 10000, maximumAge: 300000 }
    );
  };

  // Crawl-only shuffle: same deck animation, then opens the crawl route window.
  // Lands on `winner` (the first stop of the ordered crawl) so the reveal card matches stop #1.
  const runCrawlShuffle = (pool, winner, onDone) => {
    setResult(null);
    setGroupPicks(null);
    setRare8Ball(false);
    setSpinning(true);
    setFlashHit(false);
    setRevealFlash(false);
    if (theme === "tiki") { grooveRef.current = playSound("/reveal-drums-groove.wav", 1.0); }
    else {
      const loopSrc = SHUFFLE_LOOPS[theme]?.[0];
      const loopVol = SHUFFLE_LOOPS[theme]?.[1];
      if (loopSrc) {
        try {
          if (localStorage.getItem("ff_muted") !== "1") {
            grooveRef.current = new Audio(loopSrc);
            grooveRef.current.loop = true;
            grooveRef.current.volume = loopVol;
            grooveRef.current.play().catch(() => {});
          }
        } catch (e) { grooveRef.current = null; }
      } else if (!light) {
        playSound("/reveal-voice-v5.mp3", 1.0);
      }
    }
    let i = 0;
    let delay = 55;
    const maxDelay = 230;
    let lastFlashIdx = -1;
    const nextFlash = () => {
      let idx = Math.floor(Math.random() * pool.length);
      if (pool.length > 1 && idx === lastFlashIdx) idx = (idx + 1) % pool.length;
      lastFlashIdx = idx;
      return pool[idx];
    };
    const step = () => {
      setFlash(nextFlash());
      i++;
      delay = delay * 1.16 + 4;
      if (delay < maxDelay) {
        shuffleRef.current = setTimeout(step, delay);
      } else {
        setFlash(winner || nextFlash());
        setFlashHit(true);
        try {
          stopCards();
          playSound("/card-deal.wav", 0.85);
          if (grooveRef.current) { try { grooveRef.current.pause(); } catch (e2) { /* ignore */ } grooveRef.current = null; }
          playSound(theme === "tiki" ? "/reveal-drums-boom.wav" : theme === "cyber" ? "/reveal-cyber.mp3?v=3" : theme === "spring" ? "/reveal-koto.wav" : theme === "steam" ? "/reveal-steam.wav" : theme === "winter" ? "/reveal-santa.wav" : theme === "fall" ? "/reveal-owl.wav?v=4" : theme === "fantasy" ? "/reveal-dragon.mp3" : "/reveal-thunder-v4.mp3", 1.0);
        } catch (e) { /* audio */ }
        setRevealFlash(true);
        setTimeout(() => setRevealFlash(false), 1200);
        shuffleRef.current = setTimeout(() => {
          setSpinning(false);
          setFlash(null);
          setFlashHit(false);
          onDone && onDone();
        }, 1400);
      }
    };
    shuffleRef.current = setTimeout(() => { startCards(); step(); }, 1000);
  };

  const dealCrawl = async () => {
    if (spinning || loading) return;
    requestMotionPermission();
    const hasAnyA = coords?.lat != null || /^\d{5}$/.test((zip || "").trim());
    const hasAnyB = coordsB?.lat != null || /^\d{5}$/.test((zipB || "").trim());
    if (!hasAnyA && !hasAnyB) { toast.error("Add a location (ZIP or use your location) to start"); return; }
    setLoading(true);
    try {
      let A = hasAnyA ? await resolveCoords(coords, zip) : null;
      let B = hasAnyB ? await resolveCoords(coordsB, zipB) : null;
      // Forgiving: if only the end location was set, treat it as the start.
      if (!A && B) { A = B; B = null; }
      let center = A, rad = radius;
      if (A && B) {
        center = { lat: (A.lat + B.lat) / 2, lng: (A.lng + B.lng) / 2 };
        rad = Math.min(50, Math.max(radius, haversineMi(A, B) / 2 + 3));
      }
      const ct = CRAWL_TYPES.find((t) => t.key === crawlType);
      const cuisines = ct ? [ct.cuisine] : selectedCuisines;
      const category = ct ? ct.mode : mode;
      const { data } = await axios.post(`${API}/places/search`, {
        zip_code: center ? null : (zip.trim() || null),
        lat: center?.lat ?? null,
        lng: center?.lng ?? null,
        cuisines,
        price_levels: [],
        category,
        open_now: openNow,
        radius_miles: rad,
      });
      setResults(data.restaurants);
      if (data.restaurants.length < 2) {
        toast.error("Need at least 2 nearby spots to build a crawl — try a wider radius or another type");
        return;
      }
      setCrawlEndpoints({ origin: A, destination: B });
      // Pick + order the crawl stops now so the reveal card == the first stop.
      const maxStops = Math.min(6, data.restaurants.length);
      const picked = [...data.restaurants].sort(() => Math.random() - 0.5).slice(0, maxStops);
      const ordered = orderCrawlRoute(picked, A, B);
      setCrawlStops(ordered);
      runCrawlShuffle(data.restaurants, ordered[0], () => {
        setResult(null); setGroupPicks(null); setShowCrawl(true);
        axios.post(`${API}/stats/fate-dealt`).then(({ data: d }) => setFatesDealt(d.count)).catch(() => {});
        setStreak(dealStreak());
      });
    } catch (e) {
      toast.error(e.response?.data?.detail || "Couldn't deal the crawl");
    } finally {
      setLoading(false);
    }
  };

  // "New crawl" from inside the reveal window: hide it, run the full card
  // shuffle, then reopen with the freshly ordered route.
  const reshuffleCrawl = () => {
    if (spinning || loading || results.length < 2) return;
    setShowCrawl(false);
    const maxStops = Math.min(6, results.length);
    const picked = [...results].sort(() => Math.random() - 0.5).slice(0, maxStops);
    const ordered = orderCrawlRoute(picked, crawlEndpoints.origin || coords, crawlEndpoints.destination || null);
    runCrawlShuffle(results, ordered[0], () => {
      setCrawlStops(ordered);
      setShowCrawl(true);
    });
  };

  const reportClosed = async (r) => {
    try {
      await axios.post(`${API}/reports`, {
        restaurant_id: r.id,
        restaurant_name: r.name,
        reason: "No longer in service",
      });
      toast.success("Thanks! We'll review this spot.");
    } catch (e) {
      toast.error("Could not submit your report");
    }
  };

  const reSpin = () => {
    if (results.length) { trackEvent("respin", { category: mode, theme }); runShuffle(results); }
  };

  // Swipe-left on the reveal photo: budgeted "tempt fate again" (3 per deal).
  const swipeReroll = () => {
    if (!rerollsLeft || !results.length) return;
    setRerollsLeft((n) => n - 1);
    haptic(12);
    trackEvent("swipe_reroll", { category: mode, theme, remaining: rerollsLeft - 1 });
    runShuffle(results);
  };

  // One reroll, no takebacks — the whole point is that you can't shop around after.
  const doubleOrNothing = () => {
    const pool = results.filter((r) => r.id !== result?.id);
    if (!pool.length) return;
    const pick = pool[Math.floor(Math.random() * pool.length)];
    trackEvent("double_or_nothing", { category: mode, theme });
    playSound("/card-deal.wav", 0.9);
    landFate(pick, { dared: true });
    setLocked(true);
    toast.success(`${t("Locked in by fate")}: ${pick.name}`, { description: t("You took the dare — no takebacks.") });
  };

  const dealFromFavorites = () => {
    if (spinning || loading || !favorites.length) return;
    setResults(favorites);
    setRerollsLeft(3);
    lastPickRef.current = null;
    runShuffle(favorites);
  };

  // Fate of the Day: one destined spot everyone in the same area sees today.
  const fateOfDay = useMemo(() => computeFateOfDay(results, zip, coords), [results, zip, coords]);

  const sortedResults = useMemo(() => {
    return [...results].sort((a, b) => {
      if (sortBy === "distance") return a.distance - b.distance;
      if (sortBy === "rating") return b.rating - a.rating;
      if (sortBy === "price") return a.price.length - b.price.length;
      return (b.sponsored ? 1 : 0) - (a.sponsored ? 1 : 0);
    });
  }, [results, sortBy]);

  // The Group / Crawl / Passport window — its standard home is the TOP of
  // the setup column, every accordion closed until tapped.
  const soloFlow = !passportMode && !groupMode && !crawlMode;
  // STEP AUTO-ADVANCE: as each numbered solo step completes, the page drifts
  // gently down to the next one (ZIP/location -> 2, category -> 3, first
  // cuisine or open-now -> 4).
  const scrollToStep = (n) => {
    setTimeout(() => {
      const el = document.querySelector(`[data-testid="solo-step-${n}"]`);
      if (!el) return;
      const top = el.getBoundingClientRect().top + window.scrollY - 88;
      window.scrollTo({ top, behavior: "smooth" });
    }, 300);
  };
  const soloSetZip = (z) => {
    const had = (zip || "").trim().length >= 5;
    setZip(z);
    if (!had && (z || "").trim().length >= 5) scrollToStep(2);
  };
  const soloSetCoords = (c) => {
    const had = !!coords;
    setCoords(c);
    if (!had && c) scrollToStep(2);
  };
  const toggleGroup = () => { setGroupMode((v) => { const n = !v; if (n) { setCrawlMode(false); setPassportMode(false); } return n; }); setResult(null); setGroupPicks(null); };
  const toggleCrawl = () => { setCrawlMode((v) => { const n = !v; if (n) { setGroupMode(false); setPassportMode(false); } return n; }); if (!crawlMode) applyCrawlType(CRAWL_TYPES[0]); setResult(null); setGroupPicks(null); };
  const togglePassport = () => { setPassportMode((v) => { const n = !v; if (n) { setGroupMode(false); setCrawlMode(false); setAllMode(false); if (!PASSPORT_CATEGORIES.includes(mode)) switchMode("explore"); } return n; }); setMyPassports(readPassports()); setResult(null); setGroupPicks(null); };
  // Header tabs (browser-style): each mode is its own "window". Selecting a
  // tab switches modes exclusively; re-selecting glides back to its picker.
  const scrollToPicker = (id) => {
    const el = document.querySelector(`[data-testid="${id}"]`);
    if (el) window.scrollTo({ top: Math.max(0, el.getBoundingClientRect().top + window.scrollY - 16), behavior: "smooth" });
  };
  const activeTab = passportMode ? "passports" : crawlMode ? "crawls" : groupMode ? "group" : "solo";
  const PICKER_IDS = { group: "group-picker", crawls: "crawl-type-picker", passports: "passport-picker" };
  // First visit to a mode tab THIS LOAD: mini flip-book guide, then its panel.
  // Tracked in memory (not localStorage) so every fresh app load shows the
  // step boxes again, per user request.
  const seenModeGuides = useRef(new Set());
  const [modeGuide, setModeGuide] = useState(null);
  const openModeGuide = (tab) => {
    if (!seenModeGuides.current.has(tab)) setModeGuide(tab);
  };
  const closeModeGuide = () => {
    seenModeGuides.current.add(modeGuide);
    setModeGuide(null);
  };
  const selectTab = (tab) => {
    if (tab === activeTab) {
      if (tab === "solo") window.scrollTo({ top: 0, behavior: "smooth" });
      else scrollToPicker(PICKER_IDS[tab]);
      return;
    }
    if (tab === "solo") { setGroupMode(false); setCrawlMode(false); setPassportMode(false); setResult(null); setGroupPicks(null); }
    else if (tab === "group") { toggleGroup(); openModeGuide(tab); }
    else if (tab === "crawls") { toggleCrawl(); openModeGuide(tab); }
    else { togglePassport(); openModeGuide(tab); }
  };
  // From the post-realm "Where to first?" window: land on the chosen tab.
  // Solo keeps the pending guided ritual; other tabs skip it and open their own guide.
  const pickFirstMode = (tab) => {
    setShowModeChooser(false);
    if (tab !== "solo") setShowGuided(false);
    selectTab(tab);
  };
  const modesCard = (
    <MoreWaysToPlay />
  );

  // Mode panels (used in the column AND, slice by slice, inside ModeGuide's
  // functional flip-book pages — call with no args for the full panel)
  const passportPanel = (slice) => (
    <PassportPicker
      slice={slice}
      modeTabs={MODE_TABS}
      passportCategories={PASSPORT_CATEGORIES}
      mode={mode}
      onPickCategory={(key) => { setAllMode(false); switchMode(key); }}
      modeLabel={modeLabel}
      cuisineLabel={cuisineLabel}
      cuisineList={cuisineList}
      cuisineGroups={activeCuisineGroups}
      selectedCuisines={selectedCuisines}
      onToggleCuisine={(c) => toggle(setSelectedCuisines, selectedCuisines, c)}
      passportSize={passportSize}
      setPassportSize={setPassportSize}
      myPassports={myPassports}
      setup={{
        zip, setZip, coords, setCoords,
        onUseLocation: useMyLocation, geoLoading,
        radius, setRadius, radiusMax,
        busy: spinning || loading,
        destination, setDestination,
        cta: loading ? t("Finding spots…") : t("Deal My Passport"),
        onCta: spin,
      }}
    />
  );
  const groupPanel = (slice) => (
    <GroupPicker
      slice={slice}
      modeTabs={MODE_TABS}
      mode={mode}
      onPickCategory={(key) => { setAllMode(false); switchMode(key); }}
      modeLabel={modeLabel}
      cuisineLabel={cuisineLabel}
      cuisineList={cuisineList}
      cuisineGroups={activeCuisineGroups}
      selectedCuisines={selectedCuisines}
      onToggleCuisine={(c) => toggle(setSelectedCuisines, selectedCuisines, c)}
      setup={{
        zip, setZip, coords, setCoords,
        onUseLocation: useMyLocation, geoLoading,
        radius, setRadius, radiusMax,
        busy: spinning || loading,
        cta: loading ? t("Finding spots…") : spinning ? t("Shuffling…") : (light ? t("Pick 3 Spots") : t("Deal 3 Fates!")),
        onCta: spin,
      }}
    />
  );
  const crawlPanel = (slice) => (
    <CrawlSetupPanel
      slice={slice}
      crawlType={crawlType}
      onPickType={applyCrawlType}
      light={light}
      setup={{
        zip, setZip, coords, setCoords,
        onUseLocation: useMyLocation, geoLoading,
        zipB, setZipB, coordsB, setCoordsB,
        onUseLocationB: useMyLocationB, geoLoadingB,
        radius, setRadius, radiusMax,
        spinning, loading, onDeal: dealCrawl,
      }}
    />
  );
  const guidePanels = { passports: passportPanel, group: groupPanel, crawls: crawlPanel };

  return (
    <div className="relative min-h-screen overflow-hidden bg-white" data-ff-scope="app">
      {showGuide && <ParchmentIntro onDone={guideDone} />}
      {!showGuide && showThemeWelcome && <ThemeWelcomeDialog onDone={sealThemeChoice} />}
      {!showGuide && !showThemeWelcome && showModeChooser && <ModeChooserDialog onPick={pickFirstMode} />}
      <AnimatePresence>
        {showGuided && !showModeChooser && (
          <GuidedFlow
            cuisineMap={{ food: FOOD_CUISINES, drinks: DRINK_CUISINES, bars: BAR_CUISINES, desserts: DESSERT_CUISINES, shops: SHOP_CUISINES, fuel: FUEL_CUISINES, explore: EXPLORE_CUISINES, stay: STAY_CUISINES }}
            groupMap={{ food: FOOD_GROUPS, bars: BAR_GROUPS, explore: EXPLORE_GROUPS, fuel: FUEL_GROUPS }}
            onSeal={sealFate}
            onSkip={finishGuided}
            theme={theme}
            accent={auraAccent}
          />
        )}
      </AnimatePresence>
      <AnimatePresence>
        {modeGuide && (
          <ModeGuide mode={modeGuide} theme={theme} onDone={closeModeGuide} renderPanel={guidePanels[modeGuide]} />
        )}
      </AnimatePresence>
      <PubCrawlDialog open={showCrawl} onClose={() => setShowCrawl(false)} results={results} mode={mode} origin={crawlEndpoints.origin || coords} destination={crawlEndpoints.destination} crawlLabel={crawlLabelForType(crawlType)} initialStops={crawlStops} onReshuffle={reshuffleCrawl} />
      <PassportDialog open={!!passportReveal} code={passportReveal?.code} initial={passportReveal?.initial} onClose={() => setPassportReveal(null)} />

      {/* Realm scenery stack: café / seasonal / ambiance / reaper + page heists */}
      <RealmLayers theme={theme} seasonCfg={seasonCfg} ambCfg={ambCfg} heistEpoch={heistEpoch} />
      {/* BINGO blackout: all 25 squares stamped — golden full-screen ritual */}
      <BlackoutRitual open={blackout} onClose={() => setBlackout(false)} />
      {/* Header (browser-style mode tabs live inside it) */}
      <HomeHeader
        light={light}
        ghost={ghost}
        theme={theme}
        themeHint={themeHint}
        dismissThemeHint={dismissThemeHint}
        onOpenThemePicker={() => { dismissThemeHint(); setShowThemeWelcome(true); }}
        hintColor={ambCfg ? ambCfg.accent : seasonCfg ? seasonCfg.hint : light ? "#4F6F47" : "#E01E26"}
        onGuided={() => (activeTab === "solo" ? setShowGuided(true) : setModeGuide(activeTab))}
        zip={zip}
        coords={coords}
        favorites={favorites}
        removeFavorite={removeFavorite}
        dealFromFavorites={dealFromFavorites}
        groupMode={groupMode}
        sponsorOpen={sponsorOpen}
        setSponsorOpen={setSponsorOpen}
        activeTab={activeTab}
        onSelectTab={selectTab}
      />

      {/* Floating sound + scenery-eye toggles (every realm) */}
      <FloatingToggles muted={muted} toggleMuted={toggleMuted} scenery={scenery} toggleScenery={toggleScenery} light={light} />

      <div className={`ff-scenery-fade ${scenery ? "ff-scenery-hide" : ""}`} data-testid="scenery-wrap">
      <div className="relative z-40">
        <SponsorMarquee light={light} onSponsor={() => setSponsorOpen(true)} />
      </div>

      {/* Social share bar (transparent) */}
      <div className="relative z-40 mx-auto flex max-w-6xl items-center justify-end gap-2 bg-transparent px-4 pt-2 md:px-12" data-testid="app-social-share">
        <SocialShare />
      </div>

      {/* Full-screen shuffle pop-up */}
      <ShuffleOverlay open={spinning && !result && !rare8Ball} light={light} flash={flash} flashHit={flashHit} cards={results} theme={theme} season={season} seasonItems={seasonCfg?.items || null} seasonAccent={seasonCfg?.hint || null} />

      {/* Reveal flash — quick white flash + lingering red glow behind the reveal */}
      <RevealFlash active={revealFlash} theme={theme} light={light} />

      {/* Hero / Roulette */}
      <section className="relative z-10 mx-auto max-w-6xl px-6 pt-12 pb-8 md:px-12 md:pt-16">
        <HeroCopy mode={mode} allMode={allMode} ambCfg={ambCfg} theme={theme} />

        <div className="mt-10 grid gap-10 lg:grid-cols-[1fr_1.1fr] lg:items-start">
          {/* left: search + filters + spin */}
          <div className="min-w-0 space-y-7">
            {/* ZIP + radius live inside the Passport/Group setup panels for those modes. */}
            {/* A TABLE FOR ONE: the solo-fate flow lives inside one translucent
                window, numbered step by step. Hidden while Group / Crawl /
                Passport setups take over. */}
            <div className={soloFlow ? "rounded-3xl border border-white/60 bg-white/55 p-4 shadow-sm backdrop-blur-md sm:p-5" : "contents"} data-testid={soloFlow ? "solo-fate-window" : undefined}>
              {soloFlow && (
                <div className="mb-5 flex items-center gap-2.5" data-testid="solo-fate-title">
                  <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#E01E26]/10">
                    <UtensilsCrossed className="h-5 w-5 text-[#E01E26]" />
                  </span>
                  <div>
                    <p className="font-serif text-xl font-bold text-[#0E0E0E]">{t("A Table for One")}</p>
                    <p className="font-sans text-xs text-[#6B7075]">{t("Your single fate — four quick steps.")}</p>
                  </div>
                </div>
              )}
              <div className={soloFlow ? "space-y-6" : "contents"}>
            <div className={soloFlow ? "" : "hidden"}>
            {soloFlow && <StepLabel n={1}>{t("Where are you?")}</StepLabel>}
            <LocationRadiusPanel
              hidden={!soloFlow}
              zip={zip} setZip={soloSetZip} setCoords={soloSetCoords} coords={coords}
              onEnter={spin} useMyLocation={useMyLocation} geoLoading={geoLoading}
              loading={loading} spinning={spinning}
              radius={radius} setRadius={setRadius} radiusMax={radiusMax}
              labelColor={labelColor}
            />
            </div>

            {/* All 8 tabs stay visible inside one box (4x2 grid). The old horizontal
                scroller hid Explore/Stay off-screen at phone widths. */}
            <div className={soloFlow ? "" : "hidden"}>
            {soloFlow && <StepLabel n={2}>{t("What calls to you?")}</StepLabel>}
            <ModeTabsGrid
              hidden={!soloFlow}
              tabs={MODE_TABS} mode={mode} allMode={allMode}
              onTab={(key) => { if (mode === key && !allMode) { setAllMode(true); setResult(null); setGroupPicks(null); } else { setAllMode(false); switchMode(key); } scrollToStep(3); }}
            />
            </div>

            {/* In Passport/Group setup the chips live inside that panel, so the main
                list is hidden — no scrolling up and back down again. */}
            <div className={soloFlow ? "" : "hidden"}>
            {soloFlow && <StepLabel n={3}>{t("Narrow it (optional)")}</StepLabel>}
            <CuisineSection
              hidden={!soloFlow}
              allMode={allMode} cuisineLabel={cuisineLabel} selectedCuisines={selectedCuisines}
              filtersOpen={filtersOpen} setFiltersOpen={setFiltersOpen}
              cuisineList={cuisineList} cuisineGroups={activeCuisineGroups}
              onToggleCuisine={(c) => { if (selectedCuisines.length === 0) scrollToStep(4); toggle(setSelectedCuisines, selectedCuisines, c); }}
              labelColor={labelColor}
            />

            <button
              type="button"
              data-testid="open-now-toggle"
              onClick={() => { if (!openNow) scrollToStep(4); setOpenNow((v) => !v); }}
              className={`mt-4 inline-flex items-center gap-2.5 rounded-full border-2 px-4 py-2.5 text-sm font-bold transition-colors ${openNow ? "border-[#E01E26] bg-[#E01E26] text-white" : "border-transparent bg-[#EDEEF0] text-[#6B7075] hover:bg-[#E2E4E7]"}`}
            >
              <Clock className="h-4 w-4" />
              {t("Open now only")}
              <span className={`ml-1 h-4 w-7 rounded-full p-0.5 transition-colors ${openNow ? "bg-white/40" : "bg-[#D5D8DC]"}`}>
                <span className={`block h-3 w-3 rounded-full bg-white transition-transform ${openNow ? "translate-x-3" : ""}`} />
              </span>
            </button>
            </div>

            {!crawlMode && !passportMode && !groupMode && (
              <div>
                {soloFlow && <StepLabel n={4}>{t("Let fate deal")}</StepLabel>}
                <DealRow
                  spin={spin} spinning={spinning} loading={loading}
                  passportMode={passportMode} groupMode={groupMode} light={light}
                  resultsCount={results.length} weather={weather}
                />
              </div>
            )}
              </div>
            </div>

            {/* MODE PANELS below the solo window */}

            {passportMode && passportPanel()}

            {groupMode && groupPanel()}

            {crawlMode && crawlPanel()}

            {/* Stash (points + backups) sits BELOW every guided tour */}
            {modesCard}

            <StatsRibbon fatesDealt={fatesDealt} crawlsCompleted={crawlsCompleted} streak={streak} light={light} ambCfg={ambCfg} />
          </div>

          {/* right: reveal stage */}
          <div className="relative min-w-0">
            <AnimatePresence>
              {mysticalReveal && result && (
                <motion.div
                  key="mystical"
                  aria-hidden
                  data-testid="mystical-aura"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.4 }}
                  className="pointer-events-none absolute -inset-4"
                >
                  {/* Single pulsing glow behind the reveal window */}
                  <motion.div
                    className="absolute inset-0 rounded-[36px]"
                    style={{ background: auraAccent, filter: "blur(28px)" }}
                    animate={{ opacity: [0.35, 0.85, 0.35], scale: [0.98, 1.03, 0.98] }}
                    transition={{ repeat: Infinity, duration: 1.6, ease: "easeInOut" }}
                  />
                </motion.div>
              )}
            </AnimatePresence>
            {theme === "steam" && result && !surpriseReveal && <SteamRise key={`steam-${result.id}`} />}
            <div ref={resultRef} className="relative z-10 min-h-[420px] rounded-3xl border border-[#E2E4E7] bg-white/70 p-4 shadow-xl shadow-black/5 backdrop-blur-md">
              {theme === "dark" && result && !surpriseReveal && <GhostEscort key={`esc-${result.id}`} />}
              <RevealStage spinning={spinning} flash={flash} deck={results} result={result} groupPicks={groupPicks} mode={mode} light={light} theme={theme} onReset={() => { setResult(null); setGroupPicks(null); setLocked(false); setSurpriseReveal(null); setRerollsLeft(3); }} onReSpin={reSpin} onReport={reportClosed} onPick={(c) => landFate(c, { group: true })} isFavorite={isFavorite} onToggleFavorite={toggleFavorite} onDare={doubleOrNothing} dareAvailable={results.length > 1} locked={locked} rerollsLeft={rerollsLeft} onSwipeReroll={swipeReroll} surprise={surpriseReveal} onSurpriseDone={surpriseDone} onDuel={startDuel} />
            </div>
          </div>
        </div>
      </section>

      {/* Nearby results */}
      {results.length > 0 && (
        <NearbyResults
          fateOfDay={fateOfDay} spinning={spinning}
          onDealFateOfDay={(f) => { landFate(f); window.scrollTo({ top: 0, behavior: "smooth" }); trackEvent("fate_of_day_deal", { theme }); }}
          sortBy={sortBy} setSortBy={setSortBy} sortedResults={sortedResults}
          mode={mode} onReport={reportClosed} isFavorite={isFavorite} onToggleFavorite={toggleFavorite}
        />
      )}

      <HomeInfoSections light={light} onSponsor={() => setSponsorOpen(true)} />

      <HomeFooter light={light} />
      </div>
    </div>
  );
}
