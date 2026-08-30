import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Eye, EyeOff, Share2, Sparkles, Trophy } from "lucide-react";
import { toast } from "sonner";
import { useLang } from "../i18n/i18n";
import { SECRETS, SECRET_POINTS, readSecretsFound } from "../lib/secretTrophies";
import { buildSecretsShareImage, shareImage } from "../lib/shareCards";

// Cryptic hints only — the fun is in the hunt. Realm names stay hidden until
// the player chooses to peek. Discovered eggs turn into named gold trophies.
export default function Secrets() {
  const { t } = useLang();
  const [shown, setShown] = useState({});
  const [found, setFound] = useState(() => readSecretsFound());
  const [sharing, setSharing] = useState(false);
  const shareHunt = async () => {
    if (sharing) return;
    setSharing(true);
    try {
      const blob = await buildSecretsShareImage(SECRETS, found);
      const out = await shareImage(blob, "forkfate-secrets.png", t("The realms react when touched — think you can find them all? Hunt on Fork·Fate:"));
      if (out === "downloaded") toast.success(t("Hunt card saved!"));
    } catch {
      toast.error(t("Couldn't build the share image"));
    }
    setSharing(false);
  };
  useEffect(() => {
    const sync = () => setFound(readSecretsFound());
    window.addEventListener("ff:secret-found", sync);
    return () => window.removeEventListener("ff:secret-found", sync);
  }, []);
  const foundCount = SECRETS.filter((e) => found[e.id]).length;
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
          <div className="mt-3 flex items-center gap-2" data-testid="secrets-progress">
            <Trophy className="h-4 w-4 text-[#C9A227]" />
            <span className="font-sans text-sm font-bold">
              {foundCount}/{SECRETS.length} {t("discovered")}
            </span>
            <span className="font-sans text-xs text-[#9AA0A6]">· +{SECRET_POINTS} {t("Fate Points each")}</span>
          </div>
          <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-[#EDEEF0]">
            <div className="h-full rounded-full bg-gradient-to-r from-[#C9A227] to-[#E8C547] transition-[width] duration-700" style={{ width: `${(foundCount / SECRETS.length) * 100}%` }} />
          </div>
          <button
            type="button"
            onClick={shareHunt}
            disabled={sharing}
            data-testid="secrets-share-button"
            className="mt-4 inline-flex items-center gap-2 rounded-full bg-[#E01E26] px-5 py-2.5 font-sans text-sm font-bold text-white transition-colors hover:bg-[#C01920] disabled:opacity-60"
          >
            <Share2 className="h-4 w-4" /> {sharing ? t("Building card…") : t("Share the hunt")}
          </button>
        </div>
        <div className="mt-3 space-y-2">
          {SECRETS.map((e, i) => {
            const isFound = !!found[e.id];
            return (
              <div key={e.id} className={`rounded-2xl border p-4 backdrop-blur-md ${isFound ? "border-[#E8C547]/70 bg-[#FFFDF2]/90" : "border-[#E2E4E7] bg-white/70"}`} data-testid={`secret-${i}`}>
                {isFound && (
                  <div className="mb-1.5 inline-flex items-center gap-1.5 rounded-full bg-[#C9A227]/15 px-2.5 py-0.5" data-testid={`secret-trophy-${e.id}`}>
                    <Trophy className="h-3.5 w-3.5 text-[#C9A227]" />
                    <span className="font-sans text-xs font-bold text-[#8A6F17]">{t(e.title)}</span>
                  </div>
                )}
                <p className="font-serif text-base italic text-[#0E0E0E]">“{t(e.hint)}”</p>
                <button
                  type="button"
                  data-testid={`secret-reveal-${i}`}
                  onClick={() => setShown((s) => ({ ...s, [i]: !s[i] }))}
                  className="mt-2 inline-flex items-center gap-1.5 rounded-full border border-[#E2E4E7] bg-white px-3 py-1 text-xs font-bold text-[#6B7075] hover:bg-[#EDEEF0]"
                >
                  {shown[i] || isFound ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                  {shown[i] || isFound ? e.realm : t("Peek at the realm")}
                </button>
              </div>
            );
          })}
        </div>
        <p className="mt-4 text-center font-sans text-xs text-[#9AA0A6]">
          {t("More secrets are scattered than are listed here. Keep touching things.")}
        </p>
      </div>
    </div>
  );
}
