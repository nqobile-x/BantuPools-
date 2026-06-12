# Bantu Pools

Marketing site for Bantu Pools — professional pool cleaning, equipment repairs and renovations in Johannesburg & surrounds.

## Stack

- Static HTML + modern CSS (no framework)
- TypeScript (`src/main.ts` → compiled to `main.js`)
- Deployed on Vercel

## Develop

```bash
npm install
npm run dev        # tsc --watch + local server on :8080
npm run build      # compile TypeScript
npm run typecheck  # type-check only
```

## Images

Source photos live in `assets/*.png`. Optimized WebP derivatives, favicons and the
social `og-image.jpg` are generated into `assets/img/` with:

```bash
pip install Pillow
python3 scripts/optimize_images.py
```
