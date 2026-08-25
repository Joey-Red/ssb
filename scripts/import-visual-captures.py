#!/usr/bin/env python3
"""Validate deterministic local frame captures and register reviewed overrides.

Capture directories are intentionally external input. This importer refuses
incomplete/non-sequential sets and requires provenance metadata before writing a
reviewed override. It does not download game files or synthesize missing frames.
"""
from __future__ import annotations

import argparse
import json
import re
from pathlib import Path
from typing import Any

ROOT = Path(__file__).resolve().parents[1]
QUEUE_PATH = ROOT / "src/data/visualCaptureQueue.generated.json"
OVERRIDES_PATH = ROOT / "src/data/visualTimelineOverrides.json"


def frame_files(directory: Path) -> list[Path]:
    files = sorted(path for path in directory.glob("*.png") if re.fullmatch(r"\d{4,6}\.png", path.name))
    expected = [f"{index:04d}.png" for index in range(1, len(files) + 1)]
    actual = [path.name for path in files]
    if actual != expected:
        raise SystemExit(f"capture frames must be contiguous 0001.png..N.png in {directory}")
    return files


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("capture_root", type=Path)
    parser.add_argument("--key", action="append", default=[], help="capture queue key to import; may be repeated")
    parser.add_argument("--dry-run", action="store_true")
    args = parser.parse_args()

    queue = json.loads(QUEUE_PATH.read_text(encoding="utf-8"))
    overrides = json.loads(OVERRIDES_PATH.read_text(encoding="utf-8"))
    if queue.get("version") != 1 or overrides.get("version") != 1:
        raise SystemExit("capture queue/override schema mismatch")

    selected = set(args.key)
    imported = 0
    for job in queue.get("jobs", []):
        key = job["key"]
        if selected and key not in selected:
            continue
        directory = args.capture_root / job["fighterId"] / job["moveId"] / job["variantId"]
        metadata_path = directory / "capture.json"
        if not metadata_path.exists():
            continue
        metadata = json.loads(metadata_path.read_text(encoding="utf-8"))
        frames = frame_files(directory)
        if not frames:
            raise SystemExit(f"capture contains no PNG frames: {key}")
        if int(metadata.get("fps", 0)) != 60:
            raise SystemExit(f"capture must declare 60 FPS: {key}")
        if metadata.get("advanceMode") != "one-game-frame-at-a-time":
            raise SystemExit(f"capture must use one-game-frame-at-a-time advancement: {key}")
        for required in ("gameVersion", "captureTool", "capturedBy", "provenanceNote"):
            if not str(metadata.get(required, "")).strip():
                raise SystemExit(f"capture metadata missing {required}: {key}")
        target = job.get("documentedTargetFrames")
        if isinstance(target, int) and target > 0 and len(frames) != target:
            raise SystemExit(f"capture {key} has {len(frames)} frames; documented target is {target}")

        entry: dict[str, Any] = {
            "timelineClass": job["timelineClass"],
            "totalFrames": len(frames),
            "mappingMethod": "reviewed-local-frame-capture",
            "captureDirectory": str(directory.resolve()),
            "sourceUrl": job.get("sourceUrl"),
            "gameVersion": metadata["gameVersion"],
            "captureTool": metadata["captureTool"],
            "capturedBy": metadata["capturedBy"],
            "provenanceNote": metadata["provenanceNote"],
            "interactionDisplay": metadata.get("interactionDisplay", "unknown"),
        }
        if not args.dry_run:
            overrides.setdefault("entries", {})[key] = entry
        imported += 1
        print(f"validated capture: {key} ({len(frames)} frames)")

    if selected and imported != len(selected):
        missing = selected - set(overrides.get("entries", {}))
        if missing:
            raise SystemExit("requested capture keys were not imported: " + ", ".join(sorted(missing)))
    if not args.dry_run:
        OVERRIDES_PATH.write_text(json.dumps(overrides, indent=2) + "\n", encoding="utf-8")
    print(f"validated {imported} capture set(s)")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
