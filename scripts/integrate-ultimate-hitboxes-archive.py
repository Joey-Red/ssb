#!/usr/bin/env python3
"""Integrate preserved v13.0.1 Ultimate Hitboxes frame sequences conservatively.

The original Ultimate Hitboxes project by RSN-Bran rendered SSBU moves one game
frame at a time. A maintained public fork by joaorb64 preserves optimized WebP
versions of those numbered frames on an `assets-web` branch. This maintenance
pass uses that archive only to replace an unresolved source variant (or supply a
source-less move) when all of the following are true:

- fighter and move matching are unambiguous;
- the archive metadata declares SSBU v13.0.1;
- the archive sequence length exactly equals the documented project timeline;
- fighter-action hitbox bounds agree with the project's documented active span
  when both sources expose those bounds;
- the complete numbered sequence can be downloaded from one immutable commit.

No interpolation, timing inference, generated pose, or fabricated collision data
is permitted. Auxiliary timelines are currently limited to exact landing
sequences with an exact landing-lag length match. Existing resolved variants and
other auxiliary timelines are never replaced by this pass.
"""
from __future__ import annotations

import hashlib
import importlib.util
import io
import json
import re
from collections import Counter, defaultdict
from concurrent.futures import ThreadPoolExecutor, as_completed
from dataclasses import dataclass
from datetime import datetime, timezone
from pathlib import Path
from typing import Any
from urllib.parse import quote

import requests
from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
FRAME_DATA = ROOT / "src/data/frameData.generated.json"
SOURCES = ROOT / "src/data/visualMediaSources.json"
ASSETS = ROOT / "src/data/visualMediaAssets.generated.json"
COVERAGE = ROOT / "src/data/visualMediaCoverage.generated.json"
PROVENANCE = ROOT / "public/media/asset-provenance.json"
REPORT = ROOT / "src/data/ultimateHitboxesArchive.generated.json"
VENDOR_STATIC = ROOT / "scripts/vendor-static-assets.py"
VENDOR_FULL = ROOT / "scripts/vendor-full-motion-assets.py"
EXTERNAL_DISCOVERY = ROOT / "scripts/discover-external-visuals.py"
UFD_DISCOVERY = ROOT / "scripts/discover-ufd-visuals.py"

ARCHIVE_REPOSITORY = "joaorb64/ultimate-hitboxes"
ORIGINAL_REPOSITORY = "RSN-Bran/ultimate-hitboxes"
# Immutable revisions: master contains v13.0.1 metadata; assets-web contains the
# optimized numbered WebP frames deployed by the maintained fork.
METADATA_REF = "073bcdc985a209dd571b273971998f2fc9219386"
ASSET_REF = "bf627bb972dbbf3f0e9e8209fd9318eaabd7b7f9"
ARCHIVE_VERSION = "v13.0.1"
RAW_BASE = f"https://raw.githubusercontent.com/{ARCHIVE_REPOSITORY}"
GITHUB_BASE = f"https://github.com/{ARCHIVE_REPOSITORY}"
CHARACTER_DATA_URL = f"{RAW_BASE}/{METADATA_REF}/server/data/characterData.json"
MAX_WORKERS = 8
TIMEOUT = 45
RESOLVED = {"full", "source-timed", "exact-static"}


def load_module(name: str, path: Path) -> Any:
    spec = importlib.util.spec_from_file_location(name, path)
    if spec is None or spec.loader is None:
        raise RuntimeError(f"unable to load {path}")
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


base = load_module("ssb_vendor_static", VENDOR_STATIC)
vendor = load_module("ssb_vendor_full", VENDOR_FULL)
external = load_module("ssb_external_discovery", EXTERNAL_DISCOVERY)
ufd = load_module("ssb_ufd_discovery_for_archive", UFD_DISCOVERY)


