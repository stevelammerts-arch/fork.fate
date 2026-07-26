import { useCallback, useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import axios from "axios";
import { toast } from "sonner";
import { MapPin, Check, Share2, Stamp, LocateFixed, ArrowLeft, Trophy, Undo2, ExternalLink, Trash2 } from "lucide-react";
import { rememberPassport, forgetPassport } from "../lib/passports";

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

const safeHttp = (u) => (typeof u === "string" && /^https?:\/\//i.test(u.trim()) ? u : "");
const mapsUrl = (s) =>
  safeHttp(s.google_url) ||
  `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${s.name} ${s.address || ""}`.trim())}`;

export default function Passport() {
  const { code } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState("");
  const [confirmDelete, setConfirmDelete] = useState(false);

  const deletePassport = async () => {
    if (!confirmDelete) { setConfirmDelete(true); return; }
    setBusy("delete");
    try {
      await axios.delete(`${API}/passports/${code}`);
      forgetPassport(code);
      toast.success("Passport deleted");
      navigate("/");
    } catch {
      toast.error("Couldn't delete that passport");
      setBusy("");
    }
  };

  const load = useCallback(async () => {
    try {
      const { data: d } = await axios.get(`${API}/passports/${code}`);
      setData(d);
      rememberPassport({ code: d.code, label: d.label, mode: d.mode, total: d.total });
    } catch {
      setError("This passport link is invalid or was never created.");
    }
  }, [code]);

  useEffect(() => { load(); }, [load]);

  const stampedIds = new Set((data?.stamps || []).map((s) => s.stop_id));

  const postStamp = async (stop, body) => {
    setBusy(stop.id);
    try {
      const { data: d } = await axios.post(`${API}/passports/${code}/stamp`, body);
      setData(d);
      if (d.completed_at && d.stamped === d.total) toast.success("Passport complete — every stop stamped! 🏆");
      else toast.success(`Stamped: ${stop.name}`);
    } catch (e) {
      toast.error(e.response?.data?.detail || "Couldn't stamp that stop");
    } finally {
      setBusy("");
    }
  };

  const stampWithGps = (stop) => {
    if (!navigator.geolocation) {
      toast.error("Location isn't supported here — use Stamp manually");
      return;
    }
    setBusy(stop.id);
    navigator.geolocation.getCurrentPosition(
      (pos) => postStamp(stop, { stop_id: stop.id, lat: pos.coords.latitude, lng: pos.coords.longitude, source: "gps" }),
      (err) => {
        setBusy("");
        toast.error(
          err.code === err.PERMISSION_DENIED
            ? "Location denied — you can still stamp manually"
            : "Couldn't read your location — stamp manually instead"
        );
      },
      { enableHighAccuracy: true, timeout: 12000, maximumAge: 60000 }
    );
  };

  const unstamp = async (stop) => {
    setBusy(stop.id);
    try {
      const { data: d } = await axios.delete(`${API}/passports/${code}/stamp/${encodeURIComponent(stop.id)}`);
      setData(d);
    } catch {
      toast.error("Couldn't undo that stamp");
    } finally {
      setBusy("");
    }
  };

  const share = async () => {
    const url = `${window.location.origin}/p/${code}`;
    const text = `My Fork·Fate ${MODE_LABELS[data?.mode] || "Passport"} — ${data?.stamped}/${data?.total} stamped.`;
    try {
      if (navigator.share) await navigator.share({ title: "Fork·Fate Passport", text, url });
      else {
        await navigator.clipboard.writeText(`${text} ${url}`);
        toast.success("Link copied");
      }
    } catch { /* user cancelled */ }
  };

  if (error) {
    return (
      <div className="grid min-h-screen place-items-center bg-[#0B0B0B] px-6 text-center text-white">
        <div className="flex flex-col items-center gap-4" data-testid="passport-error">
          <Stamp className="h-10 w-10 text-[#E01E26]" />
          <p className="font-serif text-2xl">{error}</p>
          <button onClick={() => navigate("/")} className="rounded-full bg-[#E01E26] px-6 py-3 text-sm font-bold text-white hover:bg-[#FF2E38]">
            Deal your own fate
          </button>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="grid min-h-screen place-items-center bg-[#0B0B0B] text-[#A0A0A0]" data-testid="passport-loading">
        <div className="flex flex-col items-center gap-3">
          <Stamp className="h-8 w-8 animate-pulse text-[#E01E26]" />
          <p className="font-serif text-xl">Opening your passport…</p>
        </div>
      </div>
    );
  }

  const pct = data.total ? Math.round((data.stamped / data.total) * 100) : 0;
  const done = data.stamped >= data.total && data.total > 0;

  return (
    <div className="min-h-screen bg-[#F7F8F9] pb-16">
      <div className="mx-auto w-full max-w-2xl px-5 pt-6">
        <div className="mb-5 flex items-center justify-between">
          <Link to="/" className="inline-flex items-center gap-1.5 text-sm font-bold text-[#6B7075] hover:text-[#0E0E0E]" data-testid="passport-home-link">
            <ArrowLeft className="h-4 w-4" /> Fork·Fate
          </Link>
          <button onClick={share} data-testid="passport-share" className="inline-flex items-center gap-2 rounded-full border-2 border-[#0E0E0E] bg-white px-4 py-2 text-sm font-bold text-[#0E0E0E] hover:bg-[#EDEEF0]">
            <Share2 className="h-4 w-4" /> Share
          </button>
        </div>

        <div className="rounded-3xl border border-[#E2E4E7] bg-white p-6 shadow-sm">
          <p className="font-sans text-xs font-bold uppercase tracking-[0.2em] text-[#E01E26]">Fate Passport</p>
          <h1 className="mt-1 font-serif text-3xl font-bold text-[#0E0E0E]" data-testid="passport-title">
            {data.label || MODE_LABELS[data.mode] || "Fate Passport"}
          </h1>
          <p className="mt-1 font-sans text-sm text-[#6B7075]">
            Stamp each stop as you get there — take days or weeks. Code <span className="font-bold text-[#0E0E0E]">{data.code}</span>
          </p>

          <div className="mt-5 flex items-center gap-3">
            <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-[#EDEEF0]">
              <div className="h-full rounded-full bg-[#E01E26] transition-all" style={{ width: `${pct}%` }} />
            </div>
            <span className="font-serif text-lg font-bold text-[#0E0E0E]" data-testid="passport-progress">{data.stamped}/{data.total}</span>
          </div>

          {done && (
            <div className="mt-5 flex items-center gap-3 rounded-2xl border-2 border-[#F0A24E] bg-[#FBF3E7] p-4" data-testid="passport-complete-banner">
              <Trophy className="h-7 w-7 shrink-0 text-[#B26A12]" />
              <div>
                <p className="font-serif text-lg font-bold text-[#0E0E0E]">Passport complete</p>
                <p className="font-sans text-sm text-[#6B7075]">Every stop stamped. Share it and start another.</p>
              </div>
            </div>
          )}
        </div>

        <div className="mt-5 space-y-3">
          {data.stops.map((s, i) => {
            const on = stampedIds.has(s.id);
            const stamp = (data.stamps || []).find((x) => x.stop_id === s.id);
            return (
              <div
                key={s.id || i}
                data-testid={`passport-stop-${i}`}
                className={`rounded-2xl border p-4 transition-colors ${on ? "border-[#2E7D32]/40 bg-[#F1F8F2]" : "border-[#E2E4E7] bg-white"}`}
              >
                <div className="flex items-start gap-3">
                  <span className={`grid h-9 w-9 shrink-0 place-items-center rounded-full font-serif text-sm font-bold ${on ? "bg-[#2E7D32] text-white" : "bg-[#EDEEF0] text-[#6B7075]"}`}>
                    {on ? <Check className="h-4 w-4" /> : i + 1}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-serif text-lg font-bold text-[#0E0E0E]">{s.name}</p>
                    <p className="truncate font-sans text-sm text-[#6B7075]">
                      {[s.cuisine, s.price, s.distance != null ? `${s.distance} mi` : null].filter(Boolean).join(" · ")}
                    </p>
                    {on && (
                      <p className="mt-1 font-sans text-xs font-bold uppercase tracking-wider text-[#2E7D32]">
                        {stamp?.verified ? "Stamped on site" : "Stamped manually"}
                      </p>
                    )}
                  </div>
                </div>

                <div className="mt-3 flex flex-wrap gap-2">
                  <a
                    href={mapsUrl(s)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 rounded-full border border-[#E2E4E7] bg-white px-4 py-2 text-sm font-bold text-[#0E0E0E] hover:bg-[#EDEEF0]"
                  >
                    <MapPin className="h-4 w-4" /> Directions <ExternalLink className="h-3.5 w-3.5 text-[#9AA0A6]" />
                  </a>
                  {on ? (
                    <button
                      onClick={() => unstamp(s)}
                      disabled={busy === s.id}
                      data-testid={`passport-unstamp-${i}`}
                      className="inline-flex items-center gap-1.5 rounded-full border border-[#E2E4E7] bg-white px-4 py-2 text-sm font-bold text-[#6B7075] hover:bg-[#EDEEF0] disabled:opacity-60"
                    >
                      <Undo2 className="h-4 w-4" /> Undo stamp
                    </button>
                  ) : (
                    <>
                      <button
                        onClick={() => stampWithGps(s)}
                        disabled={busy === s.id}
                        data-testid={`passport-stamp-gps-${i}`}
                        className="inline-flex items-center gap-1.5 rounded-full bg-[#E01E26] px-4 py-2 text-sm font-bold text-white hover:bg-[#B3141A] disabled:opacity-60"
                      >
                        <LocateFixed className={`h-4 w-4 ${busy === s.id ? "animate-pulse" : ""}`} />
                        {busy === s.id ? "Checking…" : "I'm here — stamp it"}
                      </button>
                      <button
                        onClick={() => postStamp(s, { stop_id: s.id, source: "manual" })}
                        disabled={busy === s.id}
                        data-testid={`passport-stamp-manual-${i}`}
                        className="inline-flex items-center gap-1.5 rounded-full border border-[#E2E4E7] bg-white px-4 py-2 text-sm font-bold text-[#0E0E0E] hover:bg-[#EDEEF0] disabled:opacity-60"
                      >
                        <Stamp className="h-4 w-4" /> Stamp manually
                      </button>
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="mx-auto mt-8 w-full max-w-2xl px-5">
        <button
          onClick={deletePassport}
          disabled={busy === "delete"}
          data-testid="passport-delete"
          className={`inline-flex items-center gap-2 rounded-full border px-4 py-2.5 text-sm font-bold transition-colors disabled:opacity-60 ${
            confirmDelete ? "border-[#E01E26] bg-[#E01E26] text-white hover:bg-[#B3141A]" : "border-[#E2E4E7] bg-white text-[#6B7075] hover:bg-[#EDEEF0]"
          }`}
        >
          <Trash2 className="h-4 w-4" />
          {confirmDelete ? "Tap again to delete forever" : "Delete this passport"}
        </button>
        {confirmDelete && (
          <button onClick={() => setConfirmDelete(false)} className="ml-2 text-sm font-bold text-[#6B7075] underline">
            Cancel
          </button>
        )}
      </div>
    </div>
  );
}
