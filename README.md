# SSBU Training Guide

A mobile-first, frontend-only Super Smash Bros. Ultimate training companion designed for static GitHub Pages deployment. No server, database, account, analytics, or telemetry is required.

## Development

```bash
npm install
npm run dev
```

## Quality gate

```bash
npm run check
```

This runs linting, tests, strict TypeScript compilation, and a production Vite build.

## GitHub Pages

The app uses hash routing and Vite base `/ssb/`, so refresh/direct navigation never depends on server rewrite rules.

Expected production URL: `https://joey-red.github.io/ssb/`
