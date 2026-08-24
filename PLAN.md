# SSBU Training Guide — Project Plan

## Product goal

Build a polished, mobile-first **Super Smash Bros. Ultimate training companion** that runs entirely in the browser and is deployable as a static **GitHub Pages** site.

The first release focuses on fast, practical training information for **every playable fighter**:

- a 1–2 line memory aid;
- a concise quick guide;
- a character-specific **0–200% practice routine**;
- true combos, common bread-and-butter routes, kill confirms, and situational follow-ups;
- timing shown in both normal Smash frames and the preferred **0.6-second tick system**.

Future releases expand the same fighter pages with complete frame data, hitbox visualizations, move animations/media, matchup notes, and deeper training tools without requiring a backend.

---

## Non-negotiable requirements

- **Frontend only.** No application server, database, login system, or required runtime API.
- **GitHub Pages compatible.** A production build must work when served from the repository Pages path and on direct navigation/refresh.
- **SPA.** Navigation should feel app-like and instant.
- **Responsive from phone to ultrawide.** Mobile is a first-class target, not a desktop layout squeezed smaller.
- **Fast and readable.** The useful answer should be visible immediately; deeper material can expand beneath it.
- **Static, versioned data.** Fighter guides and later frame data live in the repository so every change is reviewable.
- **Source-aware.** Gameplay claims must carry source/provenance metadata internally so uncertain information is not presented as fact.
- **No misleading combo labels.** “True”, “DI dependent”, “character dependent”, “practice route”, and “kill confirm” are distinct concepts in the data and UI.
- **No unnecessary tracking.** The core app needs no analytics, telemetry, account, cookies, or remote persistence.
- **Accessible.** Keyboard navigation, visible focus, semantic markup, readable contrast, reduced-motion support, and touch targets suitable for phones.

---

## Visual direction

Use the attached Titan Manager reference as the design language, without copying it literally.

### Desktop

- matte near-black application background;
- restrained borders and layered dark surfaces rather than floating/glowing cards;
- off-white primary text, muted gray secondary text;
- sparse accent color for state, selection, and important actions;
- strong typography hierarchy and compact information density;
- persistent left navigation when space allows;
- top utility area for search/filter/settings;
- subtle radius, no neon, no excessive gradients, no glassmorphism;
- content should use the viewport efficiently instead of looking like a small web page centered inside a large browser.

### Mobile

- no permanently occupying desktop sidebar;
- compact top bar plus bottom navigation or a deliberate drawer pattern;
- character name/memory aid and current practice step should appear above the fold;
- one-column fighter layout with expandable sections;
- percentage routine should be easy to thumb through;
- tables must collapse into readable cards/rows instead of horizontal-scroll hell;
- minimum practical touch target size and no tiny desktop text;
- support portrait phones, landscape phones, tablets, laptops, and ultrawides.

---

## Technical direction

### Stack

- **React + TypeScript + Vite**
- strict TypeScript
- CSS built from project-owned tokens/components rather than a heavy visual framework
- client-side routing using a GitHub-Pages-safe strategy (initially hash routing unless a tested Pages fallback makes clean routes equally reliable)
- static JSON/TypeScript data modules checked into the repository
- automated GitHub Actions build/deploy to Pages

### Proposed structure

```text
src/
  app/
  components/
  data/
    fighters/
    sources/
  features/
    roster/
    fighter/
    training/
    combos/
    frame-data/       # later phase
  lib/
    timing/
    validation/
  styles/
  types/
public/
  assets/
docs/
```

The exact structure may evolve as implementation reveals better boundaries, but fighter content must stay data-driven rather than being hard-coded into page components.

---

## Core data model

Each fighter should eventually support fields equivalent to:

```ts
interface FighterGuide {
  id: string;
  name: string;
  aliases: string[];
  series: string;
  memoryAid: string;
  quickGuide: string[];
  trainingRoutine: TrainingStep[];
  combos: Combo[];
  sources: SourceRef[];
  moves?: MoveFrameData[];
  media?: FighterMedia;
}
```

### Training step

A training routine is character-specific rather than blindly forcing the same combo at every percentage.

```ts
interface TrainingStep {
  percent: number;          // normally 0, 20, 40 ... 200
  route: string[];
  purpose: string;
  notes?: string;
  confidence: "verified" | "review";
}
```

### Combo classification

```ts
type ComboKind =
  | "true"
  | "kill-confirm"
  | "di-dependent"
  | "character-dependent"
  | "practice-route";
```

