#!/usr/bin/env python3
"""Generate conservative SSBU visual timing overrides from Ruben_dal's 13.0.1 game-data dump.

The resolver only touches current `missing-documented-timing` fighter-action gaps.
For ordinary fighter motions, Ruben's Motion CancelFrame is interpreted as FAF,
so Total Frames = CancelFrame - 1. Before applying that rule to a fighter, the
script validates it against that fighter's already-documented ordinary actions:
at least five known moves must match exactly and zero may disagree.

Specials are stricter: both the grounded and aerial base motion must exist with
an identical positive CancelFrame. Variable/loop/hold/start/end state machines
are intentionally not inferred here. Generated overrides are separate from the
human-reviewed override registry and can never replace manual review entries.
"""
from __future__ import annotations

import json
import re
from pathlib import Path
from typing import Any
from urllib.parse import quote

from curl_cffi import requests as browser_requests

ROOT = Path(__file__).resolve().parents[1]
FRAME_DATA = ROOT / "src/data/frameData.generated.json"
COVERAGE = ROOT / "src/data/visualMediaCoverage.generated.json"
SOURCES = ROOT / "src/data/visualMediaSources.json"
MANUAL_OVERRIDES = ROOT / "src/data/visualTimelineOverrides.json"
OUT = ROOT / "src/data/rubenTimingOverrides.generated.json"

PATCH = "13.0.1"
API_ROOT = f"https://api.github.com/repos/rubendal/ssbu/contents/public/data/patch/{PATCH}/character"
RAW_ROOT = f"https://raw.githubusercontent.com/rubendal/ssbu/master/public/data/patch/{PATCH}/character"
BLOB_ROOT = f"https://github.com/rubendal/ssbu/blob/master/public/data/patch/{PATCH}/character"
TIMEOUT = 45


def compact(value: str) -> str:
    return re.sub(r"[^a-z0-9]+", "", value.lower().replace("&", "and"))


def norm(value: str) -> str:
    value = value.lower().replace("&", " and ")
    value = re.sub(r"[^a-z0-9]+", " ", value)
    return " ".join(value.split())


def positive_int(value: Any) -> int | None:
    if isinstance(value, int):
        return value if value > 0 else None
    match = re.search(r"\d+", str(value or ""))
    if not match:
        return None
    parsed = int(match.group())
    return parsed if parsed > 0 else None


def base_move_name(move: dict[str, Any]) -> str:
    text = str(move.get("name") or move["id"])
    text = re.sub(r"\s*\([^)]*\)\s*", " ", text)
    return norm(text)


def ordinary_motion_kind(move: dict[str, Any]) -> str | None:
    name = base_move_name(move)
    aliases = {
        "jab 1": "attack_11", "neutral attack 1": "attack_11",
        "jab 2": "attack_12", "neutral attack 2": "attack_12",
        "jab 3": "attack_13", "neutral attack 3": "attack_13",
        "dash attack": "attack_dash",
        "forward tilt": "attack_s3_s", "f tilt": "attack_s3_s", "ftilt": "attack_s3_s",
        "up tilt": "attack_hi3", "u tilt": "attack_hi3", "utilt": "attack_hi3",
        "down tilt": "attack_lw3", "d tilt": "attack_lw3", "dtilt": "attack_lw3",
        "forward smash": "attack_s4_s", "f smash": "attack_s4_s", "fsmash": "attack_s4_s",
        "up smash": "attack_hi4", "u smash": "attack_hi4", "usmash": "attack_hi4",
        "down smash": "attack_lw4", "d smash": "attack_lw4", "dsmash": "attack_lw4",
        "neutral air": "attack_air_n", "neutral aerial": "attack_air_n", "nair": "attack_air_n",
        "forward air": "attack_air_f", "forward aerial": "attack_air_f", "fair": "attack_air_f",
        "back air": "attack_air_b", "back aerial": "attack_air_b", "bair": "attack_air_b",
        "up air": "attack_air_hi", "up aerial": "attack_air_hi", "uair": "attack_air_hi",
        "down air": "attack_air_lw", "down aerial": "attack_air_lw", "dair": "attack_air_lw",
        "grab": "catch", "standing grab": "catch",
        "dash grab": "catch_dash", "pivot grab": "catch_turn",
        "pummel": "catch_attack",
        "forward throw": "throw_f", "fthrow": "throw_f",
        "back throw": "throw_b", "bthrow": "throw_b",
        "up throw": "throw_hi", "uthrow": "throw_hi",
        "down throw": "throw_lw", "dthrow": "throw_lw",
        "ledge attack": "cliff_attack_quick", "edge attack": "cliff_attack_quick",
        "trip attack": "slip_attack",
        "getup attack face up": "down_attack_u",
        "get up attack face up": "down_attack_u",
        "getup attack face down": "down_attack_d",
        "get up attack face down": "down_attack_d",
    }
    if name in aliases:
        return aliases[name]
    for alias, motion in sorted(aliases.items(), key=lambda item: len(item[0]), reverse=True):
        if name.startswith(alias + " ") and not any(token in name for token in ("rapid", "charge", "charged", "late")):
            return motion
    return None


