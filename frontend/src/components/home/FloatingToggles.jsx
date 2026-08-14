// Floating sound + scenery-eye toggles, stacked bottom-right in every realm.
import { Eye, EyeOff, Volume2, VolumeX } from "lucide-react";

const pillCls = (scenery, light) => `fixed right-5 z-[75] grid h-11 w-11 place-items-center rounded-full border backdrop-blur-sm transition-all duration-300 ${scenery
  ? "border-white/30 bg-black/30 text-white/80 opacity-60 hover:opacity-100"
  : light
  ? "border-[#E2E4E7] bg-white/85 text-[#6B7075] shadow-sm hover:text-[#0E0E0E]"
  : "border-white/15 bg-black/40 text-white/60 hover:text-white"}`;

export const FloatingToggles = ({ muted, toggleMuted, scenery, toggleScenery, light }) => (
  <>
    {/* SOUND toggle: floats just above the scenery eye, present in every realm */}
    <button
      onClick={toggleMuted}
      data-testid="sound-toggle-button"
      title={muted ? "Sound off — click to enable sound" : "Sound on — click to mute"}
      aria-label={muted ? "Enable sound" : "Mute sound"}
      className={`bottom-[4.75rem] ${pillCls(scenery, light)}`}
    >
      {muted ? <VolumeX className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />}
    </button>

    {/* SCENERY MODE eye: floats above everything; the page wrapper fades */}
    <button
      onClick={toggleScenery}
      data-testid="scenery-toggle"
      aria-label={scenery ? "Bring the interface back" : "Hide the interface to enjoy the scenery"}
      className={`bottom-5 ${pillCls(scenery, light)}`}
    >
      {scenery ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
    </button>
  </>
);
