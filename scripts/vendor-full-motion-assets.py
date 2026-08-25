#!/usr/bin/env python3
"""Vendor full-motion runtime visuals for SSBU move study.

This maintenance-only pipeline reuses the existing asset-vendor helpers but changes
move-animation handling in one important way: when a UFD source animation contains
at least every documented game frame for the move, frames 1..Total Frames are
packed into an exact, seekable local sprite sheet. When a source cannot support a
full exact mapping, the existing conservative active/impact mapping is preserved
and a same-origin animated WebP fallback is staged so startup/recovery study never
silently turns into a fighter-render still. Non-full variants are written to a
machine-readable coverage-gap report for later manual/source-specific work.
"""
from __future__ import annotations

import hashlib
import importlib.util
import io
import json
import shutil
from concurrent.futures import ThreadPoolExecutor, as_completed
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

from PIL import Image, ImageSequence

ROOT = Path(__file__).resolve().parents[1]
BASE_SCRIPT = ROOT / "scripts/vendor-static-assets.py"
COVERAGE_PATH = ROOT / "src/data/visualMediaCoverage.generated.json"
ANIMATION_DIR_RELATIVE = Path("media/move-animations")

spec = importlib.util.spec_from_file_location("ssb_vendor_static_assets", BASE_SCRIPT)
if spec is None or spec.loader is None:
    raise RuntimeError(f"unable to load {BASE_SCRIPT}")
base = importlib.util.module_from_spec(spec)
spec.loader.exec_module(base)

ANIMATION_DIR = base.PUBLIC / ANIMATION_DIR_RELATIVE
ANIMATED_WEBP_QUALITY = 68


def source_animation(data: bytes) -> tuple[list[Image.Image], list[int], int]:
    """Return RGBA source images, preserved per-image durations, and loop count."""
    with Image.open(io.BytesIO(data)) as source:
        default_duration = int(source.info.get("duration", 17) or 17)
        loop = int(source.info.get("loop", 0) or 0)
        frames: list[Image.Image] = []
        durations: list[int] = []
        for frame in ImageSequence.Iterator(source):
            frames.append(frame.convert("RGBA").copy())
            duration = int(frame.info.get("duration", default_duration) or default_duration)
            durations.append(max(10, duration))
    if not frames:
        raise RuntimeError("animation contains no source images")
    return frames, durations, loop


def save_animated_reference(
    frames: list[Image.Image], durations: list[int], loop: int, output: Path,
) -> None:
    resized, _, _ = base.resized_frames(frames)
    if len(durations) != len(resized):
        durations = [17] * len(resized)
    output.parent.mkdir(parents=True, exist_ok=True)
    resized[0].save(
        output,
        "WEBP",
        save_all=True,
        append_images=resized[1:],
        duration=durations,
        loop=loop,
        quality=ANIMATED_WEBP_QUALITY,
        method=4,
    )


def documented_total(move: dict[str, Any]) -> int | None:
    value = move.get("totalFrames")
    return int(value) if isinstance(value, int) and value > 0 else None


def active_frame_numbers(move: dict[str, Any], source_count: int) -> list[int]:
    span = move.get("activeSpan") or []
    if len(span) == 2:
        start, end = int(span[0]), int(span[1])
    else:
        start, end = 1, min(source_count, 8)
    total = documented_total(move)
    max_documented = total if total is not None else source_count
    max_source = min(source_count, max_documented)
    return [
        number
        for number in range(max(1, start), max(start, end) + 1)
        if number <= max_source
    ]


