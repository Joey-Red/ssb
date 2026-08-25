#!/usr/bin/env python3
"""Recover source-less SSBU moves from SmashWiki's file namespace.

The normal external discovery pass parses each fighter's Hitboxes table. Some
valid SSBU animations exist in SmashWiki's file namespace without being exposed
by a row that our table parser can map reliably. This pass searches each
fighter's file prefix, matches animated SSBU media only against moves that are
still source-less in the freshly generated audit, and adds at most one strongest
candidate per move/timeline.

It never invents timing or treats filename matching as timing evidence. The
normal full-motion vendor remains responsible for proving exact/source-timed
coverage from encoded media plus documented game timing.
"""
from __future__ import annotations

import importlib.util
import json
import re
from collections import defaultdict
from pathlib import Path
from typing import Any
from urllib.parse import quote, urlparse

ROOT = Path(__file__).resolve().parents[1]
EXTERNAL_DISCOVERY = ROOT / "scripts/discover-external-visuals.py"
FRAME_DATA = ROOT / "src/data/frameData.generated.json"
SOURCES = ROOT / "src/data/visualMediaSources.json"
AUDIT = ROOT / "src/data/visualCoverageAudit.generated.json"
REPORT = ROOT / "src/data/smashwikiFilenameVisuals.generated.json"

spec = importlib.util.spec_from_file_location("ssb_external_discovery", EXTERNAL_DISCOVERY)
if spec is None or spec.loader is None:
    raise RuntimeError(f"unable to load {EXTERNAL_DISCOVERY}")
ext = importlib.util.module_from_spec(spec)
spec.loader.exec_module(ext)

# Frame-data IDs/names are not always the same spelling used by SmashWiki file
# prefixes. These are discovery aliases only; they do not affect runtime data.
FILENAME_PREFIX_OVERRIDES = {
    "pt_charizard": ["Charizard"],
    "pt_ivysaur": ["Ivysaur"],
    "pt_squirtle": ["Squirtle"],
    "minmin": ["MinMin", "Min Min"],
    "mega_man": ["MegaMan", "Mega Man"],
    "meta_knight": ["MetaKnight", "Meta Knight"],
    "mr_game_and_watch": ["MrGameWatch", "Mr Game Watch"],
    "rosalina_and_luma": ["RosalinaLuma", "Rosalina Luma", "Rosalina"],
    "wii_fit_trainer": ["WiiFitTrainer", "Wii Fit Trainer"],
}


def filename_prefixes(fighter_id: str, fighter: dict[str, Any]) -> list[str]:
    display = ext.wiki_display(fighter_id, fighter)
    names = [display, display.split()[0], *FILENAME_PREFIX_OVERRIDES.get(fighter_id, [])]
    prefixes: list[str] = []
    for name in names:
        compact = re.sub(r"[^A-Za-z0-9]", "", name)
        if len(compact) >= 3 and compact not in prefixes:
            prefixes.append(compact)
    return prefixes


def animation_candidate(
    fighter_id: str,
    move: dict[str, Any],
    image: dict[str, Any],
    score: int,
) -> dict[str, Any] | None:
    title = str(image.get("name") or "")
    url = str(image.get("url") or "")
    suffix = Path(urlparse(url).path).suffix.lower()
    if suffix not in ext.ANIMATED_EXTENSIONS or suffix not in ext.ufd.MEDIA_EXTENSIONS:
        return None
    label = Path(title).stem
    timeline = ext.ufd.timeline_class(
        fighter_id,
        str(move.get("name") or move["id"]),
        label,
    )
    return {
        "fighterId": fighter_id,
        "moveId": move["id"],
        "matchLabel": title,
        "matchScore": score,
        "id": f"smashwiki-filename-{ext.ufd.visual_id(url)}",
        "label": label,
        "downloadUrl": url,
        "sourceFormat": suffix.lstrip("."),
        "mediaType": "animation",
        "timelineClass": timeline,
        "timingBasis": "parent-action" if timeline == "fighter-action" else "independent-source",
        "sourceProvider": "smashwiki",
        "sourcePageUrl": str(image.get("descriptionurl") or f"{ext.WIKI_BASE}/File:{quote(title)}"),
        "sourceAttribution": "SmashWiki SSBU file-namespace animation; preserve file-page provenance and revision history",
        "sourceQuality": ext.SOURCE_PRIORITY["smashwiki"],
    }