A combo can additionally record:

- practical percentage window;
- target/weight/fall-speed exceptions;
- required starter hitbox or landing condition;
- DI notes;
- rage/staleness caveats where relevant;
- execution/timing notes;
- source references;
- confidence/verification status.

### Timing

SSBU runs at 60 frames per second.

The app’s alternate timing system is:

- **1 tick = 0.6 seconds = 36 frames**
- `ticks = frames / 36`

Timing utilities should calculate this automatically so content authors store frame values rather than manually duplicating potentially inconsistent conversions.

Examples:

- 3f = 0.08 tick
- 5f = 0.14 tick
- 9f = 0.25 tick
- 12f = 0.33 tick
- 18f = 0.50 tick
- 36f = 1.00 tick

User setting:

`Frames | Ticks | Both`

Default for the initial guide can be **Both**.

---

## Fighter-page information hierarchy

The fighter page should answer the practical question before exposing encyclopedic data.

1. **Character header**
   - name
   - short archetype/role
   - 1–2 line memory aid
2. **Practice now**
   - selected percentage
   - recommended route
   - execution/timing note
3. **0–200 training ladder**
4. **Quick guide**
5. **Combos**
   - filters by combo classification and percentage
6. **Kill confirms**
7. **Important neutral/advantage/disadvantage notes**
8. **Frame data** — later
9. **Hitboxes / animations** — later
10. **Sources / verification notes**

The user should not need to read the bottom half of the page to get value from the top half.

---

## Roster handling

Create a canonical fighter manifest for the complete playable roster.

Special cases must be explicit rather than awkwardly hidden:

- Squirtle, Ivysaur, and Charizard receive independent fighter pages and routines.
- Pyra and Mythra receive independent pages, with optional cross-links as Aegis.
- transformations/forms, partner characters, and echoes are represented according to how their actual gameplay data differs.
- costume-only variants are not duplicated as separate gameplay guides.

The manifest becomes the single source for roster ordering, search, routes, and completeness checks.

---

## Data sourcing and verification policy

Gameplay information will be researched from reputable SSBU frame-data/reference sources and cross-checked where practical.

Rules:

1. Store source references beside data rather than leaving sourcing only in prose documentation.
2. Prefer primary/measured frame-data sources for numerical data.
3. Do not copy large bodies of third-party prose.
4. A route is not labeled **true** simply because it appears in a community combo list.
5. When a combo changes with DI, weight, rage, position, hitbox, or percent, capture that condition.
6. Unverified content is visibly marked for review during development and must not silently graduate to “verified.”
7. The default training dummy used for baseline percentage testing should be documented (initial reference target: Mario), while fighter-specific exceptions remain possible.
8. Record game-version/patch metadata for numerical frame data so later corrections can be audited.

### Media / copyright

Character art, screenshots, extracted animations, and hitbox media require more care than factual frame numbers.

- Do not bulk-copy third-party or Nintendo media into the repository without first deciding what may legally and responsibly be redistributed.
- Keep media attribution/license/source metadata in the asset manifest.
- Prefer project-owned UI graphics and legally usable source material.
- Frame/hitbox visualization architecture should not depend on unauthorized scraping.
- A media source can be linked/referenced without necessarily being bundled into the site.

This lets the frame-data portion proceed even if media licensing needs separate decisions.

---

# Milestones

Milestones are intentionally sequential. Each should leave the repository in a usable state before moving to the next.

## Phase 1 — Foundation

### M01 — Project scaffold
- [ ] Create React/TypeScript/Vite app.
- [ ] Enable strict TypeScript and linting.
- [ ] Establish build/test scripts.
- [ ] Confirm a clean production build from a fresh install.

### M02 — GitHub Pages deployment
- [ ] Add Pages-compatible Vite base configuration.
- [ ] Add GitHub Actions build/deploy workflow.
- [ ] Pick and validate routing strategy.
- [ ] Verify refresh/navigation from deployed Pages URL.

### M03 — Design tokens and responsive application shell
- [ ] Implement the Titan-inspired dark design system.
- [ ] Define typography, spacing, borders, surfaces, states, radius, and breakpoints.
- [ ] Desktop sidebar/navigation shell.
- [ ] Mobile navigation shell.
- [ ] Responsive content container that uses large screens efficiently.
- [ ] Reduced-motion and focus states.

