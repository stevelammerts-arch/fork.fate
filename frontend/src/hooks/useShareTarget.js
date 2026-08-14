// PWA share target: a friend shares a restaurant link/name INTO Fork·Fate
// (manifest share_target) — we tuck it into Favorites and say so.
import { useEffect } from "react";
import { toast } from "sonner";
import { trackEvent } from "../lib/analytics";

export function useShareTarget({ t, isFavorite, toggleFavorite }) {
  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      const sTitle = params.get("share_title") || "";
      const sText = params.get("share_text") || "";
      const sUrl = params.get("share_url") || "";
      if (!sTitle && !sText && !sUrl) return;
      // Best-guess name: the title, else the text minus any URL inside it.
      const urlInText = (sText.match(/https?:\/\/\S+/) || [])[0] || "";
      const name = (sTitle || sText.replace(urlInText, "").trim() || "Shared spot").slice(0, 80);
      const link = sUrl || urlInText;
      const shared = { id: `shared-${Date.now()}`, name, cuisine: t("Shared with you"), address: "", category: "food", google_url: link, image: "" };
      if (!isFavorite(shared)) toggleFavorite(shared);
      // Defer past first paint — sonner's Toaster subscribes after this
      // mount-time effect runs, and toasts fired before that are dropped.
      setTimeout(() => toast.success(`${t("Saved to Favorites:")} ${name}`, { duration: 6000 }), 600);
      trackEvent("share_target_in", {});
      // Clean the params so refreshes don't re-save it.
      ["share_title", "share_text", "share_url"].forEach((k) => params.delete(k));
      const qs = params.toString();
      window.history.replaceState({}, "", window.location.pathname + (qs ? `?${qs}` : ""));
    } catch (e) { /* malformed share — ignore */ }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
}
