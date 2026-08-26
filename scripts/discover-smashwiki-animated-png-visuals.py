#!/usr/bin/env python3
"""Recover source-less moves from SmashWiki's category-verified animated PNGs.

Some Ultimate animations are APNG files whose public filename still ends in
``.png``. The normal filename sweeps intentionally require an animation-looking
extension and therefore skip these files. This supplemental pass considers only
PNG files explicitly listed in SmashWiki's ``Animated images (SSBU)`` category,
then applies the same fighter-prefix and conservative move-name matching used by
the shorthand discovery pass.

Category membership proves that the source file is an Ultimate animation. It does
not prove a missing substate, timing, or exact game-frame mapping; move matching
must still be unambiguous and the full-motion vendor remains the timing gate.
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
REPORT = ROOT / "src/data/smashwikiAnimatedPngVisuals.generated.json"

spec = importlib.util.spec_from_file_location("ssb_smashwiki_shorthand_png", SHORTHAND)
if spec is None or spec.loader is None:
    raise RuntimeError(f"unable to load {SHORTHAND}")
short = importlib.util.module_from_spec(spec)
spec.loader.exec_module(short)
ext = short.ext

SPECIAL_CODES: tuple[tuple[str, str], ...] = (
    ("nspecial", "neutral special"),
    ("sspecial", "side special"),
    ("uspecial", "up special"),
    ("dspecial", "down special"),
)


def expanded_move_label(title: str, prefixes: list[str]) -> str | None:
    expanded = short.expanded_move_label(title, prefixes)
    if expanded is not None:
        return expanded

    # SmashWiki also uses compact N/S/U/D-Special filenames such as
    # DaisySSpecialSSBU.png. Expand those names for matching, but still match
    # against the complete move list so a generic special can never be silently
    # reassigned to a missing aerial/charged substate.
    stem = short.compact(Path(title).stem)
    for prefix in prefixes:
        prefix_compact = short.compact(prefix)
        if not stem.startswith(prefix_compact):
            continue
        tail = stem[len(prefix_compact):]
        tail = re.sub(r"ssbu.*$", "", tail)
        for code, label in SPECIAL_CODES:
            if tail.startswith(code):
                return label
    return None


def candidate_for_image(
    fighter_id: str,
    fighter: dict[str, Any],
    image: dict[str, Any],
    target_ids: set[str],
    prefixes: list[str],
    categorized: set[str],
) -> dict[str, Any] | None:
    title = str(image.get("name") or "")
    if title.lower() not in categorized:
        return None
    if not short.title_belongs_to_fighter(fighter_id, title, prefixes):
        return None
    url = str(image.get("url") or "")
    suffix = Path(urlparse(url).path).suffix.lower()
    if suffix != ".png":
        return None

    expanded = expanded_move_label(title, prefixes)
    if expanded is None:
        return None

    # Match against the complete fighter move list first. A generic file such as
    # ``SSpecial`` must not be reassigned to a source-less aerial/charged substate
    # merely because that is the only target still missing.
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
        "id": f"smashwiki-animated-png-{ext.ufd.visual_id(url)}",
        "label": label,
        "downloadUrl": url,
        "sourceFormat": "png",
        "mediaType": "animation",
        "timelineClass": timeline,
        "timingBasis": "parent-action" if timeline == "fighter-action" else "independent-source",
        "sourceProvider": "smashwiki",
        "sourcePageUrl": str(image.get("descriptionurl") or f"{ext.WIKI_BASE}/File:{quote(title)}"),
        "sourceAttribution": (
            "SmashWiki Category:Animated images (SSBU) APNG/PNG animation; preserve "
            "file-page provenance and revision history"
        ),
        "sourceQuality": ext.SOURCE_PRIORITY["smashwiki"],
        "sourceAnimationEvidence": "smashwiki-category-animated-images-ssbu",
    }


def main() -> int:
    frame_data = json.loads(FRAME_DATA.read_text(encoding="utf-8"))
    sources = json.loads(SOURCES.read_text(encoding="utf-8"))
    audit = json.loads(AUDIT.read_text(encoding="utf-8"))
    if sources.get("version") != 3 or audit.get("version") != 2:
        raise SystemExit("visual source/audit schema mismatch")

    targets: dict[str, set[str]] = defaultdict(set)
    for row in audit.get("movesWithoutVisuals", []):
        targets[row["fighterId"]].add(row["moveId"])

    categorized = short.ssbu_animated_titles()
    if len(categorized) < 1000:
        raise SystemExit(
            f"SmashWiki Ultimate animated-media category unexpectedly small: {len(categorized)} files"
        )

    source_by_key = {
        (move["fighterId"], move["moveId"]): move
        for move in sources.get("moves", [])
    }
    accepted: list[dict[str, Any]] = []
    warnings: list[str] = []
    files_scanned = 0
    category_png_seen = 0

    for fighter_id in sorted(targets):
        fighter = frame_data.get("fighters", {}).get(fighter_id)
        if not fighter:
            continue
        prefixes = short.scan_prefixes(fighter_id, fighter)
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
                        if title.lower() in categorized and title.lower().endswith(".png"):
                            category_png_seen += 1
                        candidate = candidate_for_image(
                            fighter_id, fighter, image, targets[fighter_id], prefixes, categorized
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
                    "sourceAttribution", "sourceQuality", "sourceAnimationEvidence",
                )}
                record["variants"].append(variant)
                sources["moves"].append(record)
                source_by_key[key] = record
                accepted.append(candidate)
        except Exception as exc:  # noqa: BLE001
            warnings.append(f"{fighter_id}: {exc}")
            print(f"[smashwiki-animated-png-warning] {fighter_id}: {exc}")

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
        "categoryFiles": len(categorized),
        "sourceLessTargets": sum(len(ids) for ids in targets.values()),
        "filesScanned": files_scanned,
        "categoryAnimatedPngFilesSeen": category_png_seen,
        "recoveredSourceLessMoves": len(accepted),
        "warnings": warnings,
        "accepted": accepted,
    }, indent=2) + "\n", encoding="utf-8")
    print(
        f"SmashWiki animated-PNG sweep recovered {len(accepted)} source-less moves; "
        f"saw {category_png_seen} category-verified PNG animations in {files_scanned} file records"
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
