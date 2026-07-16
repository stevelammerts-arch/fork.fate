import { useEffect, useMemo, useRef, useState } from "react";
import axios from "axios";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "./ui/dialog";
import { Beer, MapPin, Star, Shuffle, ExternalLink, X, Share2, Trophy, Users, Check, Navigation, LocateFixed } from "lucide-react";
import { toast } from "sonner";
import CrawlBadgeDialog from "./CrawlBadgeDialog";
import CrawlMap from "./CrawlMap";
import { orderCrawlRoute as orderRoute, crawlHaversine as haversine } from "../pages/homeConstants";
import { useLang } from "../i18n/i18n";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;
const ARRIVE_RADIUS_MI = 0.06; // ~95m — close enough to count as "arrived"

const safeHttp = (u) => (typeof u === "string" && /^https?:\/\//i.test(u.trim()) ? u : "");

const shuffle = (arr) => {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
};

const dirUrl = (from, to) =>
  from?.lat != null && to?.lat != null
    ? `https://www.google.com/maps/dir/?api=1&origin=${from.lat},${from.lng}&destination=${to.lat},${to.lng}&travelmode=walking`
    : safeHttp(to?.google_url);

// Opens a "crawl" window: nearby spots ordered into a followable route. Can be
// shared with the group via a short link, and progress can be checked off (manual
// or auto via GPS) as the crew conquers each stop.
export default function PubCrawlDialog({ open, onClose, results, mode, origin, destination, shared = false, crawlLabel = "", initialStops = null }) {
  const { t } = useLang();
  const maxStops = Math.min(6, results.length);
  const [route, setRoute] = useState([]);
  const [dropped, setDropped] = useState({});
  const [visited, setVisited] = useState({});
  const [autoGps, setAutoGps] = useState(false);
  const [livePos, setLivePos] = useState(null);
  const [crew, setCrew] = useState("");
  const [sharing, setSharing] = useState(false);
  const [badgeOpen, setBadgeOpen] = useState(false);
  const watchRef = useRef(null);
  const promptedRef = useRef(false);

  const reshuffle = () => {
    setRoute(orderRoute(shuffle(results).slice(0, maxStops), origin, destination));
    setDropped({});
  };

  useEffect(() => {
    if (!open) return;
    // Shared crawls are locked: everyone sees the same route in the same order.
    if (shared) setRoute(results);
    // Fresh deal: use the exact ordered stops the reveal landed on (stop #1 = reveal card).
    else if (initialStops && initialStops.length) setRoute(initialStops);
    else setRoute(orderRoute(shuffle(results).slice(0, maxStops), origin, destination));
    setDropped({});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, results, shared, initialStops]);

  const stops = useMemo(() => route.filter((r) => !dropped[r.id]), [route, dropped]);
  const CRAWL_LABELS = { bars: "Pub Crawl", food: "Food Crawl", drinks: "Drinks Crawl", desserts: "Dessert Crawl", shops: "Shop Crawl" };
  const label = crawlLabel || t(CRAWL_LABELS[mode] || "Pub Crawl");
  const crewLine = crew.trim() ? ` ${t("with")} ${crew.trim()}` : "";

  // Persist check-off progress per unique route (per device).
  const progressKey = useMemo(() => "ffcp_" + route.map((s) => s.id).join("|"), [route]);
  useEffect(() => {
    try { setVisited(JSON.parse(localStorage.getItem(progressKey) || "{}")); } catch { setVisited({}); }
  }, [progressKey]);
  useEffect(() => {
    try { localStorage.setItem(progressKey, JSON.stringify(visited)); } catch { /* ignore */ }
  }, [visited, progressKey]);

  const visitedCount = stops.filter((s) => visited[s.id]).length;
  const allDone = stops.length > 0 && visitedCount === stops.length;

  // Auto-prompt the badge once the whole crawl is conquered.
  useEffect(() => {
    if (allDone && !promptedRef.current) {
      promptedRef.current = true;
      toast.success(t("Crawl conquered! ☠️ Claim your badge."));
      setBadgeOpen(true);
    }
    if (!allDone) promptedRef.current = false;
  }, [allDone]);

  // Auto GPS check-in: mark a stop visited when you get close enough.
  useEffect(() => {
    if (!autoGps || !navigator.geolocation) return;
    watchRef.current = navigator.geolocation.watchPosition(
      (pos) => {
        const p = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        setLivePos(p);
        setVisited((v) => {
          let changed = false; const nv = { ...v };
          for (const s of stops) {
            if (!nv[s.id] && s.lat != null && haversine(p, s) <= ARRIVE_RADIUS_MI) {
              nv[s.id] = true; changed = true;
              toast.success(`${t("Arrived at")} ${s.name} ✓`);
            }
          }
          return changed ? nv : v;
        });
      },
      () => { toast.error(t("Couldn't access location for auto check-in")); setAutoGps(false); },
      { enableHighAccuracy: true, maximumAge: 10000, timeout: 15000 }
    );
    return () => { if (watchRef.current != null) navigator.geolocation.clearWatch(watchRef.current); };
  }, [autoGps, stops]);

  const toggleVisited = (id) => setVisited((v) => ({ ...v, [id]: !v[id] }));

  useEffect(() => { if (!autoGps) setLivePos(null); }, [autoGps]);

  const shareCrawl = async () => {
    if (!stops.length || sharing) return;
    setSharing(true);
    try {
      const { data } = await axios.post(`${API}/crawls`, {
        mode,
        label,
        stops: stops.map((s) => ({
          id: String(s.id ?? ""),
          name: s.name,
          cuisine: s.cuisine || "",
          price: s.price || "",
          rating: typeof s.rating === "number" ? s.rating : null,
          distance: s.distance != null && !isNaN(Number(s.distance)) ? Number(s.distance) : null,
          lat: s.lat != null && !isNaN(Number(s.lat)) ? Number(s.lat) : null,
          lng: s.lng != null && !isNaN(Number(s.lng)) ? Number(s.lng) : null,
          open_now: typeof s.open_now === "boolean" ? s.open_now : null,
          google_url: s.google_url || "",
        })),
      });
      const link = `${window.location.origin}/c/${data.code}`;
      const text = `${t("Join my")} ${label}${crewLine} 🍺\n` +
        stops.map((s, i) => `${i + 1}. ${s.name}`).join("\n") +
        `\n\n${t("Same crawl on your phone:")} ${link}`;
      if (navigator.share) {
        await navigator.share({ title: label, text, url: link });
      } else {
        await navigator.clipboard.writeText(text);
        toast.success(t("Crawl link copied — drop it in the group chat!"));
      }
    } catch (e) {
      if (e?.name !== "AbortError") toast.error(t("Couldn't create a share link — try again"));
    } finally {
      setSharing(false);
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
        <DialogContent className="flex max-h-[92dvh] flex-col overflow-hidden border-[#2A2A2A] bg-[#101010] text-white sm:max-w-lg" data-testid="pub-crawl-dialog" data-ff-dialog>
          <DialogHeader className="shrink-0 pr-8">
            <DialogTitle className="flex items-center gap-2 font-serif text-2xl">
              <Beer className="h-6 w-6 text-[#E01E26]" /> {shared ? `${t("Group")} ${label}` : `${t("Your")} ${label}`}
            </DialogTitle>
            <DialogDescription className="text-sm text-[#A0A0A0]">
              {stops.length} {stops.length !== 1 ? t("stops") : t("stop")} {t("in a followable route — hit them in order, check each off, and claim your badge.")}
            </DialogDescription>
          </DialogHeader>

          <div className="ff-crawl-body -mr-2 flex-1 space-y-0 overflow-y-auto pr-2">
          {/* Route map */}
          {stops.length > 0 && (
            <div className="mt-2">
              <CrawlMap stops={stops} origin={origin} destination={destination} visited={visited} livePos={livePos} />
            </div>
          )}

          {/* Progress */}
          {stops.length > 0 && (
            <div className="mt-2" data-testid="crawl-progress">
              <div className="mb-1 flex items-center justify-between text-xs font-bold text-[#A0A0A0]">
                <span>{visitedCount} / {stops.length} {t("conquered")}</span>
                <button
                  onClick={() => setAutoGps((v) => !v)}
                  data-testid="crawl-autogps-toggle"
                  className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-[11px] font-bold transition-colors ${autoGps ? "border-[#4ADE80] bg-[#4ADE80]/15 text-[#4ADE80]" : "border-[#3A3A3A] text-white hover:bg-white/10"}`}
                >
                  <LocateFixed className="h-3.5 w-3.5" /> {autoGps ? t("Auto check-in ON") : t("Auto check-in")}
                </button>
              </div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-[#2A2A2A]">
                <div className="h-full rounded-full bg-[#E01E26] transition-all duration-500" style={{ width: `${stops.length ? (visitedCount / stops.length) * 100 : 0}%` }} />
              </div>
              <p className="mt-2 flex items-center gap-1.5 text-[11px] font-semibold text-[#8A8A8A]">
                <Check className="h-3.5 w-3.5 text-[#4ADE80]" />
                {t("Arrived? Tap the numbered circle on a stop to check it off.")}
              </p>
            </div>
          )}

          <div className="mt-3 space-y-0">
            {stops.map((s, i) => {
              const done = !!visited[s.id];
              const next = stops[i + 1];
              const leg = next ? haversine(s, next) : Infinity;
              return (
                <div key={`${s.id}-${i}`}>
                  <div className={`flex items-center gap-3 rounded-xl border p-3 transition-colors ${done ? "border-[#4ADE80]/40 bg-[#4ADE80]/5" : "border-[#2A2A2A] bg-[#1A1A1A]"}`} data-testid={`crawl-stop-${i}`}>
                    <button
                      onClick={() => toggleVisited(s.id)}
                      data-testid={`crawl-checkoff-${i}`}
                      aria-label={done ? t("Mark not visited") : t("Mark visited")}
                      className={`grid h-9 w-9 shrink-0 place-items-center rounded-full font-bold transition-colors ${done ? "bg-[#4ADE80] text-black" : "bg-[#E01E26] text-white hover:bg-[#FF2E38]"}`}
                    >
                      {done ? <Check className="h-5 w-5" /> : i + 1}
                    </button>
                    <div className="min-w-0 flex-1">
                      <p className={`truncate font-serif text-lg ${done ? "text-[#8A8A8A] line-through" : "text-white"}`}>{s.name}</p>
                      <p className="flex items-center gap-2 truncate text-xs text-[#A0A0A0]">
                        {s.rating ? <span className="inline-flex items-center gap-1"><Star className="h-3 w-3 fill-[#E01E26] text-[#E01E26]" />{s.rating}</span> : null}
                        {s.cuisine ? <span>· {s.cuisine}</span> : null}
                        {s.distance != null ? <span className="inline-flex items-center gap-1">· <MapPin className="h-3 w-3" />{s.distance} mi</span> : null}
                        {typeof s.open_now === "boolean" ? <span className={s.open_now ? "text-[#4ADE80]" : "text-[#8A8A8A]"}>· {s.open_now ? t("Open") : t("Closed")}</span> : null}
                      </p>
                    </div>
                    {safeHttp(s.google_url) && (
                      <a href={safeHttp(s.google_url)} target="_blank" rel="noopener noreferrer" data-testid={`crawl-directions-${i}`}
                        className="inline-flex items-center gap-1 rounded-full border border-[#3A3A3A] px-3 py-1.5 text-xs font-bold text-white hover:bg-white/10">
                        <ExternalLink className="h-3.5 w-3.5" /> {t("Map")}
                      </a>
                    )}
                    {!shared && (
                      <button onClick={() => setDropped((d) => ({ ...d, [s.id]: true }))} data-testid={`crawl-drop-${i}`}
                        className="grid h-7 w-7 shrink-0 place-items-center rounded-full text-[#8A8A8A] hover:bg-white/10 hover:text-[#E01E26]" aria-label={t("Remove stop")}>
                        <X className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                  {next && (
                    <a
                      href={dirUrl(s, next)}
                      target="_blank"
                      rel="noopener noreferrer"
                      data-testid={`crawl-leg-${i}`}
                      className="my-1 ml-4 flex items-center gap-2 pl-0.5 text-[11px] font-semibold text-[#8A8A8A] transition-colors hover:text-[#E01E26]"
                    >
                      <Navigation className="h-3.5 w-3.5" />
                      {t("Walk to next")}{leg !== Infinity ? ` · ${leg.toFixed(1)} mi` : ""}
                    </a>
                  )}
                </div>
              );
            })}
            {stops.length === 0 && (
              <p className="rounded-xl border border-dashed border-[#3A3A3A] p-6 text-center text-sm text-[#A0A0A0]">
                {t("No stops selected — shuffle a fresh crawl below.")}
              </p>
            )}
          </div>

          <label className="mt-3 flex items-center gap-2 rounded-xl border border-[#2A2A2A] bg-[#1A1A1A] px-3 py-2.5">
            <Users className="h-4 w-4 shrink-0 text-[#8A8A8A]" />
            <input
              value={crew}
              onChange={(e) => setCrew(e.target.value.slice(0, 60))}
              placeholder={t("Who's with you? (e.g. Sam, Alex)")}
              data-testid="crawl-crew-input"
              className="w-full bg-transparent text-sm text-white placeholder-[#6B7075] outline-none"
            />
          </label>
          </div>

          <div className="mt-4 flex shrink-0 flex-col gap-3 sm:flex-row sm:flex-wrap">
            {!shared && (
              <button onClick={reshuffle} data-testid="crawl-reshuffle-button"
                className="inline-flex flex-1 items-center justify-center gap-2 rounded-full border border-[#3A3A3A] px-5 py-3 text-sm font-bold text-white hover:bg-white/10">
                <Shuffle className="h-4 w-4" /> {t("New crawl")}
              </button>
            )}
            <button onClick={shareCrawl} disabled={!stops.length || sharing} data-testid="crawl-share-button"
              className="inline-flex flex-1 items-center justify-center gap-2 rounded-full bg-[#E01E26] px-5 py-3 text-sm font-bold text-white hover:bg-[#FF2E38] disabled:opacity-40">
              <Share2 className="h-4 w-4" /> {sharing ? t("Creating link…") : t("Share with group")}
            </button>
          </div>

          <button onClick={() => setBadgeOpen(true)} disabled={!allDone} data-testid="crawl-complete-button"
            className={`mt-1 inline-flex w-full items-center justify-center gap-2 rounded-full border px-5 py-3 text-sm font-bold transition-colors disabled:cursor-not-allowed disabled:opacity-40 ${allDone ? "border-[#4ADE80] bg-[#4ADE80] text-black hover:bg-[#3ecb70]" : "border-[#3A3A3A] text-[#8A8A8A]"}`}>
            <Trophy className="h-4 w-4" /> {allDone ? t("Crawl conquered — claim your badge") : `${t("Check off all stops to unlock")} (${visitedCount}/${stops.length})`}
          </button>
        </DialogContent>
      </Dialog>

      <CrawlBadgeDialog open={badgeOpen} onClose={() => setBadgeOpen(false)} mode={mode} crawlLabel={label} defaultCrew={crew} />
    </>
  );
}