def scan_fighter(
    fighter_id: str,
    fighter: dict[str, Any],
    target_ids: set[str],
) -> tuple[list[dict[str, Any]], int]:
    moves = list(fighter.get("moves", []))
    seen_titles: set[str] = set()
    raw_matches: list[dict[str, Any]] = []
    files_scanned = 0

    for prefix in filename_prefixes(fighter_id, fighter):
        continuation: str | None = None
        for _ in range(8):
            params: dict[str, Any] = {
                "action": "query",
                "format": "json",
                "list": "allimages",
                "ailimit": "max",
                "aiprefix": prefix,
                "aiprop": "url|mime|size",
            }
            if continuation:
                params["aicontinue"] = continuation
            payload = ext.http_get(ext.WIKI_API, **params).json()
            images = payload.get("query", {}).get("allimages", [])
            files_scanned += len(images)
            for image in images:
                title = str(image.get("name") or "")
                if title in seen_titles or "ssbu" not in title.lower():
                    continue
                seen_titles.add(title)
                move, score = ext.match_move(title, moves)
                if move is None or move["id"] not in target_ids:
                    continue
                candidate = animation_candidate(fighter_id, move, image, score)
                if candidate is not None:
                    raw_matches.append(candidate)
            continuation = payload.get("continue", {}).get("aicontinue")
            if not continuation:
                break

    # One strongest animation per move/timeline avoids inflating coverage blockers
    # with weaker alternate references. The vendor will decide whether the chosen
    # source actually proves the timeline.
    best: dict[tuple[str, str], dict[str, Any]] = {}
    for candidate in raw_matches:
        key = (candidate["moveId"], candidate["timelineClass"])
        previous = best.get(key)
        rank = (int(candidate["matchScore"]), len(candidate["label"]))
        previous_rank = (
            int(previous["matchScore"]),
            len(previous["label"]),
        ) if previous else (-1, -1)
        if previous is None or rank > previous_rank:
            best[key] = candidate
    return list(best.values()), files_scanned


def main() -> int:
    frame_data = json.loads(FRAME_DATA.read_text(encoding="utf-8"))
    sources = json.loads(SOURCES.read_text(encoding="utf-8"))
    audit = json.loads(AUDIT.read_text(encoding="utf-8"))
    if sources.get("version") != 3 or audit.get("version") != 2:
        raise SystemExit("visual source/audit schema mismatch")

    targets: dict[str, set[str]] = defaultdict(set)
    for move in audit.get("movesWithoutVisuals", []):
        targets[move["fighterId"]].add(move["moveId"])

    source_by_key = {
        (move["fighterId"], move["moveId"]): move
        for move in sources.get("moves", [])
    }
    accepted: list[dict[str, Any]] = []
    warnings: list[str] = []
    scanned_files = 0
    raw_candidate_count = 0

    for fighter_id in sorted(targets):
        fighter = frame_data.get("fighters", {}).get(fighter_id)
        if not fighter:
            continue
        try:
            candidates, fighter_scanned = scan_fighter(fighter_id, fighter, targets[fighter_id])
            scanned_files += fighter_scanned
            raw_candidate_count += len(candidates)
            for candidate in candidates:
                key = (fighter_id, candidate["moveId"])
                # The audit was generated immediately before this pass, so these
                # should be source-less. Refuse to duplicate a record if another
                # discovery path already added it in this same workflow.
                if key in source_by_key:
                    continue
                frame_move = next(
                    (move for move in fighter.get("moves", []) if move["id"] == candidate["moveId"]),
                    None,
                )
                if frame_move is None:
                    continue
                record = ext.frame_move_record(
                    fighter_id,
                    fighter,
                    frame_move,
                    candidate["sourcePageUrl"],
                )
                variant = {field: candidate[field] for field in (
                    "id", "label", "downloadUrl", "sourceFormat", "mediaType",
                    "timelineClass", "timingBasis", "sourceProvider",
                    "sourcePageUrl", "sourceAttribution", "sourceQuality",
                )}
                record["variants"].append(variant)
                sources["moves"].append(record)
                source_by_key[key] = record
                accepted.append(candidate)
            print(
                f"[smashwiki-filename] {fighter_id}: "
                f"{len(candidates)} matched animations / {fighter_scanned} files scanned"
            )
        except Exception as exc:  # noqa: BLE001
            warnings.append(f"{fighter_id}: {exc}")
            print(f"[smashwiki-filename-warning] {fighter_id}: {exc}")

    sources["moves"].sort(key=lambda move: (move["fighterId"], move["moveId"]))
    timeline_counts: dict[str, int] = defaultdict(int)
    for move in sources["moves"]:
        for variant in move.get("variants", []):
            timeline_counts[str(variant.get("timelineClass", "fighter-action"))] += 1
    sources.update({
        "source": "Ultimate Frame Data + curated external SSBU visual archives",
        "generatedBy": (
            "scripts/discover-ufd-visuals.py + scripts/discover-external-visuals.py + "
            "scripts/discover-smashwiki-filename-visuals.py"
        ),
        "mappedMoves": len(sources["moves"]),
        "mappedVariants": sum(len(move.get("variants", [])) for move in sources["moves"]),
        "timelineCounts": dict(sorted(timeline_counts.items())),
    })
    SOURCES.write_text(json.dumps(sources, indent=2) + "\n", encoding="utf-8")

    report = {
        "version": 1,
        "sourceLessTargets": sum(len(move_ids) for move_ids in targets.values()),
        "fightersScanned": len(targets),
        "filesScanned": scanned_files,
        "matchedCandidates": raw_candidate_count,
        "recoveredSourceLessMoves": len(accepted),
        "warnings": warnings,
        "accepted": accepted,
    }
    REPORT.write_text(json.dumps(report, indent=2) + "\n", encoding="utf-8")
    print(
        f"SmashWiki filename sweep recovered {len(accepted)} source-less moves "
        f"from {scanned_files} file records"
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
