#!/usr/bin/env python3
"""Give every still-source-less frame-data move an illustrative runtime timeline.

This is deliberately NOT an exact-coverage generator. It creates frame-by-frame
phase metadata that lets the existing viewer show documented startup, active,
intangible, recovery, or other timing instead of a blank visual card.
No character pose, hitbox, hurtbox, or collision geometry is invented.

Synthetic timing schematics are written only to runtime fighter indexes and a
separate report. They never enter visualMediaSources, reviewed captures, or the
coverage audit, so they can never satisfy source-backed/exact CI requirements.
"""
from __future__ import annotations

import json
import re
import subprocess
import sys
from collections import Counter
from pathlib import Path
from typing import Any

ROOT = Path(__file__).resolve().parents[1]
AUDIT = ROOT / "src/data/visualCoverageAudit.generated.json"
FRAME_DATA = ROOT / "src/data/frameData.generated.json"
DEFENSE_TIMING = ROOT / "src/data/visualDefenseTiming.generated.json"
RUNTIME_DIR = ROOT / "public/data/visual-media"
OUTPUT = ROOT / "src/data/visualSyntheticFallbacks.generated.json"
DEFENSE_TIMING_BUILDER = ROOT / "scripts/build-defense-timing-evidence.py"
PHASE_SHEET_BUILDER = ROOT / "scripts/build-synthetic-phase-sheets.py"


def numbers(value: Any) -> list[int]:
    return [int(item) for item in re.findall(r"\d+", str(value or "")) if int(item) > 0]


def timeline_total(move: dict[str, Any]) -> int:
    totals = numbers(move.get("totalFrames"))
    if totals:
        return max(totals)
    active = numbers(move.get("active"))
    startup = numbers(move.get("startup"))
    if active:
        return max(active)
    if startup:
        return max(startup)
    return 1


def active_span(move: dict[str, Any]) -> tuple[int | None, int | None]:
    values = numbers(move.get("active"))
    if values:
        return values[0], max(values)
    return None, None


def defense_evidence(
    defense_timing: dict[str, Any], fighter_id: str, move_id: str
) -> tuple[int | None, int | None, int | None]:
    entry = defense_timing.get("entries", {}).get(f"{fighter_id}:{move_id}")
    if not isinstance(entry, dict):
        return None, None, None
    start = entry.get("startFrame")
    end = entry.get("endFrame")
    total = entry.get("totalFrames")
    if not isinstance(start, int) or not isinstance(end, int) or start <= 0 or end < start:
        raise SystemExit(f"invalid structured intangibility evidence for {fighter_id}:{move_id}")
    if total is not None and (not isinstance(total, int) or total <= 0 or end > total):
        raise SystemExit(f"invalid structured total-frame evidence for {fighter_id}:{move_id}")
    return start, end, total


def phase_for(
    frame: int,
    active_start: int | None,
    active_end: int | None,
    intangible_start: int | None,
    intangible_end: int | None,
) -> str:
    if intangible_start is not None and intangible_end is not None:
        if frame < intangible_start:
            return "startup"
        if frame <= intangible_end:
            return "intangible"
        return "recovery"
    if active_start is None or active_end is None:
        return "other"
    if frame < active_start:
        return "startup"
    if frame <= active_end:
        return "active"
    return "recovery"