@dataclass(frozen=True)
class Target:
    fighter_id: str
    move_id: str
    timeline_class: str
    expected_frames: int
    variant_id: str | None
    variant_label: str | None
    project_score_floor: int

    @property
    def key(self) -> str:
        suffix = self.variant_id or "source-less"
        return f"{self.fighter_id}:{self.move_id}:{self.timeline_class}:{suffix}"


@dataclass(frozen=True)
class Candidate:
    target: Target
    fighter_entry: dict[str, Any]
    archive_move: dict[str, Any]
    project_score: int
    variant_score: int

    @property
    def rank(self) -> tuple[int, int, str]:
        return (self.variant_score, self.project_score, str(self.archive_move.get("value") or ""))


def utc_now() -> str:
    return datetime.now(timezone.utc).replace(microsecond=0).isoformat().replace("+00:00", "Z")


def http_json(url: str) -> Any:
    response = requests.get(
        url,
        timeout=TIMEOUT,
        headers={
            "User-Agent": "SSBUTrainingGuideArchiveIntegrator/1.0",
            "Accept": "application/json,text/plain,*/*",
        },
    )
    response.raise_for_status()
    return response.json()


def compact(value: Any) -> str:
    return re.sub(r"[^a-z0-9]+", "", str(value or "").lower())


def camel_words(value: str) -> str:
    value = re.sub(r"([a-z0-9])([A-Z])", r"\1 \2", value)
    value = re.sub(r"[_-]+", " ", value)
    return " ".join(value.split())


def source_index(source: dict[str, Any]) -> dict[tuple[str, str], dict[str, Any]]:
    return {(move["fighterId"], move["moveId"]): move for move in source.get("moves", [])}


def staged_index(assets: dict[str, Any]) -> dict[str, dict[str, Any]]:
    return assets.setdefault("moves", {})


def project_active_span(move: dict[str, Any], source_move: dict[str, Any] | None) -> list[int]:
    if source_move:
        span = source_move.get("activeSpan") or []
        if len(span) == 2:
            return [int(span[0]), int(span[1])]
    total = move.get("totalFrames")
    startup = move.get("startupFrame") if move.get("startupFrame") is not None else move.get("startup")
    try:
        span = ufd.active_span(move.get("active"), startup, total)
    except Exception:  # noqa: BLE001 - absence of parsable active data is not evidence of a mismatch
        span = None
    return list(span) if span else []


def archive_active_span(move: dict[str, Any]) -> list[int]:
    frames: set[int] = set()
    for field in ("hitboxes", "grabboxes"):
        for box in move.get(field, []) or []:
            for number in box.get("frames", []) or []:
                if isinstance(number, int) and number > 0:
                    frames.add(number)
    if not frames:
        return []
    return [min(frames), max(frames)]


def timeline_expected(
    timeline_class: str,
    project_move: dict[str, Any],
    source_move: dict[str, Any] | None,
) -> int | None:
    if timeline_class == "landing":
        value = (source_move or {}).get("landingLag") or project_move.get("landingLag")
    else:
        value = (source_move or {}).get("totalFrames") or project_move.get("totalFrames")
    return int(value) if isinstance(value, int) and value > 0 else None


