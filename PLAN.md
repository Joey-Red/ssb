# SSBU Training Guide — Project Plan

## Product goal
Build a polished, mobile-first Super Smash Bros. Ultimate training companion that is a frontend-only SPA deployable to GitHub Pages. Every fighter gets a 1–2 line memory aid, concise quick guide, character-specific 0–200% practice routine, conservative combo/confirm information, full move timing reference, frame-by-frame visual move study, and training tools that remain useful without an account or server.

## Non-negotiables
- Frontend only: no server, database, login, telemetry, or required runtime API.
- GitHub Pages compatible and refresh-safe.
- Responsive from 320px phones through tablets, desktop, 2K, and ultrawide.
- **Festival is the default visual theme:** bright, playful, celebratory, large branded typography, strong color blocks, game-like shapes, and richer visuals inspired by the energy of Nintendo/Mario UI without sacrificing training readability.
- **Titan remains available as a toggleable alternate theme:** the existing matte dark, restrained, compact presentation is preserved rather than replaced.
- Theme choice persists locally and never requires an account.
- Branding, fighter names, section titles, and primary actions should be deliberately larger and more prominent than the original UI.
- Decorative visuals must scale or simplify responsively instead of causing horizontal overflow, cramped cards, unreadable frame tables, or lost touch targets.
- Static, versioned, source-aware fighter data.
- Never label a route “true” merely because it is commonly performed. Preserve DI/character/percent/rage/hitbox/stage conditions.
- Use standard SSBU frame terminology only. The abandoned 0.6-second tick concept is not part of the product.
- Accessible keyboard navigation, visible focus, semantic markup, reduced-motion support, forced-colors support, and practical touch targets.
- Frame visuals may use hosted game-frame captures/photos as the visual reference. Hitbox/hurtbox annotations are stored as separate overlay metadata so circles/regions can be toggled, corrected, and audited without baking guesses into the image.
- The visual frame viewer must support frame stepping and seeking like a small video player while remaining usable by keyboard, touch, and mouse.

## Architecture
React + TypeScript + Vite, strict TypeScript, project-owned CSS, hash routing for Pages reliability, static TypeScript/JSON data, static visual media, Vitest validation, local-only browser persistence, lazy-loaded heavy views, progressive offline caching, and GitHub Actions deployment.

```text
src/
  components/
  data/
  lib/
  router.ts
  types.ts
scripts/
public/
  media/
  sw.js
```

### Core classifications
`true | kill-confirm | di-dependent | character-dependent | practice-route`

Every source-backed route stores a percentage window, classification, confidence, conditions where needed, execution note, and source IDs. `review` content remains visibly distinct from source-backed material.

### Frame model
SSBU runs at 60 FPS. Frame data is stored/displayed as frames: startup, active frames, total frames, FAF when independently available, landing lag, autocancel windows, shield advantage, OOS timing, and related move data. **Total Frames and FAF are separate fields and are never substituted for each other.** Frame timing is never converted into the old tick system.

### Visual move model
A visual move reference is a static sequence of numbered frames with optional per-frame annotations. Each frame can provide:
- a hosted frame capture/photo;
- frame number and move phase (`startup | active | recovery | landing | other`);
- one or more hitbox circles/regions;
- optional hurtbox/interaction regions later;
- short factual annotation/source metadata.

The viewer behaves like a compact video player: previous/next frame, play/pause, frame-number seek slider, direct frame readout, keyboard stepping, touch-friendly controls, and an overlay toggle. The UI must never imply continuous active hitboxes across frames that do not actually contain them.

## Roster rules
The canonical manifest contains 89 independent fighter pages. Squirtle/Ivysaur/Charizard are independent pages; Pyra/Mythra are independent pages with Aegis relation metadata; Echo relationships are explicit; costume-only variants are not duplicated.

