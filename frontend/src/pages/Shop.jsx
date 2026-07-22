import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { ArrowLeft, BellRing, Shirt, Coffee, Image as ImageIcon, Sticker, Sparkles } from "lucide-react";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "../components/ui/dialog";
import { trackEvent } from "../lib/analytics";
import { useLang } from "../i18n/i18n";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;
const FRONT = "/merch-front-logo.jpg";

const DESIGNS = [
  { key: "dragon-scene",   theme: "Dragon's Hoard", style: "Scene",    back: "/merch-scene-dragon.jpg",      accent: "#E6B23A", blurb: "The red dragon brooding over its glittering hoard." },
  { key: "reaper-crypt",   theme: "The Reaper",     style: "Crypt",    back: "/merch-scene-reaper-env.jpg",  accent: "#E01E26", blurb: "The Reaper serving fate in his moonlit graveyard." },
  { key: "reaper-classic", theme: "The Reaper",     style: "Classic",  back: "/merch-reaper.jpg",            accent: "#E01E26", blurb: "The gothic Reaper crest — bold and iconic." },
  { key: "cyber-scene",    theme: "Neon Nights",    style: "Scene",    back: "/merch-scene-cyber.jpg",       accent: "#22E0E0", front: "/merch-front-cyber.jpg", blurb: "A rain-slicked neon skyline that never sleeps." },
  { key: "dragon-classic", theme: "Dragon's Hoard", style: "Classic",  back: "/merch-dragon.jpg",            accent: "#E6B23A", blurb: "A fierce dragon over gold — big-print statement." },
  { key: "tiki-scene",     theme: "Tiki Lounge",    style: "Scene",    back: "/merch-scene-tiki.jpg",        accent: "#F0A24E", blurb: "Warm torchlit tiki bar, straight off the island." },
  { key: "cyber-classic",  theme: "Neon Nights",    style: "Classic",  back: "/merch-cyber.jpg",             accent: "#22E0E0", front: "/merch-front-cyber.jpg", blurb: "Neon fork + skyline synthwave graphic." },
  { key: "tiki-classic",   theme: "Tiki Lounge",    style: "Classic",  back: "/merch-tiki.jpg",              accent: "#F0A24E", blurb: "Carved tiki mask + palms — tropical bold." },
];

const PRODUCTS = [
  { k: "tee", n: "Tee", p: 28, Icon: Shirt },
  { k: "hoodie", n: "Hoodie", p: 52, Icon: Shirt },
  { k: "mug", n: "Mug", p: 18, Icon: Coffee },
  { k: "poster", n: "Poster", p: 24, Icon: ImageIcon },
  { k: "sticker", n: "Sticker", p: 6, Icon: Sticker },
];
const SIZES = ["S", "M", "L", "XL", "XXL"];