def unresolved_targets(
    frame_data: dict[str, Any],
    source: dict[str, Any],
    assets: dict[str, Any],
) -> tuple[list[Target], dict[tuple[str, str], dict[str, Any]], dict[str, dict[str, Any]]]:
    sources = source_index(source)
    staged = staged_index(assets)
    targets: list[Target] = []

    for fighter_id, fighter in frame_data.get("fighters", {}).items():
        for move in fighter.get("moves", []):
            move_id = move["id"]
            key = f"{fighter_id}:{move_id}"
            source_move = sources.get((fighter_id, move_id))
            staged_move = staged.get(key)
            staged_variants = list((staged_move or {}).get("variants", []))

            if source_move is None:
                expected = timeline_expected("fighter-action", move, None)
                if expected is not None:
                    span = project_active_span(move, None)
                    if not (len(span) == 2 and span[1] > expected):
                        targets.append(Target(fighter_id, move_id, "fighter-action", expected, None, None, 180))
                continue

            source_variants = {
                base.safe_name(variant["id"]): variant
                for variant in source_move.get("variants", [])
            }
            for staged_variant in staged_variants:
                coverage = staged_variant.get("coverage", "partial")
                timeline = str(staged_variant.get("timelineClass") or "fighter-action")
                if coverage in RESOLVED or timeline not in {"fighter-action", "landing"}:
                    continue
                expected = timeline_expected(timeline, move, source_move)
                if expected is None:
                    continue
                if timeline == "fighter-action":
                    span = project_active_span(move, source_move)
                    if len(span) == 2 and span[1] > expected:
                        continue
                source_variant = source_variants.get(staged_variant["id"], {})
                targets.append(Target(
                    fighter_id=fighter_id,
                    move_id=move_id,
                    timeline_class=timeline,
                    expected_frames=expected,
                    variant_id=staged_variant["id"],
                    variant_label=str(source_variant.get("label") or staged_variant.get("label") or staged_variant["id"]),
                    project_score_floor=180,
                ))
    return targets, sources, staged


def fighter_match(
    fighter_id: str,
    fighter: dict[str, Any],
    archive_entries: list[dict[str, Any]],
) -> dict[str, Any] | None:
    wanted = {compact(fighter_id), compact(fighter.get("name"))}
    matches = [
        entry for entry in archive_entries
        if wanted & {compact(entry.get("value")), compact(entry.get("name"))}
    ]
    unique = {f"{entry.get('number')}:{entry.get('value')}": entry for entry in matches}
    if len(unique) == 1:
        entry = next(iter(unique.values()))
        if entry.get("completed") is True and entry.get("version") == ARCHIVE_VERSION:
            return entry
    return None


def move_match_score(label: str, project_moves: list[dict[str, Any]]) -> tuple[dict[str, Any] | None, int]:
    move, score = external.match_move(label, project_moves)
    return move, int(score)


def variant_match_score(target: Target, archive_move: dict[str, Any]) -> int:
    if target.variant_id is None:
        return 0
    archive_values = {
        compact(archive_move.get("value")),
        compact(archive_move.get("name")),
    }
    target_values = {compact(target.variant_id), compact(target.variant_label)}
    best = 0
    for archive_value in archive_values:
        for target_value in target_values:
            if not archive_value or not target_value:
                continue
            if archive_value == target_value:
                best = max(best, 2200 + len(archive_value))
            elif len(archive_value) >= 5 and len(target_value) >= 5 and (
                archive_value in target_value or target_value in archive_value
            ):
                best = max(best, 1600 + min(len(archive_value), len(target_value)))
    return best


def candidate_timeline(archive_move: dict[str, Any]) -> str:
    label = f"{archive_move.get('name', '')} {camel_words(str(archive_move.get('value') or ''))}"
    return "landing" if "landing" in external.canonical(label).split() else "fighter-action"


def candidate_project_label(archive_move: dict[str, Any], timeline_class: str) -> list[str]:
    name = str(archive_move.get("name") or "")
    value = camel_words(str(archive_move.get("value") or ""))
    labels = [name, value]
    if timeline_class == "landing":
        labels.extend([
            re.sub(r"\blanding\b", " ", name, flags=re.IGNORECASE),
            re.sub(r"\blanding\b", " ", value, flags=re.IGNORECASE),
        ])
    return [" ".join(label.split()) for label in labels if label.strip()]


def archive_metadata_url(entry: dict[str, Any]) -> str:
    directory = f"{entry['number']}_{entry['value']}"
    return f"{GITHUB_BASE}/blob/{METADATA_REF}/server/data/{quote(directory)}.json"


