// Floating sound + scenery-eye toggles, stacked bottom-right in every realm.
import { Eye, EyeOff, Volume2, VolumeX } from "lucide-react";

// NB: no backdrop-blur here — WebKit has long-standing hit-testing bugs with
// backdrop-filter on position:fixed elements (taps pass through / misregister
// on iOS Safari), so the pills use solid translucent backgrounds instead.
const pillCls = (scenery, light) => `ff-float-pill fixed right-5 z-[75] grid h-11 w-11 place-items-center rounded-full border transition-all duration-300 ${scenery
  ? "border-white/30 bg-black/50 text-white/80 opacity-60 hover:opacity-100"
  : light
  ? "border-[#E2E4E7] bg-white/95 text-[#6B7075] shadow-sm hover:text-[#0E0E0E]"
  : "border-white/15 bg-black/60 text-white/60 hover:text-white"}`;

export const FloatingToggles = ({ muted, toggleMuted, scenery, toggleScenery, light }) => (
  <>
    {/* SOUND toggle: floats just above the scenery eye, present in every realm */}
    <button
      onClick={toggleMuted}
      data-testid="sound-toggle-button"
      title={muted ? "Sound off — click to enable sound" : "Sound on — click to mute"}
      aria-label={muted ? "Enable sound" : "Mute sound"}
      className={`ff-float-pill-upper bottom-[4.75rem] ${pillCls(scenery, light)}`}
    >
      {muted ? <VolumeX className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />}
    </button>

    {/* SCENERY MODE eye: floats above everything; the page wrapper fades.
        ff-float-pill-lower lifts it clear of iOS Safari's bottom-bar tap dead
        zone (first taps there re-expand the toolbar instead of reaching the
        page) and the home indicator — see index.css. */}
    <button
      onClick={toggleScenery}
      data-testid="scenery-toggle"
      aria-label={scenery ? "Bring the interface back" : "Hide the interface to enjoy the scenery"}
      className={`ff-float-pill-lower bottom-5 ${pillCls(scenery, light)}`}
    >
      {scenery ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
    </button>
  </>
);
