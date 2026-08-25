# Visual media and provenance policy

The SSBU Training Festival separates numeric timing facts, source imagery, and overlay annotations so each can be maintained independently.

## Runtime network rule

The deployed app is self-contained for UI resources. Fighter art, thumbnails, hitbox previews, exact-frame sheets, local move animations, JSON data, CSS, scripts, fonts, and other automatic resources must be served from the same GitHub Pages origin. The app must not hotlink third-party images/media or make automatic third-party data requests.

External URLs may remain as **explicit source/reference links** that a user chooses to open. Those links document provenance; they are not runtime dependencies.

A same-origin Content Security Policy and automated source/file-integrity tests enforce this boundary.

## Media modes

The app supports four practical visual modes:

1. **Project-owned UI art** — procedural fighter identity graphics, decorative motifs, diagrams, and interface assets created for this repository.
2. **Full exact move media** — a locally vendored source animation contains every documented game-frame image from frame 1 through Total Frames. Those images are packed into a fixed-grid sprite sheet so startup, active, and recovery all scrub and play continuously at the documented frame index.
3. **Partial exact + moving fallback media** — a source animation is useful but does not contain enough source images to justify a complete 1..Total mapping. Exact frame-addressable images remain limited to the defensible active/impact span, while the complete source animation is also stored locally as animated WebP so non-exact portions remain visibly moving rather than falling back to a fighter-render still.
4. **Static/separately timed references** — landing images, stills, or other sources whose timeline cannot honestly be mapped onto the attack's game frames stay static and are explicitly listed as coverage gaps rather than receiving invented frame numbers.

## Frame-study rules

A visual frame entry records the game-frame number and phase. Optional overlay circles/regions use percentage coordinates so they remain aligned when the image scales across phones, desktop, 2K, and ultrawide.

The viewer must not infer geometry from startup/active notation. If a frame has no explicit region data, no synthetic hitbox circle is drawn. Source hitbox/hurtbox graphics that are already baked into reviewed source imagery remain visible as source data; custom overlays are drawn only where separately reviewed metadata exists.

For a variant to claim **full exact coverage**, its frame map must contain every integer from `1` through the move's documented Total Frames exactly once and in order. A short animation, alternate clip, projectile-only sequence, landing timeline, or still image cannot claim full exact coverage merely because it is visually related to the move.

Visual variant IDs must be unique within each move. When a source publishes multiple media files with the same filename stem, discovery preserves the canonical first ID and deterministically suffixes later collisions by media type (and, only if necessary, a numeric suffix). This prevents static and animated forms of the same source name from becoming ambiguous in the runtime selector.

## Animated previews versus exact seeking

A locally hosted moving source reference remains useful when a source cannot support complete exact seeking, but ordinary browser animation playback is not treated as seek-synchronized. Exact seeking always uses the local sprite-sheet/still sequence and its explicit game-frame map.

The player supports direct frame entry, previous/next frame, 0.25×/0.5×/1× playback, first/last-active jumps, and active-span looping. Full exact variants therefore animate deterministically through startup, active, and recovery. Partial variants show exact synchronized imagery on mapped frames and a clearly labeled unsynchronized local animation elsewhere rather than a misleading still.

## Coverage-gap reporting

`scripts/vendor-full-motion-assets.py` writes `src/data/visualMediaCoverage.generated.json` on every full-roster visual refresh. Every variant that cannot claim full exact coverage appears in that report with fighter, move, variant, source-frame count, documented Total Frames, source URL, and the reason full mapping was rejected.

This residual list is deliberate maintenance data: improving an entry requires better source evidence or source-specific timing logic, not guessing.

## Provenance metadata

Source manifests retain canonical source/reference URLs and maintenance download URLs. The generated runtime manifest contains only local image/animation/sprite paths plus dimensions, checksums, coverage state, and source-frame counts. Runtime components consume the generated local manifest, not maintenance download URLs.

Tests reject duplicate move-media keys, duplicate per-move visual variant IDs, broken frame numbering, missing local files, external runtime media URLs, false full-coverage claims, out-of-bounds region coordinates, invalid circle radii, and missing full-roster fighter art.

## Performance and offline behavior

Visual routes remain lazy-loaded with fighter pages. Images use native lazy loading/async decoding. The 89-fighter numeric frame snapshot is an on-demand same-origin JSON asset rather than a large JavaScript chunk. Local images, animations, sheets, and JSON are eligible for the service worker's same-origin runtime cache, while the roster route still avoids preloading every move visual.
