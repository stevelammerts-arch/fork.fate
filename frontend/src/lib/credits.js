// SOUND & MUSIC CREDITS data. Edit this file to fill in / correct
// attributions — the /credits page renders whatever is listed here.
// The bulk of Fork·Fate's audio comes from Pixabay (Pixabay Content License:
// free for commercial use, no attribution required — credited out of respect).

export const PIXABAY_NOTE = {
  title: "The Pixabay Sound Community",
  blurb: "Over 80% of Fork·Fate's music and sound effects — realm ambience, stingers, creature calls, weather and contraptions — come from the generous artists of Pixabay, used under the Pixabay Content License (commercial use permitted, no attribution required). We tip our scythe to every one of them.",
  url: "https://pixabay.com",
};

export const COMMUNITY_SOUNDS = [
  // Individually sourced clips — fill in creator names to credit them by name.
  { name: "Autumn leaf rustle", files: "leaf-rustle.mp3", creator: "(add creator)", source: "Freesound", url: "", license: "(confirm license)" },
  { name: "Danza concheros drum groove", files: "reveal-drums*.wav", creator: "(add creator)", source: "Pixabay", url: "", license: "Pixabay Content License" },
  { name: "Cinematic timpani hit", files: "reveal-drums-boom.wav", creator: "(add creator)", source: "Pixabay", url: "", license: "Pixabay Content License" },
  { name: "Glitchy electric zap", files: "arm-zap.mp3", creator: "Soundzee", source: "Pixabay", url: "", license: "Pixabay Content License" },
  { name: "Windshield wiper squeak", files: "wiper-squeak.mp3", creator: "(add creator)", source: "Pixabay", url: "", license: "Pixabay Content License" },
  { name: "Seagull colony", files: "shuffle-seagulls.wav, gull-mine.mp3", creator: "(add creator)", source: "Pixabay", url: "", license: "Pixabay Content License" },
];

export const CRAFTED_SOUNDS = [
  { name: "Reveal stings & shuffle beds", detail: "Card deals, drum rolls, thunder cracks, koto plucks, sleigh bells and realm flourishes — synthesized or arranged in the Fork·Fate workshop." },
  { name: "Creature voices & contraptions", detail: "Golem gears, furnace crackle, piezo alarms, neon fizzles and the racing heartbeat — synthesized in-house." },
  { name: "Announcer voices", detail: "Generated with OpenAI text-to-speech." },
];

export const TOOLS = [
  "WebAudio API — interactive beeps, flatlines and console chatter, synthesized live on your device",
  "OpenAI TTS — announcer voice lines",
  "ffmpeg — trimming, fades and pitch work",
];
