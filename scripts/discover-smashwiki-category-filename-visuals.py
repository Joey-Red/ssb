#!/usr/bin/env python3
"""Recover source-less SSBU moves from SmashWiki's animated-media category.

The ordinary filename sweep requires ``SSBU`` in the filename, while the
shorthand sweep recognizes a deliberately small set of move codes. SmashWiki's
``Category:Animated images (SSBU)`` provides stronger game-identity evidence for
thousands of animations whose filenames may use neither convention. This pass
searches that category directly, requires a fighter-prefix match, then accepts
only an unambiguous match against the fighter's complete committed move list.

The category proves game/animation identity only. Filename matching does not
prove exact timing, and a generic parent-action filename is never reassigned to a
source-less substate simply because that substate remains missing.
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
SHORTHAND = ROOT / "scripts/discover-smashwiki-shorthand-visuals.py"
FRAME_DATA = ROOT / "src/data/frameData.generated.json"
SOURCES = ROOT / "src/data/visualMediaSources.json"
AUDIT = ROOT / "src/data/visualCoverageAudit.generated.json"
REPORT = ROOT / "src/data/smashwikiCategoryFilenameVisuals.generated.json"

spec = importlib.util.spec_from_file_location("ssb_smashwiki_category_filename", SHORTHAND)
if spec is None or spec.loader is None:
    raise RuntimeError(f"unable to load {SHORTHAND}")
short = importlib.util.module_from_spec(spec)
spec.loader.exec_module(short)
ext = short.ext


def category_file_titles() -> list[str]:
    titles: list[str] = []
    continuation: str | None = None
    while True:
        params: dict[str, Any] = {
            "action": "query",
            "format": "json",
            "list": "categorymembers",
            "cmtitle": short.SSBU_ANIMATED_CATEGORY,
            "cmnamespace": 6,
            "cmlimit": "max",
        }
        if continuation:
            params["cmcontinue"] = continuation
        payload = ext.http_get(ext.WIKI_API, **params).json()
        for row in payload.get("query", {}).get("categorymembers", []):
            title = str(row.get("title") or "")
            if title.startswith("File:"):
                titles.append(title)
        continuation = payload.get("continue", {}).get("cmcontinue")
        if not continuation:
            break
    return sorted(set(titles))


def camel_words(filename: str) -> str:
    """Expose CamelCase filename semantics without guessing abbreviations."""
    stem = Path(filename).stem
    stem = re.sub(r"([a-z0-9])([A-Z])", r"\1 \2", stem)
    stem = re.sub(r"([A-Z])([A-Z][a-z])", r"\1 \2", stem)
    return " ".join(stem.replace("_", " ").split())


def strongest_match(
    title: str,
    fighter_id: str,
    fighter: dict[str, Any],
    prefixes: list[str],
) -> tuple[dict[str, Any] | None, int, str | None]:
    moves = list(fighter.get("moves", []))
    filename = title.removeprefix("File:")
    labels = [Path(filename).stem, camel_words(filename)]
    expanded = short.expanded_move_label(filename, prefixes)
    if expanded and expanded not in labels:
        labels.append(expanded)

    best_move: dict[str, Any] | None = None
    best_score = 0
    best_label: str | None = None
    tie = False
    for label in dict.fromkeys(labels):
        move, score = ext.match_move(label, moves)
        if move is None:
            continue
        if score > best_score:
            best_move, best_score, best_label, tie = move, score, label, False
        elif score == best_score and best_move is not None and move["id"] != best_move["id"]:
            tie = True
    if tie:
        return None, best_score, best_label
    return best_move, best_score, best_label


def main() -> int:
    frame_data = json.loads(FRAME_DATA.read_text(encoding="utf-8"))
    sources = json.loads(SOURCES.read_text(encoding="utf-8"))
    audit = json.loads(AUDIT.read_text(encoding="utf-8"))
    if sources.get("version") != 3 or audit.get("version") != 2:
        raise SystemExit("visual source/audit schema mismatch")

    targets: dict[str, set[str]] = defaultdict(set)
    for row in audit.get("movesWithoutVisuals", []):
        targets[row["fighterId"]].add(row["moveId"])

    titles = category_file_titles()
    if len(titles) < 1000:
        raise SystemExit(f"SmashWiki Ultimate animated-media category unexpectedly small: {len(titles)} files")

    raw_candidates: list[dict[str, Any]] = []
    for fighter_id in sorted(targets):
        fighter = frame_data.get("fighters", {}).get(fighter_id)
        if not fighter:
            continue
        prefixes = short.scan_prefixes(fighter_id, fighter)
        best: dict[str, dict[str, Any]] = {}
        for file_title in titles:
            filename = file_title.removeprefix("File:")
            if not short.title_belongs_to_fighter(fighter_id, filename, prefixes):
                continue
            suffix = Path(filename).suffix.lower()
            if suffix not in ext.ufd.MEDIA_EXTENSIONS:
                continue
            move, score, matched_label = strongest_match(filename, fighter_id, fighter, prefixes)
            if move is None or move["id"] not in targets[fighter_id]:
                continue
            # Require strong textual evidence. Standard shorthand expansion is
            # effectively exact; direct full-name files normally score >=500.
            if score < 500:
                continue
            candidate = {
                "fighterId": fighter_id,
                "moveId": move["id"],
                "fileTitle": file_title,
                "matchLabel": matched_label or filename,
                "matchScore": score,
            }
            previous = best.get(move["id"])
            rank = (score, len(filename))
            previous_rank = (
                int(previous["matchScore"]), len(str(previous["fileTitle"]))
            ) if previous else (-1, -1)
            if previous is None or rank > previous_rank:
                best[move["id"]] = candidate
        raw_candidates.extend(best.values())

    infos = ext.image_info([row["fileTitle"] for row in raw_candidates])
    source_by_key = {
        (move["fighterId"], move["moveId"]): move
        for move in sources.get("moves", [])
    }
    accepted: list[dict[str, Any]] = []
    unavailable: list[dict[str, str]] = []

    for candidate in sorted(raw_candidates, key=lambda row: (row["fighterId"], row["moveId"])):
        fighter_id = candidate["fighterId"]
        move_id = candidate["moveId"]
        key = (fighter_id, move_id)
        if key in source_by_key:
            continue
        info = infos.get(candidate["fileTitle"])
        if info is None:
            unavailable.append({
                "fighterId": fighter_id,
                "moveId": move_id,
                "fileTitle": candidate["fileTitle"],
            })
            continue
        fighter = frame_data["fighters"][fighter_id]
        frame_move = next((move for move in fighter.get("moves", []) if move["id"] == move_id), None)
        if frame_move is None:
            continue
        url = str(info.get("url") or "")
        suffix = Path(urlparse(url).path).suffix.lower()
        if suffix not in ext.ufd.MEDIA_EXTENSIONS:
            continue
        label = Path(candidate["fileTitle"].removeprefix("File:")).stem
        timeline = ext.ufd.timeline_class(
            fighter_id,
            str(frame_move.get("name") or move_id),
            label,
        )
        source_page = str(
            info.get("descriptionurl")
            or f"{ext.WIKI_BASE}/File:{quote(candidate['fileTitle'].removeprefix('File:'))}"
        )
        record = ext.frame_move_record(fighter_id, fighter, frame_move, source_page)
        variant = {
            "id": f"smashwiki-category-{ext.ufd.visual_id(url)}",
            "label": label,
            "downloadUrl": url,
            "sourceFormat": suffix.lstrip("."),
            "mediaType": "animation",
            "timelineClass": timeline,
            "timingBasis": "parent-action" if timeline == "fighter-action" else "independent-source",
            "sourceProvider": "smashwiki",
            "sourcePageUrl": source_page,
            "sourceAttribution": (
                "SmashWiki Category:Animated images (SSBU) filename-matched animation; "
                "preserve file-page provenance and revision history"
            ),
            "sourceQuality": ext.SOURCE_PRIORITY["smashwiki"],
            "sourceAnimationEvidence": "smashwiki-category-animated-images-ssbu",
        }
        record["variants"].append(variant)
        sources["moves"].append(record)
        source_by_key[key] = record
        accepted.append({**candidate, "sourcePageUrl": source_page, "sourceFormat": suffix.lstrip(".")})

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
        "category": short.SSBU_ANIMATED_CATEGORY,
        "categoryFiles": len(titles),
        "sourceLessTargets": sum(len(ids) for ids in targets.values()),
        "strongFilenameCandidates": len(raw_candidates),
        "recoveredSourceLessMoves": len(accepted),
        "unavailableCandidates": unavailable,
        "accepted": accepted,
        "policy": "category confirms SSBU animation identity; conservative filename matching identifies the move; vendor still proves timing",
    }, indent=2) + "\n", encoding="utf-8")
    print(
        f"SmashWiki category filename sweep recovered {len(accepted)} source-less moves "
        f"from {len(raw_candidates)} strong candidates / {len(titles)} category animations"
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
