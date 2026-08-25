#!/usr/bin/env python3
"""Recover source-less SSBU moves from conventional SmashWiki filename shorthands.

This is a conservative supplemental discovery pass. SmashWiki historically uses
compact filenames such as SquirtleFTiltSSBU.gif that do not contain the words
"forward tilt", so the general fuzzy matcher can miss them. This pass recognizes
only established move-code shorthands and only adds animated media when the code
maps unambiguously to a move that is still source-less in the freshly generated
audit.

Filename matching is discovery evidence only. Exact timing/coverage still has to
be proven by the normal full-motion vendor; nothing here invents frames or timing.
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
FILENAME_SWEEP = ROOT / "scripts/discover-smashwiki-filename-visuals.py"
FRAME_DATA = ROOT / "src/data/frameData.generated.json"
SOURCES = ROOT / "src/data/visualMediaSources.json"
AUDIT = ROOT / "src/data/visualCoverageAudit.generated.json"
REPORT = ROOT / "src/data/smashwikiShorthandVisuals.generated.json"

spec = importlib.util.spec_from_file_location("ssb_filename_sweep", FILENAME_SWEEP)
if spec is None or spec.loader is None:
    raise RuntimeError(f"unable to load {FILENAME_SWEEP}")
sweep = importlib.util.module_from_spec(spec)
spec.loader.exec_module(sweep)
ext = sweep.ext

# Current frame-data IDs for Pokemon Trainer's individual fighters differ from
# older pt_* aliases used elsewhere in the project. Explicit canonical prefixes
# prevent a zero-file scan for these three fighters.
CURRENT_PREFIX_OVERRIDES = {
    "charizard": ["Charizard"],
    "ivysaur": ["Ivysaur"],
    "squirtle": ["Squirtle"],
}

# Ordered longest/specific first. Values are labels understood by the existing
# conservative move matcher. These are standard Smash filename abbreviations.
SHORTHANDS: tuple[tuple[str, str], ...] = (
    ("rapidjabfinisher", "rapid jab finisher"),
    ("rapidjab", "rapid jab"),
    ("dashattack", "dash attack"),
    ("dashgrab", "dash grab"),
    ("pivotgrab", "pivot grab"),
    ("neutralair", "neutral air"),
    ("forwardair", "forward air"),
    ("backair", "back air"),
    ("upair", "up air"),
    ("downair", "down air"),
    ("neutralspecial", "neutral special"),
    ("sidespecial", "side special"),
    ("upspecial", "up special"),
    ("downspecial", "down special"),
    ("neutralb", "neutral b"),
    ("sideb", "side b"),
    ("upb", "up b"),
    ("downb", "down b"),
    ("fsmash", "forward smash"),
    ("usmash", "up smash"),
    ("dsmash", "down smash"),
    ("ftilt", "forward tilt"),
    ("utilt", "up tilt"),
    ("dtilt", "down tilt"),
    ("nair", "neutral air"),
    ("fair", "forward air"),
    ("bair", "back air"),
    ("uair", "up air"),
    ("dair", "down air"),
    ("fthrow", "forward throw"),
    ("bthrow", "backward throw"),
    ("uthrow", "up throw"),
    ("dthrow", "down throw"),
    ("pummel", "pummel"),
    ("grab", "grab"),
)


def compact(value: str) -> str:
    return re.sub(r"[^a-z0-9]", "", value.lower())


def scan_prefixes(fighter_id: str, fighter: dict[str, Any]) -> list[str]:
    values = [*sweep.filename_prefixes(fighter_id, fighter), *CURRENT_PREFIX_OVERRIDES.get(fighter_id, [])]
    result: list[str] = []
    for value in values:
        normalized = re.sub(r"[^A-Za-z0-9]", "", value)
        if len(normalized) >= 3 and normalized not in result:
            result.append(normalized)
    return result


def title_belongs_to_fighter(title: str, prefixes: list[str]) -> bool:
    stem = compact(Path(title).stem)
    return any(stem.startswith(compact(prefix)) for prefix in prefixes)


def expanded_move_label(title: str, prefixes: list[str]) -> str | None:
    stem = compact(Path(title).stem)
    tails: list[str] = []
    for prefix in prefixes:
        prefix_compact = compact(prefix)
        if stem.startswith(prefix_compact):
            tail = stem[len(prefix_compact):]
            tail = re.sub(r"ssbu.*$", "", tail)
            if tail:
                tails.append(tail)
    for tail in tails:
        for shorthand, label in SHORTHANDS:
            if tail.startswith(shorthand):
                return label
    return None


def candidate_for_image(
    fighter_id: str,
    fighter: dict[str, Any],
    image: dict[str, Any],
    target_ids: set[str],
    prefixes: list[str],
) -> dict[str, Any] | None:
    title = str(image.get("name") or "")
    if "ssbu" not in title.lower() or not title_belongs_to_fighter(title, prefixes):
        return None
    url = str(image.get("url") or "")
    suffix = Path(urlparse(url).path).suffix.lower()
    if suffix not in ext.ANIMATED_EXTENSIONS or suffix not in ext.ufd.MEDIA_EXTENSIONS:
        return None
    expanded = expanded_move_label(title, prefixes)
    if expanded is None:
        return None
    move, score = ext.match_move(expanded, list(fighter.get("moves", [])))
    if move is None or move["id"] not in target_ids:
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
        "expandedLabel": expanded,
        "matchScore": score,
        "id": f"smashwiki-shorthand-{ext.ufd.visual_id(url)}",
        "label": label,
        "downloadUrl": url,
        "sourceFormat": suffix.lstrip("."),
        "mediaType": "animation",
        "timelineClass": timeline,
        "timingBasis": "parent-action" if timeline == "fighter-action" else "independent-source",
        "sourceProvider": "smashwiki",
        "sourcePageUrl": str(image.get("descriptionurl") or f"{ext.WIKI_BASE}/File:{quote(title)}"),
        "sourceAttribution": "SmashWiki SSBU shorthand filename animation; preserve file-page provenance and revision history",
        "sourceQuality": ext.SOURCE_PRIORITY["smashwiki"],
    }


def main() -> int:
    frame_data = json.loads(FRAME_DATA.read_text(encoding="utf-8"))
    sources = json.loads(SOURCES.read_text(encoding="utf-8"))
    audit = json.loads(AUDIT.read_text(encoding="utf-8"))
    if sources.get("version") != 3 or audit.get("version") != 2:
        raise SystemExit("visual source/audit schema mismatch")

    targets: dict[str, set[str]] = defaultdict(set)
    for move in audit.get("movesWithoutVisuals", []):
        targets[move["fighterId"]].add(move["moveId"])

    source_by_key = {(move["fighterId"], move["moveId"]): move for move in sources.get("moves", [])}
    accepted: list[dict[str, Any]] = []
    warnings: list[str] = []
    files_scanned = 0

    for fighter_id in sorted(targets):
        fighter = frame_data.get("fighters", {}).get(fighter_id)
        if not fighter:
            continue
        prefixes = scan_prefixes(fighter_id, fighter)
        seen_titles: set[str] = set()
        best: dict[str, dict[str, Any]] = {}
        fighter_scanned = 0
        try:
            for prefix in prefixes:
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
                    fighter_scanned += len(images)
                    for image in images:
                        title = str(image.get("name") or "")
                        if title in seen_titles:
                            continue
                        seen_titles.add(title)
                        candidate = candidate_for_image(
                            fighter_id, fighter, image, targets[fighter_id], prefixes
                        )
                        if candidate is None:
                            continue
                        previous = best.get(candidate["moveId"])
                        rank = (int(candidate["matchScore"]), len(candidate["label"]))
                        previous_rank = (
                            int(previous["matchScore"]), len(previous["label"])
                        ) if previous else (-1, -1)
                        if previous is None or rank > previous_rank:
                            best[candidate["moveId"]] = candidate
                    continuation = payload.get("continue", {}).get("aicontinue")
                    if not continuation:
                        break

            files_scanned += fighter_scanned
            recovered = 0
            for candidate in best.values():
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
                    "timelineClass", "timingBasis", "sourceProvider", "sourcePageUrl",
                    "sourceAttribution", "sourceQuality",
                )}
                record["variants"].append(variant)
                sources["moves"].append(record)
                source_by_key[key] = record
                accepted.append(candidate)
                recovered += 1
            if recovered or fighter_id in CURRENT_PREFIX_OVERRIDES:
                print(
                    f"[smashwiki-shorthand] {fighter_id}: {recovered} recovered / "
                    f"{fighter_scanned} files scanned"
                )
        except Exception as exc:  # noqa: BLE001
            warnings.append(f"{fighter_id}: {exc}")
            print(f"[smashwiki-shorthand-warning] {fighter_id}: {exc}")

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
        "sourceLessTargets": sum(len(ids) for ids in targets.values()),
        "filesScanned": files_scanned,
        "recoveredSourceLessMoves": len(accepted),
        "warnings": warnings,
        "accepted": accepted,
    }
    REPORT.write_text(json.dumps(report, indent=2) + "\n", encoding="utf-8")
    print(
        f"SmashWiki shorthand sweep recovered {len(accepted)} source-less moves "
        f"from {files_scanned} file records"
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
