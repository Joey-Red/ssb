#!/usr/bin/env python3
"""Add runtime-only real-source fallbacks for source-less move substates.

Some frame-data rows split a move into states that public visual sources expose
only as a parent action (full charge, air version, success state, cancel, etc.).
For study usability, this script may reuse an already-vendored same-fighter
runtime visual when the normalized move family is clearly related.

These aliases exist ONLY in public runtime indexes. They never enter
visualMediaSources, the factual coverage audit, or the capture queue and thus
cannot claim exact coverage for the missing row.
"""
from __future__ import annotations

import json
import re
from collections import Counter
from copy import deepcopy
from pathlib import Path
from typing import Any

ROOT = Path(__file__).resolve().parents[1]
AUDIT = ROOT / "src/data/visualCoverageAudit.generated.json"
FRAME_DATA = ROOT / "src/data/frameData.generated.json"
SOURCES = ROOT / "src/data/visualMediaSources.json"
RUNTIME_DIR = ROOT / "public/data/visual-media"
REPORT = ROOT / "src/data/visualRelatedSourceFallbacks.generated.json"
GAME_FRAME_MS = 1000.0 / 60.0

STOPWORDS = {
    "air", "aerial", "ground", "grounded", "fully", "full", "charged", "charge",
    "success", "mashing", "input", "non", "activated", "activation", "jump",
    "cancel", "macro", "short", "first", "second", "combo", "early", "late",
    "minimum", "maximum", "max", "min", "level", "hold", "holding", "release",
    "version", "variant", "hit", "hits", "state",
}
BUTTON_WORDS = {"neutral", "side", "up", "down", "special", "b"}


def normalized(value: str) -> str:
    value = value.lower().replace("&", " and ")
    value = value.replace("f.l.u.d.d.", "fludd").replace("f.l.u.d.d", "fludd")
    value = re.sub(r"[^a-z0-9]+", " ", value)
    return " ".join(value.split())


def significant_tokens(value: str) -> set[str]:
    tokens = set(normalized(value).split())
    return {
        token for token in tokens
        if token not in STOPWORDS and token not in BUTTON_WORDS and not token.isdigit()
    }


def button_family(value: str) -> str | None:
    text = normalized(value)
    for direction in ("neutral", "side", "up", "down"):
        if re.search(rf"\b{direction}\s+(?:b|special)\b", text):
            return direction
    return None


def relation_score(missing_name: str, candidate_name: str) -> int:
    missing = significant_tokens(missing_name)
    candidate = significant_tokens(candidate_name)
    if not missing or not candidate:
        return -1
    overlap = missing & candidate
    if not overlap:
        return -1

    missing_button = button_family(missing_name)
    candidate_button = button_family(candidate_name)
    if missing_button and candidate_button and missing_button != candidate_button:
        return -1

    if missing == candidate:
        score = 100
    elif missing <= candidate or candidate <= missing:
        score = 70 + min(len(overlap), 4) * 5
    else:
        union = missing | candidate
        ratio = len(overlap) / len(union)
        if ratio < 0.6:
            return -1
        score = 40 + round(ratio * 20)

    if missing_button and candidate_button and missing_button == candidate_button:
        score += 15
    score -= abs(len(missing) - len(candidate)) * 2
    return score


def source_timeline_frames(variant: dict[str, Any]) -> int:
    existing = variant.get("timelineTotalFrames")
    if isinstance(existing, int) and existing > 0:
        return existing
    duration = variant.get("sourceDurationMs")
    if isinstance(duration, (int, float)) and duration > 0:
        return max(1, round(float(duration) / GAME_FRAME_MS))
    sheet = variant.get("spriteSheet")
    if isinstance(sheet, dict):
        cells = sheet.get("gameFrameCells")
        if isinstance(cells, list) and cells:
            return len(cells)
        count = sheet.get("frameCount")
        if isinstance(count, int) and count > 0:
            return count
    return 1


def usable_variant(variant: dict[str, Any]) -> bool:
    return isinstance(variant.get("spriteSheet"), dict) or bool(variant.get("imageSrc"))


def fallback_variant(source_variant: dict[str, Any], source_label: str) -> dict[str, Any]:
    variant = deepcopy(source_variant)
    original_coverage = str(variant.get("coverage") or "unknown")
    original_timeline = str(variant.get("timelineClass") or "fighter-action")
    variant["id"] = f"related-source-{variant['id']}"
    variant["label"] = f"Related source: {source_label} · {variant.get('label') or source_variant['id']}"
    variant["coverage"] = "partial"
    variant["coverageReason"] = (
        f"Runtime-only related-source reference from {source_label}; this media is real and locally vendored, "
        "but it is not evidence that the missing substate has identical animation or SSBU-frame timing."
    )
    variant["timelineClass"] = "source-animation" if variant.get("spriteSheet") else original_timeline
    variant["timingBasis"] = "independent-source"
    variant["timelineTotalFrames"] = source_timeline_frames(variant)
    variant["timelineBasis"] = "related-locally-vendored-source-display-only"
    variant["mappingMethod"] = "runtime-related-source-alias-not-coverage-evidence"
    variant["relatedSourceOriginalCoverage"] = original_coverage
    variant["relatedSourceOriginalTimelineClass"] = original_timeline
    variant.pop("animationSrc", None)
    return variant