## Data verification policy
1. Store source metadata beside gameplay data.
2. Prefer measured frame-data sources for numerical values.
3. Do not copy large bodies of third-party prose.
4. Conditions that affect truth/percent windows must be represented.
5. Uncertain execution stays `review` rather than silently becoming verified.
6. Initial training percentage examples use Mario as a baseline dummy unless a route says otherwise.
7. Visual-frame images and overlay geometry are separate data layers; changing an annotation does not require altering the source image.
8. Unknown factual fields remain unknown instead of being inferred from adjacent values.
9. A frame viewer may show circles/regions only when that frame has explicit overlay metadata; missing geometry stays visibly unavailable rather than fabricated.

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
Project-owned procedural fighter identity graphics give fighter pages visual identity without depending on external runtime media.
### M27 — Matchup/DI training notes ✅
The matchup lab turns documented archetypes and existing DI-sensitive routes into practice focuses while explicitly avoiding fabricated universal matchup charts or DI answers.
### M28 — Discovery tools and OOS/move comparisons ✅
A dedicated Tools workspace supports side-by-side move metrics, cross-roster fast-move discovery, and OOS startup references with punish-context warnings.
### M29 — Release-quality audit ✅
CI validates roster/guide/frame/media/router invariants, runs lint and strict TypeScript, executes the full Vitest suite, and produces a successful Vite production build from `npm ci`.
### M30 — Local custom drill queue ✅
Users can build fighter-specific drills with percent, action route, notes, target reps, progress, reset/delete/clear-completed controls, and links back into practice/guides. State stays browser-local with no account, sync, or telemetry.

## Phase 5 — Festival visual identity and visual frame study
### M31 — Persistent theme system ✅
`festival | titan` theme state is browser-local, Festival is the first-run default, Titan remains available, and pre-paint theme restoration avoids a theme flash.
### M32 — Festival design language ✅
Festival adds cream/red/blue/yellow/green game-like tokens, stronger outlines/shadows, playful decoration, celebratory surfaces, and a clearly different identity from Titan rather than a recolor.
### M33 — Large branding and typography pass ✅
Brand, page titles, fighter names, section headings, stats, and primary actions scale more aggressively across phone/tablet/desktop/2K/ultrawide breakpoints, with wrapping/fallback rules for constrained screens.
### M34 — Responsive decorative visual system ✅
Reusable background motifs, fighter glyph treatments, badges, cards, and hero decorations simplify at smaller breakpoints and preserve focus/content readability.
### M35 — Fighter pictures and media slots ✅
Roster cards and fighter heroes now have responsive visual identity art/media slots with stable aspect ratios and fallback-safe rendering; the move viewer supports real image media separately.
### M36 — Visual move media schema ✅
Typed move-frame sequences store phase, optional image, optional caption, and percentage-positioned hitbox circles/regions. Validation enforces contiguous frames and safe overlay bounds.
### M37 — Frame-by-frame hitbox player ✅
Move details now include previous/next frame, 60 FPS play/pause, seek slider, keyboard stepping, current-frame/phase readout, overlay toggle, hosted-still support, and initial real UFD animated hitbox references for Mario/Pyra/Mythra neutral air.
### M38 — Theme-aware responsive/accessibility audit ✅
Festival hard-coded dark-component conflicts were overridden, native Festival controls are forced to light scheme, touch controls remain >=44px, mobile/2K/ultrawide layouts have dedicated rules, and reduced-motion/forced-colors paths remain supported.
### M39 — Visual performance/offline hardening ✅
Fighter-heavy routes remain lazy-loaded; images use native lazy loading/async decoding; visual references are not preloaded on the roster route. The release gate confirmed the initial JS moved only from roughly 276 KB to 278 KB uncompressed. The older monolithic frame-data chunk remains a separate optimization target.
### M40 — Festival release and GitHub Pages QA
Release candidate is implemented and branch CI has passed with 23/23 tests. Final completion requires merge to `main`, successful Pages deployment, and live route/theme/media verification.

## Quality gate
```text
npm run lint
npm test
npm run build
```
`npm run check` runs the complete gate. Static validation rejects malformed/duplicate roster routes, missing full-roster guides, invalid 0–200 routine structure, bad percentage windows, missing sources, invalid startup-frame fields, unsupported `true` classifications, unsafe/malformed media entries, invalid visual-frame overlays, and incomplete frame-data snapshots.

## Deployment
`main → GitHub Actions → Vite dist → GitHub Pages → phone/tablet/desktop browser`.

M01–M30 are merged into `main`. M31–M39 are complete on `milestones-31-40`; M40 closes after the Festival release is merged and verified on GitHub Pages.
