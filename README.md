# SSBU Training Guide

A mobile-first, frontend-only Super Smash Bros. Ultimate training companion for GitHub Pages. No server, database, account, analytics, telemetry, or runtime API is required.

## What is live

- Complete 89-fighter roster manifest and search.
- Responsive Titan-inspired desktop/mobile shell.
- Fighter detail routes with clear pending states for unfinished guides.
- Source-aware reference guides for Mario, Squirtle, Pyra, and Mythra.
- Character-specific 0–200% training ladders.
- Combo classification and percentage filtering.
- Standard SSBU frame notation only; no alternate tick timing system.

## Development

```bash
npm install
npm run dev
```

Quality gate:

```bash
npm run check
```

This runs ESLint, Vitest, strict TypeScript compilation, and a production Vite build.

## GitHub Pages

Vite uses base `/ssb/`; the SPA uses hash routing so direct refreshes do not require rewrite rules.

Expected URL: `https://joey-red.github.io/ssb/`
