# SSBU Training Guide — Project Plan

## Product goal
Build a polished, mobile-first Super Smash Bros. Ultimate training companion that is a frontend-only SPA deployable to GitHub Pages. Every fighter gets a 1–2 line memory aid, concise quick guide, character-specific 0–200% practice routine, conservative combo/confirm information, full move timing reference, frame-by-frame visual move study, and training tools that remain useful without an account or server.

## Non-negotiables
- Frontend only: no server, database, login, telemetry, or required runtime API.
- GitHub Pages compatible and refresh-safe.
- Responsive from 320px phones through tablets, desktop, 2K, and ultrawide.
- **Festival is the default visual theme:** bright, playful, celebratory, large branded typography, strong color blocks, game-like shapes, and richer visuals inspired by the energy of Nintendo/Mario UI without sacrificing training readability.
- **Arena remains available as a toggleable alternate theme:** the existing matte dark, restrained, compact presentation is preserved rather than replaced.
- Theme choice persists locally and never requires an account.
- Branding, fighter names, section titles, and primary actions should be deliberately larger and more prominent than the original UI.
- Decorative visuals must scale or simplify responsively instead of causing horizontal overflow, cramped cards, unreadable frame tables, or lost touch targets.
- Static, versioned, source-aware fighter data.
- Never label a route “true” merely because it is commonly performed. Preserve DI/character/percent/rage/hitbox/stage conditions.
- Use standard SSBU frame terminology only. The abandoned 0.6-second tick concept is not part of the product.
- Accessible keyboard navigation, visible focus, semantic markup, reduced-motion support, forced-colors support, and practical touch targets.
- Frame visuals may use hosted game-frame captures/photos as the visual reference. Hitbox/hurtbox annotations are stored as separate overlay metadata so circles/regions can be toggled, corrected, and audited without baking guesses into the image.
- The visual frame viewer must support frame stepping and seeking like a small video player while remaining usable by keyboard, touch, and mouse.
- **No automatic third-party runtime resource requests.** Fighter art, hitbox media, exact-frame sheets, frame JSON, icons, and other app-loaded resources are vendored and served from the GitHub Pages origin. External source URLs are explicit user-opened references only.

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
A visual move reference is a static sequence of numbered documented frames with optional per-frame source imagery and annotations. Each frame can provide:
- a hosted frame capture/photo;
- frame number and move phase (`startup | active | recovery | landing | other`);
- one or more hitbox circles/regions;
- optional hurtbox/interaction regions later;
- short factual annotation/source metadata.

The viewer behaves like a compact video player: previous/next frame, play/pause, frame-number seek slider, direct frame input/readout, slow-motion speed choices, first/last-active jumps, active-span looping, keyboard stepping, touch-friendly controls, and an overlay toggle. Each distinct staged source image is frame-addressable. If a source animation omits a distinct image for one of the documented recovery frames, the UI reports the source-visual coverage gap instead of duplicating or inventing an image. The UI must never imply continuous active hitboxes across frames that do not actually contain them.

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
10. A missing source image is never synthesized merely to make visual coverage equal documented total frames.

# Milestones

## Phase 1 — Foundation
### M01 — Project scaffold ✅
React/TypeScript/Vite, strict compilation, lint/test/build scripts, production build gate.
### M02 — GitHub Pages deployment ✅
Pages-safe Vite base, hash routing, GitHub Actions build/deploy workflow.
### M03 — Responsive application shell ✅
Arena-inspired tokens/surfaces, desktop sidebar, mobile navigation, focus and reduced-motion behavior.
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
`festival | arena` theme state is browser-local, Festival is the first-run default, Arena remains available, and pre-paint theme restoration avoids a theme flash.
### M32 — Festival design language ✅
Festival adds cream/red/blue/yellow/green game-like tokens, stronger outlines/shadows, playful decoration, celebratory surfaces, and a clearly different identity from Arena rather than a recolor.
### M33 — Large branding and typography pass ✅
Brand, page titles, fighter names, section headings, stats, and primary actions scale more aggressively across phone/tablet/desktop/2K/ultrawide breakpoints, with wrapping/fallback rules for constrained screens.
### M34 — Responsive decorative visual system ✅
Reusable background motifs, fighter glyph treatments, badges, cards, and hero decorations simplify at smaller breakpoints and preserve focus/content readability.
### M35 — Fighter pictures and media slots ✅
Roster cards and fighter heroes have responsive visual art/media slots with stable aspect ratios and fallback-safe rendering; M52 replaces runtime-hotlinked fighter imagery with vendored local assets.
### M36 — Visual move media schema ✅
Typed move-frame sequences store phase, optional image, optional caption, and percentage-positioned hitbox circles/regions. Validation enforces contiguous documented frames and safe overlay bounds.
### M37 — Frame-by-frame hitbox player ✅
Move details include previous/next frame, 60 FPS play/pause, seek slider, keyboard stepping, current-frame/phase readout, overlay support, hosted-still support, and initial hitbox-reference integration; Phase 6 makes those registered assets local and frame-addressable.
### M38 — Theme-aware responsive/accessibility audit ✅
Festival hard-coded dark-component conflicts were overridden, native Festival controls are forced to light scheme, touch controls remain >=44px, mobile/2K/ultrawide layouts have dedicated rules, and reduced-motion/forced-colors paths remain supported.
### M39 — Visual performance/offline hardening ✅
Fighter-heavy routes remain lazy-loaded; images use native lazy loading/async decoding; visual references are not preloaded on the roster route. The release gate confirmed the initial JS moved only from roughly 276 KB to 278 KB uncompressed. The older monolithic frame-data chunk was subsequently resolved in M48.
### M40 — Festival release and GitHub Pages QA ✅
Festival became the deployed first-run theme, Arena remained available as the persistent alternate, and the release was merged and validated through GitHub Pages.

