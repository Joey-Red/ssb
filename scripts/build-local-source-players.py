#!/usr/bin/env python3
"""Turn unresolved locally-vendored animations into seekable source timelines.

Exact SSBU-frame coverage stays governed by the existing coverage field. This
post-process only changes how unresolved moving source media is presented: the
encoded animation duration becomes an independent ``source-animation`` timeline
that the existing player can seek/play/pause at 60 Hz. It never upgrades
``partial`` or ``untimed-animation`` coverage and never contacts a runtime host.
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
GAME_FRAME_MS = 1000.0 / 60.0
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
    source_timeline_frames = max(1, round(sum(durations) / GAME_FRAME_MS))
    game_cells = vendor.frame_cells_from_durations(
        durations,
        source_timeline_frames,
        require_duration_match=False,
    )
    if not game_cells:
        raise RuntimeError(f"unable to build source timeline for {fighter_id}:{move_id}:{variant['id']}")

    relative, output = source_sheet_path(fighter_id, move_id, str(variant["id"]))
    sheet = vendor.mapped_sheet(frames, game_cells, output)

    # Keep the factual blocker class exactly as-is. Only the display timeline is
    # independent now, so the UI never labels these source frames as SSBU frames.
    original_timeline = str(variant.get("timelineClass") or "fighter-action")
    original_reason = str(variant.get("coverageReason") or "exact game-frame mapping unavailable")
    variant.update({
        "spriteSheet": {"src": relative, **sheet},
        "timelineClass": "source-animation",
        "timingBasis": "independent-source",
        "timelineTotalFrames": source_timeline_frames,
        "timelineBasis": "encoded-source-duration-display-only",
        "mappingMethod": "source-duration-60fps-display-only",
        "sourcePlaybackOfTimelineClass": original_timeline,
        "coverageReason": original_reason,
    })
    # The seekable sheet replaces the browser-autoplay image path in runtime
    # data. The original animated WebP remains vendored on disk/provenance-backed.
    variant.pop("animationSrc", None)
    return {
        "fighterId": fighter_id,
        "moveId": move_id,
        "variantId": variant["id"],
        "coverage": coverage,
        "sourceFrames": len(frames),
        "sourceTimelineFrames": source_timeline_frames,
        "sourceDurationMs": sum(durations),
        "originalTimelineClass": original_timeline,
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
            "timelineMeaning": "source-animation frames derived only from encoded source durations",
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
