#!/usr/bin/env python3
"""Apply display-only local source-animation sheets to runtime fighter indexes.

The authoritative staged asset manifest keeps its original UFD/SmashWiki
coverage and timeline semantics. This script consumes presentation metadata added
by ``build-local-source-players.py`` and transforms only the public runtime JSON
copy. No source URL is fetched and no factual coverage/audit value is changed.
"""
from __future__ import annotations

import json
from pathlib import Path
from typing import Any

ROOT = Path(__file__).resolve().parents[1]
RUNTIME_DIR = ROOT / "public/data/visual-media"
EXPECTED_FIGHTERS = 89


def transform_variant(variant: dict[str, Any]) -> bool:
    playback_sheet = variant.pop("sourcePlaybackSheet", None)
    playback_count = variant.pop("sourcePlaybackFrameCount", None)
    original_timeline = variant.pop("sourcePlaybackOfTimelineClass", None)
    playback_method = variant.pop("sourcePlaybackMappingMethod", None)
    if not isinstance(playback_sheet, dict) or not isinstance(playback_count, int) or playback_count <= 0:
        return False

    variant.pop("animationSrc", None)
    variant["spriteSheet"] = playback_sheet
    variant["timelineClass"] = "source-animation"
    variant["timingBasis"] = "independent-source"
    variant["timelineTotalFrames"] = playback_count
    variant["timelineBasis"] = "decoded-source-image-sequence-display-only"
    variant["mappingMethod"] = playback_method or "one-decoded-source-image-per-source-frame-display-only"
    variant["sourcePlaybackOfTimelineClass"] = original_timeline or "fighter-action"
    return True


def main() -> int:
    files = sorted(RUNTIME_DIR.glob("*.json"))
    if len(files) != EXPECTED_FIGHTERS:
        raise SystemExit(f"expected {EXPECTED_FIGHTERS} runtime fighter indexes, found {len(files)}")

    transformed = 0
    moves_touched = 0
    for path in files:
        payload = json.loads(path.read_text(encoding="utf-8"))
        if payload.get("version") != 1:
            raise SystemExit(f"runtime visual index schema mismatch: {path.name}")
        for move in payload.get("moves", []):
            touched = False
            for variant in move.get("variants", []):
                if transform_variant(variant):
                    transformed += 1
                    touched = True
            if touched:
                moves_touched += 1
        path.write_text(json.dumps(payload, separators=(",", ":")) + "\n", encoding="utf-8")

    print(f"runtime source-animation players: {transformed} variants across {moves_touched} moves")
    if transformed < 400:
        raise SystemExit(f"unexpectedly low runtime source-animation count: {transformed}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
