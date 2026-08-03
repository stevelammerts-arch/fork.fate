import React, { useEffect, useState } from "react";
import axios from "axios";
import { Link } from "react-router-dom";
import { Store, ArrowRight, Ticket } from "lucide-react";
import { useLang } from "../i18n/i18n";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export const SponsorMarquee = ({ light, onSponsor }) => {
  const { t } = useLang();
  const [sponsors, setSponsors] = useState(null);

  useEffect(() => {
    axios
      .get(`${API}/sponsors/active`)
      .then(({ data }) => setSponsors(data.sponsors || []))
      .catch(() => setSponsors([]));
  }, []);

  if (sponsors === null) return null;

  const reduce =
    typeof window !== "undefined" &&
    window.matchMedia &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  const barCls = light
    ? "border-b border-[#EADfD0] bg-[#FBF6EE] text-[#0E0E0E]"
    : "border-b border-white/10 bg-[#141414] text-white/90";
  const labelCls = light ? "text-[#B01015]" : "text-[#E94E52]";

  if (sponsors.length === 0) {
    return (
      <div className={`w-full ${barCls}`} data-testid="sponsor-marquee-empty">
        <div className="mx-auto flex max-w-6xl items-center justify-center px-4 py-1.5">
          <button
            onClick={onSponsor}
            data-testid="marquee-sponsor-cta"
            className="group inline-flex items-center gap-2 text-xs font-semibold tracking-wide transition-opacity hover:opacity-80"
          >
            <Store className="h-3.5 w-3.5" />
            {t("Feature your business here")}
            <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
          </button>
        </div>
      </div>
    );
  }

  const handleClick = (s) => {
    axios.post(`${API}/sponsors/${s.id}/click`).catch(() => {});
    if (s.website) {
      let url = s.website.trim();
      if (!/^https?:\/\//i.test(url)) url = `https://${url}`;
      window.open(url, "_blank", "noopener,noreferrer");
    }
  };

  // A chain-coupon CTA rides at the end of each loop half so the tier is
  // always discoverable from the sponsor bar.
  const half = [...sponsors, { id: "chain-cta", cta: true }];
  const items = [...half, ...half];
  const duration = Math.max(18, half.length * 5);

  return (
    <div className={`group relative w-full overflow-hidden ${barCls}`} data-testid="sponsor-marquee">
      <div className="mx-auto flex max-w-6xl items-center">
        <span
          className={`z-10 shrink-0 py-1.5 pl-4 pr-3 text-[10px] font-bold uppercase tracking-[0.18em] ${labelCls}`}
        >
          {t("Sponsors")}
        </span>
        <div className="relative flex-1 overflow-hidden">
          <div
            className="ff-marquee-track inline-flex items-center whitespace-nowrap py-1.5"
            style={{ animationDuration: `${duration}s`, animationPlayState: reduce ? "paused" : "running" }}
          >
            {items.map((s, i) => (
              s.cta ? (
                <Link
                  key={`${s.id}-${i}`}
                  to="/sponsor/chains"
                  data-testid={i < half.length ? "marquee-chain-cta" : undefined}
                  className={`mx-4 inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-bold transition-opacity hover:opacity-70 ${light ? "border-[#C8952A]/50 text-[#8A5210]" : "border-[#E6B23A]/50 text-[#E6B23A]"}`}
                >
                  <Ticket className="h-3.5 w-3.5" />
                  {t("Your chain's coupon here")}
                  <ArrowRight className="h-3 w-3" />
                </Link>
              ) : (
              <button
                key={`${s.id}-${i}`}
                onClick={() => handleClick(s)}
                data-testid={`marquee-sponsor-${s.id}`}
                title={s.website ? s.name : undefined}
                className="mx-4 inline-flex items-center gap-2 text-xs transition-opacity hover:opacity-70"
              >
                <img
                  src={s.image}
                  alt=""
                  className="h-5 w-5 shrink-0 rounded-full object-cover ring-1 ring-black/10"
                />
                <span className="font-semibold">{s.name}</span>
                {s.cuisine ? (
                  <span className={light ? "text-[#8A8177]" : "text-white/50"}>· {s.cuisine}</span>
                ) : null}
              </button>
              )
            ))}
          </div>
        </div>
      </div>
      <style>{`
        @keyframes ff-marquee { from { transform: translateX(0); } to { transform: translateX(-50%); } }
        .ff-marquee-track { animation-name: ff-marquee; animation-timing-function: linear; animation-iteration-count: infinite; will-change: transform; }
        .group:hover .ff-marquee-track { animation-play-state: paused !important; }
      `}</style>
    </div>
  );
};

export default SponsorMarquee;
