# SSBU Training Festival

[![Build and deploy GitHub Pages](https://github.com/Joey-Red/ssb/actions/workflows/deploy-pages.yml/badge.svg)](https://github.com/Joey-Red/ssb/actions/workflows/deploy-pages.yml)

A mobile-first, frontend-only Super Smash Bros. Ultimate training companion for GitHub Pages. No server, database, account, analytics, telemetry, or runtime API is required.

## Visual identity

- **Festival is the first-run default:** brighter game-like surfaces, bold outlines, playful red/blue/yellow/green accents, much larger branding, and stronger fighter/page hierarchy.
- **Arena remains built in:** the original matte dark interface is available from the top-bar theme toggle.
- Theme preference is browser-local and is applied before first paint so returning Arena users do not see a Festival flash.
- Festival layouts have dedicated phone, tablet/desktop, 2K, and ultrawide treatments instead of simply scaling one fixed desktop design.
- Fighter cards and fighter heroes include responsive project-owned visual identity art with fallback-safe sizing.

## Application features

- Complete 89-fighter roster with memory aids, quick guides, and searchable guide metadata.
- Character-specific 0–200% training ladders for the full roster.
- Conservative combo/confirm classifications that distinguish true, kill-confirm, DI-dependent, character-dependent, and practice routes.
- Series/archetype/favorites filtering plus recently viewed fighters.
- Local-only favorites, practice progress, theme choice, and custom drills; nothing is sent to a server.
- Dedicated practice mode with rep counting, completion tracking, fighter switching, percentage navigation, and keyboard controls.
- Custom drill queue with fighter/percent setup, action routes, notes, target reps, progress, reset, and completed-drill cleanup.
- Full-roster move timing snapshot with searchable per-fighter tables, raw multi-hit/range notation, autocancel windows where available, and explicit separation of Total Frames from FAF.
- Frame timelines plus a visual move player with previous/next frame, 60 FPS play/pause, direct seek, keyboard stepping, phase readout, and hitbox-overlay toggle.
- Visual-media schema supports per-frame hosted stills and percentage-positioned hitbox circles/regions, keeping image data and annotation geometry separate.
- Initial real hitbox-media references are wired for Mario, Pyra, and Mythra neutral air using their UFD animated references. The player clearly distinguishes an animated source preview from a seek-synchronized hosted still sequence.
- Matchup/DI practice lab that surfaces training focuses without pretending a universal matchup chart or DI answer exists.
- Cross-roster frame tools for side-by-side moves, OOS startup references, and fast-move discovery.
- Frame-literacy glossary using standard SSBU frames only.
- Lazy-loaded heavy routes, native lazy image decoding/loading, and progressive offline caching for repeat visits.

## Visual frame data

Visual move data is separate from numeric frame data. A `VisualMoveMedia` entry can describe:

- fighter + move identity;
- source/reference URL;
- optional animated reference;
- numbered game frames;
- startup/active/recovery/landing phase per frame;
- optional hosted still image per frame;
- optional hitbox circles/regions positioned as percentages of the displayed image.

The player never fabricates a circle for a frame that lacks overlay metadata. When only an animated reference exists, it is shown as a real source preview while the seek controls continue to index documented game frames independently.

## Frame-data provenance

Ultimate Frame Data is the canonical frame-data reference linked from fighter pages. The deployed app reads only a committed static timing snapshot.

Because UFD rejects GitHub-hosted Actions runners for the numeric refresh path, maintenance consumes normalized factual CSV rows from `TheFakeNatty/smash-data` as a transport mirror. The project does not copy that repository's scraper code or bulk source prose. See [`docs/DATA_PROVENANCE.md`](docs/DATA_PROVENANCE.md) and [`docs/MEDIA_POLICY.md`](docs/MEDIA_POLICY.md).

Refresh the numeric snapshot manually when maintaining frame data:

```bash
python -m pip install -r scripts/requirements-frame-data.txt
python scripts/refresh-frame-data.py
```

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
