import React, { useState, useRef } from "react";
import axios from "axios";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { Dices, Star, MapPin, RotateCcw, Search, ExternalLink, ShoppingBag, Flag, Clock, Share2, LocateFixed } from "lucide-react";
import Filters from "../components/Filters";
import { RestaurantCard } from "../components/RestaurantCard";
import AddRestaurantDialog from "../components/AddRestaurantDialog";
import AdUnit from "../components/AdUnit";
import InstallAppButton from "../components/InstallAppButton";
import RequestSponsorshipDialog from "../components/RequestSponsorshipDialog";
import { Input } from "../components/ui/input";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

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

const FOOD_CUISINES = [
  "Italian", "Mexican", "Chinese", "Japanese", "Indian", "Thai", "Korean", "Chicken Wings",
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
  const [results, setResults] = useState([]);
  const [source, setSource] = useState(null);

  const [loading, setLoading] = useState(false);
  const [spinning, setSpinning] = useState(false);
  const [result, setResult] = useState(null);
  const [flash, setFlash] = useState(null);
  const shuffleRef = useRef(null);

  const toggle = (setter, arr, val) =>
    setter(arr.includes(val) ? arr.filter((x) => x !== val) : [...arr, val]);

  const switchMode = (m) => {
    if (m === mode) return;
    setMode(m);
    setSelectedCuisines([]);
    setResults([]);
    setResult(null);
  };

  const cuisineList = mode === "food" ? FOOD_CUISINES : mode === "drinks" ? DRINK_CUISINES : mode === "bars" ? BAR_CUISINES : DESSERT_CUISINES;

  const runShuffle = (pool) => {
    setResult(null);
    setSpinning(true);
    let i = 0;
    shuffleRef.current = setInterval(() => {
      setFlash(pool[i % pool.length]);
      i++;
    }, SHUFFLE_INTERVAL_MS);
    const chosen = pool[Math.floor(Math.random() * pool.length)];
    setTimeout(() => {
      clearInterval(shuffleRef.current);
      setFlash(null);
      setResult(chosen);
      setSpinning(false);
    }, SHUFFLE_DURATION_MS);
  };

  const doSearch = async (cuisinesArg, pricesArg, categoryArg, coordsArg = coords) => {
    if (spinning || loading) return;
    const z = zip.trim();
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
        toast.success("Using your location");
        doSearch(selectedCuisines, [], mode, c);
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

  return (
    <div className="relative min-h-screen overflow-hidden bg-white">
      {/* Decorative reaper background */}
      <img
        src="/reaper.png"
        alt=""
        aria-hidden="true"
        data-testid="reaper-bg"
        className="pointer-events-none fixed left-1/2 top-1/2 z-0 h-[70vh] max-w-none -translate-x-1/2 -translate-y-1/2 select-none opacity-[0.38] md:h-[85vh]"
      />
      {/* Header */}
      <header className="sticky top-0 z-30 border-b border-[#E2E4E7] bg-[#0E0E0E]">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-4 md:px-12">
          <div className="flex items-center gap-2.5">
            <div className="relative h-11 w-11 overflow-hidden rounded-full">
              <img src="/logo-v8.png" alt="Fork·Fate logo" className="h-11 w-11 object-contain" />
              <motion.div
                className="pointer-events-none absolute inset-0"
                initial={{ x: "-130%" }}
                animate={{ x: "130%" }}
                transition={{ duration: 1.331, delay: 0.5, ease: "easeInOut" }}
                style={{ background: "linear-gradient(115deg, transparent 42%, rgba(255,255,255,0.85) 50%, transparent 58%)" }}
              />
            </div>
            <span className="font-serif text-2xl font-semibold tracking-tight text-white">
              Fork·Fate
            </span>
          </div>
          <div className="flex items-center gap-3">
            <InstallAppButton />
            <AddRestaurantDialog mode={mode} onAdded={(r) => setResults((p) => [r, ...p])} />
          </div>
        </div>
      </header>

      {/* Hero / Roulette */}
      <section className="relative z-10 mx-auto max-w-6xl px-6 pt-12 pb-8 md:px-12 md:pt-16">
        <motion.div
          initial={HERO_INITIAL}
          animate={HERO_ANIMATE}
          transition={HERO_TRANSITION}
          className="max-w-2xl"
        >
          <p className="font-sans text-xs font-bold tracking-[0.25em] uppercase text-[#E01E26]">
            {mode === "food" ? "Can't decide where to eat?" : mode === "drinks" ? "Can't decide what to sip?" : mode === "bars" ? "Can't decide where to drink?" : "Craving something sweet?"}
          </p>
          <h1 className="mt-3 font-serif text-4xl font-medium leading-none tracking-tighter text-[#0E0E0E] sm:text-5xl lg:text-6xl">
            {mode === "food" ? "Let fate pick tonight's table." : mode === "drinks" ? "Let fate pick your next sip." : mode === "bars" ? "Let fate pick tonight's bar." : "Let fate pick your sweet treat."}
          </h1>
          <p className="mt-4 font-sans text-base leading-relaxed text-[#0E0E0E]">
            {mode === "food"
              ? "Set the mood with a few filters and hit spin. We'll shuffle great local restaurants — up to 50 miles out — and land on your next meal."
              : mode === "drinks"
              ? "Coffee, boba tea or a smoothie? Set your filters and spin — we'll shuffle nearby drink spots and pick one for you."
              : mode === "bars"
              ? "Beer, whiskey, margaritas or a Tiki bar? Set your filters and spin — we'll shuffle nearby bars and pick tonight's spot."
              : "Ice cream, bakery, candy or froyo? Set your filters and spin — we'll shuffle nearby dessert spots and pick your treat."}
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
              <div className="flex items-center gap-2 rounded-full border border-[#E2E4E7] bg-white px-4 py-1.5 focus-within:border-[#E01E26]">
                <Search className="h-5 w-5 text-[#6B7075]" />
                <Input
                  data-testid="zip-input"
                  value={zip}
                  onChange={(e) => { setZip(e.target.value.replace(/[^\d]/g, "").slice(0, 5)); setCoords(null); }}
                  onKeyDown={(e) => e.key === "Enter" && spin()}
                  placeholder="e.g. 10001"
                  inputMode="numeric"
                  className="border-0 bg-transparent px-1 text-lg font-semibold text-[#0E0E0E] shadow-none focus-visible:ring-0"
                />
                <span className="shrink-0 rounded-full bg-[#EDEEF0] px-3 py-1 text-xs font-bold text-[#6B7075]">
                  within 50 mi
                </span>
              </div>
              <button
                type="button"
                onClick={useMyLocation}
                disabled={geoLoading || loading || spinning}
                data-testid="use-my-location-button"
                className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-bold transition-colors disabled:opacity-70 ${coords ? "bg-[#E01E26] text-white hover:bg-[#B3141A]" : "border border-[#E2E4E7] bg-white text-[#0E0E0E] hover:bg-[#EDEEF0]"}`}
              >
                <LocateFixed className={`h-4 w-4 ${geoLoading ? "animate-pulse" : ""}`} />
                {geoLoading ? "Locating…" : coords ? "Using your location" : "Use my location"}
              </button>
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
                {loading ? "Finding spots…" : spinning ? "Shuffling…" : "Deal Your Fate!"}
              </motion.button>
              {results.length > 0 && (
                <span className="font-sans text-sm text-[#6B7075]">
                  {results.length} spot{results.length !== 1 && "s"} nearby
                </span>
              )}
            </div>
          </div>

          {/* right: reveal stage */}
          <div className="relative min-h-[420px] rounded-3xl border border-[#E2E4E7] bg-white p-4 shadow-xl shadow-black/5">
            <RevealStage spinning={spinning} flash={flash} deck={results} result={result} mode={mode} onReset={() => setResult(null)} onReSpin={reSpin} onReport={reportClosed} onPick={setResult} />
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
            <span className="font-sans text-xs font-bold tracking-[0.2em] uppercase text-[#6B7075]">
              {results.length} within 50 mi
            </span>
          </div>
          <AdUnit className="mt-8" label="Advertisement" />
          <div className="mt-8 grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3" data-testid="restaurant-grid">
            {results.map((r) => (
              <RestaurantCard key={r.id} r={r} onReport={reportClosed} />
            ))}
          </div>
        </section>
      )}

      {/* Footer */}
      <footer className="relative z-10 border-t border-[#E2E4E7] bg-[#0E0E0E]">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-6 py-8 md:flex-row md:px-12">
          <div className="flex items-center gap-2.5">
            <img src="/logo-v8.png" alt="" className="h-8 w-8 object-contain" />
            <span className="font-serif text-lg font-semibold text-white">Fork·Fate</span>
          </div>
          <p className="order-3 font-sans text-xs text-[#8A8F95] md:order-2">
            © {new Date().getFullYear()} Fork·Fate — let fate decide.
          </p>
          <div className="order-2 md:order-3">
            <RequestSponsorshipDialog />
          </div>
        </div>
      </footer>
    </div>
  );
}

const DECK_SIZE = 5;

function ShufflingDeck({ cards, flash }) {
  const deck = (cards.length ? cards : [flash]).slice(0, DECK_SIZE);
  const label = flash?.name;
  return (
    <div className="grid h-full min-h-[400px] place-items-center" data-testid="shuffling-deck">
      <div className="flex flex-col items-center gap-8">
        <div className="relative h-60 w-44">
          {deck.map((c, i) => (
            <motion.div
              key={(c?.id || "c") + i}
              className="absolute inset-0 overflow-hidden rounded-2xl border-2 border-white bg-[#0E0E0E] shadow-2xl shadow-black/30"
              style={{ zIndex: DECK_SIZE - i }}
              animate={{
                x: [0, i % 2 === 0 ? -96 : 96, 0],
                y: [0, -26, 0],
                rotate: [(i - 2) * 4, i % 2 === 0 ? -17 : 17, (i - 2) * 4],
                scale: [1, 0.97, 1],
              }}
              transition={{
                duration: 0.72,
                repeat: Infinity,
                ease: "easeInOut",
                delay: i * 0.1,
              }}
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
            Shuffling the deck
          </p>
          <p className="mt-1 h-7 font-serif text-2xl text-[#0E0E0E]">{label}</p>
        </div>
      </div>
    </div>
  );
}

function RevealStage({ spinning, flash, deck, result, mode, onReset, onReSpin, onReport, onPick }) {
  if (!result && spinning) {
    return <ShufflingDeck cards={deck} flash={flash} />;
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
              ? "Set your filters and hit spin — fate decides where you're eating."
              : mode === "drinks"
              ? "Set your filters and hit spin — fate decides what you're sipping."
              : mode === "bars"
              ? "Set your filters and hit spin — fate decides where you're drinking."
              : "Set your filters and hit spin — fate decides your sweet treat."}
          </p>
        </div>
      </div>
    );
  }

  const card = result;
  const alternatives = deck.filter((d) => d.id !== card.id).slice(0, 5);
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
      // user cancelled share sheet — ignore
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
                <Dices className="h-4 w-4" /> Spin again
              </button>
              <button
                onClick={shareFate}
                data-testid="share-fate-button"
                className="inline-flex items-center gap-2 rounded-full border border-[#E2E4E7] bg-white px-4 py-2 text-sm font-semibold text-[#0E0E0E] transition-colors hover:bg-[#EDEEF0]"
              >
                <Share2 className="h-4 w-4" /> Share your fate
              </button>
              <button
                onClick={onReset}
                data-testid="reset-spin-button"
                className="inline-flex items-center gap-2 rounded-full border border-[#E2E4E7] bg-white px-4 py-2 text-sm font-semibold text-[#0E0E0E] transition-colors hover:bg-[#EDEEF0]"
              >
                <RotateCcw className="h-4 w-4" /> Clear
              </button>
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
                  5 more to consider
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
          </motion.div>
        )}
      </motion.div>
    </AnimatePresence>
  );
}
