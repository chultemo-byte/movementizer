"""Render Movementizer icons from the site palette.

The splash word uses Cormorant Garamond (the site's display face). Point FONT_PATH
at a local variable-font file before running. The font file is not part of the app.
"""
import math
import os
from PIL import Image, ImageDraw, ImageFont

FONT_PATH = os.environ.get("MVZ_FONT", "/tmp/mvz-font/CormorantGaramond.ttf")
BG = (10, 14, 22, 255)
TEAL = (72, 224, 192, 255)
CORAL = (255, 93, 61, 255)
CREAM = (245, 239, 228, 255)
GOLD = (255, 210, 122, 255)


def mix(base, color, amount):
    return tuple(int(base[i] * (1 - amount) + color[i] * amount) for i in range(3)) + (255,)


def font(size):
    face = ImageFont.truetype(FONT_PATH, size)
    face.set_variation_by_name("SemiBold")
    return face


def draw_mark(canvas, cx, cy, radius, color, blip, center, mono=False):
    draw = ImageDraw.Draw(canvas)
    bg = canvas.getpixel((1, 1))
    opaque = bg[3] == 255

    def ink(src, amount):
        if mono:
            return (255, 255, 255, int(255 * amount))
        if opaque:
            return mix(bg, src, amount)
        return src[:3] + (int(255 * amount),)

    def ring(r, width, amount):
        box = [cx - r, cy - r, cx + r, cy + r]
        draw.ellipse(box, outline=ink(color, amount), width=max(1, int(width)))

    ring(radius, radius * 0.045, 0.95)
    ring(radius * 0.66, radius * 0.03, 0.55)
    ring(radius * 0.34, radius * 0.025, 0.4)

    arm = radius * 0.92
    hair = max(1, int(radius * 0.012))
    faint = ink(color, 0.28)
    draw.line([(cx - arm, cy), (cx + arm, cy)], fill=faint, width=hair)
    draw.line([(cx, cy - arm), (cx, cy + arm)], fill=faint, width=hair)

    sweep_r = radius * 0.98
    box = [cx - sweep_r, cy - sweep_r, cx + sweep_r, cy + sweep_r]
    draw.arc(box, start=286, end=338, fill=ink(color, 1), width=max(2, int(radius * 0.07)))

    angle = math.radians(62)
    bx = cx + math.cos(angle) * radius
    by = cy - math.sin(angle) * radius
    br = max(3, radius * 0.075)
    draw.ellipse([bx - br, by - br, bx + br, by + br], fill=blip if not mono else (255, 255, 255, 255))

    cr = max(2, radius * 0.045)
    draw.ellipse([cx - cr, cy - cr, cx + cr, cy + cr], fill=center if not mono else (255, 255, 255, 255))


def square(size, radius_ratio, opaque=True, mono=False, word=False):
    mode_bg = BG if opaque else (0, 0, 0, 0)
    image = Image.new("RGBA", (size, size), mode_bg)
    cx = size / 2
    cy = size * (0.44 if word else 0.5)
    radius = size * radius_ratio
    draw_mark(
        image,
        cx,
        cy,
        radius,
        TEAL,
        CORAL if opaque or not mono else (255, 255, 255, 255),
        GOLD,
        mono=mono,
    )
    if word:
        draw = ImageDraw.Draw(image)
        face = font(int(size * 0.078))
        draw.text((cx, cy + radius + size * 0.06), "Movementizer", font=face, fill=CREAM, anchor="mt")
    if opaque:
        return image.convert("RGB")
    return image


def main():
    root = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
    out_app = os.path.join(root, "mobile", "assets")
    out_web = os.path.join(root, "icons")
    os.makedirs(out_app, exist_ok=True)
    os.makedirs(out_web, exist_ok=True)

    square(1024, 0.34, opaque=True).save(os.path.join(out_app, "icon.png"), "PNG")
    square(1024, 0.30, opaque=True, word=True).save(os.path.join(out_app, "splash-icon.png"), "PNG")
    square(1024, 0.24, opaque=False).save(os.path.join(out_app, "android-icon-foreground.png"), "PNG")
    Image.new("RGB", (1024, 1024), BG[:3]).save(os.path.join(out_app, "android-icon-background.png"), "PNG")
    square(1024, 0.24, opaque=False, mono=True).save(os.path.join(out_app, "android-icon-monochrome.png"), "PNG")
    square(48, 0.34, opaque=True).save(os.path.join(out_app, "favicon.png"), "PNG")

    square(192, 0.34, opaque=True).save(os.path.join(out_web, "icon-192.png"), "PNG")
    square(512, 0.34, opaque=True).save(os.path.join(out_web, "icon-512.png"), "PNG")
    square(180, 0.34, opaque=True).save(os.path.join(out_web, "apple-touch-icon.png"), "PNG")
    print("icons written")


if __name__ == "__main__":
    main()