def frame_directory(entry: dict[str, Any], archive_move: dict[str, Any]) -> str:
    return f"frames/{entry['number']}_{entry['value']}/{archive_move['value']}"


def frame_url(entry: dict[str, Any], archive_move: dict[str, Any], frame_number: int) -> str:
    directory = frame_directory(entry, archive_move)
    path = "/".join(quote(part, safe="._-") for part in directory.split("/"))
    return f"{RAW_BASE}/{ASSET_REF}/{path}/{frame_number}.webp"


def build_candidates(
    frame_data: dict[str, Any],
    targets: list[Target],
    archive_entries: list[dict[str, Any]],
    source_moves: dict[tuple[str, str], dict[str, Any]],
) -> tuple[list[Candidate], list[dict[str, Any]]]:
    targets_by_fighter: dict[str, list[Target]] = defaultdict(list)
    for target in targets:
        targets_by_fighter[target.fighter_id].append(target)

    selected: list[Candidate] = []
    rejected: list[dict[str, Any]] = []
    for fighter_id, fighter_targets in targets_by_fighter.items():
        fighter = frame_data["fighters"][fighter_id]
        entry = fighter_match(fighter_id, fighter, archive_entries)
        if entry is None:
            rejected.append({"fighterId": fighter_id, "reason": "archive-fighter-not-unambiguously-matched"})
            continue
        directory = f"{entry['number']}_{entry['value']}"
        try:
            archive_data = http_json(f"{RAW_BASE}/{METADATA_REF}/server/data/{quote(directory)}.json")
        except Exception as exc:  # noqa: BLE001
            rejected.append({"fighterId": fighter_id, "reason": f"archive-metadata-fetch-failed: {exc}"})
            continue
        if archive_data.get("value") != entry.get("value"):
            rejected.append({"fighterId": fighter_id, "reason": "archive-fighter-metadata-mismatch"})
            continue

        project_moves = list(fighter.get("moves", []))
        project_by_id = {move["id"]: move for move in project_moves}
        targets_for_key: dict[tuple[str, str], list[Target]] = defaultdict(list)
        for target in fighter_targets:
            targets_for_key[(target.move_id, target.timeline_class)].append(target)

        options: dict[str, list[Candidate]] = defaultdict(list)
        for archive_move in archive_data.get("moves", []):
            frame_count = archive_move.get("frames")
            if not isinstance(frame_count, int) or frame_count <= 0:
                continue
            timeline = candidate_timeline(archive_move)
            best_project: dict[str, tuple[dict[str, Any], int]] = {}
            for label in candidate_project_label(archive_move, timeline):
                move, score = move_match_score(label, project_moves)
                if move is None:
                    continue
                current = best_project.get(move["id"])
                if current is None or score > current[1]:
                    best_project[move["id"]] = (move, score)
            if not best_project:
                continue
            move, project_score = max(best_project.values(), key=lambda item: item[1])
            matching_targets = targets_for_key.get((move["id"], timeline), [])
            if not matching_targets:
                continue

            project_move = project_by_id[move["id"]]
            source_move = source_moves.get((fighter_id, move["id"]))
            expected = timeline_expected(timeline, project_move, source_move)
            if expected is None or frame_count != expected:
                continue
            if timeline == "fighter-action":
                project_span = project_active_span(project_move, source_move)
                archive_span = archive_active_span(archive_move)
                if len(project_span) == 2 and archive_span and archive_span != project_span:
                    rejected.append({
                        "fighterId": fighter_id,
                        "moveId": move["id"],
                        "archiveMove": archive_move.get("value"),
                        "reason": f"active-span-mismatch project={project_span} archive={archive_span}",
                    })
                    continue

            for target in matching_targets:
                if target.expected_frames != frame_count or project_score < target.project_score_floor:
                    continue
                direct = variant_match_score(target, archive_move)
                # Existing variants must match their specific source identity. A
                # single unresolved timeline may fall back to a very strong move
                # match; multiple unresolved alternates require a direct identity
                # match so one base animation cannot erase distinct variants.
                siblings = matching_targets
                if target.variant_id is not None and direct == 0:
                    if len(siblings) != 1 or project_score < 700:
                        continue
                    direct = 500 + project_score
                options[target.key].append(Candidate(target, entry, archive_move, project_score, direct))

        used_archive_moves: set[str] = set()
        # Resolve direct/high-confidence targets before fallback targets.
        for target in sorted(fighter_targets, key=lambda item: (item.variant_id is None, item.key)):
            ranked = sorted(options.get(target.key, []), key=lambda item: item.rank, reverse=True)
            ranked = [item for item in ranked if str(item.archive_move.get("value")) not in used_archive_moves]
            if not ranked:
                continue
            if len(ranked) > 1 and ranked[0].rank[:2] == ranked[1].rank[:2]:
                rejected.append({"target": target.key, "reason": "ambiguous-archive-move-match"})
                continue
            chosen = ranked[0]
            used_archive_moves.add(str(chosen.archive_move.get("value")))
            selected.append(chosen)
    return selected, rejected


