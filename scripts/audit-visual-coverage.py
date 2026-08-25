#!/usr/bin/env python3
"""Produce a deterministic machine-readable and Markdown audit of visual blockers."""
from __future__ import annotations

import json
from collections import Counter, defaultdict
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
REPORT = ROOT / "src/data/visualMediaCoverage.generated.json"
JSON_OUT = ROOT / "src/data/visualCoverageAudit.generated.json"
MD_OUT = ROOT / "docs/VISUAL_COVERAGE_AUDIT.generated.md"


def main() -> int:
    report = json.loads(REPORT.read_text(encoding="utf-8"))
    if report.get("version") != 2:
        raise SystemExit("coverage report must be version 2")

    by_fighter: dict[str, list[dict]] = defaultdict(list)
    for gap in report.get("gaps", []):
        by_fighter[gap["fighterId"]].append(gap)

    fighters = {}
    for fighter_id in sorted(by_fighter):
        gaps = sorted(by_fighter[fighter_id], key=lambda item: (item["moveLabel"], item["variantLabel"]))
        fighters[fighter_id] = {
            "unresolvedVariants": len(gaps),
            "blockers": dict(sorted(Counter(item["blockerClass"] for item in gaps).items())),
            "timelines": dict(sorted(Counter(item["timelineClass"] for item in gaps).items())),
            "variants": gaps,
        }

    audit = {
        "version": 1,
        "variantCount": report["variantCount"],
        "resolvedVariants": report["resolvedVariants"],
        "unresolvedVariants": report["unresolvedVariants"],
        "blockerCounts": report.get("blockerCounts", {}),
        "fightersWithBlockers": len(fighters),
        "fighters": fighters,
    }
    JSON_OUT.write_text(json.dumps(audit, indent=2) + "\n", encoding="utf-8")

    lines = [
        "# Visual Coverage Audit",
        "",
        f"- Variants: **{audit['variantCount']}**",
        f"- Resolved: **{audit['resolvedVariants']}**",
        f"- Unresolved: **{audit['unresolvedVariants']}**",
        f"- Fighters with blockers: **{audit['fightersWithBlockers']}**",
        "",
        "This file is generated. A listed item is a source/timing blocker, not permission to invent a mapping.",
        "",
    ]
    for fighter_id, fighter in fighters.items():
        lines.extend([f"## {fighter_id}", ""])
        seen_moves: set[str] = set()
        for gap in fighter["variants"]:
            move = gap["moveLabel"]
            if move not in seen_moves:
                lines.append(f"- **{move}**")
                seen_moves.add(move)
            lines.append(f"  - `{gap['variantLabel']}` — {gap['timelineClass']} / {gap['blockerClass']}: {gap['reason']}")
        lines.append("")
    MD_OUT.write_text("\n".join(lines).rstrip() + "\n", encoding="utf-8")
    print(f"audit: {audit['resolvedVariants']}/{audit['variantCount']} resolved; {audit['unresolvedVariants']} unresolved")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
