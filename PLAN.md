# SSBU Training Guide — Project Plan

## Product goal
Build a polished, mobile-first Super Smash Bros. Ultimate training companion that is a frontend-only SPA deployable to GitHub Pages. Every fighter ultimately gets a 1–2 line memory aid, concise quick guide, character-specific 0–200% practice routine, true/conditional combo information, kill confirms, and later complete frame-data and visual move reference.

## Non-negotiables
- Frontend only: no server, database, login, telemetry, or required runtime API.
- GitHub Pages compatible and refresh-safe.
- Responsive from 320px phones through tablets, desktop, and ultrawide.
- Titan-inspired matte dark UI: restrained borders, compact density, no neon/glassmorphism.
- Static, versioned, source-aware fighter data.
- Never label a route “true” merely because it is commonly performed. Preserve DI/character/percent/rage/hitbox/stage conditions.
- Use standard SSBU frame terminology only. The abandoned 0.6-second tick concept is not part of the product.
- Accessible keyboard navigation, visible focus, semantic markup, reduced-motion support, and practical touch targets.

## Architecture
React + TypeScript + Vite, strict TypeScript, project-owned CSS, hash routing for Pages reliability, static TypeScript data modules, Vitest validation, GitHub Actions deployment.

```text
src/
  components/
  data/
  lib/
  router.ts
  types.ts
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

## Next
### M11 — Frame-literacy help
Expand contextual definitions/tooltips for startup, active, recovery/FAF, hitlag, hitstun, DI, SDI, shield advantage, landing lag, autocancel, and OOS.
### M12 — Full-roster memory aids
### M13 — Full-roster quick guides
### M14 — Full-roster 0–200 routines
### M15 — Full-roster combo/confirm dataset
### M16 — Full content verification pass
### M17 — Search/filter/favorites/recents polish
### M18 — Practice session mode
### M19 — Mobile/accessibility hardening
### M20 — Performance/offline resilience
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
Static validation rejects malformed/duplicate roster routes, invalid 0–200 routine structure, bad percentage windows, missing sources, and invalid startup-frame fields.

## Deployment
`main → GitHub Actions → Vite dist → GitHub Pages → phone/tablet/desktop browser`.
