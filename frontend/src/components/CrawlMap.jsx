import { useMemo } from "react";
import { MapContainer, TileLayer, Marker, Polyline, Popup } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

const numberIcon = (n, done) =>
  L.divIcon({
    className: "",
    html: `<div style="width:26px;height:26px;border-radius:9999px;display:flex;align-items:center;justify-content:center;font:700 13px/1 Georgia,serif;color:${done ? "#0B0B0B" : "#fff"};background:${done ? "#4ADE80" : "#E01E26"};border:2px solid #101010;box-shadow:0 1px 4px rgba(0,0,0,.6)">${n}</div>`,
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

// Interactive, no-cost route map (OpenStreetMap data via CARTO dark tiles).
// Renders numbered pins + a connecting line for the crawl route.
export default function CrawlMap({ stops = [], origin = null, destination = null, visited = {}, livePos = null }) {
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

  if (pts.length < 1 || !bounds) return null;

  return (
    <div className="overflow-hidden rounded-xl border border-[#2A2A2A]" data-testid="crawl-map">
      <MapContainer
        bounds={bounds}
        scrollWheelZoom={false}
        style={{ height: 200, width: "100%", background: "#0B0B0B" }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>'
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
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
      </MapContainer>
    </div>
  );
}
