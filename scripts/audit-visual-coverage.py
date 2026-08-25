#!/usr/bin/env python3
"""Produce a deterministic full-roster audit of visual coverage blockers.

The variant coverage report only knows about moves for which source visual media
was discovered. This audit deliberately compares that set with the complete
committed frame-data snapshot as well, so a move cannot silently disappear from
"full roster" reporting merely because no source image/animation was found.
Reviewed local captures count only when their persistent asset metadata exists in
the provenance registry; a timing-only override never hides a visual blocker.
"""
from __future__ import annotations

import json
from collections import Counter, defaultdict
from pathlib import Path
from typing import Any

ROOT = Path(__file__).resolve().parents[1]
REPORT = ROOT / "src/data/visualMediaCoverage.generated.json"
SOURCES = ROOT / "src/data/visualMediaSources.json"
FRAME_DATA = ROOT / "src/data/frameData.generated.json"
OVERRIDES = ROOT / "src/data/visualTimelineOverrides.json"
JSON_OUT = ROOT / "src/data/visualCoverageAudit.generated.json"
MD_OUT = ROOT / "docs/VISUAL_COVERAGE_AUDIT.generated.md"


def frame_move_rows(frame_data: dict[str, Any]) -> list[dict[str, Any]]:
    rows: list[dict[str, Any]] = []
    for fighter_id, fighter in frame_data.get("fighters", {}).items():
        for move in fighter.get("moves", []):
            rows.append({
                "fighterId": fighter_id,
                "fighterName": fighter.get("name") or fighter_id,
                "moveId": move["id"],
                "moveLabel": f"{fighter.get('name') or fighter_id} {move.get('name') or move['id']}",
                "moveName": move.get("name") or move["id"],
                "category": move.get("category") or "unknown",
                "startup": move.get("startup"),
                "active": move.get("active"),
                "totalFrames": move.get("totalFrames"),
                "landingLag": move.get("landingLag"),
                "sourceUrl": fighter.get("sourceUrl"),
                "blockerClass": "no-source-visual",
                "reason": "frame-data move has no discovered or reviewed visual source; capture/research is required rather than inventing imagery",
            })
    return rows


