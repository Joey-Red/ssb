# M71–M80 release snapshot

This release expands the full-roster move-study pipeline to full-motion local media with explicit timeline ownership for fighter actions, landing states, projectiles, effects, charge/loop states, companion actions, and transitions.

## Final generated audit

- Frame-data moves audited: 3,588
- Moves with discovered source visuals: 2,580
- Source variants: 3,075
- Resolved source variants: 2,522
- Unresolved source variants: 553
- Frame-data moves without a discovered/reviewed visual: 1,008
- Total explicit visual blockers: 1,561
- Reviewed local captures in this release: 0

Unresolved cases remain explicit source/timing/capture blockers. The project does not synthesize missing animation frames, fabricate collision geometry, or relabel partial source coverage as complete.

The final release corrects Pikachu Down B Thunder so the thunderbolt source is treated as an independent projectile timeline instead of being incorrectly bounded by Pikachu's parent fighter-action duration. It also hardens the vendor pipeline so complete fighter motion is not confused with complete interaction coverage when a projectile, companion, effect, or other lingering hitbox remains active after the fighter animation ends.

Exact-head release gate: lint, Vitest, strict TypeScript, and Vite production build must pass before merge to `main` and GitHub Pages deployment.
