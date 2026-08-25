#!/usr/bin/env python3
"""Write the compact, actionable residual queue after all automatic source work."""
from __future__ import annotations

import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
AUDIT = ROOT / "src/data/visualCoverageAudit.generated.json"
TIMING = ROOT / "src/data/rubenTimingOverrides.generated.json"
EXTERNAL = ROOT / "src/data/externalVisualSources.generated.json"
CAPTURE = ROOT / "src/data/visualCaptureQueue.generated.json"
OUT = ROOT / "docs/VISUAL_COMPLETION_SUMMARY.generated.md"


def main() -> int:
    audit = json.loads(AUDIT.read_text(encoding="utf-8"))
    timing = json.loads(TIMING.read_text(encoding="utf-8")) if TIMING.exists() else {}
    external = json.loads(EXTERNAL.read_text(encoding="utf-8")) if EXTERNAL.exists() else {}
    capture = json.loads(CAPTURE.read_text(encoding="utf-8")) if CAPTURE.exists() else {}

    missing_categories = audit.get("missingMoveCategories", {})
    blockers = audit.get("blockerCounts", {})
    lines = [
        "# Visual Completion Summary",
        "",
        "This file is generated after public-source discovery, game-data timing resolution, media vendoring, historical-source selection, and the strict coverage audit.",
        "",
        f"- Frame-data move rows: **{audit.get('totalFrameDataMoves', 0)}**",
        f"- Move rows with real source/reviewed visuals: **{audit.get('mappedVisualMoves', 0)}**",
        f"- Move rows still requiring a real visual source/capture: **{audit.get('movesWithoutSourceVisual', 0)}**",
        f"- Real source variants: **{audit.get('variantCount', 0)}**",
        f"- Resolved real variants: **{audit.get('resolvedVariants', 0)}**",
        f"- Unresolved real variants: **{audit.get('unresolvedVariants', 0)}**",
        f"- Total real move/variant blockers: **{audit.get('unresolvedTotal', 0)}**",
        f"- Ruben timing gaps resolved automatically: **{timing.get('resolvedTimingGaps', 0)} / {timing.get('targetTimingGaps', 0)}**",
        f"- External candidates accepted this pass: **{external.get('acceptedCandidates', 0)}**",
        f"- Previously source-less moves gaining external candidates: **{external.get('addedMoves', 0)}**",
        f"- Deterministic capture queue entries: **{capture.get('queueCount', len(capture.get('queue', [])) if isinstance(capture, dict) else 0)}**",
        "",
        "## Remaining variant blockers",
        "",
    ]
    if blockers:
        for name, count in sorted(blockers.items(), key=lambda item: (-item[1], item[0])):
            lines.append(f"- `{name}`: **{count}**")
    else:
        lines.append("- None")

    lines.extend(["", "## Remaining move rows with no real visual", ""])
    if missing_categories:
        for name, count in sorted(missing_categories.items(), key=lambda item: (-item[1], item[0])):
            lines.append(f"- `{name}`: **{count}**")
    else:
        lines.append("- None")

    lines.extend([
        "",
        "## Completion rule",
        "",
        "Synthetic timing schematics are excluded from every count above. A blocker reaches zero only through source-backed media, reviewed deterministic capture, or provenance-backed timing evidence.",
    ])
    OUT.write_text("\n".join(lines).rstrip() + "\n", encoding="utf-8")
    print(f"completion summary: {audit.get('unresolvedTotal', 0)} real blockers remain")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