## Phase 5B — Live Festival QA hardening
### M41 — Festival dark-surface eradication ✅
Festival-only overrides remove remaining hard-coded dark component surfaces without changing the alternate dark theme.
### M42 — Tools presentation cleanup ✅
Frame Tools use canonical fighter names, readable Festival surfaces, and responsive controls.
### M43 — Move-discovery relevance ✅
Fast-button discovery defaults to actual attacks rather than pummels/throws/defensive/misc rows, while an all-rows mode remains available.
### M44 — Fighter-image mapping audit ✅
The 89-fighter visual mapping and fallback path are tested; local vendoring is completed in M52.
### M45 — Expanded hitbox media registry ✅
Mario, Pyra, Mythra, and Kazuya aerial references are registered with source-aware timing metadata.
### M46 — Exact-frame pipeline foundation ✅
The player supports local source-frame sprite sheets and maintenance tooling can convert reviewed animations into frame-addressable sheets.
### M47 — Overlay hardening ✅
Overlay regions require an exact staged frame image and support hitbox, hurtbox, grab, and intangibility region types without fabricated geometry.
### M48 — Frame-data payload optimization ✅
The 89-fighter frame snapshot moved out of JavaScript into an on-demand/cacheable same-origin JSON asset, removing the previous oversized JS chunk.
### M49 — Timing/content consistency audit ✅
Visual timing is cross-checked against the committed frame snapshot, including complex multi-hit notation.
### M50 — Hardening release ✅
The Festival QA/tool/performance hardening batch passed the exact-head quality gate and was merged to `main`.

## Phase 6 — Local assets and exact frame study
### M51 — Zero-runtime-network asset architecture ✅
Runtime visuals use same-origin BASE_URL-relative paths, CSP restricts automatic images/media/connections to the Pages origin, and tests reject third-party runtime asset/request URLs.
### M52 — Full-roster local fighter art and portrait alignment ✅
All 89 fighter pages receive vendored local renders and centered thumbnails; transparent fallback art no longer shows behind successful portraits.
### M53 — Local hitbox-preview repair ✅
Every currently registered hitbox animation is downloaded into the repository and no longer depends on third-party hotlinking at runtime.
### M54 — Exact source-frame sheet population ✅
Every registered move animation is converted into a local frame-addressable sprite sheet. The build records actual source-image coverage separately from documented total frames; missing source images are reported rather than synthesized. Of the current 19 registered moves, all source images are seekable, with only Pyra Neutral Air (55/56), Up Air (56/57), and Down Air (64/65) lacking a distinct source image for the final documented recovery frame.
### M55 — Advanced frame playback controls ✅
The frame player supports direct frame entry, 0.25×/0.5×/1× playback, first/last-active jumps, active-span looping, keyboard stepping, and touch-safe controls.
### M56 — Pyra exact visual study ✅
All five Pyra aerials have local previews and frame-addressable source sheets with timing consistency checks and explicit visual-coverage reporting.
### M57 — Mythra exact visual study ✅
All five Mythra aerials have local previews and complete frame-addressable source sheets with timing consistency checks.
### M58 — Mario and Kazuya exact visual study ✅
The currently registered Mario and Kazuya aerial references use local complete source sheets, including Kazuya Up Air and complex Down Air timing.
### M59 — Offline/media integrity audit ✅
Automated tests require all 89 roster renders/thumbnails and all 19 registered move previews/sheets to exist locally, enforce same-origin automatic runtime networking, and keep local JSON/images cacheable.
### M60 — Arena rename, release QA, merge and Pages deployment ✅
The alternate dark theme is named Arena throughout maintained code/text. The M51–M60 exact head passed lint, 33/33 tests, strict TypeScript, and the production Vite build; PR #9 was squash-merged to `main`, and GitHub Pages reported a successful deployment of the merged release.

## Quality gate
```text
npm run lint
npm test
npm run build
```
`npm run check` runs the complete gate. Static validation rejects malformed/duplicate roster routes, missing full-roster guides, invalid 0–200 routine structure, bad percentage windows, missing sources, invalid startup-frame fields, unsupported `true` classifications, unsafe/malformed media entries, invalid visual-frame overlays, incomplete frame-data snapshots, missing vendored fighter/move media, and prohibited automatic third-party runtime resource URLs.

## Deployment
`main → GitHub Actions → Vite dist → GitHub Pages → phone/tablet/desktop browser`.

**M01–M60 are merged into `main` and deployed through GitHub Pages.**
