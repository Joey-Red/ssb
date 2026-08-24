# SSBU Training Guide

[![Build and deploy GitHub Pages](https://github.com/Joey-Red/ssb/actions/workflows/deploy-pages.yml/badge.svg)](https://github.com/Joey-Red/ssb/actions/workflows/deploy-pages.yml)

A mobile-first, frontend-only Super Smash Bros. Ultimate training companion for GitHub Pages. No server, database, account, analytics, telemetry, or runtime API is required.

## Application features

- Complete 89-fighter roster with memory aids, quick guides, and searchable guide metadata.
- Character-specific 0–200% training ladders for the full roster.
- Conservative combo/confirm classifications that distinguish true, kill-confirm, DI-dependent, character-dependent, and practice routes.
- Series/archetype/favorites filtering plus recently viewed fighters.
- Local-only favorites, practice progress, and custom drills; nothing is sent to a server.
- Dedicated practice mode with rep counting, completion tracking, fighter switching, percentage navigation, and keyboard controls.
- Custom drill queue with fighter/percent setup, action routes, notes, target reps, progress, reset, and completed-drill cleanup.
- Full-roster move timing snapshot with searchable per-fighter tables, raw multi-hit/range notation, autocancel windows where available, and explicit separation of Total Frames from FAF.
- Frame scrubber/timeline foundation that visualizes timing phases without inventing hitbox geometry.
- Matchup/DI practice lab that surfaces training focuses without pretending a universal matchup chart or DI answer exists.
- Cross-roster frame tools for side-by-side moves, OOS startup references, and fast-move discovery.
- Project-owned fighter identity graphics plus a strict media-rights registry; third-party fighter/hitbox media is not bundled without explicit permission.
- Responsive Titan-inspired UI from 320px phones through 2K/ultrawide displays.
- Frame-literacy glossary using standard SSBU frames only.
- Lazy-loaded heavy views and progressive offline caching for repeat visits.

## Frame-data provenance

Ultimate Frame Data is the canonical frame-data reference linked from fighter pages. The deployed app reads only a committed static snapshot.

Because UFD rejects GitHub-hosted Actions runners, the maintenance refresh consumes normalized factual CSV rows from `TheFakeNatty/smash-data` as a transport mirror. The project does not copy that repository's scraper code or bulk source prose/media. See [`docs/DATA_PROVENANCE.md`](docs/DATA_PROVENANCE.md) and [`docs/MEDIA_POLICY.md`](docs/MEDIA_POLICY.md).

Refresh the snapshot manually when maintaining frame data:

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
