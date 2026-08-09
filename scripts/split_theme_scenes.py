#!/usr/bin/env python3
"""One-shot splitter: slices components/ThemeScenes.jsx into focused modules
under components/scenes/. Verbatim moves; only import/export lines added."""
import os

SRC = "/app/frontend/src/components/ThemeScenes.jsx"
OUT = "/app/frontend/src/components/scenes"
os.makedirs(OUT, exist_ok=True)

lines = open(SRC).read().splitlines(keepends=True)

def sl(a, b):  # 1-indexed inclusive slice
    return "".join(lines[a - 1:b])

def promote(text, names):
    """Add `export` to plain function declarations we now need across modules."""
    for n in names:
        text = text.replace(f"\nfunction {n}(", f"\nexport function {n}(")
        if text.startswith(f"function {n}("):
            text = "export " + text
    return text

HEIST_LIB_HDR = '''// Shared heist plumbing: the header-medallion "summon", the startled title
// hop, first-sighting witness toasts, and the generic grab-from-below engine.
import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { useLang } from "../../i18n/i18n";
import { HEISTS, recordHeistSeen } from "../../lib/rituals";

'''
heist_lib = HEIST_LIB_HDR + sl(608, 642) + "\n" + sl(1046, 1162)
heist_lib = promote(heist_lib, ["summonToLogo", "startleTitle", "useHeistWitness", "LogoHeist"])

COMPANION_HDR = '''// The realm companions (fairy pixie, tiny dragon, tiki surfer): a shared
// patrol engine that lives on the page, visits sections, and pulls heists.
import { useState, useEffect, useRef } from "react";
import { summonToLogo, startleTitle, useHeistWitness } from "./heistLib";

'''
companion = COMPANION_HDR + sl(643, 1045)

SEASON_HEISTS_HDR = '''// Seasonal-realm logo heists: beach ball, crab, snowman, owl, petal gust,
// cardinal tip. Each strikes the header medallion via the shared heist lib.
import { useState, useEffect, useRef } from "react";
import { summonToLogo, startleTitle, useHeistWitness } from "./heistLib";

'''
season_heists = SEASON_HEISTS_HDR + sl(1290, 1791) + "\n" + sl(2864, 2955)
season_heists = promote(season_heists, [
    "SummerBallHeist", "SummerCrabHeist", "SnowmanHeist", "OwlHeist",
    "SpringPetalHeist", "CardinalTipHeist"])

REALM_HEISTS_HDR = '''// Ambiance-realm logo heists: saucer abduction, dragon claw, reaper hands,
// soul snatch, tiki spear, steam spring/gears, coffee spill, reaper plate,
// unicorn charge. Each strikes the header medallion via the shared heist lib.
import { useState, useEffect, useRef } from "react";
import { LogoHeist, summonToLogo, startleTitle, useHeistWitness } from "./heistLib";

'''
realm_heists = (REALM_HEISTS_HDR + sl(510, 607) + "\n" + sl(1163, 1289) + "\n"
                + sl(1792, 2107) + "\n" + sl(2529, 2863))
realm_heists = promote(realm_heists, [
    "SaucerAbduction", "DragonHeist", "TikiSpearHeist", "SteamSpringHeist",
    "SteamGearsHeist", "UnicornChargeHeist"])

SEASON_SCENE_HDR = '''// Seasonal realm scenery (fall / winter / spring / summer): background art,
// falling sprites, gust snow, chimney smoke — plus that season's heists.
import { useState, useEffect, useRef } from "react";
import { SummerBallHeist, SummerCrabHeist, SnowmanHeist, CardinalTipHeist, OwlHeist, SpringPetalHeist } from "./seasonHeists";

'''
season_scene = SEASON_SCENE_HDR + sl(7, 43) + "\n" + sl(143, 318)

AMBIANCE_HDR = '''// Ambiance realm scenery (cyberscape / steampunk / tiki / fantasy / fairy):
// background art, ambient sprites, neon sign, gecko, torches — plus each
// realm's companions and heists.
import { useState, useEffect, useRef } from "react";
import { useHeistWitness } from "./heistLib";
import { CompanionPatrol } from "./companion";
import { SaucerAbduction, DragonHeist, TikiSpearHeist, SteamSpringHeist, SteamGearsHeist, UnicornChargeHeist } from "./realmHeists";

'''
ambiance = (AMBIANCE_HDR + sl(44, 142) + "\n" + sl(319, 509) + "\n"
            + sl(2108, 2209) + "\n" + sl(2210, 2528))

BARREL = '''// ThemeScenes barrel: the scenery engine lives in components/scenes/*.
// (Split 2026-02 from a single 2955-line file — imports stay stable.)
export { SEASONS, SeasonScene } from "./scenes/SeasonScene";
export { AMBIANCE, AmbianceScene, ButterflySprite, FlutterButterfly } from "./scenes/AmbianceScene";
export { CompanionPatrol } from "./scenes/companion";
export { ReaperHeist, GhostSnatchHeist, CoffeeSpillHeist, ReaperPlateHeist } from "./scenes/realmHeists";
'''

open(f"{OUT}/heistLib.jsx", "w").write(heist_lib)
open(f"{OUT}/companion.jsx", "w").write(companion)
open(f"{OUT}/seasonHeists.jsx", "w").write(season_heists)
open(f"{OUT}/realmHeists.jsx", "w").write(realm_heists)
open(f"{OUT}/SeasonScene.jsx", "w").write(season_scene)
open(f"{OUT}/AmbianceScene.jsx", "w").write(ambiance)
open(SRC, "w").write(BARREL)
for f in os.listdir(OUT):
    p = os.path.join(OUT, f)
    print(f, sum(1 for _ in open(p)))
print("ThemeScenes.jsx", sum(1 for _ in open(SRC)))
