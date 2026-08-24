# Visual media and provenance policy

The SSBU Training Festival separates numeric timing facts, source imagery, and overlay annotations so each can be maintained independently.

## Runtime network rule

The deployed app is self-contained for UI resources. Fighter art, thumbnails, hitbox previews, exact-frame sheets, JSON data, CSS, scripts, fonts, and other automatic resources must be served from the same GitHub Pages origin. The app must not hotlink third-party images/media or make automatic third-party data requests.

External URLs may remain as **explicit source/reference links** that a user chooses to open. Those links document provenance; they are not runtime dependencies.

A same-origin Content Security Policy and automated source/file-integrity tests enforce this boundary.

## Media modes

The app supports three practical visual modes:

1. **Project-owned UI art** — procedural fighter identity graphics, decorative motifs, diagrams, and interface assets created for this repository.
2. **Vendored source media** — reviewed fighter imagery and hitbox animations downloaded during maintenance, optimized, committed under `public/media`, and served locally by Pages. Canonical source links remain attached for provenance.
3. **Exact frame-study media** — local fixed-grid sprite sheets or numbered still frames. Moving the player slider selects one deterministic image for that game-frame index.

## Frame-study rules

A visual frame entry records the game-frame number and phase. Optional overlay circles/regions use percentage coordinates so they remain aligned when the image scales across phones, desktop, 2K, and ultrawide.

The viewer must not infer geometry from startup/active notation. If a frame has no explicit region data, no synthetic hitbox circle is drawn. This keeps the visual layer correctable and prevents the UI from presenting guessed geometry as measured fact.

## Animated previews versus exact seeking

A locally hosted hitbox GIF remains useful as a quick fallback preview, but ordinary browser GIF playback is not treated as seek-synchronized. Exact seeking uses a local sprite sheet/still sequence generated from reviewed source media and validated against the move's expected game-frame count.

The player supports direct frame entry, previous/next frame, 0.25×/0.5×/1× playback, first/last-active jumps, and active-span looping. When an exact sheet exists, playback and seeking operate on that frame index rather than an independently playing animation.

## Provenance metadata

Source manifests retain canonical source/reference URLs and maintenance download URLs. The generated runtime manifest contains only local preview/sprite paths plus dimensions/checksums. Runtime components consume the generated local manifest, not maintenance download URLs.

Tests reject duplicate move-media keys, broken frame numbering, missing local files, external runtime preview/sprite URLs, out-of-bounds region coordinates, invalid circle radii, and missing full-roster fighter art.

## Performance and offline behavior

Visual routes remain lazy-loaded with fighter pages. Images use native lazy loading/async decoding. The 89-fighter numeric frame snapshot is already an on-demand same-origin JSON asset rather than a large JavaScript chunk. Local images, sheets, and JSON are eligible for the service worker's same-origin runtime cache, while the roster route still avoids preloading every move visual.
