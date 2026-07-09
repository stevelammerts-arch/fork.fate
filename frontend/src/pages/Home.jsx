import React, { useState, useRef, useEffect, useMemo } from "react";
import axios from "axios";
import { motion, AnimatePresence, useMotionValue, useSpring, useTransform } from "framer-motion";
import { toast } from "sonner";
import { Dices, Star, MapPin, RotateCcw, Search, ExternalLink, ShoppingBag, Flag, Clock, Share2, LocateFixed, MessageSquarePlus, Skull, ArrowDownWideNarrow, ImageDown, Flame, Heart, Users, Sparkles } from "lucide-react";
import Filters from "../components/Filters";
import { RestaurantCard } from "../components/RestaurantCard";
import AddRestaurantDialog from "../components/AddRestaurantDialog";
import AdUnit from "../components/AdUnit";
import InstallAppButton from "../components/InstallAppButton";
import BecomeSponsorDialog from "../components/BecomeSponsorDialog";
import SocialShare from "../components/SocialShare";
import CheckUpdatesButton from "../components/CheckUpdatesButton";
import FavoritesDrawer from "../components/FavoritesDrawer";
import GroupVote from "../components/GroupVote";
import { useFavorites } from "../hooks/useFavorites";
import GuidedFlow from "../components/GuidedFlow";
import { Input } from "../components/ui/input";
import { Slider } from "../components/ui/slider";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const STREAK_KEY = "ff_streak";
const midnight = (d) => { const x = new Date(d); x.setHours(0, 0, 0, 0); return x; };
function readStreak() {
  try {
    const raw = JSON.parse(localStorage.getItem(STREAK_KEY) || "null");
    if (!raw) return 0;
    const days = Math.round((midnight(new Date()) - midnight(raw.date)) / 86400000);
    return days === 0 || days === 1 ? raw.count : 0;
  } catch { return 0; }
}
function bumpStreak() {
  try {
    const raw = JSON.parse(localStorage.getItem(STREAK_KEY) || "null");
    let count = 1;
    if (raw) {
      const days = Math.round((midnight(new Date()) - midnight(raw.date)) / 86400000);
      if (days === 0) count = raw.count;
      else if (days === 1) count = raw.count + 1;
    }
    localStorage.setItem(STREAK_KEY, JSON.stringify({ date: new Date().toISOString(), count }));
    return count;
  } catch { return 1; }
}


const SHUFFLE_INTERVAL_MS = 90;
const SHUFFLE_DURATION_MS = 1500;
const RESULT_SPRING = { type: "spring", stiffness: 260, damping: 16 };
const FLASH_TRANSITION = { duration: 0.08 };
const HERO_INITIAL = { opacity: 0, y: 20 };
const HERO_ANIMATE = { opacity: 1, y: 0 };
const HERO_TRANSITION = { duration: 0.6 };
const DETAIL_INITIAL = { opacity: 0, y: 10 };
const DETAIL_ANIMATE = { opacity: 1, y: 0 };
const DETAIL_TRANSITION = { delay: 0.2 };
const SPIN_TAP = { scale: 0.96 };

const REAPER_LINES = [
  "The reaper has spoken.",
  "Fate has been sealed.",
  "The cards have chosen.",
  "Destiny points here.",
  "Your fate is written.",
];
const reaperLineFor = (r) => REAPER_LINES[(r?.name?.length || 0) % REAPER_LINES.length];

const FOOD_CUISINES = [
  "Italian", "Mexican", "Chinese", "Japanese", "Indian", "Thai", "Korean", "Chicken Wings", "Fried Chicken",
  "American", "Mediterranean", "Seafood", "Pizza", "Deli", "Breakfast", "Vegan", "Gluten Free", "BBQ", "Greek", "Cafe",
];
const DRINK_CUISINES = ["Coffee", "Boba Tea", "Smoothie"];
const DESSERT_CUISINES = ["Ice Cream", "Candy Shops", "Bakery", "Frozen Yogurt"];
const BAR_CUISINES = [
  "Beer", "Wine", "Cocktails", "Liquor", "Spirits", "Whiskey", "Margaritas", "Tiki", "Sports Bar", "Irish Bar", "Bars",
  "Pool", "Darts", "Volleyball", "Music", "Pickle Ball", "Games", "Bowling",
];

