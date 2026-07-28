#!/usr/bin/env python3
"""Focused verification for Fork.Fate transparent Printful DTG print assets."""

import hashlib
import io
import json
import os
import sys
import zipfile
from pathlib import Path

import numpy as np
import requests
from PIL import Image


BASE_URL = "https://web-fate-launch.preview.emergentagent.com/downloads"
DOWNLOADS_DIR = Path("/app/frontend/public/downloads")
PRINT_FILES_DIR = Path("/app/print_files")
EXPECTED = [
    "01-spring-petals-CHEST-12x14-WHITE-TRANSPARENT.png",
    "02-spring-tree-CHEST-12x14-WHITE-TRANSPARENT.png",
    "03-spring-scene-BACK-14x18-WHITE-TRANSPARENT.png",
    "04-fall-scene-BACK-14x18-WHITE-TRANSPARENT.png",
    "05-spring-FF-badge-CHEST-3x3-WHITE-TRANSPARENT.png",
    "06-fall-FF-badge-CHEST-3x3-WHITE-TRANSPARENT.png",
    "07-reaper-crypt-BACK-14x18-TRANSPARENT.png",
    "08-reaper-classic-BACK-14x18-TRANSPARENT.png",
    "09-forkfate-circular-logo-BLACK-TRANSPARENT.png",
]
ZIP_NAME = "fork-fate-transparent-print-files.zip"


def sha256_bytes(data: bytes) -> str:
    return hashlib.sha256(data).hexdigest()


def sha256_file(path: Path) -> str:
    return sha256_bytes(path.read_bytes())


def dpi_is_300(info) -> bool:
    dpi = info.get("dpi")
    if not dpi or len(dpi) < 2:
        return False
    return abs(float(dpi[0]) - 300.0) <= 1.0 and abs(float(dpi[1]) - 300.0) <= 1.0


def analyze_png_bytes(data: bytes):
    with Image.open(io.BytesIO(data)) as img:
        result = {
            "mode": img.mode,
            "size": img.size,
            "dpi": img.info.get("dpi"),
        }
        if img.mode != "RGBA":
            result.update({
                "has_rgba": False,
                "unique_alpha_values": None,
                "hard_alpha_only": False,
                "transparent_pct": 0.0,
                "dpi_300": dpi_is_300(img.info),
            })
            return result

        alpha = np.array(img.getchannel("A"))
        unique = np.unique(alpha)
        transparent_pct = float(np.count_nonzero(alpha == 0)) / float(alpha.size) * 100.0
        result.update({
            "has_rgba": True,
            "unique_alpha_values": [int(v) for v in unique.tolist()],
            "hard_alpha_only": set(int(v) for v in unique.tolist()).issubset({0, 255}),
            "transparent_pct": transparent_pct,
            "dpi_300": dpi_is_300(img.info),
        })
        return result


