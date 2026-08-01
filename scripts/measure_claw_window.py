"""Measure the transparent grip-window inside dragon-claw.png.

Prints PNG size, window bbox, window aspect and the computed CSS values
(rendered width, translate offsets, scaleY) needed so the window maps
exactly onto the 176x288 reveal card in ShufflingDeck.jsx.
"""
import sys

import numpy as np
from PIL import Image

SRC = sys.argv[1] if len(sys.argv) > 1 else "/app/frontend/public/dragon-claw.png"

CARD_W, CARD_H = 176, 288  # w-44 h-72 deck container
OVERLAP = 8  # px of claw overlap onto each card edge


def window_bbox(alpha):
    """Find the interior transparent hole: for each row, the largest
    transparent gap between opaque runs. Rows where that gap is wide and
    bounded on both sides belong to the window."""
    h, w = alpha.shape
    lefts, rights, rows = [], [], []
    for y in range(h):
        idx = np.where(alpha[y])[0]
        if len(idx) < 2:
            continue
        d = np.diff(idx)
        gi = int(np.argmax(d))
        gap = int(d[gi])
        if gap > w * 0.15:
            lefts.append(int(idx[gi]) + 1)
            rights.append(int(idx[gi + 1]) - 1)
            rows.append(y)
    if not rows:
        raise SystemExit("no window found")
    # Window edges = stable extremes (5th/95th percentile guards outliers)
    x0 = int(np.percentile(lefts, 10))
    x1 = int(np.percentile(rights, 90))
    y0, y1 = rows[0], rows[-1]
    return x0, y0, x1, y1


def main():
    img = Image.open(SRC).convert("RGBA")
    a = np.array(img)[:, :, 3] > 30
    W, H = img.size
    x0, y0, x1, y1 = window_bbox(a)
    ww, wh = x1 - x0, y1 - y0
    print(f"png: {W}x{H}")
    print(f"window bbox: x {x0}-{x1} y {y0}-{y1}  ({ww}x{wh})  aspect {ww/wh:.2f}")
    print(f"card aspect: {CARD_W/CARD_H:.2f}")
    # Uniform scale from width so window w -> card w - 2*overlap
    target_w = CARD_W + 2 * OVERLAP
    scale = target_w / ww
    render_w = W * scale
    render_window_h = wh * scale
    target_h = CARD_H + 2 * OVERLAP
    scale_y_adj = target_h / render_window_h
    print(f"uniform scale {scale:.3f} -> img width {render_w:.0f}px")
    print(f"window renders {target_w:.0f}x{render_window_h:.0f}; card needs {target_h}")
    print(f"required scaleY adj: {scale_y_adj:.2f} (keep within 0.85-1.25 for no distortion)")
    # Offset of window center from image center, in rendered px
    wcx, wcy = (x0 + x1) / 2, (y0 + y1) / 2
    dx = (W / 2 - wcx) * scale
    dy = (H / 2 - wcy) * scale * scale_y_adj
    print(f"translate correction: x {dx:+.0f}px  y {dy:+.0f}px")
    print("--- CSS ---")
    print(f'wrapper: transform: translate(calc(-50% + {dx:.0f}px), calc(-50% + {dy:.0f}px))')
    print(f'img: width {render_w:.0f}px; transform: scaleY({scale_y_adj:.2f})')


if __name__ == "__main__":
    main()
