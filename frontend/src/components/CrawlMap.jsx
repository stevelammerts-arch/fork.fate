import { useMemo } from "react";
import { MapContainer, TileLayer, Marker, Polyline, Popup } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

const numberIcon = (n, done) =>
  L.divIcon({
    className: "",
    html: `<div style="width:26px;height:26px;border-radius:9999px;display:flex;align-items:center;justify-content:center;font:700 13px/1 Georgia,serif;color:#fff;background:${done ? "#2E7D32" : "#E01E26"};border:2px solid #fff;box-shadow:0 1px 4px rgba(0,0,0,.35)">${n}</div>`,
    iconSize: [26, 26],
    iconAnchor: [13, 13],
    popupAnchor: [0, -13],
  });

const startIcon = L.divIcon({
  className: "",
  html: `<div style="display:flex;flex-direction:column;align-items:center;transform:translateY(-7px)">
    <div style="background:#38BDF8;color:#04121c;font:700 9px/1 Arial;padding:2px 6px;border-radius:6px;border:1px solid #04121c;white-space:nowrap;box-shadow:0 1px 3px rgba(0,0,0,.6)">START</div>
    <div style="width:11px;height:11px;border-radius:9999px;background:#38BDF8;border:2px solid #04121c;margin-top:2px"></div>
  </div>`,
  iconSize: [50, 30],
  iconAnchor: [25, 22],
  popupAnchor: [0, -22],
});

const endIcon = L.divIcon({
  className: "",
  html: `<div style="display:flex;flex-direction:column;align-items:center;transform:translateY(-7px)">
    <div style="background:#E01E26;color:#fff;font:700 9px/1 Arial;padding:2px 6px;border-radius:6px;border:1px solid #101010;white-space:nowrap;box-shadow:0 1px 3px rgba(0,0,0,.6)">FINISH</div>
    <div style="width:11px;height:11px;border-radius:9999px;background:#E01E26;border:2px solid #101010;margin-top:2px"></div>
  </div>`,
  iconSize: [50, 30],
  iconAnchor: [25, 22],
  popupAnchor: [0, -22],
});

const liveIcon = L.divIcon({
  className: "",
  html: `<div style="position:relative;width:18px;height:18px">
    <span class="animate-ping" style="position:absolute;inset:0;border-radius:9999px;background:#4ADE80;opacity:.55"></span>
    <span style="position:absolute;inset:3px;border-radius:9999px;background:#4ADE80;border:2px solid #0B0B0B"></span>
  </div>`,
  iconSize: [18, 18],
  iconAnchor: [9, 9],
  popupAnchor: [0, -9],
});

