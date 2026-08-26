#!/usr/bin/env python3
"""Build seekable display sheets for unresolved locally-vendored animations.

This post-process never changes a staged variant's factual coverage, source
timeline class, timing basis, or exactness metadata. It adds a separate
``sourcePlaybackSheet`` made from the decoded local source images. The runtime
index builder may then expose that sheet as an independent ``source-animation``
player while the authoritative asset/audit layer remains unchanged.

One decoded source image becomes one source-player step. UFD GIF display delays
are often intentionally slowed for human viewing, so they are retained only as
source provenance and are never interpreted as SSBU game-frame timing.
"""
from __future__ import annotations

import importlib.util
import json
import shutil
from collections import Counter
from pathlib import Path
from typing import Any

ROOT = Path(__file__).resolve().parents[1]
VENDOR_SCRIPT = ROOT / "scripts/vendor-full-motion-assets.py"
ASSETS = ROOT / "src/data/visualMediaAssets.generated.json"
PUBLIC = ROOT / "public"
SOURCE_SHEET_ROOT = PUBLIC / "media/source-frame-sheets"
REPORT = ROOT / "src/data/visualSourcePlayers.generated.json"
TARGET_COVERAGE = {"partial", "untimed-animation"}

spec = importlib.util.spec_from_file_location("ssb_vendor_full_motion", VENDOR_SCRIPT)
if spec is None or spec.loader is None:
    raise RuntimeError(f"unable to load {VENDOR_SCRIPT}")
vendor = importlib.util.module_from_spec(spec)
spec.loader.exec_module(vendor)


def safe_local(path: str) -> Path:
    value = Path(path)
    if value.is_absolute() or ".." in value.parts:
        raise RuntimeError(f"unsafe local media path: {path}")
    resolved = PUBLIC / value
    if not resolved.exists():
        raise RuntimeError(f"local animation is missing: {path}")
    return resolved


def source_sheet_path(fighter_id: str, move_id: str, variant_id: str) -> tuple[str, Path]:
    relative = Path("media/source-frame-sheets") / fighter_id / move_id / f"{variant_id}.webp"
    return relative.as_posix(), PUBLIC / relative


def build_source_player(
    fighter_id: str,
    move_id: str,
    variant: dict[str, Any],
) -> dict[str, Any] | None:
    coverage = str(variant.get("coverage") or "")
    animation_src = str(variant.get("animationSrc") or "")
    if coverage not in TARGET_COVERAGE or not animation_src:
        return None

    data = safe_local(animation_src).read_bytes()
    frames, durations, _loop = vendor.source_animation(data)
    source_frame_count = len(frames)
    relative, output = source_sheet_path(fighter_id, move_id, str(variant["id"]))
    sheet = vendor.base.make_sheet(frames, list(range(1, source_frame_count + 1)), output)

    # Runtime-only presentation metadata. Do NOT overwrite spriteSheet,
    # timelineClass, timingBasis, timelineTotalFrames, mappingMethod, or coverage:
    # those fields describe the factual/exact mapping and are audit inputs.
    variant["sourcePlaybackSheet"] = {"src": relative, **sheet}
    variant["sourcePlaybackFrameCount"] = source_frame_count
    variant["sourcePlaybackOfTimelineClass"] = str(variant.get("timelineClass") or "fighter-action")
    variant["sourcePlaybackMappingMethod"] = "one-decoded-source-image-per-source-frame-display-only"

    return {
        "fighterId": fighter_id,
        "moveId": move_id,
        "variantId": variant["id"],
        "coverage": coverage,
        "sourceFrames": source_frame_count,
        "sourceEncodedDurationMs": sum(durations),
        "originalTimelineClass": variant["sourcePlaybackOfTimelineClass"],
        "sheet": relative,
    }


def main() -> int:
    payload = json.loads(ASSETS.read_text(encoding="utf-8"))
    if payload.get("version") != 3 or not isinstance(payload.get("moves"), dict):
        raise SystemExit("visual media assets must use schema version 3")

    shutil.rmtree(SOURCE_SHEET_ROOT, ignore_errors=True)
    SOURCE_SHEET_ROOT.mkdir(parents=True, exist_ok=True)

    generated: list[dict[str, Any]] = []
    coverage_counts: Counter[str] = Counter()
    for key, move_assets in sorted(payload["moves"].items()):
        fighter_id, move_id = key.split(":", 1)
        for variant in move_assets.get("variants", []):
            # Clear stale presentation metadata if this script is rerun after a
            # coverage classification changed.
            for field in (
                "sourcePlaybackSheet",
                "sourcePlaybackFrameCount",
                "sourcePlaybackOfTimelineClass",
                "sourcePlaybackMappingMethod",
            ):
                variant.pop(field, None)
            built = build_source_player(fighter_id, move_id, variant)
            if built is None:
                continue
            generated.append(built)
            coverage_counts[str(built["coverage"])] += 1

    ASSETS.write_text(json.dumps(payload, indent=2) + "\n", encoding="utf-8")
    report = {
        "version": 1,
        "playerCount": len(generated),
        "coverageCounts": dict(sorted(coverage_counts.items())),
        "policy": {
            "runtimeAssets": "same-origin locally vendored source media",
            "gameFrameExact": False,
            "changesCoverageAudit": False,
            "changesFactualAssetTimeline": False,
            "timelineMeaning": "one player step equals one decoded source image; source GIF display delays are not SSBU timing evidence",
        },
        "players": generated,
    }
    REPORT.write_text(json.dumps(report, indent=2) + "\n", encoding="utf-8")
    print(
        "local source players: "
        f"{len(generated)} seekable unresolved animations "
        f"({dict(sorted(coverage_counts.items()))})"
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