def remove_variant_files(variant: dict[str, Any]) -> None:
    paths: set[str] = set()
    for field in ("imageSrc", "animationSrc"):
        value = variant.get(field)
        if isinstance(value, str):
            paths.add(value)
    sheet = variant.get("spriteSheet")
    if isinstance(sheet, dict) and isinstance(sheet.get("src"), str):
        paths.add(sheet["src"])
    for relative in paths:
        path = base.PUBLIC / relative.lstrip("/")
        try:
            path.unlink(missing_ok=True)
        except OSError:
            pass


def stage_candidate(candidate: Candidate) -> dict[str, Any]:
    target = candidate.target
    archive_move = candidate.archive_move
    entry = candidate.fighter_entry
    expected = target.expected_frames
    frames: list[Image.Image] = []
    digest = hashlib.sha256()
    source_page = f"{GITHUB_BASE}/tree/{ASSET_REF}/{frame_directory(entry, archive_move)}"

    for number in range(1, expected + 1):
        url = frame_url(entry, archive_move, number)
        data = base.fetch_bytes(url, referer=source_page)
        digest.update(number.to_bytes(4, "big"))
        digest.update(hashlib.sha256(data).digest())
        image = base.open_rgba(data)
        image.thumbnail((base.MAX_EDGE, base.MAX_EDGE), Image.Resampling.LANCZOS)
        frames.append(image)

    variant_id = base.safe_name(f"ultimate-hitboxes-{archive_move['value']}")
    relative = f"media/frame-sheets/{target.fighter_id}/{target.move_id}/{variant_id}.webp"
    sheet = base.make_sheet(frames, list(range(1, expected + 1)), base.PUBLIC / relative)
    timeline = target.timeline_class
    provenance_note = (
        f"Ultimate Hitboxes {ARCHIVE_VERSION} numbered frame archive: one preserved rendered WebP for every "
        f"game frame 1-{expected}; metadata from {ORIGINAL_REPOSITORY}, optimized frame preservation from "
        f"{ARCHIVE_REPOSITORY}@{ASSET_REF}. Sequence length exactly matches the documented "
        f"{'landing timeline' if timeline == 'landing' else 'fighter action'}; no interpolation or inferred frames."
    )
    generated_variant = {
        "id": variant_id,
        "label": f"Ultimate Hitboxes — {archive_move.get('name') or archive_move['value']}",
        "sha256": digest.hexdigest(),
        "spriteSheet": {"src": relative, **sheet},
        "coverage": "full",
        "coverageReason": f"preserved {ARCHIVE_VERSION} numbered frame sequence covers frames 1-{expected} one source image per game frame",
        "sourceFrameCount": expected,
        "sourceDurationMs": round(expected * (1000 / 60), 3),
        "timelineClass": timeline,
        "timelineTotalFrames": expected,
        "timingBasis": "parent-action" if timeline == "fighter-action" else "independent-source",
        "timelineBasis": "ultimate-hitboxes-v13.0.1-numbered-frame-sequence",
        "mappingMethod": "one-source-image-per-game-frame",
        "sourceFormat": "webp-sequence",
        "interactionEvidence": "embedded-source",
        "sourceUrl": source_page,
        "provenanceNote": provenance_note,
    }
    source_variant = {
        "id": variant_id,
        "label": f"Ultimate Hitboxes {archive_move.get('name') or archive_move['value']}",
        "downloadUrl": frame_url(entry, archive_move, 1),
        "sourceFormat": "webp",
        "mediaType": "image",
        "timelineClass": timeline,
        "timingBasis": "parent-action" if timeline == "fighter-action" else "independent-source",
        "sourceProvider": "ultimate-hitboxes-archive",
        "sourceUrl": source_page,
        "provenanceNote": provenance_note,
        "archiveSequence": {
            "originalRepository": ORIGINAL_REPOSITORY,
            "preservedRepository": ARCHIVE_REPOSITORY,
            "metadataRef": METADATA_REF,
            "assetRef": ASSET_REF,
            "gameVersion": ARCHIVE_VERSION,
            "directory": frame_directory(entry, archive_move),
            "frameCount": expected,
        },
    }
    return {
        "target": target,
        "entry": entry,
        "archiveMove": archive_move,
        "generatedVariant": generated_variant,
        "sourceVariant": source_variant,
        "sourcePage": source_page,
    }