export default function Home() {
  const [mode, setMode] = useState("food");
  const [zip, setZip] = useState("");
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
  const [groupPicks, setGroupPicks] = useState(null);
  const [fatesDealt, setFatesDealt] = useState(null);
  const [streak, setStreak] = useState(() => readStreak());
  const [flash, setFlash] = useState(null);
  const [flashHit, setFlashHit] = useState(false);
  const shuffleRef = useRef(null);
  const resultRef = useRef(null);
  const lastPickRef = useRef(null);
  const { favorites, isFavorite, toggleFavorite, removeFavorite } = useFavorites();
  const [showGuided, setShowGuided] = useState(true);
  const [mysticalReveal, setMysticalReveal] = useState(false);

  const finishGuided = () => setShowGuided(false);

  const sealFate = ({ mode: m, zip: z, coords: c, radius: r, cuisines }) => {
    setMode(m);
    setZip(z || "");
    setCoords(c || null);
    setRadius(r);
    setSelectedCuisines(cuisines);
    setMysticalReveal(true);
    finishGuided();
    doSearch(cuisines, [], m, c || null, { zipArg: z || "", radiusArg: r });
  };

  // 3D parallax tilt for the reaper — follows the cursor for a sense of depth
  const tiltX = useMotionValue(0);
  const tiltY = useMotionValue(0);
  const rotX = useSpring(useTransform(tiltY, [-0.5, 0.5], [8, -8]), { stiffness: 60, damping: 18 });
  const rotY = useSpring(useTransform(tiltX, [-0.5, 0.5], [-12, 12]), { stiffness: 60, damping: 18 });
  const shiftX = useSpring(useTransform(tiltX, [-0.5, 0.5], [-18, 18]), { stiffness: 60, damping: 18 });
  const shiftY = useSpring(useTransform(tiltY, [-0.5, 0.5], [-12, 12]), { stiffness: 60, damping: 18 });
  useEffect(() => {
    const onMove = (e) => {
      tiltX.set(e.clientX / window.innerWidth - 0.5);
      tiltY.set(e.clientY / window.innerHeight - 0.5);
    };
    window.addEventListener("mousemove", onMove);
    return () => window.removeEventListener("mousemove", onMove);
  }, [tiltX, tiltY]);

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
    }
  }, [result, groupPicks]);

  useEffect(() => {
    axios.get(`${API}/stats/fates`).then(({ data }) => setFatesDealt(data.count)).catch(() => {});
  }, []);

  const toggle = (setter, arr, val) =>
    setter(arr.includes(val) ? arr.filter((x) => x !== val) : [...arr, val]);

  const switchMode = (m) => {
    if (m === mode) return;
    setMode(m);
    setSelectedCuisines([]);
    setResults([]);
    setResult(null);
    setGroupPicks(null);
  };

  const cuisineList = mode === "food" ? FOOD_CUISINES : mode === "drinks" ? DRINK_CUISINES : mode === "bars" ? BAR_CUISINES : DESSERT_CUISINES;

  const runShuffle = (pool) => {
    setResult(null);
    setGroupPicks(null);
    setSpinning(true);
    setFlashHit(false);
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
    let i = 0;
    let delay = 55; // fast start
    const maxDelay = 300; // slow end
    const step = () => {
      setFlash(pool[i % pool.length]);
      i++;
      delay = delay * 1.16 + 4; // ease-out: each flick a bit slower
      if (delay < maxDelay) {
        shuffleRef.current = setTimeout(step, delay);
      } else {
        // land on the chosen spot, hold, quick flash, then reveal
        setFlash(chosen);
        shuffleRef.current = setTimeout(() => {
          setFlashHit(true);
          shuffleRef.current = setTimeout(() => {
            if (groupMode) setGroupPicks(picks);
            else setResult(chosen);
            setSpinning(false);
            setFlash(null);
            setFlashHit(false);
            axios.post(`${API}/stats/fate-dealt`).then(({ data }) => setFatesDealt(data.count)).catch(() => {});
            setStreak(bumpStreak());
          }, 1000);
        }, 300);
      }
    };
    step();
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
      const { data } = await axios.post(`${API}/places/search`, {
        zip_code: coordsArg ? null : z || null,
        lat: coordsArg?.lat ?? null,
        lng: coordsArg?.lng ?? null,
        cuisines: cuisinesArg,
        price_levels: pricesArg,
        category: categoryArg,
        open_now: openNow,
        radius_miles: rad,
      });
      setResults(data.restaurants);
      setSource(data.source);
      if (!data.restaurants.length) {
        toast.error("No spots match those filters — try loosening them");
        return;
      }
      runShuffle(data.restaurants);
    } catch (e) {
      toast.error(e.response?.data?.detail || "Search failed");
    } finally {
      setLoading(false);
    }
  };

  const spin = () => doSearch(selectedCuisines, [], mode);

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
    if (results.length) runShuffle(results);
  };

  const dealFromFavorites = () => {
    if (spinning || loading || !favorites.length) return;
    setSource("favorites");
    setResults(favorites);
    lastPickRef.current = null;
    runShuffle(favorites);
  };

  const sortedResults = useMemo(() => {
    return [...results].sort((a, b) => {
      if (sortBy === "distance") return a.distance - b.distance;
      if (sortBy === "rating") return b.rating - a.rating;
      if (sortBy === "price") return a.price.length - b.price.length;
      return (b.sponsored ? 1 : 0) - (a.sponsored ? 1 : 0);
    });
  }, [results, sortBy]);

  return (
    <div className="relative min-h-screen overflow-hidden bg-white">
      <AnimatePresence>
        {showGuided && (
          <GuidedFlow
            cuisineMap={{ food: FOOD_CUISINES, drinks: DRINK_CUISINES, bars: BAR_CUISINES, desserts: DESSERT_CUISINES }}
            onSeal={sealFate}
            onSkip={finishGuided}
          />
        )}
      </AnimatePresence>
      {/* Decorative reaper background with load animation */}
      <div className="pointer-events-none fixed left-1/2 top-1/2 z-0 -translate-x-1/2 -translate-y-1/2 select-none" style={{ perspective: "1200px" }}>
        <motion.div
          style={{ rotateX: rotX, rotateY: rotY, x: shiftX, y: shiftY, transformStyle: "preserve-3d" }}
        >
        <motion.div
          className="relative"
          style={{ transformOrigin: "50% 4%", transformStyle: "preserve-3d" }}
          animate={{ skewX: [0, 1.5, 0.4, 1.4, 0] }}
          transition={{ skewX: { duration: 5.5, repeat: Infinity, ease: "easeInOut", delay: 1.4 } }}
        >
        <motion.img
          src="/reaper.png"
          alt=""
          aria-hidden="true"
          data-testid="reaper-bg"
          className="h-[70vh] max-w-none md:h-[85vh]"
          style={{ filter: "drop-shadow(24px 34px 30px rgba(0,0,0,0.45))" }}
          initial={{ opacity: 0, y: 50, scale: 1.06 }}
          animate={{ opacity: 0.38, y: 0, scale: 1 }}
          transition={{
            opacity: { duration: 1.6, ease: "easeOut" },
            y: { duration: 1.6, ease: "easeOut" },
            scale: { duration: 1.6, ease: "easeOut" },
          }}
        />
        <motion.div
          aria-hidden="true"
          data-testid="reaper-lantern"
          className="absolute z-10 h-16 w-16 rounded-full"
          style={{
            left: "89.3%",
            top: "27.5%",
            marginLeft: "-32px",
            marginTop: "-32px",
            background: "radial-gradient(circle, rgba(255,225,110,0.95), rgba(255,196,60,0.45) 45%, rgba(255,196,60,0) 72%)",
            filter: "blur(8px)",
          }}
          initial={{ opacity: 0 }}
          animate={{ opacity: [0.35, 0.95, 0.5, 1, 0.4, 0.8, 0.45] }}
          transition={{ duration: 2.2, repeat: Infinity, ease: "easeInOut", delay: 1.4 }}
        />
        </motion.div>
        </motion.div>
      </div>
      {/* Header */}
      <header className="sticky top-0 z-30 border-b border-[#E2E4E7] bg-[#0E0E0E]">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-6 md:px-12">
          <div className="flex items-center gap-3">
            <div className="relative h-16 w-16 overflow-hidden rounded-full bg-black ring-1 ring-white/25">
              <img src="/logo-mark.png" alt="Fork·Fate logo" className="h-16 w-16 scale-110 object-contain" />
              <motion.div
                className="pointer-events-none absolute inset-0"
                initial={{ x: "-130%" }}
                animate={{ x: ["-130%", "130%"] }}
                transition={{ duration: 2.6, delay: 0.5, repeat: Infinity, repeatDelay: 5, ease: "easeInOut" }}
                style={{ background: "linear-gradient(115deg, transparent 46%, rgba(255,255,255,0.85) 50%, transparent 54%)" }}
              />
            </div>
            <span className="font-serif text-3xl font-semibold tracking-tight text-white">
              Fork·Fate
            </span>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowGuided(true)}
              data-testid="relaunch-guided-button"
              title="Start the guided ritual"
              className="inline-flex items-center gap-2 rounded-full border border-white/25 bg-transparent px-3 py-2.5 text-sm font-bold text-white transition-colors hover:bg-white/10 sm:px-4"
            >
              <Sparkles className="h-4 w-4 text-[#E01E26]" /> <span className="hidden sm:inline">Guided</span>
            </button>
            <BecomeSponsorDialog variant="link" />
            <FavoritesDrawer favorites={favorites} onRemove={removeFavorite} onDeal={dealFromFavorites} groupMode={groupMode} />
            <InstallAppButton />
            <AddRestaurantDialog mode={mode} onAdded={(r) => setResults((p) => [r, ...p])} />
          </div>
        </div>
      </header>

      {/* Social share bar (transparent) */}
      <div className="relative z-10 mx-auto flex max-w-6xl items-center justify-end gap-2 bg-transparent px-4 pt-2 md:px-12" data-testid="app-social-share">
        <SocialShare />
      </div>

      {/* Full-screen shuffle pop-up */}
      <AnimatePresence>
        {spinning && !result && (
          <motion.div
            key="shuffle-popup"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 px-6 backdrop-blur-sm"
            data-testid="shuffle-popup"
            style={{ pointerEvents: flashHit ? "none" : "auto" }}
          >
            <motion.div
              initial={{ scale: 0.8, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ type: "spring", stiffness: 300, damping: 24 }}
              className="w-full max-w-sm p-8"
            >
              <ShufflingDeck cards={results} flash={flash} landed={flashHit} />
            </motion.div>
            {flashHit && (
              <motion.div
                className="pointer-events-none absolute inset-0 bg-white"
                data-testid="shuffle-flash"
                initial={{ opacity: 0 }}
                animate={{ opacity: [0, 0.95, 0] }}
                transition={{ duration: 0.448, times: [0, 0.35, 1], ease: "easeOut" }}
              />
            )}
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
          <p className="font-sans text-sm font-extrabold tracking-[0.25em] uppercase text-[#E01E26]">
            {mode === "food" ? "Can't decide where to eat?" : mode === "drinks" ? "Can't decide what to sip?" : mode === "bars" ? "Can't decide where to drink?" : "Craving something sweet?"}
          </p>
          <h1 className="mt-3 font-serif text-4xl font-medium leading-none tracking-tighter text-[#0E0E0E] sm:text-5xl lg:text-6xl">
            {mode === "food" ? "Let fate pick tonight's table." : mode === "drinks" ? "Let fate pick your next sip." : mode === "bars" ? "Let fate pick tonight's bar." : "Let fate pick your sweet treat."}
          </h1>
          <p className="mt-4 font-sans text-base font-semibold leading-relaxed text-[#0E0E0E]">
            {mode === "food"
              ? "Set the mood with a few filters and hit Deal. We'll shuffle great local restaurants — up to 50 miles out — and land on your next meal."
              : mode === "drinks"
              ? "Coffee, boba tea or a smoothie? Set your filters and hit Deal — we'll shuffle nearby drink spots and pick one for you."
              : mode === "bars"
              ? "Beer, whiskey, margaritas or a Tiki bar? Set your filters and hit Deal — we'll shuffle nearby bars and pick tonight's spot."
              : "Ice cream, bakery, candy or froyo? Set your filters and hit Deal — we'll shuffle nearby dessert spots and pick your treat."}
          </p>
        </motion.div>

        <div className="mt-10 grid gap-10 lg:grid-cols-[1fr_1.1fr] lg:items-start">
          {/* left: search + filters + spin */}
          <div className="min-w-0 space-y-7">
            <div className="inline-flex rounded-full border border-[#E2E4E7] bg-[#EDEEF0] p-1" data-testid="mode-toggle">
              <button
                data-testid="mode-food"
                onClick={() => switchMode("food")}
                className={`rounded-full px-5 py-2 text-sm font-bold transition-colors ${mode === "food" ? "bg-[#0E0E0E] text-white" : "text-[#6B7075] hover:text-[#0E0E0E]"}`}
              >
                Food
              </button>
              <button
                data-testid="mode-drinks"
                onClick={() => switchMode("drinks")}
                className={`rounded-full px-5 py-2 text-sm font-bold transition-colors ${mode === "drinks" ? "bg-[#0E0E0E] text-white" : "text-[#6B7075] hover:text-[#0E0E0E]"}`}
              >
                Drinks
              </button>
              <button
                data-testid="mode-bars"
                onClick={() => switchMode("bars")}
                className={`rounded-full px-5 py-2 text-sm font-bold transition-colors ${mode === "bars" ? "bg-[#0E0E0E] text-white" : "text-[#6B7075] hover:text-[#0E0E0E]"}`}
              >
                Bars
              </button>
              <button
                data-testid="mode-desserts"
                onClick={() => switchMode("desserts")}
                className={`rounded-full px-5 py-2 text-sm font-bold transition-colors ${mode === "desserts" ? "bg-[#0E0E0E] text-white" : "text-[#6B7075] hover:text-[#0E0E0E]"}`}
              >
                Desserts
              </button>
            </div>

            <div className="space-y-2">
              <p className="font-sans text-xs font-bold tracking-[0.2em] uppercase text-[#0E0E0E]">
                Your ZIP code <span className="text-[#B8BCC2]">(optional)</span>
              </p>
              <div className="flex items-center gap-2">
                <div className="flex flex-1 items-center gap-2 rounded-full border border-[#E2E4E7] bg-white px-4 py-1.5 focus-within:border-[#E01E26]">
                  <Search className="h-5 w-5 shrink-0 text-[#6B7075]" />
                  <Input
                    data-testid="zip-input"
                    value={zip}
                    onChange={(e) => { setZip(e.target.value.replace(/[^\d]/g, "").slice(0, 5)); setCoords(null); }}
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
                  className={`inline-flex shrink-0 items-center gap-2 rounded-full px-4 py-2.5 text-sm font-bold transition-colors disabled:opacity-70 ${coords ? "bg-[#E01E26] text-white hover:bg-[#B3141A]" : "border border-[#E2E4E7] bg-white text-[#0E0E0E] hover:bg-[#EDEEF0]"}`}
                >
                  <LocateFixed className={`h-4 w-4 ${geoLoading ? "animate-pulse" : ""}`} />
                  {geoLoading ? "Locating…" : coords ? "Using your location" : "Use my location"}
                </button>
              </div>

              <div className="rounded-2xl border border-[#E2E4E7] bg-white px-4 py-3" data-testid="radius-control">
                <div className="mb-2 flex items-center justify-between">
                  <p className="font-sans text-xs font-bold tracking-[0.2em] uppercase text-[#0E0E0E]">Search radius</p>
                  <span data-testid="radius-value" className="font-serif text-lg font-semibold text-[#E01E26]">
                    {radius} <span className="text-sm text-[#6B7075]">mi</span>
                  </span>
                </div>
                <Slider
                  data-testid="radius-slider"
                  value={[radius]}
                  min={1}
                  max={50}
                  step={1}
                  onValueChange={(v) => setRadius(v[0])}
                  aria-label="Search radius in miles"
                />
                <div className="mt-1.5 flex justify-between font-sans text-[10px] font-bold uppercase tracking-wider text-[#B8BCC2]">
                  <span>1 mi</span>
                  <span>50 mi</span>
                </div>
              </div>
            </div>

            <Filters
              cuisines={cuisineList}
              cuisineLabel={mode === "food" ? "Cuisine" : mode === "drinks" ? "Drink type" : mode === "bars" ? "Bar type" : "Dessert type"}
              selectedCuisines={selectedCuisines}
              toggleCuisine={(c) => toggle(setSelectedCuisines, selectedCuisines, c)}
            />

            <button
              type="button"
              data-testid="open-now-toggle"
              onClick={() => setOpenNow((v) => !v)}
              className={`inline-flex items-center gap-2.5 rounded-full border px-4 py-2.5 text-sm font-bold transition-colors ${openNow ? "border-[#E01E26] bg-[#E01E26] text-white" : "border-[#E2E4E7] bg-white text-[#6B7075] hover:bg-[#EDEEF0]"}`}
            >
              <Clock className="h-4 w-4" />
              Open now only
              <span className={`ml-1 h-4 w-7 rounded-full p-0.5 transition-colors ${openNow ? "bg-white/40" : "bg-[#D5D8DC]"}`}>
                <span className={`block h-3 w-3 rounded-full bg-white transition-transform ${openNow ? "translate-x-3" : ""}`} />
              </span>
            </button>

            <button
              type="button"
              data-testid="group-mode-toggle"
              onClick={() => { setGroupMode((v) => !v); setResult(null); setGroupPicks(null); }}
              className={`ml-3 inline-flex items-center gap-2.5 rounded-full border px-4 py-2.5 text-sm font-bold transition-colors ${groupMode ? "border-[#E01E26] bg-[#E01E26] text-white" : "border-[#E2E4E7] bg-white text-[#6B7075] hover:bg-[#EDEEF0]"}`}
            >
              <Users className="h-4 w-4" />
              Group mode
              <span className={`ml-1 h-4 w-7 rounded-full p-0.5 transition-colors ${groupMode ? "bg-white/40" : "bg-[#D5D8DC]"}`}>
                <span className={`block h-3 w-3 rounded-full bg-white transition-transform ${groupMode ? "translate-x-3" : ""}`} />
              </span>
            </button>

            <div className="flex flex-wrap items-center gap-4">
              <motion.button
                data-testid="spin-roulette-button"
                onClick={spin}
                disabled={spinning || loading}
                whileHover={{ scale: spinning || loading ? 1 : 1.03 }}
                whileTap={SPIN_TAP}
                className="inline-flex items-center gap-3 rounded-full bg-[#E01E26] px-10 py-5 font-sans text-lg font-bold text-white shadow-lg shadow-[#E01E26]/25 transition-colors hover:bg-[#B3141A] disabled:opacity-70"
              >
                <Dices className={`h-6 w-6 ${spinning || loading ? "animate-spin" : ""}`} />
                {loading ? "Finding spots…" : spinning ? "Shuffling…" : groupMode ? "Deal 3 Fates!" : "Deal Your Fate!"}
              </motion.button>
              {results.length > 0 && (
                <span className="font-sans text-sm text-[#6B7075]">
                  {results.length} spot{results.length !== 1 && "s"} nearby
                </span>
              )}
            </div>
            {fatesDealt !== null && (
              <div className="mt-4 inline-flex items-center gap-2 font-sans text-sm text-[#6B7075]" data-testid="fates-dealt-counter">
                <Dices className="h-4 w-4 text-[#E01E26]" />
                <span><span className="font-bold text-[#0E0E0E]">{fatesDealt.toLocaleString()}</span> fates dealt</span>
                {streak >= 2 && (
                  <span className="ml-3 inline-flex items-center gap-1.5 rounded-full bg-[#FCF4F4] px-3 py-1 text-[#E01E26]" data-testid="streak-badge">
                    <Flame className="h-4 w-4" /><span className="font-bold">{streak}-day streak</span>
                  </span>
                )}
              </div>
            )}
          </div>

          {/* right: reveal stage */}
          <div className="relative">
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
                  className="pointer-events-none absolute -inset-3"
                >
                  <motion.div
                    className="absolute inset-0 rounded-[32px]"
                    style={{ background: "conic-gradient(from 0deg, #E01E26, #0b0b0b, #7a0c10, #000000, #E01E26)", filter: "blur(16px)" }}
                    animate={{ rotate: 360 }}
                    transition={{ repeat: Infinity, duration: 5, ease: "linear" }}
                  />
                  <motion.div
                    className="absolute inset-[9px] rounded-[26px] border-2 border-[#E01E26]"
                    animate={{ opacity: [0.35, 0.95, 0.35], boxShadow: ["0 0 22px rgba(224,30,38,0.4)", "0 0 55px rgba(224,30,38,0.95)", "0 0 22px rgba(224,30,38,0.4)"] }}
                    transition={{ repeat: Infinity, duration: 1.8, ease: "easeInOut" }}
                  />
                </motion.div>
              )}
            </AnimatePresence>
            <div ref={resultRef} className="relative z-10 min-h-[420px] rounded-3xl border border-[#E2E4E7] bg-white p-4 shadow-xl shadow-black/5">
              <RevealStage spinning={spinning} flash={flash} deck={results} result={result} groupPicks={groupPicks} mode={mode} onReset={() => { setResult(null); setGroupPicks(null); }} onReSpin={reSpin} onReport={reportClosed} onPick={setResult} isFavorite={isFavorite} onToggleFavorite={toggleFavorite} />
            </div>
          </div>
        </div>
      </section>

      {/* Always-on ad banner */}
      <div className="relative z-10 mx-auto max-w-6xl px-6 pb-4 md:px-12">
        <AdUnit label="Advertisement" />
      </div>

      {/* Nearby results */}
      {results.length > 0 && (
        <section className="relative z-10 mx-auto max-w-6xl px-6 pb-24 pt-8 md:px-12">
          <div className="flex items-end justify-between border-b border-[#E2E4E7] pb-4">
            <h2 className="font-serif text-2xl font-medium tracking-tight text-[#0E0E0E] sm:text-3xl">
              Nearby spots
            </h2>
            <label className="flex items-center gap-2 font-sans text-xs font-bold text-[#6B7075]">
              <ArrowDownWideNarrow className="h-4 w-4" />
              <select
                data-testid="sort-select"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="rounded-full border border-[#E2E4E7] bg-white px-3 py-1.5 font-bold text-[#0E0E0E] focus:outline-none"
              >
                <option value="default">Featured</option>
                <option value="distance">Closest</option>
                <option value="rating">Top rated</option>
                <option value="price">Cheapest</option>
              </select>
            </label>
          </div>
          <AdUnit className="mt-8" label="Advertisement" />
          <div className="mt-8 grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3" data-testid="restaurant-grid">
            {sortedResults.slice(0, 6).map((r) => (
              <RestaurantCard key={r.id} r={r} onReport={reportClosed} isFavorite={isFavorite(r)} onToggleFavorite={toggleFavorite} />
            ))}
          </div>
        </section>
      )}

      {/* How it works + FAQ (SEO + first-time visitor context) */}
      <section className="relative z-10 mx-auto max-w-6xl px-6 pb-24 pt-4 md:px-12" data-testid="how-it-works-section">
        <div className="border-t border-[#E2E4E7] pt-14">
          <div className="rounded-3xl border border-[#E2E4E7] bg-white/95 p-8 shadow-sm backdrop-blur-sm md:p-10">
            <p className="font-sans text-xs font-bold uppercase tracking-[0.25em] text-[#E01E26]">How it works</p>
            <h2 className="mt-2 font-serif text-3xl font-medium tracking-tight text-[#0E0E0E] sm:text-4xl">
              Let fate settle the "where should we eat?" debate.
            </h2>
            <p className="mt-3 max-w-2xl font-sans text-base text-[#6B7075]">
              Fork·Fate is a restaurant roulette for anyone who's ever stared blankly at a food app, unable to decide.
              Set a couple of filters, shuffle the deck, and land on a real local place to eat, drink, or grab dessert —
              no endless scrolling, no group-chat deadlock.
            </p>
          </div>

          <div className="mt-10 grid grid-cols-1 gap-6 md:grid-cols-3">
            <div className="rounded-3xl border border-[#E2E4E7] bg-white p-6" data-testid="step-1">
              <div className="flex h-11 w-11 items-center justify-center rounded-full bg-[#0E0E0E]">
                <Search className="h-5 w-5 text-white" />
              </div>
              <h3 className="mt-4 font-serif text-xl text-[#0E0E0E]">1. Pick your craving</h3>
              <p className="mt-2 font-sans text-sm text-[#6B7075]">
                Choose Food, Drinks, Bars, or Desserts, then narrow it down with cuisine chips and toggles like
                "Open now" and "Gluten free" to match the mood.
              </p>
            </div>
            <div className="rounded-3xl border border-[#E2E4E7] bg-white p-6" data-testid="step-2">
              <div className="flex h-11 w-11 items-center justify-center rounded-full bg-[#0E0E0E]">
                <MapPin className="h-5 w-5 text-white" />
              </div>
              <h3 className="mt-4 font-serif text-xl text-[#0E0E0E]">2. Set your location</h3>
              <p className="mt-2 font-sans text-sm text-[#6B7075]">
                Enter a ZIP code or tap "Use my location" and Fork·Fate pulls real, nearby restaurants within
                50 miles using live Google data.
              </p>
            </div>
            <div className="rounded-3xl border border-[#E2E4E7] bg-white p-6" data-testid="step-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-full bg-[#E01E26]">
                <Dices className="h-5 w-5 text-white" />
              </div>
              <h3 className="mt-4 font-serif text-xl text-[#0E0E0E]">3. Deal your fate</h3>
              <p className="mt-2 font-sans text-sm text-[#6B7075]">
                Hit the button and watch the deck shuffle to reveal tonight's pick — with directions, reviews,
                delivery links, and a few more spots to consider if you want a re-roll.
              </p>
            </div>
          </div>

          <div className="mt-16 rounded-3xl border border-[#E2E4E7] bg-white/95 p-8 shadow-sm backdrop-blur-sm md:p-10">
          <h2 className="font-serif text-2xl font-medium tracking-tight text-[#0E0E0E] sm:text-3xl">
            Frequently asked questions
          </h2>
          <div className="mt-6 grid grid-cols-1 gap-x-10 gap-y-7 md:grid-cols-2" data-testid="faq-section">
            <div>
              <h3 className="font-serif text-lg text-[#0E0E0E]">How does Fork·Fate pick a restaurant?</h3>
              <p className="mt-1.5 font-sans text-sm text-[#6B7075]">
                After you set your filters, Fork·Fate gathers matching local spots and randomly deals one from the
                deck. Every deal is a fresh shuffle, so you'll discover places you might never have chosen yourself.
              </p>
            </div>
            <div>
              <h3 className="font-serif text-lg text-[#0E0E0E]">Is Fork·Fate free to use?</h3>
              <p className="mt-1.5 font-sans text-sm text-[#6B7075]">
                Yes — Fork·Fate is completely free. There's no account, no signup, and no paywall. Just open it,
                shuffle, and go eat.
              </p>
            </div>
            <div>
              <h3 className="font-serif text-lg text-[#0E0E0E]">Do I need to create an account?</h3>
              <p className="mt-1.5 font-sans text-sm text-[#6B7075]">
                No login required. You can start spinning the moment the page loads, on your phone or desktop.
              </p>
            </div>
            <div>
              <h3 className="font-serif text-lg text-[#0E0E0E]">How do you find nearby places?</h3>
              <p className="mt-1.5 font-sans text-sm text-[#6B7075]">
                Fork·Fate uses live Google Places data based on your ZIP code or device location, so results reflect
                real, currently-listed restaurants, bars, and dessert shops around you.
              </p>
            </div>
            <div>
              <h3 className="font-serif text-lg text-[#0E0E0E]">Can I add my favorite local spot?</h3>
              <p className="mt-1.5 font-sans text-sm text-[#6B7075]">
                Absolutely. Tap "Add spot" to submit a place you love. Community submissions are quickly reviewed
                before they join the roulette pool.
              </p>
            </div>
            <div>
              <h3 className="font-serif text-lg text-[#0E0E0E]">Can I install Fork·Fate as an app?</h3>
              <p className="mt-1.5 font-sans text-sm text-[#6B7075]">
                Yes — tap "Download app" to install Fork·Fate as a PWA on your home screen for one-tap access
                whenever hunger strikes.
              </p>
            </div>
          </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 border-t border-[#E2E4E7] bg-[#0E0E0E]">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-6 pb-28 pt-8 md:flex-row md:px-12 md:pb-20">
          <div className="flex items-center gap-2.5">
            <span className="relative block h-8 w-8 overflow-hidden rounded-full bg-black">
              <img src="/logo-mark.png" alt="" className="h-8 w-8 scale-110 object-contain" />
            </span>
            <span className="font-serif text-lg font-semibold text-white">Fork·Fate</span>
          </div>
          <div className="order-3 flex flex-col items-center gap-1.5 md:order-2">
            <p className="font-sans text-xs text-[#8A8F95]">
              © {new Date().getFullYear()} Fork·Fate — let fate decide.
            </p>
            <a
              href="mailto:stevelammerts@gmail.com?subject=Fork%C2%B7Fate%20App%20Improvement%20Idea&body=Hi%2C%20here%27s%20an%20idea%20to%20improve%20Fork%C2%B7Fate%3A%0A%0A"
              data-testid="feedback-link"
              className="inline-flex items-center gap-1.5 font-sans text-xs font-bold text-white underline-offset-4 transition-colors hover:text-[#E01E26] hover:underline"
            >
              <MessageSquarePlus className="h-3.5 w-3.5" /> Suggest an improvement
            </a>
            <CheckUpdatesButton />
            <a
              href="/admin"
              data-testid="admin-link"
              className="mt-1 font-sans text-[11px] font-semibold text-[#6B7075] underline-offset-4 transition-colors hover:text-white hover:underline"
            >
              Admin
            </a>
          </div>
          <div className="order-2 flex flex-col items-center gap-2 md:order-3 md:items-end" data-testid="sponsorship-cta">
            <BecomeSponsorDialog />
            <p className="font-sans text-xs font-bold text-[#E01E26]">
              $29/month — <span className="text-white">first month FREE</span>
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}

