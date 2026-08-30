import { useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Eye, EyeOff, Sparkles } from "lucide-react";
import { useLang } from "../i18n/i18n";

// Cryptic hints only — the fun is in the hunt. Realm names stay hidden
// until the player chooses to peek.
const EGGS = [
  { hint: "Tiny lanterns drift after dusk. Catch one and fate tips you daily.", realm: "Fall Forest" },
  { hint: "Something bushy-tailed scolds intruders, then takes the high road.", realm: "Fall Forest" },
  { hint: "A small sunbather chirps when startled — twice over, if you find them both.", realm: "Tiki Lounge" },
  { hint: "The night's shadows scatter if you reach for them.", realm: "Reaper's Domain" },
  { hint: "The workshop's side panels still answer in beeps.", realm: "Steampunk" },
  { hint: "Give the waving fellow a tap — he'll lose his head over it.", realm: "Winter" },
  { hint: "Some toys on the sand just want one more bounce.", realm: "Summer" },
  { hint: "Catch a falling bloom and the wind itself answers.", realm: "Spring" },
  { hint: "Touch the gallop — if you can keep up with it.", realm: "Fairy Gully" },
  { hint: "Press the hoard-keeper's grip and hear the treasure complain.", realm: "Dragon's Hoard" },
  { hint: "Dare a tap on the hoard-keeper's crown — the whole cavern answers.", realm: "Dragon's Hoard" },
  { hint: "Even the sky's brightest sign has a loose wire.", realm: "Cyberscape" },
];

export default function Secrets() {
  const { t } = useLang();
  const [shown, setShown] = useState({});
  return (
    <div className="min-h-screen bg-[#F7F8F9] px-4 pb-16 pt-6 text-[#0E0E0E]">
      <div className="mx-auto max-w-lg">
        <Link to="/" data-testid="secrets-back" className="inline-flex items-center gap-1.5 text-sm font-bold text-[#6B7075] hover:text-[#E01E26]">
          <ArrowLeft className="h-4 w-4" /> {t("Back to the table")}
        </Link>
        <div className="mt-4 rounded-3xl border border-[#E2E4E7] bg-white/70 p-6 shadow-xl shadow-black/5 backdrop-blur-md">
          <h1 className="flex items-center gap-2 font-serif text-3xl font-semibold">
            <Sparkles className="h-6 w-6 text-[#E01E26]" /> {t("Hidden Bonuses")}
          </h1>
          <p className="mt-2 font-sans text-sm text-[#6B7075]">
            {t("The realms are alive — and some things react when touched. Here are whispers of what's been witnessed. Where each one hides is yours to discover… or peek, if you must.")}
          </p>
        </div>
        <div className="mt-3 space-y-2">
          {EGGS.map((e, i) => (
            <div key={i} className="rounded-2xl border border-[#E2E4E7] bg-white/70 p-4 backdrop-blur-md" data-testid={`secret-${i}`}>
              <p className="font-serif text-base italic text-[#0E0E0E]">“{t(e.hint)}”</p>
              <button
                type="button"
                data-testid={`secret-reveal-${i}`}
                onClick={() => setShown((s) => ({ ...s, [i]: !s[i] }))}
                className="mt-2 inline-flex items-center gap-1.5 rounded-full border border-[#E2E4E7] bg-white px-3 py-1 text-xs font-bold text-[#6B7075] hover:bg-[#EDEEF0]"
              >
                {shown[i] ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                {shown[i] ? e.realm : t("Peek at the realm")}
              </button>
            </div>
          ))}
        </div>
        <p className="mt-4 text-center font-sans text-xs text-[#9AA0A6]">
          {t("More secrets are scattered than are listed here. Keep touching things.")}
        </p>
      </div>
    </div>
  );
}
