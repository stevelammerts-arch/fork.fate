import React, { useState, useRef, useEffect, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { Dices, Search, ShoppingBag, Fuel, Coffee, IceCream, Clock, LocateFixed, ArrowDownWideNarrow, Flame, Users, Beer, Trophy, UtensilsCrossed, ChevronDown, Mountain, Tent, Stamp, Globe2, Sparkles, Crown, BookOpen } from "lucide-react";
import Filters from "../components/Filters";
import { RestaurantCard } from "../components/RestaurantCard";
import BecomeSponsorDialog from "../components/BecomeSponsorDialog";
import SponsorMarquee from "../components/SponsorMarquee";
import SocialShare from "../components/SocialShare";
import { useFavorites } from "../hooks/useFavorites";
import { useShake, requestMotionPermission } from "../hooks/useShake";
import GuidedFlow from "../components/GuidedFlow";
import ThemeWelcomeDialog from "../components/ThemeWelcomeDialog";
import { HomeHeader } from "../components/home/HomeHeader";
import { HomeInfoSections } from "../components/home/HomeInfoSections";
import { HomeFooter } from "../components/home/HomeFooter";
import PubCrawlDialog from "../components/PubCrawlDialog";
import RevealStage from "../components/home/RevealStage";
import { PassportPicker } from "../components/home/PassportPicker";
import { GhostEscort, SteamRise } from "../components/home/ThemeFlourish";
import { GroupPicker } from "../components/home/GroupPicker";
import { haptic } from "../lib/pwa";
import confetti from "canvas-confetti";
import {
  readStreak, bumpStreak, streakMilestone, cardImage,
  HERO_INITIAL, HERO_ANIMATE, HERO_TRANSITION, SPIN_TAP,
  FOOD_CUISINES, FOOD_GROUPS, DRINK_CUISINES, DESSERT_CUISINES, BAR_CUISINES, BAR_GROUPS, SHOP_CUISINES, FUEL_CUISINES, FUEL_GROUPS, EXPLORE_CUISINES, EXPLORE_GROUPS, STAY_CUISINES, CRAWL_TYPES, crawlLabelForType, orderCrawlRoute,
} from "./homeConstants";
import { Input } from "../components/ui/input";
import { Slider } from "../components/ui/slider";
import { useTheme } from "../hooks/useTheme";
import { useLang } from "../i18n/i18n";
import { trackEvent } from "../lib/analytics";
import { recordRitualSeen, readRitualsSeen, RITUALS } from "../lib/rituals";
import BlackoutRitual from "../components/BlackoutRitual";
import { recordFate } from "../lib/journal";
import { markCuisine } from "../lib/bingo";
import { readPassports } from "../lib/passports";
import { SEASONS, AMBIANCE, SeasonScene, AmbianceScene, ReaperHeist, GhostSnatchHeist, ReaperPlateHeist, CoffeeSpillHeist, CompanionPatrol } from "../components/ThemeScenes";
import { ReaperScene } from "../components/ReaperScene";
import { CafeDustMotes } from "../components/CafeDustMotes";
import { ShufflingDeck } from "../components/ShufflingDeck";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

// Themed ambience that plays during the shuffle: [src, volume, loop].
// All beds are synthesized band-limited noise (see scripts/gen_theme_beds.py) —
// earlier versions held pure tones or near-Nyquist junk that phone speakers
// reproduced as a buzz or zap.
// Volumes are loudness-matched (RMS x volume) so every bed sits clearly BELOW
// its realm's reveal stinger: cyber/fall/winter files are hot, so they get
// lower gains (audited 2026-02: bed effRMS <= ~0.75x reveal effRMS).
const SHUFFLE_LOOPS = {
  light: ["/shuffle-cafe.wav?v=2", 0.75, true],
  tiki: ["/reveal-drums-groove.wav", 1.0, false],
  cyber: ["/shuffle-cyber.mp3?v=2", 0.5, true],
  summer: ["/shuffle-seagulls.wav", 0.7, true],
  steam: ["/shuffle-jacobs.wav", 0.85, true],
  spring: ["/shuffle-spring.wav", 0.8, true],
  winter: ["/shuffle-winter.wav", 0.65, true],
  fall: ["/shuffle-fall.wav", 0.55, true],
  fantasy: ["/shuffle-dragon.mp3", 0.85, true],
  fairy: ["/shuffle-fairy.wav", 0.8, true],
};


export default function Home() {
  const { theme } = useTheme();
  const navigate = useNavigate();
  const { t } = useLang();
  const ambCfg = AMBIANCE[theme] || null;
  const light = !(theme === "dark" || ambCfg);
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
    try { localStorage.setItem("ff_theme_chosen", "1"); } catch (e) { /* ignore */ }
    trackEvent("theme_welcome_done", { theme });
    dismissThemeHint();
  };
  const [mode, setMode] = useState("food");
  const [zip, setZip] = useState("");
  const [destination, setDestination] = useState("");
  const [coords, setCoords] = useState(null);
  const [geoLoading, setGeoLoading] = useState(false);
  const [selectedCuisines, setSelectedCuisines] = useState([]);
  const [openNow, setOpenNow] = useState(false);
  const [radius, setRadius] = useState(50);
  const [results, setResults] = useState([]);
  const [source, setSource] = useState(null);
  const [sortBy, setSortBy] = useState("default");

  const [loading, setLoading] = useState(false);
  const [spinning, setSpinning] = useState(false);
  const [result, setResult] = useState(null);
  const [groupMode, setGroupMode] = useState(false);
  const [sponsorOpen, setSponsorOpen] = useState(false);
  const [addOpen, setAddOpen] = useState(false);
  const [groupPicks, setGroupPicks] = useState(null);
  const [crawlMode, setCrawlMode] = useState(false);
  const [passportMode, setPassportMode] = useState(false);
  const [passportSize, setPassportSize] = useState(5);
  const [myPassports, setMyPassports] = useState(() => readPassports());
  // The chip list is long; collapse it once fate has spoken so the reveal card
  // isn't buried under filters.
  const [filtersOpen, setFiltersOpen] = useState(true);
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
  // PWA share target: a friend shares a restaurant link/name INTO Fork·Fate
  // (manifest share_target) — we tuck it into Favorites and say so.
  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      const sTitle = params.get("share_title") || "";
      const sText = params.get("share_text") || "";
      const sUrl = params.get("share_url") || "";
      if (!sTitle && !sText && !sUrl) return;
      // Best-guess name: the title, else the text minus any URL inside it.
      const urlInText = (sText.match(/https?:\/\/\S+/) || [])[0] || "";
      const name = (sTitle || sText.replace(urlInText, "").trim() || "Shared spot").slice(0, 80);
      const link = sUrl || urlInText;
      const shared = { id: `shared-${Date.now()}`, name, cuisine: t("Shared with you"), address: "", category: "food", google_url: link, image: "" };
      if (!isFavorite(shared)) toggleFavorite(shared);
      toast.success(`${t("Saved to Favorites:")} ${name}`, { duration: 6000 });
      trackEvent("share_target_in", {});
      // Clean the params so refreshes don't re-save it.
      ["share_title", "share_text", "share_url"].forEach((k) => params.delete(k));
      const qs = params.toString();
      window.history.replaceState({}, "", window.location.pathname + (qs ? `?${qs}` : ""));
    } catch (e) { /* malformed share — ignore */ }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const [showGuided, setShowGuided] = useState(true);
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

  const playSound = (src, volume = 0.9) => {
    try {
      if (localStorage.getItem("ff_muted") === "1") return null;
      const a = new Audio(src);
      a.volume = volume;
      a.play().catch(() => {});
      return a;
    } catch (e) { return null; /* audio unavailable — non-critical */ }
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

  // Every 10 deal taps (persisted per device) fate arrives as a RARE ritual
  // instead of the usual shuffle reveal.
  const shouldRareFate = () => {
    try {
      const taps = parseInt(localStorage.getItem("ff_deal_taps") || "0", 10) + 1;
      let target = parseInt(localStorage.getItem("ff_rare_at") || "0", 10);
      if (!target) target = 10;
      if (taps >= target) {
        localStorage.setItem("ff_deal_taps", "0");
        localStorage.setItem("ff_rare_at", "10");
        return true;
      }
      localStorage.setItem("ff_deal_taps", String(taps));
      localStorage.setItem("ff_rare_at", String(target));
      return false;
    } catch (e) {
      return Math.random() < 1 / 10;
    }
  };

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
  const landFate = (card, extra = {}) => {
    recordFate(card, { theme, mode, ...extra });
    const b = markCuisine(card.cuisine);
    if (b?.blackout) {
      // BLACKOUT: all 25 squares stamped — the rarest feat in the collection.
      recordRitualSeen("blackout");
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
      if (firstTime) {
        const ritual = RITUALS.find((r) => r.key === surpriseReveal);
        toast(t("New fate witnessed!"), {
          description: ritual ? t(ritual.name) : undefined,
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
    // Dark mode plays a spoken voice cue before the deck shuffles; themed shuffles stay clean.
    if (!light && !rareFate && theme !== "cyber" && theme !== "tiki" && theme !== "steam" && theme !== "fantasy" && theme !== "fairy") playSound("/reveal-voice-v5.mp3", 1.0);
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
      // Theme-exclusive rituals: fairy wand, cyber hacking terminal + keypad,
      // steampunk crank gear, tiki cocktail shaker + volcano, reaper tarot /
      // coffin / seance / ouija, dragon's hoard eye + chest, fall leaf pile,
      // spring cherry bloom, summer watermelon smash, winter snow globe,
      // cafe latte stir.
      const pool2 = theme === "fairy" ? ["scratch", "8ball", "wheel", "wand"] : theme === "cyber" ? ["scratch", "8ball", "wheel", "hack", "code"] : theme === "steam" ? ["scratch", "8ball", "wheel", "crank"] : theme === "tiki" ? ["scratch", "8ball", "wheel", "shaker", "volcano"] : theme === "dark" ? ["scratch", "8ball", "wheel", "tarot", "coffin", "seance", "ouija"] : theme === "fantasy" ? ["scratch", "8ball", "wheel", "eye", "chest"] : theme === "fall" ? ["scratch", "8ball", "wheel", "leaves"] : theme === "spring" ? ["scratch", "8ball", "wheel", "bloom"] : theme === "summer" ? ["scratch", "8ball", "wheel", "melon"] : theme === "winter" ? ["scratch", "8ball", "wheel", "globe"] : theme === "light" ? ["scratch", "8ball", "wheel", "latte"] : ["scratch", "8ball", "wheel"];
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
      setSource(data.source);
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
        try {
          const { data: p } = await axios.post(`${API}/passports`, {
            mode: categoryArg,
            label: "",
            stops: picked.map((r) => ({
              id: r.id, name: r.name, cuisine: r.cuisine, price: r.price, rating: r.rating,
              distance: r.distance, lat: r.lat, lng: r.lng, open_now: r.open_now, google_url: r.google_url,
            })),
          });
          trackEvent("passport_created", { category: categoryArg, stops: size });
          navigate(`/p/${p.code}`);
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
        setCrawlStops(orderCrawlRoute(picked, coords, null));
        setShowCrawl(true);
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

  const haversineMi = (a, b) => {
    if (!a || !b) return 0;
    const R = 3958.8, toRad = (d) => (d * Math.PI) / 180;
    const dLat = toRad(b.lat - a.lat), dLng = toRad(b.lng - a.lng);
    const s = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLng / 2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(s), Math.sqrt(1 - s));
  };

  const resolveCoords = async (coordsVal, zipVal) => {
    if (coordsVal?.lat != null) return coordsVal;
    const z = (zipVal || "").trim();
    if (/^\d{5}$/.test(z)) {
      const { data } = await axios.get(`${API}/geocode`, { params: { zip: z } });
      return { lat: data.lat, lng: data.lng };
    }
    return null;
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
      setSource(data.source);
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
    setSource("favorites");
    setResults(favorites);
    setRerollsLeft(3);
    lastPickRef.current = null;
    runShuffle(favorites);
  };

  // Fate of the Day: one destined spot everyone in the same area sees today.
  // Deterministic: seeded by date + area (zip or rounded coords) over the
  // id-sorted pool, so it stays stable all day without any backend.
  const fateOfDay = useMemo(() => {
    if (!results.length) return null;
    const day = new Date().toISOString().slice(0, 10);
    const area = zip || (coords ? `${coords.lat.toFixed(2)},${coords.lng.toFixed(2)}` : "");
    const seed = `${day}|${area}`;
    let h = 0;
    for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0;
    const sorted = [...results].sort((a, b) => String(a.id).localeCompare(String(b.id)));
    return sorted[h % sorted.length];
  }, [results, zip, coords]);

  const sortedResults = useMemo(() => {
    return [...results].sort((a, b) => {
      if (sortBy === "distance") return a.distance - b.distance;
      if (sortBy === "rating") return b.rating - a.rating;
      if (sortBy === "price") return a.price.length - b.price.length;
      return (b.sponsored ? 1 : 0) - (a.sponsored ? 1 : 0);
    });
  }, [results, sortBy]);

  return (
    <div className="relative min-h-screen overflow-hidden bg-white" data-ff-scope="app">
      {showThemeWelcome && <ThemeWelcomeDialog onDone={sealThemeChoice} />}
      <AnimatePresence>
        {showGuided && (
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
      <PubCrawlDialog open={showCrawl} onClose={() => setShowCrawl(false)} results={results} mode={mode} origin={crawlEndpoints.origin || coords} destination={crawlEndpoints.destination} crawlLabel={crawlLabelForType(crawlType)} initialStops={crawlStops} />

      {/* Light-mode: faded bright café / restaurant interior background */}
      {theme === "light" && (
        <div
          className="pointer-events-none fixed inset-0 z-0 select-none bg-cover bg-center"
          data-testid="cafe-bg-light"
          style={{ backgroundImage: "url('/cafe-bg-light.png')", opacity: 0.28 }}
        />
      )}
      {/* Coffee Shop ambience: dust motes drifting in warm café light */}
      {theme === "light" && <CafeDustMotes />}
      {/* Seasonal themes: tree + decor + falling sprites */}
      {seasonCfg && <SeasonScene theme={theme} cfg={seasonCfg} heistEpoch={heistEpoch} />}
      {/* Ambiance themes: cyberpunk / steampunk / tiki lounge */}
      {ambCfg && <AmbianceScene theme={theme} cfg={ambCfg} heistEpoch={heistEpoch} />}
      {/* Dark-mode: decorative reaper background with load animation */}
      {theme === "dark" && <ReaperScene />}
      {theme === "dark" && <ReaperHeist key={`rh-${heistEpoch}`} />}
      {theme === "dark" && <GhostSnatchHeist key={`gh-${heistEpoch}`} />}
      {theme === "dark" && <ReaperPlateHeist key={`ph-${heistEpoch}`} />}
      {/* Café: the runaway coffee cup that melts the medallion like sugar */}
      {theme === "light" && <CoffeeSpillHeist key={`ch-${heistEpoch}`} />}
      {/* BINGO blackout: all 25 squares stamped — golden full-screen ritual */}
      <BlackoutRitual open={blackout} onClose={() => setBlackout(false)} />
      {/* the little reaper follower: drifts around the page trailing black smoke */}
      {theme === "dark" && <CompanionPatrol s1="/reaper-fly-1.png" s2="/reaper-fly-2.png" glow="rgba(140,110,200,0.45)" dustCol={["#8E7BB8", "#2A2038"]} testid="reaper-companion" flap="ffReaperFrame 2.6s ease-in-out infinite" flapBase="ffReaperFrameInv 2.6s ease-in-out infinite" bob="ffPixieBob 3.6s ease-in-out infinite" />}
      {/* Header */}
      <HomeHeader
        light={light}
        ghost={ghost}
        theme={theme}
        themeHint={themeHint}
        dismissThemeHint={dismissThemeHint}
        onOpenThemePicker={() => { dismissThemeHint(); setShowThemeWelcome(true); }}
        hintColor={ambCfg ? ambCfg.accent : seasonCfg ? seasonCfg.hint : light ? "#4F6F47" : "#E01E26"}
        muted={muted}
        toggleMuted={toggleMuted}
        onGuided={() => setShowGuided(true)}
        zip={zip}
        coords={coords}
        favorites={favorites}
        removeFavorite={removeFavorite}
        dealFromFavorites={dealFromFavorites}
        groupMode={groupMode}
        sponsorOpen={sponsorOpen}
        setSponsorOpen={setSponsorOpen}
      />

      <div className="relative z-40">
        <SponsorMarquee light={light} onSponsor={() => setSponsorOpen(true)} />
      </div>

      {/* Social share bar (transparent) */}
      <div className="relative z-40 mx-auto flex max-w-6xl items-center justify-end gap-2 bg-transparent px-4 pt-2 md:px-12" data-testid="app-social-share">
        <SocialShare />
      </div>

      {/* Full-screen shuffle pop-up */}
      <AnimatePresence>
        {spinning && !result && !rare8Ball && (
          <motion.div
            key="shuffle-popup"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            className={`fixed inset-0 z-[60] flex items-center justify-center px-6 backdrop-blur-sm ${light ? "bg-white/70" : "bg-black/50"}`}
            data-testid="shuffle-popup"
            style={{ pointerEvents: flashHit ? "none" : "auto" }}
          >
            {/* Ominous drifting red/black mist — dark mode only */}
            {!light && (
            <div className="pointer-events-none absolute inset-0 overflow-hidden" data-testid="shuffle-mist">
              <motion.div
                className="absolute left-[10%] top-1/4 h-72 w-72 rounded-full bg-[#E01E26] blur-[90px]"
                animate={{ x: [0, 70, 0], y: [0, -40, 0], opacity: [0.12, 0.34, 0.12] }}
                transition={{ duration: 6.5, repeat: Infinity, ease: "easeInOut" }}
              />
              <motion.div
                className="absolute right-[8%] top-1/3 h-96 w-96 rounded-full bg-black blur-[100px]"
                animate={{ x: [0, -60, 0], y: [0, 50, 0], opacity: [0.35, 0.65, 0.35] }}
                transition={{ duration: 7.5, repeat: Infinity, ease: "easeInOut" }}
              />
              <motion.div
                className="absolute bottom-[6%] left-1/3 h-80 w-80 rounded-full bg-[#7A0C10] blur-[90px]"
                animate={{ x: [0, 45, 0], y: [0, -25, 0], opacity: [0.15, 0.4, 0.15] }}
                transition={{ duration: 8.5, repeat: Infinity, ease: "easeInOut" }}
              />
            </div>
            )}
            <motion.div
              initial={{ scale: 0.8, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ type: "spring", stiffness: 300, damping: 24 }}
              className="relative z-10 w-full max-w-sm p-8"
            >
              <ShufflingDeck cards={results} flash={flash} landed={flashHit} light={light} theme={theme} season={season} seasonItems={seasonCfg?.items || null} seasonAccent={seasonCfg?.hint || null} />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Reveal flash — quick white flash + lingering red glow behind the reveal */}
      <AnimatePresence>
        {revealFlash && (
          <motion.div
            key="reveal-flash"
            aria-hidden
            data-testid="reveal-flash"
            className="pointer-events-none fixed inset-0 z-[70]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            {/* lingering glow — warm golden in light mode, blood-red in dark */}
            <motion.div
              className="absolute inset-0"
              style={{ background: theme === "cyber"
                ? "radial-gradient(circle at 50% 45%, rgba(34,224,224,0.5), rgba(199,125,255,0.28) 38%, rgba(0,0,0,0) 66%)"
                : theme === "fantasy"
                ? "radial-gradient(circle at 50% 45%, rgba(230,178,58,0.6), rgba(224,86,30,0.28) 38%, rgba(0,0,0,0) 66%)"
                : light
                ? "radial-gradient(circle at 50% 45%, rgba(255,193,80,0.45), rgba(255,255,255,0) 60%)"
                : "radial-gradient(circle at 50% 45%, rgba(224,30,38,0.55), rgba(0,0,0,0) 60%)" }}
              initial={{ opacity: 0 }}
              animate={{ opacity: [0, 0.9, 0.4, 0] }}
              transition={{ duration: 1.4, times: [0, 0.12, 0.55, 1], ease: "easeOut" }}
            />
            {/* quick white flash — strobes 3 times */}
            <motion.div
              className="absolute inset-0 bg-white"
              initial={{ opacity: 0 }}
              animate={{ opacity: [0, 1, 0, 1, 0, 1, 0] }}
              transition={{ duration: 1.0, times: [0, 0.08, 0.2, 0.34, 0.46, 0.6, 0.75], ease: "easeOut" }}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Hero / Roulette */}
      <section className="relative z-10 mx-auto max-w-6xl px-6 pt-12 pb-8 md:px-12 md:pt-16">
        <motion.div
          initial={HERO_INITIAL}
          animate={HERO_ANIMATE}
          transition={HERO_TRANSITION}
          className="max-w-2xl"
        >
          <p className="font-sans text-sm font-extrabold tracking-[0.25em] uppercase text-[#E01E26]" style={theme === "fairy" ? { color: "#FFD36B", textShadow: "0 1px 10px rgba(4,20,12,0.75)" } : undefined}>
            {allMode ? t("Can't decide on anything?") : mode === "food" ? t("Can't decide where to eat?") : mode === "drinks" ? t("Can't decide what to sip?") : mode === "bars" ? t("Can't decide where to drink?") : mode === "desserts" ? t("Craving something sweet?") : mode === "shops" ? t("Feeling like a treasure hunt?") : mode === "explore" ? t("Can't decide what to do?") : mode === "stay" ? t("Need somewhere to stay?") : t("Need to fill up or get moving?")}
          </p>
          <h1 className="mt-3 font-serif text-4xl font-medium leading-none tracking-tighter text-[#0E0E0E] sm:text-5xl lg:text-6xl" style={ambCfg ? { color: ambCfg.sky, textShadow: theme === "cyber" ? "0 0 12px rgba(199,125,255,0.6)" : undefined } : undefined}>
            {mode === "food" ? t("Let fate pick tonight's table.") : mode === "drinks" ? t("Let fate pick your next sip.") : mode === "bars" ? t("Let fate pick tonight's bar.") : mode === "desserts" ? t("Let fate pick your sweet treat.") : mode === "shops" ? t("Let fate pick your next find.") : mode === "explore" ? t("Let fate pick your next adventure.") : mode === "stay" ? t("Let fate pick tonight's basecamp.") : t("Let fate pick your pit stop.")}
          </h1>
          <p className="mt-4 font-sans text-base font-semibold leading-relaxed text-[#0E0E0E]" style={ambCfg ? { color: ambCfg.sky, opacity: 0.92 } : undefined}>
            {mode === "food"
              ? t("Set the mood with a few filters and hit Deal. We'll shuffle great local restaurants — up to 50 miles out — and land on your next meal.")
              : mode === "drinks"
              ? t("Coffee, boba tea or a smoothie? Set your filters and hit Deal — we'll shuffle nearby drink spots and pick one for you.")
              : mode === "bars"
              ? t("Beer, whiskey, margaritas or a Tiki bar? Set your filters and hit Deal — we'll shuffle nearby bars and pick tonight's spot.")
              : mode === "desserts"
              ? t("Ice cream, bakery, candy or froyo? Set your filters and hit Deal — we'll shuffle nearby dessert spots and pick your treat.")
              : mode === "shops"
              ? t("Antiques, thrift, vintage or a hobby shop? Set your filters and hit Deal — we'll shuffle nearby shops and pick your next find.")
              : mode === "explore"
              ? t("A state park, a hiking trail, a waterfall — or mini golf if it's raining? Set your filters and hit Deal, and we'll shuffle what's out there and pick your next adventure.")
              : mode === "stay"
              ? t("A campground, an RV site, a cabin or a cosy inn? Set your filters and hit Deal — we'll shuffle nearby places to stay and pick tonight's basecamp.")
              : t("Gas, a charger, a scooter or the next bus? Set your filters and hit Deal — we'll shuffle nearby stops and pick your pit stop.")}
          </p>
        </motion.div>

        <div className="mt-10 grid gap-10 lg:grid-cols-[1fr_1.1fr] lg:items-start">
          {/* left: search + filters + spin */}
          <div className="min-w-0 space-y-7">
            {/* ZIP + radius live inside the Passport/Group setup panels for those modes. */}
            <div className={`space-y-2 ${passportMode || groupMode ? "hidden" : ""}`}>
              <p className="font-sans text-xs font-bold tracking-[0.2em] uppercase text-[#0E0E0E]" style={labelColor ? { color: labelColor } : undefined}>
                {t("Your ZIP code")} <span className="text-[#B8BCC2]">{t("(optional)")}</span>
              </p>
              <div className="flex items-center gap-2">
                <div className="flex flex-1 items-center gap-2 rounded-full border border-[#E2E4E7] bg-white px-4 py-1.5 focus-within:border-[#E01E26]">
                  <Search className="h-5 w-5 shrink-0 text-[#6B7075]" />
                  <Input
                    data-testid="zip-input"
                    value={zip}
                    onChange={(e) => { const v = e.target.value.replace(/[^\d]/g, "").slice(0, 5); setZip(v); setCoords(null); if (v.length === 5) e.target.blur(); }}
                    onKeyDown={(e) => e.key === "Enter" && spin()}
                    placeholder="e.g. 10001"
                    inputMode="numeric"
                    className="border-0 bg-transparent px-1 text-lg font-semibold text-[#0E0E0E] shadow-none focus-visible:ring-0"
                  />
                </div>
                <button
                  type="button"
                  onClick={useMyLocation}
                  disabled={geoLoading || loading || spinning}
                  data-testid="use-my-location-button"
                  className={`inline-flex shrink-0 items-center gap-2 rounded-full px-4 py-2.5 text-sm font-bold transition-colors disabled:opacity-70 ${(coords || geoLoading) ? "bg-[#E01E26] text-white hover:bg-[#B3141A]" : "border border-[#E2E4E7] bg-white text-[#0E0E0E] hover:bg-[#EDEEF0]"}`}
                >
                  <LocateFixed className={`h-4 w-4 ${geoLoading ? "animate-pulse" : ""}`} />
                  {geoLoading ? t("Locating…") : coords ? t("Using your location") : t("Use my location")}
                </button>
              </div>

              <div className="rounded-2xl border border-[#E2E4E7] bg-white px-4 py-3" data-testid="radius-control">
                <div className="mb-2 flex items-center justify-between">
                  <p className="font-sans text-xs font-bold tracking-[0.2em] uppercase text-[#0E0E0E]">{t("Search radius")}</p>
                  <span data-testid="radius-value" className="font-serif text-lg font-semibold text-[#E01E26]">
                    {radius} <span className="text-sm text-[#6B7075]">mi</span>
                  </span>
                </div>
                <Slider
                  data-testid="radius-slider"
                  value={[radius]}
                  min={0}
                  max={radiusMax}
                  step={1}
                  onValueChange={(v) => setRadius(v[0])}
                  aria-label="Search radius in miles"
                />
                <div className="mt-1.5 flex justify-between font-sans text-[10px] font-bold uppercase tracking-wider text-[#B8BCC2]">
                  <span>0 mi</span>
                  <span>{radiusMax} mi</span>
                </div>
              </div>
            </div>

            {/* All 8 tabs stay visible inside one box (4x2 grid). The old horizontal
                scroller hid Explore/Stay off-screen at phone widths. */}
            <div className={`grid grid-cols-4 gap-1 rounded-2xl border border-[#E2E4E7] bg-[#EDEEF0] p-1 ${passportMode || groupMode ? "hidden" : ""}`} data-testid="mode-toggle">
              {MODE_TABS.map(({ key, label, Icon }) => (
                <button
                  key={key}
                  data-testid={`mode-${key}`}
                  onClick={() => { if (mode === key && !allMode) { setAllMode(true); setResult(null); setGroupPicks(null); } else { setAllMode(false); switchMode(key); } }}
                  className={`flex min-h-[52px] flex-col items-center justify-center gap-1 rounded-xl px-1 py-2 text-[11px] font-bold leading-none transition-colors ${mode === key && !allMode ? "bg-[#0E0E0E] text-white" : "text-[#3A3F45] hover:text-[#0E0E0E]"}`}
                >
                  <Icon className="h-4 w-4" />
                  {label}
                </button>
              ))}
            </div>

            {/* In Passport/Group setup the chips live inside that panel, so the main
                list is hidden — no scrolling up and back down again. */}
            <div className={`mt-4 ${passportMode || groupMode ? "hidden" : ""}`}>
              {allMode ? (
                <div className="rounded-2xl border border-[#0E0E0E]/15 bg-[#0E0E0E] px-4 py-3" data-testid="any-mode-banner">
                  <p className="font-sans text-xs font-bold uppercase tracking-wider text-[#F0A24E]">{t("Anything goes")}</p>
                  <p className="mt-0.5 font-sans text-sm text-white">
                    {t("No category — dealing from Food, Drinks, Bars & Desserts. Tap a tab to narrow it.")}
                  </p>
                </div>
              ) : (
              <>
              <button
                type="button"
                data-testid="filters-toggle"
                onClick={() => setFiltersOpen((o) => !o)}
                className="flex w-full items-center justify-between gap-3 rounded-2xl border border-[#E2E4E7] bg-white px-4 py-3 text-left transition-colors hover:bg-[#F7F8F9]"
              >
                <span className="min-w-0">
                  <span className="block font-sans text-xs font-bold uppercase tracking-wider text-[#6B7075]">
                    {cuisineLabel}
                  </span>
                  <span className="mt-0.5 block truncate font-sans text-sm font-semibold text-[#0E0E0E]">
                    {selectedCuisines.length ? selectedCuisines.join(", ") : t("Any type — tap to choose")}
                  </span>
                </span>
                <ChevronDown className={`h-5 w-5 shrink-0 text-[#6B7075] transition-transform ${filtersOpen ? "rotate-180" : ""}`} />
              </button>

              {filtersOpen && (
            <Filters
              cuisines={cuisineList}
              cuisineGroups={activeCuisineGroups}
              cuisineLabel={cuisineLabel}
              selectedCuisines={selectedCuisines}
              toggleCuisine={(c) => { toggle(setSelectedCuisines, selectedCuisines, c); setFiltersOpen(false); }}
              labelColor={labelColor}
            />
              )}
              </>
              )}
            </div>

            <button
              type="button"
              data-testid="open-now-toggle"
              onClick={() => setOpenNow((v) => !v)}
              className={`inline-flex items-center gap-2.5 rounded-full border-2 px-4 py-2.5 text-sm font-bold transition-colors ${openNow ? "border-[#E01E26] bg-[#E01E26] text-white" : "border-transparent bg-[#EDEEF0] text-[#6B7075] hover:bg-[#E2E4E7]"}`}
            >
              <Clock className="h-4 w-4" />
              {t("Open now only")}
              <span className={`ml-1 h-4 w-7 rounded-full p-0.5 transition-colors ${openNow ? "bg-white/40" : "bg-[#D5D8DC]"}`}>
                <span className={`block h-3 w-3 rounded-full bg-white transition-transform ${openNow ? "translate-x-3" : ""}`} />
              </span>
            </button>

            {!crawlMode && !passportMode && !groupMode && (
              <div className="flex flex-wrap items-center gap-4">
                <motion.button
                  data-testid="spin-roulette-button"
                  onClick={spin}
                  disabled={spinning || loading}
                  whileHover={{ scale: spinning || loading ? 1 : 1.03 }}
                  whileTap={SPIN_TAP}
                  className="inline-flex items-center gap-3 rounded-full border-2 border-[#0E0E0E] bg-[#E01E26] px-10 py-5 font-sans text-lg font-bold text-white shadow-lg shadow-[#E01E26]/25 transition-colors hover:bg-[#B3141A] disabled:opacity-70"
                >
                  <Dices className={`h-6 w-6 ${spinning || loading ? "animate-spin" : ""}`} />
                  {loading ? t("Finding spots…") : spinning ? t("Shuffling…") : passportMode ? t("Deal My Passport") : groupMode ? (light ? t("Pick 3 Spots") : t("Deal 3 Fates!")) : (light ? t("Shuffle the Deck") : t("Deal Your Fate!"))}
                </motion.button>
                {results.length > 0 && (
                  <span className="font-sans text-sm text-[#6B7075]">
                    {results.length} {results.length !== 1 ? t("spots nearby") : t("spot nearby")}
                  </span>
                )}
                {weather && (
                  <span
                    data-testid="weather-chip"
                    className="inline-flex items-center gap-1.5 rounded-full border border-[#CFE0F5] bg-[#EEF5FE] px-3 py-1.5 font-sans text-xs font-bold text-[#245C97]"
                  >
                    {{ indoor: "🌧️", water: "🔥", snow: "❄️", outdoor: "☀️" }[weather.bias]}
                    {t(weather.label)} {weather.temp_f}° ·{" "}
                    {{ indoor: t("indoor picks"), water: t("water picks"), snow: t("snow picks"), outdoor: t("outdoor picks") }[weather.bias]}
                  </span>
                )}
              </div>
            )}

            <div className="mt-2 rounded-3xl border border-[#E2E4E7] bg-white/95 p-4 shadow-sm backdrop-blur-sm" data-testid="modes-card">
            <p className="mb-3 font-sans text-xs font-bold uppercase tracking-[0.2em] text-[#E01E26]">{t("More ways to play")}</p>
            <div className="flex flex-wrap items-center gap-3">
              <button
                type="button"
                data-testid="group-mode-toggle"
                onClick={() => { setGroupMode((v) => { const n = !v; if (n) { setCrawlMode(false); setPassportMode(false); } return n; }); setResult(null); setGroupPicks(null); }}
                className={`inline-flex items-center gap-2.5 rounded-full border-2 px-4 py-2.5 text-sm font-bold transition-colors ${groupMode ? "border-[#E01E26] bg-[#E01E26] text-white" : "border-[#0E0E0E] bg-white text-[#0E0E0E] hover:bg-[#EDEEF0]"}`}
              >
                <Users className="h-4 w-4" />
                {t("Group mode")}
                <span className={`ml-1 h-4 w-7 rounded-full p-0.5 transition-colors ${groupMode ? "bg-white/40" : "bg-[#D5D8DC]"}`}>
                  <span className={`block h-3 w-3 rounded-full bg-white transition-transform ${groupMode ? "translate-x-3" : ""}`} />
                </span>
              </button>

              <button
                type="button"
                data-testid="crawl-mode-toggle"
                onClick={() => { setCrawlMode((v) => { const n = !v; if (n) { setGroupMode(false); setPassportMode(false); } return n; }); if (!crawlMode) applyCrawlType(CRAWL_TYPES[0]); setResult(null); setGroupPicks(null); }}
                className={`inline-flex items-center gap-2.5 rounded-full border-2 px-4 py-2.5 text-sm font-bold transition-colors ${crawlMode ? "border-[#E01E26] bg-[#E01E26] text-white" : "border-[#E01E26] bg-white text-[#E01E26] hover:bg-[#FCECEC]"}`}
              >
                <Beer className="h-4 w-4" />
                {t("Pub Crawls & more")}
                <span className={`ml-1 h-4 w-7 rounded-full p-0.5 transition-colors ${crawlMode ? "bg-white/40" : "bg-[#D5D8DC]"}`}>
                  <span className={`block h-3 w-3 rounded-full bg-white transition-transform ${crawlMode ? "translate-x-3" : ""}`} />
                </span>
              </button>

              <button
                type="button"
                data-testid="passport-mode-toggle"
                onClick={() => { setPassportMode((v) => { const n = !v; if (n) { setGroupMode(false); setCrawlMode(false); setAllMode(false); if (!PASSPORT_CATEGORIES.includes(mode)) switchMode("explore"); } return n; }); setMyPassports(readPassports()); setResult(null); setGroupPicks(null); }}
                className={`inline-flex items-center gap-2.5 rounded-full border-2 px-4 py-2.5 text-sm font-bold transition-colors ${passportMode ? "border-[#2E7D32] bg-[#2E7D32] text-white" : "border-[#2E7D32] bg-white text-[#2E7D32] hover:bg-[#E8F3E9]"}`}
              >
                <Stamp className="h-4 w-4" />
                {t("Fate Passport")}
                <span className={`ml-1 h-4 w-7 rounded-full p-0.5 transition-colors ${passportMode ? "bg-white/40" : "bg-[#D5D8DC]"}`}>
                  <span className={`block h-3 w-3 rounded-full bg-white transition-transform ${passportMode ? "translate-x-3" : ""}`} />
                </span>
              </button>

              {/* Champions + Passport Wall stay paired on one line */}
              <div className="flex items-center gap-2">
                <Link
                  to="/leaderboard"
                  data-testid="crawl-champions-link"
                  className="inline-flex flex-1 items-center justify-center gap-2 whitespace-nowrap rounded-full border-2 border-[#F0A24E] bg-white px-4 py-2.5 text-sm font-bold text-[#B26A12] transition-colors hover:bg-[#FBF3E7]"
                >
                  <Trophy className="h-4 w-4" /> {t("Champions")}
                </Link>

                <Link
                  to="/wall"
                  data-testid="passport-wall-link"
                  className="inline-flex flex-1 items-center justify-center gap-2 whitespace-nowrap rounded-full border-2 border-[#2E7D32] bg-white px-4 py-2.5 text-sm font-bold text-[#2E7D32] transition-colors hover:bg-[#E8F3E9]"
                >
                  <Globe2 className="h-4 w-4" /> {t("Passport Wall")}
                </Link>
              </div>

              <div className="flex items-center gap-2">
                <Link
                  to="/rituals"
                  data-testid="fates-witnessed-link"
                  className="inline-flex flex-1 items-center justify-center gap-2 whitespace-nowrap rounded-full border-2 border-[#7A4DB2] bg-white px-4 py-2.5 text-sm font-bold text-[#5E3596] transition-colors hover:bg-[#F3EDFA]"
                >
                  <Sparkles className="h-4 w-4" /> {t("Fates Witnessed")}
                </Link>

                <Link
                  to="/journal"
                  data-testid="fate-journal-link"
                  className="inline-flex flex-1 items-center justify-center gap-2 whitespace-nowrap rounded-full border-2 border-[#B3141A] bg-white px-4 py-2.5 text-sm font-bold text-[#B3141A] transition-colors hover:bg-[#FCF4F4]"
                >
                  <BookOpen className="h-4 w-4" /> {t("Fate Journal")}
                </Link>
              </div>

              <Link
                to="/bingo"
                data-testid="cuisine-bingo-link"
                className="inline-flex w-full items-center justify-center gap-2 whitespace-nowrap rounded-full border-2 border-[#B98A22] bg-white px-4 py-2.5 text-sm font-bold text-[#8F6A18] transition-colors hover:bg-[#FDF6E7]"
              >
                <Stamp className="h-4 w-4" /> {t("Cuisine Bingo")}
              </Link>
            </div>
            </div>

            {passportMode && (
              <PassportPicker
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
            )}

            {groupMode && (
              <GroupPicker
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
            )}

            {crawlMode && (
              <div className="mt-2 w-full basis-full rounded-2xl border border-[#E01E26]/30 bg-[#FDF6F6] p-4" data-testid="crawl-type-picker">
                <ol className="mb-4 space-y-1.5">
                  {[
                    t("Pick the kind of crawl you want."),
                    t("Set your start (and an optional end point) plus how far to search."),
                    t("Deal the crawl — we'll order the stops into a walkable route."),
                  ].map((s, i) => (
                    <li key={i} className="flex gap-2.5 font-sans text-sm text-[#3A3F45]">
                      <span className="mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full bg-[#E01E26] text-[11px] font-bold text-white">{i + 1}</span>
                      <span>{s}</span>
                    </li>
                  ))}
                </ol>
                <p className="mb-1.5 text-xs font-bold uppercase tracking-wider text-[#6B7075]">{t("Pick your crawl")}</p>
                <div className="flex flex-wrap gap-2">
                  {CRAWL_TYPES.map((ct) => (
                    <button
                      key={ct.key}
                      type="button"
                      data-testid={`crawl-type-${ct.key}`}
                      onClick={() => applyCrawlType(ct)}
                      className={`rounded-full border px-4 py-2 text-sm font-bold transition-colors ${crawlType === ct.key ? "border-[#E01E26] bg-[#E01E26] text-white" : "border-[#E2E4E7] bg-white text-[#6B7075] hover:bg-[#EDEEF0]"}`}
                    >
                      {ct.label}
                    </button>
                  ))}
                </div>

                {/* Location A (start / your area) */}
                <p className="mb-1.5 mt-4 text-xs font-bold uppercase tracking-wider text-[#6B7075]">{t("Start / your area")}</p>
                <div className="flex flex-wrap items-center gap-2">
                  <input
                    value={coords ? "" : zip}
                    onChange={(e) => { const v = e.target.value.replace(/[^\d]/g, "").slice(0, 5); setZip(v); setCoords(null); }}
                    placeholder={coords ? t("Using your location") : t("ZIP code")}
                    data-testid="crawl-zip-a"
                    inputMode="numeric"
                    className="w-32 rounded-full border border-[#E2E4E7] bg-white px-4 py-2.5 text-sm text-[#0E0E0E] outline-none placeholder-[#9AA0A6] focus:border-[#E01E26]"
                  />
                  <button
                    type="button"
                    onClick={useMyLocation}
                    disabled={geoLoading}
                    data-testid="crawl-use-location-a"
                    className={`inline-flex items-center gap-2 rounded-full px-4 py-2.5 text-sm font-bold transition-colors disabled:opacity-70 ${coords ? "bg-[#E01E26] text-white hover:bg-[#B3141A]" : "border border-[#E2E4E7] bg-white text-[#0E0E0E] hover:bg-[#EDEEF0]"}`}
                  >
                    <LocateFixed className="h-4 w-4" /> {geoLoading ? t("Locating…") : coords ? t("Using your location") : t("Use my location")}
                  </button>
                </div>

                {/* Location B (optional end point) */}
                <p className="mb-1.5 mt-3 text-xs font-bold uppercase tracking-wider text-[#6B7075]">{t("End point")} <span className="text-[#9AA0A6]">{t("(optional — crawl toward here)")}</span></p>
                <div className="flex flex-wrap items-center gap-2">
                  <input
                    value={coordsB ? "" : zipB}
                    onChange={(e) => { const v = e.target.value.replace(/[^\d]/g, "").slice(0, 5); setZipB(v); setCoordsB(null); }}
                    placeholder={coordsB ? t("2nd location set") : t("ZIP code")}
                    data-testid="crawl-zip-b"
                    inputMode="numeric"
                    className="w-32 rounded-full border border-[#E2E4E7] bg-white px-4 py-2.5 text-sm text-[#0E0E0E] outline-none placeholder-[#9AA0A6] focus:border-[#E01E26]"
                  />
                  <button
                    type="button"
                    onClick={useMyLocationB}
                    disabled={geoLoadingB}
                    data-testid="crawl-use-location-b"
                    className={`inline-flex items-center gap-2 rounded-full px-4 py-2.5 text-sm font-bold transition-colors disabled:opacity-70 ${coordsB ? "bg-[#E01E26] text-white hover:bg-[#B3141A]" : "border border-[#E2E4E7] bg-white text-[#0E0E0E] hover:bg-[#EDEEF0]"}`}
                  >
                    <LocateFixed className="h-4 w-4" /> {geoLoadingB ? t("Locating…") : coordsB ? t("2nd location set") : t("Use this location")}
                  </button>
                  {(coordsB || (zipB || "").length === 5) && (
                    <button type="button" onClick={() => { setZipB(""); setCoordsB(null); }} data-testid="crawl-clear-b"
                      className="text-xs font-semibold text-[#9AA0A6] underline underline-offset-2 hover:text-[#E01E26]">{t("clear")}</button>
                  )}
                </div>

                <div className="mt-4 rounded-xl border border-[#E2E4E7] bg-white px-4 py-3" data-testid="crawl-radius-control">
                  <div className="mb-2 flex items-center justify-between">
                    <p className="font-sans text-xs font-bold uppercase tracking-wider text-[#6B7075]">{t("Search radius")}</p>
                    <span data-testid="crawl-radius-value" className="font-serif text-lg font-semibold text-[#E01E26]">
                      {radius} <span className="text-sm text-[#6B7075]">mi</span>
                    </span>
                  </div>
                  <Slider data-testid="crawl-radius-slider" value={[radius]} min={1} max={radiusMax} step={1} onValueChange={(v) => setRadius(v[0])} aria-label="Search radius in miles" />
                  <div className="mt-1.5 flex justify-between font-sans text-[10px] font-bold uppercase tracking-wider text-[#B8BCC2]">
                    <span>1 mi</span>
                    <span>{radiusMax} mi</span>
                  </div>
                </div>

                <motion.button
                  data-testid="crawl-deal-button"
                  onClick={dealCrawl}
                  disabled={spinning || loading}
                  whileHover={{ scale: spinning || loading ? 1 : 1.03 }}
                  whileTap={SPIN_TAP}
                  className="mt-4 inline-flex items-center gap-3 rounded-full border-2 border-[#0E0E0E] bg-[#E01E26] px-10 py-4 font-sans text-lg font-bold text-white shadow-lg shadow-[#E01E26]/25 transition-colors hover:bg-[#B3141A] disabled:opacity-70"
                >
                  <Dices className={`h-6 w-6 ${spinning || loading ? "animate-spin" : ""}`} />
                  {loading ? t("Finding spots…") : spinning ? t("Shuffling…") : (light ? t("Plan a Crawl") : t("Deal a Crawl!"))}
                </motion.button>
              </div>
            )}

            {fatesDealt !== null && (
              <div className="mt-4 inline-flex items-center gap-2 font-sans text-sm" data-testid="fates-dealt-counter" style={{ color: light ? "#6B7075" : (ambCfg ? ambCfg.sky : "rgba(255,255,255,0.72)") }}>
                <Dices className="h-4 w-4" style={{ color: ambCfg ? ambCfg.accent : "#E01E26" }} />
                <span><span className="font-bold" style={{ color: light ? "#0E0E0E" : (ambCfg ? ambCfg.sky : "#FFFFFF") }}>{fatesDealt.toLocaleString()}</span> {t("fates dealt")}</span>
                {crawlsCompleted !== null && crawlsCompleted > 0 && (
                  <span className="ml-3 inline-flex items-center gap-1.5" data-testid="crawls-completed-counter">
                    <Trophy className="h-4 w-4" style={{ color: ambCfg ? ambCfg.accent : "#E01E26" }} />
                    <span><span className="font-bold" style={{ color: light ? "#0E0E0E" : (ambCfg ? ambCfg.sky : "#FFFFFF") }}>{crawlsCompleted.toLocaleString()}</span> {t("crawls survived")}</span>
                  </span>
                )}
                {streak >= 2 && (
                  <span className="ml-3 inline-flex items-center gap-1.5 rounded-full bg-[#FCF4F4] px-3 py-1 text-[#E01E26]" data-testid="streak-badge">
                    <Flame className="h-4 w-4" /><span className="font-bold">{streak} {t("day streak")}</span>
                  </span>
                )}
              </div>
            )}
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
            <div ref={resultRef} className="relative z-10 min-h-[420px] rounded-3xl border border-[#E2E4E7] bg-white p-4 shadow-xl shadow-black/5">
              {theme === "dark" && result && !surpriseReveal && <GhostEscort key={`esc-${result.id}`} />}
              <RevealStage spinning={spinning} flash={flash} deck={results} result={result} groupPicks={groupPicks} mode={mode} light={light} theme={theme} onReset={() => { setResult(null); setGroupPicks(null); setLocked(false); setSurpriseReveal(null); setRerollsLeft(3); }} onReSpin={reSpin} onReport={reportClosed} onPick={(c) => landFate(c, { group: true })} isFavorite={isFavorite} onToggleFavorite={toggleFavorite} onDare={doubleOrNothing} dareAvailable={results.length > 1} locked={locked} rerollsLeft={rerollsLeft} onSwipeReroll={swipeReroll} surprise={surpriseReveal} onSurpriseDone={surpriseDone} />
            </div>
          </div>
        </div>
      </section>

      {/* Nearby results */}
      {results.length > 0 && (
        <section className="relative z-10 mx-auto max-w-6xl px-6 pb-24 pt-8 md:px-12">
          {fateOfDay && !spinning && (
            <div className="mb-8 flex items-center gap-4 rounded-2xl border-2 border-[#E6B23A] bg-gradient-to-r from-[#FDF6E7] to-white p-4" data-testid="fate-of-day-card">
              {cardImage(fateOfDay) && (
                <img src={cardImage(fateOfDay)} alt="" className="h-16 w-16 shrink-0 rounded-xl object-cover" />
              )}
              <div className="min-w-0 flex-1">
                <p className="flex items-center gap-1.5 font-sans text-[10px] font-bold uppercase tracking-[0.2em] text-[#B98A22]">
                  <Crown className="h-3.5 w-3.5" /> {t("Fate of the Day")}
                </p>
                <p className="truncate font-serif text-lg font-bold text-[#0E0E0E]">{fateOfDay.name}</p>
                <p className="truncate font-sans text-xs text-[#6B7075]">
                  {[fateOfDay.cuisine, fateOfDay.price, fateOfDay.distance != null ? `${fateOfDay.distance} ${t("mi away")}` : null].filter(Boolean).join(" · ")}
                </p>
              </div>
              <button
                onClick={() => { landFate(fateOfDay); window.scrollTo({ top: 0, behavior: "smooth" }); trackEvent("fate_of_day_deal", { theme }); }}
                data-testid="fate-of-day-deal"
                className="shrink-0 rounded-full bg-[#B98A22] px-4 py-2 font-sans text-xs font-bold text-white transition-colors hover:bg-[#8F6A18]"
              >
                {t("Deal me this")}
              </button>
            </div>
          )}
          <div className="flex items-end justify-between border-b border-[#E2E4E7] pb-4">
            <h2 className="font-serif text-2xl font-medium tracking-tight text-[#0E0E0E] sm:text-3xl">
              {t("Nearby spots")}
            </h2>
            <label className="flex items-center gap-2 font-sans text-xs font-bold text-[#6B7075]">
              <ArrowDownWideNarrow className="h-4 w-4" />
              <select
                data-testid="sort-select"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="rounded-full border border-[#E2E4E7] bg-white px-3 py-1.5 font-bold text-[#0E0E0E] focus:outline-none"
              >
                <option value="default">{t("Featured")}</option>
                <option value="distance">{t("Closest")}</option>
                <option value="rating">{t("Top rated")}</option>
                <option value="price">{t("Cheapest")}</option>
              </select>
            </label>
          </div>
          <div className="mt-8 grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3" data-testid="restaurant-grid">
            {sortedResults.slice(0, 6).map((r) => (
              <RestaurantCard key={r.id} r={r} mode={mode} onReport={reportClosed} isFavorite={isFavorite(r)} onToggleFavorite={toggleFavorite} />
            ))}
          </div>
        </section>
      )}

      <HomeInfoSections light={light} onSponsor={() => setSponsorOpen(true)} />

      <HomeFooter light={light} />
    </div>
  );
}
