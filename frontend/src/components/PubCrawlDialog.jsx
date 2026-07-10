import { useEffect, useMemo, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "./ui/dialog";
import { Beer, MapPin, Star, Shuffle, ExternalLink, Check, X, Share2 } from "lucide-react";
import { toast } from "sonner";

const shuffle = (arr) => {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
};

// Opens a "crawl" window: multiple nearby spots in a random hop order to pick from.
export default function PubCrawlDialog({ open, onClose, results, mode }) {
  const maxStops = Math.min(6, results.length);
  const [route, setRoute] = useState([]);
  const [dropped, setDropped] = useState({});

  const reshuffle = () => {
    setRoute(shuffle(results).slice(0, maxStops));
    setDropped({});
  };

  useEffect(() => {
    if (open) reshuffle();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, results]);

  const stops = useMemo(() => route.filter((r) => !dropped[r.id]), [route, dropped]);
  const label = mode === "bars" ? "Pub Crawl" : `${mode?.[0]?.toUpperCase()}${mode?.slice(1)} Crawl`;

  const shareCrawl = async () => {
    const text = `My ${label} 🍺\n` + stops.map((s, i) => `${i + 1}. ${s.name}${s.distance ? ` (${s.distance})` : ""}`).join("\n") + `\n\nvia Fork·Fate`;
    try {
      if (navigator.share) await navigator.share({ title: label, text });
      else { await navigator.clipboard.writeText(text); toast.success("Crawl copied — share it with the crew!"); }
    } catch (e) { /* user cancelled share */ }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-h-[88vh] overflow-y-auto border-[#2A2A2A] bg-[#101010] text-white sm:max-w-lg" data-testid="pub-crawl-dialog">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 font-serif text-2xl">
            <Beer className="h-6 w-6 text-[#E01E26]" /> Your {label}
          </DialogTitle>
        </DialogHeader>

        <DialogDescription className="text-sm text-[#A0A0A0]">
          {stops.length} stop{stops.length !== 1 && "s"} in a random hop order. Drop any you don't want, then hit the road.
        </DialogDescription>

        <div className="mt-2 space-y-2.5">
          {stops.map((s, i) => (
            <div key={s.id} className="flex items-center gap-3 rounded-xl border border-[#2A2A2A] bg-[#1A1A1A] p-3" data-testid={`crawl-stop-${i}`}>
              <div className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-[#E01E26] font-bold text-white">{i + 1}</div>
              <div className="min-w-0 flex-1">
                <p className="truncate font-serif text-lg text-white">{s.name}</p>
                <p className="flex items-center gap-2 truncate text-xs text-[#A0A0A0]">
                  {s.rating ? <span className="inline-flex items-center gap-1"><Star className="h-3 w-3 fill-[#E01E26] text-[#E01E26]" />{s.rating}</span> : null}
                  {s.cuisine ? <span>· {s.cuisine}</span> : null}
                  {s.distance ? <span className="inline-flex items-center gap-1">· <MapPin className="h-3 w-3" />{s.distance}</span> : null}
                  {typeof s.open_now === "boolean" ? <span className={s.open_now ? "text-[#4ADE80]" : "text-[#8A8A8A]"}>· {s.open_now ? "Open" : "Closed"}</span> : null}
                </p>
              </div>
              {s.google_url && (
                <a href={s.google_url} target="_blank" rel="noopener noreferrer" data-testid={`crawl-directions-${i}`}
                  className="inline-flex items-center gap-1 rounded-full border border-[#3A3A3A] px-3 py-1.5 text-xs font-bold text-white hover:bg-white/10">
                  <ExternalLink className="h-3.5 w-3.5" /> Map
                </a>
              )}
              <button onClick={() => setDropped((d) => ({ ...d, [s.id]: true }))} data-testid={`crawl-drop-${i}`}
                className="grid h-7 w-7 shrink-0 place-items-center rounded-full text-[#8A8A8A] hover:bg-white/10 hover:text-[#E01E26]" aria-label="Remove stop">
                <X className="h-4 w-4" />
              </button>
            </div>
          ))}
          {stops.length === 0 && (
            <p className="rounded-xl border border-dashed border-[#3A3A3A] p-6 text-center text-sm text-[#A0A0A0]">
              No stops selected — shuffle a fresh crawl below.
            </p>
          )}
        </div>

        <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
          <button onClick={reshuffle} data-testid="crawl-reshuffle-button"
            className="inline-flex flex-1 items-center justify-center gap-2 rounded-full bg-[#E01E26] px-5 py-3 text-sm font-bold text-white hover:bg-[#FF2E38]">
            <Shuffle className="h-4 w-4" /> Shuffle a new crawl
          </button>
          <button onClick={shareCrawl} disabled={!stops.length} data-testid="crawl-share-button"
            className="inline-flex flex-1 items-center justify-center gap-2 rounded-full border border-[#3A3A3A] px-5 py-3 text-sm font-bold text-white hover:bg-white/10 disabled:opacity-40 sm:flex-none">
            <Share2 className="h-4 w-4" /> Share crawl
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
