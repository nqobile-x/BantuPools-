#!/usr/bin/env python3
"""Generate optimized WebP derivatives + favicons from source PNGs in assets/.

Outputs:
  assets/img/<name>-<width>.webp   — resized photos for the site
  assets/logo/logo-nav.png         — trimmed logo for the navbar (retina)
  favicon-32.png / apple-touch-icon.png / icon-512.png — favicons
Source PNGs are left untouched.
"""

from PIL import Image
import os

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, "assets", "img")
os.makedirs(OUT, exist_ok=True)

# (source, output basename, widths, crop_16_9)
# crop_16_9=True: center-crop to 16:9 before resizing (for square/portrait sources)
PHOTOS = [
    ("assets/reno-pool.png",                "pool-after",   [1920, 1280, 800], False),
    ("assets/dirty-pool.png",               "pool-before",  [1280, 800],       False),
    ("assets/bantu-pools-pool-clean.png",   "cleaning",     [960, 640],        False),
    ("assets/scrub-clean.png",              "scrub",        [960, 640],        False),
    ("assets/repairs-and-maintainance.png", "repairs",      [960, 640],        False),
    ("assets/pool-construction.png",        "construction", [960, 640],        False),
    ("assets/renovation.png",               "reno-karoo",   [960, 640],        False),
    ("assets/renovations-pool.png",         "reno-cape",    [960, 640],        False),
    ("assets/bantu-pools.png",              "gallery-sq1",  [960, 640],        True),
    ("assets/bantu-pools-flyer.png",        "gallery-sq2",  [960, 640],        True),
]

QUALITY = 80
GALLERY_RATIO = 960 / 536


def center_crop_16_9(im: Image.Image) -> Image.Image:
    src_ratio = im.width / im.height
    if src_ratio > GALLERY_RATIO:
        new_w = int(im.height * GALLERY_RATIO)
        x = (im.width - new_w) // 2
        return im.crop((x, 0, x + new_w, im.height))
    else:
        new_h = int(im.width / GALLERY_RATIO)
        y = (im.height - new_h) // 2
        return im.crop((0, y, im.width, y + new_h))


def export_photos() -> None:
    for src, name, widths, crop in PHOTOS:
        im = Image.open(os.path.join(ROOT, src)).convert("RGB")
        if crop:
            im = center_crop_16_9(im)
        for w in widths:
            w = min(w, im.width)
            h = round(im.height * w / im.width)
            resized = im.resize((w, h), Image.LANCZOS)
            dest = os.path.join(OUT, f"{name}-{w}.webp")
            resized.save(dest, "WEBP", quality=QUALITY, method=6)
            print(f"{dest}: {os.path.getsize(dest) // 1024} KB ({w}x{h})")


def export_og_image() -> None:
    hero = Image.open(os.path.join(ROOT, "assets/reno-pool.png")).convert("RGB")
    og = center_crop_16_9(hero)
    og = og.resize((1200, 630), Image.LANCZOS)
    dest = os.path.join(OUT, "og-image.jpg")
    og.save(dest, "JPEG", quality=85)
    print(f"{dest}: {os.path.getsize(dest) // 1024} KB")


def export_logo_and_favicons() -> None:
    logo = Image.open(os.path.join(ROOT, "assets", "logo", "bantu-pools-logo.png")).convert("RGBA")
    bbox = logo.getchannel("A").getbbox()
    trimmed = logo.crop(bbox)

    nav = trimmed.copy()
    nav.thumbnail((10_000, 160), Image.LANCZOS)
    nav_path = os.path.join(ROOT, "assets", "logo", "logo-nav.png")
    nav.save(nav_path, "PNG", optimize=True)
    print(f"{nav_path}: {os.path.getsize(nav_path) // 1024} KB {nav.size}")

    side = max(trimmed.size)
    square = Image.new("RGBA", (side, side), (0, 0, 0, 0))
    square.paste(trimmed, ((side - trimmed.width) // 2, (side - trimmed.height) // 2), trimmed)

    for size, fname in [(32, "favicon-32.png"), (180, "apple-touch-icon.png"), (512, "icon-512.png")]:
        icon = square.resize((size, size), Image.LANCZOS)
        path = os.path.join(ROOT, fname)
        icon.save(path, "PNG", optimize=True)
        print(f"{path}: {os.path.getsize(path) // 1024} KB")


if __name__ == "__main__":
    export_photos()
    export_og_image()
    export_logo_and_favicons()