def new_source_move(
    fighter_id: str,
    fighter: dict[str, Any],
    move: dict[str, Any],
    entry: dict[str, Any],
) -> dict[str, Any]:
    span = project_active_span(move, None)
    return {
        "fighterId": fighter_id,
        "moveId": move["id"],
        "label": f"{fighter.get('name') or fighter_id} {move.get('name') or move['id']}",
        "sourceUrl": archive_metadata_url(entry),
        "totalFrames": move.get("totalFrames") if isinstance(move.get("totalFrames"), int) else None,
        "startupFrame": move.get("startupFrame") if move.get("startupFrame") is not None else move.get("startup"),
        "active": move.get("active"),
        "activeSpan": span,
        "landingLag": move.get("landingLag") if isinstance(move.get("landingLag"), int) else None,
        "variants": [],
    }


def recompute_source_metadata(source: dict[str, Any], frame_data: dict[str, Any]) -> None:
    fighter_order = {fighter_id: index for index, fighter_id in enumerate(frame_data.get("fighters", {}))}
    move_order: dict[tuple[str, str], int] = {}
    for fighter_id, fighter in frame_data.get("fighters", {}).items():
        for index, move in enumerate(fighter.get("moves", [])):
            move_order[(fighter_id, move["id"])] = index
    source["moves"].sort(key=lambda move: (
        fighter_order.get(move["fighterId"], 999),
        move_order.get((move["fighterId"], move["moveId"]), 9999),
        move["moveId"],
    ))
    source["mappedMoves"] = len(source["moves"])
    source["mappedVariants"] = sum(len(move.get("variants", [])) for move in source["moves"])
    source["fightersWithVisuals"] = len({move["fighterId"] for move in source["moves"]})
    counts = Counter(
        str(variant.get("timelineClass") or "fighter-action")
        for move in source["moves"]
        for variant in move.get("variants", [])
    )
    source["timelineCounts"] = dict(sorted(counts.items()))
    augmentations = source.setdefault("augmentationSources", [])
    descriptor = {
        "provider": "ultimate-hitboxes-archive",
        "originalRepository": ORIGINAL_REPOSITORY,
        "preservedRepository": ARCHIVE_REPOSITORY,
        "metadataRef": METADATA_REF,
        "assetRef": ASSET_REF,
        "gameVersion": ARCHIVE_VERSION,
    }
    augmentations[:] = [item for item in augmentations if item.get("provider") != descriptor["provider"]]
    augmentations.append(descriptor)


