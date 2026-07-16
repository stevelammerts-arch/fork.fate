import React, { useState, useRef, useEffect, useMemo } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { Dices, Star, MapPin, RotateCcw, Search, ExternalLink, ShoppingBag, Fuel, Coffee, IceCream, Flag, Clock, Share2, LocateFixed, MessageSquarePlus, Skull, ArrowDownWideNarrow, ImageDown, Flame, Heart, Users, Sparkles, Volume2, VolumeX, Beer, Trophy, Plus, Store, Sun, Moon, UtensilsCrossed, Leaf, Palette, ChevronDown, Check, Snowflake, Flower2, Umbrella, Zap, Cog, Wine, ArrowRight } from "lucide-react";
import Filters from "../components/Filters";
import { RestaurantCard } from "../components/RestaurantCard";
import AddRestaurantDialog from "../components/AddRestaurantDialog";
import InstallAppButton from "../components/InstallAppButton";
import BecomeSponsorDialog from "../components/BecomeSponsorDialog";
import SponsorMarquee from "../components/SponsorMarquee";
import AndroidBetaBanner from "../components/AndroidBetaBanner";
import SocialShare from "../components/SocialShare";
import QRCode from "qrcode";
import CheckInButton from "../components/CheckInButton";
import CheckUpdatesButton from "../components/CheckUpdatesButton";
import FavoritesDrawer from "../components/FavoritesDrawer";
import GroupVote from "../components/GroupVote";
import { useFavorites } from "../hooks/useFavorites";
import GuidedFlow from "../components/GuidedFlow";
import PubCrawlDialog from "../components/PubCrawlDialog";
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from "../components/ui/dropdown-menu";
import {
  readStreak, bumpStreak,
  RESULT_SPRING,
  HERO_INITIAL, HERO_ANIMATE, HERO_TRANSITION, DETAIL_INITIAL, DETAIL_ANIMATE, DETAIL_TRANSITION, SPIN_TAP,
  reaperLineFor, lightLineFor,
  FOOD_CUISINES, DRINK_CUISINES, DESSERT_CUISINES, BAR_CUISINES, SHOP_CUISINES, FUEL_CUISINES, CRAWL_TYPES, crawlLabelForType, orderCrawlRoute,
} from "./homeConstants";
import { Input } from "../components/ui/input";
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from "../components/ui/accordion";
import { Slider } from "../components/ui/slider";
import { useTheme, setTheme } from "../hooks/useTheme";
import { useLang } from "../i18n/i18n";
import { SEASONS, AMBIANCE, SeasonScene, AmbianceScene } from "../components/ThemeScenes";
import { ReaperScene } from "../components/ReaperScene";
import { ShufflingDeck } from "../components/ShufflingDeck";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;


