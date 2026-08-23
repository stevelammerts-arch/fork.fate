import { UtensilsCrossed, Skull } from "lucide-react";
import CheckUpdatesButton from "../CheckUpdatesButton";
import FeedbackDialog from "../FeedbackDialog";
import { useLang } from "../../i18n/i18n";

/** Home footer: Reaper disclaimer, brand, legal links, feedback. */
export function HomeFooter({ light }) {
  const { t } = useLang();
  return (
    <footer className={`relative z-10 border-t ${light ? "border-[#E7DCC7] bg-[#EFE7D8]" : "border-[#E2E4E7] bg-[#0F0F0F]"}`}>
      <div className="mx-auto max-w-6xl px-6 pt-8 md:px-12">
        <div className={`flex items-start gap-3 rounded-xl border p-4 ${light ? "border-[#E0D5C0] bg-white/60" : "border-white/10 bg-white/[0.03]"}`} data-testid="reaper-disclaimer">
          {light
            ? <UtensilsCrossed className="mt-0.5 h-5 w-5 shrink-0 text-[#E01E26]" />
            : <Skull className="mt-0.5 h-5 w-5 shrink-0 text-[#E01E26]" />}
          <p className={`font-sans text-xs leading-relaxed ${light ? "text-[#6E6355]" : "text-[#8A8F95]"}`}>
            <span className={`font-bold ${light ? "text-[#2A2118]" : "text-white"}`}>{light ? t("A word from management:") : t("A word from the Reaper:")}</span> {t("This page offers suggestions only and is not liable for any trouble you encounter in or with an establishment. Our algorithm merely queries the choices — the decision to visit any suggested establishment is yours alone.")}
            <span className={`mt-1 block italic ${light ? "text-[#8A7C68]" : "text-[#B9BEC4]"}`}>{light ? t("— The Fork·Fate team") : t("— The Reaper ☠️")}</span>
          </p>
        </div>
      </div>
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-6 pb-28 pt-8 md:flex-row md:px-12 md:pb-20">
        <div className="flex items-center gap-2.5">
          <span className={`relative block h-8 w-8 overflow-hidden rounded-full ${light ? "bg-[#F5F0E6]" : "bg-black"}`}>
            <img src={light ? "/logo-mark-light.png" : "/logo-crest.png"} alt="" className="h-8 w-8 object-contain" />
          </span>
          <span className={`font-serif text-lg font-semibold ${light ? "text-[#2A2118]" : "text-white"}`}>Fork·Fate</span>
        </div>
        <div className="order-3 flex flex-col items-center gap-1.5 md:order-2">
          <p className={`font-sans text-xs ${light ? "text-[#6E6355]" : "text-[#8A8F95]"}`}>
            © {new Date().getFullYear()} {t("Fork·Fate — let fate decide. All rights reserved.")}
          </p>
          <p
            data-testid="veteran-owned-mention"
            className={`inline-flex items-center gap-1.5 font-sans text-[11px] font-bold uppercase tracking-[0.14em] ${light ? "text-[#8A5210]" : "text-[#E6B23A]"}`}
          >
            <span aria-hidden="true">★</span> Veteran-owned & managed <span aria-hidden="true">★</span>
          </p>
          <div className="flex items-center gap-3">
            <a
              href="/terms"
              data-testid="terms-link"
              className={`font-sans text-[11px] font-semibold underline-offset-4 transition-colors hover:underline ${light ? "text-[#6E6355] hover:text-[#2A2118]" : "text-[#8A8F95] hover:text-white"}`}
            >
              Terms of Service
            </a>
            <span className={light ? "text-[#C8B79A]" : "text-[#3A3A3A]"}>·</span>
            <a
              href="/privacy"
              data-testid="privacy-link"
              className={`font-sans text-[11px] font-semibold underline-offset-4 transition-colors hover:underline ${light ? "text-[#6E6355] hover:text-[#2A2118]" : "text-[#8A8F95] hover:text-white"}`}
            >
              Privacy Policy
            </a>
          </div>
          <FeedbackDialog light={light} />
          <button
            type="button"
            data-testid="how-to-play-link"
            onClick={() => window.dispatchEvent(new Event("ff:open-guide"))}
            className={`font-sans text-[11px] font-semibold underline-offset-4 transition-colors hover:underline ${light ? "text-[#6E6355] hover:text-[#2A2118]" : "text-[#8A8F95] hover:text-white"}`}
          >
            {t("How to play")}
          </button>
          <CheckUpdatesButton />
          <a
            href="/admin"
            data-testid="admin-link"
            className={`mt-1 font-sans text-[11px] font-semibold underline-offset-4 transition-colors hover:underline ${light ? "text-[#8A7C68] hover:text-[#2A2118]" : "text-[#6B7075] hover:text-white"}`}
          >
            Admin
          </a>
        </div>
      </div>
    </footer>
  );
}