export default function Shop() {
  const { t } = useLang();
  const [active, setActive] = useState(null);
  const [email, setEmail] = useState("");
  const [sending, setSending] = useState(false);
  const [highlight, setHighlight] = useState("");

  useEffect(() => {
    const key = (window.location.hash || "").replace("#", "");
    if (!key) return;
    setHighlight(key);
    const s1 = setTimeout(() => {
      const el = document.querySelector(`[data-testid="shop-design-${key}"]`);
      if (el) el.scrollIntoView({ behavior: "smooth", block: "center" });
    }, 300);
    const s2 = setTimeout(() => setHighlight(""), 2600);
    return () => { clearTimeout(s1); clearTimeout(s2); };
  }, []);

  const submit = async () => {
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email.trim())) {
      toast.error(t("Please enter a valid email"));
      return;
    }
    setSending(true);
    try {
      await axios.post(`${API}/merch/notify`, {
        email: email.trim(),
        product_key: "tee",
        design: `${active.theme} — ${active.style}`,
      });
      trackEvent("merch_notify", { design: active.key });
      toast.success(t("You're on the list! We'll email you when it drops."));
      setActive(null);
      setEmail("");
    } catch (e) {
      toast.error(t("Something went wrong — please try again."));
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0B0B0C] text-white" data-testid="shop-page">
      <header className="sticky top-0 z-20 border-b border-white/10 bg-[#0B0B0C]/85 backdrop-blur-xl">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-3.5">
          <Link to="/" data-testid="shop-home-link" className="flex items-center gap-2.5">
            <img src="/logo-mark.png" alt="Fork·Fate" className="h-9 w-9 rounded-full" />
            <span className="font-serif text-xl font-bold tracking-tight">Fork<span className="text-[#E01E26]">·</span>Fate</span>
          </Link>
          <Link to="/" data-testid="shop-back-link" className="inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-white/5 px-4 py-2 text-sm font-bold transition-colors hover:bg-white/10">
            <ArrowLeft className="h-4 w-4" /> {t("Back to app")}
          </Link>
        </div>
      </header>

      <section className="relative overflow-hidden border-b border-white/10">
        <div className="pointer-events-none absolute inset-0 opacity-30" style={{ background: "radial-gradient(ellipse at 30% 0%, rgba(224,30,38,0.35), transparent 55%), radial-gradient(ellipse at 85% 20%, rgba(230,178,58,0.25), transparent 55%)" }} />
        <div className="relative mx-auto max-w-6xl px-5 py-14 sm:py-20">
          <span className="inline-flex items-center gap-2 rounded-full border border-[#E6B23A]/40 bg-[#E6B23A]/10 px-3.5 py-1.5 text-xs font-bold uppercase tracking-[0.2em] text-[#E6B23A]">
            <Sparkles className="h-3.5 w-3.5" /> {t("Dropping soon")}
          </span>
          <h1 className="mt-5 max-w-2xl font-serif text-4xl font-bold leading-[1.05] sm:text-5xl lg:text-6xl">
            {t("Wear your fate.")}
          </h1>
          <p className="mt-4 max-w-xl font-sans text-base text-white/70 sm:text-lg">
            {t("The FF crest on the chest, your favorite Fork·Fate world on the back. Premium print-on-demand tees, hoodies, mugs, posters & stickers — ")}<span className="font-semibold text-white">{t("Let Fate Decide.")}</span>
          </p>
          <div className="mt-7 flex flex-wrap gap-2.5">
            {PRODUCTS.map(({ k, n, p, Icon }) => (
              <span key={k} className="inline-flex items-center gap-1.5 rounded-full border border-white/12 bg-white/5 px-3.5 py-2 text-sm text-white/80">
                <Icon className="h-4 w-4 text-white/50" /> {t(n)} <span className="text-white/40">· {t("from")} ${p}</span>
              </span>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-5 py-12">
        <div className="grid grid-cols-1 gap-7 sm:grid-cols-2 lg:grid-cols-3">
          {DESIGNS.map((d, i) => (
            <motion.div
              key={d.key}
              data-testid={`shop-design-${d.key}`}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: (i % 3) * 0.06 }}
              className="group overflow-hidden rounded-2xl border border-white/10 bg-[#141416] shadow-xl"
              style={{ boxShadow: highlight === d.key ? `0 0 0 3px ${d.accent}, 0 0 34px ${d.accent}80` : `0 0 0 1px ${d.accent}14` }}
            >
              <div className="relative aspect-square overflow-hidden bg-[#0E0E0F]">
                <img src={d.back} alt={`${d.theme} back print`} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.04]" />
                <div className="absolute bottom-3 right-3 flex items-center gap-2 rounded-lg border border-white/15 bg-black/55 p-1.5 backdrop-blur-sm">
                  <img src={d.front || FRONT} alt="Front" className="h-11 w-11 rounded-md object-cover" />
                  <span className="pr-1.5 text-[10px] font-bold uppercase leading-tight tracking-wider text-white/70">{t("Front")}<br />{t("left chest")}</span>
                </div>
                <span className="absolute left-3 top-3 rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-black" style={{ backgroundColor: d.accent }}>{t(d.style)}</span>
              </div>
              <div className="p-5">
                <h3 className="font-serif text-xl font-bold" style={{ color: d.accent }}>{d.theme}</h3>
                <p className="mt-1 min-h-[40px] font-sans text-sm text-white/60">{t(d.blurb)}</p>
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {PRODUCTS.map(({ k, n }) => (
                    <span key={k} className="rounded-md border border-white/10 bg-white/5 px-2 py-0.5 text-[11px] text-white/60">{t(n)}</span>
                  ))}
                </div>
                <div className="mt-3 text-[11px] font-bold uppercase tracking-wider text-white/40">{t("Sizes")} {SIZES.join(" · ")}</div>
                <Button
                  data-testid={`shop-notify-${d.key}`}
                  onClick={() => setActive(d)}
                  className="mt-4 w-full gap-2 rounded-full font-bold text-black hover:brightness-110"
                  style={{ backgroundColor: d.accent }}
                >
                  <BellRing className="h-4 w-4" /> {t("Notify me when it drops")}
                </Button>
              </div>
            </motion.div>
          ))}
        </div>

        <p className="mx-auto mt-12 max-w-xl text-center font-sans text-sm text-white/45">
          {t("Printed on demand & shipped worldwide. Full checkout is coming to")} <span className="font-semibold text-white/70">fork-fate.shop</span> {t("— join a design's list and we'll email you the moment it goes live.")}
        </p>
      </section>

      <Dialog open={!!active} onOpenChange={(o) => { if (!o) setActive(null); }}>
        <DialogContent className="border-white/10 bg-[#141416] text-white sm:max-w-md" data-testid="shop-notify-dialog">
          <DialogHeader>
            <DialogTitle className="font-serif text-2xl">{t("Get first dibs")}</DialogTitle>
            <DialogDescription className="text-white/60">
              {active ? `${active.theme} — ${t(active.style)} · ${t("We'll email you the moment this design drops.")}` : ""}
            </DialogDescription>
          </DialogHeader>
          <div className="mt-2 space-y-3">
            <Input
              data-testid="shop-notify-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") submit(); }}
              placeholder="you@example.com"
              className="border-white/15 bg-white/5 text-white placeholder:text-white/40"
            />
            <Button
              data-testid="shop-notify-submit"
              onClick={submit}
              disabled={sending}
              className="w-full gap-2 rounded-full font-bold text-black hover:brightness-110"
              style={{ backgroundColor: active?.accent || "#E01E26" }}
            >
              <BellRing className="h-4 w-4" /> {sending ? t("Adding you…") : t("Notify me")}
            </Button>
            <p className="text-center text-[11px] text-white/40">{t("No spam — just the drop. One email, then you're free.")}</p>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
