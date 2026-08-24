# Milestones 51–60 — Local assets and exact frame study

This batch makes the deployed app self-contained. Runtime UI resources must come from the GitHub Pages origin; third-party sites are maintenance/source references only and are never automatic image/media/data dependencies.

## M51 — Zero-runtime-network asset architecture
Vendor fighter art and move-study media under `public/media`, use BASE_URL-relative runtime paths, and enforce a same-origin Content Security Policy plus automated network-policy tests.

## M52 — Full-roster local fighter art and portrait alignment
Download/optimize local renders and centered roster thumbnails for all 89 fighter pages. Remove always-visible fallback art behind transparent portraits and keep card/hero positioning stable from 320px through ultrawide.

## M53 — Local hitbox-preview repair
Download every currently registered hitbox animation, serve it locally, remove hotlink/referrer failure from the player, and preserve the source URL only as an explicit user-opened reference link.

## M54 — Exact frame-sheet population
Convert every registered local animation into a fixed-grid sprite sheet whose frame count is validated against move timing. The slider must select the corresponding staged image rather than an independently playing GIF.

## M55 — Advanced frame playback controls
Add direct frame entry, 0.25×/0.5×/1× playback, first/last-active jumps, active-span looping, keyboard stepping, and touch-safe controls while preserving native 60 FPS frame terminology.

## M56 — Pyra exact visual study
All five Pyra aerials must have local preview media and exact seekable frame sheets, with their active timing cross-checked against the committed frame snapshot.

## M57 — Mythra exact visual study
All five Mythra aerials must have the same local/exact treatment and timing consistency checks.

## M58 — Mario and Kazuya exact visual study
Convert the currently registered Mario and Kazuya aerial references to local exact sheets, including the Kazuya Up Air QA case and complex Kazuya Down Air timing.

## M59 — Offline/media integrity audit
Tests must verify all 89 fighter images and all registered move previews/sheets exist in the repository, runtime source cannot auto-request third-party assets, frame data remains same-origin, and the service worker can cache local images/JSON.

## M60 — Arena rename, release QA, merge and Pages deployment
Rename the alternate dark theme to **Arena** everywhere, remove the previous theme name from maintained text/code, run the exact-head lint/test/strict-TypeScript/production gate, verify responsive Festival/Arena layouts, merge to `main`, deploy Pages, and clean the branch.
