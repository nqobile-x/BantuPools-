# Bantu Pools

Marketing site for Bantu Pools, a professional pool cleaning, repair, and renovation business serving Johannesburg and surrounds.

**Live site: [bantupools.co.za](https://www.bantupools.co.za/)**

## Overview

A production website for a real local business, built as fast static pages with no framework. The goals were simple: rank well for pool services in Johannesburg, look trustworthy, and get visitors to call or WhatsApp. Everything else (TypeScript tooling, an image pipeline, strict security headers) exists in service of those three things.

## Features

- **Two-page site** (home and services) with sections for services, before/after results, about, FAQ, and contact
- **Before/after image sliders** showing real pool rescues, plus a photo gallery with controls
- **Direct contact actions**: click-to-call and WhatsApp links throughout
- **Light/dark theme** applied before first paint to avoid a flash of the wrong theme
- **Scroll reveals, stat counters, and ARIA-compliant tabs**, all written in TypeScript with no inline handlers
- **SEO/AEO groundwork**: sitemap, robots.txt, canonical URLs, Open Graph tags, Google site verification, and an `llms.txt`
- **Hardened deployment**: Vercel config ships a strict Content-Security-Policy, HSTS, X-Frame-Options DENY, and immutable caching for assets

## Tech stack

- Static HTML + modern CSS (no framework)
- TypeScript (`src/main.ts` compiled to `main.js` with `tsc`)
- Python (Pillow) image pipeline for WebP derivatives and favicons
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

## What I learned

This project was about production discipline rather than clever code: getting a real CSP to pass without breaking fonts or images, generating responsive WebP variants so a photo-heavy site stays fast on mobile data, and structuring metadata so a small local business actually shows up in search. Shipping for a paying client makes every one of those details non-optional.

## Contact

Portfolio: [nqobile-x.github.io/Nqobille](https://nqobile-x.github.io/Nqobille/)
