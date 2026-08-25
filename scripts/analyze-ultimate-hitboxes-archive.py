#!/usr/bin/env python3
"""Corroborate unresolved SSBU timelines from Ultimate Hitboxes metadata only.

The public Ultimate Hitboxes repositories expose useful v13.0.1 frame-count and
hitbox-frame metadata, but the preserved rendered-frame repository does not
publish a redistribution license. This project therefore treats that material as
reference/corroboration only: this script downloads JSON metadata, never frame
images, never changes source-backed coverage, and never reduces the deterministic
capture queue by itself.

The generated report records only unambiguous fighter/move matches where the
archive's frame count exactly agrees with the project's documented fighter-action
length and, when both sides expose an active span, the active bounds agree too.
That information can tighten later research/capture verification without turning
unlicensed media into runtime evidence.
"""
from __future__ import annotations

import importlib.util
import json
import re
from collections import defaultdict
from datetime import datetime, timezone
from pathlib import Path
from typing import Any
from urllib.parse import quote

import requests

ROOT = Path(__file__).resolve().parents[1]
FRAME_DATA = ROOT / "src/data/frameData.generated.json"
SOURCES = ROOT / "src/data/visualMediaSources.json"
COVERAGE = ROOT / "src/data/visualMediaCoverage.generated.json"
REPORT = ROOT / "src/data/ultimateHitboxesArchive.generated.json"
EXTERNAL_DISCOVERY = ROOT / "scripts/discover-external-visuals.py"
UFD_DISCOVERY = ROOT / "scripts/discover-ufd-visuals.py"

ARCHIVE_REPOSITORY = "joaorb64/ultimate-hitboxes"
ORIGINAL_REPOSITORY = "RSN-Bran/ultimate-hitboxes"
METADATA_REF = "073bcdc985a209dd571b273971998f2fc9219386"
ARCHIVE_VERSION = "v13.0.1"
RAW_BASE = f"https://raw.githubusercontent.com/{ARCHIVE_REPOSITORY}/{METADATA_REF}"
CHARACTER_DATA_URL = f"{RAW_BASE}/server/data/characterData.json"
TIMEOUT = 45
RESOLVED = {"full", "source-timed", "exact-static"}


def load_module(name: str, path: Path) -> Any:
    spec = importlib.util.spec_from_file_location(name, path)
    if spec is None or spec.loader is None:
        raise RuntimeError(f"unable to load {path}")
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


external = load_module("ssb_external_discovery_archive_reference", EXTERNAL_DISCOVERY)
ufd = load_module("ssb_ufd_discovery_archive_reference", UFD_DISCOVERY)


def http_json(url: str) -> Any:
    response = requests.get(
        url,
        timeout=TIMEOUT,
        headers={
            "User-Agent": "SSBUTrainingGuideArchiveMetadataAudit/1.0",
            "Accept": "application/json,text/plain,*/*",
        },
    )
    response.raise_for_status()
    return response.json()


def compact(value: Any) -> str:
    return re.sub(r"[^a-z0-9]+", "", str(value or "").lower())


def fighter_match(fighter_id: str, fighter: dict[str, Any], entries: list[dict[str, Any]]) -> dict[str, Any] | None:
    wanted = {compact(fighter_id), compact(fighter.get("name"))}
    matches = [
        entry for entry in entries
        if wanted & {compact(entry.get("value")), compact(entry.get("name"))}
        and entry.get("completed") is True
        and entry.get("version") == ARCHIVE_VERSION
    ]
    unique = {f"{entry.get('number')}:{entry.get('value')}": entry for entry in matches}
    return next(iter(unique.values())) if len(unique) == 1 else None


def project_active_span(move: dict[str, Any], source_move: dict[str, Any] | None) -> list[int]:
    if source_move:
        span = source_move.get("activeSpan") or []
        if len(span) == 2:
            return [int(span[0]), int(span[1])]
    startup = move.get("startupFrame") if move.get("startupFrame") is not None else move.get("startup")
    try:
        span = ufd.active_span(move.get("active"), startup, move.get("totalFrames"))
    except Exception:  # noqa: BLE001
        span = None
    return list(span) if span else []


def archive_active_span(move: dict[str, Any]) -> list[int]:
    frames: set[int] = set()
    for field in ("hitboxes", "grabboxes"):
        for box in move.get(field, []) or []:
            for number in box.get("frames", []) or []:
                if isinstance(number, int) and number > 0:
                    frames.add(number)
    return [min(frames), max(frames)] if frames else []


def unresolved_move_ids(
    frame_data: dict[str, Any],
    source: dict[str, Any],
    coverage: dict[str, Any],
) -> dict[str, set[str]]:
    result: dict[str, set[str]] = defaultdict(set)
    source_keys = {(move["fighterId"], move["moveId"]) for move in source.get("moves", [])}
    for fighter_id, fighter in frame_data.get("fighters", {}).items():
        for move in fighter.get("moves", []):
            if (fighter_id, move["id"]) not in source_keys:
                result[fighter_id].add(move["id"])
    for gap in coverage.get("gaps", []):
        if gap.get("coverage") not in RESOLVED and gap.get("timelineClass") == "fighter-action":
            result[str(gap["fighterId"])].add(str(gap["moveId"]))
    return result


