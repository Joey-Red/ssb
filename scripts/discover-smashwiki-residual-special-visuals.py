#!/usr/bin/env python3
"""Recover four verified residual special-state visuals after the UFD follow-up."""
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
REPORT = ROOT / "src/data/smashwikiResidualSpecialVisuals.generated.json"

spec = importlib.util.spec_from_file_location("ssb_external_discovery", EXTERNAL_DISCOVERY)
if spec is None or spec.loader is None:
    raise RuntimeError(f"unable to load {EXTERNAL_DISCOVERY}")
ext = importlib.util.module_from_spec(spec)
spec.loader.exec_module(ext)

CURATED: dict[tuple[str, str], list[dict[str, str]]] = {
    ("ganondorf", "side-b-air-success-flame-choke-air-success"): [
        {"file": "File:GanondorfSSpecialAerialSSBU.gif", "note": "Flame Choke aerial action"},
        {"file": "File:GanondorfFlameChokeSuccessSSBU.gif", "note": "Flame Choke successful-grab state"},
    ],
    ("joker", "down-b-rebel-s-guard"): [
        {"file": "File:Joker Down B SSBU.gif", "note": "Rebel's Guard down-special animation"},
    ],
    ("joker", "up-b-grappling-hook"): [
        {"file": "File:Joker Up B SSBU.gif", "note": "Grappling Hook up-special animation"},
    ],
    ("joker", "up-b-arsene-wings-of-rebellion"): [
        {"file": "File:Joker Up B 2 SSBU.gif", "note": "Wings of Rebellion Arsene up-special animation"},
    ],
}


def main() -> int:
    frame_data = json.loads(FRAME_DATA.read_text(encoding="utf-8"))
    sources = json.loads(SOURCES.read_text(encoding="utf-8"))
    audit = json.loads(AUDIT.read_text(encoding="utf-8"))
    if sources.get("version") != 3 or audit.get("version") != 2:
        raise SystemExit("visual source/audit schema mismatch")
    source_less = {(row["fighterId"], row["moveId"]) for row in audit.get("movesWithoutVisuals", [])}
    target_keys = [key for key in CURATED if key in source_less]
    file_titles = [entry["file"] for key in target_keys for entry in CURATED[key]]
    infos = ext.image_info(file_titles)
    source_by_key = {(move["fighterId"], move["moveId"]): move for move in sources.get("moves", [])}
    recovered: list[dict[str, Any]] = []
    missing: list[str] = []
    for fighter_id, move_id in target_keys:
        fighter = frame_data.get("fighters", {}).get(fighter_id)
        if not fighter:
            continue
        frame_move = next((move for move in fighter.get("moves", []) if move["id"] == move_id), None)
        if frame_move is None:
            continue
        record = source_by_key.get((fighter_id, move_id))
        accepted: list[str] = []
        for entry in CURATED[(fighter_id, move_id)]:
            title = entry["file"]
            info = infos.get(title)
            if info is None:
                wanted = title.replace("_", " ").lower()
                info = next((value for found, value in infos.items() if found.replace("_", " ").lower() == wanted), None)
            if info is None:
                missing.append(title)
                continue
            url = str(info.get("url") or "")
            suffix = Path(urlparse(url).path).suffix.lower()
            if suffix not in ext.ANIMATED_EXTENSIONS:
                missing.append(title)
                continue
            if record is None:
                record = ext.frame_move_record(fighter_id, fighter, frame_move, str(info.get("descriptionurl") or ""))
                sources["moves"].append(record)
                source_by_key[(fighter_id, move_id)] = record
            variant_id = f"smashwiki-residual-{ext.ufd.visual_id(url)}"
            if any(str(v.get("id")) == variant_id for v in record.get("variants", [])):
                continue
            record.setdefault("variants", []).append({
                "id": variant_id,
                "label": Path(title.removeprefix("File:")).stem,
                "downloadUrl": url,
                "sourceFormat": suffix.lstrip("."),
                "mediaType": "animation",
                "timelineClass": "fighter-action",
                "timingBasis": "parent-action",
                "sourceProvider": "smashwiki",
                "sourcePageUrl": str(info.get("descriptionurl") or f"{ext.WIKI_BASE}/{title.replace(' ', '_')}"),
                "sourceAttribution": f"SmashWiki SSBU explicit residual mapping; {entry['note']}",
                "sourceQuality": ext.SOURCE_PRIORITY["smashwiki"],
            })
            accepted.append(title)
        if accepted:
            recovered.append({"fighterId": fighter_id, "moveId": move_id, "files": accepted})
    if missing:
        raise SystemExit("verified residual SmashWiki media unavailable: " + ", ".join(sorted(set(missing))))
    sources["moves"].sort(key=lambda move: (move["fighterId"], move["moveId"]))
    timeline_counts: dict[str, int] = defaultdict(int)
    for move in sources["moves"]:
        for variant in move.get("variants", []):
            timeline_counts[str(variant.get("timelineClass", "fighter-action"))] += 1
    sources.update({
        "mappedMoves": len(sources["moves"]),
        "mappedVariants": sum(len(move.get("variants", [])) for move in sources["moves"]),
        "timelineCounts": dict(sorted(timeline_counts.items())),
    })
    SOURCES.write_text(json.dumps(sources, indent=2) + "\n", encoding="utf-8")
    REPORT.write_text(json.dumps({
        "version": 1,
        "targetCount": len(target_keys),
        "recoveredSourceLessMoves": len(recovered),
        "recovered": recovered,
    }, indent=2) + "\n", encoding="utf-8")
    print(f"residual special recovery: {len(recovered)} source-less moves")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
