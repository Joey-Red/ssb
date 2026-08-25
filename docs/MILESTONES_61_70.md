# Milestones 61–70 — Full-roster active-frame visuals

This batch expands the exact visual-study system from a small curated set to the full SSBU roster while preserving the project's zero-third-party-runtime-network rule.

- **M61 — Browser-safe maintenance discovery.** Use maintenance-only browser impersonation to read UFD fighter pages that reject ordinary hosted-runner clients; the deployed SPA remains network-isolated.
- **M62 — Full-roster visual source map.** Map UFD hitbox/media entries to the committed frame-data move IDs for all 89 fighters and retain alternate/angled/landing source variants without filename guessing.
- **M63 — Active/impact-frame asset format.** Vendor compact local WebP sheets containing the documented active/impact span instead of storing every recovery frame; exact sheet cells carry explicit game-frame numbers.
- **M64 — Ground-move visual coverage.** Stage available jab, tilt, dash attack, and smash visual references across the roster.
- **M65 — Aerial visual coverage.** Stage available neutral/forward/back/up/down-air visual references across the roster.
- **M66 — Special-move visual coverage.** Stage available neutral/side/up/down-special hitbox references, including static projectile/reference imagery when UFD does not expose a frame animation.
- **M67 — Grab/throw/remaining combat coverage.** Stage available grab, dash/pivot grab, pummel, throw, and other frame-data-mapped combat visuals.
- **M68 — Variant-aware frame player.** Let one move expose multiple local source variants (angled attacks, alternate states, landing visuals) while seeking exact staged game-frame cells and never presenting a static source image as synchronized animation.
- **M69 — Full media integrity/performance audit.** Require all generated browser assets to be local, verify 89-fighter coverage, validate frame-number maps, enforce a Pages-safe media budget, and keep startup/recovery fallback rendering lightweight.
- **M70 — Release, merge, and Pages verification.** Pass the exact-head quality gate, merge to `main`, successfully deploy GitHub Pages, verify the live release, and retire the milestone branch.

The target is every frame-data move for which UFD exposes a usable hitbox/reference asset. A missing third-party source image remains explicitly unavailable rather than fabricated.
