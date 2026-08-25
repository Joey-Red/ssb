#!/usr/bin/env python3
"""Recover verified source-less moves from exact SmashWiki SSBU file titles.

These entries cover known public animations whose file/category semantics identify
one specific frame-data move but whose filenames are not reliably discoverable by
the generic table/prefix parsers (notably spaced multi-word fighter names).

The registry only establishes that a real source visual exists. It does not assert
an exact game-frame mapping; the full-motion vendor remains the timing gate.
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
REPORT = ROOT / "src/data/smashwikiCuratedGapVisuals.generated.json"

spec = importlib.util.spec_from_file_location("ssb_external_discovery", EXTERNAL_DISCOVERY)
if spec is None or spec.loader is None:
    raise RuntimeError(f"unable to load {EXTERNAL_DISCOVERY}")
ext = importlib.util.module_from_spec(spec)
spec.loader.exec_module(ext)

# Each mapping is intentionally explicit: fighter id + exact committed move name
# + exact SmashWiki file title. Do not add a mapping unless the file semantics
# unambiguously identify the move.
CURATED: tuple[dict[str, str], ...] = (
    {
        "fighterId": "duck-hunt",
        "moveName": "Down B (Wild Gunman)",
        "fileTitle": "File:Duck Hunt Down B SSBU.gif",
        "verification": "SmashWiki Duck Hunt SSBU media labels this animation as Down B",
    },
    {
        "fighterId": "duck-hunt",
        "moveName": "Up B (Duck Jump)",
        "fileTitle": "File:Duck Hunt Up B SSBU.gif",
        "verification": "SmashWiki file describes Duck Hunt's up special in Ultimate",
    },
    {
        "fighterId": "kazuya",
        "moveName": "Down B (Heaven's Door)",
        "fileTitle": "File:Kazuya Down B SSBU.gif",
        "verification": "SmashWiki Kazuya SSBU media labels this animation as Down B; Heaven's Door is his down special",
    },
    {
        "fighterId": "mega-man",
        "moveName": "Up B (Rush Coil)",
        "fileTitle": "File:Mega Man Up B SSBU.gif",
        "verification": "SmashWiki Mega Man SSBU media labels this animation as Up B",
    },
    {
        "fighterId": "min-min",
        "moveName": "Down B (Arms Change)",
        "fileTitle": "File:Min Min Down B SSBU.gif",
        "verification": "SmashWiki Min Min SSBU media labels this animation as Down B",
    },
    {
        "fighterId": "rob",
        "moveName": "Side B (Arm Rotor)",
        "fileTitle": "File:ROB Side B SSBU.gif",
        "verification": "SmashWiki R.O.B. SSBU media labels this animation as Side B",
    },
    {
        "fighterId": "ryu",
        "moveName": "Side B (Tatsumaki Senpukyaku)",
        "fileTitle": "File:Ryu Side B SSBU.gif",
        "verification": "SmashWiki Ryu SSBU media labels this animation as Side B",
    },
    {
        "fighterId": "wii-fit-trainer",
        "moveName": "Down B (Deep Breathing)",
        "fileTitle": "File:Wii Fit Trainer Down B SSBU.gif",
        "verification": "SmashWiki Wii Fit Trainer SSBU media labels this animation as Down B",
    },
)


def exact_move(fighter: dict[str, Any], name: str) -> dict[str, Any] | None:
    matches = [move for move in fighter.get("moves", []) if str(move.get("name")) == name]
    if len(matches) != 1:
        return None
    return matches[0]


def main() -> int:
    frame_data = json.loads(FRAME_DATA.read_text(encoding="utf-8"))
    sources = json.loads(SOURCES.read_text(encoding="utf-8"))
    audit = json.loads(AUDIT.read_text(encoding="utf-8"))
    if sources.get("version") != 3 or audit.get("version") != 2:
        raise SystemExit("visual source/audit schema mismatch")

    source_less = {
        (row["fighterId"], row["moveId"])
        for row in audit.get("movesWithoutVisuals", [])
    }
    source_by_key = {
        (move["fighterId"], move["moveId"]): move
        for move in sources.get("moves", [])
    }

    infos = ext.image_info([entry["fileTitle"] for entry in CURATED])
    accepted: list[dict[str, Any]] = []
    skipped: list[dict[str, str]] = []

    for entry in CURATED:
        fighter_id = entry["fighterId"]
        fighter = frame_data.get("fighters", {}).get(fighter_id)
        if fighter is None:
            raise SystemExit(f"curated SmashWiki mapping references unknown fighter {fighter_id}")
        move = exact_move(fighter, entry["moveName"])
        if move is None:
            raise SystemExit(
                f"curated SmashWiki mapping no longer uniquely matches {fighter_id}: {entry['moveName']}"
            )
        key = (fighter_id, move["id"])
        if key not in source_less or key in source_by_key:
            skipped.append({
                "fighterId": fighter_id,
                "moveId": move["id"],
                "reason": "move already has a discovered source visual",
            })
            continue

        info = infos.get(entry["fileTitle"])
        if info is None:
            # MediaWiki may normalize spaces/underscores. Match by basename as a
            # deterministic fallback, never by fuzzy fighter/move text.
            wanted = entry["fileTitle"].removeprefix("File:").replace("_", " ")
            info = next(
                (
                    value for title, value in infos.items()
                    if title.removeprefix("File:").replace("_", " ") == wanted
                ),
                None,
            )
        if info is None:
            raise SystemExit(f"verified SmashWiki file is unavailable: {entry['fileTitle']}")

        url = str(info.get("url") or "")
        suffix = Path(urlparse(url).path).suffix.lower()
        if suffix not in ext.ANIMATED_EXTENSIONS:
            raise SystemExit(f"verified SmashWiki source is not animated: {entry['fileTitle']}")

        label = Path(entry["fileTitle"].removeprefix("File:")).stem
        timeline = ext.ufd.timeline_class(
            fighter_id,
            str(move.get("name") or move["id"]),
            label,
        )
        record = ext.frame_move_record(
            fighter_id,
            fighter,
            move,
            str(info.get("descriptionurl") or f"{ext.WIKI_BASE}/{entry['fileTitle']}"),
        )
        variant = {
            "id": f"smashwiki-curated-{ext.ufd.visual_id(url)}",
            "label": label,
            "downloadUrl": url,
            "sourceFormat": suffix.lstrip("."),
            "mediaType": "animation",
            "timelineClass": timeline,
            "timingBasis": "parent-action" if timeline == "fighter-action" else "independent-source",
            "sourceProvider": "smashwiki",
            "sourcePageUrl": str(info.get("descriptionurl") or f"{ext.WIKI_BASE}/{entry['fileTitle']}"),
            "sourceAttribution": "SmashWiki verified SSBU move animation; preserve file-page provenance and revision history",
            "sourceQuality": ext.SOURCE_PRIORITY["smashwiki"],
        }
        record["variants"].append(variant)
        sources["moves"].append(record)
        source_by_key[key] = record
        accepted.append({
            "fighterId": fighter_id,
            "moveId": move["id"],
            "moveName": entry["moveName"],
            "fileTitle": entry["fileTitle"],
            "sourcePageUrl": variant["sourcePageUrl"],
            "verification": entry["verification"],
        })

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

    report = {
        "version": 1,
        "registryEntries": len(CURATED),
        "recoveredSourceLessMoves": len(accepted),
        "accepted": accepted,
        "skipped": skipped,
    }
    REPORT.write_text(json.dumps(report, indent=2) + "\n", encoding="utf-8")
    print(
        f"curated SmashWiki gap recovery: {len(accepted)} newly source-backed moves / "
        f"{len(skipped)} already covered"
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
