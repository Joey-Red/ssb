#!/usr/bin/env python3
"""Recover source-less moves from fighter-specific SmashWiki hitbox categories.

SmashWiki maintains per-fighter ``Hitbox images (<fighter> SSBU)`` categories.
Those categories are stronger evidence than a loose filename search because they
establish both fighter and game identity. This pass uses them only for moves that
remain source-less, requires an unambiguous strong filename/move match against
the fighter's complete move list, and preserves static images as static source
references rather than pretending they are motion.

Animated category membership is consulted separately so APNG files with ``.png``
filenames retain animation semantics. Timing is still decided only by the normal
full-motion vendor.
"""
from __future__ import annotations

import importlib.util
import json
from collections import defaultdict
from pathlib import Path
from typing import Any
from urllib.parse import quote, urlparse

ROOT = Path(__file__).resolve().parents[1]
CATEGORY_FILENAME = ROOT / "scripts/discover-smashwiki-category-filename-visuals.py"
FRAME_DATA = ROOT / "src/data/frameData.generated.json"
SOURCES = ROOT / "src/data/visualMediaSources.json"
AUDIT = ROOT / "src/data/visualCoverageAudit.generated.json"
REPORT = ROOT / "src/data/smashwikiHitboxCategoryVisuals.generated.json"

spec = importlib.util.spec_from_file_location("ssb_smashwiki_hitbox_category", CATEGORY_FILENAME)
if spec is None or spec.loader is None:
    raise RuntimeError(f"unable to load {CATEGORY_FILENAME}")
cat = importlib.util.module_from_spec(spec)
spec.loader.exec_module(cat)
short = cat.short
ext = cat.ext


def hitbox_category_titles(fighter_id: str, fighter: dict[str, Any]) -> tuple[str, list[str]]:
    display = ext.wiki_display(fighter_id, fighter)
    category = f"Category:Hitbox images ({display} SSBU)"
    titles: list[str] = []
    continuation: str | None = None
    while True:
        params: dict[str, Any] = {
            "action": "query",
            "format": "json",
            "list": "categorymembers",
            "cmtitle": category,
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
    return category, sorted(set(titles))


def main() -> int:
    frame_data = json.loads(FRAME_DATA.read_text(encoding="utf-8"))
    sources = json.loads(SOURCES.read_text(encoding="utf-8"))
    audit = json.loads(AUDIT.read_text(encoding="utf-8"))
    if sources.get("version") != 3 or audit.get("version") != 2:
        raise SystemExit("visual source/audit schema mismatch")

    targets: dict[str, set[str]] = defaultdict(set)
    for row in audit.get("movesWithoutVisuals", []):
        targets[row["fighterId"]].add(row["moveId"])

    animated_titles = short.ssbu_animated_titles()
    if len(animated_titles) < 1000:
        raise SystemExit(
            f"SmashWiki Ultimate animated-media category unexpectedly small: {len(animated_titles)} files"
        )

    source_by_key = {
        (move["fighterId"], move["moveId"]): move
        for move in sources.get("moves", [])
    }
    candidates: list[dict[str, Any]] = []
    category_counts: dict[str, int] = {}
    warnings: list[str] = []

    for fighter_id in sorted(targets):
        fighter = frame_data.get("fighters", {}).get(fighter_id)
        if not fighter:
            continue
        try:
            category, titles = hitbox_category_titles(fighter_id, fighter)
        except Exception as exc:  # noqa: BLE001
            warnings.append(f"{fighter_id}: {exc}")
            continue
        category_counts[fighter_id] = len(titles)
        if not titles:
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
            move, score, matched_label = cat.strongest_match(filename, fighter_id, fighter, prefixes)
            if move is None or move["id"] not in targets[fighter_id] or score < 500:
                continue
            row = {
                "fighterId": fighter_id,
                "moveId": move["id"],
                "fileTitle": file_title,
                "category": category,
                "matchLabel": matched_label or filename,
                "matchScore": score,
            }
            previous = best.get(move["id"])
            rank = (score, len(filename))
            previous_rank = (
                int(previous["matchScore"]), len(str(previous["fileTitle"]))
            ) if previous else (-1, -1)
            if previous is None or rank > previous_rank:
                best[move["id"]] = row
        candidates.extend(best.values())

    infos = ext.image_info([row["fileTitle"] for row in candidates])
    accepted: list[dict[str, Any]] = []
    skipped_already_covered = 0
    for candidate in sorted(candidates, key=lambda row: (row["fighterId"], row["moveId"])):
        fighter_id = candidate["fighterId"]
        move_id = candidate["moveId"]
        key = (fighter_id, move_id)
        if key in source_by_key:
            skipped_already_covered += 1
            continue
        info = infos.get(candidate["fileTitle"])
        if info is None:
            continue
        fighter = frame_data["fighters"][fighter_id]
        frame_move = next((move for move in fighter.get("moves", []) if move["id"] == move_id), None)
        if frame_move is None:
            continue
        url = str(info.get("url") or "")
        suffix = Path(urlparse(url).path).suffix.lower()
        if suffix not in ext.ufd.MEDIA_EXTENSIONS:
            continue
        filename = candidate["fileTitle"].removeprefix("File:")
        label = Path(filename).stem
        timeline = ext.ufd.timeline_class(
            fighter_id,
            str(frame_move.get("name") or move_id),
            label,
        )
        is_animation = suffix in ext.ANIMATED_EXTENSIONS or filename.lower() in animated_titles
        source_page = str(
            info.get("descriptionurl")
            or f"{ext.WIKI_BASE}/File:{quote(filename)}"
        )
        record = ext.frame_move_record(fighter_id, fighter, frame_move, source_page)
        variant: dict[str, Any] = {
            "id": f"smashwiki-hitbox-category-{ext.ufd.visual_id(url)}",
            "label": label,
            "downloadUrl": url,
            "sourceFormat": suffix.lstrip("."),
            "mediaType": "animation" if is_animation else "image",
            "timelineClass": timeline,
            "timingBasis": "parent-action" if timeline == "fighter-action" else "independent-source",
            "sourceProvider": "smashwiki",
            "sourcePageUrl": source_page,
            "sourceAttribution": (
                f"SmashWiki {candidate['category']} source; preserve file-page provenance and revision history"
            ),
            "sourceQuality": ext.SOURCE_PRIORITY["smashwiki"],
        }
        if is_animation and suffix == ".png":
            variant["sourceAnimationEvidence"] = "smashwiki-category-animated-images-ssbu"
        record["variants"].append(variant)
        sources["moves"].append(record)
        source_by_key[key] = record
        accepted.append({
            **candidate,
            "sourcePageUrl": source_page,
            "sourceFormat": suffix.lstrip("."),
            "mediaType": variant["mediaType"],
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
    REPORT.write_text(json.dumps({
        "version": 1,
        "sourceLessTargets": sum(len(ids) for ids in targets.values()),
        "fighterHitboxCategoryFileCounts": category_counts,
        "strongCandidates": len(candidates),
        "recoveredSourceLessMoves": len(accepted),
        "skippedAlreadyCoveredByEarlierPasses": skipped_already_covered,
        "warnings": warnings,
        "accepted": accepted,
        "policy": "fighter/game category plus strong filename match establishes source identity; static remains static and timing is vendor-gated",
    }, indent=2) + "\n", encoding="utf-8")
    print(
        f"SmashWiki fighter-hitbox-category sweep recovered {len(accepted)} source-less moves "
        f"from {len(candidates)} strong candidates; {skipped_already_covered} were already covered"
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
