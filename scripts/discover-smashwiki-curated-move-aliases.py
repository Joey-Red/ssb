#!/usr/bin/env python3
"""Recover source-less moves from explicit, human-reviewed SmashWiki aliases.

Some frame-data rows name a subaction (for example Substitute's counterattack or
Arm Rotor) while SmashWiki files use the special-slot or internal action name.
Generic fuzzy matching must not guess across those semantics. This registry is
therefore intentionally small and explicit: every entry names an SSBU file that
is known to depict the listed move/state. The normal vendor still decides whether
that media proves a complete game-frame timeline; discovery alone never grants
exact coverage.
"""
from __future__ import annotations

import importlib.util
import json
from collections import defaultdict
from pathlib import Path
from typing import Any
from urllib.parse import urlparse

ROOT = Path(__file__).resolve().parents[1]
EXTERNAL_DISCOVERY = ROOT / "scripts/discover-external-visuals.py"
FRAME_DATA = ROOT / "src/data/frameData.generated.json"
SOURCES = ROOT / "src/data/visualMediaSources.json"
AUDIT = ROOT / "src/data/visualCoverageAudit.generated.json"
REPORT = ROOT / "src/data/smashwikiCuratedMoveAliases.generated.json"

spec = importlib.util.spec_from_file_location("ssb_external_discovery", EXTERNAL_DISCOVERY)
if spec is None or spec.loader is None:
    raise RuntimeError(f"unable to load {EXTERNAL_DISCOVERY}")
ext = importlib.util.module_from_spec(spec)
spec.loader.exec_module(ext)

# Explicit source aliases only. Multiple files on one move are complementary
# source references, not a claim that any one file proves the whole action.
CURATED: dict[tuple[str, str], list[dict[str, str]]] = {
    ("greninja", "down-b-attack-substitute-attack"): [
        {"file": "File:GreninjaDSpecialSideSSBU.gif", "note": "Substitute counterattack, horizontal direction"},
        {"file": "File:GreninjaDSpecialUpSSBU.gif", "note": "Substitute counterattack, upward direction"},
        {"file": "File:GreninjaDSpecialDownSSBU.gif", "note": "Substitute counterattack, downward direction"},
        {"file": "File:GreninjaDSpecialDiagonalUpSSBU.gif", "note": "Substitute counterattack, diagonal-up direction"},
        {"file": "File:GreninjaDSpecialDiagonalDownSSBU.gif", "note": "Substitute counterattack, diagonal-down direction"},
    ],
    ("rob", "side-b-arm-rotor"): [
        {"file": "File:ROBSSpecialArmRotorSSBU.gif", "note": "Arm Rotor side-special action"},
    ],
    ("ryu", "side-b-tatsumaki-senpukyaku"): [
        {"file": "File:RyuSSpecialGroundedSSBU.gif", "note": "Tatsumaki Senpukyaku grounded side-special action"},
        {"file": "File:RyuSSpecialAerialSSBU.gif", "note": "Tatsumaki Senpukyaku aerial side-special action"},
    ],
    ("kazuya", "down-b-heaven-s-door"): [
        {"file": "File:Kazuya Down B SSBU.gif", "note": "Heaven's Door down-special action"},
    ],
    # The frame-data row is specifically the successful aerial Flame Choke.
    # Keep both the aerial action and the success-state source as complementary
    # references; neither is promoted to exact complete coverage by discovery.
    ("ganondorf", "side-b-air-success-flame-choke-air-success"): [
        {"file": "File:GanondorfSSpecialAerialSSBU.gif", "note": "Flame Choke aerial side-special action"},
        {"file": "File:GanondorfFlameChokeSuccessSSBU.gif", "note": "Flame Choke successful-grab state"},
    ],
    # SmashWiki's character category and move pages expose the numbered skill
    # animations for Joker's paired specials. They are useful source references;
    # exact timing remains vendor-gated.
    ("joker", "down-b-rebel-s-guard"): [
        {"file": "File:Joker Down B SSBU.gif", "note": "Rebel's Guard / down-special source animation"},
    ],
    ("joker", "up-b-grappling-hook"): [
        {"file": "File:Joker Up B SSBU.gif", "note": "Grappling Hook / base up-special source animation"},
    ],
    ("joker", "up-b-arsene-wings-of-rebellion"): [
        {"file": "File:Joker Up B 2 SSBU.gif", "note": "Wings of Rebellion / Arsene up-special source animation"},
    ],
}


