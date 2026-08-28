import { motion } from "framer-motion";
import { Dices, Users, Beer, Stamp, ArrowRight } from "lucide-react";
import { useLang } from "../../i18n/i18n";

const MODES = [
  { id: "solo", icon: Dices, label: "Solo Fates", desc: "One card. One fate. Go eat.", accent: "#E01E26" },
  { id: "group", icon: Users, label: "Groups", desc: "Deal 3, vote, crown a winner.", accent: "#F0A24E" },
  { id: "crawls", icon: Beer, label: "Crawls", desc: "A multi-stop route for tonight.", accent: "#22E0E0" },
  { id: "passports", icon: Stamp, label: "Passports", desc: "A quest stamped over weeks.", accent: "#5EE0A8" },
];

/** Shown right after a realm is chosen: pick which table fate deals at.
 * Same dark chrome as the realm chooser so the two read as one ritual. */
export default function ModeChooserDialog({ onPick }) {
  const { t } = useLang();
  return (
    <div data-testid="mode-chooser" className="fixed inset-0 z-[130] overflow-y-auto">
      <div className="fixed inset-0 bg-black/85 backdrop-blur-md" />
      <div className="relative flex min-h-full items-center justify-center p-4 py-8">
        <motion.div
          initial={{ opacity: 0, y: 24, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.45, ease: "easeOut" }}
          className="w-full max-w-lg rounded-3xl border border-white/15 bg-[#101013]/95 p-6 shadow-2xl sm:p-8"
        >
          <img src="/logo-crest.png" alt="" className="mx-auto h-14 w-14 object-contain drop-shadow-[0_0_18px_rgba(224,30,38,0.45)]" />
          <h2 className="mt-3 text-center font-serif text-3xl font-semibold text-white">
            {t("Where to first?")}
          </h2>
          <p className="mx-auto mt-1.5 max-w-sm text-center font-sans text-sm text-white/60">
            {t("Your realm is set. Pick how fate deals tonight — you can switch tabs anytime up top.")}
          </p>
          <div className="mt-5 grid grid-cols-1 gap-2.5 sm:grid-cols-2">
            {MODES.map(({ id, icon: Icon, label, desc, accent }) => (
              <button
                key={id}
                type="button"
                data-testid={`mode-chooser-${id}`}
                onClick={() => onPick(id)}
                className="group flex items-center gap-3 rounded-2xl border border-white/12 bg-white/[0.04] p-3.5 text-left transition-[transform,border-color,background-color] duration-200 hover:-translate-y-0.5 hover:bg-white/[0.09]"
                style={{ "--mc": accent }}
                onMouseEnter={(e) => { e.currentTarget.style.borderColor = `${accent}66`; }}
                onMouseLeave={(e) => { e.currentTarget.style.borderColor = ""; }}
              >
                <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl" style={{ backgroundColor: `${accent}1f` }}>
                  <Icon className="h-5 w-5" style={{ color: accent }} />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block font-serif text-lg leading-tight text-white">{t(label)}</span>
                  <span className="block truncate font-sans text-xs text-white/55">{t(desc)}</span>
                </span>
                <ArrowRight className="h-4 w-4 shrink-0 text-white/30 transition-transform group-hover:translate-x-0.5" style={{ color: undefined }} />
              </button>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
