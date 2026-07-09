import React, { useEffect, useState } from "react";
import { Download } from "lucide-react";
import { toast } from "sonner";

const isStandalone = () =>
  window.matchMedia?.("(display-mode: standalone)").matches ||
  window.navigator.standalone === true;

export default function InstallAppButton() {
  const [deferred, setDeferred] = useState(null);
  const [installed, setInstalled] = useState(isStandalone());

  useEffect(() => {
    const onPrompt = (e) => {
      e.preventDefault();
      setDeferred(e);
    };
    const onInstalled = () => {
      setInstalled(true);
      setDeferred(null);
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
    if (!deferred) {
      const isIOS = /iphone|ipad|ipod/i.test(window.navigator.userAgent);
      toast(
        isIOS
          ? "Tap the Share icon, then \u201CAdd to Home Screen\u201D to install."
          : "Open your browser menu and choose \u201CInstall app\u201D / \u201CAdd to Home Screen\u201D."
      );
      return;
    }
    deferred.prompt();
    await deferred.userChoice;
    setDeferred(null);
  };

  if (installed) return null;

  return (
    <button
      onClick={install}
      data-testid="download-app-button"
      className="inline-flex items-center gap-2 rounded-full bg-[#E01E26] px-3 py-2 text-sm font-bold text-white shadow-lg shadow-[#E01E26]/30 transition-colors hover:bg-[#B3141A] sm:px-4"
    >
      <Download className="h-4 w-4" /> <span>Download the app!</span>
    </button>
  );
}
