# Pool transformation sequence

Local implementation; deployment is reserved for Claude.

The section at `#johannesburg-pool-care` blends four matched photographic keyframes over 121 scrub positions. These are generated concept images, not footage of a client job or 121 independently generated animation frames. The page discloses this beside the controls. There can be slight scene drift during dissolves because the keyframes were generated independently.

Scroll advances the scene; scrolling back reverses it. The range control supports keyboard arrows, Home and End. Manual scrubbing pauses scroll control; Resume restores it. Reduced-motion and short viewports disable scroll-driven updates and initially show the final scene. Without JavaScript, canvas support, or a complete image load, the original static image remains visible.

Four 960px WebP images total about 455 KiB on mobile; the desktop 1600px set totals about 999 KiB. They load within 800px of the section. Canvas pixel density is capped at 1.5. Rebuild JavaScript with `npm run build`; regenerate only sequence WebPs with `python scripts/optimize_sequence.py` (Pillow required).

## Assets and generation

Built-in image generation was used. Source PNGs and their responsive WebP derivatives are saved in `assets/img/`:

- `sequence-before.png`
- `sequence-restore.png`
- `sequence-clear.png`
- Existing `johannesburg-pool-dusk.png` supplies the final stage.

All edits referenced `johannesburg-pool-dusk.png` directly. Exact prompts:

Before: Edit target: supplied Johannesburg pool image. Create the BEFORE stage of an architectural restoration sequence. Absolutely lock camera, framing, pool outline, house, rocks, trees and garden positions. Change only pool condition and lighting: cloudy green algae water, discolored worn coping, a few floating leaves; bright soft afternoon light, garden lights off. Remove the technician and pole entirely. Photorealistic, landscape same dimensions. No text. This is a clearly labeled concept illustration on a website, not a real customer project.

Restoration: Edit target supplied pool. Make matching RESTORATION stage for fixed-camera architectural sequence. Preserve exact camera, framing, pool outline, rocks, house, plants and trees. Pool is drained, clean light concrete shell being resurfaced, neatly stacked tile samples on coping. No people or tools sticking up, remove original technician and pole. Soft afternoon daylight, lights off. Same landscape dimensions, photorealistic. No text or graphics. Do not change geometry or garden.

Clear: Edit supplied image only: same exact camera, framing and entire garden/house/pool geometry. Change twilight to soft late-afternoon daylight, all electric lights OFF, beautiful crystal clear blue pool, immaculate pale stone coping. Remove technician and pole. Preserve every tree, rock, wall, furniture position and pool outline. Photorealistic architectural photograph. Same landscape dimensions. No text. This is third frame of same-camera pool restoration sequence, continuity essential.

## Handoff notes

Build and TypeScript checks pass. Browser preview covered desktop/mobile rendering and keyboard endpoints. All pending items signed off by the business owner (2026-09-19): service-area claims (Johannesburg, Sandton, Randburg, Roodepoort, Midrand, Fourways, Bryanston, Soweto), portfolio and testimonial claims, and AI-generated concept illustration disclosure. Ready to deploy.
