"""Renders the brand files from the mark's geometry and the repo's own Big Shoulders.

Monochrome since 2026-10-05: a white tile with black glyphs on the near black ground,
"actually" in grey and ".coded" in white. Run from the repo root:

    python brand/render.py

Needs Pillow and fontTools (both installed on the laptop). The woff2 is unpacked and
pinned to weight 700 at optical size 24, the header's exact setting.
"""
import os
from fontTools.ttLib import TTFont
from fontTools.varLib import instancer
from PIL import Image, ImageDraw, ImageFont

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, "brand")
GROUND = (11, 11, 11)
TILE = (245, 245, 245)
GLYPH = (11, 11, 11)
GREY = (201, 201, 201)
WHITE = (245, 245, 245)

# The mark on its 100 unit grid: the tile with the cut corner, then the glyph rects.
TILE_PATH = [(0, 0), (100, 0), (100, 68), (68, 100), (0, 100)]
GLYPHS = [(18, 22, 28, 12), (34, 22, 12, 56), (8, 44, 38, 12), (8, 44, 12, 34), (8, 66, 38, 12),
          (56, 22, 30, 12), (56, 22, 12, 56), (56, 66, 30, 12)]


def font_path():
    """Unpack the variable woff2 once into a static TTF at wght 700, opsz 24."""
    target = os.path.join(OUT, "_bigshoulders-700.ttf")
    if os.path.exists(target):
        return target
    f = TTFont(os.path.join(ROOT, "docs", "fonts", "bigshoulders-latin.woff2"))
    f.flavor = None
    static = instancer.instantiateVariableFont(f, {"wght": 700, "opsz": 24})
    static.save(target)
    return target


def draw_mark(img, x, y, size, scale=4):
    """Draws the tile and glyphs with supersampling so the edges stay clean."""
    big = Image.new("RGBA", (size * scale, size * scale), (0, 0, 0, 0))
    d = ImageDraw.Draw(big)
    u = size * scale / 100.0
    d.polygon([(px * u, py * u) for px, py in TILE_PATH], fill=TILE)
    for gx, gy, gw, gh in GLYPHS:
        d.rectangle([gx * u, gy * u, (gx + gw) * u, (gy + gh) * u], fill=GLYPH)
    small = big.resize((size, size), Image.LANCZOS)
    img.alpha_composite(small, (x, y))


def draw_word(img, x, y, px, tracking=-0.02):
    """actually in grey, .coded in white, at the header's tracking. Returns the width."""
    font = ImageFont.truetype(font_path(), px)
    d = ImageDraw.Draw(img)
    cursor = x
    for text, colour in (("actually", GREY), (".coded", WHITE)):
        for ch in text:
            d.text((cursor, y), ch, font=font, fill=colour)
            cursor += d.textlength(ch, font=font) + tracking * px
    return cursor - x


def word_width(px, tracking=-0.02):
    font = ImageFont.truetype(font_path(), px)
    probe = ImageDraw.Draw(Image.new("RGBA", (10, 10)))
    return sum(probe.textlength(ch, font=font) + tracking * px for ch in "actually.coded")


def lockup(w, h, mark, px, gap):
    """The tile and the wordmark centred together on the ground."""
    img = Image.new("RGBA", (w, h), GROUND + (255,))
    ww = word_width(px)
    total = mark + gap + ww
    x0 = int((w - total) / 2)
    y0 = int((h - mark) / 2)
    draw_mark(img, x0, y0, mark)
    font = ImageFont.truetype(font_path(), px)
    asc, desc = font.getmetrics()
    ty = y0 + (mark - (asc + desc)) / 2 + mark * 0.02
    draw_word(img, x0 + mark + gap, ty, px)
    return img


def main():
    # Square tile, for the Stripe icon and favicons.
    icon = Image.new("RGBA", (512, 512), GROUND + (255,))
    draw_mark(icon, 56, 56, 400)
    icon.save(os.path.join(OUT, "icon-512.png"))

    # Profile picture: the tile centred, with room for the circular crop.
    profile = Image.new("RGBA", (1080, 1080), GROUND + (255,))
    draw_mark(profile, 300, 300, 480)
    profile.save(os.path.join(OUT, "profile-1080.png"))

    lockup(1200, 300, 150, 150, 44).save(os.path.join(OUT, "logo-1200x300.png"))
    lockup(1640, 624, 220, 220, 64).save(os.path.join(OUT, "cover-1640x624.png"))

    # YouTube banner: the lockup inside the 1235 by 338 safe area in the middle.
    banner = Image.new("RGBA", (2048, 1152), GROUND + (255,))
    inner = lockup(1235, 338, 190, 190, 56)
    banner.alpha_composite(inner, ((2048 - 1235) // 2, (1152 - 338) // 2))
    banner.save(os.path.join(OUT, "youtube-banner-2048x1152.png"))
    print("rendered icon, profile, logo, cover, youtube banner")


if __name__ == "__main__":
    main()
