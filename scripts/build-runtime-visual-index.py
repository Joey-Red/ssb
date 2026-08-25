#!/usr/bin/env python3
"""Build compact same-origin runtime visual indexes, one JSON file per fighter.

Reviewed local captures can replace a discovered source variant or supply a move
that has no discovered source visual. Capture assets are persistent, provenance-
backed same-origin sprite sheets; they are never synthesized by this builder.
"""
from __future__ import annotations

import json
import shutil
from pathlib import Path
from typing import Any

ROOT = Path(__file__).resolve().parents[1]
SOURCES = ROOT / "src/data/visualMediaSources.json"
ASSETS = ROOT / "src/data/visualMediaAssets.generated.json"
OVERRIDES = ROOT / "src/data/visualTimelineOverrides.json"
FRAME_DATA = ROOT / "src/data/frameData.generated.json"
PUBLIC = ROOT / "public"
OUTPUT = PUBLIC / "data/visual-media"


def reviewed_variant(variant_id: str, label: str, override: dict[str, Any]) -> dict[str, Any]:
    capture = override.get("reviewedCapture")
    if not isinstance(capture, dict):
        raise SystemExit("reviewed capture override is missing reviewedCapture metadata")
    for required in ("src", "frameCount", "frameNumbers"):
        if required not in capture:
            raise SystemExit(f"reviewed capture is missing {required}")
    src = str(capture["src"])
    if src.startswith(("http://", "https://", "//")) or ".." in Path(src).parts:
        raise SystemExit(f"unsafe reviewed capture path: {src}")
    if not (PUBLIC / src.lstrip("/")).exists():
        raise SystemExit(f"reviewed capture asset is missing: {src}")
    total = int(override.get("totalFrames") or capture["frameCount"])
    if total <= 0 or int(capture["frameCount"]) != total:
        raise SystemExit(f"reviewed capture frame count mismatch: {variant_id}")
    return {
        "id": variant_id,
        "label": label,
        "spriteSheet": capture,
        "coverage": "full",
        "coverageReason": "reviewed local one-game-frame-at-a-time capture covers the complete represented timeline",
        "sourceFrameCount": total,
        "sourceDurationMs": round(total * (1000 / 60), 3),
        "timelineClass": override.get("timelineClass", "fighter-action"),
        "timelineTotalFrames": total,
        "timingBasis": "parent-action" if override.get("timelineClass", "fighter-action") == "fighter-action" else "independent-source",
        "timelineBasis": "reviewed-local-frame-capture",
        "mappingMethod": "reviewed-local-frame-capture",
        "sourceFormat": "reviewed-capture",
        "interactionEvidence": "reviewed-capture",
        "reviewedOverride": {
            "sourceUrl": override.get("sourceUrl") or "local-reviewed-capture",
            "provenanceNote": override["provenanceNote"],
        },
    }