def add_variant(
    record: dict[str, Any],
    info: dict[str, Any],
    file_title: str,
    note: str,
) -> dict[str, Any] | None:
    url = str(info.get("url") or "")
    suffix = Path(urlparse(url).path).suffix.lower()
    if suffix not in ext.ANIMATED_EXTENSIONS:
        return None
    source_page = str(info.get("descriptionurl") or f"{ext.WIKI_BASE}/{file_title.replace(' ', '_')}")
    variant_id = f"smashwiki-curated-{ext.ufd.visual_id(url)}"
    used = {str(item.get("id")) for item in record.get("variants", [])}
    if variant_id in used:
        return None
    variant = {
        "id": variant_id,
        "label": Path(file_title.removeprefix("File:")).stem,
        "downloadUrl": url,
        "sourceFormat": suffix.lstrip("."),
        "mediaType": "animation",
        "timelineClass": "fighter-action",
        "timingBasis": "parent-action",
        "sourceProvider": "smashwiki",
        "sourcePageUrl": source_page,
        "sourceAttribution": f"SmashWiki SSBU explicit move alias; {note}",
        "sourceQuality": ext.SOURCE_PRIORITY["smashwiki"],
    }
    record.setdefault("variants", []).append(variant)
    return variant


def main() -> int:
    frame_data = json.loads(FRAME_DATA.read_text(encoding="utf-8"))
    sources = json.loads(SOURCES.read_text(encoding="utf-8"))
    audit = json.loads(AUDIT.read_text(encoding="utf-8"))
    if sources.get("version") != 3 or audit.get("version") != 2:
        raise SystemExit("visual source/audit schema mismatch")

    source_less = {
        (move["fighterId"], move["moveId"])
        for move in audit.get("movesWithoutVisuals", [])
    }
    target_keys = [key for key in CURATED if key in source_less]
    file_titles = [entry["file"] for key in target_keys for entry in CURATED[key]]
    infos = ext.image_info(file_titles)

    source_by_key = {
        (move["fighterId"], move["moveId"]): move
        for move in sources.get("moves", [])
    }
    recovered_moves: list[dict[str, Any]] = []
    added_variants = 0
    missing_files: list[str] = []

    for fighter_id, move_id in target_keys:
        fighter = frame_data.get("fighters", {}).get(fighter_id)
        if not fighter:
            continue
        frame_move = next(
            (move for move in fighter.get("moves", []) if move["id"] == move_id),
            None,
        )
        if frame_move is None:
            continue
        key = (fighter_id, move_id)
        record = source_by_key.get(key)
        created = False
        accepted_titles: list[str] = []
        for entry in CURATED[key]:
            title = entry["file"]
            info = infos.get(title)
            if info is None:
                # MediaWiki may canonicalize spaces/underscores but returns the
                # canonical title. Fall back to a normalized title comparison.
                wanted = title.replace("_", " ").lower()
                info = next(
                    (value for found_title, value in infos.items() if found_title.replace("_", " ").lower() == wanted),
                    None,
                )
            if info is None:
                missing_files.append(title)
                continue
            if record is None:
                record = ext.frame_move_record(
                    fighter_id,
                    fighter,
                    frame_move,
                    str(info.get("descriptionurl") or ""),
                )
                sources["moves"].append(record)
                source_by_key[key] = record
                created = True
            variant = add_variant(record, info, title, entry["note"])
            if variant is not None:
                accepted_titles.append(title)
                added_variants += 1
        if record is not None and accepted_titles:
            recovered_moves.append({
                "fighterId": fighter_id,
                "moveId": move_id,
                "moveName": frame_move.get("name") or move_id,
                "createdSourceRecord": created,
                "files": accepted_titles,
            })

    sources["moves"].sort(key=lambda move: (move["fighterId"], move["moveId"]))
    timeline_counts: dict[str, int] = defaultdict(int)
    for move in sources["moves"]:
        for variant in move.get("variants", []):
            timeline_counts[str(variant.get("timelineClass", "fighter-action"))] += 1
    sources.update({
        "source": "Ultimate Frame Data + curated external SSBU visual archives",
        "generatedBy": (
            str(sources.get("generatedBy") or "").rstrip() +
            " + scripts/discover-smashwiki-curated-move-aliases.py"
        ).strip(" +"),
        "mappedMoves": len(sources["moves"]),
        "mappedVariants": sum(len(move.get("variants", [])) for move in sources["moves"]),
        "timelineCounts": dict(sorted(timeline_counts.items())),
    })
    SOURCES.write_text(json.dumps(sources, indent=2) + "\n", encoding="utf-8")

    report = {
        "version": 1,
        "curatedTargetCount": len(target_keys),
        "recoveredSourceLessMoves": len(recovered_moves),
        "addedVariants": added_variants,
        "missingFiles": sorted(set(missing_files)),
        "recovered": recovered_moves,
    }
    REPORT.write_text(json.dumps(report, indent=2) + "\n", encoding="utf-8")
    print(
        f"curated move aliases recovered {len(recovered_moves)} source-less moves / "
        f"{added_variants} source variants; {len(set(missing_files))} files missing"
    )
    if missing_files:
        raise SystemExit("curated SmashWiki alias file missing; refusing silent partial registry")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
