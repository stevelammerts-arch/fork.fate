import { useCallback, useEffect, useRef, useState } from "react";
import { Link, useParams } from "react-router-dom";
import axios from "axios";
import confetti from "canvas-confetti";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { ArrowLeft, Swords, Crown, Dices, MapPin, Link2, Skull } from "lucide-react";
import { useLang } from "../i18n/i18n";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const imgSrc = (u) => (u && u.startsWith("/api") ? `${process.env.REACT_APP_BACKEND_URL}${u}` : u);

/** One fighter's card in the duel arena. */
function DuelCard({ label, name, pick, score, winner, revealed, testid }) {
  return (
    <div
      data-testid={testid}
      className={`relative flex-1 overflow-hidden rounded-2xl border-2 p-4 transition-colors ${
        winner ? "border-[#E6B23A] bg-[#E6B23A]/10" : "border-white/10 bg-white/5"
      }`}
    >
      {winner && (
        <Crown data-testid={`${testid}-crown`} className="absolute right-3 top-3 h-6 w-6 text-[#E6B23A]" />
      )}
      <p className="font-sans text-[10px] font-bold uppercase tracking-[0.2em] text-white/50">{label}</p>
      <p className="mt-0.5 truncate font-serif text-lg font-bold text-white">{name}</p>
      {revealed && pick ? (
        <div className="mt-3 space-y-2">
          {pick.image && (
            <img src={imgSrc(pick.image)} alt={pick.name} className="h-24 w-full rounded-xl object-cover" />
          )}
          <p data-testid={`${testid}-pick`} className="font-serif text-xl font-bold leading-tight text-white">{pick.name}</p>
          {pick.cuisine && <p className="font-sans text-xs font-semibold text-white/60">{pick.cuisine}</p>}
          {pick.address && (
            <p className="flex items-start gap-1 font-sans text-[11px] text-white/40">
              <MapPin className="mt-0.5 h-3 w-3 shrink-0" /> {pick.address}
            </p>
          )}
          {score != null && (
            <p data-testid={`${testid}-score`} className={`font-serif text-3xl font-bold ${winner ? "text-[#E6B23A]" : "text-white/70"}`}>
              {score.toFixed(1)}
            </p>
          )}
        </div>
      ) : (
        <div className="mt-3 grid h-36 place-items-center rounded-xl border border-dashed border-white/15 bg-black/30">
          <Dices className="h-8 w-8 text-white/25" />
        </div>
      )}
    </div>
  );
}

/** Fate Duel arena (/d/:code): the challenger locked in fate's pick for a
 * location; the rival spins the SAME location, then fate crowns a winner via
 * the deterministic fate-score computed server-side. Link-based, no account. */
