# Redesign V2 — Design Concept

## Skill rules applied

| Skill requested | Result |
| --- | --- |
| `taste-skill` | Not installed in this workspace; no instructions could be read. The new UI therefore applies clear hierarchy, measured type scale, deliberate space and accessible contrast. |
| `hallmark` | Not installed; no instructions could be read. The new system uses a small, consistent component vocabulary and explicit states. |
| `impeccable` | Not installed; no instructions could be read. The implementation uses semantic controls, responsive states, focus styles and empty/loading/error states. |
| `scroll-craft` | Treat scrolling as a paced journey, vary section devices, make the hero dimensional, keep real text in semantic HTML, and support reduced motion. |
| `gsap-core` | Animate transform/opacity rather than layout, use documented eases/timelines, and respect `prefers-reduced-motion` with `matchMedia`. |
| `threejs-fundamentals` | Not installed; no instructions could be read. No Three.js scene is required for transactional pages; the home hero uses a lightweight CSS depth field rather than an unverified WebGL dependency. |

## Direction: “Archive / Signal”

The new shop is an editorial archive with a high-contrast signal colour: ink-black `#11110f`, bone `#f4f0e8`, oxidized orange `#d6532c`, cobalt `#3449d2`, and a small acid-lime highlight. Display type is **Oswald Variable**; interface copy is **Plus Jakarta Sans**. This is intentionally not a “quiet luxury” beige-and-gold boutique.

The hero is a full-bleed, asymmetric split: an oversized vertical title sits beside a moving catalogue grid and a diagonal orange signal panel. On scroll, the label rail, product ribbon, quote field, category index, and editorial callout each use a different device; no repeated card band is used twice in succession. Motion is restrained: reveal/translate/scale only, disabled for reduced-motion users.

Product discovery is a left filter rail plus masonry-like editorial product grid. Details use a two-column image/contact sheet beside a sticky purchase panel. Cart and checkout become concise paper-like ledgers. Account and administration use a sharply different data-console layout, with a dark navigation rail and dense readable tables.

## Deliberate difference from the old UI

The legacy UI uses conventional ecommerce page bands, white cards, compact header/footer layouts, and scattered component-specific CSS. Its previous documentation also prescribed alabaster, obsidian and champagne-gold “Atelier” styling with an ornamental silk-canvas hero. V2 replaces that visual language: there is no gold palette, no centered boutique hero, no legacy CSS, and no legacy layout/component import. The structure is an asymmetric editorial index with cobalt/orange signal blocks and new tokens held entirely in `front-end/src/v2`.

## 3D policy

Transactional surfaces do not use 3D. The marketing hero establishes depth with independent CSS planes, image crops and pointer parallax, avoiding unnecessary GPU work. A future Three.js treatment should only be added after the unavailable `threejs-fundamentals` skill is available and an asset/performance brief is approved.
