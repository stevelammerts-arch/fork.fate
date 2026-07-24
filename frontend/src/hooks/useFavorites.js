import { useCallback, useEffect, useState } from "react";

const FAV_KEY = "ff_favorites";

function readFavs() {
  try {
    const raw = JSON.parse(localStorage.getItem(FAV_KEY) || "[]");
    return Array.isArray(raw) ? raw : [];
  } catch {
    return [];
  }
}

// Local-only saved spots (hearted). Keyed by name+address so Google's random
// per-search ids don't create duplicates across sessions.
const keyOf = (r) => `${(r?.name || "").toLowerCase()}|${(r?.address || "").toLowerCase()}`;

export function useFavorites() {
  const [favorites, setFavorites] = useState(readFavs);

  useEffect(() => {
    try {
      localStorage.setItem(FAV_KEY, JSON.stringify(favorites));
    } catch (e) {
      console.debug("favorites save failed", e);
    }
  }, [favorites]);

  useEffect(() => {
    const sync = (e) => { if (e.key === FAV_KEY) setFavorites(readFavs()); };
    window.addEventListener("storage", sync);
    return () => window.removeEventListener("storage", sync);
  }, []);

  const isFavorite = useCallback(
    (r) => favorites.some((f) => keyOf(f) === keyOf(r)),
    [favorites]
  );

  const toggleFavorite = useCallback((r) => {
    if (!r?.name) return;
    setFavorites((prev) => {
      const k = keyOf(r);
      if (prev.some((f) => keyOf(f) === k)) return prev.filter((f) => keyOf(f) !== k);
      const slim = {
        id: r.id, name: r.name, cuisine: r.cuisine, price: r.price,
        rating: r.rating, distance: r.distance, address: r.address || "",
        image: r.image, category: r.category || "food",
        google_url: r.google_url, doordash_url: r.doordash_url,
        ubereats_url: r.ubereats_url, grubhub_url: r.grubhub_url, order_url: r.order_url,
        open_now: r.open_now,
      };
      return [slim, ...prev];
    });
  }, []);

  const removeFavorite = useCallback((r) => {
    setFavorites((prev) => prev.filter((f) => keyOf(f) !== keyOf(r)));
  }, []);

  return { favorites, isFavorite, toggleFavorite, removeFavorite };
}
