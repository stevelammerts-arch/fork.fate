import React, { useEffect, useState, useRef, useCallback } from "react";
import axios from "axios";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { Dices, Star, MapPin, Utensils, RotateCcw } from "lucide-react";
import Filters from "../components/Filters";
import { RestaurantCard } from "../components/RestaurantCard";
import AddRestaurantDialog from "../components/AddRestaurantDialog";

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

export default function Home() {
  const [restaurants, setRestaurants] = useState([]);
  const [cuisines, setCuisines] = useState([]);
  const [selectedCuisines, setSelectedCuisines] = useState([]);
  const [selectedPrices, setSelectedPrices] = useState([]);
  const [maxDistance, setMaxDistance] = useState(null);

  const [spinning, setSpinning] = useState(false);
  const [result, setResult] = useState(null);
  const [flash, setFlash] = useState(null); // card shown during shuffle
  const shuffleRef = useRef(null);

  const load = useCallback(async () => {
    try {
      const [rRes, cRes] = await Promise.all([
        axios.get(`${API}/restaurants`),
        axios.get(`${API}/cuisines`),
      ]);
      setRestaurants(rRes.data);
      setCuisines(cRes.data);
    } catch (e) {
      toast.error("Failed to load restaurants");
    }
  }, []);

  useEffect(() => {
    load();
    return () => clearInterval(shuffleRef.current);
  }, [load]);

  const localPool = restaurants.filter((r) => {
    if (selectedCuisines.length && !selectedCuisines.includes(r.cuisine)) return false;
    if (selectedPrices.length && !selectedPrices.includes(r.price)) return false;
    if (maxDistance != null && r.distance > maxDistance) return false;
    return true;
  });

  const toggle = (setter, arr, val) =>
    setter(arr.includes(val) ? arr.filter((x) => x !== val) : [...arr, val]);

  const spin = async () => {
    if (spinning) return;
    if (localPool.length === 0) {
      toast.error("No spots match these filters — loosen them up!");
      return;
    }
    setSpinning(true);
    setResult(null);

    // visual shuffle
    let i = 0;
    shuffleRef.current = setInterval(() => {
      setFlash(localPool[i % localPool.length]);
      i++;
    }, SHUFFLE_INTERVAL_MS);

    try {
      const { data } = await axios.post(`${API}/spin`, {
        cuisines: selectedCuisines,
        prices: selectedPrices,
        max_distance: maxDistance,
      });
      setTimeout(() => {
        clearInterval(shuffleRef.current);
        setFlash(null);
        setResult(data);
        setSpinning(false);
      }, SHUFFLE_DURATION_MS);
    } catch (e) {
      clearInterval(shuffleRef.current);
      setFlash(null);
      setSpinning(false);
      toast.error(e.response?.data?.detail || "Spin failed");
    }
  };

  const handleDelete = async (r) => {
    try {
      await axios.delete(`${API}/restaurants/${r.id}`);
      setRestaurants((prev) => prev.filter((x) => x.id !== r.id));
      if (result?.id === r.id) setResult(null);
      toast.success(`${r.name} removed`);
    } catch (e) {
      toast.error("Could not delete");
    }
  };

  return (
    <div className="min-h-screen bg-[#FAF8F5]">
      {/* Header */}
      <header className="sticky top-0 z-30 border-b border-[#EAE4D9] bg-white/80 backdrop-blur-2xl">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4 md:px-12">
          <div className="flex items-center gap-2.5">
            <span className="grid h-9 w-9 place-items-center rounded-full bg-[#C84B31] text-white">
              <Utensils className="h-4 w-4" />
            </span>
            <span className="font-serif text-2xl font-semibold tracking-tight text-[#2C2A29]">
              Fork·Fate
            </span>
          </div>
          <AddRestaurantDialog onAdded={(r) => { setRestaurants((p) => [...p, r]); load(); }} />
        </div>
      </header>

      {/* Hero / Roulette */}
      <section className="mx-auto max-w-6xl px-6 pt-12 pb-8 md:px-12 md:pt-16">
        <motion.div
          initial={HERO_INITIAL}
          animate={HERO_ANIMATE}
          transition={HERO_TRANSITION}
          className="max-w-2xl"
        >
          <p className="font-sans text-xs font-bold tracking-[0.25em] uppercase text-[#C84B31]">
            Can't decide where to eat?
          </p>
          <h1 className="mt-3 font-serif text-4xl font-medium leading-none tracking-tighter text-[#2C2A29] sm:text-5xl lg:text-6xl">
            Let fate pick tonight's table.
          </h1>
          <p className="mt-4 font-sans text-base leading-relaxed text-[#7A7571]">
            Set your mood with a few filters, then hit spin. We'll shuffle the deck
            of local spots and land on your next meal.
          </p>
        </motion.div>

        <div className="mt-10 grid gap-10 lg:grid-cols-[1fr_1.1fr] lg:items-start">
          {/* left: filters + spin */}
          <div className="min-w-0 space-y-8">
            <Filters
              cuisines={cuisines}
              selectedCuisines={selectedCuisines}
              toggleCuisine={(c) => toggle(setSelectedCuisines, selectedCuisines, c)}
              selectedPrices={selectedPrices}
              togglePrice={(p) => toggle(setSelectedPrices, selectedPrices, p)}
              maxDistance={maxDistance}
              setMaxDistance={setMaxDistance}
            />

            <div className="flex items-center gap-4">
              <motion.button
                data-testid="spin-roulette-button"
                onClick={spin}
                disabled={spinning}
                whileHover={{ scale: spinning ? 1 : 1.03 }}
                whileTap={SPIN_TAP}
                className="inline-flex items-center gap-3 rounded-full bg-[#C84B31] px-10 py-5 font-sans text-lg font-bold text-white shadow-lg shadow-[#C84B31]/25 transition-colors hover:bg-[#A33B24] disabled:opacity-70"
              >
                <Dices className={`h-6 w-6 ${spinning ? "animate-spin" : ""}`} />
                {spinning ? "Shuffling…" : "Spin the deck"}
              </motion.button>
              <span className="font-sans text-sm text-[#7A7571]">
                {localPool.length} spot{localPool.length !== 1 && "s"} in play
              </span>
            </div>
          </div>

          {/* right: reveal stage */}
          <div className="relative min-h-[420px] rounded-3xl border border-[#EAE4D9] bg-white p-4 shadow-xl shadow-black/5">
            <RevealStage spinning={spinning} flash={flash} result={result} onReset={() => setResult(null)} />
          </div>
        </div>
      </section>

      {/* All restaurants */}
      <section className="mx-auto max-w-6xl px-6 pb-24 pt-8 md:px-12">
        <div className="flex items-end justify-between border-b border-[#EAE4D9] pb-4">
          <h2 className="font-serif text-2xl font-medium tracking-tight text-[#2C2A29] sm:text-3xl">
            The full deck
          </h2>
          <span className="font-sans text-xs font-bold tracking-[0.2em] uppercase text-[#7A7571]">
            {restaurants.length} spots
          </span>
        </div>
        <div className="mt-8 grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3" data-testid="restaurant-grid">
          {restaurants.map((r) => (
            <RestaurantCard key={r.id} r={r} onDelete={handleDelete} />
          ))}
        </div>
      </section>
    </div>
  );
}