def process_variant(move: dict[str, Any], variant: dict[str, Any]) -> tuple[str, dict[str, Any]]:
    fighter_id = move["fighterId"]
    move_id = move["moveId"]
    variant_id = base.safe_name(variant["id"])
    data = base.fetch_bytes(variant["downloadUrl"], referer=move["sourceUrl"])
    result: dict[str, Any] = {
        "id": variant_id,
        "label": variant.get("label") or variant_id,
        "sha256": hashlib.sha256(data).hexdigest(),
    }

    if variant["mediaType"] == "image":
        relative = f"media/hitboxes/{fighter_id}/{move_id}/{variant_id}.webp"
        base.save_static_reference(data, base.PUBLIC / relative)
        result.update({
            "imageSrc": relative,
            "sourceFrameCount": 1,
            "coverage": "static",
            "coverageReason": "source is a static or separately timed reference",
        })
        return f"{fighter_id}:{move_id}", result

    all_frames, durations, loop = source_animation(data)
    source_count = len(all_frames)
    total = documented_total(move)

    # UFD move GIFs are indexed from the start of the move. If the source has
    # every documented game-frame image, retain the complete 1..Total span.
    if total is not None and source_count >= total:
        frame_numbers = list(range(1, total + 1))
        relative = f"media/frame-sheets/{fighter_id}/{move_id}/{variant_id}.webp"
        sheet = base.make_sheet(all_frames[:total], frame_numbers, base.PUBLIC / relative)
        result.update({
            "spriteSheet": {"src": relative, **sheet},
            "sourceFrameCount": source_count,
            "coverage": "full",
        })
        return f"{fighter_id}:{move_id}", result

    # Keep the previous conservative exact mapping for sources that are too
    # short to prove a full move timeline, but also stage their actual animation
    # locally so missing startup/recovery frames are not represented by a still.
    frame_numbers = active_frame_numbers(move, source_count)
    if frame_numbers:
        selected = [all_frames[number - 1] for number in frame_numbers]
        relative = f"media/frame-sheets/{fighter_id}/{move_id}/{variant_id}.webp"
        sheet = base.make_sheet(selected, frame_numbers, base.PUBLIC / relative)
        result["spriteSheet"] = {"src": relative, **sheet}

    animation_relative = f"media/move-animations/{fighter_id}/{move_id}/{variant_id}.webp"
    save_animated_reference(all_frames, durations, loop, base.PUBLIC / animation_relative)
    result["animationSrc"] = animation_relative
    result["sourceFrameCount"] = source_count

    if total is None:
        result["coverage"] = "untimed-animation"
        result["coverageReason"] = "move has no documented Total Frames value for a complete exact mapping"
    elif source_count < total:
        result["coverage"] = "partial"
        result["coverageReason"] = f"source animation has {source_count} images for a {total}-frame move"
    else:
        result["coverage"] = "partial"
        result["coverageReason"] = "source animation cannot be aligned to every documented game frame"
    return f"{fighter_id}:{move_id}", result


def vendor_visuals() -> dict[str, Any]:
    source_manifest = json.loads(base.MEDIA_SOURCES.read_text(encoding="utf-8"))
    if source_manifest.get("version") != 2:
        raise RuntimeError("visual source manifest must be version 2; run discover-ufd-visuals.py first")

    shutil.rmtree(base.HITBOX_DIR, ignore_errors=True)
    shutil.rmtree(base.SHEET_DIR, ignore_errors=True)
    shutil.rmtree(ANIMATION_DIR, ignore_errors=True)
    base.HITBOX_DIR.mkdir(parents=True, exist_ok=True)
    base.SHEET_DIR.mkdir(parents=True, exist_ok=True)
    ANIMATION_DIR.mkdir(parents=True, exist_ok=True)

    generated: dict[str, dict[str, Any]] = {
        f"{move['fighterId']}:{move['moveId']}": {"variants": []}
        for move in source_manifest["moves"]
    }
    failures: list[str] = []
    work = [(move, variant) for move in source_manifest["moves"] for variant in move["variants"]]
    print(f"processing {len(source_manifest['moves'])} mapped moves / {len(work)} source variants")

    with ThreadPoolExecutor(max_workers=base.MAX_WORKERS) as pool:
        futures = {pool.submit(process_variant, move, variant): (move, variant) for move, variant in work}
        completed = 0
        for future in as_completed(futures):
            move, variant = futures[future]
            try:
                key, record = future.result()
                generated[key]["variants"].append(record)
                completed += 1
                if completed % 100 == 0 or completed == len(work):
                    print(f"full-motion visual assets: {completed}/{len(work)}")
            except Exception as exc:  # noqa: BLE001
                failures.append(f"{move['fighterId']}:{move['moveId']}:{variant['id']}: {exc}")

    if failures:
        raise RuntimeError("visual asset failures:\n" + "\n".join(failures))

    for move in source_manifest["moves"]:
        key = f"{move['fighterId']}:{move['moveId']}"
        order = {base.safe_name(variant["id"]): index for index, variant in enumerate(move["variants"])}
        generated[key]["variants"].sort(key=lambda item: order.get(item["id"], 9999))
    return generated


