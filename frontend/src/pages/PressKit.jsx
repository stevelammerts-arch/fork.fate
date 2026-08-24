import React, { useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Clapperboard, Download, FileArchive, Image as ImageIcon, Loader2 } from "lucide-react";

const ASSETS = [
  {
    group: "Google Play — open testing",
    items: [
      { path: "/store-assets/forkfate-play-screenshots-1080x1920.zip", name: "forkfate-play-screenshots-1080x1920.zip", label: "Play screenshots (8 × 1080×1920)", size: "6.7 MB", Icon: FileArchive },
      { path: "/store-assets/play-feature-1024x500.png", name: "play-feature-1024x500.png", label: "Play feature graphic (1024×500)", size: "0.3 MB", Icon: ImageIcon },
      { path: "/store-assets/play-icon-512.png", name: "play-icon-512.png", label: "Play icon (512×512)", size: "0.3 MB", Icon: ImageIcon },
    ],
  },
  {
    group: "App Store",
    items: [
      { path: "/store-assets/forkfate-iphone-screenshots.zip", name: "forkfate-iphone-screenshots.zip", label: "iPhone screenshots (1290×2796)", size: "5.4 MB", Icon: FileArchive },
      { path: "/store-assets/appstore-icon-1024.png", name: "appstore-icon-1024.png", label: "App Store icon (1024×1024)", size: "1 MB", Icon: ImageIcon },
    ],
  },
  {
    group: "Video",
    items: [
      { path: "/promo/forkfate-promo.mp4", name: "forkfate-promo.mp4", label: "Full promo — portrait 9:16 (89s)", size: "22 MB", Icon: Clapperboard },
      { path: "/promo/forkfate-promo-landscape.mp4", name: "forkfate-promo-landscape.mp4", label: "Sponsor promo — 16:9 (99s)", size: "21 MB", Icon: Clapperboard },
      { path: "/promo/forkfate-sizzle-9x16.mp4", name: "forkfate-sizzle-9x16.mp4", label: "Sizzle reel — 9:16 (23s)", size: "6 MB", Icon: Clapperboard },
      { path: "/promo/forkfate-sizzle-16x9.mp4", name: "forkfate-sizzle-16x9.mp4", label: "Sizzle reel — 16:9 (23s)", size: "6 MB", Icon: Clapperboard },
    ],
  },
];

export default function PressKit() {
  const [saving, setSaving] = useState("");

  // Blob fetch + object-URL anchor: survives PWA/service-worker quirks that
  // make direct .zip/.mp4 links fail as downloads.
  const save = async (path, filename) => {
    setSaving(filename);
    try {
      const res = await fetch(path);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 30000);
    } catch {
      window.open(path, "_blank");
    } finally {
      setSaving("");
    }
  };

  return (
    <div className="min-h-screen bg-[#0E0E0E] text-white" data-testid="press-kit-page">
      <header className="mx-auto flex max-w-3xl items-center justify-between px-6 py-6">
        <Link to="/" data-testid="press-back-home" className="inline-flex items-center gap-2 font-sans text-sm font-bold text-[#B8BCC2] transition-colors hover:text-white">
          <ArrowLeft className="h-4 w-4" /> Fork·Fate
        </Link>
        <Link to="/sponsors" data-testid="press-sponsor-kit-link" className="font-sans text-xs font-bold text-[#E6B23A] underline underline-offset-2 hover:text-white">
          Sponsor Kit →
        </Link>
      </header>

      <main className="mx-auto max-w-3xl px-6 pb-20">
        <h1 className="font-serif text-4xl font-medium leading-tight sm:text-5xl lg:text-6xl">
          Press &amp; store <span className="text-[#E01E26]">assets</span>
        </h1>
        <p className="mt-4 font-sans text-base text-[#B8BCC2]">
          Every download is fetched in-page, so it works even inside the installed app.
        </p>

        {ASSETS.map(({ group, items }) => (
          <section key={group} className="mt-10">
            <h2 className="font-serif text-lg font-medium text-[#E6B23A] md:text-lg">{group}</h2>
            <ul className="mt-4 space-y-3">
              {items.map(({ path, name, label, size, Icon }) => (
                <li key={name} className="flex items-center justify-between gap-4 rounded-2xl border border-white/10 bg-[#141414] px-5 py-4">
                  <span className="flex min-w-0 items-center gap-3">
                    <Icon className="h-5 w-5 shrink-0 text-[#E01E26]" />
                    <span className="min-w-0">
                      <span className="block truncate font-sans text-sm font-bold text-white">{label}</span>
                      <span className="block font-sans text-xs text-[#8A8F95]">{size}</span>
                    </span>
                  </span>
                  <button
                    type="button"
                    onClick={() => save(path, name)}
                    disabled={saving === name}
                    data-testid={`press-download-${name}`}
                    className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-white/20 px-3.5 py-2 font-sans text-xs font-bold text-white transition-colors hover:bg-white/10 disabled:opacity-60"
                  >
                    {saving === name ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Download className="h-3.5 w-3.5" />}
                    {saving === name ? "Saving…" : "Download"}
                  </button>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </main>
    </div>
  );
}
