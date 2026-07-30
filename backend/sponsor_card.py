"""Sponsor social/print card generator.

Given a sponsor doc, renders a branded "Find us on Fork·Fate" marketing card
containing:
  - Sponsor name, cuisine, and address
  - A QR code linking to `https://fork-fate.com/?sponsor={id}` so scanning
    opens the app pre-highlighted on that sponsor
  - Fork·Fate logo + tagline
  - Optional coupon code teaser if the sponsor has one attached

Supports three output formats:
  - "square" — 1080×1080 PNG (Instagram feed)
  - "story"  — 1080×1920 PNG (Instagram/TikTok story)
  - "pdf"    — 8.5×11" print-ready single-page PDF

Uses only PIL + qrcode — no external services, no browser rendering.
"""
from __future__ import annotations

import io
import os
from typing import Literal

import qrcode
from qrcode.image.pil import PilImage
from PIL import Image, ImageDraw, ImageFont

PROD_URL = "https://fork-fate.com"
LOGO_PATH = "/app/frontend/public/logo-mark.png"

Format = Literal["square", "story", "pdf"]

# Fork·Fate brand palette
BRAND_DARK = (14, 14, 14)          # #0E0E0E
BRAND_RED = (224, 30, 38)          # #E01E26
BRAND_GOLD = (230, 178, 58)        # #E6B23A
BRAND_CARD = (247, 244, 236)       # warm off-white


def _font(size: int, bold: bool = False, serif: bool = False):
    paths = []
    if serif:
        paths.append("/usr/share/fonts/truetype/dejavu/DejaVuSerif-Bold.ttf" if bold
                     else "/usr/share/fonts/truetype/dejavu/DejaVuSerif.ttf")
    paths.append("/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf" if bold
                 else "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf")
    for p in paths:
        if os.path.exists(p):
            try:
                return ImageFont.truetype(p, size)
            except Exception:
                continue
    return ImageFont.load_default()


def _text_width(draw, text: str, font) -> int:
    l, t, r, b = draw.textbbox((0, 0), text, font=font)
    return r - l


def _text_height(draw, text: str, font) -> int:
    l, t, r, b = draw.textbbox((0, 0), text, font=font)
    return b - t


def _fit_text(draw, text: str, max_width: int, start_size: int, min_size: int, bold=False, serif=False):
    size = start_size
    while size >= min_size:
        f = _font(size, bold=bold, serif=serif)
        if _text_width(draw, text, f) <= max_width:
            return f
        size -= 2
    return _font(min_size, bold=bold, serif=serif)


def _make_qr(url: str, box_size: int = 12) -> Image.Image:
    qr = qrcode.QRCode(
        version=None,
        error_correction=qrcode.constants.ERROR_CORRECT_H,
        box_size=box_size,
        border=2,
    )
    qr.add_data(url)
    qr.make(fit=True)
    img: PilImage = qr.make_image(fill_color="black", back_color="white")
    return img.convert("RGBA")


