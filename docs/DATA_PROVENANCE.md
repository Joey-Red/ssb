# Frame-data provenance

The deployed SSBU Training Guide is a static application. It does not scrape websites, call a frame-data API, or download fighter data while a visitor uses the site.

## Canonical reference

Move timing values are attributed to **Ultimate Frame Data (UFD)** and every fighter frame-data panel links back to that fighter's UFD page for verification.

The project stores normalized factual fields such as move name, startup, active frames, total frames, landing lag, damage, shield advantage, shield lag/stun, hitbox labels, end lag, and autocancel windows. Complex factual notation is preserved instead of being simplified into a potentially incorrect single number.

**Total Frames and FAF are separate concepts.** A missing FAF remains missing; the application never substitutes total frames or end lag for FAF.

## Maintenance transport mirror

UFD currently rejects requests from GitHub-hosted Actions runners. To make the maintenance refresh reproducible, `scripts/refresh-frame-data.py` reads the public CSV mirror at:

- `https://github.com/TheFakeNatty/smash-data`

The mirror is a transport/cache for normalized UFD-derived rows, not the canonical citation shown to users. The generated snapshot records both the UFD canonical base URL and the maintenance mirror URL.

The mirror repository is GPL-3.0 licensed. This project does **not** copy its scraper/source code. The refresh script is independently implemented here and consumes factual CSV values. Source prose from the CSV `notes` field is not bundled; the generator extracts only the factual autocancel frame window when present.

## What is deliberately not bundled

The repository does not bulk-copy UFD page text, screenshots, hitbox images, fighter renders, animations, or other third-party media. Those require their own rights/provenance decision under `docs/MEDIA_POLICY.md`.

Movement-stat fields remain blank when the maintenance source does not provide them. Unknown data is preferable to inferred or fabricated values.

## Refresh behavior

The refresh is maintenance-time only:

1. Read the project's 89-fighter UFD manifest.
2. Fetch the corresponding raw CSV for each fighter from the maintenance mirror.
3. Normalize and deduplicate factual move rows.
4. Refuse to write a partial snapshot if any fighter fails validation.
5. Commit `src/data/frameData.generated.json`.
6. Run the normal lint, tests, TypeScript and production-build gate.

If a value is disputed, verify it against UFD, in-game testing, and frame-by-frame replay analysis before changing the committed snapshot.