const DECK_SIZE = 5;

function ShufflingDeck({ cards, flash, landed }) {
  const source = cards.length ? cards : (flash ? [flash] : []);
  // Always fill a full visual deck so the shuffle never looks like a single card,
  // even when the filtered result set is tiny (repeats are visual-only).
  const base = [];
  for (let i = 0; source.length && base.length < DECK_SIZE; i++) {
    base.push(source[i % source.length]);
  }
  const deck = (landed && flash
    ? [flash, ...base.filter((c) => c?.id !== flash?.id)]
    : base
  ).slice(0, DECK_SIZE);
  const label = flash?.name;
  return (
    <div className="grid h-full min-h-[400px] place-items-center" data-testid="shuffling-deck">
      <div className="flex flex-col items-center gap-8">
        <div className="relative h-60 w-44">
          <AnimatePresence>
            {landed && (
              <motion.div
                className="pointer-events-none absolute left-1/2 top-1/2 z-50"
                style={{ transform: "translate(-50%, -44%)" }}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3 }}
                data-testid="skeleton-hands-overlay"
              >
                <motion.img
                  src="/skeleton-hands.png"
                  alt=""
                  className="w-[272px] max-w-none select-none drop-shadow-2xl"
                  initial={{ scale: 1.2 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", stiffness: 240, damping: 18 }}
                />
              </motion.div>
            )}
          </AnimatePresence>
          {deck.map((c, i) => (
            <motion.div
              key={(c?.id || "c") + i}
              className="absolute inset-0 overflow-hidden rounded-2xl border-2 border-white bg-[#0E0E0E] shadow-2xl shadow-black/30"
              style={{ zIndex: DECK_SIZE - i }}
              animate={
                landed
                  ? {
                      x: 0,
                      y: i === 0 ? 0 : -i * 3,
                      rotate: 0,
                      scale: i === 0 ? 1.05 : 0.96,
                    }
                  : {
                      x: [0, i % 2 === 0 ? -96 : 96, 0],
                      y: [0, -26, 0],
                      rotate: [(i - 2) * 4, i % 2 === 0 ? -17 : 17, (i - 2) * 4],
                      scale: [1, 0.97, 1],
                    }
              }
              transition={
                landed
                  ? { type: "spring", stiffness: 320, damping: 22 }
                  : { duration: 0.72, repeat: Infinity, ease: "easeInOut", delay: i * 0.1 }
              }
            >
              {c?.image && (
                <img src={c.image} alt="" className="h-full w-full object-cover opacity-90" />
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
            </motion.div>
          ))}
        </div>
        <div className="text-center">
          <p className="font-sans text-xs font-bold uppercase tracking-[0.25em] text-[#E01E26]">
            {landed ? "Fate has chosen" : "Shuffling the deck"}
          </p>
          <p className="mt-1 h-7 font-serif text-2xl text-white drop-shadow">{label}</p>
        </div>
      </div>
    </div>
  );
}

function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

function wrapLines(ctx, text, maxWidth) {
  const words = (text || "").split(" ");
  const lines = [];
  let line = "";
  for (const w of words) {
    const test = line ? `${line} ${w}` : w;
    if (ctx.measureText(test).width > maxWidth && line) {
      lines.push(line);
      line = w;
    } else {
      line = test;
    }
  }
  if (line) lines.push(line);
  return lines.slice(0, 3);
}

async function buildFateCard(card) {
  const W = 1080, H = 1080;
  const canvas = document.createElement("canvas");
  canvas.width = W; canvas.height = H;
  const ctx = canvas.getContext("2d");
  ctx.fillStyle = "#0B0B0B";
  ctx.fillRect(0, 0, W, H);
  const glow = ctx.createRadialGradient(W / 2, 430, 30, W / 2, 430, 640);
  glow.addColorStop(0, "rgba(224,30,38,0.30)");
  glow.addColorStop(1, "rgba(224,30,38,0)");
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, W, H);
  ctx.textAlign = "center";

  // Logo badge
  try {
    const logo = await loadImage("/logo-mark.png");
    const s = 170, lx = (W - s) / 2, ly = 120, cx = W / 2, cy = ly + s / 2;
    ctx.save();
    ctx.beginPath(); ctx.arc(cx, cy, s / 2, 0, Math.PI * 2); ctx.clip();
    ctx.drawImage(logo, lx, ly, s, s);
    ctx.restore();
    ctx.strokeStyle = "rgba(255,255,255,0.35)"; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.arc(cx, cy, s / 2, 0, Math.PI * 2); ctx.stroke();
  } catch (e) { console.debug("logo draw skipped", e); }

  // Kicker
  ctx.fillStyle = "#E01E26";
  ctx.font = "700 30px Georgia, 'Times New Roman', serif";
  ctx.fillText("T H E   R E A P E R   H A S   S P O K E N", W / 2, 380);

  // Restaurant name (wrapped)
  ctx.fillStyle = "#FFFFFF";
  ctx.font = "700 82px Georgia, 'Times New Roman', serif";
  const lines = wrapLines(ctx, card.name || "Your pick", W - 160);
  let y = 500;
  for (const ln of lines) { ctx.fillText(ln, W / 2, y); y += 96; }

  // Meta
  ctx.fillStyle = "#B9BEC4";
  ctx.font = "400 40px Arial, sans-serif";
  const meta = [card.cuisine, card.price, card.rating ? `★ ${Number(card.rating).toFixed(1)}` : null, card.distance ? `${card.distance} mi` : null].filter(Boolean).join("   ·   ");
  ctx.fillText(meta, W / 2, y + 20);

  // Divider
  ctx.strokeStyle = "rgba(224,30,38,0.8)"; ctx.lineWidth = 4;
  ctx.beginPath(); ctx.moveTo(W / 2 - 90, y + 90); ctx.lineTo(W / 2 + 90, y + 90); ctx.stroke();

  // Footer CTA
  ctx.fillStyle = "#FFFFFF";
  ctx.font = "700 44px Georgia, serif";
  ctx.fillText("Fork·Fate", W / 2, H - 150);
  ctx.fillStyle = "#8A8F95";
  ctx.font = "400 34px Arial, sans-serif";
  ctx.fillText("Shuffle your own fate at fork-fate.com", W / 2, H - 95);

  return new Promise((resolve) => canvas.toBlob(resolve, "image/png"));
}


function RevealStage({ spinning, flash, deck, result, groupPicks, mode, onReset, onReSpin, onReport, onPick, isFavorite, onToggleFavorite }) {
  if (!result && groupPicks && groupPicks.length > 0) {
    return <GroupVote picks={groupPicks} onReSpin={onReSpin} onWinner={onPick} />;
  }
  if (!result) {
    return (
      <div className="grid h-full min-h-[400px] place-items-center text-center">
        <div className="space-y-3">
          <span className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-[#0E0E0E] text-[#E01E26]">
            <Dices className="h-7 w-7" />
          </span>
          <p className="font-serif text-2xl text-[#0E0E0E]">Your table awaits</p>
          <p className="mx-auto max-w-xs font-sans text-sm text-[#6B7075]">
            {mode === "food"
              ? "Set your filters and hit Deal — fate decides where you're eating."
              : mode === "drinks"
              ? "Set your filters and hit Deal — fate decides what you're sipping."
              : mode === "bars"
              ? "Set your filters and hit Deal — fate decides where you're drinking."
              : "Set your filters and hit Deal — fate decides your sweet treat."}
          </p>
        </div>
      </div>
    );
  }

  const card = result;
  const alternatives = deck.filter((d) => d.id !== card.id).slice(0, 3);
  const shareFate = async () => {
    const text = `Fate picked ${card.name} (${card.cuisine} · ${card.price})${card.distance ? ` — ${card.distance} mi away` : ""}. Shuffle your own fate on Fork·Fate!`;
    const url = window.location.origin;
    try {
      if (navigator.share) {
        await navigator.share({ title: "Fork·Fate", text, url });
      } else {
        await navigator.clipboard.writeText(`${text} ${url}`);
        toast.success("Copied to clipboard — share your fate!");
      }
    } catch (e) {
      // Share sheet cancelled or unavailable — non-critical
      console.debug("Share dismissed:", e);
    }
  };
  const shareFateImage = async () => {
    try {
      const blob = await buildFateCard(card);
      if (!blob) throw new Error("no blob");
      const file = new File([blob], `forkfate-${(card.name || "pick").replace(/[^a-z0-9]+/gi, "-").toLowerCase()}.png`, { type: "image/png" });
      const text = `Fate picked ${card.name}! Shuffle your own on Fork·Fate.`;
      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({ files: [file], title: "Fork·Fate", text });
      } else {
        const link = document.createElement("a");
        link.href = URL.createObjectURL(blob);
        link.download = file.name;
        link.click();
        URL.revokeObjectURL(link.href);
        toast.success("Fate card saved — share it anywhere!");
      }
    } catch (e) {
      console.debug("Image share dismissed:", e);
    }
  };
  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={`res-${card.id}`}
        initial={{ opacity: 0, scale: 0.96, rotate: -2 }}
        animate={{ opacity: 1, scale: 1, rotate: 0 }}
        exit={{ opacity: 0, scale: 0.98 }}
        transition={RESULT_SPRING}
        className="overflow-hidden rounded-2xl"
        data-testid="spin-result-card"
      >
        <div className="relative h-64 overflow-hidden rounded-2xl">
          <a
            href={card.google_url}
            target="_blank"
            rel="noopener noreferrer"
            data-testid="result-photo-link"
            title={`View ${card.name} on Google`}
            className="block h-full w-full"
          >
            <img src={card.image} alt={card.name} className="h-full w-full object-cover transition-transform duration-500 hover:scale-105" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
          </a>
          {onToggleFavorite && (
            <button
              onClick={(e) => { e.stopPropagation(); e.preventDefault(); onToggleFavorite(card); }}
              data-testid="result-favorite-toggle"
              title={isFavorite?.(card) ? "Remove from favorites" : "Save to favorites"}
              aria-pressed={isFavorite?.(card)}
              className="absolute right-3 top-3 grid h-11 w-11 place-items-center rounded-full bg-white/90 backdrop-blur transition-transform hover:scale-110 active:scale-95"
            >
              <Heart className={`h-5 w-5 transition-colors ${isFavorite?.(card) ? "fill-[#E01E26] text-[#E01E26]" : "text-[#6B7075]"}`} />
            </button>
          )}
          <div className="pointer-events-none absolute bottom-4 left-4 right-4">
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-full bg-white/90 px-3 py-1 text-xs font-bold text-[#0E0E0E]">
                {card.cuisine} · {card.price}
              </span>
              {card.sponsored && (
                <span className="rounded-full bg-[#E01E26] px-3 py-1 text-xs font-bold text-white">
                  Sponsored
                </span>
              )}
            </div>
            <h3 className="mt-2 font-serif text-4xl font-medium leading-none text-white drop-shadow">
              {card.name}
            </h3>
          </div>
        </div>

        {result && (
          <motion.div
            initial={DETAIL_INITIAL}
            animate={DETAIL_ANIMATE}
            transition={DETAIL_TRANSITION}
            className="space-y-4 p-5"
          >
            <p className="flex items-center gap-2 font-serif text-xl font-bold italic text-[#E01E26]" data-testid="reaper-line">
              <Skull className="h-4 w-4" /> {reaperLineFor(card)}
            </p>
            {!card.open_now && (
              <p data-testid="closed-reroll-hint" className="rounded-xl bg-[#FCF4F4] px-3 py-2 font-sans text-xs font-bold text-[#E01E26]">
                Closed right now — shuffle again for an open spot.
              </p>
            )}
            <div className="flex items-center gap-5 text-sm text-[#0E0E0E]">
              <span className="flex items-center gap-1.5 font-semibold">
                <Star className="h-4 w-4 fill-[#E01E26] text-[#E01E26]" />
                {card.rating > 0 ? card.rating.toFixed(1) : "New"}
              </span>
              <span className="flex items-center gap-1.5 text-[#6B7075]">
                <MapPin className="h-4 w-4" /> {card.distance} mi away
              </span>
            </div>
            {card.address && (
              <p className="font-sans text-sm leading-relaxed text-[#6B7075]">
                {card.address}
              </p>
            )}
            <div className="flex flex-wrap gap-3">
              {card.doordash_url && (
                <a
                  href={card.doordash_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  data-testid="doordash-button"
                  className="inline-flex items-center gap-2 rounded-full bg-[#E01E26] px-4 py-2 text-sm font-bold text-white transition-colors hover:bg-[#B3141A]"
                >
                  <ShoppingBag className="h-4 w-4" /> Order on DoorDash
                  <ExternalLink className="h-3.5 w-3.5" />
                </a>
              )}
              {card.order_url && (
                <a
                  href={card.order_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  data-testid="order-online-button"
                  className="inline-flex items-center gap-2 rounded-full border border-[#E2E4E7] bg-white px-4 py-2 text-sm font-semibold text-[#0E0E0E] transition-colors hover:bg-[#EDEEF0]"
                >
                  <ShoppingBag className="h-4 w-4" /> Order online
                </a>
              )}
              {card.google_url && (
                <a
                  href={card.google_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  data-testid="rate-on-google-button"
                  className="inline-flex items-center gap-2 rounded-full bg-[#0E0E0E] px-4 py-2 text-sm font-bold text-white transition-colors hover:bg-[#2A2A2A]"
                >
                  <Star className="h-4 w-4 fill-[#E01E26] text-[#E01E26]" /> Reviews & ratings
                  <ExternalLink className="h-3.5 w-3.5" />
                </a>
              )}
              <button
                onClick={onReSpin}
                data-testid="respin-button"
                className="inline-flex items-center gap-2 rounded-full bg-[#E01E26] px-4 py-2 text-sm font-bold text-white transition-colors hover:bg-[#B3141A]"
              >
                <Dices className="h-4 w-4" /> Shuffle again
              </button>
              <button
                onClick={shareFate}
                data-testid="share-fate-button"
                className="inline-flex items-center gap-2 rounded-full border border-[#E2E4E7] bg-white px-4 py-2 text-sm font-semibold text-[#0E0E0E] transition-colors hover:bg-[#EDEEF0]"
              >
                <Share2 className="h-4 w-4" /> Share your fate
              </button>
              <button
                onClick={shareFateImage}
                data-testid="share-fate-image-button"
                className="inline-flex items-center gap-2 rounded-full bg-[#0E0E0E] px-4 py-2 text-sm font-bold text-white transition-colors hover:bg-[#2A2A2A]"
              >
                <ImageDown className="h-4 w-4" /> Share as image
              </button>
              <button
                onClick={onReset}
                data-testid="reset-spin-button"
                className="inline-flex items-center gap-2 rounded-full border border-[#E2E4E7] bg-white px-4 py-2 text-sm font-semibold text-[#0E0E0E] transition-colors hover:bg-[#EDEEF0]"
              >
                <RotateCcw className="h-4 w-4" /> Clear
              </button>
            </div>
            <div className="border-t border-[#E2E4E7] pt-3">
              <SocialShare card={card} />
            </div>
            <button
              onClick={() => onReport?.(card)}
              data-testid="report-closed-button"
              className="inline-flex items-center gap-1.5 pt-1 font-sans text-xs font-semibold text-[#6B7075] underline-offset-2 transition-colors hover:text-[#E01E26] hover:underline"
            >
              <Flag className="h-3.5 w-3.5" /> No longer here? Suggest removal
            </button>

            {alternatives.length > 0 && (
              <div className="border-t border-[#E2E4E7] pt-4" data-testid="alternatives-section">
                <p className="font-sans text-xs font-bold uppercase tracking-[0.2em] text-[#6B7075]">
                  3 more to consider
                </p>
                <div className="mt-3 space-y-2">
                  {alternatives.map((alt) => (
                    <button
                      key={alt.id}
                      onClick={() => onPick?.(alt)}
                      data-testid={`alternative-${alt.id}`}
                      className="group flex w-full items-center gap-3 rounded-2xl border border-[#E2E4E7] bg-white p-2 text-left transition-colors hover:border-[#E01E26] hover:bg-[#FCF4F4]"
                    >
                      <img
                        src={alt.image}
                        alt={alt.name}
                        className="h-12 w-12 shrink-0 rounded-xl object-cover"
                      />
                      <span className="min-w-0 flex-1">
                        <span className="block truncate font-serif text-base font-medium leading-tight text-[#0E0E0E]">
                          {alt.name}
                        </span>
                        <span className="mt-0.5 flex items-center gap-2 font-sans text-xs text-[#6B7075]">
                          <span>{alt.cuisine} · {alt.price}</span>
                          <span className="flex items-center gap-1">
                            <Star className="h-3 w-3 fill-[#E01E26] text-[#E01E26]" />
                            {alt.rating > 0 ? alt.rating.toFixed(1) : "New"}
                          </span>
                          <span className="flex items-center gap-1">
                            <MapPin className="h-3 w-3" /> {alt.distance} mi
                          </span>
                        </span>
                      </span>
                      <Dices className="h-4 w-4 shrink-0 text-[#B8BCC2] transition-colors group-hover:text-[#E01E26]" />
                    </button>
                  ))}
                </div>
              </div>
            )}

            {!card.sponsored && (
              <div className="border-t border-[#E2E4E7] pt-4">
                <BecomeSponsorDialog variant="card" />
              </div>
            )}
          </motion.div>
        )}
      </motion.div>
    </AnimatePresence>
  );
}
