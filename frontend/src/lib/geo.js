// Geometry + location helpers shared by the home fate engine.
import axios from "axios";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export const haversineMi = (a, b) => {
  if (!a || !b) return 0;
  const R = 3958.8, toRad = (d) => (d * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat), dLng = toRad(b.lng - a.lng);
  const s = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(s), Math.sqrt(1 - s));
};

export const resolveCoords = async (coordsVal, zipVal) => {
  if (coordsVal?.lat != null) return coordsVal;
  const z = (zipVal || "").trim();
  if (/^\d{5}$/.test(z)) {
    const { data } = await axios.get(`${API}/geocode`, { params: { zip: z } });
    return { lat: data.lat, lng: data.lng };
  }
  return null;
};

// Fate of the Day: one destined spot everyone in the same area sees today.
// Deterministic: seeded by date + area (zip or rounded coords) over the
// id-sorted pool, so it stays stable all day without any backend.
export function computeFateOfDay(results, zip, coords) {
  if (!results.length) return null;
  const day = new Date().toISOString().slice(0, 10);
  const area = zip || (coords ? `${coords.lat.toFixed(2)},${coords.lng.toFixed(2)}` : "");
  const seed = `${day}|${area}`;
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0;
  const sorted = [...results].sort((a, b) => String(a.id).localeCompare(String(b.id)));
  return sorted[h % sorted.length];
}
