import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "./ui/dialog";
import { Stamp, MapPin, LocateFixed, Undo2, ExternalLink, Share2, ListOrdered, Map as MapIcon, Trophy, Check, Star, BookOpen } from "lucide-react";
import CrawlMap from "./CrawlMap";
import { useLang } from "../i18n/i18n";

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

/** Fresh-deal passport reveal: the same light "opaque window" as the crawl
 * reveal, right over the home page — stops, stamping (GPS or manual) and a
 * map tab. Selfies, the ID page and the award live on the full /p/CODE page. */
export default function PassportDialog({ open, code, initial = null, onClose }) {
  const { t } = useLang();
  const [data, setData] = useState(null);
  const [busy, setBusy] = useState("");
  const [view, setView] = useState("stops");

  useEffect(() => {
    if (!open || !code) return;
    setView("stops");
    // Freshly dealt passports arrive with their data in hand — no loading beat.
    if (initial && initial.code === code) { setData(initial); return; }
    setData(null);
    axios
      .get(`${API}/passports/${code}`)
      .then(({ data: d }) => setData(d))
      .catch(() => { toast.error(t("Couldn't open that passport")); onClose(); });
    // onClose/t/initial are stable enough for this fetch-on-open effect
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, code]);

  const stampedIds = new Set((data?.stamps || []).map((s) => s.stop_id));
  const done = !!data && data.stamped >= data.total && data.total > 0;
  const pct = data?.total ? Math.round((data.stamped / data.total) * 100) : 0;
  const mappable = (data?.stops || []).some((s) => s.lat != null && s.lng != null);
  const visitedMap = {};
  stampedIds.forEach((id) => { visitedMap[id] = true; });

  const postStamp = async (stop, body) => {
    setBusy(stop.id);
    try {
      const { data: d } = await axios.post(`${API}/passports/${code}/stamp`, body);
      setData(d);
      if (d.note) toast.warning(d.note);
      if (d.completed_at && d.stamped === d.total) toast.success(t("Passport complete — claim your award on the full passport!"));
      else toast.success(`${t("Stamped:")} ${stop.name}`);
    } catch (e) {
      const tooFar = e.response?.status === 409;
      toast.error(e.response?.data?.detail || t("Couldn't stamp that stop"), {
        action:
          tooFar && body.source === "gps"
            ? { label: t("Stamp anyway"), onClick: () => postStamp(stop, { stop_id: stop.id, source: "manual" }) }
            : undefined,
      });
    } finally {
      setBusy("");
    }
  };

  const stampWithGps = (stop) => {
    if (!navigator.geolocation) {
      toast.error(t("Location isn't supported here — use Stamp manually"));
      return;
    }
    setBusy(stop.id);
    navigator.geolocation.getCurrentPosition(
      (pos) => postStamp(stop, { stop_id: stop.id, lat: pos.coords.latitude, lng: pos.coords.longitude, accuracy: pos.coords.accuracy, source: "gps" }),
      () => {
        setBusy("");
        toast.error(t("Couldn't read your location — stamp manually instead"), {
          action: { label: t("Stamp manually"), onClick: () => postStamp(stop, { stop_id: stop.id, source: "manual" }) },
        });
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
      toast.error(t("Couldn't undo that stamp"));
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
        toast.success(t("Link copied"));
      }
    } catch (e) {
      if (e?.name !== "AbortError") toast.error(t("Couldn't share — try copying the link instead."));
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="ff-dialog-full flex w-screen max-w-full flex-col overflow-hidden rounded-none border-0 border-[#E2E4E7] bg-white/95 p-4 text-[#0E0E0E] backdrop-blur-xl sm:w-full sm:max-w-lg sm:rounded-lg sm:border sm:p-6" data-testid="passport-dialog" data-ff-dialog>
        <DialogHeader className="shrink-0 pr-8">
          <DialogTitle className="flex items-center gap-2 font-serif text-2xl">
            <Stamp className="h-6 w-6 text-[#2E7D32]" /> {data ? (data.label || MODE_LABELS[data.mode] || t("Fate Passport")) : t("Fate Passport")}
          </DialogTitle>
          <DialogDescription className="text-sm text-[#6B7075]">
            {t("A passport is collected over time — stamp each stop as you get there, over days or weeks.")}{" "}
            {t("Code")} <span className="font-bold text-[#0E0E0E]">{code}</span>
          </DialogDescription>
        </DialogHeader>

        {!data ? (
          <div className="grid min-h-[200px] flex-1 place-items-center text-[#6B7075]" data-testid="passport-dialog-loading">
            <div className="flex flex-col items-center gap-2">
              <Stamp className="h-7 w-7 animate-pulse text-[#2E7D32]" />
              <p className="font-serif text-lg">{t("Opening your passport…")}</p>
            </div>
          </div>
        ) : (
        <div className="relative flex min-h-0 flex-1 flex-col">
          <div className="mt-1 shrink-0" data-testid="passport-dialog-progress">
            <div className="mb-1 flex items-center justify-between text-xs font-bold text-[#6B7075]">
              <span>{data.stamped} / {data.total} {t("stamped")}</span>
              <span className="font-serif text-sm text-[#2E7D32]">{pct}%</span>
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-[#EDEEF0]">
              <div className="h-full rounded-full bg-[#2E7D32] transition-all duration-500" style={{ width: `${pct}%` }} />
            </div>
          </div>

          {mappable && (
            <div className="mt-3 flex shrink-0 gap-1 rounded-full border border-[#E2E4E7] bg-[#EDEEF0] p-1" data-testid="passport-view-tabs">
              <button
                onClick={() => setView("stops")}
                data-testid="passport-tab-stops"
                className={`inline-flex flex-1 items-center justify-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-bold transition-colors ${view === "stops" ? "bg-[#2E7D32] text-white" : "text-[#6B7075] hover:bg-white/60"}`}
              >
                <ListOrdered className="h-3.5 w-3.5" /> {t("Stops")}
              </button>
              <button
                onClick={() => setView("map")}
                data-testid="passport-tab-map"
                className={`inline-flex flex-1 items-center justify-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-bold transition-colors ${view === "map" ? "bg-[#2E7D32] text-white" : "text-[#6B7075] hover:bg-white/60"}`}
              >
                <MapIcon className="h-3.5 w-3.5" /> {t("Map")}
              </button>
            </div>
          )}

          {view === "map" && mappable ? (
            <div className="mt-3 min-h-0 flex-1" data-testid="passport-map-view">
              <CrawlMap stops={data.stops} visited={visitedMap} height="max(260px, 44vh)" />
              <p className="mt-2 text-center text-[11px] font-semibold text-[#6B7075]">
                {t("Numbered pins follow your quest — green means stamped.")}
              </p>
            </div>
          ) : (
          <div className="-mr-2 flex-1 space-y-0 overflow-y-auto pr-2">
            <p className="mt-2 flex items-center gap-1.5 text-[11px] font-semibold text-[#6B7075]">
              <Check className="h-3.5 w-3.5 text-[#2E7D32]" />
              {t("At each place, tap \u201CI'm here\u201D — or stamp it manually.")}
            </p>
            <div className="mt-3 space-y-2">
              {data.stops.map((s, i) => {
                const on = stampedIds.has(s.id);
                const stamp = (data.stamps || []).find((x) => x.stop_id === s.id);
                return (
                  <div key={s.id || i} className={`rounded-xl border p-3 transition-colors ${on ? "border-[#2E7D32]/40 bg-[#F1F8F2]" : "border-[#E2E4E7] bg-white"}`} data-testid={`passport-dialog-stop-${i}`}>
                    <div className="flex items-center gap-3">
                      <span className={`grid h-9 w-9 shrink-0 place-items-center rounded-full font-bold ${on ? "bg-[#2E7D32] text-white" : "bg-[#EDEEF0] text-[#6B7075]"}`}>
                        {on ? <Check className="h-5 w-5" /> : i + 1}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className={`truncate font-serif text-lg ${on ? "text-[#9AA0A6] line-through" : "text-[#0E0E0E]"}`}>{s.name}</p>
                        <p className="flex items-center gap-2 truncate text-xs text-[#6B7075]">
                          {s.rating ? <span className="inline-flex items-center gap-1"><Star className="h-3 w-3 fill-[#E01E26] text-[#E01E26]" />{s.rating}</span> : null}
                          {s.cuisine ? <span>· {s.cuisine}</span> : null}
                          {s.distance != null ? <span className="inline-flex items-center gap-1">· <MapPin className="h-3 w-3" />{s.distance} mi</span> : null}
                          {on ? <span className="text-[#2E7D32]">· {stamp?.verified ? t("On site") : t("Stamped")}</span> : null}
                        </p>
                      </div>
                      <a href={mapsUrl(s)} target="_blank" rel="noopener noreferrer" data-testid={`passport-dialog-directions-${i}`}
                        className="inline-flex items-center gap-1 rounded-full border border-[#E2E4E7] bg-white px-3 py-1.5 text-xs font-bold text-[#0E0E0E] hover:bg-[#EDEEF0]">
                        <ExternalLink className="h-3.5 w-3.5" /> {t("Map")}
                      </a>
                    </div>
                    <div className="mt-2.5 flex flex-wrap gap-2">
                      {on ? (
                        <button onClick={() => unstamp(s)} disabled={busy === s.id} data-testid={`passport-dialog-unstamp-${i}`}
                          className="inline-flex items-center gap-1.5 rounded-full border border-[#E2E4E7] bg-white px-4 py-1.5 text-xs font-bold text-[#6B7075] hover:bg-[#EDEEF0] disabled:opacity-60">
                          <Undo2 className="h-3.5 w-3.5" /> {t("Undo stamp")}
                        </button>
                      ) : (
                        <>
                          <button onClick={() => stampWithGps(s)} disabled={busy === s.id} data-testid={`passport-dialog-stamp-gps-${i}`}
                            className="inline-flex items-center gap-1.5 rounded-full bg-[#2E7D32] px-4 py-1.5 text-xs font-bold text-white hover:bg-[#25642A] disabled:opacity-60">
                            <LocateFixed className={`h-3.5 w-3.5 ${busy === s.id ? "animate-pulse" : ""}`} />
                            {busy === s.id ? t("Checking…") : t("I'm here — stamp it")}
                          </button>
                          <button onClick={() => postStamp(s, { stop_id: s.id, source: "manual" })} disabled={busy === s.id} data-testid={`passport-dialog-stamp-manual-${i}`}
                            className="inline-flex items-center gap-1.5 rounded-full border border-[#E2E4E7] bg-white px-4 py-1.5 text-xs font-bold text-[#0E0E0E] hover:bg-[#EDEEF0] disabled:opacity-60">
                            <Stamp className="h-3.5 w-3.5" /> {t("Stamp manually")}
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
            <p className="mt-3 rounded-xl bg-[#F1F8F2] px-3 py-2 text-[11px] font-semibold text-[#2E7D32]">
              {t("Selfies, your ID page and the stamped award live on the full passport.")}
            </p>
          </div>
          )}
        </div>
        )}

        <div className="mt-3 flex shrink-0 items-center gap-2">
          <Link to={`/p/${code}`} onClick={onClose} data-testid="passport-dialog-full-link"
            className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-full border border-[#E2E4E7] bg-white px-3 py-2 text-xs font-bold text-[#0E0E0E] hover:bg-[#EDEEF0] sm:px-5 sm:py-3 sm:text-sm">
            <BookOpen className="h-4 w-4" /> {t("Full passport")}
          </Link>
          <button onClick={share} disabled={!data} data-testid="passport-dialog-share"
            className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-full bg-[#E01E26] px-3 py-2 text-xs font-bold text-white hover:bg-[#FF2E38] disabled:opacity-40 sm:px-5 sm:py-3 sm:text-sm">
            <Share2 className="h-4 w-4" /> {t("Share")}
          </button>
        </div>
        {done && (
          <Link to={`/p/${code}`} onClick={onClose} data-testid="passport-dialog-claim"
            className="mt-1.5 inline-flex w-full items-center justify-center gap-2 rounded-full border border-[#2E7D32] bg-[#2E7D32] px-5 py-2 text-xs font-bold text-white transition-colors hover:bg-[#25642A] sm:py-3 sm:text-sm">
            <Trophy className="h-4 w-4" /> {t("Passport complete — claim your award")}
          </Link>
        )}
      </DialogContent>
    </Dialog>
  );
}
