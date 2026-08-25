#!/usr/bin/env python3
"""Recover SSBU visuals hidden by Pokémon Trainer frame-data fighter aliases.

The frame-data snapshot uses fighter IDs `charizard`, `ivysaur`, and `squirtle`
while their stored display names are `Pt_charizard`, `Pt_ivysaur`, and
`Pt_squirtle`. SmashWiki files use the actual Pokémon names. This focused pass
feeds those canonical file prefixes into the already-strict filename scanner and
only adds moves that remain source-less.
"""
from __future__ import annotations

import importlib.util
import json
from collections import defaultdict
from pathlib import Path
from typing import Any

ROOT = Path(__file__).resolve().parents[1]
BASE_SCRIPT = ROOT / "scripts/discover-smashwiki-filename-visuals.py"
FRAME_DATA = ROOT / "src/data/frameData.generated.json"
SOURCES = ROOT / "src/data/visualMediaSources.json"
AUDIT = ROOT / "src/data/visualCoverageAudit.generated.json"
REPORT = ROOT / "src/data/smashwikiPokemonTrainerVisuals.generated.json"

spec = importlib.util.spec_from_file_location("ssb_smashwiki_filename_discovery", BASE_SCRIPT)
if spec is None or spec.loader is None:
    raise RuntimeError(f"unable to load {BASE_SCRIPT}")
base = importlib.util.module_from_spec(spec)
spec.loader.exec_module(base)
ext = base.ext

POKEMON_PREFIXES = {
    "charizard": ["Charizard"],
    "ivysaur": ["Ivysaur"],
    "squirtle": ["Squirtle"],
}
base.FILENAME_PREFIX_OVERRIDES.update(POKEMON_PREFIXES)


def main() -> int:
    frame_data = json.loads(FRAME_DATA.read_text(encoding="utf-8"))
    sources = json.loads(SOURCES.read_text(encoding="utf-8"))
    audit = json.loads(AUDIT.read_text(encoding="utf-8"))
    if sources.get("version") != 3 or audit.get("version") != 2:
        raise SystemExit("visual source/audit schema mismatch")

    source_by_key = {
        (move["fighterId"], move["moveId"]): move
        for move in sources.get("moves", [])
    }
    targets: dict[str, set[str]] = defaultdict(set)
    for move in audit.get("movesWithoutVisuals", []):
        fighter_id = move["fighterId"]
        key = (fighter_id, move["moveId"])
        if fighter_id in POKEMON_PREFIXES and key not in source_by_key:
            targets[fighter_id].add(move["moveId"])

    accepted: list[dict[str, Any]] = []
    warnings: list[str] = []
    scanned_files = 0

    for fighter_id in sorted(targets):
        fighter = frame_data.get("fighters", {}).get(fighter_id)
        if not fighter:
            continue
        try:
            candidates, fighter_scanned = base.scan_fighter(
                fighter_id, fighter, targets[fighter_id]
            )
            scanned_files += fighter_scanned
            for candidate in candidates:
                key = (fighter_id, candidate["moveId"])
                if key in source_by_key:
                    continue
                frame_move = next(
                    (move for move in fighter.get("moves", []) if move["id"] == candidate["moveId"]),
                    None,
                )
                if frame_move is None:
                    continue
                record = ext.frame_move_record(
                    fighter_id, fighter, frame_move, candidate["sourcePageUrl"]
                )
                variant = {field: candidate[field] for field in (
                    "id", "label", "downloadUrl", "sourceFormat", "mediaType",
                    "timelineClass", "timingBasis", "sourceProvider",
                    "sourcePageUrl", "sourceAttribution", "sourceQuality",
                )}
                variant["id"] = variant["id"].replace(
                    "smashwiki-filename-", "smashwiki-pokemon-", 1
                )
                record["variants"].append(variant)
                sources["moves"].append(record)
                source_by_key[key] = record
                accepted.append(candidate)
        except Exception as exc:  # noqa: BLE001
            warnings.append(f"{fighter_id}: {exc}")
            print(f"[smashwiki-pokemon-warning] {fighter_id}: {exc}")

    sources["moves"].sort(key=lambda move: (move["fighterId"], move["moveId"]))
    timeline_counts: dict[str, int] = defaultdict(int)
    for move in sources["moves"]:
        for variant in move.get("variants", []):
            timeline_counts[str(variant.get("timelineClass", "fighter-action"))] += 1
    sources.update({
        "source": "Ultimate Frame Data + curated external SSBU visual archives",
        "generatedBy": (
            str(sources.get("generatedBy") or "").rstrip() +
            " + scripts/discover-smashwiki-pokemon-trainer-visuals.py"
        ).strip(" +"),
        "mappedMoves": len(sources["moves"]),
        "mappedVariants": sum(len(move.get("variants", [])) for move in sources["moves"]),
        "timelineCounts": dict(sorted(timeline_counts.items())),
    })
    SOURCES.write_text(json.dumps(sources, indent=2) + "\n", encoding="utf-8")

    report = {
        "version": 1,
        "sourceLessTargets": sum(len(move_ids) for move_ids in targets.values()),
        "filesScanned": scanned_files,
        "recoveredSourceLessMoves": len(accepted),
        "warnings": warnings,
        "accepted": accepted,
    }
    REPORT.write_text(json.dumps(report, indent=2) + "\n", encoding="utf-8")
    print(
        f"Pokémon Trainer alias sweep recovered {len(accepted)} source-less moves "
        f"from {scanned_files} file records"
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