def special_axis(move: dict[str, Any]) -> str | None:
    name = base_move_name(move)
    for prefix, axis in (("neutral b", "n"), ("neutral special", "n"), ("side b", "s"), ("side special", "s"), ("up b", "hi"), ("up special", "hi"), ("down b", "lw"), ("down special", "lw")):
        if name == prefix or name.startswith(prefix + " "):
            return axis
    return None


def http_json(url: str) -> Any:
    response = browser_requests.get(
        url,
        impersonate="chrome",
        timeout=TIMEOUT,
        headers={"User-Agent": "SSBUTrainingGuideTimingResolver/1.0", "Accept-Language": "en-US,en;q=0.9"},
    )
    response.raise_for_status()
    return response.json()


def character_directories() -> dict[str, str]:
    payload = http_json(API_ROOT)
    mapping: dict[str, str] = {}
    for item in payload:
        if item.get("type") != "dir":
            continue
        name = str(item.get("name") or "")
        mapping[compact(name)] = name
    aliases = {
        "iceclimbers": "IceClimber",
        "rosalinaandluma": "RosalinaLuma",
        "rob": "Robot",
        "mrgameandwatch": "MrGameWatch",
        "banjoandkazooie": "BanjoKazooie",
    }
    for key, value in aliases.items():
        if compact(value) in mapping:
            mapping[key] = mapping[compact(value)]
    return mapping


def fighter_directory(fighter_id: str, fighter: dict[str, Any], directories: dict[str, str]) -> str | None:
    candidates = [fighter.get("name"), fighter_id.replace("-", " ")]
    for candidate in candidates:
        key = compact(str(candidate or ""))
        if key in directories:
            return directories[key]
    return None


def motion_table(payload: dict[str, Any]) -> dict[str, dict[str, Any]]:
    """Flatten Ruben's article-keyed motion lists into motion-kind lookup."""
    root = payload.get("Motions") or payload.get("motions") or {}
    rows: list[dict[str, Any]] = []
    if isinstance(root, dict):
        for values in root.values():
            if isinstance(values, list):
                rows.extend(item for item in values if isinstance(item, dict))
    elif isinstance(root, list):
        rows.extend(item for item in root if isinstance(item, dict))

    result: dict[str, dict[str, Any]] = {}
    for motion in rows:
        kind = str(motion.get("MotionKind") or motion.get("motionKind") or "").lower()
        if not kind:
            game_hash = str(motion.get("GameHash") or motion.get("gameHash") or "").lower()
            kind = game_hash.removeprefix("game_")
        if kind:
            result[kind] = motion
    return result


def cancel_frame(motions: dict[str, dict[str, Any]], kind: str) -> int | None:
    motion = motions.get(kind.lower())
    if not motion:
        return None
    value = motion.get("CancelFrame") if "CancelFrame" in motion else motion.get("cancelFrame")
    if isinstance(value, (int, float)) and value > 1:
        return int(round(float(value)))
    return None


def standard_validation(fighter: dict[str, Any], motions: dict[str, dict[str, Any]]) -> tuple[int, list[str]]:
    matched = 0
    mismatches: list[str] = []
    for move in fighter.get("moves", []):
        kind = ordinary_motion_kind(move)
        documented = positive_int(move.get("totalFrames"))
        if not kind or documented is None:
            continue
        cancel = cancel_frame(motions, kind)
        if cancel is None:
            continue
        derived = cancel - 1
        if derived == documented:
            matched += 1
        else:
            mismatches.append(f"{move['id']}:{kind} ruben={derived} documented={documented}")
    return matched, mismatches


def candidate_total(move: dict[str, Any], motions: dict[str, dict[str, Any]]) -> tuple[int | None, str | None]:
    ordinary = ordinary_motion_kind(move)
    if ordinary:
        cancel = cancel_frame(motions, ordinary)
        return (cancel - 1, ordinary) if cancel else (None, None)

    axis = special_axis(move)
    if axis:
        ground_kind = f"special_{axis}"
        air_kind = f"special_air_{axis}"
        ground = cancel_frame(motions, ground_kind)
        air = cancel_frame(motions, air_kind)
        if ground and air and ground == air:
            return ground - 1, f"{ground_kind}+{air_kind}"
    return None, None