export default function Duel() {
  const { t } = useLang();
  const { code } = useParams();
  const [duel, setDuel] = useState(null);
  const [status, setStatus] = useState("loading"); // loading | missing | ready
  const [name, setName] = useState(() => localStorage.getItem("ff_duel_name") || "");
  const [spinning, setSpinning] = useState(false);
  const celebratedRef = useRef(false);
  const isMine = !!localStorage.getItem(`ff_duel_mine_${(code || "").toUpperCase()}`);

  const load = useCallback(async () => {
    try {
      const { data } = await axios.get(`${API}/duels/${code}`);
      setDuel(data);
      setStatus("ready");
    } catch {
      setStatus((s) => (s === "ready" ? s : "missing"));
    }
  }, [code]);

  useEffect(() => { load(); }, [load]);

  // Challenger keeps the page open waiting for the rival — poll gently.
  const answered = !!duel?.responder_pick;
  useEffect(() => {
    if (status !== "ready" || answered || !isMine) return;
    const id = setInterval(load, 8000);
    return () => clearInterval(id);
  }, [status, answered, isMine, load]);

  // Crown-drop confetti the first time the verdict shows.
  useEffect(() => {
    if (!duel?.verdict || celebratedRef.current) return;
    celebratedRef.current = true;
    try {
      confetti({ particleCount: 120, spread: 85, startVelocity: 42, origin: { x: 0.5, y: 0.6 }, colors: ["#E6B23A", "#E01E26", "#FFFFFF"] });
    } catch { /* canvas unavailable */ }
  }, [duel]);

  const spinMine = async () => {
    if (spinning) return;
    setSpinning(true);
    try {
      const search = duel.search || {};
      const body = {
        zip_code: search.zip_code || null,
        place_query: search.place_query || null,
        lat: search.lat ?? null,
        lng: search.lng ?? null,
        cuisines: search.cuisines || [],
        price_levels: search.price_levels || [],
        category: search.category || "food",
        open_now: !!search.open_now,
        radius_miles: search.radius_miles || 15,
      };
      const { data } = await axios.post(`${API}/places/search`, body);
      const pool = (data.restaurants || []).filter(
        (r) => r.name !== duel.challenger_pick?.name
      );
      const all = pool.length ? pool : data.restaurants || [];
      if (!all.length) {
        toast.error(t("Fate found nothing near the duel grounds — try again in a moment"));
        setSpinning(false);
        return;
      }
      const pick = all[Math.floor(Math.random() * all.length)];
      // A dramatic beat before the verdict lands.
      await new Promise((res) => setTimeout(res, 1400));
      const trimmed = name.trim();
      if (trimmed) localStorage.setItem("ff_duel_name", trimmed);
      const { data: result } = await axios.post(`${API}/duels/${code}/respond`, {
        name: trimmed || "The challenged",
        pick: {
          id: pick.id || "",
          name: pick.name,
          cuisine: pick.cuisine || "",
          address: pick.address || "",
          image: pick.photo_url || pick.image || "",
        },
      });
      setDuel(result);
    } catch (e) {
      if (e.response?.status === 409) {
        toast.error(t("This duel was already answered"));
        load();
      } else {
        toast.error(t("Fate stumbled — try again"));
      }
    }
    setSpinning(false);
  };

  const copyLink = async () => {
    const url = `${window.location.origin}/d/${code}`;
    try {
      if (navigator.share) await navigator.share({ title: "Fate Duel", url });
      else { await navigator.clipboard.writeText(url); toast.success(t("Duel link copied — send it to your rival!")); }
    } catch { /* share sheet cancelled */ }
  };

  const v = duel?.verdict;
  const winnerName = v ? (v.winner === "challenger" ? duel.challenger : duel.responder) : null;

  return (
    <div className="min-h-screen bg-[#0B0B0D] px-6 py-10 text-white md:px-12" data-testid="duel-page">
      <div className="mx-auto max-w-3xl">
        <Link to="/" data-testid="duel-back-link" className="inline-flex items-center gap-2 font-sans text-sm font-bold text-white/60 transition-colors hover:text-white">
          <ArrowLeft className="h-4 w-4" /> {t("Back to the table")}
        </Link>

        <div className="mt-6 flex items-center gap-3">
          <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#E01E26]/15">
            <Swords className="h-5 w-5 text-[#E01E26]" />
          </span>
          <div>
            <h1 className="font-serif text-3xl font-bold" data-testid="duel-title">{t("Fate Duel")}</h1>
            <p className="font-sans text-sm text-white/60">{t("Two mortals. One location. Fate favors only one.")}</p>
          </div>
        </div>

        {status === "loading" && (
          <p className="mt-10 text-center font-sans text-sm text-white/50" data-testid="duel-loading">{t("Summoning the duel…")}</p>
        )}

        {status === "missing" && (
          <div className="mt-10 space-y-3 text-center" data-testid="duel-missing">
            <Skull className="mx-auto h-10 w-10 text-white/30" />
            <p className="font-serif text-xl text-white/80">{t("This duel has vanished into the void.")}</p>
            <Link to="/" className="inline-block rounded-full bg-[#E01E26] px-6 py-2.5 font-sans text-sm font-bold text-white">{t("Deal your own fate")}</Link>
          </div>
        )}

        {status === "ready" && duel && (
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="mt-8 space-y-5">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-stretch">
              <DuelCard
                label={t("The challenger")}
                name={duel.challenger}
                pick={duel.challenger_pick}
                score={v?.challenger_score}
                winner={v?.winner === "challenger"}
                revealed={answered || isMine}
                testid="duel-card-challenger"
              />
              <div className="grid place-items-center">
                <span className="font-serif text-2xl font-bold text-[#E01E26]">{t("VS")}</span>
              </div>
              <DuelCard
                label={t("The challenged")}
                name={duel.responder || (isMine ? t("Awaiting a rival…") : name.trim() || t("You"))}
                pick={duel.responder_pick}
                score={v?.responder_score}
                winner={v?.winner === "responder"}
                revealed={answered}
                testid="duel-card-responder"
              />
            </div>

            {v && (
              <div className="rounded-2xl border-2 border-[#E6B23A] bg-[#E6B23A]/10 p-5 text-center" data-testid="duel-verdict">
                <Crown className="mx-auto h-8 w-8 text-[#E6B23A]" />
                <p className="mt-2 font-serif text-2xl font-bold text-[#E6B23A]" data-testid="duel-winner-line">
                  {t("Fate favors")} {winnerName}!
                </p>
                <p className="mt-1 font-sans text-sm text-white/60">
                  {v.winner === "challenger" ? duel.challenger_pick?.name : duel.responder_pick?.name} {t("carries the higher fate-score. The Reaper has spoken.")}
                </p>
                <Link to="/" className="mt-4 inline-block rounded-full bg-[#E01E26] px-6 py-2.5 font-sans text-sm font-bold text-white" data-testid="duel-deal-own">
                  {t("Deal your own fate")}
                </Link>
              </div>
            )}

            {!answered && isMine && (
              <div className="rounded-2xl border border-white/10 bg-white/5 p-5 text-center" data-testid="duel-waiting">
                <p className="font-serif text-lg text-white/80">{t("Your fate is sealed. Waiting for your rival to answer…")}</p>
                <button
                  onClick={copyLink}
                  data-testid="duel-copy-link"
                  className="mt-3 inline-flex items-center gap-2 rounded-full border-2 border-[#E01E26] px-5 py-2.5 font-sans text-sm font-bold text-[#FF6B71] transition-colors hover:bg-[#E01E26]/10"
                >
                  <Link2 className="h-4 w-4" /> {t("Share the duel link")}
                </button>
              </div>
            )}

            {!answered && !isMine && (
              <div className="rounded-2xl border border-white/10 bg-white/5 p-5" data-testid="duel-respond">
                <p className="text-center font-serif text-lg text-white/90">
                  {duel.challenger} {t("has locked in fate's pick and challenges you. Let fate deal yours for the same grounds.")}
                </p>
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  maxLength={40}
                  placeholder={t("Your name")}
                  data-testid="duel-name-input"
                  className="mt-4 w-full rounded-xl border border-white/15 bg-black/30 px-4 py-3 font-sans text-sm text-white placeholder:text-white/35 focus:border-[#E01E26] focus:outline-none"
                />
                <button
                  onClick={spinMine}
                  disabled={spinning}
                  data-testid="duel-spin-button"
                  className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-full bg-[#E01E26] px-6 py-3.5 font-sans text-base font-bold text-white transition-colors hover:bg-[#C01920] disabled:opacity-60"
                >
                  {spinning ? (
                    <><Dices className="h-5 w-5 animate-spin" /> {t("Fate is dealing…")}</>
                  ) : (
                    <><Swords className="h-5 w-5" /> {t("Let fate deal mine")}</>
                  )}
                </button>
                <p className="mt-2 text-center font-sans text-[11px] text-white/40">
                  {t("Fate picks from the challenger's location — no peeking, no rerolls.")}
                </p>
              </div>
            )}
          </motion.div>
        )}
      </div>
    </div>
  );
}
