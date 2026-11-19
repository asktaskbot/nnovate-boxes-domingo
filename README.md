# NNOVATE Studios — Domingo-style box site (source)

Static site, no build step.

## Files
- `index.html` — all markup/sections (intro, hero, services, box index, "What goes inside" packing section, studio, process, contact modal)
- `styles.css` — all styling (Newsreader + Courier Prime via Google Fonts)
- `main.js` — interactions (intro, reels, rail, filters, modal, scroll reveals); uses GSAP + ScrollTrigger from jsDelivr CDN
- `assets/` — NNOVATE logos
- `img/` — stock photos (WebP) from Pexels; sources/credits in `img/SOURCES.md`

## Open locally
Double-click `index.html`, or run `python3 -m http.server 8000` in this folder and open http://localhost:8000.
(Internet needed for fonts and GSAP CDN.)

## Host
Upload the folder contents to any static host (Netlify, Vercel, GitHub Pages, S3, `npx flypod .`).

## Notes
The contact form opens a mailto to brian@nnovatestudios.com. Box prices/copy are placeholders to edit in `index.html`.
