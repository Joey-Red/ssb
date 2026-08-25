#!/usr/bin/env python3
"""Recover source-less moves whose SmashWiki files use separated fighter prefixes.

The primary filename sweep intentionally avoids broad first-word searches because
they can cross-contaminate fighters (for example Mii variants or Bowser/Bowser
Jr.). MediaWiki file prefixes are not normalized, though: some valid files use
`Duck_Hunt_...`, `Mega_Man_...`, `Min_Min_...`, or similar separated names while
others concatenate the fighter name. This pass searches only full fighter-name
prefixes with separators, then reuses the strict fighter-identity and move
matching rules from the primary filename sweep.
"""
from __future__ import annotations

import importlib.util
import json
import re
from collections import defaultdict
from pathlib import Path
from typing import Any

ROOT = Path(__file__).resolve().parents[1]
BASE_SCRIPT = ROOT / "scripts/discover-smashwiki-filename-visuals.py"
FRAME_DATA = ROOT / "src/data/frameData.generated.json"
SOURCES = ROOT / "src/data/visualMediaSources.json"
AUDIT = ROOT / "src/data/visualCoverageAudit.generated.json"
REPORT = ROOT / "src/data/smashwikiSeparatedPrefixVisuals.generated.json"

spec = importlib.util.spec_from_file_location("ssb_smashwiki_filename_discovery", BASE_SCRIPT)
if spec is None or spec.loader is None:
    raise RuntimeError(f"unable to load {BASE_SCRIPT}")
base = importlib.util.module_from_spec(spec)
spec.loader.exec_module(base)
ext = base.ext


def separated_prefixes(fighter_id: str, fighter: dict[str, Any]) -> list[str]:
    display = ext.wiki_display(fighter_id, fighter)
    names = [display, *base.FILENAME_PREFIX_OVERRIDES.get(fighter_id, [])]
    prefixes: list[str] = []
    for name in names:
        tokens = re.findall(r"[A-Za-z0-9]+", name)
        if len(tokens) < 2:
            continue
        for separator in ("_", " "):
            prefix = separator.join(tokens)
            if len(prefix) >= 3 and prefix not in prefixes:
                prefixes.append(prefix)
    return prefixes


def scan_fighter(
    fighter_id: str,
    fighter: dict[str, Any],
    target_ids: set[str],
) -> tuple[list[dict[str, Any]], int]:
    moves = list(fighter.get("moves", []))
    seen_titles: set[str] = set()
    raw_matches: list[dict[str, Any]] = []
    files_scanned = 0

    for prefix in separated_prefixes(fighter_id, fighter):
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
                if not base.title_matches_fighter(fighter_id, fighter, title):
                    continue
                move, score = ext.match_move(title, moves)
                if move is None or move["id"] not in target_ids:
                    continue
                candidate = base.animation_candidate(fighter_id, move, image, score)
                if candidate is not None:
                    candidate["id"] = candidate["id"].replace(
                        "smashwiki-filename-", "smashwiki-separated-", 1
                    )
                    raw_matches.append(candidate)
            continuation = payload.get("continue", {}).get("aicontinue")
            if not continuation:
                break

    best: dict[tuple[str, str], dict[str, Any]] = {}
    for candidate in raw_matches:
        key = (candidate["moveId"], candidate["timelineClass"])
        previous = best.get(key)
        rank = (int(candidate["matchScore"]), len(candidate["label"]))
        previous_rank = (
            int(previous["matchScore"]), len(previous["label"])
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

    source_by_key = {
        (move["fighterId"], move["moveId"]): move
        for move in sources.get("moves", [])
    }
    targets: dict[str, set[str]] = defaultdict(set)
    for move in audit.get("movesWithoutVisuals", []):
        key = (move["fighterId"], move["moveId"])
        if key not in source_by_key:
            targets[move["fighterId"]].add(move["moveId"])

    accepted: list[dict[str, Any]] = []
    warnings: list[str] = []
    scanned_files = 0

    for fighter_id in sorted(targets):
        fighter = frame_data.get("fighters", {}).get(fighter_id)
        if not fighter:
            continue
        try:
            candidates, fighter_scanned = scan_fighter(fighter_id, fighter, targets[fighter_id])
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
                record["variants"].append(variant)
                sources["moves"].append(record)
                source_by_key[key] = record
                accepted.append(candidate)
        except Exception as exc:  # noqa: BLE001
            warnings.append(f"{fighter_id}: {exc}")
            print(f"[smashwiki-separated-warning] {fighter_id}: {exc}")

    sources["moves"].sort(key=lambda move: (move["fighterId"], move["moveId"]))
    timeline_counts: dict[str, int] = defaultdict(int)
    for move in sources["moves"]:
        for variant in move.get("variants", []):
            timeline_counts[str(variant.get("timelineClass", "fighter-action"))] += 1
    sources.update({
        "source": "Ultimate Frame Data + curated external SSBU visual archives",
        "generatedBy": (
            str(sources.get("generatedBy") or "").rstrip() +
            " + scripts/discover-smashwiki-separated-prefix-visuals.py"
        ).strip(" +"),
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
        "recoveredSourceLessMoves": len(accepted),
        "warnings": warnings,
        "accepted": accepted,
    }
    REPORT.write_text(json.dumps(report, indent=2) + "\n", encoding="utf-8")
    print(
        f"SmashWiki separated-prefix sweep recovered {len(accepted)} source-less moves "
        f"from {scanned_files} file records"
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
