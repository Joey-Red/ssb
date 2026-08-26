#!/usr/bin/env python3
"""Recover source-less SSBU moves from conservative SmashWiki filename shorthands.

SmashWiki historically uses compact filenames such as ``SquirtleFTiltSSBU.gif``
and, for some newer uploads, names such as ``LucarioSpotdodge.gif`` that omit an
``SSBU`` token entirely. The latter are still game-verifiable because SmashWiki
places them in ``Category:Animated images (SSBU)``.

This pass therefore accepts an animated file only when either its filename says
SSBU or the MediaWiki category explicitly certifies it as an Ultimate animation.
It recognizes only established move-code shorthands and only adds media when the
expanded label maps unambiguously to a move that is still source-less.

Filename/category matching establishes source identity only. Exact game timing
still has to pass the normal full-motion vendor; no frame mapping is invented.
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

CURRENT_PREFIX_OVERRIDES = {
    "charizard": ["Charizard"],
    "ivysaur": ["Ivysaur"],
    "squirtle": ["Squirtle"],
}

# Ordered longest/specific first. Values are labels understood by the existing
# conservative move matcher. Defense mappings deliberately avoid ambiguous
# abbreviations: a generic AirDodge file is neutral only, and a directional file
# must state its direction in words before it can map to a directional row.
SHORTHANDS: tuple[tuple[str, str], ...] = (
    ("airdodgediagonallydown", "air dodge diagonally down"),
    ("airdodgediagonaldown", "air dodge diagonally down"),
    ("airdodgeleft/right", "air dodge left right"),
    ("airdodgeleftright", "air dodge left right"),
    ("airdodgediagonallyup", "air dodge diagonally up"),
    ("airdodgediagonalup", "air dodge diagonally up"),
    ("neutralairdodge", "neutral air dodge"),
    ("airdodgedown", "air dodge down"),
    ("airdodgeup", "air dodge up"),
    ("airdodgen", "neutral air dodge"),
    ("airdodge", "neutral air dodge"),
    ("spotdodge", "spot dodge"),
    ("forwardroll", "forward roll"),
    ("backwardroll", "backward roll"),
    ("backroll", "backward roll"),
    ("getupattackfaceup", "getup attack face up"),
    ("getupattackfacedown", "getup attack face down"),
    ("floorattackfront", "getup attack face up"),
    ("floorattackback", "getup attack face down"),
    ("floorattacktrip", "trip attack"),
    ("ledgeattack", "ledge attack"),
    ("edgeattack", "ledge attack"),
    ("tripattack", "trip attack"),
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
    ("jab1", "jab 1"),
    ("jab2", "jab 2"),
    ("jab3", "jab 3"),
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

SSBU_ANIMATED_CATEGORY = "Category:Animated images (SSBU)"


def compact(value: str) -> str:
    return re.sub(r"[^a-z0-9]", "", value.lower())


def ssbu_animated_titles() -> set[str]:
    """Return file basenames explicitly categorized as Ultimate animations."""
    titles: set[str] = set()
    continuation: str | None = None
    while True:
        params: dict[str, Any] = {
            "action": "query",
            "format": "json",
            "list": "categorymembers",
            "cmtitle": SSBU_ANIMATED_CATEGORY,
            "cmnamespace": 6,
            "cmlimit": "max",
        }
        if continuation:
            params["cmcontinue"] = continuation
        payload = ext.http_get(ext.WIKI_API, **params).json()
        for row in payload.get("query", {}).get("categorymembers", []):
            title = str(row.get("title") or "")
            if title.startswith("File:"):
                titles.add(title.removeprefix("File:").lower())
        continuation = payload.get("continue", {}).get("cmcontinue")
        if not continuation:
            break
    return titles


def scan_prefixes(fighter_id: str, fighter: dict[str, Any]) -> list[str]:
    values = [*sweep.filename_prefixes(fighter_id, fighter), *CURRENT_PREFIX_OVERRIDES.get(fighter_id, [])]
    result: list[str] = []
    for value in values:
        normalized = re.sub(r"[^A-Za-z0-9]", "", value)
        if len(normalized) >= 3 and normalized not in result:
            result.append(normalized)
    return result


def title_belongs_to_fighter(fighter_id: str, title: str, prefixes: list[str]) -> bool:
    stem = compact(Path(title).stem)
    if not any(stem.startswith(compact(prefix)) for prefix in prefixes):
        return False
    for excluded in sweep.FILENAME_EXCLUDED_PREFIXES.get(fighter_id, set()):
        if stem.startswith(compact(excluded)):
            return False
    return True


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
            if tail.startswith(compact(shorthand)):
                return label
    return None


def candidate_for_image(
    fighter_id: str,
    fighter: dict[str, Any],
    image: dict[str, Any],
    target_ids: set[str],
    prefixes: list[str],
    categorized_ssbu: set[str],
) -> dict[str, Any] | None:
    title = str(image.get("name") or "")
    is_game_verified = "ssbu" in title.lower() or title.lower() in categorized_ssbu
    if not is_game_verified or not title_belongs_to_fighter(fighter_id, title, prefixes):
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
        "sourceAttribution": (
            "SmashWiki SSBU shorthand animation; game identity verified by filename or "
            "Category:Animated images (SSBU); preserve file-page provenance and revision history"
        ),
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

    categorized_ssbu = ssbu_animated_titles()
    if len(categorized_ssbu) < 1000:
        raise SystemExit(
            f"SmashWiki Ultimate animated-media category unexpectedly small: {len(categorized_ssbu)} files"
        )

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
                            fighter_id, fighter, image, targets[fighter_id], prefixes, categorized_ssbu
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
        "version": 2,
        "sourceLessTargets": sum(len(ids) for ids in targets.values()),
        "ssbuAnimatedCategoryFiles": len(categorized_ssbu),
        "filesScanned": files_scanned,
        "recoveredSourceLessMoves": len(accepted),
        "warnings": warnings,
        "accepted": accepted,
    }
    REPORT.write_text(json.dumps(report, indent=2) + "\n", encoding="utf-8")
    print(
        f"SmashWiki shorthand sweep recovered {len(accepted)} source-less moves "
        f"from {files_scanned} file records; {len(categorized_ssbu)} category-verified SSBU animations"
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
