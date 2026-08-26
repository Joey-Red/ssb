#!/usr/bin/env python3
"""Hard runtime completeness gate for the SSBU move visual library.

This audit is intentionally separate from factual/source-backed coverage. A move
passes runtime completion when the site can render at least one fully local
visual mode for it: exact/source media, a locally vendored source-animation
fallback, a clearly related-source display fallback, or an explicitly schematic
timing animation. Synthetic/related fallbacks never become factual source proof.
"""
from __future__ import annotations

import json
from collections import Counter
from pathlib import Path
from typing import Any

ROOT = Path(__file__).resolve().parents[1]
FRAME_DATA = ROOT / "src/data/frameData.generated.json"
SOURCES = ROOT / "src/data/visualMediaSources.json"
RELATED = ROOT / "src/data/visualRelatedSourceFallbacks.generated.json"
SYNTHETIC = ROOT / "src/data/visualSyntheticFallbacks.generated.json"
RUNTIME_DIR = ROOT / "public/data/visual-media"
PUBLIC = ROOT / "public"
OUTPUT = ROOT / "src/data/runtimeVisualCompletion.generated.json"
DOC = ROOT / "docs/RUNTIME_VISUAL_COMPLETION.generated.md"
EXPECTED_FIGHTERS = 89
EXPECTED_MOVES = 3588


def local_asset(path: str) -> Path:
    if path.startswith(("http://", "https://", "//")):
        raise SystemExit(f"runtime media must be local, found remote asset: {path}")
    candidate = PUBLIC / path.lstrip("/")
    if not candidate.exists():
        raise SystemExit(f"runtime media asset is missing: {path}")
    return candidate


def variant_playable(variant: dict[str, Any]) -> bool:
    sheet = variant.get("spriteSheet")
    if isinstance(sheet, dict) and sheet.get("src"):
        local_asset(str(sheet["src"]))
        frame_count = int(sheet.get("frameCount") or 0)
        if frame_count <= 0:
            raise SystemExit(f"invalid sprite-sheet frame count: {sheet.get('src')}")
        cells = sheet.get("gameFrameCells")
        if cells is not None and not all(isinstance(cell, int) and 0 <= cell < frame_count for cell in cells):
            raise SystemExit(f"invalid sprite-sheet cell mapping: {sheet.get('src')}")
        return True
    for field in ("animationSrc", "imageSrc"):
        value = variant.get(field)
        if value:
            local_asset(str(value))
            return True
    return False


