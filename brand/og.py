"""Renders the share image for link previews: docs/assets/og-1200x630.png.

The mark and wordmark, the headline and the price on the ground, built from the
same geometry and the repo's own faces as brand/render.py. Run from the repo root:

    python brand/og.py
"""
import os
import sys
from fontTools.ttLib import TTFont
from fontTools.varLib import instancer
from PIL import Image, ImageDraw, ImageFont

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import render  # noqa: E402

ROOT = render.ROOT
GROUND = render.GROUND
WHITE = render.WHITE
GREY = render.GREY


def face(name, px, wght, opsz=None):
    """A static instance of one of the repo's variable fonts, cached beside this file."""
    target = os.path.join(render.OUT, "_%s-%d.ttf" % (name, wght))
    if not os.path.exists(target):
        f = TTFont(os.path.join(ROOT, "docs", "fonts", "%s-latin.woff2" % name))
        f.flavor = None
        axes = {"wght": wght}
        if opsz is not None:
            axes["opsz"] = opsz
        instancer.instantiateVariableFont(f, axes).save(target)
    return ImageFont.truetype(target, px)


def main():
    w, h = 1200, 630
    img = Image.new("RGBA", (w, h), GROUND + (255,))
    d = ImageDraw.Draw(img)
    pad = 72

    # The lockup, top left, at the header's proportions.
    render.draw_mark(img, pad, pad, 56)
    render.draw_word(img, pad + 56 + 18, pad + 4, 46)

    # The headline in display caps, three lines at line height 0.9.
    head = face("bigshoulders", 118, 750, 72)
    y = 182
    for line in ("ONE PAGE", "FOR YOUR BUSINESS."):
        d.text((pad - 4, y), line, font=head, fill=WHITE)
        y += int(118 * 0.9)

    # The outcome line in the reading face, then the price in display.
    body = face("newsreader", 34, 400)
    d.text((pad, y + 40), "Written for your shop by a real person. Built in 48 hours. Yours to keep.", font=body, fill=GREY)
    price = face("bigshoulders", 44, 700, 40)
    d.text((pad, y + 114), "$495 FOR THE FIRST TEN SITES, THEN $850", font=price, fill=WHITE)

    # The address, bottom right, small caps.
    small = face("bigshoulders", 26, 600, 14)
    label = "ACTUALLYCODED.COM   (407) 480-9032"
    tw = d.textlength(label, font=small)
    d.text((w - pad - tw, h - pad - 26), label, font=small, fill=GREY)

    out = os.path.join(ROOT, "docs", "assets", "og-1200x630.png")
    img.convert("RGB").save(out, optimize=True)
    print("wrote", out)


if __name__ == "__main__":
    main()
