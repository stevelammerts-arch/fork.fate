// "Save Progress" — backup & restore the whole collection with one code.
// Lives in the crawl tab. Backup copies the code AND downloads a .txt;
// Restore accepts a pasted code and reloads with everything back.
import { useState } from "react";
import { toast } from "sonner";
import { Save, ClipboardPaste, Download } from "lucide-react";
import { exportProgress, importProgress } from "../../lib/backup";
import { useLang } from "../../i18n/i18n";

export const SaveProgress = () => {
  const { t } = useLang();
  const [restoring, setRestoring] = useState(false);
  const [code, setCode] = useState("");
  const backup = async () => {
    const out = exportProgress();
    try { await navigator.clipboard.writeText(out); } catch { /* clipboard blocked */ }
    try {
      const link = document.createElement("a");
      link.href = URL.createObjectURL(new Blob([out], { type: "text/plain" }));
      link.download = "forkfate-progress.txt";
      link.click();
      URL.revokeObjectURL(link.href);
    } catch { /* download blocked */ }
    toast.success(t("Progress saved!"), { description: t("Code copied + downloaded. Keep it somewhere safe — paste it here to restore on any device.") });
  };
  const restore = () => {
    try {
      const n = importProgress(code);
      toast.success(`${t("Progress restored!")} (${n})`);
      setTimeout(() => window.location.reload(), 900);
    } catch {
      toast.error(t("That code doesn't look like a Fork·Fate backup."));
    }
  };
  return (
    <div className="mt-4 rounded-xl border border-[#E2E4E7] bg-white/70 px-4 py-3 backdrop-blur-sm" data-testid="save-progress">
      <p className="font-sans text-xs font-bold uppercase tracking-[0.2em] text-[#6B7075]">{t("Save progress")}</p>
      <p className="mt-1 font-sans text-xs text-[#6B7075]">{t("Trophies live on this device. Back them up before clearing browser data or switching phones.")}</p>
      <div className="mt-2.5 flex flex-wrap gap-2">
        <button type="button" onClick={backup} data-testid="save-progress-backup"
          className="inline-flex items-center gap-1.5 rounded-full bg-[#0E0E0E] px-3.5 py-1.5 font-sans text-xs font-bold text-white transition-colors hover:bg-[#2A2A2A]">
          <Download className="h-3.5 w-3.5" /> {t("Save my progress")}
        </button>
        <button type="button" onClick={() => setRestoring((v) => !v)} data-testid="save-progress-toggle-restore"
          className="inline-flex items-center gap-1.5 rounded-full border-2 border-[#0E0E0E]/20 px-3.5 py-1.5 font-sans text-xs font-bold text-[#0E0E0E] transition-colors hover:bg-[#F3F4F6]">
          <ClipboardPaste className="h-3.5 w-3.5" /> {t("Restore")}
        </button>
      </div>
      {restoring && (
        <div className="mt-2.5 space-y-2">
          <textarea
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder={t("Paste your backup code here…")}
            rows={3}
            data-testid="save-progress-code"
            className="w-full rounded-lg border border-[#E2E4E7] bg-[#FAFAFA] p-2 font-mono text-[11px] text-[#0E0E0E] outline-none focus:border-[#E01E26]"
          />
          <button type="button" onClick={restore} disabled={!code.trim()} data-testid="save-progress-restore"
            className="inline-flex items-center gap-1.5 rounded-full bg-[#E01E26] px-3.5 py-1.5 font-sans text-xs font-bold text-white transition-colors hover:bg-[#B3141A] disabled:opacity-50">
            <Save className="h-3.5 w-3.5" /> {t("Restore my progress")}
          </button>
        </div>
      )}
    </div>
  );
};
