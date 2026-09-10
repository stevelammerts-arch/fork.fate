import { Link } from "react-router-dom";
import { ArrowLeft, Music4, Hammer, Wrench, ExternalLink } from "lucide-react";
import { useLang } from "../i18n/i18n";
import { PIXABAY_NOTE, COMMUNITY_SOUNDS, CRAFTED_SOUNDS, TOOLS } from "../lib/credits";

// HALL OF ECHOES — sound & music credits. Every realm hums because someone
// made a noise worth stealing^W borrowing. This page thanks them properly.
export default function Credits() {
  const { t } = useLang();
  return (
    <div className="min-h-screen bg-[#0E0E0E] pb-24 text-white" data-testid="credits-page">
      <div className="mx-auto max-w-3xl px-6 pt-8" style={{ paddingTop: "calc(2rem + env(safe-area-inset-top))" }}>
        <Link to="/" data-testid="credits-back" className="inline-flex items-center gap-1.5 font-sans text-sm font-bold text-white/60 transition-colors hover:text-white">
          <ArrowLeft className="h-4 w-4" /> {t("Back")}
        </Link>

        <p className="mt-8 font-sans text-xs font-bold uppercase tracking-[0.3em] text-[#E6B23A]/80">{t("Hall of Echoes")}</p>
        <h1 className="mt-2 font-serif text-4xl font-semibold leading-tight sm:text-5xl">{t("Sound & Music Credits")}</h1>
        <p className="mt-4 max-w-xl font-sans text-sm leading-relaxed text-white/65">
          {t("Eleven realms hum, roar, chime and crackle thanks to the sound artists below — and a workshop full of home-made noise. Thank you for lending the realms your echoes.")}
        </p>

        {/* Pixabay — where most of the audio comes from */}
        <section className="mt-12" data-testid="credits-pixabay">
          <div className="rounded-2xl border border-[#E6B23A]/30 bg-[#E6B23A]/[0.06] px-5 py-4">
            <h2 className="flex items-center gap-2.5 font-serif text-lg font-semibold text-[#F5D67B]">
              <Music4 className="h-5 w-5" /> {t(PIXABAY_NOTE.title)}
            </h2>
            <p className="mt-2 font-sans text-xs leading-relaxed text-white/70">{t(PIXABAY_NOTE.blurb)}</p>
            <a href={PIXABAY_NOTE.url} target="_blank" rel="noreferrer" data-testid="pixabay-link" className="mt-2 inline-flex items-center gap-1 font-sans text-xs font-bold text-[#E6B23A] underline-offset-2 hover:underline">
              pixabay.com <ExternalLink className="h-3 w-3" />
            </a>
          </div>
        </section>

        {/* Community sound artists */}
        <section className="mt-12" data-testid="credits-community">
          <h2 className="flex items-center gap-2.5 font-serif text-lg font-semibold text-[#F5D67B]">
            <Music4 className="h-5 w-5" /> {t("Individually Credited Clips")}
          </h2>
          <div className="mt-4 space-y-2.5">
            {COMMUNITY_SOUNDS.map((s) => (
              <div key={s.name} className="rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3" data-testid={`credit-item-${s.files.split(/[.,]/)[0]}`}>
                <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
                  <p className="font-sans text-sm font-bold text-white">{s.name}</p>
                  <p className="font-sans text-[11px] uppercase tracking-wide text-white/40">{s.license}</p>
                </div>
                <p className="mt-1 font-sans text-xs text-white/60">
                  {t("by")} <span className="font-semibold text-white/85">{s.creator}</span> · {s.url ? (
                    <a href={s.url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-[#E6B23A] underline-offset-2 hover:underline">{s.source}<ExternalLink className="h-3 w-3" /></a>
                  ) : s.source}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* In-house */}
        <section className="mt-12" data-testid="credits-crafted">
          <h2 className="flex items-center gap-2.5 font-serif text-lg font-semibold text-[#F5D67B]">
            <Hammer className="h-5 w-5" /> {t("Forged in the Fork·Fate Workshop")}
          </h2>
          <div className="mt-4 space-y-2.5">
            {CRAFTED_SOUNDS.map((s) => (
              <div key={s.name} className="rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3">
                <p className="font-sans text-sm font-bold text-white">{s.name}</p>
                <p className="mt-1 font-sans text-xs leading-relaxed text-white/60">{s.detail}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Tools */}
        <section className="mt-12" data-testid="credits-tools">
          <h2 className="flex items-center gap-2.5 font-serif text-lg font-semibold text-[#F5D67B]">
            <Wrench className="h-5 w-5" /> {t("Tools of the Trade")}
          </h2>
          <ul className="mt-4 space-y-1.5">
            {TOOLS.map((line) => (
              <li key={line} className="font-sans text-xs leading-relaxed text-white/60">— {line}</li>
            ))}
          </ul>
        </section>

        <p className="mt-14 font-serif text-sm italic text-white/40">
          {t("Spotted your work uncredited or misattributed? Tell us via the feedback form and we'll fix it fast.")}
        </p>
      </div>
    </div>
  );
}
