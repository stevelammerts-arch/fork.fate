import React, { useState, useEffect } from "react";
import { Smartphone, X, ArrowRight } from "lucide-react";
import { useLang } from "../i18n/i18n";

// Standard Play opt-in link for the closed/open testing track.
const BETA_URL = "https://play.google.com/apps/testing/com.fork_fate.twa";
// Flip to false to hide the banner once you're out of testing.
const BETA_ACTIVE = true;
const STORAGE_KEY = "ff_beta_dismissed_v1";

export const AndroidBetaBanner = ({ light }) => {
  const { t } = useLang();
  const [dismissed, setDismissed] = useState(true);

  useEffect(() => {
    try {
      setDismissed(localStorage.getItem(STORAGE_KEY) === "1");
    } catch (e) {
      setDismissed(false);
    }
  }, []);

  if (!BETA_ACTIVE || dismissed) return null;

  const close = () => {
    setDismissed(true);
    try {
      localStorage.setItem(STORAGE_KEY, "1");
    } catch (e) {
      /* ignore */
    }
  };

  const barCls = light
    ? "border-b border-[#CDEBD8] bg-[#E9F8EF] text-[#0E3B22]"
    : "border-b border-[#3DDC84]/20 bg-[#0E2A1B] text-[#CFF3DE]";

  return (
    <div className={`w-full ${barCls}`} data-testid="android-beta-banner">
      <div className="mx-auto flex max-w-6xl items-center gap-3 px-4 py-2">
        <Smartphone className="h-4 w-4 shrink-0 text-[#1AA85B]" />
        <p className="min-w-0 flex-1 truncate text-xs font-medium sm:text-sm">
          <span className="font-bold">{t("Now on Android!")}</span>{" "}
          {t("Help us launch — join the beta test.")}
        </p>
        <a
          href={BETA_URL}
          target="_blank"
          rel="noopener noreferrer"
          data-testid="android-beta-join-btn"
          className="group inline-flex shrink-0 items-center gap-1.5 rounded-full bg-[#1AA85B] px-3 py-1 text-xs font-bold text-white transition-colors hover:bg-[#15904d]"
        >
          {t("Join beta")}
          <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
        </a>
        <button
          onClick={close}
          data-testid="android-beta-dismiss"
          aria-label={t("Dismiss")}
          className="shrink-0 rounded-full p-1 opacity-60 transition-opacity hover:opacity-100"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
};

export default AndroidBetaBanner;
