// The realm scenery stack behind the page: café / seasonal / ambiance /
// reaper backgrounds plus each realm's page-level heists and companions.
import { SEASONS, AMBIANCE, SeasonScene, AmbianceScene, ReaperHeist, GhostSnatchHeist, ReaperPlateHeist, CoffeeSpillHeist, CompanionPatrol } from "../ThemeScenes";
import { RealmEntrySting } from "../scenes/RealmEntrySting";
import { ReaperScene } from "../ReaperScene";
import { CafeDustMotes, CafeCounterCup } from "../CafeDustMotes";

export const RealmLayers = ({ theme, seasonCfg, ambCfg, heistEpoch }) => (
  <>
    {/* Light-mode: faded bright café / restaurant interior background */}
    {theme === "light" && (
      <div
        className="pointer-events-none fixed inset-0 z-0 select-none bg-cover bg-center"
        data-testid="cafe-bg-light"
        style={{ backgroundImage: "url('/cafe-bg-light.png')", opacity: 0.28 }}
      />
    )}
    {/* Coffee Shop ambience: dust motes drifting in warm café light */}
    {theme === "light" && <CafeDustMotes />}
    {/* ...and a steaming cup of coffee resting in the scene */}
    {theme === "light" && <CafeCounterCup />}
    {/* Seasonal themes: tree + decor + falling sprites */}
    {seasonCfg && <SeasonScene theme={theme} cfg={seasonCfg} heistEpoch={heistEpoch} />}
    {/* One-shot realm-entry music stings (user-provided tracks) */}
    <RealmEntrySting theme={theme} />
    {/* Ambiance themes: cyberpunk / steampunk / tiki lounge */}
    {ambCfg && <AmbianceScene theme={theme} cfg={ambCfg} heistEpoch={heistEpoch} />}
    {/* Dark-mode: decorative reaper background with load animation */}
    {theme === "dark" && <ReaperScene />}
    {theme === "dark" && <ReaperHeist key={`rh-${heistEpoch}`} />}
    {theme === "dark" && <GhostSnatchHeist key={`gh-${heistEpoch}`} />}
    {theme === "dark" && <ReaperPlateHeist key={`ph-${heistEpoch}`} />}
    {/* Café: the runaway coffee cup that melts the medallion like sugar */}
    {theme === "light" && <CoffeeSpillHeist key={`ch-${heistEpoch}`} />}
    {/* the little reaper follower: drifts around the page trailing black smoke */}
    {theme === "dark" && <CompanionPatrol s1="/reaper-fly-1.png" s2="/reaper-fly-2.png" glow="rgba(140,110,200,0.45)" dustCol={["#8E7BB8", "#2A2038"]} testid="reaper-companion" flap="ffReaperFrame 2.6s ease-in-out infinite" flapBase="ffReaperFrameInv 2.6s ease-in-out infinite" bob="ffPixieBob 3.6s ease-in-out infinite" />}
  </>
);
