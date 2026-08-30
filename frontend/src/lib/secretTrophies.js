// Secret trophies: the first time a player discovers each realm touch-reaction
// they earn a one-time named trophy (+Fate Points). The Secrets page shows the
// hunt progress; hints stay cryptic, realms stay peek-to-reveal.
import { toast } from "sonner";
import { awardPoints } from "./points";

const KEY = "ff_secrets_found"; // { [id]: foundAtMs }
export const SECRET_POINTS = 20;

export const SECRETS = [
  { id: "fireflies", title: "Lantern Snatcher", hint: "Tiny lanterns drift after dusk. Catch one and fate tips you daily.", realm: "Fall Forest" },
  { id: "squirrel", title: "Bushy-Tail Whisperer", hint: "Something bushy-tailed scolds intruders, then takes the high road.", realm: "Fall Forest" },
  { id: "gecko", title: "Gecko Startler", hint: "A small sunbather chirps when startled — twice over, if you find them both.", realm: "Tiki Lounge" },
  { id: "bats", title: "Shadow Scatterer", hint: "The night's shadows scatter if you reach for them.", realm: "Reaper's Domain" },
  { id: "reaper-laugh", title: "Death's Comedian", hint: "Look Death square in the face — he finds that hilarious.", realm: "Reaper's Domain" },
  { id: "reaper-sizzle", title: "Midnight Chef", hint: "His last supper still sizzles if you disturb the plate.", realm: "Reaper's Domain" },
  { id: "dust-bunnies", title: "Dust Wrangler", hint: "Tiny fluffs drift in the morning window light. Reach out and they bolt.", realm: "Coffee Shop" },
  { id: "steam-console", title: "Panel Tinkerer", hint: "The workshop's side panels still answer in beeps.", realm: "Steampunk" },
  { id: "snowman", title: "Head Turner", hint: "Give the waving fellow a tap — he'll lose his head over it.", realm: "Winter" },
  { id: "santa", title: "Sleigh Spooker", hint: "Poke the midnight courier and watch him bolt for the stars.", realm: "Winter" },
  { id: "beachball", title: "Extra Bounce", hint: "Some toys on the sand just want one more bounce.", realm: "Summer" },
  { id: "gulls", title: "Squadron Spooker", hint: "Spook one of the shoreline patrol and the whole squadron wheels away.", realm: "Summer" },
  { id: "petal-gust", title: "Bloom Catcher", hint: "Catch a falling bloom and the wind itself answers.", realm: "Spring" },
  { id: "unicorn", title: "Unicorn Whisperer", hint: "The gully's pale grazer startles at a gentle touch — and the gallop answers too, if you can keep up.", realm: "Fairy Gully" },
  { id: "dragon-claw", title: "Treasure Presser", hint: "Press the hoard-keeper's grip and hear the treasure complain.", realm: "Dragon's Hoard" },
  { id: "dragon-roar", title: "Cavern Waker", hint: "Dare a tap on the hoard-keeper's crown — the whole cavern answers.", realm: "Dragon's Hoard" },
  { id: "neon-sign", title: "Loose Wire", hint: "Even the sky's brightest sign has a loose wire.", realm: "Cyberscape" },
];

export function readSecretsFound() {
  try {
    const o = JSON.parse(localStorage.getItem(KEY) || "{}");
    return o && typeof o === "object" && !Array.isArray(o) ? o : {};
  } catch {
    return {};
  }
}

/** Records a first-time discovery: trophy toast + points. Safe to call on
 * every interaction — repeats are no-ops. Returns true on a NEW find. */
export function foundSecret(id) {
  const s = SECRETS.find((x) => x.id === id);
  if (!s) return false;
  const found = readSecretsFound();
  if (found[id]) return false;
  found[id] = Date.now();
  try {
    localStorage.setItem(KEY, JSON.stringify(found));
  } catch {
    return false; // storage unavailable — don't award unpersistable trophies
  }
  awardPoints(SECRET_POINTS, `Secret found: ${s.title}`);
  const n = Object.keys(found).length;
  toast.success(`Secret trophy: “${s.title}”`, {
    description: `+${SECRET_POINTS} Fate Points — ${n}/${SECRETS.length} hidden bonuses discovered`,
    duration: 6000,
  });
  try { window.dispatchEvent(new CustomEvent("ff:secret-found", { detail: { id, n } })); } catch { /* ignore */ }
  return true;
}
