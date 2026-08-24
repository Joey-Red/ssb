# SSBU Training Guide — Project Plan

## Product goal
Build a polished, mobile-first Super Smash Bros. Ultimate training companion that is a frontend-only SPA deployable to GitHub Pages. Every fighter ultimately gets a 1–2 line memory aid, concise quick guide, character-specific 0–200% practice routine, true/conditional combo information, kill confirms, and later complete frame-data and visual move reference.

## Non-negotiables
- Frontend only: no server, database, login, telemetry, or required runtime API.
- GitHub Pages compatible and refresh-safe.
- Responsive from 320px phones through tablets, desktop, 2K, and ultrawide.
- Titan-inspired matte dark UI: restrained borders, compact density, no neon/glassmorphism.
- Static, versioned, source-aware fighter data.
- Never label a route “true” merely because it is commonly performed. Preserve DI/character/percent/rage/hitbox/stage conditions.
- Use standard SSBU frame terminology only. The abandoned 0.6-second tick concept is not part of the product.
- Accessible keyboard navigation, visible focus, semantic markup, reduced-motion support, forced-colors support, and practical touch targets.

## Architecture
React + TypeScript + Vite, strict TypeScript, project-owned CSS, hash routing for Pages reliability, static TypeScript data modules, Vitest validation, local-only browser persistence, lazy-loaded heavy views, progressive offline caching, and GitHub Actions deployment.

```text
src/
  components/
  data/
  lib/
  router.ts
  types.ts
public/
  sw.js
```

### Core classifications
`true | kill-confirm | di-dependent | character-dependent | practice-route`

Every source-backed route stores a percentage window, classification, confidence, conditions where needed, execution note, and source IDs. `review` content remains visibly distinct from source-backed material.

### Frame model
SSBU runs at 60 FPS. Frame data is stored/displayed as frames: startup, active frames, recovery/FAF, landing lag, autocancel windows, shield advantage, OOS timing, and related move data as later milestones expand. Frame timing is never converted into the old tick system.

## Roster rules
The canonical manifest contains 89 independent fighter pages. Squirtle/Ivysaur/Charizard are independent pages; Pyra/Mythra are independent pages with Aegis relation metadata; Echo relationships are explicit; costume-only variants are not duplicated.

## Data verification policy
1. Store source metadata beside gameplay data.
2. Prefer measured frame-data sources for numerical values.
3. Do not copy large bodies of third-party prose.
4. Conditions that affect truth/percent windows must be represented.
5. Uncertain execution stays `review` rather than silently becoming verified.
6. Initial training percentage examples use Mario as a baseline dummy unless a route says otherwise.
7. Media licensing/redistribution is a separate decision from factual frame data; do not bulk-copy Nintendo/third-party media.

# Milestones

## Phase 1 — Foundation
### M01 — Project scaffold ✅
React/TypeScript/Vite, strict compilation, lint/test/build scripts, production build gate.
### M02 — GitHub Pages deployment ✅
Pages-safe Vite base, hash routing, GitHub Actions build/deploy workflow.
### M03 — Responsive application shell ✅
Titan-inspired tokens/surfaces, desktop sidebar, mobile navigation, focus and reduced-motion behavior.
### M04 — Core data contracts ✅
Fighter/training/combo/source/frame types, validation, frame-only utilities and tests.
### M05 — Complete roster manifest ✅
89 independent fighter routes, aliases, transformations/forms/echo metadata, uniqueness tests.

## Phase 2 — First usable training app
### M06 — Roster home ✅
Responsive fighter grid, search, keyboard arrow navigation, touch targets, empty state.
### M07 — Fighter detail shell ✅
Header, memory-aid region, pending state, adjacent fighter navigation.
### M08 — 0–200% training ladder ✅
Percentage picker, Practice Now view, full routine expansion, mobile-safe layout.
### M09 — Combo explorer ✅
Classification and percentage filtering, conditions, confidence state, source links, intentional empty state.
### M10 — Reference fighter dataset ✅
Mario, Squirtle, Pyra, Mythra: memory aid, quick guide, 0–200 routine, combos/confirms, key startup frames, sources, verification classifications.

## Phase 3 — Full roster and training UX
### M11 — Frame-literacy help ✅
Expanded contextual definitions for startup, active frames, recovery/FAF, landing lag, autocancel, hitlag, hitstun, shield advantage, OOS, DI, SDI, and combo classification.
### M12 — Full-roster memory aids ✅
All 89 fighter pages have concise memory cues.
### M13 — Full-roster quick guides ✅
Every fighter has practical neutral/advantage/kill-plan notes without copied third-party prose.
### M14 — Full-roster 0–200 routines ✅
Every fighter has 11 training checkpoints from 0% through 200%, with routes shortened when confirms stop being practical.
### M15 — Full-roster combo/confirm dataset ✅
The entire roster has classified practice routes/confirm concepts with true-combo labels reserved for supported claims.
### M16 — Full content verification pass ✅
Validation enforces roster coverage, percentage structure, source references, startup integrity, and conservative true-combo labeling.
### M17 — Search/filter/favorites/recents polish ✅
Search includes guide metadata; series/archetype/favorites filters, recent fighters, local-only favorites, and reset controls are implemented.
### M18 — Practice session mode ✅
Dedicated practice routes include fighter switching, step navigation, rep counts, completion tracking, keyboard controls, and local persistence.
### M19 — Mobile/accessibility hardening ✅
Coarse-pointer touch targets, four-item mobile navigation, visible focus, forced-colors handling, reduced motion, screen-reader status text, and responsive large-screen behavior are covered.
### M20 — Performance/offline resilience ✅
Fighter/practice views are lazy-loaded and the production build registers a scoped service worker that caches the app shell and fetched static assets for repeat/offline use without making offline support a runtime requirement.

## Next — Frame-data expansion
### M21 — Full frame-data schema
### M22 — Frame-data UI
### M23 — Full-roster frame-data population
### M24 — Media rights/source pipeline
### M25 — Hitbox/frame viewer foundation
### M26 — Approved fighter imagery/animations
### M27 — Matchup/DI training notes
### M28 — Discovery tools and OOS/move comparisons
### M29 — Release-quality audit

## Quality gate
```text
npm run lint
npm test
npm run build
```
Static validation rejects malformed/duplicate roster routes, missing full-roster guides, invalid 0–200 routine structure, bad percentage windows, missing sources, invalid startup-frame fields, and unsupported `true` classifications in generated practice data.

## Deployment
`main → GitHub Actions → Vite dist → GitHub Pages → phone/tablet/desktop browser`.
