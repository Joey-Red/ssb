#!/usr/bin/env python3
"""Bring PLAN.md forward through the local exact-frame M51–M60 batch."""

from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
PLAN = ROOT / 'PLAN.md'
MARKER = '## Quality gate'
PHASES = r'''## Phase 5B — Live Festival QA hardening
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
The player supports local exact sprite sheets and the maintenance tooling can convert reviewed animations into frame-addressable sheets.
### M47 — Overlay hardening ✅
Overlay regions require exact frame media and support hitbox, hurtbox, grab, and intangibility region types without fabricated geometry.
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
Every registered hitbox animation is downloaded into the repository and no longer depends on third-party hotlinking at runtime.
### M54 — Exact frame-sheet population ✅
Every registered move animation is converted to a local, validated exact-frame sprite sheet whose frame count matches the move reference.
### M55 — Advanced frame playback controls ✅
The frame player supports direct frame entry, 0.25×/0.5×/1× playback, first/last-active jumps, active-span looping, keyboard stepping, and touch-safe controls.
### M56 — Pyra exact visual study ✅
All five Pyra aerials have local previews and exact seekable frame sheets with timing consistency checks.
### M57 — Mythra exact visual study ✅
All five Mythra aerials have local previews and exact seekable frame sheets with timing consistency checks.
### M58 — Mario and Kazuya exact visual study ✅
The currently registered Mario and Kazuya aerial references use local exact sheets, including Kazuya Up Air and complex Down Air timing.
### M59 — Offline/media integrity audit ✅
Automated tests require all roster images and registered move media to exist locally, enforce same-origin automatic runtime networking, and keep local JSON/images cacheable.
### M60 — Arena rename, release QA, merge and Pages deployment
The alternate dark theme is named Arena everywhere. Completion requires exact-head CI, merge to `main`, successful Pages deployment, live responsive QA, and branch cleanup.

'''


def main() -> int:
    text = PLAN.read_text(encoding='utf-8')
    text = text.replace('### M40 — Festival release and GitHub Pages QA\n', '### M40 — Festival release and GitHub Pages QA ✅\n')
    if '## Phase 6 — Local assets and exact frame study' not in text:
        if MARKER not in text:
            raise SystemExit('PLAN quality-gate marker not found')
        text = text.replace(MARKER, PHASES + MARKER)
    PLAN.write_text(text, encoding='utf-8')
    return 0


if __name__ == '__main__':
    raise SystemExit(main())
