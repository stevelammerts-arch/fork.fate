import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import { ArrowLeft, Stamp, Globe2, ShieldCheck } from "lucide-react";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const MODE_LABELS = {
  explore: "Adventure Passport",
  food: "Food Passport",
  drinks: "Drinks Passport",
  bars: "Bar Passport",
  desserts: "Dessert Passport",
  shops: "Shop Passport",
  fuel: "Road Passport",
  stay: "Stay Passport",
};

export default function Wall() {
  const [items, setItems] = useState(null);

  useEffect(() => {
    axios
      .get(`${API}/passports/wall`)
      .then(({ data }) => setItems(data.items))
      .catch(() => setItems([]));
  }, []);

  return (
    <div className="min-h-screen bg-[#F7F8F9] pb-16">
      <div className="mx-auto w-full max-w-3xl px-5 pt-6">
        <div className="mb-5 flex items-center justify-between">
          <Link to="/" className="inline-flex items-center gap-1.5 text-sm font-bold text-[#6B7075] hover:text-[#0E0E0E]" data-testid="wall-home-link">
            <ArrowLeft className="h-4 w-4" /> Fork·Fate
          </Link>
        </div>

        <div className="rounded-3xl border border-[#E2E4E7] bg-white p-6 shadow-sm">
          <p className="font-sans text-xs font-bold uppercase tracking-[0.2em] text-[#E01E26]">Passport Wall</p>
          <h1 className="mt-1 font-serif text-3xl font-bold text-[#0E0E0E]" data-testid="wall-title">
            Finished passports
          </h1>
          <p className="mt-1 font-sans text-sm text-[#6B7075]">
            Every stop stamped on site with GPS. Finish one of your own and post it here.
          </p>
        </div>

        {items === null && (
          <div className="mt-8 grid place-items-center text-[#A0A0A0]" data-testid="wall-loading">
            <Stamp className="h-8 w-8 animate-pulse text-[#E01E26]" />
          </div>
        )}

        {items?.length === 0 && (
          <div className="mt-6 rounded-2xl border border-[#E2E4E7] bg-white p-6 text-center" data-testid="wall-empty">
            <Globe2 className="mx-auto h-8 w-8 text-[#B8BCC2]" />
            <p className="mt-3 font-serif text-xl font-bold text-[#0E0E0E]">The wall is empty</p>
            <p className="mt-1 font-sans text-sm text-[#6B7075]">Be the first — finish a passport and tap “Post to the wall”.</p>
            <Link to="/" className="mt-4 inline-flex rounded-full bg-[#E01E26] px-6 py-3 text-sm font-bold text-white hover:bg-[#B3141A]">
              Deal a passport
            </Link>
          </div>
        )}

        {items?.length > 0 && (
          <div className="mt-6 grid gap-4 sm:grid-cols-2" data-testid="wall-grid">
            {items.map((p) => (
              <Link
                key={p.code}
                to={`/p/${p.code}`}
                data-testid={`wall-item-${p.code}`}
                className="overflow-hidden rounded-2xl border border-[#E2E4E7] bg-white transition-shadow hover:shadow-md"
              >
                <img
                  src={`${API}/passports/${p.code}/wall-thumb`}
                  alt={`${p.holder_name || "Fate traveller"}'s passport`}
                  loading="lazy"
                  className="w-full bg-[#20140B] object-cover"
                />
                <div className="p-4">
                  <p className="font-serif text-lg font-bold text-[#0E0E0E]">{p.holder_name || "Fate Traveller"}</p>
                  <p className="font-sans text-sm text-[#6B7075]">
                    {p.label || MODE_LABELS[p.mode] || "Fate Passport"} · {p.stops} stops
                    {p.completed_at ? ` · ${new Date(p.completed_at).toLocaleDateString()}` : ""}
                  </p>
                  <span
                    className={`mt-2 inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 font-sans text-[11px] font-bold uppercase tracking-wider ${
                      p.verified >= p.stops ? "bg-[#E8F3E9] text-[#2E7D32]" : "bg-[#EDEEF0] text-[#6B7075]"
                    }`}
                  >
                    <ShieldCheck className="h-3.5 w-3.5" />
                    {p.verified >= p.stops ? "Verified on site" : `${p.verified}/${p.stops} on site`}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