def main():
    session = requests.Session()
    results = {
        "base_url": BASE_URL,
        "expected_files": EXPECTED,
        "zip": {},
        "pngs": {},
        "local": {},
        "failures": [],
    }

    # Local presence and source/download identity checks.
    download_pngs = sorted(p.name for p in DOWNLOADS_DIR.glob("*TRANSPARENT.png")) if DOWNLOADS_DIR.exists() else []
    print_pngs = sorted(p.name for p in PRINT_FILES_DIR.glob("*TRANSPARENT.png")) if PRINT_FILES_DIR.exists() else []
    results["local"]["downloads_transparent_pngs"] = download_pngs
    results["local"]["print_files_transparent_pngs"] = print_pngs
    results["local"]["zip_exists_downloads"] = (DOWNLOADS_DIR / ZIP_NAME).exists()
    results["local"]["zip_exists_print_files"] = (PRINT_FILES_DIR / ZIP_NAME).exists()
    if download_pngs != EXPECTED:
        results["failures"].append(f"Local downloads directory does not contain exactly expected PNGs: {download_pngs}")
    if print_pngs != EXPECTED:
        results["failures"].append(f"Local print_files directory does not contain exactly expected PNGs: {print_pngs}")
    if not (DOWNLOADS_DIR / ZIP_NAME).exists():
        results["failures"].append(f"Local zip missing in downloads: {DOWNLOADS_DIR / ZIP_NAME}")

    sha_mismatches = []
    for name in EXPECTED:
        dpath = DOWNLOADS_DIR / name
        ppath = PRINT_FILES_DIR / name
        if dpath.exists() and ppath.exists() and sha256_file(dpath) != sha256_file(ppath):
            sha_mismatches.append(name)
    results["local"]["source_download_sha_mismatches"] = sha_mismatches
    if sha_mismatches:
        results["failures"].append(f"Source/download PNG copies differ: {sha_mismatches}")

    # Zip HTTP check.
    zip_url = f"{BASE_URL}/{ZIP_NAME}"
    try:
        resp = session.get(zip_url, timeout=60)
        results["zip"].update({
            "url": zip_url,
            "status_code": resp.status_code,
            "content_type": resp.headers.get("content-type"),
            "size_bytes": len(resp.content),
            "size_mb": round(len(resp.content) / (1024 * 1024), 2),
        })
        if resp.status_code != 200:
            results["failures"].append(f"Zip HTTP status is {resp.status_code}, expected 200")
        if "application/zip" not in (resp.headers.get("content-type") or "").lower():
            results["failures"].append(f"Zip content-type is {resp.headers.get('content-type')}, expected application/zip")
        if resp.status_code == 200 and "application/zip" in (resp.headers.get("content-type") or "").lower():
            try:
                with zipfile.ZipFile(io.BytesIO(resp.content)) as zf:
                    names = sorted([Path(n).name for n in zf.namelist() if not n.endswith("/")])
                results["zip"]["contained_files"] = names
                if names != EXPECTED:
                    results["failures"].append(f"Zip contents mismatch: {names}")
            except Exception as exc:  # noqa: BLE001
                results["failures"].append(f"Zip could not be opened: {exc}")
    except Exception as exc:  # noqa: BLE001
        results["zip"]["error"] = str(exc)
        results["failures"].append(f"Zip request failed: {exc}")

    # Individual PNG HTTP and image checks.
    for name in EXPECTED:
        url = f"{BASE_URL}/{name}"
        entry = {"url": url}
        try:
            resp = session.get(url, timeout=60)
            entry.update({
                "status_code": resp.status_code,
                "content_type": resp.headers.get("content-type"),
                "size_bytes": len(resp.content),
                "sha256": sha256_bytes(resp.content) if resp.status_code == 200 else None,
            })
            if resp.status_code != 200:
                results["failures"].append(f"{name}: HTTP status is {resp.status_code}, expected 200")
            if "image/png" not in (resp.headers.get("content-type") or "").lower():
                results["failures"].append(f"{name}: content-type is {resp.headers.get('content-type')}, expected image/png")
            if resp.status_code == 200:
                analysis = analyze_png_bytes(resp.content)
                entry.update(analysis)
                if not analysis["has_rgba"]:
                    results["failures"].append(f"{name}: mode is {analysis['mode']}, expected RGBA")
                if not analysis["hard_alpha_only"]:
                    results["failures"].append(f"{name}: alpha values are {analysis['unique_alpha_values']}, expected only 0 and 255")
                if analysis["transparent_pct"] < 20.0:
                    results["failures"].append(f"{name}: transparent pixels {analysis['transparent_pct']:.2f}%, expected >=20%")
                if not analysis["dpi_300"]:
                    results["failures"].append(f"{name}: dpi metadata is {analysis['dpi']}, expected ~300 DPI")
        except Exception as exc:  # noqa: BLE001
            entry["error"] = str(exc)
            results["failures"].append(f"{name}: request/analysis failed: {exc}")
        results["pngs"][name] = entry

    output_path = Path("/app/test_reports/transparent_print_assets_results.json")
    output_path.write_text(json.dumps(results, indent=2, default=str))
    print(json.dumps(results, indent=2, default=str))
    return 1 if results["failures"] else 0


if __name__ == "__main__":
    sys.exit(main())