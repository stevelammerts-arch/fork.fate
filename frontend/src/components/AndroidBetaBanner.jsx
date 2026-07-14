import React, { useState, useEffect } from "react";
import axios from "axios";
import { Smartphone, X, ArrowRight, Check } from "lucide-react";
import { useLang } from "../i18n/i18n";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;
// Flip to false once you're approved for production (or swap for a direct install link).
const BETA_ACTIVE = true;
const STORAGE_KEY = "ff_beta_dismissed_v2";

export const AndroidBetaBanner = ({ light }) => {
  const { t } = useLang();
  const [dismissed, setDismissed] = useState(true);
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);

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
    try { localStorage.setItem(STORAGE_KEY, "1"); } catch (e) { /* ignore */ }
  };

  const submit = async (e) => {
    e.preventDefault();
    const v = email.trim();
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(v)) return;
    setBusy(true);
    try {
      await axios.post(`${API}/beta-testers`, { email: v });
      setDone(true);
      try { localStorage.setItem(STORAGE_KEY, "1"); } catch (er) { /* ignore */ }
      setTimeout(() => setDismissed(true), 3500);
    } catch (er) {
      /* keep form open on error */
    } finally {
      setBusy(false);
    }
  };

  const barCls = light
    ? "border-b border-[#CDEBD8] bg-[#E9F8EF] text-[#0E3B22]"
    : "border-b border-[#3DDC84]/20 bg-[#0E2A1B] text-[#CFF3DE]";
  const inputCls = light
    ? "border-[#BFE3CD] bg-white text-[#0E3B22] placeholder:text-[#7AA98C]"
    : "border-[#3DDC84]/30 bg-[#0B1F14] text-[#CFF3DE] placeholder:text-[#5C8C71]";

  return (
    <div className={`w-full ${barCls}`} data-testid="android-beta-banner">
      <div className="mx-auto flex max-w-6xl items-center gap-3 px-4 py-2">
        <Smartphone className="h-4 w-4 shrink-0 text-[#1AA85B]" />

        {done ? (
          <p className="min-w-0 flex-1 text-xs font-semibold sm:text-sm" data-testid="android-beta-done">
            {t("You're on the list! We'll add you to the Android beta shortly. 🎉")}
          </p>
        ) : open ? (
          <form onSubmit={submit} className="flex min-w-0 flex-1 items-center gap-2" data-testid="android-beta-form">
            <span className="hidden shrink-0 text-xs font-semibold sm:inline">{t("Your Gmail:")}</span>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@gmail.com"
              data-testid="android-beta-email-input"
              className={`min-w-0 flex-1 rounded-full border px-3 py-1 text-xs outline-none focus:ring-2 focus:ring-[#1AA85B]/40 ${inputCls}`}
            />
            <button
              type="submit"
              disabled={busy}
              data-testid="android-beta-submit"
              className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-[#1AA85B] px-3 py-1 text-xs font-bold text-white transition-colors hover:bg-[#15904d] disabled:opacity-60"
            >
              {busy ? t("Sending…") : t("Notify me")}
            </button>
          </form>
        ) : (
          <>
            <p className="min-w-0 flex-1 truncate text-xs font-medium sm:text-sm">
              <span className="font-bold">{t("Coming to Android!")}</span>{" "}
              {t("Want early access? Join the beta.")}
            </p>
            <button
              onClick={() => setOpen(true)}
              data-testid="android-beta-join-btn"
              className="group inline-flex shrink-0 items-center gap-1.5 rounded-full bg-[#1AA85B] px-3 py-1 text-xs font-bold text-white transition-colors hover:bg-[#15904d]"
            >
              {t("Join beta")}
              <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
            </button>
          </>
        )}

        <button
          onClick={close}
          data-testid="android-beta-dismiss"
          aria-label={t("Dismiss")}
          className="shrink-0 rounded-full p-1 opacity-60 transition-opacity hover:opacity-100"
        >
          {done ? <Check className="h-4 w-4" /> : <X className="h-4 w-4" />}
        </button>
      </div>
    </div>
  );
};

export default AndroidBetaBanner;
