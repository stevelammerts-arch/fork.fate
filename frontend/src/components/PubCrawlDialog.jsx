import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "./ui/dialog";
import { Beer, MapPin, Star, Shuffle, ExternalLink, X, Share2, Trophy, Users } from "lucide-react";
import { toast } from "sonner";
import CrawlBadgeDialog from "./CrawlBadgeDialog";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const shuffle = (arr) => {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
};

// Opens a "crawl" window: multiple nearby spots to hit in order. Can be shared
// with the group via a short link so everyone opens the same fixed route.
export default function PubCrawlDialog({ open, onClose, results, mode, shared = false }) {
  const maxStops = Math.min(6, results.length);
  const [route, setRoute] = useState([]);
  const [dropped, setDropped] = useState({});
  const [crew, setCrew] = useState("");
  const [sharing, setSharing] = useState(false);
  const [badgeOpen, setBadgeOpen] = useState(false);

  const reshuffle = () => {
    setRoute(shuffle(results).slice(0, maxStops));
    setDropped({});
  };

  useEffect(() => {
    if (!open) return;
    // Shared crawls are locked: everyone sees the same stops in the same order.
    if (shared) setRoute(results);
    else reshuffle();
    setDropped({});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, results, shared]);

  const stops = useMemo(() => route.filter((r) => !dropped[r.id]), [route, dropped]);
  const label = mode === "bars" ? "Pub Crawl" : `${mode?.[0]?.toUpperCase()}${mode?.slice(1)} Crawl`;

  const crewLine = crew.trim() ? ` with ${crew.trim()}` : "";

  const shareCrawl = async () => {
    if (!stops.length || sharing) return;
    setSharing(true);
    try {
      const { data } = await axios.post(`${API}/crawls`, {
        mode,
        stops: stops.map((s) => ({
          id: String(s.id ?? ""),
          name: s.name,
          cuisine: s.cuisine || "",
          price: s.price || "",
          rating: typeof s.rating === "number" ? s.rating : null,
          distance: s.distance != null && !isNaN(Number(s.distance)) ? Number(s.distance) : null,
          open_now: typeof s.open_now === "boolean" ? s.open_now : null,
          google_url: s.google_url || "",
        })),
      });
      const link = `${window.location.origin}/c/${data.code}`;
      const text = `Join my ${label}${crewLine} 🍺\n` +
        stops.map((s, i) => `${i + 1}. ${s.name}`).join("\n") +
        `\n\nSame crawl on your phone: ${link}`;
      if (navigator.share) {
        await navigator.share({ title: label, text, url: link });
      } else {
        await navigator.clipboard.writeText(text);
        toast.success("Crawl link copied — drop it in the group chat!");
      }
    } catch (e) {
      if (e?.name !== "AbortError") toast.error("Couldn't create a share link — try again");
    } finally {
      setSharing(false);
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
        <DialogContent className="max-h-[90vh] overflow-y-auto border-[#2A2A2A] bg-[#101010] text-white sm:max-w-lg" data-testid="pub-crawl-dialog">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 font-serif text-2xl">
              <Beer className="h-6 w-6 text-[#E01E26]" /> {shared ? `Group ${label}` : `Your ${label}`}
            </DialogTitle>
            <DialogDescription className="text-sm text-[#A0A0A0]">
              {shared
                ? `${stops.length} stop${stops.length !== 1 ? "s" : ""} — the same route your crew is running. Hit them in order and claim your badge.`
                : `${stops.length} stop${stops.length !== 1 ? "s" : ""} in a random hop order. Drop any you don't want, then share it with the crew.`}
            </DialogDescription>
          </DialogHeader>

          <div className="mt-2 space-y-2.5">
            {stops.map((s, i) => (
              <div key={s.id} className="flex items-center gap-3 rounded-xl border border-[#2A2A2A] bg-[#1A1A1A] p-3" data-testid={`crawl-stop-${i}`}>
                <div className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-[#E01E26] font-bold text-white">{i + 1}</div>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-serif text-lg text-white">{s.name}</p>
                  <p className="flex items-center gap-2 truncate text-xs text-[#A0A0A0]">
                    {s.rating ? <span className="inline-flex items-center gap-1"><Star className="h-3 w-3 fill-[#E01E26] text-[#E01E26]" />{s.rating}</span> : null}
                    {s.cuisine ? <span>· {s.cuisine}</span> : null}
                    {s.distance != null ? <span className="inline-flex items-center gap-1">· <MapPin className="h-3 w-3" />{s.distance} mi</span> : null}
                    {typeof s.open_now === "boolean" ? <span className={s.open_now ? "text-[#4ADE80]" : "text-[#8A8A8A]"}>· {s.open_now ? "Open" : "Closed"}</span> : null}
                  </p>
                </div>
                {s.google_url && (
                  <a href={s.google_url} target="_blank" rel="noopener noreferrer" data-testid={`crawl-directions-${i}`}
                    className="inline-flex items-center gap-1 rounded-full border border-[#3A3A3A] px-3 py-1.5 text-xs font-bold text-white hover:bg-white/10">
                    <ExternalLink className="h-3.5 w-3.5" /> Map
                  </a>
                )}
                {!shared && (
                  <button onClick={() => setDropped((d) => ({ ...d, [s.id]: true }))} data-testid={`crawl-drop-${i}`}
                    className="grid h-7 w-7 shrink-0 place-items-center rounded-full text-[#8A8A8A] hover:bg-white/10 hover:text-[#E01E26]" aria-label="Remove stop">
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>
            ))}
            {stops.length === 0 && (
              <p className="rounded-xl border border-dashed border-[#3A3A3A] p-6 text-center text-sm text-[#A0A0A0]">
                No stops selected — shuffle a fresh crawl below.
              </p>
            )}
          </div>

          <label className="mt-3 flex items-center gap-2 rounded-xl border border-[#2A2A2A] bg-[#1A1A1A] px-3 py-2.5">
            <Users className="h-4 w-4 shrink-0 text-[#8A8A8A]" />
            <input
              value={crew}
              onChange={(e) => setCrew(e.target.value.slice(0, 60))}
              placeholder="Who's with you? (e.g. Sam, Alex)"
              data-testid="crawl-crew-input"
              className="w-full bg-transparent text-sm text-white placeholder-[#6B7075] outline-none"
            />
          </label>

          <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
            {!shared && (
              <button onClick={reshuffle} data-testid="crawl-reshuffle-button"
                className="inline-flex flex-1 items-center justify-center gap-2 rounded-full border border-[#3A3A3A] px-5 py-3 text-sm font-bold text-white hover:bg-white/10">
                <Shuffle className="h-4 w-4" /> New crawl
              </button>
            )}
            <button onClick={shareCrawl} disabled={!stops.length || sharing} data-testid="crawl-share-button"
              className="inline-flex flex-1 items-center justify-center gap-2 rounded-full bg-[#E01E26] px-5 py-3 text-sm font-bold text-white hover:bg-[#FF2E38] disabled:opacity-40">
              <Share2 className="h-4 w-4" /> {sharing ? "Creating link…" : "Share with group"}
            </button>
          </div>

          <button onClick={() => setBadgeOpen(true)} disabled={!stops.length} data-testid="crawl-complete-button"
            className="mt-1 inline-flex w-full items-center justify-center gap-2 rounded-full border border-[#E01E26] px-5 py-3 text-sm font-bold text-[#E01E26] hover:bg-[#E01E26] hover:text-white disabled:opacity-40">
            <Trophy className="h-4 w-4" /> Complete crawl — claim your badge
          </button>
        </DialogContent>
      </Dialog>

      <CrawlBadgeDialog open={badgeOpen} onClose={() => setBadgeOpen(false)} mode={mode} defaultCrew={crew} />
    </>
  );
}
