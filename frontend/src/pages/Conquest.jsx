import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { ArrowLeft, Map as MapIcon } from "lucide-react";
import { readJournal } from "../lib/journal";
import { useLang } from "../i18n/i18n";

const pinIcon = (n) =>
  L.divIcon({
    className: "",
    html: `<div style="width:22px;height:22px;border-radius:9999px;background:#E01E26;border:2px solid #fff;box-shadow:0 1px 4px rgba(0,0,0,.5);display:grid;place-items:center;color:#fff;font:700 10px/1 Arial">${n}</div>`,
    iconSize: [22, 22],
    iconAnchor: [11, 11],
    popupAnchor: [0, -12],
  });

/** Conquest Map: a pin for every spot fate has ever sent this device.
 * Coordinates are recorded with each deal from FF_BUILD 406 onward, so the
 * map fills in as new fates land. */
export default function Conquest() {
  const { t } = useLang();
  const [entries, setEntries] = useState([]);
  useEffect(() => { setEntries(readJournal()); }, []);
  const pinned = useMemo(() => entries.filter((e) => e.lat != null && e.lng != null), [entries]);
  const center = pinned.length
    ? [pinned.reduce((s, p) => s + Number(p.lat), 0) / pinned.length, pinned.reduce((s, p) => s + Number(p.lng), 0) / pinned.length]
    : [39.5, -98.35];

  return (
    <div className="min-h-screen bg-[#141416] px-4 py-6 text-white" data-testid="conquest-page">
      <div className="mx-auto max-w-3xl">
        <Link to="/journal" className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#9BA0A6] hover:text-white" data-testid="conquest-back">
          <ArrowLeft className="h-4 w-4" /> {t("Back to the journal")}
        </Link>
        <div className="mt-3 flex items-center gap-3">
          <MapIcon className="h-7 w-7 text-[#E01E26]" />
          <div>
            <h1 className="font-serif text-3xl font-bold" data-testid="conquest-title">{t("Conquest Map")}</h1>
            <p className="text-sm text-[#9BA0A6]">
              {pinned.length
                ? `${pinned.length} ${t("spots conquered — every pin is a place fate sent you.")}`
                : t("No pins yet — from now on, every fate you land drops a pin here. Go let fate deal!")}
            </p>
          </div>
        </div>
        <div className="mt-4 overflow-hidden rounded-2xl border border-white/10" style={{ height: "60vh" }} data-testid="conquest-map">
          <MapContainer center={center} zoom={pinned.length ? 11 : 4} style={{ height: "100%", width: "100%" }} scrollWheelZoom>
            <TileLayer
              attribution='&copy; OpenStreetMap contributors'
              url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            {pinned.map((p, i) => (
              <Marker key={`${p.id}-${i}`} position={[Number(p.lat), Number(p.lng)]} icon={pinIcon(pinned.length - i)}>
                <Popup>
                  <span className="font-bold">{p.name}</span>
                  {p.cuisine ? <> · {p.cuisine}</> : null}
                  <br />
                  {new Date(p.date).toLocaleDateString()}
                </Popup>
              </Marker>
            ))}
          </MapContainer>
        </div>
        {entries.length > 0 && pinned.length === 0 && (
          <p className="mt-3 text-center text-xs text-[#6B7075]" data-testid="conquest-legacy-note">
            {t("Your past fates were recorded before map pins existed — new deals will start pinning from here on out.")}
          </p>
        )}
      </div>
    </div>
  );
}
