# Visual media and provenance policy

The SSBU Training Festival separates numeric timing facts, source imagery, and overlay annotations so each can be maintained independently.

## Media modes

The app supports three practical visual modes:

1. **Project-owned UI art** — procedural fighter identity graphics, decorative motifs, diagrams, and interface assets created for this repository.
2. **External source reference** — an image/GIF can be displayed from its canonical HTTPS source while retaining a visible source link. This is used for the first UFD hitbox-animation references.
3. **Hosted frame-study media** — selected screenshots/frame captures can be stored with the site for deterministic frame seeking. Their hitbox circles/regions remain separate structured overlay metadata rather than being baked into the image.

## Frame-study rules

A hosted visual frame entry records the game-frame number and phase. Optional overlay circles/regions use percentage coordinates so they remain aligned when the image scales across phones, desktop, 2K, and ultrawide.

The viewer must not infer geometry from startup/active notation. If a frame has no explicit region data, no synthetic hitbox circle is drawn. This keeps the visual layer correctable and prevents the UI from presenting guessed geometry as measured fact.

## Animated references versus seekable stills

An animated hitbox GIF is useful visual reference material, but ordinary browser GIF playback is not a deterministic game-frame seek API. The UI therefore labels an external GIF as an **animated source preview**.

Exact seek synchronization is provided by numbered hosted still frames. The player can use the same move/frame schema for both modes, allowing a move to begin with an animated reference and later gain true per-frame stills without changing the surrounding UI.

## Provenance metadata

Visual move entries include:

- stable media id;
- fighter id and move id;
- human-readable label;
- canonical source/reference URL;
- optional animated preview URL;
- total game-frame count;
- contiguous numbered frame rows;
- optional per-frame image path;
- optional overlay regions/captions.

Tests reject duplicate move-media keys, broken frame numbering, non-HTTPS references, out-of-bounds region coordinates, and invalid circle radii.

## Performance

Visual routes are lazy-loaded with fighter pages. Images use native lazy loading/async decoding, and the initial roster route does not preload every fighter's move media. Hosted still sequences should be added in size-conscious batches rather than bundled into the initial JavaScript payload.
