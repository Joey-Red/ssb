#!/usr/bin/env python3
"""Validate deterministic local captures and persist reviewed runtime media.

Capture directories are external input. This importer refuses incomplete/non-
sequential sets, requires provenance, converts the reviewed frame sequence to a
same-origin sprite sheet, and records that immutable asset in the override
registry. It never downloads game files, interpolates frames, or invents missing
collision/timing data.
"""
from __future__ import annotations

import argparse
import hashlib
import json
import math
import re
from pathlib import Path
from typing import Any

from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
QUEUE_PATH = ROOT / "src/data/visualCaptureQueue.generated.json"
OVERRIDES_PATH = ROOT / "src/data/visualTimelineOverrides.json"
REVIEWED_DIR = ROOT / "public/media/reviewed-captures"
MAX_EDGE = 300
COLUMNS = 6
WEBP_QUALITY = 72


def frame_files(directory: Path) -> list[Path]:
    files = sorted(path for path in directory.glob("*.png") if re.fullmatch(r"\d{4,6}\.png", path.name))
    expected = [f"{index:04d}.png" for index in range(1, len(files) + 1)]
    actual = [path.name for path in files]
    if actual != expected:
        raise SystemExit(f"capture frames must be contiguous 0001.png..N.png in {directory}")
    return files


def capture_digest(files: list[Path], metadata: dict[str, Any]) -> str:
    digest = hashlib.sha256()
    digest.update(json.dumps(metadata, sort_keys=True, separators=(",", ":")).encode("utf-8"))
    for path in files:
        digest.update(path.name.encode("utf-8"))
        digest.update(path.read_bytes())
    return digest.hexdigest()


def build_sheet(files: list[Path], output: Path) -> dict[str, Any]:
    images: list[Image.Image] = []
    original_size: tuple[int, int] | None = None
    for path in files:
        with Image.open(path) as source:
            image = source.convert("RGBA").copy()
        if original_size is None:
            original_size = image.size
        elif image.size != original_size:
            raise SystemExit(f"capture frame dimensions differ: {path}")
        images.append(image)

    if not images or original_size is None:
        raise SystemExit("capture contains no readable frame images")
    width, height = original_size
    scale = min(1.0, MAX_EDGE / max(width, height))
    frame_width = max(1, round(width * scale))
    frame_height = max(1, round(height * scale))
    if (frame_width, frame_height) != original_size:
        images = [image.resize((frame_width, frame_height), Image.Resampling.LANCZOS) for image in images]

    rows = math.ceil(len(images) / COLUMNS)
    sheet = Image.new("RGBA", (frame_width * COLUMNS, frame_height * rows), (0, 0, 0, 0))
    for index, image in enumerate(images):
        sheet.alpha_composite(image, ((index % COLUMNS) * frame_width, (index // COLUMNS) * frame_height))
    output.parent.mkdir(parents=True, exist_ok=True)
    sheet.save(output, "WEBP", quality=WEBP_QUALITY, method=4)
    return {
        "src": output.relative_to(ROOT / "public").as_posix(),
        "frameWidth": frame_width,
        "frameHeight": frame_height,
        "columns": COLUMNS,
        "frameCount": len(images),
        "frameNumbers": list(range(1, len(images) + 1)),
    }


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("capture_root", type=Path)
    parser.add_argument("--key", action="append", default=[], help="capture queue key to import; may be repeated")
    parser.add_argument("--dry-run", action="store_true")
    args = parser.parse_args()

    queue = json.loads(QUEUE_PATH.read_text(encoding="utf-8"))
    overrides = json.loads(OVERRIDES_PATH.read_text(encoding="utf-8"))
    if queue.get("version") != 2 or overrides.get("version") != 1:
        raise SystemExit("capture queue/override schema mismatch")

    selected = set(args.key)
    imported_keys: set[str] = set()
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
        if metadata.get("interpolatedFrames", False) or metadata.get("syntheticFrames", False):
            raise SystemExit(f"capture may not contain interpolated/synthetic frames: {key}")
        for required in ("gameVersion", "captureTool", "capturedBy", "provenanceNote", "interactionDisplay"):
            if not str(metadata.get(required, "")).strip():
                raise SystemExit(f"capture metadata missing {required}: {key}")
        if metadata["interactionDisplay"] not in {"hitbox-grabbox-enabled", "not-applicable"}:
            raise SystemExit(f"capture interactionDisplay must be hitbox-grabbox-enabled or not-applicable: {key}")
        target = job.get("documentedTargetFrames")
        if isinstance(target, int) and target > 0 and len(frames) != target:
            raise SystemExit(f"capture {key} has {len(frames)} frames; documented target is {target}")

        output = REVIEWED_DIR / job["fighterId"] / job["moveId"] / f"{job['variantId']}.webp"
        digest = capture_digest(frames, metadata)
        sheet = None if args.dry_run else build_sheet(frames, output)
        if sheet is None:
            sheet = {
                "src": output.relative_to(ROOT / "public").as_posix(),
                "frameCount": len(frames),
                "frameNumbers": list(range(1, len(frames) + 1)),
            }

        entry: dict[str, Any] = {
            "timelineClass": job["timelineClass"],
            "totalFrames": len(frames),
            "mappingMethod": "reviewed-local-frame-capture",
            "sourceUrl": job.get("sourceUrl") or "local-reviewed-capture",
            "gameVersion": metadata["gameVersion"],
            "captureTool": metadata["captureTool"],
            "capturedBy": metadata["capturedBy"],
            "provenanceNote": metadata["provenanceNote"],
            "interactionDisplay": metadata["interactionDisplay"],
            "captureSha256": digest,
            "reviewedCapture": sheet,
        }
        if not args.dry_run:
            overrides.setdefault("entries", {})[key] = entry
        imported_keys.add(key)
        print(f"validated capture: {key} ({len(frames)} frames) -> {sheet['src']}")

    if selected:
        missing = selected - imported_keys
        if missing:
            raise SystemExit("requested capture keys were not imported: " + ", ".join(sorted(missing)))
    if not args.dry_run:
        OVERRIDES_PATH.write_text(json.dumps(overrides, indent=2) + "\n", encoding="utf-8")
    print(f"validated {len(imported_keys)} capture set(s)")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