def main() -> int:
    frame_data = json.loads(FRAME_DATA.read_text(encoding="utf-8"))
    source = json.loads(SOURCES.read_text(encoding="utf-8"))
    coverage = json.loads(COVERAGE.read_text(encoding="utf-8"))
    entries = http_json(CHARACTER_DATA_URL)
    if not isinstance(entries, list):
        raise SystemExit("Ultimate Hitboxes characterData.json is not a list")

    completed_versions = {entry.get("version") for entry in entries if entry.get("completed") is True}
    if completed_versions != {ARCHIVE_VERSION}:
        raise SystemExit(f"archive version mismatch: {sorted(str(value) for value in completed_versions)}")

    source_moves = {(move["fighterId"], move["moveId"]): move for move in source.get("moves", [])}
    unresolved = unresolved_move_ids(frame_data, source, coverage)
    corroborations: list[dict[str, Any]] = []
    disagreements: list[dict[str, Any]] = []
    unmatched_fighters: list[str] = []

    for fighter_id, move_ids in sorted(unresolved.items()):
        fighter = frame_data.get("fighters", {}).get(fighter_id)
        if not fighter:
            continue
        entry = fighter_match(fighter_id, fighter, entries)
        if entry is None:
            unmatched_fighters.append(fighter_id)
            continue
        directory = f"{entry['number']}_{entry['value']}"
        archive_fighter = http_json(f"{RAW_BASE}/server/data/{quote(directory)}.json")
        project_moves = list(fighter.get("moves", []))
        project_by_id = {move["id"]: move for move in project_moves}

        candidates_by_move: dict[str, list[tuple[int, dict[str, Any]]]] = defaultdict(list)
        for archive_move in archive_fighter.get("moves", []):
            label = f"{archive_move.get('name', '')} {archive_move.get('value', '')}"
            matched, score = external.match_move(label, project_moves)
            if matched is not None and matched["id"] in move_ids and score >= 180:
                candidates_by_move[matched["id"]].append((int(score), archive_move))

        for move_id in sorted(move_ids):
            options = sorted(candidates_by_move.get(move_id, []), key=lambda item: item[0], reverse=True)
            if not options:
                continue
            if len(options) > 1 and options[0][0] == options[1][0]:
                disagreements.append({
                    "fighterId": fighter_id,
                    "moveId": move_id,
                    "reason": "ambiguous-archive-move-match",
                })
                continue
            score, archive_move = options[0]
            project_move = project_by_id[move_id]
            project_total = project_move.get("totalFrames")
            archive_total = archive_move.get("frames")
            if not isinstance(project_total, int) or project_total <= 0 or not isinstance(archive_total, int):
                continue
            project_span = project_active_span(project_move, source_moves.get((fighter_id, move_id)))
            archive_span = archive_active_span(archive_move)
            total_agrees = archive_total == project_total
            active_agrees = not (project_span and archive_span) or project_span == archive_span
            row = {
                "fighterId": fighter_id,
                "moveId": move_id,
                "archiveMove": archive_move.get("value"),
                "archiveMoveName": archive_move.get("name"),
                "matchScore": score,
                "projectTotalFrames": project_total,
                "archiveFrameCount": archive_total,
                "projectActiveSpan": project_span,
                "archiveActiveSpan": archive_span,
                "metadataUrl": f"https://github.com/{ARCHIVE_REPOSITORY}/blob/{METADATA_REF}/server/data/{quote(directory)}.json",
            }
            if total_agrees and active_agrees:
                corroborations.append(row)
            else:
                row["reason"] = "frame-count-mismatch" if not total_agrees else "active-span-mismatch"
                disagreements.append(row)

    report = {
        "version": 1,
        "generatedAt": datetime.now(timezone.utc).replace(microsecond=0).isoformat().replace("+00:00", "Z"),
        "provider": "ultimate-hitboxes-metadata-reference",
        "originalRepository": ORIGINAL_REPOSITORY,
        "preservedRepository": ARCHIVE_REPOSITORY,
        "metadataRef": METADATA_REF,
        "gameVersion": ARCHIVE_VERSION,
        "redistributionStatus": "reference-only; no redistribution license is recorded for the preserved rendered-frame repository",
        "runtimeAssetsImported": 0,
        "coverageBlockersResolved": 0,
        "unresolvedMovesConsidered": sum(len(values) for values in unresolved.values()),
        "metadataCorroborations": len(corroborations),
        "metadataDisagreements": len(disagreements),
        "unmatchedFighters": unmatched_fighters,
        "corroborations": corroborations,
        "disagreements": disagreements,
    }
    REPORT.write_text(json.dumps(report, indent=2) + "\n", encoding="utf-8")
    print(
        f"Ultimate Hitboxes metadata reference: {len(corroborations)} exact corroborations, "
        f"{len(disagreements)} disagreements; imported 0 runtime assets"
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
