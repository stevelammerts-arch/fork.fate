import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import axios from "axios";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "./ui/dialog";
import { Beer, MapPin, Star, Shuffle, ExternalLink, X, Share2, Trophy, Users, Check, Navigation, LocateFixed, ChevronDown, ListOrdered, Map as MapIcon, Flame } from "lucide-react";
import { toast } from "sonner";
import { trackEvent } from "../lib/analytics";
import CrawlBadgeDialog from "./CrawlBadgeDialog";
import CrawlMap from "./CrawlMap";
import { orderCrawlRoute as orderRoute, crawlHaversine as haversine } from "../pages/homeConstants";
import { useLang } from "../i18n/i18n";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;
const ARRIVE_RADIUS_MI = 0.06; // ~95m — close enough to count as "arrived"
const MANUAL_MIN_GAP_MS = 30000; // min gap between manual check-ins (anti-cheat pacing)

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
export default function PubCrawlDialog({ open, onClose, results, mode, origin, destination, shared = false, crawlLabel = "", initialStops = null, code = null, onReshuffle = null }) {
  const { t } = useLang();
  const maxStops = Math.min(6, results.length);
  const [route, setRoute] = useState([]);
  const [dropped, setDropped] = useState({});
  const [visited, setVisited] = useState({});
  const [gpsVisited, setGpsVisited] = useState({}); // stops confirmed via GPS auto check-in (leaderboard-eligible)
  const [autoGps, setAutoGps] = useState(false);
  const [livePos, setLivePos] = useState(null);
  const [crew, setCrew] = useState("");
  const [view, setView] = useState("stops"); // "stops" | "map" — two switchable pages
  const [crewPos, setCrewPos] = useState([]); // other crew members' live pins
  const [sharing, setSharing] = useState(false);
  const [badgeOpen, setBadgeOpen] = useState(false);
  const [crawlCode, setCrawlCode] = useState(code || null);
  const [completion, setCompletion] = useState({ stops: 0, duration: null, verified: false, distance: null });
  const watchRef = useRef(null);
  const promptedRef = useRef(false);
  const lastManualRef = useRef(0);
  const crawlCodeRef = useRef(code || null);
  const creatingRef = useRef(null);
  const postedRef = useRef(new Set());
  // Scroll cue: new users don't know the stop list continues below the map.
  const bodyRef = useRef(null);
  const [moreBelow, setMoreBelow] = useState(false);
  const updateCue = useCallback(() => {
    const el = bodyRef.current;
    if (!el) return;
    setMoreBelow(el.scrollHeight - el.scrollTop - el.clientHeight > 48);
  }, []);

  useEffect(() => { setCrawlCode(code || null); crawlCodeRef.current = code || null; }, [code]);

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
    // The route must lock in when the dialog opens — reshuffling because the
    // parent re-rendered with a new origin/destination object identity would
    // scramble a crawl already in progress.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, results, shared, initialStops]);

  const stops = useMemo(() => route.filter((r) => !dropped[r.id]), [route, dropped]);
  useEffect(() => {
    if (!open) return;
    const id = setTimeout(updateCue, 400);
    return () => clearTimeout(id);
  }, [open, stops.length, view, updateCue]);
  const CRAWL_LABELS = { bars: "Pub Crawl", food: "Food Crawl", drinks: "Drinks Crawl", desserts: "Dessert Crawl", shops: "Shop Crawl" };
  const label = crawlLabel || t(CRAWL_LABELS[mode] || "Pub Crawl");
  const crewLine = crew.trim() ? ` ${t("with")} ${crew.trim()}` : "";

  // Persist check-off progress per unique route (per device).
  const progressKey = useMemo(() => "ffcp_" + route.map((s) => s.id).join("|"), [route]);
  const gpsKey = useMemo(() => progressKey + "_gps", [progressKey]);
  useEffect(() => {
    try { setVisited(JSON.parse(localStorage.getItem(progressKey) || "{}")); } catch { setVisited({}); }
    try { setGpsVisited(JSON.parse(localStorage.getItem(gpsKey) || "{}")); } catch { setGpsVisited({}); }
  }, [progressKey, gpsKey]);
  useEffect(() => {
    try { localStorage.setItem(progressKey, JSON.stringify(visited)); } catch { /* ignore */ }
  }, [visited, progressKey]);
  useEffect(() => {
    try { localStorage.setItem(gpsKey, JSON.stringify(gpsVisited)); } catch { /* ignore */ }
  }, [gpsVisited, gpsKey]);

  const visitedCount = stops.filter((s) => visited[s.id]).length;
  const allDone = stops.length > 0 && visitedCount === stops.length;
  // First unvisited stop: gets a "Start here / Next" marker so new users know
  // exactly where the crawl begins.
  const nextIdx = stops.findIndex((s) => !visited[s.id]);
  // Leaderboard-eligible only when EVERY conquered stop was confirmed by GPS.
  const crawlVerified = allDone && stops.every((s) => gpsVisited[s.id]);

  // Total route distance (miles) for the server-side speed sanity check.
  const routeDistance = useMemo(() => {
    const pts = stops.filter((s) => s.lat != null && s.lng != null);
    let d = 0;
    if (origin?.lat != null && pts[0]) d += haversine(origin, pts[0]);
    for (let i = 0; i < pts.length - 1; i++) d += haversine(pts[i], pts[i + 1]);
    return Math.round(d * 100) / 100;
  }, [stops, origin]);

  // Silently time the crawl: start clock on the first check-in (no visible timer).
  const startKey = useMemo(() => progressKey + "_start", [progressKey]);
  useEffect(() => {
    if (visitedCount > 0) {
      try { if (!localStorage.getItem(startKey)) localStorage.setItem(startKey, String(Date.now())); } catch { /* ignore */ }
    }
  }, [visitedCount, startKey]);

  const openBadge = useCallback(() => {
    let duration = null;
    try {
      const s = Number(localStorage.getItem(startKey));
      if (s > 0) duration = Math.max(1, Math.round((Date.now() - s) / 1000));
    } catch { /* ignore */ }
    setCompletion({ stops: stops.length, duration, verified: crawlVerified, distance: routeDistance });
    setBadgeOpen(true);
  }, [startKey, stops.length, crawlVerified, routeDistance]);

  // Auto-prompt the badge once the whole crawl is conquered.
  useEffect(() => {
    if (allDone && !promptedRef.current) {
      promptedRef.current = true;
      toast.success(t("Crawl conquered! ☠️ Claim your badge."));
      openBadge();
    }
    if (!allDone) promptedRef.current = false;
  }, [allDone, openBadge, t]);

  // Auto GPS check-in: mark a stop visited when you get close enough.
  // postCheckin goes through a ref: recreating the geolocation watch every
  // time its identity changes would risk dropping an arrival mid-crawl.
  const postCheckinRef = useRef(null);
  useEffect(() => {
    if (!autoGps || !navigator.geolocation) return;
    watchRef.current = navigator.geolocation.watchPosition(
      (pos) => {
        const p = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        setLivePos(p);
        setVisited((v) => {
          let changed = false; const nv = { ...v };
          const arrived = [];
          for (const s of stops) {
            if (!nv[s.id] && s.lat != null && haversine(p, s) <= ARRIVE_RADIUS_MI) {
              nv[s.id] = true; changed = true;
              arrived.push(s);
              toast.success(`${t("Arrived at")} ${s.name} ✓`);
            }
          }
          if (arrived.length) {
            setGpsVisited((g) => ({ ...g, ...Object.fromEntries(arrived.map((s) => [s.id, true])) }));
            arrived.forEach((s) => postCheckinRef.current?.(s, "gps", p));
          }
          return changed ? nv : v;
        });
      },
      () => { toast.error(t("Couldn't access location for auto check-in")); setAutoGps(false); },
      { enableHighAccuracy: true, maximumAge: 10000, timeout: 15000 }
    );
    return () => { if (watchRef.current != null) navigator.geolocation.clearWatch(watchRef.current); };
  }, [autoGps, stops, t]);

  // Manual check-in is paced (anti-cheat) and never counts as GPS-verified, so it
  // earns the badge but won't rank. Unchecking is always allowed.
  const toggleVisited = (id) => {
    const isOn = !!visited[id];
    if (!isOn) {
      const now = Date.now();
      const gap = now - lastManualRef.current;
      if (gap < MANUAL_MIN_GAP_MS) {
        const wait = Math.ceil((MANUAL_MIN_GAP_MS - gap) / 1000);
        toast.error(`${t("Slow down — wait")} ${wait}s ${t("before checking off the next stop.")}`);
        return;
      }
      lastManualRef.current = now;
      setVisited((v) => ({ ...v, [id]: true }));
      setGpsVisited((g) => { if (!g[id]) return g; const ng = { ...g }; delete ng[id]; return ng; });
      const stop = stops.find((s) => s.id === id);
      if (stop) postCheckin(stop, "manual");
    } else {
      setVisited((v) => ({ ...v, [id]: false }));
      setGpsVisited((g) => { if (!g[id]) return g; const ng = { ...g }; delete ng[id]; return ng; });
    }
  };

  useEffect(() => { if (!autoGps) setLivePos(null); }, [autoGps]);

  // Live crew pins (shared crawls only): broadcast my GPS position at most
  // every 20s while auto check-in is on, and poll everyone else's pins while
  // the dialog is open. Positions are ephemeral server-side (15 min TTL).
  const memberIdRef = useRef(null);
  if (!memberIdRef.current) {
    try {
      let id = localStorage.getItem("ff_member_id");
      if (!id) { id = Math.random().toString(36).slice(2, 12); localStorage.setItem("ff_member_id", id); }
      memberIdRef.current = id;
    } catch (e) { memberIdRef.current = Math.random().toString(36).slice(2, 12); }
  }
  const lastPosPostRef = useRef(0);
  useEffect(() => {
    if (!livePos || !crawlCode) return;
    const now = Date.now();
    if (now - lastPosPostRef.current < 20000) return;
    lastPosPostRef.current = now;
    const myName = (crew.trim().split(/[,&]/)[0] || "").slice(0, 16) || t("Crew");
    axios.post(`${API}/crawls/${crawlCode}/position`, {
      member_id: memberIdRef.current, name: myName, lat: livePos.lat, lng: livePos.lng,
    }).catch(() => {});
  }, [livePos, crawlCode, crew, t]);
  useEffect(() => {
    if (!open || !crawlCode) return;
    let stopped = false;
    const load = async () => {
      try {
        const { data } = await axios.get(`${API}/crawls/${crawlCode}/positions`);
        if (stopped) return;
        setCrewPos((data.positions || []).filter((p) => p.member_id !== memberIdRef.current));
        setFlares(data.flares || []); // everyone's flares, including my own
      } catch (e) { /* transient */ }
    };
    load();
    const id = setInterval(load, 20000);
    return () => { stopped = true; clearInterval(id); };
  }, [open, crawlCode]);

  // "Flare on me": pop a bright beacon at my spot that the whole crew sees.
  const [flares, setFlares] = useState([]);
  const [flareBusy, setFlareBusy] = useState(false);
  const popFlare = async () => {
    if (!livePos || !crawlCode || flareBusy) return;
    setFlareBusy(true);
    const myName = (crew.trim().split(/[,&]/)[0] || "").slice(0, 16) || t("Crew");
    try {
      await axios.post(`${API}/crawls/${crawlCode}/flare`, {
        member_id: memberIdRef.current, name: myName, lat: livePos.lat, lng: livePos.lng,
      });
      setFlares((prev) => [
        ...prev.filter((f) => f.member_id !== memberIdRef.current),
        { member_id: memberIdRef.current, name: myName, lat: livePos.lat, lng: livePos.lng },
      ]);
      toast.success(t("Flare popped! Your crew can see you on the map for the next few minutes."));
      trackEvent("crawl_flare", {});
    } catch (e) {
      toast.error(t("Couldn't pop the flare — try again."));
    } finally {
      setTimeout(() => setFlareBusy(false), 5000); // gentle spam brake
    }
  };

  const buildStopsPayload = () =>
    stops.map((s) => ({
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
    }));

  // The server derives leaderboard eligibility from GPS check-ins keyed by crawl
  // code, so a crawl must exist server-side before we can log arrivals. Created
  // silently on the first check-in (no share link is surfaced to the user).
  // Concurrent callers share the in-flight request so we never create two crawls.
  const ensureCrawlCode = async () => {
    if (crawlCodeRef.current) return crawlCodeRef.current;
    if (creatingRef.current) return creatingRef.current;
    creatingRef.current = (async () => {
      const { data } = await axios.post(`${API}/crawls`, { mode, label, stops: buildStopsPayload() });
      crawlCodeRef.current = data.code;
      setCrawlCode(data.code);
      return data.code;
    })();
    try {
      return await creatingRef.current;
    } finally {
      creatingRef.current = null;
    }
  };

  // Fire-and-forget: a failed check-in must never block the crawl UI. Worst case
  // the run simply doesn't qualify as verified.
  const postCheckin = async (stop, source, pos) => {
    const key = `${source}:${stop.id}`;
    if (postedRef.current.has(key)) return;
    postedRef.current.add(key);
    try {
      const c = await ensureCrawlCode();
      if (!c) return;
      await axios.post(`${API}/crawls/${c}/checkin`, {
        stop_id: String(stop.id ?? ""),
        stop_index: Math.max(0, stops.findIndex((s) => s.id === stop.id)),
        lat: pos?.lat ?? (stop.lat != null ? Number(stop.lat) : null),
        lng: pos?.lng ?? (stop.lng != null ? Number(stop.lng) : null),
        source,
      });
    } catch (e) {
      postedRef.current.delete(key); // allow a later retry
      console.debug("check-in not recorded:", e);
    }
  };
  postCheckinRef.current = postCheckin;

  const shareCrawl = async () => {
    if (!stops.length || sharing) return;
    setSharing(true);
    try {
      // Reuse the code if check-ins already created this crawl, so the shared
      // link and the recorded arrivals refer to the same crawl.
      const shareCode = await ensureCrawlCode();
      const link = `${window.location.origin}/c/${shareCode}`;
      const text = `${t("Join my")} ${label}${crewLine} 🍺\n` +
        stops.map((s, i) => `${i + 1}. ${s.name}`).join("\n") +
        `\n\n${t("Same crawl on your phone:")} ${link}`;
      // Link is created — from here, never dead-end: try native share, then
      // fall back to clipboard (Web Share API is flaky inside PWAs / Android TWA).
      if (navigator.share) {
        try {
          await navigator.share({ title: label, text, url: link });
        } catch (shareErr) {
          if (shareErr?.name === "AbortError") return; // user cancelled — do nothing
          try {
            await navigator.clipboard.writeText(text);
            toast.success(t("Crawl link copied — drop it in the group chat!"));
          } catch {
            toast.success(`${t("Your crawl link:")} ${link}`);
          }
        }
      } else {
        try {
          await navigator.clipboard.writeText(text);
          toast.success(t("Crawl link copied — drop it in the group chat!"));
        } catch {
          toast.success(`${t("Your crawl link:")} ${link}`);
        }
      }
    } catch (e) {
      toast.error(t("Couldn't create a share link — try again"));
    } finally {
      setSharing(false);
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
        <DialogContent className="flex h-dvh max-h-dvh w-screen max-w-full flex-col overflow-hidden rounded-none border-0 border-[#E2E4E7] bg-white/95 p-4 text-[#0E0E0E] backdrop-blur-xl sm:h-auto sm:max-h-[92dvh] sm:w-full sm:max-w-lg sm:rounded-lg sm:border sm:p-6" data-testid="pub-crawl-dialog" data-ff-dialog>
          <DialogHeader className="shrink-0 pr-8">
            <DialogTitle className="flex items-center gap-2 font-serif text-2xl">
              <Beer className="h-6 w-6 text-[#E01E26]" /> {shared ? `${t("Group")} ${label}` : `${t("Your")} ${label}`}
            </DialogTitle>
            <DialogDescription className="text-sm text-[#6B7075]">
              {stops.length} {stops.length !== 1 ? t("stops") : t("stop")} {t("in a followable route — hit them in order, check each off, and claim your badge.")}
            </DialogDescription>
          </DialogHeader>

          <div className="relative flex min-h-0 flex-1 flex-col">
          {/* Progress — always visible on both pages */}
          {stops.length > 0 && (
            <div className="mt-2 shrink-0" data-testid="crawl-progress">
              <div className="mb-1 flex items-center justify-between text-xs font-bold text-[#6B7075]">
                <span>{visitedCount} / {stops.length} {t("conquered")}</span>
                <button
                  onClick={() => setAutoGps((v) => !v)}
                  data-testid="crawl-autogps-toggle"
                  className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-[11px] font-bold transition-colors ${autoGps ? "border-[#2E7D32] bg-[#2E7D32]/10 text-[#2E7D32]" : "border-[#E2E4E7] text-[#0E0E0E] hover:bg-[#EDEEF0]"}`}
                >
                  <LocateFixed className="h-3.5 w-3.5" /> {autoGps ? t("Auto check-in ON") : t("Auto check-in")}
                </button>
              </div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-[#EDEEF0]">
                <div className="h-full rounded-full bg-[#E01E26] transition-all duration-500" style={{ width: `${stops.length ? (visitedCount / stops.length) * 100 : 0}%` }} />
              </div>
            </div>
          )}

          {/* Stops / Map page switch */}
          {stops.length > 0 && (
            <div className="mt-3 flex shrink-0 gap-1 rounded-full border border-[#E2E4E7] bg-[#EDEEF0] p-1" data-testid="crawl-view-tabs">
              <button
                onClick={() => setView("stops")}
                data-testid="crawl-tab-stops"
                className={`inline-flex flex-1 items-center justify-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-bold transition-colors ${view === "stops" ? "bg-[#E01E26] text-white" : "text-[#6B7075] hover:bg-white/60"}`}
              >
                <ListOrdered className="h-3.5 w-3.5" /> {t("Stops")}
              </button>
              <button
                onClick={() => setView("map")}
                data-testid="crawl-tab-map"
                className={`inline-flex flex-1 items-center justify-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-bold transition-colors ${view === "map" ? "bg-[#E01E26] text-white" : "text-[#6B7075] hover:bg-white/60"}`}
              >
                <MapIcon className="h-3.5 w-3.5" /> {t("Map")}
              </button>
            </div>
          )}

          {view === "map" && stops.length > 0 ? (
            <div className="mt-3 min-h-0 flex-1" data-testid="crawl-map-view">
              <CrawlMap stops={stops} origin={origin} destination={destination} visited={visited} livePos={livePos} crew={crewPos} flares={flares} height="max(260px, 44dvh)" />
              <p className="mt-2 text-center text-[11px] font-semibold text-[#6B7075]">
                {crewPos.length > 0
                  ? `${crewPos.length} ${crewPos.length === 1 ? t("crew pin live — blue dots are your people.") : t("crew pins live — blue dots are your people.")}`
                  : t("Numbered pins follow your route — green means conquered.")}
              </p>
              {crawlCode && (
                <button
                  onClick={popFlare}
                  disabled={!livePos || flareBusy}
                  data-testid="crawl-flare-button"
                  className="mx-auto mt-2 flex items-center gap-1.5 rounded-full border border-[#FF7A1A]/60 bg-[#FF7A1A]/10 px-4 py-2 text-xs font-bold text-[#B25012] transition-colors hover:bg-[#FF7A1A]/20 disabled:opacity-40"
                >
                  <Flame className="h-4 w-4" /> {livePos ? t("Flare on me — show the crew where I am") : t("Turn on location to pop a flare")}
                </button>
              )}
            </div>
          ) : (
          <>
          <div ref={bodyRef} onScroll={updateCue} className="ff-crawl-body -mr-2 flex-1 space-y-0 overflow-y-auto pr-2">
          {stops.length > 0 && (
            <p className="mt-2 flex items-center gap-1.5 text-[11px] font-semibold text-[#6B7075]">
              <Check className="h-3.5 w-3.5 text-[#2E7D32]" />
              {t("Arrived? Tap the numbered circle on a stop to check it off.")}
            </p>
          )}

          <div className="mt-3 space-y-0">
            {stops.map((s, i) => {
              const done = !!visited[s.id];
              const next = stops[i + 1];
              const leg = next ? haversine(s, next) : Infinity;
              return (
                <div key={`${s.id}-${i}`}>
                  <div className={`flex items-center gap-3 rounded-xl border p-3 transition-colors ${done ? "border-[#2E7D32]/40 bg-[#F1F8F2]" : "border-[#E2E4E7] bg-white"}`} data-testid={`crawl-stop-${i}`}>
                    <button
                      onClick={() => toggleVisited(s.id)}
                      data-testid={`crawl-checkoff-${i}`}
                      aria-label={done ? t("Mark not visited") : t("Mark visited")}
                      className={`grid h-9 w-9 shrink-0 place-items-center rounded-full font-bold transition-colors ${done ? "bg-[#2E7D32] text-white" : `bg-[#E01E26] text-white hover:bg-[#FF2E38]${i === nextIdx ? " ring-4 ring-[#E01E26]/30" : ""}`}`}
                    >
                      {done ? <Check className="h-5 w-5" /> : i + 1}
                    </button>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <p className={`truncate font-serif text-lg ${done ? "text-[#9AA0A6] line-through" : "text-[#0E0E0E]"}`}>{s.name}</p>
                        {i === nextIdx && !done && (
                          <span className="shrink-0 rounded-full bg-[#E01E26]/20 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-[#FF6B71]" data-testid={`crawl-next-chip-${i}`}>
                            {visitedCount === 0 ? t("Start here") : t("Next")}
                          </span>
                        )}
                      </div>
                      <p className="flex items-center gap-2 truncate text-xs text-[#6B7075]">
                        {s.rating ? <span className="inline-flex items-center gap-1"><Star className="h-3 w-3 fill-[#E01E26] text-[#E01E26]" />{s.rating}</span> : null}
                        {s.cuisine ? <span>· {s.cuisine}</span> : null}
                        {s.distance != null ? <span className="inline-flex items-center gap-1">· <MapPin className="h-3 w-3" />{s.distance} mi</span> : null}
                        {typeof s.open_now === "boolean" ? <span className={s.open_now ? "text-[#2E7D32]" : "text-[#9AA0A6]"}>· {s.open_now ? t("Open") : t("Closed")}</span> : null}
                      </p>
                    </div>
                    {safeHttp(s.google_url) && (
                      <a href={safeHttp(s.google_url)} target="_blank" rel="noopener noreferrer" data-testid={`crawl-directions-${i}`}
                        className="inline-flex items-center gap-1 rounded-full border border-[#E2E4E7] bg-white px-3 py-1.5 text-xs font-bold text-[#0E0E0E] hover:bg-[#EDEEF0]">
                        <ExternalLink className="h-3.5 w-3.5" /> {t("Map")}
                      </a>
                    )}
                    {!shared && (
                      <button onClick={() => setDropped((d) => ({ ...d, [s.id]: true }))} data-testid={`crawl-drop-${i}`}
                        className="grid h-7 w-7 shrink-0 place-items-center rounded-full text-[#9AA0A6] hover:bg-[#EDEEF0] hover:text-[#E01E26]" aria-label={t("Remove stop")}>
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
                      className="my-1 ml-4 flex items-center gap-2 pl-0.5 text-[11px] font-semibold text-[#6B7075] transition-colors hover:text-[#E01E26]"
                    >
                      <Navigation className="h-3.5 w-3.5" />
                      {t("Walk to next")}{leg !== Infinity ? ` · ${leg.toFixed(1)} mi` : ""}
                    </a>
                  )}
                </div>
              );
            })}
            {stops.length === 0 && (
              <p className="rounded-xl border border-dashed border-[#D5D8DC] p-6 text-center text-sm text-[#6B7075]">
                {t("No stops selected — shuffle a fresh crawl below.")}
              </p>
            )}
          </div>

          <label className="mt-3 flex items-center gap-2 rounded-xl border border-[#E2E4E7] bg-white px-3 py-2.5">
            <Users className="h-4 w-4 shrink-0 text-[#9AA0A6]" />
            <input
              value={crew}
              onChange={(e) => setCrew(e.target.value.slice(0, 60))}
              placeholder={t("Who's with you? (e.g. Sam, Alex)")}
              data-testid="crawl-crew-input"
              className="w-full bg-transparent text-sm text-[#0E0E0E] placeholder-[#9AA0A6] outline-none"
            />
          </label>
          </div>
          {moreBelow && (
            <div className="pointer-events-none absolute inset-x-0 bottom-0 flex justify-center bg-gradient-to-t from-white via-white/70 to-transparent pb-1.5 pt-10" data-testid="crawl-scroll-cue">
              <span className="flex animate-bounce items-center gap-1 rounded-full bg-[#0E0E0E]/70 px-3 py-1 text-[11px] font-bold text-white backdrop-blur">
                <ChevronDown className="h-3.5 w-3.5" /> {t("Your stops")}
              </span>
            </div>
          )}
          </>
          )}
          </div>

          <div className="mt-3 flex shrink-0 items-center gap-2">
            {!shared && (
              <button onClick={() => (onReshuffle ? onReshuffle() : reshuffle())} data-testid="crawl-reshuffle-button"
                className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-full border border-[#E2E4E7] bg-white px-3 py-2 text-xs font-bold text-[#0E0E0E] hover:bg-[#EDEEF0] sm:px-5 sm:py-3 sm:text-sm">
                <Shuffle className="h-4 w-4" /> {t("New crawl")}
              </button>
            )}
            <button onClick={shareCrawl} disabled={!stops.length || sharing} data-testid="crawl-share-button"
              className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-full bg-[#E01E26] px-3 py-2 text-xs font-bold text-white hover:bg-[#FF2E38] disabled:opacity-40 sm:px-5 sm:py-3 sm:text-sm">
              <Share2 className="h-4 w-4" /> {sharing ? t("Creating link…") : t("Share with group")}
            </button>
          </div>

          <button onClick={openBadge} disabled={!allDone} data-testid="crawl-complete-button"
            className={`mt-1.5 inline-flex w-full items-center justify-center gap-2 rounded-full border px-5 py-2 text-xs font-bold transition-colors disabled:cursor-not-allowed disabled:opacity-40 sm:py-3 sm:text-sm ${allDone ? "border-[#2E7D32] bg-[#2E7D32] text-white hover:bg-[#25642A]" : "border-[#E2E4E7] text-[#9AA0A6]"}`}>
            <Trophy className="h-4 w-4" /> {allDone ? t("Crawl conquered — claim your badge") : `${t("Check off all stops to unlock")} (${visitedCount}/${stops.length})`}
          </button>
        </DialogContent>
      </Dialog>

      <CrawlBadgeDialog open={badgeOpen} onClose={() => setBadgeOpen(false)} mode={mode} crawlLabel={label} defaultCrew={crew}
        stops={completion.stops} durationSeconds={completion.duration} crawlCode={crawlCode}
        verified={completion.verified} distance={completion.distance} />
    </>
  );
}
