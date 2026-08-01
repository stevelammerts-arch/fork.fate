import { useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, RotateCcw } from "lucide-react";
import { ScratchCover, ThemeCardFrame } from "../components/home/ScratchCover";
import { Magic8Ball } from "../components/home/Magic8Ball";
import { WheelOfFate } from "../components/home/WheelOfFate";

const MOCK_NAMES = [
  "Golden Wok Tavern", "Ember & Oak", "Buffalo Junction", "The Green Fork",
  "Corner Deli & Co", "Union Square Kitchen", "Mama Rosa's", "Night Owl Diner",
];
const WINNER = "Golden Wok Tavern";
const PHOTO = "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800&q=60";

function DemoCard({ title, children, resetKey, onReset }) {
  return (
    <div className="w-full max-w-sm">
      <div className="mb-2 flex items-center justify-between">
        <h2 className="font-serif text-lg text-[#E6B23A]">{title}</h2>
        <button onClick={onReset} data-testid={`reset-${resetKey}`} className="inline-flex items-center gap-1 rounded-full border border-white/20 px-3 py-1 font-sans text-xs font-bold text-white/70 hover:bg-white/10">
          <RotateCcw className="h-3 w-3" /> Replay
        </button>
      </div>
      <div className="relative h-64 overflow-hidden rounded-2xl">
        <img src={PHOTO} alt="" className="h-full w-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
        <div className="absolute bottom-4 left-4">
          <h3 className="font-serif text-3xl text-white drop-shadow">{WINNER}</h3>
        </div>
        {children}
      </div>
    </div>
  );
}

/** Dev-only preview of the three rare-fate reveal rituals (unlisted route). */
export default function RarePreview() {
  const [keys, setKeys] = useState({ scratch: 0, ball: 0, wheel: 0 });
  const bump = (k) => setKeys((s) => ({ ...s, [k]: s[k] + 1 }));

  return (
    <div className="min-h-screen bg-[#0E0E0E] px-6 py-8 text-white" data-testid="rare-preview-page">
      <div className="mx-auto max-w-6xl">
        <Link to="/" className="inline-flex items-center gap-2 font-sans text-sm font-bold text-[#B8BCC2] hover:text-white">
          <ArrowLeft className="h-4 w-4" /> Fork·Fate
        </Link>
        <h1 className="mt-4 font-serif text-3xl">Rare Fate Rituals — Preview</h1>
        <p className="mt-1 font-sans text-sm text-[#8A8F95]">
          One of these replaces the shuffle every ~15 deals. Scratch the foil · shake/rattle the 8-ball · flick the wheel.
        </p>
        <div className="mt-8 flex flex-wrap gap-8">
          <DemoCard title="Scratch Foil (theme: fantasy)" resetKey="scratch" onReset={() => bump("scratch")}>
            <div key={keys.scratch} className="absolute inset-0">
              <div className="pointer-events-none absolute left-1/2 top-4 z-20 -translate-x-1/2 whitespace-nowrap rounded-full border border-[#E6B23A]/30 bg-black/70 px-4 py-1.5 font-serif text-xs font-bold uppercase tracking-[0.2em] text-[#E6B23A]">✦ Rare fate ✦</div>
              <ScratchCover onDone={() => {}} label="Scratch to unveil your fate" theme="fantasy" threshold={0.65} radius={30} testId="preview-scratch" />
              <ThemeCardFrame theme="fantasy" />
            </div>
          </DemoCard>
          <DemoCard title="Magic 8-Ball" resetKey="ball" onReset={() => bump("ball")}>
            <div key={keys.ball} className="absolute inset-0">
              <Magic8Ball name={WINNER} photo={PHOTO} onDone={() => {}} />
              <ThemeCardFrame theme="dark" />
            </div>
          </DemoCard>
          <DemoCard title="Wheel of Fate" resetKey="wheel" onReset={() => bump("wheel")}>
            <div key={keys.wheel} className="absolute inset-0">
              <WheelOfFate names={MOCK_NAMES} winner={WINNER} onDone={() => {}} autoSpin />
              <ThemeCardFrame theme="dark" />
            </div>
          </DemoCard>
        </div>
      </div>
    </div>
  );
}