def coverage_report(move_assets: dict[str, Any]) -> dict[str, Any]:
    source_manifest = json.loads(base.MEDIA_SOURCES.read_text(encoding="utf-8"))
    source_moves = {
        f"{move['fighterId']}:{move['moveId']}": move
        for move in source_manifest["moves"]
    }
    counts = {"full": 0, "partial": 0, "untimed-animation": 0, "static": 0}
    gaps: list[dict[str, Any]] = []

    for key, staged in move_assets.items():
        source_move = source_moves[key]
        for variant in staged["variants"]:
            coverage = variant.get("coverage", "partial")
            counts[coverage] = counts.get(coverage, 0) + 1
            if coverage == "full":
                continue
            gaps.append({
                "fighterId": source_move["fighterId"],
                "moveId": source_move["moveId"],
                "moveLabel": source_move["label"],
                "variantId": variant["id"],
                "variantLabel": variant.get("label") or variant["id"],
                "coverage": coverage,
                "reason": variant.get("coverageReason", "full exact mapping unavailable"),
                "sourceFrameCount": variant.get("sourceFrameCount"),
                "totalFrames": source_move.get("totalFrames"),
                "sourceUrl": source_move["sourceUrl"],
            })

    return {
        "version": 1,
        "generatedAt": datetime.now(timezone.utc).replace(microsecond=0).isoformat().replace("+00:00", "Z"),
        "mappedMoves": len(move_assets),
        "variantCount": sum(counts.values()),
        "fullExactVariants": counts.get("full", 0),
        "partialExactVariants": counts.get("partial", 0),
        "untimedAnimatedVariants": counts.get("untimed-animation", 0),
        "staticVariants": counts.get("static", 0),
        "gapCount": len(gaps),
        "gaps": gaps,
    }


def main() -> int:
    for directory in (base.FIGHTER_RENDER_DIR, base.FIGHTER_THUMB_DIR):
        directory.mkdir(parents=True, exist_ok=True)

    fighter_sources = base.ensure_fighter_assets()
    move_assets = vendor_visuals()
    media_size = base.directory_bytes(base.PUBLIC / "media")
    if media_size > base.MEDIA_BUDGET_BYTES:
        raise SystemExit(
            f"vendored media is {media_size / 1024 / 1024:.1f} MiB, above "
            f"{base.MEDIA_BUDGET_BYTES / 1024 / 1024:.0f} MiB budget"
        )

    generated_at = datetime.now(timezone.utc).replace(microsecond=0).isoformat().replace("+00:00", "Z")
    base.GENERATED_MANIFEST.write_text(json.dumps({
        "version": 2,
        "generatedAt": generated_at,
        "moves": move_assets,
    }, indent=2) + "\n", encoding="utf-8")

    report = coverage_report(move_assets)
    COVERAGE_PATH.write_text(json.dumps(report, indent=2) + "\n", encoding="utf-8")

    source_manifest = json.loads(base.MEDIA_SOURCES.read_text(encoding="utf-8"))
    base.PROVENANCE_PATH.write_text(json.dumps({
        "version": 2,
        "fighterSources": fighter_sources,
        "visualMoveCount": len(move_assets),
        "visualVariantCount": sum(len(record["variants"]) for record in move_assets.values()),
        "fullExactVariantCount": report["fullExactVariants"],
        "visualCoverageGapCount": report["gapCount"],
        "fightersScanned": source_manifest.get("fightersScanned", 0),
        "mediaBytes": media_size,
    }, indent=2) + "\n", encoding="utf-8")

    print(
        f"vendored {len(fighter_sources) or 89} fighter visuals, {len(move_assets)} move visual records, "
        f"{report['variantCount']} variants; {report['fullExactVariants']} have full exact move coverage"
    )
    print(f"coverage gaps retained for follow-up: {report['gapCount']}")
    print(f"runtime media size: {media_size / 1024 / 1024:.1f} MiB")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