export default function Home() {
  const { theme } = useTheme();
  const { t, lang, setLang } = useLang();
  const ambCfg = AMBIANCE[theme] || null;
  const light = !(theme === "dark" || ambCfg);
  const seasonCfg = SEASONS[theme] || null;
  const season = seasonCfg ? theme : null;
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
  const [sponsorOpen, setSponsorOpen] = useState(false);
  const [addOpen, setAddOpen] = useState(false);
  const [groupPicks, setGroupPicks] = useState(null);
  const [crawlMode, setCrawlMode] = useState(false);
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
  useEffect(() => () => { if (grooveRef.current) { try { grooveRef.current.pause(); } catch (e) { /* ignore */ } grooveRef.current = null; } }, []);
  const { favorites, isFavorite, toggleFavorite, removeFavorite } = useFavorites();
  const [showGuided, setShowGuided] = useState(true);
  const [faqOpen, setFaqOpen] = useState(false);
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
    finishGuided();
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

  const switchMode = (m) => {
    if (m === mode) return;
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

  const cuisineList = mode === "food" ? FOOD_CUISINES : mode === "drinks" ? DRINK_CUISINES : mode === "bars" ? BAR_CUISINES : mode === "desserts" ? DESSERT_CUISINES : mode === "shops" ? SHOP_CUISINES : FUEL_CUISINES;

  const runShuffle = (pool) => {
    setResult(null);
    setGroupPicks(null);
    setSpinning(true);
    setFlashHit(false);
    setRevealFlash(false);
    // Preload the reveal sound now (inside the click gesture) so it reliably plays.
    // Light mode: cheerful "Ta-Da!" chime. Dark mode: ominous thunderclap.
    // Tiki: tribal groove starts NOW during the shuffle; timpani boom lands on reveal.
    try {
      if (grooveRef.current) { try { grooveRef.current.pause(); } catch (e0) { /* ignore */ } grooveRef.current = null; }
      if (localStorage.getItem("ff_muted") !== "1") {
        const revealSrc = { cyber: "/reveal-electric.wav", tiki: "/reveal-drums-boom.wav", spring: "/reveal-koto.wav", steam: "/reveal-steam.wav", winter: "/reveal-santa.wav", fall: "/reveal-owl.wav" }[theme] || (light ? "/reveal-tada.wav" : "/reveal-thunder-v4.mp3");
        thunderRef.current = new Audio(revealSrc);
        thunderRef.current.volume = 1.0;
        thunderRef.current.load();
        // Themed ambience that starts during the shuffle. [src, volume, loop]
        const loop = { tiki: ["/reveal-drums-groove.wav", 1.0, false], cyber: ["/reveal-cyber-radio.wav", 0.8, true], summer: ["/shuffle-seagulls.wav", 0.7, true], steam: ["/shuffle-jacobs.wav", 0.85, true], spring: ["/shuffle-spring.wav", 0.8, true], winter: ["/shuffle-winter.wav", 0.8, true], fall: ["/shuffle-fall.wav", 0.8, true] }[theme];
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
    // Dark mode plays a spoken voice cue before the deck shuffles; themed shuffles stay clean.
    if (!light && theme !== "cyber" && theme !== "tiki" && theme !== "steam") playSound("/reveal-voice-v5.mp3", 1.0);
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
        // Deck lands on the winner: boom + flash the instant the card is presented
        setFlash(chosen);
        shuffleRef.current = setTimeout(() => {
          setFlashHit(true);
          // Thunder boom + 3x screen flash hit exactly as the winner is revealed
          try {
            if (grooveRef.current) { try { grooveRef.current.pause(); } catch (e2) { /* ignore */ } grooveRef.current = null; }
            if (thunderRef.current) { thunderRef.current.currentTime = 0; thunderRef.current.play().catch(() => {}); }
            else playSound(light ? "/reveal-tada.wav" : "/reveal-thunder-v4.mp3", 1.0);
          } catch (e) { /* audio unavailable */ }
          setRevealFlash(true);
          setTimeout(() => setRevealFlash(false), 1400);
          shuffleRef.current = setTimeout(() => {
            if (groupMode) setGroupPicks(picks);
            else setResult(chosen);
            setSpinning(false);
            setFlash(null);
            setFlashHit(false);
            axios.post(`${API}/stats/fate-dealt`).then(({ data }) => setFatesDealt(data.count)).catch(() => {});
            setStreak(bumpStreak());
          }, 1600);
        }, 140);
      }
    };
    // Let the voice cue lead in before the deck starts shuffling
    shuffleRef.current = setTimeout(step, 1200);
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
        setStreak(bumpStreak());
        return;
      }
      runShuffle(data.restaurants);
    } catch (e) {
      toast.error(e.response?.data?.detail || "Search failed");
    } finally {
      setLoading(false);
    }
  };

  const spin = () => { doSearch(selectedCuisines, [], mode); };

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
    setSpinning(true);
    setFlashHit(false);
    setRevealFlash(false);
    if (theme === "tiki") { grooveRef.current = playSound("/reveal-drums-groove.wav", 1.0); }
    else {
      const loopSrc = { cyber: "/reveal-cyber-radio.wav", summer: "/shuffle-seagulls.wav", steam: "/shuffle-jacobs.wav", spring: "/shuffle-spring.wav", winter: "/shuffle-winter.wav", fall: "/shuffle-fall.wav" }[theme];
      const loopVol = { cyber: 0.8, summer: 0.7, steam: 0.85, spring: 0.8, winter: 0.8, fall: 0.8 }[theme];
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
    const step = () => {
      setFlash(pool[i % pool.length]);
      i++;
      delay = delay * 1.16 + 4;
      if (delay < maxDelay) {
        shuffleRef.current = setTimeout(step, delay);
      } else {
        setFlash(winner || pool[i % pool.length]);
        setFlashHit(true);
        try {
          if (grooveRef.current) { try { grooveRef.current.pause(); } catch (e2) { /* ignore */ } grooveRef.current = null; }
          playSound(theme === "tiki" ? "/reveal-drums-boom.wav" : theme === "cyber" ? "/reveal-electric.wav" : theme === "spring" ? "/reveal-koto.wav" : theme === "steam" ? "/reveal-steam.wav" : theme === "winter" ? "/reveal-santa.wav" : theme === "fall" ? "/reveal-owl.wav" : "/reveal-thunder-v4.mp3", 1.0);
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
    shuffleRef.current = setTimeout(step, 1000);
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
        setStreak(bumpStreak());
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
    if (results.length) { runShuffle(results); }
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
    <div className="relative min-h-screen overflow-hidden bg-white" data-ff-scope="app">
      <AnimatePresence>
        {showGuided && (
          <GuidedFlow
            cuisineMap={{ food: FOOD_CUISINES, drinks: DRINK_CUISINES, bars: BAR_CUISINES, desserts: DESSERT_CUISINES, shops: SHOP_CUISINES, fuel: FUEL_CUISINES }}
            onSeal={sealFate}
            onSkip={finishGuided}
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
      {/* Seasonal themes: tree + decor + falling sprites */}
      {seasonCfg && <SeasonScene theme={theme} cfg={seasonCfg} />}
      {/* Ambiance themes: cyberpunk / steampunk / tiki lounge */}
      {ambCfg && <AmbianceScene theme={theme} cfg={ambCfg} />}
      {/* Dark-mode: decorative reaper background with load animation */}
      {theme === "dark" && <ReaperScene />}
      {/* Header */}
      <header className={`sticky top-0 z-30 border-b ${light ? "border-[#E4E4E7] bg-white/85 backdrop-blur-xl shadow-sm" : "border-[#E2E4E7] bg-[#0E0E0E]"}`}>
        <div className="mx-auto flex max-w-6xl flex-col gap-3 px-4 py-4 md:flex-row md:items-center md:justify-between md:gap-3 md:px-12 md:py-6">
          <div className="flex items-center gap-2 md:gap-3">
            <div className={`relative h-12 w-12 shrink-0 overflow-hidden rounded-full ring-1 md:h-16 md:w-16 ${light ? "bg-[#F5F0E6] ring-[#E4E4E7]" : "bg-black ring-white/25"}`}>
              <img src={theme === "cyber" ? "/cyber-neon-logo.png" : (light ? "/logo-mark-light.png" : "/logo-mark.png")} alt="Fork·Fate logo" className={`h-12 w-12 object-contain md:h-16 md:w-16 ${theme === "cyber" ? "p-0.5" : "scale-110"}`} />
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
                </DropdownMenuContent>
              </DropdownMenu>
              {themeHint && (
                <div data-testid="theme-hint" style={{ backgroundColor: ambCfg ? ambCfg.accent : seasonCfg ? seasonCfg.hint : light ? "#4F6F47" : "#E01E26" }} className="absolute left-1/2 top-full z-40 mt-2 flex -translate-x-1/2 items-center gap-2 whitespace-nowrap rounded-full px-3 py-1.5 text-xs font-bold text-white shadow-lg">
                  {t("Pick a theme")} 🍂
                  <button onClick={dismissThemeHint} aria-label="Dismiss theme hint" className="opacity-80 hover:opacity-100">✕</button>
                </div>
              )}
            </div>
            <button
              onClick={() => setShowGuided(true)}
              data-testid="relaunch-guided-button"
              title="Start the guided ritual"
              className={`inline-flex items-center gap-1.5 rounded-full border bg-transparent px-3 py-1.5 text-xs font-bold transition-colors sm:gap-2 sm:px-4 sm:py-2.5 sm:text-sm ${ghost}`}
            >
              <Sparkles className="h-4 w-4 text-[#E01E26]" /> <span>{t("Guided")}</span>
            </button>
            <Link
              to="/leaderboard"
              data-testid="header-leaderboard-link"
              title="Crawl Champions leaderboard"
              className={`inline-flex items-center gap-1.5 rounded-full border bg-transparent px-3 py-1.5 text-xs font-bold transition-colors sm:gap-2 sm:px-4 sm:py-2.5 sm:text-sm ${ghost}`}
            >
              <Trophy className="h-4 w-4 text-[#E01E26]" /> <span>{t("Champions")}</span>
            </Link>
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
            {/* Desktop: dedicated Add spot button */}
            <button
              type="button"
              onClick={() => setAddOpen(true)}
              data-testid="open-add-restaurant-button"
              className={`hidden items-center gap-2 rounded-full border px-5 py-2.5 text-sm font-semibold text-[#0E0E0E] transition-colors sm:inline-flex ${light ? "border-[#C8B79A] bg-[#D8C3A5] hover:bg-[#CBB08A]" : "border-[#E2E4E7] bg-white hover:bg-[#E2E4E7]"}`}
            >
              <Plus className="h-4 w-4" /> <span>{t("Add spot")}</span>
            </button>
            {/* Mobile: combined Add / Sponsor menu to keep the header compact */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  type="button"
                  data-testid="mobile-contribute-menu"
                  className="inline-flex items-center gap-1.5 rounded-full bg-[#E01E26] px-3 py-1.5 text-xs font-bold text-white transition-colors hover:bg-[#B3141A] sm:hidden"
                >
                  <Plus className="h-4 w-4" /> {t("Add")}
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem data-testid="mobile-add-spot-item" onClick={() => setAddOpen(true)}>
                  <Plus className="mr-2 h-4 w-4" /> {t("Add a spot")}
                </DropdownMenuItem>
                <DropdownMenuItem data-testid="mobile-sponsor-item" onClick={() => setSponsorOpen(true)}>
                  <Store className="mr-2 h-4 w-4 text-[#E01E26]" /> {t("Sponsor your spot")}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <AddRestaurantDialog
              mode={mode}
              onAdded={(r) => setResults((p) => [r, ...p])}
              open={addOpen}
              onOpenChange={setAddOpen}
              hideTrigger
            />
          </div>
        </div>
      </header>

      <div className="relative z-40">
        <AndroidBetaBanner light={light} />
        <SponsorMarquee light={light} onSponsor={() => setSponsorOpen(true)} />
      </div>

      {/* Social share bar (transparent) */}
      <div className="relative z-40 mx-auto flex max-w-6xl items-center justify-end gap-2 bg-transparent px-4 pt-2 md:px-12" data-testid="app-social-share">
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
          <p className="font-sans text-sm font-extrabold tracking-[0.25em] uppercase text-[#E01E26]">
            {mode === "food" ? t("Can't decide where to eat?") : mode === "drinks" ? t("Can't decide what to sip?") : mode === "bars" ? t("Can't decide where to drink?") : mode === "desserts" ? t("Craving something sweet?") : mode === "shops" ? t("Feeling like a treasure hunt?") : t("Need to fill up or charge?")}
          </p>
          <h1 className="mt-3 font-serif text-4xl font-medium leading-none tracking-tighter text-[#0E0E0E] sm:text-5xl lg:text-6xl" style={ambCfg ? { color: ambCfg.sky, textShadow: theme === "cyber" ? "0 0 12px rgba(199,125,255,0.6)" : undefined } : undefined}>
            {mode === "food" ? t("Let fate pick tonight's table.") : mode === "drinks" ? t("Let fate pick your next sip.") : mode === "bars" ? t("Let fate pick tonight's bar.") : mode === "desserts" ? t("Let fate pick your sweet treat.") : mode === "shops" ? t("Let fate pick your next find.") : t("Let fate pick your pit stop.")}
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
              : t("Gas or an EV charger? Set your filters and hit Deal — we'll shuffle nearby stations and pick your pit stop.")}
          </p>
        </motion.div>

        <div className="mt-10 grid gap-10 lg:grid-cols-[1fr_1.1fr] lg:items-start">
          {/* left: search + filters + spin */}
          <div className="min-w-0 space-y-7">
            <div className="space-y-2">
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
                  max={50}
                  step={1}
                  onValueChange={(v) => setRadius(v[0])}
                  aria-label="Search radius in miles"
                />
                <div className="mt-1.5 flex justify-between font-sans text-[10px] font-bold uppercase tracking-wider text-[#B8BCC2]">
                  <span>0 mi</span>
                  <span>50 mi</span>
                </div>
              </div>
            </div>

            <div className="inline-flex flex-wrap justify-center rounded-full border border-[#E2E4E7] bg-[#EDEEF0] p-1" data-testid="mode-toggle">
              <button
                data-testid="mode-food"
                onClick={() => switchMode("food")}
                className={`flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-bold transition-colors ${mode === "food" ? "bg-[#0E0E0E] text-white" : "text-[#6B7075] hover:text-[#0E0E0E]"}`}
              >
                <UtensilsCrossed className="h-4 w-4" />
                {t("Food")}
              </button>
              <button
                data-testid="mode-drinks"
                onClick={() => switchMode("drinks")}
                className={`flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-bold transition-colors ${mode === "drinks" ? "bg-[#0E0E0E] text-white" : "text-[#6B7075] hover:text-[#0E0E0E]"}`}
              >
                <Coffee className="h-4 w-4" />
                {t("Drinks")}
              </button>
              <button
                data-testid="mode-bars"
                onClick={() => switchMode("bars")}
                className={`flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-bold transition-colors ${mode === "bars" ? "bg-[#0E0E0E] text-white" : "text-[#6B7075] hover:text-[#0E0E0E]"}`}
              >
                <Beer className="h-4 w-4" />
                {t("Bars")}
              </button>
              <button
                data-testid="mode-desserts"
                onClick={() => switchMode("desserts")}
                className={`flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-bold transition-colors ${mode === "desserts" ? "bg-[#0E0E0E] text-white" : "text-[#6B7075] hover:text-[#0E0E0E]"}`}
              >
                <IceCream className="h-4 w-4" />
                {t("Desserts")}
              </button>
              <button
                data-testid="mode-shops"
                onClick={() => switchMode("shops")}
                className={`flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-bold transition-colors ${mode === "shops" ? "bg-[#0E0E0E] text-white" : "text-[#6B7075] hover:text-[#0E0E0E]"}`}
              >
                <ShoppingBag className="h-4 w-4" />
                {t("Shops")}
              </button>
              <button
                data-testid="mode-fuel"
                onClick={() => switchMode("fuel")}
                className={`flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-bold transition-colors ${mode === "fuel" ? "bg-[#0E0E0E] text-white" : "text-[#6B7075] hover:text-[#0E0E0E]"}`}
              >
                <Fuel className="h-4 w-4" />
                {t("Fuel")}
              </button>
            </div>

            <Filters
              cuisines={cuisineList}
              cuisineLabel={mode === "food" ? t("Cuisine") : mode === "drinks" ? t("Drink type") : mode === "bars" ? t("Bar type") : mode === "desserts" ? t("Dessert type") : mode === "shops" ? t("Shop type") : t("Fuel type")}
              selectedCuisines={selectedCuisines}
              toggleCuisine={(c) => toggle(setSelectedCuisines, selectedCuisines, c)}
              labelColor={labelColor}
            />

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

            {!crawlMode && (
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
                  {loading ? t("Finding spots…") : spinning ? t("Shuffling…") : groupMode ? (light ? t("Pick 3 Spots") : t("Deal 3 Fates!")) : (light ? t("Shuffle the Deck") : t("Deal Your Fate!"))}
                </motion.button>
                {results.length > 0 && (
                  <span className="font-sans text-sm text-[#6B7075]">
                    {results.length} {results.length !== 1 ? t("spots nearby") : t("spot nearby")}
                  </span>
                )}
              </div>
            )}

            <div className="flex flex-wrap items-center gap-3">
              <button
                type="button"
                data-testid="group-mode-toggle"
                onClick={() => { setGroupMode((v) => { const n = !v; if (n) setCrawlMode(false); return n; }); setResult(null); setGroupPicks(null); }}
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
                onClick={() => { setCrawlMode((v) => { const n = !v; if (n) setGroupMode(false); return n; }); if (!crawlMode) applyCrawlType(CRAWL_TYPES[0]); setResult(null); setGroupPicks(null); }}
                className={`inline-flex items-center gap-2.5 rounded-full border-2 px-4 py-2.5 text-sm font-bold transition-colors ${crawlMode ? "border-[#E01E26] bg-[#E01E26] text-white" : "border-[#E01E26] bg-white text-[#E01E26] hover:bg-[#FCECEC]"}`}
              >
                <Beer className="h-4 w-4" />
                {t("Pub Crawls & more")}
                <span className={`ml-1 h-4 w-7 rounded-full p-0.5 transition-colors ${crawlMode ? "bg-white/40" : "bg-[#D5D8DC]"}`}>
                  <span className={`block h-3 w-3 rounded-full bg-white transition-transform ${crawlMode ? "translate-x-3" : ""}`} />
                </span>
              </button>
            </div>

            {crawlMode && (
              <div className="mt-2 w-full basis-full rounded-2xl border border-[#E01E26]/30 bg-[#FDF6F6] p-4" data-testid="crawl-type-picker">
                <p className="mb-1.5 text-xs font-bold uppercase tracking-wider text-[#6B7075]">{t("Pick your crawl")}</p>
                <div className="flex flex-wrap gap-2">
                  {CRAWL_TYPES.map((t) => (
                    <button
                      key={t.key}
                      type="button"
                      data-testid={`crawl-type-${t.key}`}
                      onClick={() => applyCrawlType(t)}
                      className={`rounded-full border px-4 py-2 text-sm font-bold transition-colors ${crawlType === t.key ? "border-[#E01E26] bg-[#E01E26] text-white" : "border-[#E2E4E7] bg-white text-[#6B7075] hover:bg-[#EDEEF0]"}`}
                    >
                      {t.label}
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
              <RevealStage spinning={spinning} flash={flash} deck={results} result={result} groupPicks={groupPicks} mode={mode} light={light} theme={theme} onReset={() => { setResult(null); setGroupPicks(null); }} onReSpin={reSpin} onReport={reportClosed} onPick={setResult} isFavorite={isFavorite} onToggleFavorite={toggleFavorite} />
            </div>
          </div>
        </div>
      </section>

      {/* Nearby results */}
      {results.length > 0 && (
        <section className="relative z-10 mx-auto max-w-6xl px-6 pb-24 pt-8 md:px-12">
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
              <RestaurantCard key={r.id} r={r} onReport={reportClosed} isFavorite={isFavorite(r)} onToggleFavorite={toggleFavorite} />
            ))}
          </div>
        </section>
      )}

      {/* How it works + FAQ (SEO + first-time visitor context) */}
      <section className="relative z-10 mx-auto max-w-6xl px-6 pb-24 pt-4 md:px-12" data-testid="how-it-works-section">
        <div className="border-t border-[#E2E4E7] pt-14">
          <div className="rounded-3xl border border-[#E2E4E7] bg-white/95 p-8 shadow-sm backdrop-blur-sm md:p-10">
            <p className="font-sans text-xs font-bold uppercase tracking-[0.25em] text-[#E01E26]">{t("How it works")}</p>
            <h2 className="mt-2 font-serif text-3xl font-medium tracking-tight text-[#0E0E0E] sm:text-4xl">
              {t("Let fate settle the \"where should we eat?\" debate.")}
            </h2>
            <p className="mt-3 max-w-2xl font-sans text-base text-[#6B7075]">
              {t("Fork·Fate is a restaurant roulette for anyone who's ever stared blankly at a food app, unable to decide. Set a couple of filters, shuffle the deck, and land on a real local place to eat, drink, or grab dessert — no endless scrolling, no group-chat deadlock.")}
            </p>
          </div>

          <div className="mt-10 grid grid-cols-1 gap-6 md:grid-cols-3">
            <div className="rounded-3xl border border-[#E2E4E7] bg-white p-6" data-testid="step-1">
              <div className="flex h-11 w-11 items-center justify-center rounded-full bg-[#0E0E0E]">
                <Search className="h-5 w-5 text-white" />
              </div>
              <h3 className="mt-4 font-serif text-xl text-[#0E0E0E]">{t("1. Pick your craving")}</h3>
              <p className="mt-2 font-sans text-sm text-[#6B7075]">
                {t("Choose Food, Drinks, Bars, or Desserts, then narrow it down with cuisine chips and toggles like \"Open now\" and \"Gluten free\" to match the mood.")}
              </p>
            </div>
            <div className="rounded-3xl border border-[#E2E4E7] bg-white p-6" data-testid="step-2">
              <div className="flex h-11 w-11 items-center justify-center rounded-full bg-[#0E0E0E]">
                <MapPin className="h-5 w-5 text-white" />
              </div>
              <h3 className="mt-4 font-serif text-xl text-[#0E0E0E]">{t("2. Set your location")}</h3>
              <p className="mt-2 font-sans text-sm text-[#6B7075]">
                {t("Enter a ZIP code or tap \"Use my location\" and Fork·Fate pulls real, nearby restaurants within 50 miles using live Google data.")}
              </p>
            </div>
            <div className="rounded-3xl border border-[#E2E4E7] bg-white p-6" data-testid="step-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-full bg-[#E01E26]">
                <Dices className="h-5 w-5 text-white" />
              </div>
              <h3 className="mt-4 font-serif text-xl text-[#0E0E0E]">{t("3. Deal your fate")}</h3>
              <p className="mt-2 font-sans text-sm text-[#6B7075]">
                {t("Hit the button and watch the deck shuffle to reveal tonight's pick — with directions, reviews, delivery links, and a few more spots to consider if you want a re-roll.")}
              </p>
            </div>
          </div>

          <div className="mt-16 rounded-3xl border border-[#E2E4E7] bg-white/95 p-6 shadow-sm backdrop-blur-sm md:p-8">
          <button
            onClick={() => setFaqOpen((o) => !o)}
            data-testid="faq-toggle"
            aria-expanded={faqOpen}
            className="flex w-full items-center justify-between gap-3 text-left"
          >
            <h2 className="font-serif text-2xl font-medium tracking-tight text-[#0E0E0E] sm:text-3xl">
              {t("Frequently asked questions")}
            </h2>
            <span className="flex shrink-0 items-center gap-1 font-sans text-sm font-bold text-[#E01E26]">
              {faqOpen ? t("Less") : t("More")}
              <ChevronDown className={`h-5 w-5 transition-transform duration-300 ${faqOpen ? "rotate-180" : ""}`} />
            </span>
          </button>
          {faqOpen && (
          <Accordion type="single" collapsible className="mt-4 w-full animate-in fade-in slide-in-from-top-2 duration-300" data-testid="faq-section">
            {[
              { q: t("How does Fork·Fate pick a restaurant?"), a: t("After you set your filters, Fork·Fate gathers matching local spots and randomly deals one from the deck. Every deal is a fresh shuffle, so you'll discover places you might never have chosen yourself.") },
              { q: t("Is Fork·Fate free to use?"), a: t("Yes — Fork·Fate is completely free. There's no account, no signup, and no paywall. Just open it, shuffle, and go eat.") },
              { q: t("Do I need to create an account?"), a: t("No login required. You can start spinning the moment the page loads, on your phone or desktop.") },
              { q: t("How do you find nearby places?"), a: t("Fork·Fate uses live Google Places data based on your ZIP code or device location, so results reflect real, currently-listed restaurants, bars, and dessert shops around you.") },
              { q: t("Can I add my favorite local spot?"), a: t("Absolutely. Tap \"Add spot\" to submit a place you love. Community submissions are quickly reviewed before they join the roulette pool.") },
              { q: t("Can I install Fork·Fate as an app?"), a: t("Yes — tap \"Download app\" to install Fork·Fate as a PWA on your home screen for one-tap access whenever hunger strikes.") },
            ].map((item, i) => (
              <AccordionItem key={item.q} value={`faq-${i}`} className="border-[#E2E4E7]" data-testid={`faq-item-${i}`}>
                <AccordionTrigger className="text-left font-serif text-base text-[#0E0E0E] hover:no-underline">
                  {item.q}
                </AccordionTrigger>
                <AccordionContent className="font-sans text-sm text-[#6B7075]">
                  {item.a}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
          )}
          </div>
        </div>
      </section>

      {/* Feature your business (sponsorship visibility band) */}
      <section
        className={`relative z-10 border-t ${light ? "border-[#E7DCC7]" : "border-[#E2E4E7]"}`}
        data-testid="feature-business-band"
      >
        <div className="mx-auto max-w-6xl px-6 py-14 md:px-12">
          <div
            className={`relative overflow-hidden rounded-3xl border p-8 md:p-12 ${light ? "border-[#E0D5C0] bg-[#2A2118]" : "border-[#E01E26]/40 bg-[#141414]"}`}
          >
            <div className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full bg-[#E01E26]/20 blur-3xl" />
            <div className="relative flex flex-col items-start gap-6 md:flex-row md:items-center md:justify-between">
              <div className="max-w-xl">
                <span className="inline-flex items-center gap-2 rounded-full bg-[#E01E26]/15 px-3 py-1 font-sans text-xs font-bold uppercase tracking-[0.18em] text-[#E01E26]">
                  <Store className="h-3.5 w-3.5" /> {t("For local businesses")}
                </span>
                <h2 className="mt-3 font-serif text-3xl font-semibold text-white md:text-4xl">
                  {t("Own the top spot when fate is decided")}
                </h2>
                <p className="mt-3 font-sans text-sm text-[#C7CBD1] md:text-base">
                  {t("Sponsored spots appear first when locals shuffle for a place to eat, drink or treat themselves. Fixed monthly price, no bidding, cancel anytime.")}
                </p>
                <div className="mt-5 flex flex-wrap items-center gap-x-6 gap-y-2 font-sans text-sm text-white">
                  <span className="flex items-baseline gap-1.5"><span className="font-serif text-2xl font-bold">$29</span><span className="text-[#9A9FA5]">/{t("mo")}</span></span>
                  <span className="text-[#6B7075]">{t("or")}</span>
                  <span className="flex items-baseline gap-1.5"><span className="font-serif text-2xl font-bold">$290</span><span className="text-[#9A9FA5]">/{t("yr")}</span> <span className="rounded-full bg-[#E01E26] px-2 py-0.5 text-[10px] font-bold">{t("Save $58/yr")}</span></span>
                </div>
              </div>
              <button
                onClick={() => setSponsorOpen(true)}
                data-testid="feature-business-cta"
                className="inline-flex shrink-0 items-center gap-2 rounded-full bg-[#E01E26] px-6 py-3.5 font-sans text-sm font-bold text-white shadow-lg shadow-[#E01E26]/30 transition-colors hover:bg-[#B3141A]"
              >
                {t("Feature your business")} <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className={`relative z-10 border-t ${light ? "border-[#E7DCC7] bg-[#EFE7D8]" : "border-[#E2E4E7] bg-[#0F0F0F]"}`}>
        <div className="mx-auto max-w-6xl px-6 pt-8 md:px-12">
          <div className={`flex items-start gap-3 rounded-xl border p-4 ${light ? "border-[#E0D5C0] bg-white/60" : "border-white/10 bg-white/[0.03]"}`} data-testid="reaper-disclaimer">
            {light
              ? <UtensilsCrossed className="mt-0.5 h-5 w-5 shrink-0 text-[#E01E26]" />
              : <Skull className="mt-0.5 h-5 w-5 shrink-0 text-[#E01E26]" />}
            <p className={`font-sans text-xs leading-relaxed ${light ? "text-[#6E6355]" : "text-[#8A8F95]"}`}>
              <span className={`font-bold ${light ? "text-[#2A2118]" : "text-white"}`}>{light ? t("A word from management:") : t("A word from the Reaper:")}</span> {t("This page offers suggestions only and is not liable for any trouble you encounter in or with an establishment. Our algorithm merely queries the choices — the decision to visit any suggested establishment is yours alone.")}
              <span className={`mt-1 block italic ${light ? "text-[#8A7C68]" : "text-[#B9BEC4]"}`}>{light ? t("— The Fork·Fate team") : t("— The Reaper ☠️")}</span>
            </p>
          </div>
        </div>
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-6 pb-28 pt-8 md:flex-row md:px-12 md:pb-20">
          <div className="flex items-center gap-2.5">
            <span className={`relative block h-8 w-8 overflow-hidden rounded-full ${light ? "bg-[#F5F0E6]" : "bg-black"}`}>
              <img src={light ? "/logo-mark-light.png" : "/logo-mark.png"} alt="" className="h-8 w-8 scale-110 object-contain" />
            </span>
            <span className={`font-serif text-lg font-semibold ${light ? "text-[#2A2118]" : "text-white"}`}>Fork·Fate</span>
          </div>
          <div className="order-3 flex flex-col items-center gap-1.5 md:order-2">
            <p className={`font-sans text-xs ${light ? "text-[#6E6355]" : "text-[#8A8F95]"}`}>
              © {new Date().getFullYear()} {t("Fork·Fate — let fate decide. All rights reserved.")}
            </p>
            <div className="flex items-center gap-3">
              <a
                href="/terms"
                data-testid="terms-link"
                className={`font-sans text-[11px] font-semibold underline-offset-4 transition-colors hover:underline ${light ? "text-[#6E6355] hover:text-[#2A2118]" : "text-[#8A8F95] hover:text-white"}`}
              >
                Terms of Service
              </a>
              <span className={light ? "text-[#C8B79A]" : "text-[#3A3A3A]"}>·</span>
              <a
                href="/privacy"
                data-testid="privacy-link"
                className={`font-sans text-[11px] font-semibold underline-offset-4 transition-colors hover:underline ${light ? "text-[#6E6355] hover:text-[#2A2118]" : "text-[#8A8F95] hover:text-white"}`}
              >
                Privacy Policy
              </a>
            </div>
            <a
              href="mailto:stevelammerts@gmail.com?subject=Fork%C2%B7Fate%20App%20Improvement%20Idea&body=Hi%2C%20here%27s%20an%20idea%20to%20improve%20Fork%C2%B7Fate%3A%0A%0A"
              data-testid="feedback-link"
              className={`inline-flex items-center gap-1.5 font-sans text-xs font-bold underline-offset-4 transition-colors hover:underline ${light ? "text-[#2A2118] hover:text-[#4F6F47]" : "text-white hover:text-[#E01E26]"}`}
            >
              <MessageSquarePlus className="h-3.5 w-3.5" /> Suggest an improvement
            </a>
            <CheckUpdatesButton />
            <a
              href="/admin"
              data-testid="admin-link"
              className={`mt-1 font-sans text-[11px] font-semibold underline-offset-4 transition-colors hover:underline ${light ? "text-[#8A7C68] hover:text-[#2A2118]" : "text-[#6B7075] hover:text-white"}`}
            >
              Admin
            </a>
          </div>
          <div className="order-2 flex flex-col items-center gap-2 md:order-3 md:items-end" data-testid="sponsorship-cta">
            <BecomeSponsorDialog />
            <p className={`font-sans text-xs font-bold ${light ? "text-[#4F6F47]" : "text-[#E01E26]"}`}>
              $29/month — <span className={light ? "text-[#2A2118]" : "text-white"}>first month FREE</span>
            </p>
          </div>
        </div>
      </footer>
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

// Per-theme styling for the shareable Fate Card (art, colors, headline).
const FATE_CARD = {
  dark:   { hand: true },
  light:  { lightBg: true,  bg1: "#F7F1E6", bg2: "#E9DAC1", accent: "#4F6F47", art: "/logo-mark-light.png", artSize: 190, kicker: "FATE HAS DEALT YOUR TABLE" },
  fall:   { lightBg: true,  bg1: "#F6E9D4", bg2: "#E7C79B", accent: "#C0451B", art: "/leaf-orange.png",     artSize: 170, kicker: "FATE FALLS TO", scatter: ["/leaf-red.png", "/leaf-yellow.png", "/leaf-brown.png"] },
  winter: { lightBg: true,  bg1: "#EAF3FA", bg2: "#C6DCEE", accent: "#2E77A6", art: "/flake-white.png",     artSize: 160, kicker: "FATE IS SEALED IN FROST", scatter: ["/flake-blue.png", "/flake-silver.png", "/flake-white.png"] },
  spring: { lightBg: true,  bg1: "#F6FBEF", bg2: "#F3D9E7", accent: "#D46A9F", art: "/blossom-pink.png",    artSize: 165, kicker: "FATE BLOOMS AT", scatter: ["/blossom-white.png", "/petal-coral.png", "/blossom-pink.png"] },
  summer: { lightBg: true,  bg1: "#BFE8F7", bg2: "#EAD199", accent: "#E07E17", art: "/summer-sun.png",      artSize: 195, kicker: "FATE UNDER THE SUN" },
  cyber:  { lightBg: false, bg1: "#070A16", bg2: "#160A28", accent: "#22E0E0", art: "/cyber-neon-logo.png", artSize: 300, kicker: "FATE.EXE // EXECUTED", glow2: "#C77DFF" },
  steam:  { lightBg: false, bg1: "#1B120A", bg2: "#0F0A06", accent: "#D9A44E", art: "/steam-gears.png",     artSize: 260, kicker: "THE MACHINE DECREES" },
  tiki:   { lightBg: false, bg1: "#2A140A", bg2: "#150B06", accent: "#F0A24E", art: "/tiki-mask.png",       artSize: 240, kicker: "THE TIKI GODS CHOOSE" },
};

function hexA(hex, a) {
  const h = hex.replace("#", "");
  const r = parseInt(h.slice(0, 2), 16), g = parseInt(h.slice(2, 4), 16), b = parseInt(h.slice(4, 6), 16);
  return `rgba(${r},${g},${b},${a})`;
}

async function buildFateCard(card, theme) {
  const cfg = FATE_CARD[theme] || FATE_CARD.dark;
  if (cfg.hand) return buildReaperCard(card);
  return buildThemedCard(card, cfg);
}

async function buildThemedCard(card, cfg) {
  const W = 1080, H = 1080;
  const canvas = document.createElement("canvas");
  canvas.width = W; canvas.height = H;
  const ctx = canvas.getContext("2d");
  const cx = W / 2;
  const lightBg = !!cfg.lightBg;
  const textMain = lightBg ? "#241C12" : "#FFFFFF";
  const textMuted = lightBg ? "#6B5C48" : "#C9CDD3";

  // Background gradient
  const bg = ctx.createLinearGradient(0, 0, 0, H);
  bg.addColorStop(0, cfg.bg1); bg.addColorStop(1, cfg.bg2);
  ctx.fillStyle = bg; ctx.fillRect(0, 0, W, H);
  // Accent glow (top)
  const glow = ctx.createRadialGradient(cx, 360, 30, cx, 360, 660);
  glow.addColorStop(0, hexA(cfg.accent, lightBg ? 0.22 : 0.34));
  glow.addColorStop(1, hexA(cfg.glow2 || cfg.accent, 0));
  ctx.fillStyle = glow; ctx.fillRect(0, 0, W, H);

  ctx.textAlign = "center";

  // Scattered motif accents (seasonal)
  if (cfg.scatter && cfg.scatter.length) {
    const spots = [[120, 250, 70], [960, 300, 58], [180, 760, 64], [930, 720, 74], [90, 470, 50]];
    for (let i = 0; i < spots.length; i++) {
      try {
        const im = await loadImage(cfg.scatter[i % cfg.scatter.length]);
        const [sx, sy, ss] = spots[i];
        ctx.save(); ctx.globalAlpha = 0.5; ctx.drawImage(im, sx - ss / 2, sy - ss / 2, ss, ss); ctx.restore();
      } catch (e) { /* skip */ }
    }
  }

  // Hero emblem (theme signature art)
  try {
    const art = await loadImage(cfg.art);
    const s = cfg.artSize || 200;
    const ratio = art.height ? art.width / art.height : 1;
    const aw = ratio >= 1 ? s : s * ratio;
    const ah = ratio >= 1 ? s / ratio : s;
    ctx.save();
    ctx.globalAlpha = 0.96;
    ctx.drawImage(art, cx - aw / 2, 120, aw, ah);
    ctx.restore();
  } catch (e) { console.debug("themed art skipped", e); }

  // Text panel
  const pX = 130, pW = W - 260, pY = 372, pH = 392, pr = 26;
  ctx.save();
  ctx.beginPath();
  ctx.moveTo(pX + pr, pY);
  ctx.arcTo(pX + pW, pY, pX + pW, pY + pH, pr);
  ctx.arcTo(pX + pW, pY + pH, pX, pY + pH, pr);
  ctx.arcTo(pX, pY + pH, pX, pY, pr);
  ctx.arcTo(pX, pY, pX + pW, pY, pr);
  ctx.closePath();
  ctx.fillStyle = lightBg ? "rgba(255,255,255,0.82)" : "rgba(6,6,10,0.62)";
  ctx.fill();
  ctx.strokeStyle = hexA(cfg.accent, 0.85); ctx.lineWidth = 3; ctx.stroke();
  ctx.restore();

  // Kicker
  ctx.fillStyle = cfg.accent;
  ctx.font = "700 26px Georgia, serif";
  ctx.fillText((cfg.kicker || "FATE HAS SPOKEN").toUpperCase(), cx, pY + 66);

  // Restaurant name (wrapped)
  ctx.fillStyle = textMain;
  ctx.font = "700 60px Georgia, serif";
  const lines = wrapLines(ctx, card.name || "Your pick", pW - 120);
  let ny = pY + 150;
  for (const ln of lines) { ctx.fillText(ln, cx, ny); ny += 68; }

  // Divider
  ctx.strokeStyle = hexA(cfg.accent, 0.85); ctx.lineWidth = 3;
  ctx.beginPath(); ctx.moveTo(cx - 60, ny + 2); ctx.lineTo(cx + 60, ny + 2); ctx.stroke();

  // Meta
  ctx.fillStyle = textMuted;
  ctx.font = "400 30px Arial, sans-serif";
  const metaTop = [card.cuisine, card.price].filter(Boolean).join("   ·   ");
  const metaBot = [card.rating ? `★ ${Number(card.rating).toFixed(1)}` : null, card.distance ? `${card.distance} mi` : null].filter(Boolean).join("   ·   ");
  if (metaTop) ctx.fillText(metaTop, cx, ny + 52);
  if (metaBot) ctx.fillText(metaBot, cx, ny + 96);

  // Bottom scrim for footer legibility
  const scrim = ctx.createLinearGradient(0, H - 230, 0, H);
  const scrimC = lightBg ? "255,255,255" : "6,6,10";
  scrim.addColorStop(0, `rgba(${scrimC},0)`);
  scrim.addColorStop(1, `rgba(${scrimC},0.96)`);
  ctx.fillStyle = scrim; ctx.fillRect(0, H - 230, W, 230);

  // QR (bottom-right)
  const shareUrl = (typeof window !== "undefined" && window.location?.origin && !window.location.origin.includes("localhost"))
    ? window.location.origin
    : "https://fork-fate.com";
  try {
    const qrDataUrl = await QRCode.toDataURL(shareUrl, { margin: 1, width: 300, color: { dark: "#0B0B0B", light: "#FFFFFF" } });
    const qr = await loadImage(qrDataUrl);
    const qs = 150, pad = 14, boxS = qs + pad * 2;
    const qx = W - 56 - boxS, qy = H - 44 - boxS, rr = 16;
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(qx + rr, qy);
    ctx.arcTo(qx + boxS, qy, qx + boxS, qy + boxS, rr);
    ctx.arcTo(qx + boxS, qy + boxS, qx, qy + boxS, rr);
    ctx.arcTo(qx, qy + boxS, qx, qy, rr);
    ctx.arcTo(qx, qy, qx + boxS, qy, rr);
    ctx.closePath();
    ctx.fillStyle = "#FFFFFF"; ctx.fill();
    ctx.strokeStyle = hexA(cfg.accent, 0.9); ctx.lineWidth = 3; ctx.stroke();
    ctx.drawImage(qr, qx + pad, qy + pad, qs, qs);
    ctx.restore();
  } catch (e) { console.debug("qr draw skipped", e); }

  // Footer CTA
  ctx.textAlign = "left";
  ctx.fillStyle = textMain;
  ctx.font = "700 46px Georgia, serif";
  ctx.fillText("Fork·Fate", 64, H - 114);
  ctx.fillStyle = textMuted;
  ctx.font = "400 28px Arial, sans-serif";
  ctx.fillText("Scan the code to", 64, H - 70);
  ctx.fillText("shuffle your own fate", 64, H - 34);
  ctx.textAlign = "center";

  return new Promise((resolve) => canvas.toBlob(resolve, "image/png"));
}


async function buildReaperCard(card) {
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
  const cx = W / 2;

  // Logo badge (top)
  try {
    const logo = await loadImage("/logo-mark.png");
    const s = 120, lx = cx - s / 2, ly = 64, lcy = ly + s / 2;
    ctx.save();
    ctx.beginPath(); ctx.arc(cx, lcy, s / 2, 0, Math.PI * 2); ctx.clip();
    ctx.drawImage(logo, lx, ly, s, s);
    ctx.restore();
    ctx.strokeStyle = "rgba(255,255,255,0.35)"; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.arc(cx, lcy, s / 2, 0, Math.PI * 2); ctx.stroke();
  } catch (e) { console.debug("logo draw skipped", e); }

  // Held card (geometry matches the skeleton-hand cutout)
  const cardX = 392, cardY = 300, cardW = 296, cardH = 504, r = 14;
  ctx.save();
  ctx.beginPath();
  ctx.moveTo(cardX + r, cardY);
  ctx.arcTo(cardX + cardW, cardY, cardX + cardW, cardY + cardH, r);
  ctx.arcTo(cardX + cardW, cardY + cardH, cardX, cardY + cardH, r);
  ctx.arcTo(cardX, cardY + cardH, cardX, cardY, r);
  ctx.arcTo(cardX, cardY, cardX + cardW, cardY, r);
  ctx.closePath();
  const cardGrad = ctx.createLinearGradient(0, cardY, 0, cardY + cardH);
  cardGrad.addColorStop(0, "#161616");
  cardGrad.addColorStop(1, "#0C0C0C");
  ctx.fillStyle = cardGrad; ctx.fill();
  const innerGlow = ctx.createRadialGradient(cx, cardY + cardH / 2, 20, cx, cardY + cardH / 2, cardH / 1.4);
  innerGlow.addColorStop(0, "rgba(224,30,38,0.20)");
  innerGlow.addColorStop(1, "rgba(224,30,38,0)");
  ctx.fillStyle = innerGlow; ctx.fill();
  ctx.strokeStyle = "rgba(224,30,38,0.55)"; ctx.lineWidth = 2; ctx.stroke();
  ctx.restore();

  // Kicker
  ctx.fillStyle = "#E01E26";
  ctx.font = "700 20px Georgia, serif";
  ctx.fillText("THE REAPER HAS SPOKEN", cx, cardY + 58);

  // Restaurant name (wrapped inside card)
  ctx.fillStyle = "#FFFFFF";
  ctx.font = "700 46px Georgia, serif";
  const lines = wrapLines(ctx, card.name || "Your pick", cardW - 44);
  let ny = cardY + 152;
  for (const ln of lines) { ctx.fillText(ln, cx, ny); ny += 54; }

  // Divider
  ctx.strokeStyle = "rgba(224,30,38,0.8)"; ctx.lineWidth = 3;
  ctx.beginPath(); ctx.moveTo(cx - 50, ny + 4); ctx.lineTo(cx + 50, ny + 4); ctx.stroke();

  // Meta (stacked to fit the narrow card)
  ctx.fillStyle = "#B9BEC4";
  ctx.font = "400 26px Arial, sans-serif";
  const metaTop = [card.cuisine, card.price].filter(Boolean).join("   ·   ");
  const metaBot = [card.rating ? `★ ${Number(card.rating).toFixed(1)}` : null, card.distance ? `${card.distance} mi` : null].filter(Boolean).join("   ·   ");
  if (metaTop) ctx.fillText(metaTop, cx, ny + 46);
  if (metaBot) ctx.fillText(metaBot, cx, ny + 82);

  // Skeleton hand gripping the card (drawn on top so fingers grip the edges)
  try {
    const hand = await loadImage("/skeleton-hand.png");
    const hw = 520, hh = 776, hx = cx - hw / 2, hy = 230;
    ctx.drawImage(hand, hx, hy, hw, hh);
  } catch (e) { console.debug("hand draw skipped", e); }

  // Bottom scrim for footer legibility over the forearm
  const scrim = ctx.createLinearGradient(0, H - 230, 0, H);
  scrim.addColorStop(0, "rgba(11,11,11,0)");
  scrim.addColorStop(1, "rgba(11,11,11,0.97)");
  ctx.fillStyle = scrim; ctx.fillRect(0, H - 230, W, 230);

  // Scannable QR (bottom-right) — lets anyone who sees the shared image jump straight to the app
  const shareUrl = (typeof window !== "undefined" && window.location?.origin && !window.location.origin.includes("localhost"))
    ? window.location.origin
    : "https://fork-fate.com";
  try {
    const qrDataUrl = await QRCode.toDataURL(shareUrl, { margin: 1, width: 300, color: { dark: "#0B0B0B", light: "#FFFFFF" } });
    const qr = await loadImage(qrDataUrl);
    const qs = 150, pad = 14, boxS = qs + pad * 2;
    const qx = W - 56 - boxS, qy = H - 44 - boxS, rr = 16;
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(qx + rr, qy);
    ctx.arcTo(qx + boxS, qy, qx + boxS, qy + boxS, rr);
    ctx.arcTo(qx + boxS, qy + boxS, qx, qy + boxS, rr);
    ctx.arcTo(qx, qy + boxS, qx, qy, rr);
    ctx.arcTo(qx, qy, qx + boxS, qy, rr);
    ctx.closePath();
    ctx.fillStyle = "#FFFFFF"; ctx.fill();
    ctx.drawImage(qr, qx + pad, qy + pad, qs, qs);
    ctx.restore();
  } catch (e) { console.debug("qr draw skipped", e); }

  // Footer CTA (left-aligned, beside the QR)
  ctx.textAlign = "left";
  ctx.fillStyle = "#FFFFFF";
  ctx.font = "700 44px Georgia, serif";
  ctx.fillText("Fork·Fate", 64, H - 116);
  ctx.fillStyle = "#B9BEC4";
  ctx.font = "400 28px Arial, sans-serif";
  ctx.fillText("Scan the code to", 64, H - 72);
  ctx.fillText("shuffle your own fate", 64, H - 36);
  ctx.textAlign = "center";

  return new Promise((resolve) => canvas.toBlob(resolve, "image/png"));
}


function RevealStage({ spinning, flash, deck, result, groupPicks, mode, light, theme, onReset, onReSpin, onReport, onPick, isFavorite, onToggleFavorite }) {
  const { t } = useLang();
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
          <p className="font-serif text-2xl text-[#0E0E0E]">{t("Your table awaits")}</p>
          <p className="mx-auto max-w-xs font-sans text-sm text-[#6B7075]">
            {mode === "food"
              ? t("Set your filters and hit Deal — fate decides where you're eating.")
              : mode === "drinks"
              ? t("Set your filters and hit Deal — fate decides what you're sipping.")
              : mode === "bars"
              ? t("Set your filters and hit Deal — fate decides where you're drinking.")
              : mode === "desserts"
              ? t("Set your filters and hit Deal — fate decides your sweet treat.")
              : mode === "shops"
              ? t("Set your filters and hit Deal — fate decides your next find.")
              : t("Set your filters and hit Deal — fate decides your pit stop.")}
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
        toast.success(t("Copied to clipboard — share your fate!"));
      }
    } catch (e) {
      // Share sheet cancelled or unavailable — non-critical
      console.debug("Share dismissed:", e);
    }
  };
  const shareFateImage = async () => {
    try {
      const blob = await buildFateCard(card, theme);
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
        toast.success(t("Fate card saved — share it anywhere!"));
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
            <img src={card.photo_url || card.image} alt={card.name} className="h-full w-full object-cover transition-transform duration-500 hover:scale-105" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
          </a>
          {onToggleFavorite && (
            <button
              onClick={(e) => { e.stopPropagation(); e.preventDefault(); onToggleFavorite(card); }}
              data-testid="result-favorite-toggle"
              title={isFavorite?.(card) ? t("Remove from favorites") : t("Save to favorites")}
              aria-pressed={isFavorite?.(card)}
              className="absolute right-3 top-3 grid h-11 w-11 place-items-center rounded-full bg-white/90 backdrop-blur transition-transform hover:scale-110 active:scale-95"
            >
              <Heart className={`h-5 w-5 transition-colors ${isFavorite?.(card) ? "fill-[#E01E26] text-[#E01E26]" : "text-[#6B7075]"}`} />
            </button>
          )}
          {card.sponsored && (
            <div
              className="pointer-events-none absolute left-3 top-3 z-10 flex items-center gap-1.5 rounded-full bg-[#E01E26] px-3 py-1 text-[11px] font-bold uppercase tracking-wide text-white shadow-lg shadow-black/30"
              data-testid="sponsored-ribbon"
            >
              <Store className="h-3 w-3" /> {t("Sponsored")}
            </div>
          )}
          <div className="pointer-events-none absolute bottom-4 left-4 right-4">
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-full bg-white/90 px-3 py-1 text-xs font-bold text-[#0E0E0E]">
                {card.cuisine} · {card.price}
              </span>
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
            <p className={`flex items-center gap-2 font-serif text-xl font-bold italic ${light ? "text-[#A31621]" : "text-[#E01E26]"}`} data-testid="reaper-line">
              {light ? (mode === "shops" ? <ShoppingBag className="h-4 w-4" /> : mode === "fuel" ? <Fuel className="h-4 w-4" /> : <UtensilsCrossed className="h-4 w-4" />) : <Skull className="h-4 w-4" />} {light ? lightLineFor(card, mode) : reaperLineFor(card)}
            </p>
            {!card.open_now && (
              <p data-testid="closed-reroll-hint" className="rounded-xl bg-[#FCF4F4] px-3 py-2 font-sans text-xs font-bold text-[#E01E26]">
                {t("Closed right now — shuffle again for an open spot.")}
              </p>
            )}
            <div className="flex items-center gap-5 text-sm text-[#0E0E0E]">
              <span className="flex items-center gap-1.5 font-semibold">
                <Star className="h-4 w-4 fill-[#E01E26] text-[#E01E26]" />
                {card.rating > 0 ? card.rating.toFixed(1) : t("New")}
              </span>
              <span className="flex items-center gap-1.5 text-[#6B7075]">
                <MapPin className="h-4 w-4" /> {card.distance} {t("mi away")}
              </span>
            </div>
            {card.address && (
              <p className="font-sans text-sm leading-relaxed text-[#6B7075]">
                {card.address}
              </p>
            )}
            <div className="flex flex-wrap gap-3">
              {card.doordash_url && mode !== "shops" && mode !== "fuel" && (
                <a
                  href={card.doordash_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  data-testid="doordash-button"
                  className="inline-flex items-center gap-2 rounded-full bg-[#E01E26] px-4 py-2 text-sm font-bold text-white transition-colors hover:bg-[#B3141A]"
                >
                  <ShoppingBag className="h-4 w-4" /> {t("Order on DoorDash")}
                  <ExternalLink className="h-3.5 w-3.5" />
                </a>
              )}
              {card.order_url && mode !== "shops" && mode !== "fuel" && (
                <a
                  href={card.order_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  data-testid="order-online-button"
                  className="inline-flex items-center gap-2 rounded-full border border-[#E2E4E7] bg-white px-4 py-2 text-sm font-semibold text-[#0E0E0E] transition-colors hover:bg-[#EDEEF0]"
                >
                  <ShoppingBag className="h-4 w-4" /> {t("Order online")}
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
                  <Star className="h-4 w-4 fill-[#E01E26] text-[#E01E26]" /> {t("Reviews & ratings")}
                  <ExternalLink className="h-3.5 w-3.5" />
                </a>
              )}
              <CheckInButton card={card} />
              <button
                onClick={onReSpin}
                data-testid="respin-button"
                className="inline-flex items-center gap-2 rounded-full bg-[#E01E26] px-4 py-2 text-sm font-bold text-white transition-colors hover:bg-[#B3141A]"
              >
                <Dices className="h-4 w-4" /> {t("Shuffle again")}
              </button>
              <button
                onClick={shareFate}
                data-testid="share-fate-button"
                className="inline-flex items-center gap-2 rounded-full border border-[#E2E4E7] bg-white px-4 py-2 text-sm font-semibold text-[#0E0E0E] transition-colors hover:bg-[#EDEEF0]"
              >
                <Share2 className="h-4 w-4" /> {t("Share your fate")}
              </button>
              <button
                onClick={shareFateImage}
                data-testid="share-fate-image-button"
                className="inline-flex items-center gap-2 rounded-full bg-[#0E0E0E] px-4 py-2 text-sm font-bold text-white transition-colors hover:bg-[#2A2A2A]"
              >
                <ImageDown className="h-4 w-4" /> {t("Share as image")}
              </button>
              <button
                onClick={onReset}
                data-testid="reset-spin-button"
                className="inline-flex items-center gap-2 rounded-full border border-[#E2E4E7] bg-white px-4 py-2 text-sm font-semibold text-[#0E0E0E] transition-colors hover:bg-[#EDEEF0]"
              >
                <RotateCcw className="h-4 w-4" /> {t("Clear")}
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
                <p className="font-sans text-sm font-bold uppercase tracking-[0.18em] text-[#0E0E0E]">
                  {alternatives.length} more to consider
                </p>
                <p className="mt-0.5 font-sans text-xs text-[#6B7075]">
                  Not feeling it? Tap one to re-roll your fate.
                </p>
                <div className="mt-3 space-y-2.5">
                  {alternatives.map((alt) => (
                    <button
                      key={alt.id}
                      onClick={() => onPick?.(alt)}
                      data-testid={`alternative-${alt.id}`}
                      className="group flex w-full items-center gap-3.5 rounded-2xl border border-[#E2E4E7] bg-white p-3 text-left transition-[transform,box-shadow,border-color] duration-200 hover:-translate-y-0.5 hover:border-[#E01E26] hover:shadow-[0_8px_24px_rgba(224,30,38,0.14)]"
                    >
                      <span className="relative shrink-0">
                        <img
                          src={alt.image}
                          alt={alt.name}
                          className="h-[72px] w-[72px] rounded-xl object-cover transition-transform duration-200 group-hover:scale-[1.04]"
                        />
                        {alt.sponsored && (
                          <span
                            data-testid={`alternative-sponsored-${alt.id}`}
                            className="absolute -left-1 -top-1 inline-flex items-center gap-1 rounded-full bg-[#E01E26] px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white shadow-md"
                          >
                            <Store className="h-2.5 w-2.5" /> {t("Sponsored")}
                          </span>
                        )}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate font-serif text-lg font-medium leading-tight text-[#0E0E0E]">
                          {alt.name}
                        </span>
                        <span className="mt-1 flex flex-wrap items-center gap-x-2.5 gap-y-1 font-sans text-sm text-[#6B7075]">
                          <span>{alt.cuisine} · {alt.price}</span>
                          <span className="flex items-center gap-1">
                            <Star className="h-3.5 w-3.5 fill-[#E01E26] text-[#E01E26]" />
                            {alt.rating > 0 ? alt.rating.toFixed(1) : "New"}
                          </span>
                          <span className="flex items-center gap-1">
                            <MapPin className="h-3.5 w-3.5" /> {alt.distance} mi
                          </span>
                        </span>
                        <span className="mt-1.5 inline-flex items-center gap-1 font-sans text-xs font-bold uppercase tracking-wide text-[#B8BCC2] transition-colors group-hover:text-[#E01E26]">
                          <Dices className="h-3.5 w-3.5" /> Pick this
                        </span>
                      </span>
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
