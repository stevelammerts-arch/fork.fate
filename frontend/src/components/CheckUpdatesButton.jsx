import React, { useState } from "react";
import { toast } from "sonner";
import { RefreshCw } from "lucide-react";

const currentBundle = () => {
  const src = Array.from(document.querySelectorAll("script[src]"))
    .map((s) => s.src)
    .find((s) => /\/static\/js\/main\.[\w]+\.js/.test(s));
  const m = src && src.match(/main\.[\w]+\.js/);
  return m ? m[0] : null;
};

const purgeAndReload = async () => {
  try {
    if ("serviceWorker" in navigator) {
      const regs = await navigator.serviceWorker.getRegistrations();
      await Promise.all(regs.map((r) => r.unregister()));
    }
    if (window.caches) {
      const keys = await caches.keys();
      await Promise.all(keys.map((k) => caches.delete(k)));
    }
  } catch {
    /* ignore */
  }
  const url = new URL(window.location.href);
  url.searchParams.set("_v", Date.now().toString());
  window.location.replace(url.toString());
};

export default function CheckUpdatesButton() {
  const [checking, setChecking] = useState(false);

  const check = async () => {
    setChecking(true);
    try {
      const res = await fetch(`/index.html?_=${Date.now()}`, { cache: "no-store" });
      const html = await res.text();
      const latest = (html.match(/main\.[\w]+\.js/) || [])[0];
      const current = currentBundle();
      if (latest && current && latest !== current) {
        toast.success("New version available — updating…");
        setTimeout(purgeAndReload, 1000);
      } else {
        toast.success("Refreshing to the newest version…");
        setTimeout(purgeAndReload, 800);
      }
    } catch {
      toast("Couldn't check right now — refreshing…");
      setTimeout(purgeAndReload, 800);
    } finally {
      setChecking(false);
    }
  };

  return (
    <button
      onClick={check}
      disabled={checking}
      data-testid="check-updates-button"
      className="inline-flex items-center gap-1.5 font-sans text-xs font-bold text-white underline-offset-4 transition-colors hover:text-[#E01E26] hover:underline disabled:opacity-70"
    >
      <RefreshCw className={`h-3.5 w-3.5 ${checking ? "animate-spin" : ""}`} />
      {checking ? "Checking…" : "Check for updates"}
    </button>
  );
}