def main() -> int:
    frame_data = json.loads(FRAME_DATA.read_text(encoding="utf-8"))
    sources = json.loads(SOURCES.read_text(encoding="utf-8"))
    related = json.loads(RELATED.read_text(encoding="utf-8"))
    synthetic = json.loads(SYNTHETIC.read_text(encoding="utf-8"))
    fighters = frame_data.get("fighters", {})
    if len(fighters) != EXPECTED_FIGHTERS:
        raise SystemExit(f"expected {EXPECTED_FIGHTERS} fighters, found {len(fighters)}")

    frame_keys = {
        (fighter_id, move["id"])
        for fighter_id, fighter in fighters.items()
        for move in fighter.get("moves", [])
    }
    if len(frame_keys) != EXPECTED_MOVES:
        raise SystemExit(f"expected {EXPECTED_MOVES} frame-data moves, found {len(frame_keys)}")

    source_keys = {(move["fighterId"], move["moveId"]) for move in sources.get("moves", [])}
    related_keys = {(row["fighterId"], row["moveId"]) for row in related.get("fallbacks", [])}
    synthetic_keys = {(row["fighterId"], row["moveId"]) for row in synthetic.get("fallbacks", [])}

    runtime_keys: set[tuple[str, str]] = set()
    blank_moves: list[str] = []
    duplicate_moves: list[str] = []
    mode_counts: Counter[str] = Counter()
    synthetic_players = 0
    intangible_synthetic_moves = 0
    remote_runtime_media = 0

    files = sorted(RUNTIME_DIR.glob("*.json"))
    if len(files) != EXPECTED_FIGHTERS:
        raise SystemExit(f"expected {EXPECTED_FIGHTERS} runtime fighter indexes, found {len(files)}")

    for path in files:
        payload = json.loads(path.read_text(encoding="utf-8"))
        fighter_id = payload.get("fighterId")
        seen: set[str] = set()
        for move in payload.get("moves", []):
            move_id = str(move.get("moveId") or "")
            key = (str(fighter_id), move_id)
            if move_id in seen:
                duplicate_moves.append(f"{fighter_id}:{move_id}")
            seen.add(move_id)
            runtime_keys.add(key)
            variants = move.get("variants") or []
            playable = False
            move_modes: set[str] = set()
            for variant in variants:
                try:
                    is_playable = variant_playable(variant)
                except SystemExit as exc:
                    if "remote asset" in str(exc):
                        remote_runtime_media += 1
                    raise
                playable = playable or is_playable
                source_format = str(variant.get("sourceFormat") or "")
                mapping = str(variant.get("mappingMethod") or "")
                timeline = str(variant.get("timelineClass") or "")
                if source_format == "synthetic-illustrative":
                    move_modes.add("schematic")
                    synthetic_players += 1
                    sheet = variant.get("spriteSheet")
                    if not isinstance(sheet, dict):
                        raise SystemExit(f"synthetic move is not seekable: {fighter_id}:{move_id}")
                    expected_total = int(variant.get("timelineTotalFrames") or move.get("totalFrames") or 0)
                    cells = sheet.get("gameFrameCells") or []
                    if len(cells) != expected_total:
                        raise SystemExit(
                            f"synthetic timeline mapping mismatch {fighter_id}:{move_id}: {len(cells)} != {expected_total}"
                        )
                    if any(frame.get("phase") == "intangible" for frame in move.get("frames", [])):
                        intangible_synthetic_moves += 1
                elif mapping == "runtime-related-source-alias-not-coverage-evidence":
                    move_modes.add("related-source")
                elif timeline == "source-animation":
                    move_modes.add("source-animation")
                else:
                    move_modes.add("source-backed")
            if not playable:
                blank_moves.append(f"{fighter_id}:{move_id}")
            for mode in move_modes:
                mode_counts[mode] += 1

    missing_runtime = sorted(frame_keys - runtime_keys)
    unexpected_runtime = sorted(runtime_keys - frame_keys)
    if duplicate_moves:
        raise SystemExit("duplicate runtime moves: " + ", ".join(duplicate_moves[:20]))
    if missing_runtime:
        raise SystemExit("frame-data moves missing runtime visuals: " + ", ".join(f"{a}:{b}" for a, b in missing_runtime[:20]))
    if unexpected_runtime:
        raise SystemExit("runtime moves not in frame data: " + ", ".join(f"{a}:{b}" for a, b in unexpected_runtime[:20]))
    if blank_moves:
        raise SystemExit("runtime moves without local playable media: " + ", ".join(blank_moves[:20]))
    if len(runtime_keys) != EXPECTED_MOVES:
        raise SystemExit(f"expected {EXPECTED_MOVES} runtime moves, found {len(runtime_keys)}")
    if len(source_keys | related_keys | synthetic_keys) != EXPECTED_MOVES:
        raise SystemExit(
            "source/related/schematic move partitions do not cover the full frame-data roster: "
            f"{len(source_keys | related_keys | synthetic_keys)} != {EXPECTED_MOVES}"
        )
    if related_keys & synthetic_keys:
        raise SystemExit("related-source and synthetic fallback move sets overlap")
    if synthetic_players != len(synthetic_keys):
        raise SystemExit(f"expected one synthetic variant per schematic move: {synthetic_players} != {len(synthetic_keys)}")

    payload = {
        "version": 1,
        "fighters": EXPECTED_FIGHTERS,
        "frameDataMoves": EXPECTED_MOVES,
        "runtimeMoves": len(runtime_keys),
        "movesWithLocalPlayableVisual": len(runtime_keys) - len(blank_moves),
        "blankVisualMoves": len(blank_moves),
        "remoteRuntimeMedia": remote_runtime_media,
        "sourceMappedMoves": len(source_keys),
        "relatedSourceFallbackMoves": len(related_keys),
        "schematicFallbackMoves": len(synthetic_keys),
        "schematicMovesWithDocumentedIntangibleFrames": intangible_synthetic_moves,
        "runtimeModeMoveCounts": dict(sorted(mode_counts.items())),
        "policy": {
            "allRuntimeMediaSameOrigin": True,
            "schematicIsSourceEvidence": False,
            "relatedSourceIsTargetEvidence": False,
            "factualCoverageAuditUnchanged": True,
        },
    }
    OUTPUT.write_text(json.dumps(payload, indent=2) + "\n", encoding="utf-8")
    DOC.write_text(
        "# Runtime Visual Completion\n\n"
        f"- Fighters: **{EXPECTED_FIGHTERS}/{EXPECTED_FIGHTERS}**\n"
        f"- Frame-data move rows: **{EXPECTED_MOVES}/{EXPECTED_MOVES}**\n"
        f"- Moves with a local playable visual: **{EXPECTED_MOVES}/{EXPECTED_MOVES}**\n"
        "- Blank visual cards: **0**\n"
        "- Remote runtime media: **0**\n"
        f"- Source-mapped moves: **{len(source_keys)}**\n"
        f"- Related-source display fallbacks: **{len(related_keys)}**\n"
        f"- Explicit timing-schematic fallbacks: **{len(synthetic_keys)}**\n"
        f"- Schematic moves using documented intangible phases: **{intangible_synthetic_moves}**\n\n"
        "Runtime completion is a UI/playback guarantee, not a claim that every row has exact captured gameplay. "
        "Source-backed coverage remains tracked separately and synthetic/related fallbacks never close factual evidence blockers.\n",
        encoding="utf-8",
    )
    print(
        f"runtime visual completion: {len(runtime_keys)}/{EXPECTED_MOVES} local playable moves; "
        f"blank=0 remote=0 source={len(source_keys)} related={len(related_keys)} schematic={len(synthetic_keys)}"
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
