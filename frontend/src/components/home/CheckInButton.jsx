// FATED CHECK-IN: prove you actually went. GPS-verified (within 150 m of the
// fated restaurant) and worth +50 Fate Points, once per place per day.
import { useState } from "react";
import { toast } from "sonner";
import { MapPin, CheckCircle2, Loader2 } from "lucide-react";
import { EARN, claimCheckin, checkedInToday } from "../../lib/points";
import { useLang } from "../../i18n/i18n";

const RADIUS_M = 150;

const metersBetween = (a, b) => {
  const R = 6371000;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLng = ((b.lng - a.lng) * Math.PI) / 180;
  const s = Math.sin(dLat / 2) ** 2 + Math.cos((a.lat * Math.PI) / 180) * Math.cos((b.lat * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(s));
};

export const CheckInButton = ({ card }) => {
  const { t } = useLang();
  const key = card.place_id || card.google_url || card.name;
  const [done, setDone] = useState(() => checkedInToday(key));
  const [busy, setBusy] = useState(false);

  if (card.lat == null || card.lng == null) return null;

  const checkIn = () => {
    if (done || busy) return;
    if (!navigator.geolocation) { toast.error(t("Location isn't available on this device")); return; }
    setBusy(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setBusy(false);
        const d = metersBetween({ lat: pos.coords.latitude, lng: pos.coords.longitude }, { lat: card.lat, lng: card.lng });
        if (d > RADIUS_M) {
          const away = d >= 1000 ? `${(d / 1000).toFixed(1)} km` : `${Math.round(d)} m`;
          toast(t("Not quite there yet"), { description: `${t("You're")} ${away} ${t("away — check in when you arrive.")}` });
          return;
        }
        const total = claimCheckin(key, card.name);
        if (total == null) { setDone(true); return; }
        setDone(true);
        toast.success(`+${EARN.checkin} ${t("Fate Points")}`, { description: `${t("Checked in at")} ${card.name}`, duration: 6000 });
      },
      () => { setBusy(false); toast.error(t("Couldn't access your location — allow it and try again.")); },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  return (
    <button
      type="button"
      data-testid="fate-checkin-button"
      data-lat={card.lat}
      data-lng={card.lng}
      onClick={checkIn}
      disabled={done}
      className={`flex items-center justify-center gap-2 rounded-full border-2 px-4 py-3 text-sm font-bold transition-transform ${
        done ? "cursor-default border-[#2E7D32] bg-[#EDF7EE] text-[#2E7D32]" : "border-[#E6B23A] bg-[#FFF9EC] text-[#8A6410] hover:-translate-y-0.5"}`}
    >
      {done ? (<><CheckCircle2 className="h-4 w-4" /> {t("Checked in today")}</>)
        : busy ? (<><Loader2 className="h-4 w-4 animate-spin" /> {t("Locating...")}</>)
        : (<><MapPin className="h-4 w-4" /> {t("Check in here")} · +{EARN.checkin} {t("pts")}</>)}
    </button>
  );
};
