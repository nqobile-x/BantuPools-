"""Export only the scroll sequence; do not rewrite unrelated site assets."""
import optimize_images as images

images.PHOTOS = [
    (f"assets/img/sequence-{name}.png", f"sequence-{name}", [1600, 960], False)
    for name in ["before", "restore", "clear"]
] + [("assets/img/johannesburg-pool-dusk.png", "sequence-dusk", [1600, 960], False)]

if __name__ == "__main__":
    images.export_photos()
