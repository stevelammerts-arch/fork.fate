import React, { useEffect, useState } from "react";
import { Download, Share, Plus, X, MoreVertical } from "lucide-react";
import { useLang } from "../i18n/i18n";
import { isStandalone, isIOS, isIOSSafari, isAndroid } from "../lib/pwa";

const SNOOZE_KEY = "ff_install_help_snooze";
const SNOOZE_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

const snoozed = () => {
  try {
    const v = parseInt(localStorage.getItem(SNOOZE_KEY) || "0", 10);
    return v && Date.now() < v;
  } catch {
    return false;
  }
};

export default function InstallHelper() {
  const { t } = useLang();
  const [deferred, setDeferred] = useState(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const onPrompt = (e) => {
      e.preventDefault();
      setDeferred(e);
    };
    const onInstalled = () => {
      setVisible(false);
      try {
        localStorage.setItem(SNOOZE_KEY, String(Date.now() + 10 * 365 * 24 * 60 * 60 * 1000));
      } catch (e) { /* ignore */ }
    };
    window.addEventListener("beforeinstallprompt", onPrompt);
    window.addEventListener("appinstalled", onInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", onPrompt);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  useEffect(() => {
    if (isStandalone() || snoozed()) return;
    if (!isIOS() && !isAndroid()) return; // mobile only
    const timer = setTimeout(() => setVisible(true), 8000);
    return () => clearTimeout(timer);
  }, []);

  if (!visible) return null;

  const dismiss = () => {
    setVisible(false);
    try { localStorage.setItem(SNOOZE_KEY, String(Date.now() + SNOOZE_MS)); } catch (e) { /* ignore */ }
  };

  const install = async () => {
    if (deferred) {
      deferred.prompt();
      try { await deferred.userChoice; } catch (e) { /* ignore */ }
      setDeferred(null);
      dismiss();
    }
  };

  const ios = isIOS();
  const iosSafari = isIOSSafari();
  const canOneTap = isAndroid() && !!deferred;

  let steps = null;
  if (ios && iosSafari) {
    steps = (
      <ol className="mt-2 space-y-1.5 text-sm text-[#C7CBD1]" data-testid="install-helper-ios-steps">
        <li className="flex items-center gap-2"><Share className="h-4 w-4 shrink-0 text-[#E01E26]" /> {t("Tap the Share button in Safari")}</li>
        <li className="flex items-center gap-2"><Plus className="h-4 w-4 shrink-0 text-[#E01E26]" /> {t("Choose \u201CAdd to Home Screen\u201D")}</li>
      </ol>
    );
  } else if (ios && !iosSafari) {
    steps = (
      <p className="mt-2 text-sm text-[#C7CBD1]" data-testid="install-helper-ios-safari-note">
        {t("Open this page in Safari, then tap Share \u2192 Add to Home Screen.")}
      </p>
    );
  } else if (!canOneTap) {
    steps = (
      <ol className="mt-2 space-y-1.5 text-sm text-[#C7CBD1]" data-testid="install-helper-android-steps">
        <li className="flex items-center gap-2"><MoreVertical className="h-4 w-4 shrink-0 text-[#E01E26]" /> {t("Tap the \u22EE menu in your browser")}</li>
        <li className="flex items-center gap-2"><Plus className="h-4 w-4 shrink-0 text-[#E01E26]" /> {t("Choose \u201CAdd to Home screen\u201D")}</li>
      </ol>
    );
  }

  return (
    <div
      className="fixed inset-x-3 bottom-4 z-[55] mx-auto max-w-md animate-in fade-in slide-in-from-bottom-4 duration-500 sm:hidden"
      data-testid="install-helper"
    >
      <div className="relative overflow-hidden rounded-2xl border border-[#E01E26]/50 bg-[#0B0B0B]/95 p-4 shadow-2xl shadow-black/60 backdrop-blur-md">
        <button
          onClick={dismiss}
          data-testid="install-helper-dismiss"
          aria-label={t("Dismiss")}
          className="absolute right-2 top-2 grid h-7 w-7 place-items-center rounded-full text-[#8A8F95] transition-colors hover:bg-white/10 hover:text-white"
        >
          <X className="h-4 w-4" />
        </button>
        <div className="flex items-start gap-3 pr-6">
          <span className="mt-0.5 block h-10 w-10 shrink-0 overflow-hidden rounded-xl bg-black">
            <img src="/logo-mark.png" alt="" className="h-10 w-10 scale-110 object-contain" />
          </span>
          <div className="min-w-0">
            <p className="font-serif text-base font-bold text-white">{t("Add Fork·Fate to your home screen")}</p>
            <p className="text-xs text-[#9A9FA5]">{t("Faster access, full-screen, works offline-ready.")}</p>
            {steps}
          </div>
        </div>
        <div className="mt-3 flex items-center justify-end gap-2">
          <button
            onClick={dismiss}
            data-testid="install-helper-later"
            className="rounded-full px-3 py-2 text-xs font-semibold text-[#9A9FA5] transition-colors hover:text-white"
          >
            {t("Maybe later")}
          </button>
          {canOneTap && (
            <button
              onClick={install}
              data-testid="install-helper-install-btn"
              className="inline-flex items-center gap-1.5 rounded-full bg-[#E01E26] px-4 py-2 text-xs font-bold text-white shadow-lg shadow-[#E01E26]/30 transition-colors hover:bg-[#B3141A]"
            >
              <Download className="h-4 w-4" /> {t("Install")}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