def main() -> int:
    frame_data = json.loads(FRAME_DATA.read_text(encoding="utf-8"))
    source = json.loads(SOURCES.read_text(encoding="utf-8"))
    assets = json.loads(ASSETS.read_text(encoding="utf-8"))
    if source.get("version") != 3 or assets.get("version") != 3:
        raise SystemExit("visual source/assets schema mismatch")

    archive_entries = http_json(CHARACTER_DATA_URL)
    if not isinstance(archive_entries, list):
        raise SystemExit("Ultimate Hitboxes characterData.json is not a list")
    versions = {entry.get("version") for entry in archive_entries if entry.get("completed") is True}
    if versions != {ARCHIVE_VERSION}:
        raise SystemExit(f"archive version mismatch: {sorted(str(value) for value in versions)}")

    targets, sources, staged = unresolved_targets(frame_data, source, assets)
    candidates, rejected = build_candidates(frame_data, targets, archive_entries, sources)
    print(f"Ultimate Hitboxes archive: {len(targets)} eligible unresolved targets / {len(candidates)} exact candidate sequences")

    staged_results: list[dict[str, Any]] = []
    failures: list[dict[str, Any]] = []
    with ThreadPoolExecutor(max_workers=MAX_WORKERS) as pool:
        futures = {pool.submit(stage_candidate, candidate): candidate for candidate in candidates}
        for future in as_completed(futures):
            candidate = futures[future]
            try:
                staged_results.append(future.result())
            except Exception as exc:  # noqa: BLE001
                failures.append({"target": candidate.target.key, "archiveMove": candidate.archive_move.get("value"), "reason": str(exc)})

    frame_lookup = {
        (fighter_id, move["id"]): (fighter, move)
        for fighter_id, fighter in frame_data.get("fighters", {}).items()
        for move in fighter.get("moves", [])
    }
    integrated = 0
    replaced_variants = 0
    source_less_added = 0
    landing_added = 0
    integrated_rows: list[dict[str, Any]] = []

    for result in sorted(staged_results, key=lambda item: item["target"].key):
        target: Target = result["target"]
        key = f"{target.fighter_id}:{target.move_id}"
        source_move = sources.get((target.fighter_id, target.move_id))
        staged_move = staged.get(key)
        if source_move is None:
            fighter, project_move = frame_lookup[(target.fighter_id, target.move_id)]
            source_move = new_source_move(target.fighter_id, fighter, project_move, result["entry"])
            source["moves"].append(source_move)
            sources[(target.fighter_id, target.move_id)] = source_move
            staged_move = {"variants": []}
            staged[key] = staged_move
            source_less_added += 1

        if staged_move is None:
            raise SystemExit(f"staged asset record missing for discovered source move: {key}")

        if target.variant_id is not None:
            kept_staged: list[dict[str, Any]] = []
            removed = False
            for variant in staged_move.get("variants", []):
                if variant.get("id") == target.variant_id:
                    remove_variant_files(variant)
                    removed = True
                else:
                    kept_staged.append(variant)
            if not removed:
                # A prior successful target may have already replaced this exact
                # source identity; never guess at a different record.
                failures.append({"target": target.key, "reason": "target-staged-variant-disappeared"})
                continue
            staged_move["variants"] = kept_staged
            source_move["variants"] = [
                variant for variant in source_move.get("variants", [])
                if base.safe_name(variant["id"]) != target.variant_id
            ]
            replaced_variants += 1

        generated_variant = result["generatedVariant"]
        source_variant = result["sourceVariant"]
        if any(base.safe_name(item["id"]) == generated_variant["id"] for item in source_move.get("variants", [])):
            failures.append({"target": target.key, "reason": "duplicate-archive-variant-id"})
            continue
        source_move.setdefault("variants", []).append(source_variant)
        staged_move.setdefault("variants", []).append(generated_variant)
        if target.timeline_class == "landing":
            landing_added += 1
        integrated += 1
        integrated_rows.append({
            "fighterId": target.fighter_id,
            "moveId": target.move_id,
            "timelineClass": target.timeline_class,
            "replacedVariantId": target.variant_id,
            "archiveMove": result["archiveMove"].get("value"),
            "archiveMoveName": result["archiveMove"].get("name"),
            "frameCount": target.expected_frames,
            "sourceUrl": result["sourcePage"],
            "mappingMethod": "one-source-image-per-game-frame",
        })

    recompute_source_metadata(source, frame_data)
    generated_at = utc_now()
    assets["generatedAt"] = generated_at
    SOURCES.write_text(json.dumps(source, indent=2) + "\n", encoding="utf-8")
    ASSETS.write_text(json.dumps(assets, indent=2) + "\n", encoding="utf-8")

    coverage = vendor.coverage_report(assets["moves"])
    COVERAGE.write_text(json.dumps(coverage, indent=2) + "\n", encoding="utf-8")

    media_bytes = base.directory_bytes(base.PUBLIC / "media")
    if media_bytes > base.MEDIA_BUDGET_BYTES:
        raise SystemExit(
            f"archive-integrated media is {media_bytes / 1024 / 1024:.1f} MiB, above "
            f"{base.MEDIA_BUDGET_BYTES / 1024 / 1024:.0f} MiB budget"
        )
    provenance = json.loads(PROVENANCE.read_text(encoding="utf-8")) if PROVENANCE.exists() else {"version": 3}
    provenance.update({
        "visualMoveCount": len(assets["moves"]),
        "visualVariantCount": coverage["variantCount"],
        "fullExactVariantCount": coverage["fullExactVariants"],
        "sourceTimedVariantCount": coverage["sourceTimedVariants"],
        "exactStaticVariantCount": coverage["exactStaticVariants"],
        "visualCoverageGapCount": coverage["gapCount"],
        "mediaBytes": media_bytes,
        "ultimateHitboxesArchive": {
            "originalRepository": ORIGINAL_REPOSITORY,
            "preservedRepository": ARCHIVE_REPOSITORY,
            "metadataRef": METADATA_REF,
            "assetRef": ASSET_REF,
            "gameVersion": ARCHIVE_VERSION,
            "integratedExactVariants": integrated,
        },
    })
    PROVENANCE.write_text(json.dumps(provenance, indent=2) + "\n", encoding="utf-8")

    report = {
        "version": 1,
        "generatedAt": generated_at,
        "provider": "ultimate-hitboxes-archive",
        "originalRepository": ORIGINAL_REPOSITORY,
        "preservedRepository": ARCHIVE_REPOSITORY,
        "metadataRef": METADATA_REF,
        "assetRef": ASSET_REF,
        "gameVersion": ARCHIVE_VERSION,
        "eligibleTargets": len(targets),
        "exactCandidates": len(candidates),
        "integratedExactVariants": integrated,
        "replacedUnresolvedVariants": replaced_variants,
        "sourceLessMovesAdded": source_less_added,
        "landingVariantsAdded": landing_added,
        "downloadFailures": failures,
        "rejections": rejected,
        "remainingUnresolvedVariants": coverage["unresolvedVariants"],
        "integrated": integrated_rows,
    }
    REPORT.write_text(json.dumps(report, indent=2) + "\n", encoding="utf-8")
    print(
        f"archive integration: {integrated} exact variants ({source_less_added} source-less moves, "
        f"{landing_added} landing timelines); {coverage['unresolvedVariants']} discovered variants remain unresolved"
    )
    if failures:
        print(f"archive integration retained {len(failures)} download/integration failures for the capture queue")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