def _render_card(sponsor: dict, size: tuple[int, int]) -> Image.Image:
    w, h = size
    is_story = h > w * 1.4
    img = Image.new("RGB", size, BRAND_DARK)
    draw = ImageDraw.Draw(img)

    # Warm gold radial glow
    glow = Image.new("RGBA", size, (0, 0, 0, 0))
    gdraw = ImageDraw.Draw(glow)
    cx, cy = w // 2, int(h * 0.5)
    for r in range(int(w * 0.9), 0, -60):
        alpha = int(55 * (1 - r / (w * 0.9)))
        gdraw.ellipse([cx - r, cy - r, cx + r, cy + r], fill=(*BRAND_GOLD, alpha))
    img = Image.alpha_composite(img.convert("RGBA"), glow).convert("RGB")
    draw = ImageDraw.Draw(img)

    has_coupon = bool((sponsor.get("coupon") or {}).get("code"))

    # ─── Top tagline ─────────────────────────────
    tagline = "FIND US & GET A COUPON AT FORK-FATE.COM" if has_coupon else "FIND US ON FORK-FATE.COM"
    tag_font = _fit_text(draw, tagline, int(w * 0.92), int(w * 0.05), 24, bold=True)
    tw = _text_width(draw, tagline, tag_font)
    y = int(h * 0.06)
    draw.text(((w - tw) // 2, y), tagline, fill=BRAND_GOLD, font=tag_font)
    y += _text_height(draw, tagline, tag_font)

    # Red divider
    y += int(h * 0.02)
    draw.rectangle([(w // 2 - 60, y), (w // 2 + 60, y + 6)], fill=BRAND_RED)
    y += 6

    # ─── Sponsor name (serif, big) ──────────────
    name = (sponsor.get("name") or "Your Business").strip()
    name_font = _fit_text(draw, name, int(w * 0.86), int(w * 0.11), 44, bold=True, serif=True)
    nw = _text_width(draw, name, name_font)
    y += int(h * 0.03)
    draw.text(((w - nw) // 2, y), name, fill="white", font=name_font)
    y += _text_height(draw, name, name_font)

    # ─── Subtitle: cuisine · price ──────────────
    cuisine = sponsor.get("cuisine") or ""
    price = sponsor.get("price") or ""
    subtitle_parts = [p for p in [cuisine, price] if p]
    subtitle = "  ·  ".join(subtitle_parts)
    if subtitle:
        sub_font = _fit_text(draw, subtitle, int(w * 0.8), int(w * 0.042), 22)
        sw = _text_width(draw, subtitle, sub_font)
        y += int(h * 0.015)
        draw.text(((w - sw) // 2, y), subtitle, fill=BRAND_CARD, font=sub_font)
        y += _text_height(draw, subtitle, sub_font)

    # ─── QR code centered in remaining space ────
    qr_size = int(w * 0.42) if not is_story else int(w * 0.5)
    qr = _make_qr(f"{PROD_URL}/?sponsor={sponsor.get('id', '')}", box_size=12)
    qr = qr.resize((qr_size, qr_size), Image.NEAREST)
    qr_pad = int(w * 0.03)
    card_size = qr_size + 2 * qr_pad
    qx = (w - card_size) // 2
    footer_reserved = int(h * 0.20)
    available_top = y + int(h * 0.03)
    available_bottom = h - footer_reserved
    qy = max(available_top, available_top + ((available_bottom - available_top - card_size) // 2))
    draw.rounded_rectangle(
        [(qx, qy), (qx + card_size, qy + card_size)],
        radius=int(w * 0.035),
        fill="white",
    )
    img.paste(qr, (qx + qr_pad, qy + qr_pad), qr)

    # QR caption
    cap = "Scan for a deal" if has_coupon else "Scan to open Fork·Fate"
    cap_font = _font(max(18, int(w * 0.028)), bold=True)
    cw = _text_width(draw, cap, cap_font)
    cap_y = qy + card_size + int(h * 0.015)
    draw.text(((w - cw) // 2, cap_y), cap, fill=BRAND_GOLD, font=cap_font)

    # ─── Coupon pill (if any) ───────────────────
    coupon = sponsor.get("coupon") or {}
    if coupon.get("code"):
        cpn = f"USE CODE  {coupon['code']}"
        cpn_font = _font(max(24, int(w * 0.045)), bold=True)
        cpw = _text_width(draw, cpn, cpn_font)
        cph = _text_height(draw, cpn, cpn_font)
        cpn_y = cap_y + _text_height(draw, cap, cap_font) + int(h * 0.025)
        pad_x = int(w * 0.03)
        pad_y = int(w * 0.015)
        draw.rounded_rectangle(
            [
                ((w - cpw) // 2 - pad_x, cpn_y - pad_y),
                ((w - cpw) // 2 + cpw + pad_x, cpn_y + cph + pad_y),
            ],
            radius=int((cph + 2 * pad_y) // 2),
            fill=BRAND_RED,
        )
        draw.text(((w - cpw) // 2, cpn_y), cpn, fill="white", font=cpn_font)

    # ─── Footer + logo ──────────────────────────
    footer_txt = "Shuffle your next night out"
    url_font = _font(max(20, int(w * 0.033)), bold=True)
    uw = _text_width(draw, footer_txt, url_font)
    footer_y = h - int(h * 0.075)
    draw.text(((w - uw) // 2, footer_y), footer_txt, fill="white", font=url_font)

    try:
        logo = Image.open(LOGO_PATH).convert("RGBA")
        logo_size = int(w * 0.08)
        logo = logo.resize((logo_size, logo_size), Image.LANCZOS)
        img.paste(logo, (w - logo_size - int(w * 0.04), h - logo_size - int(w * 0.03)), logo)
    except Exception:
        pass

    return img


def generate_sponsor_card(sponsor: dict, fmt: Format = "square") -> tuple[bytes, str, str]:
    """Return (bytes, mimetype, filename) for the requested card format."""
    safe_name = "".join(c for c in (sponsor.get("name") or "sponsor") if c.isalnum() or c in "-_")[:32] or "sponsor"
    if fmt == "square":
        img = _render_card(sponsor, (1080, 1080))
        buf = io.BytesIO(); img.save(buf, format="PNG", optimize=True)
        return buf.getvalue(), "image/png", f"forkfate-card-square-{safe_name}.png"
    if fmt == "story":
        img = _render_card(sponsor, (1080, 1920))
        buf = io.BytesIO(); img.save(buf, format="PNG", optimize=True)
        return buf.getvalue(), "image/png", f"forkfate-card-story-{safe_name}.png"
    if fmt == "pdf":
        page_w, page_h = 2550, 3300  # US Letter @ 300 DPI
        canvas_w = 2200
        card_img = _render_card(sponsor, (canvas_w, canvas_w))
        page = Image.new("RGB", (page_w, page_h), "white")
        x = (page_w - canvas_w) // 2
        y = (page_h - canvas_w) // 2
        page.paste(card_img, (x, y))
        buf = io.BytesIO(); page.save(buf, format="PDF", resolution=300.0)
        return buf.getvalue(), "application/pdf", f"forkfate-card-print-{safe_name}.pdf"
    raise ValueError(f"unknown format: {fmt}")