const escapeHtml = (s) => String(s || "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

// Blue pin + name tag for each live crew member on a shared crawl.
const crewIcon = (name) =>
  L.divIcon({
    className: "",
    html: `<div style="display:flex;flex-direction:column;align-items:center;transform:translateY(-6px)">
      <div style="background:rgba(4,18,28,.85);color:#7DD3FC;font:700 9px/1 Arial;padding:2px 6px;border-radius:6px;border:1px solid #38BDF8;white-space:nowrap;box-shadow:0 1px 3px rgba(0,0,0,.6)">${escapeHtml(name)}</div>
      <div style="position:relative;width:14px;height:14px;margin-top:2px">
        <span class="animate-ping" style="position:absolute;inset:0;border-radius:9999px;background:#38BDF8;opacity:.5"></span>
        <span style="position:absolute;inset:2px;border-radius:9999px;background:#38BDF8;border:2px solid #04121c"></span>
      </div>
    </div>`,
    iconSize: [60, 30],
    iconAnchor: [30, 24],
    popupAnchor: [0, -24],
  });

// Blazing orange beacon for a popped "flare on me" — impossible to miss.
const flareIcon = (name) =>
  L.divIcon({
    className: "",
    html: `<div style="display:flex;flex-direction:column;align-items:center;transform:translateY(-8px)">
      <div style="background:rgba(28,10,2,.9);color:#FFB25E;font:700 9px/1 Arial;padding:2px 6px;border-radius:6px;border:1px solid #FF7A1A;white-space:nowrap;box-shadow:0 1px 3px rgba(0,0,0,.6)">FLARE · ${escapeHtml(name)}</div>
      <div style="position:relative;width:26px;height:26px;margin-top:2px">
        <span class="animate-ping" style="position:absolute;inset:0;border-radius:9999px;background:#FF7A1A;opacity:.7"></span>
        <span class="animate-ping" style="position:absolute;inset:4px;border-radius:9999px;background:#FFB25E;opacity:.6;animation-delay:.35s"></span>
        <span style="position:absolute;inset:7px;border-radius:9999px;background:radial-gradient(circle at 40% 35%, #FFE3B8, #FF7A1A 65%);border:2px solid #1c0a02;box-shadow:0 0 12px #FF7A1A"></span>
      </div>
    </div>`,
    iconSize: [70, 36],
    iconAnchor: [35, 28],
    popupAnchor: [0, -28],
  });

// Interactive, no-cost route map (OpenStreetMap data via CARTO dark tiles).
// Renders numbered pins + a connecting line for the crawl route.
export default function CrawlMap({ stops = [], origin = null, destination = null, visited = {}, livePos = null, crew = [], flares = [], height = 170 }) {
  const pts = useMemo(
    () => stops.filter((s) => s.lat != null && s.lng != null).map((s) => ({ ...s, ll: [Number(s.lat), Number(s.lng)] })),
    [stops]
  );

  const bounds = useMemo(() => {
    const all = pts.map((p) => p.ll);
    if (origin && origin.lat != null) all.push([Number(origin.lat), Number(origin.lng)]);
    if (destination && destination.lat != null) all.push([Number(destination.lat), Number(destination.lng)]);
    return all.length ? L.latLngBounds(all).pad(0.25) : null;
  }, [pts, origin, destination]);

  const crewPins = useMemo(() => crew.filter((c) => c.lat != null && c.lng != null), [crew]);
  const flarePins = useMemo(() => flares.filter((f) => f.lat != null && f.lng != null), [flares]);

  if (pts.length < 1 || !bounds) return null;

  return (
    <div className="overflow-hidden rounded-xl border border-[#E2E4E7]" data-testid="crawl-map">
      <MapContainer
        bounds={bounds}
        scrollWheelZoom={false}
        style={{ height, width: "100%", background: "#EDEAE3" }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {origin && origin.lat != null && (
          <Marker position={[Number(origin.lat), Number(origin.lng)]} icon={startIcon}>
            <Popup>Start here</Popup>
          </Marker>
        )}
        {destination && destination.lat != null && (
          <Marker position={[Number(destination.lat), Number(destination.lng)]} icon={endIcon}>
            <Popup>Finish here</Popup>
          </Marker>
        )}
        {pts.length > 1 && (
          <Polyline positions={pts.map((p) => p.ll)} pathOptions={{ color: "#E01E26", weight: 3, opacity: 0.85, dashArray: "6 6" }} />
        )}
        {pts.map((p, i) => (
          <Marker key={`${p.id ?? "s"}-${i}`} position={p.ll} icon={numberIcon(i + 1, !!visited[p.id])}>
            <Popup>
              <strong>{i + 1}. {p.name}</strong>
              {p.cuisine ? <div>{p.cuisine}</div> : null}
            </Popup>
          </Marker>
        ))}
        {livePos && livePos.lat != null && (
          <Marker position={[Number(livePos.lat), Number(livePos.lng)]} icon={liveIcon}>
            <Popup>You are here</Popup>
          </Marker>
        )}
        {crewPins.map((c) => (
          <Marker key={c.member_id} position={[Number(c.lat), Number(c.lng)]} icon={crewIcon(c.name || "Crew")}>
            <Popup>{c.name || "Crew"}</Popup>
          </Marker>
        ))}
        {flarePins.map((f) => (
          <Marker key={`flare-${f.member_id}`} position={[Number(f.lat), Number(f.lng)]} icon={flareIcon(f.name || "Crew")} zIndexOffset={1000}>
            <Popup>{(f.name || "Crew") + " popped a flare here!"}</Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}
