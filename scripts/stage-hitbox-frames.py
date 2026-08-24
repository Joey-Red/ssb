#!/usr/bin/env python3
"""Convert a local animated move reference into one exact-frame sprite sheet.

This is intentionally a maintenance command, not a runtime downloader. Obtain/review
an approved source animation first, then stage it locally. The generated metadata can
be copied into VisualMoveMedia.spriteSheet.
"""

from __future__ import annotations

import argparse
import json
import math
from pathlib import Path

from PIL import Image, ImageSequence


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Stage an animated hitbox reference as a seekable sprite sheet.")
    parser.add_argument("source", type=Path, help="Local GIF/APNG source file")
    parser.add_argument("output", type=Path, help="Output .webp or .png sprite sheet")
    parser.add_argument("--public-src", required=True, help="BASE_URL-relative app path, e.g. media/frame-sheets/kazuya-up-air.webp")
    parser.add_argument("--columns", type=int, default=8, help="Sprite-sheet columns (default: 8)")
    parser.add_argument("--max-frame-edge", type=int, default=640, help="Downscale each frame so its longest edge is at most this many pixels")
    parser.add_argument("--expected-frames", type=int, help="Fail if source frame count differs")
    parser.add_argument("--metadata", type=Path, help="Optional JSON sidecar output")
    return parser.parse_args()


def main() -> int:
    args = parse_args()
    if args.columns < 1:
        raise SystemExit("--columns must be >= 1")
    if args.max_frame_edge < 64:
        raise SystemExit("--max-frame-edge must be >= 64")

    source = Image.open(args.source)
    frames = [frame.convert("RGBA") for frame in ImageSequence.Iterator(source)]
    if not frames:
        raise SystemExit("source animation has no frames")
    if args.expected_frames is not None and len(frames) != args.expected_frames:
        raise SystemExit(f"expected {args.expected_frames} frames, found {len(frames)}")

    source_width, source_height = frames[0].size
    if any(frame.size != (source_width, source_height) for frame in frames):
        raise SystemExit("source animation contains inconsistent frame dimensions")

    scale = min(1.0, args.max_frame_edge / max(source_width, source_height))
    frame_width = max(1, round(source_width * scale))
    frame_height = max(1, round(source_height * scale))
    if (frame_width, frame_height) != (source_width, source_height):
        frames = [frame.resize((frame_width, frame_height), Image.Resampling.LANCZOS) for frame in frames]

    rows = math.ceil(len(frames) / args.columns)
    sheet = Image.new("RGBA", (frame_width * args.columns, frame_height * rows), (0, 0, 0, 0))
    for index, frame in enumerate(frames):
        column = index % args.columns
        row = index // args.columns
        sheet.alpha_composite(frame, (column * frame_width, row * frame_height))

    args.output.parent.mkdir(parents=True, exist_ok=True)
    suffix = args.output.suffix.lower()
    if suffix == ".webp":
        sheet.save(args.output, format="WEBP", lossless=True, method=6)
    elif suffix == ".png":
        sheet.save(args.output, format="PNG", optimize=True)
    else:
        raise SystemExit("output must end in .webp or .png")

    metadata = {
        "src": args.public_src.lstrip("/"),
        "frameWidth": frame_width,
        "frameHeight": frame_height,
        "columns": args.columns,
        "frameCount": len(frames),
    }
    if args.metadata:
        args.metadata.parent.mkdir(parents=True, exist_ok=True)
        args.metadata.write_text(json.dumps(metadata, indent=2) + "\n", encoding="utf-8")

    print(json.dumps(metadata, indent=2))
    print(f"wrote {args.output} ({sheet.width}x{sheet.height})")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