def main() -> int:
    audit = json.loads(AUDIT.read_text(encoding="utf-8"))
    frame_data = json.loads(FRAME_DATA.read_text(encoding="utf-8"))
    sources = json.loads(SOURCES.read_text(encoding="utf-8"))
    if audit.get("version") != 2 or sources.get("version") != 3:
        raise SystemExit("visual audit/source schema mismatch")

    source_moves_by_fighter: dict[str, list[dict[str, Any]]] = {}
    for source_move in sources.get("moves", []):
        source_moves_by_fighter.setdefault(source_move["fighterId"], []).append(source_move)

    generated: list[dict[str, Any]] = []
    category_counts: Counter[str] = Counter()
    missing_by_fighter: dict[str, list[dict[str, Any]]] = {}
    for row in audit.get("movesWithoutVisuals", []):
        missing_by_fighter.setdefault(row["fighterId"], []).append(row)

    for fighter_id, rows in sorted(missing_by_fighter.items()):
        runtime_path = RUNTIME_DIR / f"{fighter_id}.json"
        if not runtime_path.exists():
            raise SystemExit(f"runtime visual index missing for {fighter_id}")
        runtime = json.loads(runtime_path.read_text(encoding="utf-8"))
        runtime_by_id = {move["moveId"]: move for move in runtime.get("moves", [])}
        runtime_ids = set(runtime_by_id)
        fighter = frame_data.get("fighters", {}).get(fighter_id)
        if not fighter:
            raise SystemExit(f"frame data missing fighter {fighter_id}")
        frame_moves = {move["id"]: move for move in fighter.get("moves", [])}

        candidates: list[dict[str, Any]] = []
        for source_move in source_moves_by_fighter.get(fighter_id, []):
            runtime_source = runtime_by_id.get(source_move["moveId"])
            if not runtime_source:
                continue
            variants = [variant for variant in runtime_source.get("variants", []) if usable_variant(variant)]
            if not variants:
                continue
            candidates.append({"source": source_move, "runtime": runtime_source, "variants": variants})

        for row in rows:
            move_id = row["moveId"]
            if move_id in runtime_ids:
                continue
            move = frame_moves.get(move_id)
            if not move:
                continue
            category = str(move.get("category") or "unknown")
            if category == "defense":
                # UFD publishes timing for these rows but no linked dodge/roll
                # animation assets. Do not substitute unrelated media.
                continue

            scored: list[tuple[int, dict[str, Any]]] = []
            for candidate in candidates:
                source_label = str(candidate["source"].get("label") or candidate["runtime"].get("label") or "")
                score = relation_score(str(move.get("name") or move_id), source_label)
                if score >= 70:
                    scored.append((score, candidate))
            if not scored:
                continue
            scored.sort(key=lambda item: (-item[0], len(significant_tokens(str(item[1]["source"].get("label") or "")))))
            best_score, best = scored[0]
            if len(scored) > 1 and scored[1][0] == best_score:
                continue

            source_move = best["source"]
            source_label = str(source_move.get("label") or best["runtime"].get("label") or source_move["moveId"])
            variants = [fallback_variant(variant, source_label) for variant in best["variants"]]
            if not variants:
                continue
            total = max(source_timeline_frames(variant) for variant in variants)
            record = {
                "id": f"{fighter_id}-{move_id}-related-source-display",
                "fighterId": fighter_id,
                "moveId": move_id,
                "label": f"{fighter.get('name') or fighter_id} {move.get('name') or move_id}",
                "sourceUrl": source_move.get("sourceUrl") or fighter.get("sourceUrl") or "https://ultimateframedata.com/smash",
                "totalFrames": total,
                "frames": [],
                "variants": variants,
            }
            runtime["moves"].append(record)
            runtime_ids.add(move_id)
            category_counts[category] += 1
            generated.append({
                "fighterId": fighter_id,
                "moveId": move_id,
                "moveLabel": record["label"],
                "category": category,
                "relatedSourceMoveId": source_move["moveId"],
                "relatedSourceLabel": source_label,
                "score": best_score,
                "variantCount": len(variants),
                "sourceEvidenceForTarget": False,
                "eligibleForExactCoverage": False,
            })

        runtime["moves"].sort(key=lambda item: item["moveId"])
        runtime_path.write_text(json.dumps(runtime, separators=(",", ":")) + "\n", encoding="utf-8")

    report = {
        "version": 1,
        "fallbackCount": len(generated),
        "categoryCounts": dict(sorted(category_counts.items())),
        "policy": {
            "runtimeOnly": True,
            "sourceEvidenceForTarget": False,
            "eligibleForExactCoverage": False,
            "runtimeAssets": "same-origin existing vendored source media",
        },
        "fallbacks": generated,
    }
    REPORT.write_text(json.dumps(report, indent=2) + "\n", encoding="utf-8")
    print(f"related-source runtime fallbacks: {len(generated)} moves ({dict(sorted(category_counts.items()))})")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