def main() -> int:
    source = json.loads(SOURCES.read_text(encoding="utf-8"))
    assets = json.loads(ASSETS.read_text(encoding="utf-8"))
    overrides = json.loads(OVERRIDES.read_text(encoding="utf-8"))
    frame_data = json.loads(FRAME_DATA.read_text(encoding="utf-8"))
    if source.get("version") != 3 or assets.get("version") != 3 or overrides.get("version") != 1:
        raise SystemExit("visual source/assets/override schema mismatch")

    shutil.rmtree(OUTPUT, ignore_errors=True)
    OUTPUT.mkdir(parents=True, exist_ok=True)
    grouped: dict[str, list[dict[str, Any]]] = {}
    consumed_capture_keys: set[str] = set()

    for move in source["moves"]:
        key = f"{move['fighterId']}:{move['moveId']}"
        staged = assets["moves"].get(key)
        if not staged or not staged.get("variants"):
            raise SystemExit(f"missing staged runtime visual variants for {key}")
        variants: list[dict[str, Any]] = []
        for staged_variant in staged["variants"]:
            variant = dict(staged_variant)
            override_key = f"{key}:{variant['id']}"
            override = overrides.get("entries", {}).get(override_key)
            if isinstance(override, dict) and isinstance(override.get("reviewedCapture"), dict):
                variant = reviewed_variant(variant["id"], variant.get("label") or variant["id"], override)
                consumed_capture_keys.add(override_key)
            variants.append(variant)

        active_span = move.get("activeSpan") or []
        fallback_total = (active_span[1] if len(active_span) == 2 else None) or move.get("startupFrame") or 1
        record = {
            "id": f"{move['fighterId']}-{move['moveId']}-ufd",
            "fighterId": move["fighterId"],
            "moveId": move["moveId"],
            "label": move["label"],
            "sourceUrl": move["sourceUrl"],
            "totalFrames": move.get("totalFrames") or fallback_total,
            "frames": [],
            "variants": variants,
        }
        grouped.setdefault(move["fighterId"], []).append(record)

    # Add reviewed captures for frame-data moves that had no discovered source.
    source_move_keys = {(move["fighterId"], move["moveId"]) for move in source["moves"]}
    for override_key, override in sorted(overrides.get("entries", {}).items()):
        if override_key in consumed_capture_keys or not isinstance(override, dict) or not isinstance(override.get("reviewedCapture"), dict):
            continue
        parts = override_key.split(":", 2)
        if len(parts) != 3:
            raise SystemExit(f"invalid visual override key: {override_key}")
        fighter_id, move_id, variant_id = parts
        if (fighter_id, move_id) in source_move_keys:
            raise SystemExit(f"reviewed capture variant does not match a discovered variant: {override_key}")
        fighter = frame_data.get("fighters", {}).get(fighter_id)
        if not fighter:
            raise SystemExit(f"reviewed capture fighter is not in frame data: {fighter_id}")
        move = next((item for item in fighter.get("moves", []) if item.get("id") == move_id), None)
        if not move:
            raise SystemExit(f"reviewed capture move is not in frame data: {fighter_id}:{move_id}")
        variant = reviewed_variant(variant_id, "Reviewed full-move capture", override)
        grouped.setdefault(fighter_id, []).append({
            "id": f"{fighter_id}-{move_id}-reviewed",
            "fighterId": fighter_id,
            "moveId": move_id,
            "label": f"{fighter.get('name') or fighter_id} {move.get('name') or move_id}",
            "sourceUrl": override.get("sourceUrl") or fighter.get("sourceUrl") or "local-reviewed-capture",
            "totalFrames": int(override.get("totalFrames") or variant["timelineTotalFrames"]),
            "frames": [],
            "variants": [variant],
        })
        consumed_capture_keys.add(override_key)

    unconsumed = {
        key for key, value in overrides.get("entries", {}).items()
        if isinstance(value, dict) and isinstance(value.get("reviewedCapture"), dict) and key not in consumed_capture_keys
    }
    if unconsumed:
        raise SystemExit("unconsumed reviewed captures: " + ", ".join(sorted(unconsumed)))
    if len(grouped) != 89:
        raise SystemExit(f"expected runtime indexes for 89 fighters, found {len(grouped)}")

    total_bytes = 0
    for fighter_id, moves in grouped.items():
        moves.sort(key=lambda item: item["moveId"])
        payload = json.dumps({"version": 1, "fighterId": fighter_id, "moves": moves}, separators=(",", ":")) + "\n"
        path = OUTPUT / f"{fighter_id}.json"
        path.write_text(payload, encoding="utf-8")
        total_bytes += path.stat().st_size

    print(
        f"wrote {len(grouped)} fighter visual indexes / {sum(len(moves) for moves in grouped.values())} moves / "
        f"{len(consumed_capture_keys)} reviewed captures / {total_bytes / 1024:.1f} KiB"
    )
    if total_bytes > 16 * 1024 * 1024:
        raise SystemExit(f"runtime visual indexes unexpectedly large: {total_bytes / 1024 / 1024:.1f} MiB")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
