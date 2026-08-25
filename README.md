# SSBU Training Festival

[![Build and deploy GitHub Pages](https://github.com/Joey-Red/ssb/actions/workflows/deploy-pages.yml/badge.svg)](https://github.com/Joey-Red/ssb/actions/workflows/deploy-pages.yml)

A mobile-first, frontend-only Super Smash Bros. Ultimate training companion for GitHub Pages. No server, database, account, analytics, telemetry, or runtime API is required.

## Visual identity

- **Festival is the first-run default:** brighter game-like surfaces, bold outlines, playful red/blue/yellow/green accents, much larger branding, and stronger fighter/page hierarchy.
- **Arena remains built in:** the original matte dark interface is available from the top-bar theme toggle.
- Theme preference is browser-local and is applied before first paint so returning Arena users do not see a Festival flash.
- Festival layouts have dedicated phone, tablet/desktop, 2K, and ultrawide treatments instead of simply scaling one fixed desktop design.
- Fighter cards and fighter heroes include responsive local fighter art with fallback-safe sizing.

## Application features

- Complete 89-fighter roster with memory aids, quick guides, and searchable guide metadata.
- Character-specific 0–200% training ladders for the full roster.
- Conservative combo/confirm classifications that distinguish true, kill-confirm, DI-dependent, character-dependent, and practice routes.
- Series/archetype/favorites filtering plus recently viewed fighters.
- Local-only favorites, practice progress, theme choice, and custom drills; nothing is sent to a server.
- Dedicated practice mode with rep counting, completion tracking, fighter switching, percentage navigation, and keyboard controls.
- Custom drill queue with fighter/percent setup, action routes, notes, target reps, progress, reset, and completed-drill cleanup.
- Full-roster move timing snapshot with searchable per-fighter tables, raw multi-hit/range notation, autocancel windows where available, and explicit separation of Total Frames from FAF.
- Frame timelines plus a visual move player with previous/next frame, 60 FPS play/pause, direct seek, keyboard stepping, active-span looping, speed controls, phase readout, and source-variant selection.
- Maintenance tooling scans all 89 UFD fighter pages and maps locally stageable hitbox media to the committed move IDs. The current generated set contains 2,580 mapped moves and 3,075 valid source variants.
- Runtime visual media is entirely same-origin: source images are vendored into the repository and converted to compact active/impact-frame sheets or local static references. The deployed app does not hotlink UFD media.
- Visual metadata is split into one cacheable JSON index per fighter, so opening one character does not download the full-roster visual manifest.
- Exact source images are mapped to documented game-frame numbers. Missing source imagery is shown as missing rather than duplicated, interpolated, or fabricated.
- Matchup/DI practice lab that surfaces training focuses without pretending a universal matchup chart or DI answer exists.
- Cross-roster frame tools for side-by-side moves, OOS startup references, and fast-move discovery.
- Frame-literacy glossary using standard SSBU frames only.
- Lazy-loaded heavy routes, native lazy image decoding/loading, and progressive offline caching for repeat visits.

## Visual frame data

Visual move data is separate from numeric frame data. A `VisualMoveMedia` entry can describe:

- fighter + move identity;
- source/reference URL;
- documented game-frame timing;
- exact locally staged source frames;
- one or more source variants for angled/alternate visualizations;
- a local static reference when UFD provides an image instead of an animation;
- optional hitbox circles/regions when separately reviewed overlay geometry exists.

The frame player never invents an image or collision region. Compact sprite sheets contain only exact source images selected for the move's active/impact study span, and each cell records the game-frame number it represents. Startup and recovery timing remains seekable even when no corresponding source image was staged.

The maintenance discovery step uses a browser-compatible HTTP fingerprint because ordinary hosted-runner requests to UFD are rejected. That networking exists only in the asset-refresh workflow; the production application remains same-origin and works from committed static assets.

## Frame-data provenance

Ultimate Frame Data is the canonical frame-data reference linked from fighter pages. The deployed app reads only a committed static timing snapshot.

Because UFD rejects GitHub-hosted Actions runners for the numeric refresh path, maintenance consumes normalized factual CSV rows from `TheFakeNatty/smash-data` as a transport mirror. The project does not copy that repository's scraper code or bulk source prose. See [`docs/DATA_PROVENANCE.md`](docs/DATA_PROVENANCE.md) and [`docs/MEDIA_POLICY.md`](docs/MEDIA_POLICY.md).

Refresh the numeric snapshot manually when maintaining frame data:

```bash
python -m pip install -r scripts/requirements-frame-data.txt
python scripts/refresh-frame-data.py
```

Full-roster visual refreshes run through the dedicated GitHub Actions workflow, which discovers current UFD visual references, vendors valid media, builds compact active/impact sheets, and writes the 89 per-fighter runtime indexes.

## Development

Use the committed lockfile for reproducible installs:

```bash
npm ci
npm run dev
```

Quality gate:

```bash
npm run check
```

`npm run check` runs ESLint, Vitest, strict TypeScript compilation, and a production Vite build.

## GitHub Pages

Vite uses base `/ssb/`; the SPA uses hash routing so direct refreshes do not require rewrite rules.

Live URL after `main` deploys: `https://joey-red.github.io/ssb/`
