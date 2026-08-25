#!/usr/bin/env python3
"""Give every still-source-less frame-data move an illustrative runtime timeline.

This is deliberately NOT an exact-coverage generator. It creates frame-by-frame
phase metadata that lets the existing viewer show the official fighter render,
frame number, and startup/active/recovery state instead of a blank visual card.
No character pose, hitbox, hurtbox, or collision geometry is invented.

Synthetic timing schematics are written only to runtime fighter indexes and a
separate report. They never enter visualMediaSources, reviewed captures, or the
coverage audit, so they can never satisfy source-backed/exact CI requirements.
"""
from __future__ import annotations

import json
import re
from collections import Counter
from pathlib import Path
from typing import Any

ROOT = Path(__file__).resolve().parents[1]
AUDIT = ROOT / "src/data/visualCoverageAudit.generated.json"
FRAME_DATA = ROOT / "src/data/frameData.generated.json"
RUNTIME_DIR = ROOT / "public/data/visual-media"
OUTPUT = ROOT / "src/data/visualSyntheticFallbacks.generated.json"


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


def phase_for(frame: int, start: int | None, end: int | None) -> str:
    if start is None or end is None:
        return "other"
    if frame < start:
        return "startup"
    if frame <= end:
        return "active"
    return "recovery"


def main() -> int:
    audit = json.loads(AUDIT.read_text(encoding="utf-8"))
    frame_data = json.loads(FRAME_DATA.read_text(encoding="utf-8"))
    if audit.get("version") != 2:
        raise SystemExit("visual coverage audit must be version 2")

    grouped_missing: dict[str, list[dict[str, Any]]] = {}
    for row in audit.get("movesWithoutVisuals", []):
        grouped_missing.setdefault(row["fighterId"], []).append(row)

    generated: list[dict[str, Any]] = []
    category_counts: Counter[str] = Counter()
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
            total = timeline_total(move)
            active_start, active_end = active_span(move)
            frames = []
            for frame in range(1, total + 1):
                phase = phase_for(frame, active_start, active_end)
                frames.append({
                    "frame": frame,
                    "phase": phase,
                    "caption": "Illustrative timing schematic only — fighter pose and collision geometry are not source-backed for this frame.",
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
                    "coverageReason": "No verified moving source is available yet. This generated fallback shows documented timing phases with the official fighter render only; it does not invent poses or hitboxes and is excluded from exact coverage.",
                    "timelineClass": "fighter-action",
                    "timelineTotalFrames": total,
                    "timingBasis": "parent-action",
                    "timelineBasis": "documented-frame-data-illustration",
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
                "sourceEvidence": False,
                "eligibleForExactCoverage": False,
                "replacementQueueKey": f"{fighter_id}:{move_id}:manual-full-move",
            })

        runtime["moves"].sort(key=lambda item: item["moveId"])
        runtime_path.write_text(json.dumps(runtime, separators=(",", ":")) + "\n", encoding="utf-8")

    payload = {
        "version": 1,
        "fallbackCount": len(generated),
        "categoryCounts": dict(sorted(category_counts.items())),
        "policy": {
            "sourceEvidence": False,
            "eligibleForExactCoverage": False,
            "purpose": "temporary frame-by-frame timing visualization while verified source/capture work remains queued",
            "mustBeReplacedBy": "verified external source or reviewed deterministic local capture",
        },
        "fallbacks": generated,
    }
    OUTPUT.write_text(json.dumps(payload, indent=2) + "\n", encoding="utf-8")
    print(f"synthetic timing fallbacks: {len(generated)} source-less moves now have illustrative runtime timelines")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
