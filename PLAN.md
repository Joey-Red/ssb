# SSBU Training Guide — Project Plan

## Product goal
Build a polished, mobile-first Super Smash Bros. Ultimate training companion that is a frontend-only SPA deployable to GitHub Pages. Every fighter gets a 1–2 line memory aid, concise quick guide, character-specific 0–200% practice routine, conservative combo/confirm information, full move timing reference, and training tools that remain useful without an account or server.

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
React + TypeScript + Vite, strict TypeScript, project-owned CSS, hash routing for Pages reliability, static TypeScript/JSON data, Vitest validation, local-only browser persistence, lazy-loaded heavy views, progressive offline caching, and GitHub Actions deployment.

```text
src/
  components/
  data/
  lib/
  router.ts
  types.ts
scripts/
public/
  sw.js
```

### Core classifications
`true | kill-confirm | di-dependent | character-dependent | practice-route`

Every source-backed route stores a percentage window, classification, confidence, conditions where needed, execution note, and source IDs. `review` content remains visibly distinct from source-backed material.

### Frame model
SSBU runs at 60 FPS. Frame data is stored/displayed as frames: startup, active frames, total frames, FAF when independently available, landing lag, autocancel windows, shield advantage, OOS timing, and related move data. **Total Frames and FAF are separate fields and are never substituted for each other.** Frame timing is never converted into the old tick system.

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
8. Unknown factual fields remain unknown instead of being inferred from adjacent values.

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
Adaptive mobile navigation, coarse-pointer touch targets, visible focus, forced-colors handling, reduced motion, screen-reader status text, and responsive large-screen behavior are covered.
### M20 — Performance/offline resilience ✅
Heavy routes are lazy-loaded and the production build registers a scoped service worker that caches the app shell and fetched static assets for repeat/offline use without making offline support a runtime requirement.

## Phase 4 — Frame data, visual tools, and personalized training
### M21 — Full frame-data schema ✅
Typed move/stat snapshot contracts preserve raw range/multihit notation and keep Total Frames distinct from FAF.
### M22 — Frame-data UI ✅
Every fighter can surface searchable/category-filtered move timing, OOS startup references, source links, and expandable details.
### M23 — Full-roster frame-data population ✅
A committed 89-fighter static snapshot is generated from normalized UFD-derived factual rows, validated for full roster/minimum coverage, and linked back to UFD as canonical reference. GitHub maintenance uses a documented transport mirror because UFD rejects hosted runners.
### M24 — Media rights/source pipeline ✅
Media assets carry project-owned/explicit-license/source-link-only status; tests reject unsafe bundled third-party assets and policy/provenance docs define the boundary.
### M25 — Hitbox/frame viewer foundation ✅
Move details include a frame timeline and interactive frame scrubber. The hitbox layer is reserved but intentionally does not invent collision geometry when approved coordinates are unavailable.
### M26 — Approved fighter visual layer ✅
Project-owned procedural fighter identity graphics give fighter pages visual identity without bundling unlicensed Nintendo renders or third-party animations.
### M27 — Matchup/DI training notes ✅
The matchup lab turns documented archetypes and existing DI-sensitive routes into practice focuses while explicitly avoiding fabricated universal matchup charts or DI answers.
### M28 — Discovery tools and OOS/move comparisons ✅
A dedicated Tools workspace supports side-by-side move metrics, cross-roster fast-move discovery, and OOS startup references with punish-context warnings.
### M29 — Release-quality audit ✅
CI validates roster/guide/frame/media/router invariants, runs lint and strict TypeScript, executes the full Vitest suite, and produces a successful Vite production build from `npm ci`.
### M30 — Local custom drill queue ✅
Users can build fighter-specific drills with percent, action route, notes, target reps, progress, reset/delete/clear-completed controls, and links back into practice/guides. State stays browser-local with no account, sync, or telemetry.

## Quality gate
```text
npm run lint
npm test
npm run build
```
`npm run check` runs the complete gate. Static validation rejects malformed/duplicate roster routes, missing full-roster guides, invalid 0–200 routine structure, bad percentage windows, missing sources, invalid startup-frame fields, unsupported `true` classifications, unsafe media entries, and incomplete frame-data snapshots.

## Deployment
`main → GitHub Actions → Vite dist → GitHub Pages → phone/tablet/desktop browser`.

The M21–M30 development batch intentionally remains on its feature branch until the dedicated merge/deployment cleanup pass.