def main() -> int:
    frame_data = json.loads(FRAME_DATA.read_text(encoding="utf-8"))
    coverage = json.loads(COVERAGE.read_text(encoding="utf-8"))
    sources = json.loads(SOURCES.read_text(encoding="utf-8"))
    manual = json.loads(MANUAL_OVERRIDES.read_text(encoding="utf-8"))
    if coverage.get("version") != 2 or sources.get("version") != 3 or manual.get("version") != 1:
        raise SystemExit("visual timing resolver schema mismatch")

    missing = [
        gap for gap in coverage.get("gaps", [])
        if gap.get("blockerClass") == "missing-documented-timing" and gap.get("timelineClass") == "fighter-action"
    ]
    targets_by_fighter: dict[str, list[dict[str, Any]]] = {}
    for gap in missing:
        targets_by_fighter.setdefault(gap["fighterId"], []).append(gap)

    source_moves = {(move["fighterId"], move["moveId"]): move for move in sources.get("moves", [])}
    directories = character_directories()
    entries: dict[str, dict[str, Any]] = {}
    diagnostics: dict[str, Any] = {}

    for fighter_id in sorted(targets_by_fighter):
        fighter = frame_data.get("fighters", {}).get(fighter_id)
        if not fighter:
            continue
        directory = fighter_directory(fighter_id, fighter, directories)
        if not directory:
            diagnostics[fighter_id] = {"status": "no-ruben-directory"}
            continue
        raw_url = f"{RAW_ROOT}/{quote(directory, safe='')}/data.json"
        try:
            payload = http_json(raw_url)
        except Exception as exc:  # noqa: BLE001
            diagnostics[fighter_id] = {"status": "fetch-failed", "error": str(exc)}
            continue
        motions = motion_table(payload)
        validation_matches, mismatches = standard_validation(fighter, motions)
        trusted = validation_matches >= 5 and not mismatches
        resolved = 0
        skipped = 0
        for gap in targets_by_fighter[fighter_id]:
            key = f"{fighter_id}:{gap['moveId']}:{gap['variantId']}"
            if key in manual.get("entries", {}):
                skipped += 1
                continue
            move = next((item for item in fighter.get("moves", []) if item["id"] == gap["moveId"]), None)
            if not move or positive_int(move.get("totalFrames")) is not None or not trusted:
                skipped += 1
                continue
            total, motion_basis = candidate_total(move, motions)
            if total is None or total <= 0 or motion_basis is None:
                skipped += 1
                continue
            source_move = source_moves.get((fighter_id, gap["moveId"]))
            source_variant = next((item for item in (source_move or {}).get("variants", []) if re.sub(r"[^a-zA-Z0-9._-]+", "-", str(item.get("id") or "")).strip("-.")[:96].lower() == gap["variantId"]), None)
            if source_variant is None:
                skipped += 1
                continue
            page_url = f"{BLOB_ROOT}/{quote(directory, safe='')}/data.json"
            entries[key] = {
                "totalFrames": total,
                "timelineClass": "fighter-action",
                "sourceUrl": page_url,
                "provenanceNote": (
                    f"SSBU {PATCH} Ruben_dal motion data: {motion_basis} CancelFrame is exposed as FAF by the source viewer; "
                    f"Total Frames derived as CancelFrame - 1. This fighter passed {validation_matches} exact "
                    "known-total checks with zero mismatches. Base specials additionally require identical grounded/air CancelFrame."
                ),
                "generatedTimingEvidence": {
                    "provider": "rubendal-ssbu-13.0.1",
                    "motionKind": motion_basis,
                    "validationMatches": validation_matches,
                },
            }
            resolved += 1
        diagnostics[fighter_id] = {
            "status": "trusted" if trusted else "validation-failed",
            "validationMatches": validation_matches,
            "validationMismatches": mismatches,
            "resolvedTimingGaps": resolved,
            "skippedTimingGaps": skipped,
            "rubenDirectory": directory,
        }

    output = {
        "version": 1,
        "source": f"rubendal/ssbu patch {PATCH}",
        "policy": "generated game-data timing evidence only; manual reviewed overrides take precedence",
        "targetTimingGaps": len(missing),
        "resolvedTimingGaps": len(entries),
        "entries": dict(sorted(entries.items())),
        "diagnostics": diagnostics,
    }
    OUT.write_text(json.dumps(output, indent=2) + "\n", encoding="utf-8")
    print(f"Ruben timing: resolved {len(entries)}/{len(missing)} missing documented fighter-action timing gaps")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
