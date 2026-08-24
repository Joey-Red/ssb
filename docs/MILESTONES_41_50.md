# Milestones 41–50 — Festival completion and frame-study hardening

This batch follows the Festival release and the first live visual QA pass. Festival remains the default theme; Arena remains an intentionally separate alternate rather than being rewritten.

## M40 cleanup — Close the Festival release
Mark the already merged/released Festival batch complete after live QA confirmed the theme, character imagery, frame workspace, tools, drills, and practice routes render without build errors.

## M41 — Festival dark-surface eradication
Audit component CSS for literal Arena-dark backgrounds and normalize every Festival surface through Festival-only overrides. Cover roster controls, combo cards, training ladder, practice, drills, matchup/DI, frame data, and Tools without changing Arena.

## M42 — Tools presentation cleanup
Use canonical roster display names instead of transport/internal IDs, improve Festival card/control styling, preserve responsive grids, and keep OOS explanations readable at phone through ultrawide sizes.

## M43 — Move-discovery relevance
Make “fast buttons” default to actual attacks (`ground | aerial | special`) instead of being flooded by pummels, defensive rows, throws, or miscellaneous effects. Preserve an explicit “all sourced rows” option for data exploration.

## M44 — Full fighter-image audit
Validate official fighter render/thumbnail URL mapping for all 89 roster entries, correct shared/exception mappings, preserve lazy loading and glyph fallback, and keep image failure non-fatal.

## M45 — Expand real hitbox media coverage
Grow the explicit visual-media registry beyond the initial references, prioritizing Mario and the full Pyra/Mythra aerial kits plus the Kazuya aerial set used during QA. Every registered preview must retain a source link and exact timing metadata.

## M46 — True seekable frame-media pipeline
Move beyond non-seekable GIF previews. Support frame-addressable local still/sprite sequences so the slider selects a specific visual frame. Keep animated-source preview as a fallback until a move has staged exact-frame media; never label a GIF preview as seek-synchronized.

## M47 — Hitbox/hurtbox overlay hardening
Require overlay geometry to be tied to an exact hosted frame image, validate coordinate/radius bounds, expose overlay availability honestly, and prepare the model for hurtbox/interaction regions without fabricating positions.

## M48 — Frame-data payload optimization
Remove the full roster JSON snapshot from the JavaScript bundle. Prepare it as a static Pages asset, fetch/cache it only in frame-heavy routes, provide loading/error states, and cache the JSON for repeat/offline use.

## M49 — Gameplay/content verification continuation
Run another conservative data audit focused on Aegis and other high-use training material: true labels, percentage windows, DI/character conditions, OOS wording, source references, and frame/media timing consistency.

## M50 — Full release and responsive QA
Run lint, all tests, strict TypeScript, production build, bundle review, and route-level responsive/accessibility checks for Festival and Arena from 320px through desktop/2K/ultrawide. Merge only after the exact branch head is green, deploy Pages, and verify the live release.
