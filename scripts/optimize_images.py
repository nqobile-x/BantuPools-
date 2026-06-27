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
    # Hero + after-slider (same output, used in both places)
    ("Images/Stunning_crystal-clear_swimming_pool_in_202606241740.jpeg",      "pool-after",   [1920, 1280, 800], False),
    # Before-slider (same property as after, matched pair)
    ("Images/Neglected_residential_swimming_pool_with_202606241748 (1).jpeg", "pool-before",  [1280, 800],       False),
    # Cleaning bento card + gallery
    ("Images/Same_residential_swimming_pool_now_202606241751.jpeg",           "cleaning",     [960, 640],        False),
    # Repairs bento card + gallery + services panel
    ("Images/Close-up_of_a_professional_pool_202606241753 (1).jpeg",          "repairs",      [960, 640],        False),
    # Weekly service gallery + services cleaning panel
    ("Images/Close-up_of_a_professional_pool_202606241753 (2).jpeg",          "scrub",        [960, 640],        False),
    # Construction/resurfacing (no AI replacement available)
    ("assets/pool-construction.png",                                           "construction", [960, 640],        False),
    # Luxury renovation reveal gallery card
    ("Images/Luxury_pool_renovation_reveal,_newly_202606241755.jpeg",         "reno-karoo",   [960, 640],        False),
    # Renovation services panel + gallery card
    ("Images/Stunning_crystal-clear_swimming_pool_in_202606241740 (1).jpeg",  "reno-cape",    [960, 640],        False),
    # Additional gallery cards
    ("Images/Stunning_crystal-clear_swimming_pool_in_202606241740 (2).jpeg",  "pool-luxury",   [960, 640],            False),
    ("Images/Stunning_crystal-clear_swimming_pool_in_202606241740 (3).jpeg",  "pool-golden",   [960, 640],            False),
    # Matched-pair after image for the main slider (same property as pool-before)
    ("Images/Same_residential_swimming_pool_now_202606241752.jpeg",           "pool-clean",    [1280, 960, 800, 640], False),
    # Extra before/after pairs for the rescue grid
    ("Images/Neglected_residential_swimming_pool_with_202606241747.jpeg",     "rescue-b1",     [960, 640],            False),
    ("Images/Neglected_residential_swimming_pool_with_202606241747 (1).jpeg", "rescue-b2",     [960, 640],            False),
    ("Images/Neglected_residential_swimming_pool_with_202606241748.jpeg",     "rescue-b3",     [960, 640],            False),
    ("Images/Same_residential_swimming_pool_now_202606241752 (1).jpeg",       "rescue-a1",     [960, 640],            False),
    # Third close-up repair shot for gallery
    ("Images/Close-up_of_a_professional_pool_202606241753.jpeg",              "repair-detail", [960, 640],            False),
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
    hero = Image.open(os.path.join(ROOT, "Images/Stunning_crystal-clear_swimming_pool_in_202606241740.jpeg")).convert("RGB")
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
