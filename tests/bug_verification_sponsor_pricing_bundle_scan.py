"""Fetch the preview HTML/JS assets and scan for old sponsor price strings."""

from urllib.parse import urljoin
import re
import requests

BASE = "https://web-fate-launch.preview.emergentagent.com"
BAD_STRINGS = ["$29/month", "$29 a month", "$290/year", "Save $58", "Ahorra $58", "$29/mes", "$290 hoy"]
DISCOUNT_MARKERS = ["$29", "$290"]


def fetch(url):
    r = requests.get(url, timeout=20)
    r.raise_for_status()
    return r.text


def main():
    html = fetch(BASE + "/")
    urls = {BASE + "/"}
    for attr in ("src", "href"):
        for m in re.finditer(fr'{attr}=["\']([^"\']+)["\']', html):
            href = m.group(1)
            if any(x in href for x in (".js", ".html")):
                urls.add(urljoin(BASE + "/", href))

    combined = []
    for url in sorted(urls):
        text = fetch(url)
        combined.append((url, text))
        for bad in BAD_STRINGS:
            assert bad not in text, f"Found stale price string {bad!r} in {url}"

    marker_hits = []
    for url, text in combined:
        for marker in DISCOUNT_MARKERS:
            for m in re.finditer(re.escape(marker), text):
                marker_hits.append((marker, url, max(0, m.start() - 80), min(len(text), m.end() + 80)))

    assert any(hit[0] == "$29" for hit in marker_hits), "Expected intentional $29 strikethrough marker not found"
    assert any(hit[0] == "$290" for hit in marker_hits), "Expected intentional $290 strikethrough marker not found"
    print(f"Scanned {len(combined)} preview HTML/JS asset(s); no stale $29/month/$290/year/Save $58 strings found.")
    print(f"Intentional discount marker hits: {len(marker_hits)}")


if __name__ == "__main__":
    main()