def main() -> int:
    report = json.loads(REPORT.read_text(encoding="utf-8"))
    source = json.loads(SOURCES.read_text(encoding="utf-8"))
    frame_data = json.loads(FRAME_DATA.read_text(encoding="utf-8"))
    overrides = json.loads(OVERRIDES.read_text(encoding="utf-8"))
    if report.get("version") != 2:
        raise SystemExit("coverage report must be version 2")
    if source.get("version") != 3 or overrides.get("version") != 1:
        raise SystemExit("visual source/override schema mismatch")

    reviewed_capture_keys = {
        key for key, value in overrides.get("entries", {}).items()
        if isinstance(value, dict) and isinstance(value.get("reviewedCapture"), dict)
    }
    reviewed_capture_moves = {
        tuple(key.split(":", 2)[:2]) for key in reviewed_capture_keys if key.count(":") >= 2
    }
    source_visual_keys = {(move["fighterId"], move["moveId"]) for move in source.get("moves", [])}
    visual_keys = source_visual_keys | reviewed_capture_moves
    all_frame_moves = frame_move_rows(frame_data)
    no_source_moves = [
        row for row in all_frame_moves
        if (row["fighterId"], row["moveId"]) not in visual_keys
    ]
    no_source_moves.sort(key=lambda item: (item["fighterId"], item["category"], item["moveName"], item["moveId"]))

    raw_gaps = list(report.get("gaps", []))
    gaps = [
        gap for gap in raw_gaps
        if f"{gap['fighterId']}:{gap['moveId']}:{gap['variantId']}" not in reviewed_capture_keys
    ]
    captured_variant_resolutions = len(raw_gaps) - len(gaps)

    by_fighter: dict[str, list[dict[str, Any]]] = defaultdict(list)
    for gap in gaps:
        by_fighter[gap["fighterId"]].append(gap)

    no_source_by_fighter: dict[str, list[dict[str, Any]]] = defaultdict(list)
    for row in no_source_moves:
        no_source_by_fighter[row["fighterId"]].append(row)

    fighter_ids = sorted(set(by_fighter) | set(no_source_by_fighter))
    fighters: dict[str, dict[str, Any]] = {}
    for fighter_id in fighter_ids:
        fighter_gaps = sorted(by_fighter.get(fighter_id, []), key=lambda item: (item["moveLabel"], item["variantLabel"]))
        missing = no_source_by_fighter.get(fighter_id, [])
        fighters[fighter_id] = {
            "unresolvedVariants": len(fighter_gaps),
            "movesWithoutSourceVisual": len(missing),
            "totalBlockers": len(fighter_gaps) + len(missing),
            "blockers": dict(sorted(Counter(item["blockerClass"] for item in fighter_gaps).items())),
            "timelines": dict(sorted(Counter(item["timelineClass"] for item in fighter_gaps).items())),
            "missingMoveCategories": dict(sorted(Counter(item["category"] for item in missing).items())),
            "variants": fighter_gaps,
            "movesWithoutVisuals": missing,
        }

    unresolved_variants = len(gaps)
    resolved_variants = report["resolvedVariants"] + captured_variant_resolutions
    audit = {
        "version": 2,
        "totalFrameDataMoves": len(all_frame_moves),
        "mappedSourceVisualMoves": len(source_visual_keys),
        "mappedVisualMoves": len(visual_keys),
        "reviewedCaptureCount": len(reviewed_capture_keys),
        "movesWithoutSourceVisual": len(no_source_moves),
        "missingMoveCategories": dict(sorted(Counter(item["category"] for item in no_source_moves).items())),
        "variantCount": report["variantCount"],
        "resolvedVariants": resolved_variants,
        "unresolvedVariants": unresolved_variants,
        "unresolvedTotal": unresolved_variants + len(no_source_moves),
        "blockerCounts": dict(sorted(Counter(item["blockerClass"] for item in gaps).items())),
        "fightersWithBlockers": len(fighters),
        "fighters": fighters,
        "movesWithoutVisuals": no_source_moves,
    }
    JSON_OUT.write_text(json.dumps(audit, indent=2) + "\n", encoding="utf-8")

    lines = [
        "# Visual Coverage Audit",
        "",
        f"- Frame-data moves: **{audit['totalFrameDataMoves']}**",
        f"- Moves with discovered source visuals: **{audit['mappedSourceVisualMoves']}**",
        f"- Moves with any source/reviewed visual: **{audit['mappedVisualMoves']}**",
        f"- Reviewed local captures: **{audit['reviewedCaptureCount']}**",
        f"- Moves with no visual: **{audit['movesWithoutSourceVisual']}**",
        f"- Source variants: **{audit['variantCount']}**",
        f"- Resolved source/reviewed variants: **{audit['resolvedVariants']}**",
        f"- Unresolved source variants: **{audit['unresolvedVariants']}**",
        f"- Total unresolved move/variant blockers: **{audit['unresolvedTotal']}**",
        f"- Fighters with blockers: **{audit['fightersWithBlockers']}**",
        "",
        "This file is generated. A listed item is a source/timing blocker, not permission to invent a mapping or image.",
        "",
    ]
    for fighter_id, fighter in fighters.items():
        lines.extend([f"## {fighter_id}", ""])
        for row in fighter["movesWithoutVisuals"]:
            lines.append(f"- **{row['moveLabel']}** — `{row['category']}` / no-source-visual: {row['reason']}")
        seen_moves: set[str] = set()
        for gap in fighter["variants"]:
            move = gap["moveLabel"]
            if move not in seen_moves:
                lines.append(f"- **{move}**")
                seen_moves.add(move)
            lines.append(f"  - `{gap['variantLabel']}` — {gap['timelineClass']} / {gap['blockerClass']}: {gap['reason']}")
        lines.append("")
    MD_OUT.write_text("\n".join(lines).rstrip() + "\n", encoding="utf-8")
    print(
        f"audit: {audit['resolvedVariants']}/{audit['variantCount']} source/reviewed variants resolved; "
        f"{audit['unresolvedVariants']} source variants + {audit['movesWithoutSourceVisual']} source-less moves unresolved"
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