### M04 — Core data contracts
- [ ] Define fighter, training, combo, source, timing, and confidence types.
- [ ] Add runtime/build-time validation for static fighter data.
- [ ] Implement frame ↔ 0.6-second tick conversion utilities.
- [ ] Add unit tests for timing and validation.

### M05 — Complete roster manifest
- [ ] Add every playable fighter to a canonical manifest.
- [ ] Resolve transformations/echo/special-slot behavior.
- [ ] Generate stable fighter slugs/routes.
- [ ] Add an automated completeness/duplicate check.

## Phase 2 — First usable training app

### M06 — Roster home screen
- [ ] Responsive fighter grid/list.
- [ ] Fast text search.
- [ ] Keyboard navigation.
- [ ] Mobile-friendly tap targets.
- [ ] Empty/error states.

### M07 — Fighter detail shell
- [ ] Character header.
- [ ] Memory aid.
- [ ] Quick guide.
- [ ] Practice-now card.
- [ ] Expandable detail sections.
- [ ] Previous/next fighter navigation.

### M08 — 0–200% training ladder UI
- [ ] Percentage ladder component.
- [ ] Fast jump to 0/20/40/.../200.
- [ ] Clear current-step emphasis.
- [ ] Show execution/timing notes.
- [ ] Responsive mobile treatment without wide tables.

### M09 — Combo explorer UI
- [ ] Render combo routes consistently.
- [ ] Visually distinguish true / kill confirm / DI dependent / character dependent / practice route.
- [ ] Filter by percent and classification.
- [ ] Show conditions without overwhelming the primary route.
- [ ] Expose source/verification state in a compact way.

### M10 — Reference fighter dataset
Populate and verify the initial reference fighters used to harden the schema/UI:

- [ ] Mario
- [ ] Squirtle
- [ ] Pyra
- [ ] Mythra

Each reference fighter must have:

- memory aid;
- quick guide;
- 0–200% practice routine;
- useful combos/kill confirms;
- timing notes;
- source metadata;
- verification classification.

### M11 — Timing-display preferences
- [ ] Frames / Ticks / Both selector.
- [ ] Persist preference locally.
- [ ] Apply setting consistently to all timing surfaces.
- [ ] Ensure no account/backend is involved.

## Phase 3 — Full roster content

### M12 — Full-roster memory aids
- [ ] Add concise 1–2 line memory aid for every fighter.
- [ ] Audit for consistency and usefulness.
- [ ] Ensure each aid describes what to practice rather than generic character lore.

### M13 — Full-roster quick guides
- [ ] Add practical quick guide for every fighter.
- [ ] Standardize terminology.
- [ ] Add archetype/goal tags useful for browsing later.

### M14 — Full-roster 0–200% routines
- [ ] Populate training ladder for every fighter.
- [ ] Avoid inventing long strings at percentages where the character should instead practice confirms, tech chases, traps, edgeguards, or raw kill options.
- [ ] Record conditions and confidence per step.

### M15 — Full-roster combo/confirm dataset
- [ ] Add practical BnBs.
- [ ] Add true combos.
- [ ] Add kill confirms.
- [ ] Add relevant DI/character-dependent routes.
- [ ] Keep practice routes separate from guaranteed strings.

### M16 — Content verification pass
- [ ] Cross-check every “true” label.
- [ ] Review percent windows.
- [ ] Review terminology and move notation.
- [ ] Check source coverage.
- [ ] Remove/flag claims that cannot be supported confidently.

## Phase 4 — Training UX polish

### M17 — Search, filters, favorites, recents
- [ ] Search by fighter/alias.
- [ ] Filter by series/archetype.
- [ ] Local-only favorites.
- [ ] Local-only recently viewed fighters.
- [ ] Clear local data control.

### M18 — Practice session mode
- [ ] Distraction-free “Practice” view.
- [ ] Pick fighter and starting percentage.
- [ ] Advance through routine steps with keyboard/touch.
- [ ] Optional repetition counter/check-off state stored locally.
- [ ] Quick reset.

### M19 — Mobile and accessibility hardening
- [ ] Test representative iPhone/Android widths.
- [ ] Test tablets and landscape layouts.
- [ ] Test 320px minimum-width behavior.
- [ ] Keyboard-only pass.
- [ ] Screen-reader semantics pass.
- [ ] Contrast/focus/reduced-motion pass.
- [ ] Dynamic text/zoom stress test.

### M20 — Performance and offline resilience
- [ ] Route/code splitting where useful.
- [ ] Lazy-load optional media.
- [ ] Keep initial bundle lean despite full roster data.
- [ ] Add installable/offline PWA support if it does not complicate Pages reliability.
- [ ] Lighthouse/performance budget.

