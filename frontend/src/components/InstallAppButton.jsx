import React, { useEffect, useState } from "react";
import { Download, Share, Plus, X } from "lucide-react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "./ui/dialog";
import { useLang } from "../i18n/i18n";

const isStandalone = () =>
  window.matchMedia?.("(display-mode: standalone)").matches ||
  window.navigator.standalone === true;

const ua = () => window.navigator.userAgent || "";
const isIOS = () => /iphone|ipad|ipod/i.test(ua()) ||
  // iPadOS 13+ reports as Mac; detect touch to disambiguate
  (/Macintosh/i.test(ua()) && "ontouchend" in document);
// On iOS only Safari can Add to Home Screen (Chrome/Firefox/Edge in-app cannot).
const isIOSSafari = () => isIOS() && !/(CriOS|FxiOS|EdgiOS|OPiOS|GSA)/i.test(ua());

export default function InstallAppButton() {
  const { t } = useLang();
  const [deferred, setDeferred] = useState(null);
  const [installed, setInstalled] = useState(isStandalone());
  const [showIOS, setShowIOS] = useState(false);

  useEffect(() => {
    const onPrompt = (e) => {
      e.preventDefault();
      setDeferred(e);
    };
    const onInstalled = () => {
      setInstalled(true);
      setDeferred(null);
      setShowIOS(false);
      toast.success("Fork·Fate installed — find it on your home screen!");
    };
    window.addEventListener("beforeinstallprompt", onPrompt);
    window.addEventListener("appinstalled", onInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", onPrompt);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  const install = async () => {
    // Android / desktop Chromium: real one-tap install prompt.
    if (deferred) {
      deferred.prompt();
      await deferred.userChoice;
      setDeferred(null);
      return;
    }
    // iOS: Apple has no programmatic install — walk the user through it.
    if (isIOS()) {
      setShowIOS(true);
      return;
    }
    toast(t("Open your browser menu and choose \u201CInstall app\u201D / \u201CAdd to Home Screen.\u201D"));
  };

  if (installed) return null;

  return (
    <>
      <button
        onClick={install}
        data-testid="download-app-button"
        className="inline-flex items-center gap-1.5 rounded-full bg-[#E01E26] px-3 py-1.5 text-xs font-bold text-white shadow-lg shadow-[#E01E26]/30 transition-colors hover:bg-[#B3141A] sm:gap-2 sm:px-4 sm:py-2.5 sm:text-sm"
      >
        <Download className="h-4 w-4" /> <span>{t("Download the app!")}</span>
      </button>

      <Dialog open={showIOS} onOpenChange={setShowIOS}>
        <DialogContent className="max-w-sm border-[#2A2A2A] bg-[#0B0B0B] text-white" data-testid="ios-install-dialog" data-ff-dialog>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 font-serif text-2xl">
              <span className="relative block h-8 w-8 overflow-hidden rounded-full bg-black">
                <img src="/logo-mark.png" alt="" className="h-8 w-8 scale-110 object-contain" />
              </span>
              {t("Add to your iPhone")}
            </DialogTitle>
            <DialogDescription className="text-sm text-[#A0A0A0]">
              {t("Apple installs web apps from Safari's Share menu — it only takes a few taps.")}
            </DialogDescription>
          </DialogHeader>

          {!isIOSSafari() ? (
            <div className="rounded-xl border border-[#E01E26]/40 bg-[#E01E26]/10 p-4 text-sm" data-testid="ios-open-in-safari">
              <p className="font-bold text-white">Open this page in Safari first</p>
              <p className="mt-1 text-[#C7CBD1]">
                On iPhone, only <span className="font-semibold text-white">Safari</span> can add apps to your home screen.
                Tap the <span className="font-semibold text-white">•••</span> menu and choose “Open in Safari,” then come back and tap “Download the app!” again.
              </p>
            </div>
          ) : (
            <ol className="mt-1 space-y-3" data-testid="ios-install-steps">
              <li className="flex items-start gap-3">
                <span className="mt-0.5 grid h-7 w-7 shrink-0 place-items-center rounded-full bg-[#E01E26] text-sm font-bold text-white">1</span>
                <p className="text-sm text-[#E6E8EB]">
                  Tap the <span className="font-semibold text-white">Share</span> icon
                  <Share className="mx-1 inline h-4 w-4 -translate-y-0.5 text-[#4FA3FF]" />
                  in Safari's toolbar (bottom on iPhone, top on iPad).
                </p>
              </li>
              <li className="flex items-start gap-3">
                <span className="mt-0.5 grid h-7 w-7 shrink-0 place-items-center rounded-full bg-[#E01E26] text-sm font-bold text-white">2</span>
                <p className="text-sm text-[#E6E8EB]">
                  Scroll down and tap <span className="font-semibold text-white">“Add to Home Screen”</span>
                  <Plus className="mx-1 inline h-4 w-4 -translate-y-0.5 rounded border border-white/40 p-0.5 text-white" />
                </p>
              </li>
              <li className="flex items-start gap-3">
                <span className="mt-0.5 grid h-7 w-7 shrink-0 place-items-center rounded-full bg-[#E01E26] text-sm font-bold text-white">3</span>
                <p className="text-sm text-[#E6E8EB]">
                  Tap <span className="font-semibold text-white">“Add”</span> — Fork·Fate lands on your home screen like a real app.
                </p>
              </li>
            </ol>
          )}

          <button
            onClick={() => setShowIOS(false)}
            data-testid="ios-install-close"
            className="mt-2 inline-flex w-full items-center justify-center gap-2 rounded-full border border-white/20 py-3 text-sm font-bold text-white transition-colors hover:bg-white/10"
          >
            <X className="h-4 w-4" /> {t("Got it")}
          </button>
        </DialogContent>
      </Dialog>
    </>
  );
}