def main() -> int:
    # Keep structured defense timing fresh wherever synthetic runtime visuals are
    # rebuilt. This is build-time maintenance only; the deployed site stays fully
    # same-origin and never calls UFD or its maintenance mirror at runtime.
    subprocess.run([sys.executable, str(DEFENSE_TIMING_BUILDER)], check=True)

    audit = json.loads(AUDIT.read_text(encoding="utf-8"))
    frame_data = json.loads(FRAME_DATA.read_text(encoding="utf-8"))
    defense_timing = json.loads(DEFENSE_TIMING.read_text(encoding="utf-8"))
    if audit.get("version") != 2:
        raise SystemExit("visual coverage audit must be version 2")
    if defense_timing.get("version") != 1:
        raise SystemExit("defense timing evidence must be version 1")

    grouped_missing: dict[str, list[dict[str, Any]]] = {}
    for row in audit.get("movesWithoutVisuals", []):
        grouped_missing.setdefault(row["fighterId"], []).append(row)

    generated: list[dict[str, Any]] = []
    category_counts: Counter[str] = Counter()
    phase_counts: Counter[str] = Counter()
    defense_with_intangibility = 0
    defense_using_registry_total = 0
    for fighter_id, missing in sorted(grouped_missing.items()):
        runtime_path = RUNTIME_DIR / f"{fighter_id}.json"
        if not runtime_path.exists():
            raise SystemExit(f"runtime visual index is missing for {fighter_id}")
        runtime = json.loads(runtime_path.read_text(encoding="utf-8"))
        moves = {move["moveId"]: move for move in runtime.get("moves", [])}
        fighter = frame_data.get("fighters", {}).get(fighter_id)
        if not fighter:
            raise SystemExit(f"frame data missing fighter {fighter_id}")
        frame_moves = {move["id"]: move for move in fighter.get("moves", [])}

        for missing_move in missing:
            move_id = missing_move["moveId"]
            if move_id in moves:
                continue
            move = frame_moves.get(move_id)
            if not move:
                raise SystemExit(f"frame data missing move {fighter_id}:{move_id}")
            frame_total = timeline_total(move)
            active_start, active_end = active_span(move)
            intangible_start, intangible_end, evidence_total = defense_evidence(defense_timing, fighter_id, move_id)
            total = max(frame_total, evidence_total or 0, intangible_end or 0)
            if total <= 0:
                total = 1
            if evidence_total is not None and evidence_total > frame_total:
                defense_using_registry_total += 1
            if intangible_start is not None and intangible_end is not None:
                defense_with_intangibility += 1
            frames = []
            for frame in range(1, total + 1):
                phase = phase_for(frame, active_start, active_end, intangible_start, intangible_end)
                phase_counts[phase] += 1
                if phase == "intangible":
                    caption = "Illustrative timing schematic — UFD documents this frame inside the move's intangible span; fighter pose is not source-backed."
                else:
                    caption = "Illustrative timing schematic only — fighter pose and collision geometry are not source-backed for this frame."
                frames.append({
                    "frame": frame,
                    "phase": phase,
                    "caption": caption,
                })
            record = {
                "id": f"{fighter_id}-{move_id}-synthetic-timing",
                "fighterId": fighter_id,
                "moveId": move_id,
                "label": f"{fighter.get('name') or fighter_id} {move.get('name') or move_id}",
                "sourceUrl": fighter.get("sourceUrl") or missing_move.get("sourceUrl") or "https://ultimateframedata.com/smash",
                "totalFrames": total,
                "frames": frames,
                "variants": [{
                    "id": "illustrative-timing-schematic",
                    "label": "Illustrative timing schematic",
                    "coverage": "static",
                    "coverageReason": "No verified moving source is available. This generated fallback visualizes documented timing phases with a locally vendored fighter render; it does not invent gameplay poses or hitboxes and is excluded from exact coverage.",
                    "timelineClass": "fighter-action",
                    "timelineTotalFrames": total,
                    "timingBasis": "parent-action",
                    "timelineBasis": "documented-frame-data-and-structured-ufd-defense-timing-illustration",
                    "mappingMethod": "synthetic-phase-schematic-not-source-evidence",
                    "sourceFormat": "synthetic-illustrative",
                }],
            }
            runtime["moves"].append(record)
            moves[move_id] = record
            category = str(move.get("category") or "unknown")
            category_counts[category] += 1
            generated.append({
                "fighterId": fighter_id,
                "moveId": move_id,
                "moveLabel": record["label"],
                "category": category,
                "timelineTotalFrames": total,
                "frameDataTimelineTotalFrames": frame_total,
                "defenseRegistryTotalFrames": evidence_total,
                "intangibleStart": intangible_start,
                "intangibleEnd": intangible_end,
                "sourceEvidence": False,
                "eligibleForExactCoverage": False,
                "replacementQueueKey": f"{fighter_id}:{move_id}:manual-full-move",
            })

        runtime["moves"].sort(key=lambda item: item["moveId"])
        runtime_path.write_text(json.dumps(runtime, separators=(",", ":")) + "\n", encoding="utf-8")

    payload = {
        "version": 2,
        "fallbackCount": len(generated),
        "categoryCounts": dict(sorted(category_counts.items())),
        "phaseFrameCounts": dict(sorted(phase_counts.items())),
        "defenseRowsWithDocumentedIntangibility": defense_with_intangibility,
        "defenseRowsUsingRegistryTotalFrames": defense_using_registry_total,
        "defenseTimingRegistryRows": int(defense_timing.get("documentedIntangibilityRows") or 0),
        "policy": {
            "sourceEvidence": False,
            "eligibleForExactCoverage": False,
            "purpose": "complete local frame-by-frame visual-player coverage while preserving the distinction between sourced gameplay media and documented timing schematics",
            "mustBeReplacedByForSourceCoverage": "verified external source or reviewed deterministic local capture",
            "defenseTimingSource": "structured UFD facts extracted at build time; no source prose bundled and no runtime network dependency",
        },
        "fallbacks": generated,
    }
    OUTPUT.write_text(json.dumps(payload, indent=2) + "\n", encoding="utf-8")
    print(
        f"synthetic timing fallbacks: {len(generated)} source-less moves; "
        f"{defense_with_intangibility} schematic rows use documented intangible timing; "
        f"{defense_using_registry_total} rows use the structured defense total-frame value"
    )

    # Every caller gets the same local seekable schematic assets; future vendor
    # refreshes therefore cannot silently regress to blank/static cards.
    subprocess.run([sys.executable, str(PHASE_SHEET_BUILDER)], check=True)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