## Phase 5 — Frame data expansion

### M21 — Frame-data schema
- [ ] Define movement/attribute data.
- [ ] Define grounded attacks.
- [ ] Define aerials and landing lag/autocancel windows.
- [ ] Define specials.
- [ ] Define grabs/throws.
- [ ] Define dodge/roll/air-dodge data.
- [ ] Support hitbox phases and multiple hitboxes.
- [ ] Attach source and patch-version metadata.

### M22 — Frame-data UI
- [ ] Move browser on fighter page.
- [ ] Startup / active / recovery / FAF presentation.
- [ ] Shield advantage and landing data where available.
- [ ] Frames/ticks toggle reused from core settings.
- [ ] Mobile-friendly move cards.
- [ ] Sorting/filtering by useful numerical fields.

### M23 — Frame-data population
- [ ] Populate the full roster in batches.
- [ ] Validate numerical data automatically.
- [ ] Cross-check high-value moves manually.
- [ ] Track completeness per fighter.

## Phase 6 — Visual move explorer

### M24 — Media rights/source pipeline
- [ ] Decide allowed asset sources and redistribution rules.
- [ ] Add asset attribution/license metadata format.
- [ ] Add build checks for missing attribution metadata.
- [ ] Establish a safe process before committing large amounts of game media.

### M25 — Hitbox/frame viewer foundation
- [ ] Frame scrubber.
- [ ] Play/pause/step controls.
- [ ] Active/inactive frame timeline.
- [ ] Overlay hooks for hitboxes/hurtboxes when legally usable data exists.
- [ ] Touch gestures and keyboard controls.

### M26 — Fighter move animations / imagery
- [ ] Add approved character imagery.
- [ ] Add approved move animations/visual references.
- [ ] Lazy-load and optimize all large assets.
- [ ] Graceful text-only fallback if visual media is unavailable.

## Phase 7 — Advanced expansion

### M27 — Matchup/DI training notes
- [ ] Target-specific combo exceptions.
- [ ] DI options and responses.
- [ ] Weight/fall-speed notes.
- [ ] Character-specific kill-confirm windows where worth documenting.

### M28 — Discovery tools
- [ ] Fastest move / safest move queries.
- [ ] Out-of-shield reference.
- [ ] Compare moves within a fighter.
- [ ] Browse characters by archetype/training goal.

### M29 — Release-quality audit
- [ ] All routes work on GitHub Pages.
- [ ] Production build/test/lint green.
- [ ] No broken roster entries.
- [ ] No unsupported “true combo” claims.
- [ ] Mobile/desktop visual QA.
- [ ] Accessibility QA.
- [ ] Source/attribution audit.
- [ ] Performance budget pass.

---

## Testing strategy

At minimum, the repository should evolve toward these automated gates:

```text
npm run typecheck
npm run lint
npm test
npm run build
```

Add browser-level tests for the highest-value flows:

1. open roster;
2. search fighter;
3. open fighter;
4. select percentage;
5. read practice route;
6. change frames/ticks preference;
7. navigate directly to fighter route on Pages;
8. operate the same flow at mobile viewport widths.

Content validation should fail the build for malformed fighter IDs, duplicate slugs, invalid percent values, broken source references, or impossible timing fields.

---

## GitHub Pages deployment target

The deployment must remain static:

```text
GitHub repository
      ↓
GitHub Actions
      ↓
Vite production build
      ↓
GitHub Pages
      ↓
Phone / tablet / desktop browser
```

There is no server-side dependency in that path.

Local-only preferences such as favorites, timing display, and practice progress can use browser storage and must degrade safely if storage is unavailable.

---

## Definition of “done” for a milestone

A milestone is complete only when:

- its implementation is committed;
- relevant tests/checks pass;
- mobile and desktop behavior are both considered;
- no knowingly broken placeholder is left in the primary flow;
- documentation/data contracts are updated when behavior changes;
- new fighter claims carry the required verification/source metadata.

Do not rush later milestones by leaving the previous milestone half-finished.

---

## Immediate execution order

When implementation starts, work sequentially:

**M01 → M02 → M03 → M04 → M05**

That produces a deployable, responsive shell with a stable data contract before large amounts of roster content are added. After that, **M06–M11** turn it into the first genuinely useful training app, and **M12–M16** scale the verified content across the roster.