function RevealStage({ spinning, flash, result, onReset }) {
  const card = result || flash;

  if (!card) {
    return (
      <div className="grid h-full min-h-[400px] place-items-center text-center">
        <div className="space-y-3">
          <span className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-[#EAE4D9] text-[#C84B31]">
            <Dices className="h-7 w-7" />
          </span>
          <p className="font-serif text-2xl text-[#2C2A29]">Your table awaits</p>
          <p className="mx-auto max-w-xs font-sans text-sm text-[#7A7571]">
            Hit spin and let the deck decide where you're eating.
          </p>
        </div>
      </div>
    );
  }

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={result ? `res-${card.id}` : "flash"}
        initial={{ opacity: 0, scale: 0.96, rotate: result ? -2 : 0 }}
        animate={{ opacity: 1, scale: 1, rotate: 0 }}
        exit={{ opacity: 0, scale: 0.98 }}
        transition={result ? RESULT_SPRING : FLASH_TRANSITION}
        className="overflow-hidden rounded-2xl"
        data-testid={result ? "spin-result-card" : "spin-flash-card"}
      >
        <div className="relative h-64 overflow-hidden rounded-2xl">
          <img src={card.image} alt={card.name} className="h-full w-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
          <div className="absolute bottom-4 left-4 right-4">
            <span className="rounded-full bg-white/90 px-3 py-1 text-xs font-bold text-[#2C2A29]">
              {card.cuisine} · {card.price}
            </span>
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
            <p className="font-sans text-sm leading-relaxed text-[#7A7571]">
              {card.description}
            </p>
            <div className="flex items-center gap-5 text-sm text-[#2C2A29]">
              <span className="flex items-center gap-1.5 font-semibold">
                <Star className="h-4 w-4 fill-[#C84B31] text-[#C84B31]" />
                {card.rating.toFixed(1)}
              </span>
              <span className="flex items-center gap-1.5 text-[#7A7571]">
                <MapPin className="h-4 w-4" /> {card.distance} km away
              </span>
              {card.address && (
                <span className="text-[#7A7571]">{card.address}</span>
              )}
            </div>
            <button
              onClick={onReset}
              data-testid="reset-spin-button"
              className="inline-flex items-center gap-2 rounded-full border border-[#EAE4D9] bg-[#FAF8F5] px-4 py-2 text-sm font-semibold text-[#2C2A29] transition-colors hover:bg-[#EAE4D9]"
            >
              <RotateCcw className="h-4 w-4" /> Clear
            </button>
          </motion.div>
        )}
      </motion.div>
    </AnimatePresence>
  );
}
