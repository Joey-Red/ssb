# SSBU Training Guide

[![Build and deploy GitHub Pages](https://github.com/Joey-Red/ssb/actions/workflows/deploy-pages.yml/badge.svg)](https://github.com/Joey-Red/ssb/actions/workflows/deploy-pages.yml)

A mobile-first, frontend-only Super Smash Bros. Ultimate training companion for GitHub Pages. No server, database, account, analytics, telemetry, or runtime API is required.

## What is live

- Complete 89-fighter roster with memory aids, quick guides, and searchable guide metadata.
- Character-specific 0–200% training ladders for the full roster.
- Conservative combo/confirm classifications that distinguish true, conditional, DI-dependent, character-dependent, and practice routes.
- Series/archetype/favorites filtering plus recently viewed fighters.
- Local-only favorites and practice progress; nothing is sent to a server.
- Dedicated practice mode with rep counting, completion tracking, fighter switching, percentage navigation, and keyboard controls.
- Responsive Titan-inspired UI from 320px phones through 2K/ultrawide displays.
- Frame-literacy glossary using standard SSBU frames only; no alternate tick timing system.
- Lazy-loaded fighter/practice views and progressive offline caching for repeat visits.

## Development

Install dependencies and start Vite:

```bash
npm install
npm run dev
```

Quality gate:

```bash
npm run check
```

This runs ESLint, Vitest, strict TypeScript compilation, and a production Vite build.

Once `package-lock.json` is committed, clean installs should use:

```bash
npm ci
```

## GitHub Pages

Vite uses base `/ssb/`; the SPA uses hash routing so direct refreshes do not require rewrite rules.

Live URL: `https://joey-red.github.io/ssb/`
