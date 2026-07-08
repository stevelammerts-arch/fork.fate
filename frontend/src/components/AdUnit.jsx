import React, { useEffect, useRef } from "react";

const PUB_ID = process.env.REACT_APP_ADSENSE_PUB_ID;

// Injects the AdSense loader script once (only when a publisher ID is configured)
function ensureScript() {
  if (!PUB_ID) return;
  if (document.querySelector("script[data-adsense-loader]")) return;
  const s = document.createElement("script");
  s.async = true;
  s.src = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${PUB_ID}`;
  s.crossOrigin = "anonymous";
  s.setAttribute("data-adsense-loader", "true");
  document.head.appendChild(s);
}

export default function AdUnit({ slotId, className = "", label = "Advertisement" }) {
  const pushed = useRef(false);
  const slot = slotId || process.env.REACT_APP_ADSENSE_SLOT_ID;

  useEffect(() => {
    if (!PUB_ID) return;
    ensureScript();
    if (!pushed.current) {
      try {
        window.adsbygoogle = window.adsbygoogle || [];
        window.adsbygoogle.push({});
        pushed.current = true;
      } catch (e) {
        // AdSense not ready / blocked — safe to ignore
        console.debug("AdSense push skipped:", e);
      }
    }
  }, []);

  // Nothing to show until AdSense is configured with a publisher ID.
  if (!PUB_ID) return null;

  return (
    <div
      data-testid="ad-unit"
      className={`overflow-hidden rounded-3xl border border-[#E2E4E7] bg-[#F5F6F7] ${className}`}
    >
      <p className="px-4 pt-3 font-sans text-[10px] font-bold uppercase tracking-[0.2em] text-[#B8BCC2]">
        {label}
      </p>
      <ins
        className="adsbygoogle"
        style={{ display: "block", minHeight: 120 }}
        data-ad-client={PUB_ID}
        data-ad-slot={slot}
        data-ad-format="auto"
        data-full-width-responsive="true"
      />
    </div>
  );
}
