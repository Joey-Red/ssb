#!/usr/bin/env python3
"""Vendor truthful full-motion runtime visuals for SSBU move study.

The maintenance pipeline stages source media locally and keeps timing domains
separate. Normal fighter actions may be mapped to documented game frames only
when source imagery/timing or a reviewed provenance override proves the mapping.
Landing/projectile/effect/charge/loop/companion/transition sources own their own
truthful timeline instead of inheriting the parent move's Total Frames.

No missing bitmap, game frame, hitbox, or timing value is synthesized.
"""
from __future__ import annotations

import hashlib
import importlib.util
import io
import json
import shutil
from bisect import bisect_right
from concurrent.futures import ThreadPoolExecutor, as_completed
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

from PIL import Image, ImageSequence

ROOT = Path(__file__).resolve().parents[1]
BASE_SCRIPT = ROOT / "scripts/vendor-static-assets.py"
COVERAGE_PATH = ROOT / "src/data/visualMediaCoverage.generated.json"
OVERRIDES_PATH = ROOT / "src/data/visualTimelineOverrides.json"
ANIMATION_DIR_RELATIVE = Path("media/move-animations")

spec = importlib.util.spec_from_file_location("ssb_vendor_static_assets", BASE_SCRIPT)
if spec is None or spec.loader is None:
    raise RuntimeError(f"unable to load {BASE_SCRIPT}")
base = importlib.util.module_from_spec(spec)
spec.loader.exec_module(base)

ANIMATION_DIR = base.PUBLIC / ANIMATION_DIR_RELATIVE
ANIMATED_WEBP_QUALITY = 68
GAME_FRAME_MS = 1000.0 / 60.0
DURATION_TOLERANCE_MS = 25.0
RESOLVED_COVERAGE = {"full", "source-timed", "exact-static"}


def load_overrides() -> dict[str, dict[str, Any]]:
    if not OVERRIDES_PATH.exists():
        return {}
    payload = json.loads(OVERRIDES_PATH.read_text(encoding="utf-8"))
    if payload.get("version") != 1 or not isinstance(payload.get("entries"), dict):
        raise RuntimeError("visual timeline overrides must use schema version 1")
    return payload["entries"]


OVERRIDES = load_overrides()


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


def save_animated_reference(frames: list[Image.Image], durations: list[int], loop: int, output: Path) -> None:
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


def documented_landing(move: dict[str, Any]) -> int | None:
    value = move.get("landingLag")
    return int(value) if isinstance(value, int) and value > 0 else None


def variant_key(move: dict[str, Any], variant: dict[str, Any]) -> str:
    return f"{move['fighterId']}:{move['moveId']}:{base.safe_name(variant['id'])}"


def reviewed_override(move: dict[str, Any], variant: dict[str, Any]) -> dict[str, Any] | None:
    value = OVERRIDES.get(variant_key(move, variant))
    if value is None:
        return None
    for required in ("provenanceNote", "sourceUrl"):
        if not str(value.get(required, "")).strip():
            raise RuntimeError(f"reviewed override {variant_key(move, variant)} is missing {required}")
    return value


def active_frame_numbers(move: dict[str, Any], source_count: int) -> list[int]:
    span = move.get("activeSpan") or []
    if len(span) == 2:
        start, end = int(span[0]), int(span[1])
    else:
        start, end = 1, min(source_count, 8)
    total = documented_total(move)
    max_documented = total if total is not None else source_count
    max_source = min(source_count, max_documented)
    return [number for number in range(max(1, start), max(start, end) + 1) if number <= max_source]


def frame_cells_from_durations(durations: list[int], total_frames: int, *, require_duration_match: bool) -> list[int] | None:
    """Map 60 FPS frame centers to encoded source-image display intervals.

    Reusing one source image for several game frames is allowed only because the
    source itself says that image is held for that duration. For a documented
    game timeline, total encoded duration must also match the documented action
    duration within quantization tolerance.
    """
    if not durations or total_frames <= 0:
        return None
    source_ms = float(sum(durations))
    expected_ms = total_frames * GAME_FRAME_MS
    if require_duration_match:
        tolerance = max(DURATION_TOLERANCE_MS, expected_ms * 0.03)
        if abs(source_ms - expected_ms) > tolerance:
            return None

    cumulative: list[float] = []
    running = 0.0
    for duration in durations:
        running += float(duration)
        cumulative.append(running)

    cells: list[int] = []
    for frame_number in range(1, total_frames + 1):
        center_ms = (frame_number - 0.5) * GAME_FRAME_MS
        if center_ms > source_ms + 0.001:
            return None
        cell = bisect_right(cumulative, center_ms)
        if cell >= len(durations):
            cell = len(durations) - 1
        cells.append(cell)
    return cells


def source_timeline_frames(durations: list[int]) -> int:
    return max(1, round(sum(durations) / GAME_FRAME_MS))


def mapped_sheet(frames: list[Image.Image], game_cells: list[int], output: Path) -> dict[str, Any]:
    """Pack only source cells actually used and store a compact game-frame map."""
    used_source_cells: list[int] = []
    for cell in game_cells:
        if cell not in used_source_cells:
            used_source_cells.append(cell)
    remap = {source_cell: sheet_cell for sheet_cell, source_cell in enumerate(used_source_cells)}
    selected = [frames[index] for index in used_source_cells]
    representative_frames = [game_cells.index(source_cell) + 1 for source_cell in used_source_cells]
    sheet = base.make_sheet(selected, representative_frames, output)
    sheet["gameFrameCells"] = [remap[cell] for cell in game_cells]
    return sheet


def target_for_variant(move: dict[str, Any], variant: dict[str, Any], override: dict[str, Any] | None) -> tuple[int | None, str | None]:
    if override:
        override_total = override.get("totalFrames")
        if isinstance(override_total, int) and override_total > 0:
            return override_total, "reviewed-provenance-override"

    timeline = str((override or {}).get("timelineClass") or variant.get("timelineClass", "fighter-action"))
    if timeline == "fighter-action":
        total = documented_total(move)
        return total, "documented-total-frames" if total is not None else None
    if timeline == "landing":
        landing = documented_landing(move)
        return landing, "documented-landing-lag" if landing is not None else None
    return None, None


def exact_animation_timeline(
    frames: list[Image.Image], durations: list[int], target: int, output: Path,
) -> tuple[dict[str, Any] | None, str | None]:
    source_count = len(frames)
    if source_count >= target:
        numbers = list(range(1, target + 1))
        sheet = base.make_sheet(frames[:target], numbers, output)
        return sheet, "one-source-image-per-game-frame"

    game_cells = frame_cells_from_durations(durations, target, require_duration_match=True)
    if game_cells is None:
        return None, None
    return mapped_sheet(frames, game_cells, output), "encoded-duration-60fps"


def static_result(
    move: dict[str, Any], variant: dict[str, Any], data: bytes, result: dict[str, Any], timeline_class: str,
) -> tuple[str, dict[str, Any]]:
    fighter_id = move["fighterId"]
    move_id = move["moveId"]
    variant_id = result["id"]
    relative = f"media/hitboxes/{fighter_id}/{move_id}/{variant_id}.webp"
    base.save_static_reference(data, base.PUBLIC / relative)
    result.update({"imageSrc": relative, "sourceFrameCount": 1, "sourceDurationMs": None})
    if timeline_class in {"projectile", "charge-state"}:
        result.update({
            "coverage": "exact-static",
            "coverageReason": f"independent {timeline_class} source is a truthful static visual state",
            "timelineTotalFrames": 1,
            "mappingMethod": "single-source-state",
            "timelineBasis": "source-state",
        })
    else:
        result.update({
            "coverage": "static",
            "coverageReason": f"{timeline_class} source is static and does not prove a complete moving timeline",
        })
    return f"{fighter_id}:{move_id}", result


def process_variant(move: dict[str, Any], variant: dict[str, Any]) -> tuple[str, dict[str, Any]]:
    fighter_id = move["fighterId"]
    move_id = move["moveId"]
    variant_id = base.safe_name(variant["id"])
    override = reviewed_override(move, variant)
    timeline_class = str((override or {}).get("timelineClass") or variant.get("timelineClass", "fighter-action"))
    data = base.fetch_bytes(variant["downloadUrl"], referer=move["sourceUrl"])
    result: dict[str, Any] = {
        "id": variant_id,
        "label": variant.get("label") or variant_id,
        "sha256": hashlib.sha256(data).hexdigest(),
        "timelineClass": timeline_class,
        "timingBasis": "parent-action" if timeline_class == "fighter-action" else "independent-source",
        "sourceFormat": variant.get("sourceFormat"),
        "interactionEvidence": "embedded-source",
    }
    if override:
        result["reviewedOverride"] = {
            "sourceUrl": override["sourceUrl"],
            "provenanceNote": override["provenanceNote"],
        }

    # UFD currently mostly serves GIF/PNG, but WebP may itself be animated. Do
    # not classify it from the extension alone: inspect it and keep animation
    # semantics whenever Pillow reports multiple source images.
    all_frames: list[Image.Image] | None = None
    durations: list[int] | None = None
    loop = 0
    is_animation = variant.get("mediaType") == "animation"
    if not is_animation and variant.get("sourceFormat") == "webp":
        probed_frames, probed_durations, probed_loop = source_animation(data)
        if len(probed_frames) > 1:
            is_animation = True
            all_frames, durations, loop = probed_frames, probed_durations, probed_loop

    if not is_animation:
        return static_result(move, variant, data, result, timeline_class)

    if all_frames is None or durations is None:
        all_frames, durations, loop = source_animation(data)
    source_count = len(all_frames)
    source_duration_ms = sum(durations)
    target, target_basis = target_for_variant(move, variant, override)
    result.update({
        "sourceFrameCount": source_count,
        "sourceDurationMs": source_duration_ms,
        "sourceLoop": loop,
    })

    animation_relative = f"media/move-animations/{fighter_id}/{move_id}/{variant_id}.webp"
    save_animated_reference(all_frames, durations, loop, base.PUBLIC / animation_relative)
    result["animationSrc"] = animation_relative

    relative = f"media/frame-sheets/{fighter_id}/{move_id}/{variant_id}.webp"
    if target is not None:
        sheet, method = exact_animation_timeline(all_frames, durations, target, base.PUBLIC / relative)
        if sheet is not None and method is not None:
            result.update({
                "spriteSheet": {"src": relative, **sheet},
                "coverage": "full",
                "coverageReason": f"{timeline_class} source covers frames 1-{target} via {method}",
                "timelineTotalFrames": target,
                "mappingMethod": method,
                "timelineBasis": target_basis,
            })
            return f"{fighter_id}:{move_id}", result

    # A reviewed source may establish that the represented action has no single
    # fixed end frame (loops, travel states, conditional specials). In that case
    # the complete encoded source sequence is truthful as its own timeline and
    # must not be mislabeled as a missing Total Frames value.
    if override and override.get("timingMode") == "source-timed":
        source_frames = source_timeline_frames(durations)
        game_cells = frame_cells_from_durations(durations, source_frames, require_duration_match=False)
        if game_cells:
            sheet = mapped_sheet(all_frames, game_cells, base.PUBLIC / relative)
            result["spriteSheet"] = {"src": relative, **sheet}
        result.update({
            "coverage": "source-timed",
            "coverageReason": "reviewed provenance establishes a variable/indefinite action; timeline follows encoded source duration",
            "timelineTotalFrames": source_frames,
            "mappingMethod": "source-duration-60fps",
            "timelineBasis": "reviewed-variable-action-source-duration",
        })
        return f"{fighter_id}:{move_id}", result

    if timeline_class != "fighter-action":
        source_frames = source_timeline_frames(durations)
        game_cells = frame_cells_from_durations(durations, source_frames, require_duration_match=False)
        if game_cells:
            sheet = mapped_sheet(all_frames, game_cells, base.PUBLIC / relative)
            result["spriteSheet"] = {"src": relative, **sheet}
        result.update({
            "coverage": "source-timed",
            "coverageReason": f"independent {timeline_class} timeline follows encoded source durations and is not forced onto parent Total Frames",
            "timelineTotalFrames": source_frames,
            "mappingMethod": "source-duration-60fps",
            "timelineBasis": "encoded-source-duration",
        })
        return f"{fighter_id}:{move_id}", result

    # A normal fighter action that cannot prove the full documented timeline
    # keeps only conservative exact/impact mapping plus the moving fallback.
    frame_numbers = active_frame_numbers(move, source_count)
    if frame_numbers:
        selected = [all_frames[number - 1] for number in frame_numbers]
        sheet = base.make_sheet(selected, frame_numbers, base.PUBLIC / relative)
        result["spriteSheet"] = {"src": relative, **sheet}

    total = documented_total(move)
    if total is None:
        result["coverage"] = "untimed-animation"
        result["coverageReason"] = "fighter action has no documented Total Frames value for an exact complete mapping"
    else:
        result["coverage"] = "partial"
        result["coverageReason"] = f"source has {source_count} images / {source_duration_ms} ms and cannot prove the complete {total}-frame fighter action"
    return f"{fighter_id}:{move_id}", result


def vendor_visuals() -> dict[str, Any]:
    source_manifest = json.loads(base.MEDIA_SOURCES.read_text(encoding="utf-8"))
    if source_manifest.get("version") != 3:
        raise RuntimeError("visual source manifest must be version 3; run discover-ufd-visuals.py first")

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


def blocker_class(variant: dict[str, Any]) -> str | None:
    coverage = variant.get("coverage")
    if coverage in RESOLVED_COVERAGE:
        return None
    if coverage == "untimed-animation":
        return "missing-documented-timing"
    if coverage == "static":
        return "static-source-needs-motion"
    if coverage == "partial":
        return "short-or-misaligned-source"
    return "unclassified"


def coverage_report(move_assets: dict[str, Any]) -> dict[str, Any]:
    source_manifest = json.loads(base.MEDIA_SOURCES.read_text(encoding="utf-8"))
    source_moves = {f"{move['fighterId']}:{move['moveId']}": move for move in source_manifest["moves"]}
    counts: dict[str, int] = {}
    timeline_counts: dict[str, int] = {}
    unresolved: list[dict[str, Any]] = []

    for key, staged in move_assets.items():
        source_move = source_moves[key]
        for variant in staged["variants"]:
            coverage = variant.get("coverage", "partial")
            timeline = variant.get("timelineClass", "fighter-action")
            counts[coverage] = counts.get(coverage, 0) + 1
            timeline_counts[timeline] = timeline_counts.get(timeline, 0) + 1
            blocker = blocker_class(variant)
            if blocker is None:
                continue
            unresolved.append({
                "fighterId": source_move["fighterId"],
                "moveId": source_move["moveId"],
                "moveLabel": source_move["label"],
                "variantId": variant["id"],
                "variantLabel": variant.get("label") or variant["id"],
                "timelineClass": timeline,
                "coverage": coverage,
                "blockerClass": blocker,
                "reason": variant.get("coverageReason", "complete exact mapping unavailable"),
                "sourceFrameCount": variant.get("sourceFrameCount"),
                "sourceDurationMs": variant.get("sourceDurationMs"),
                "totalFrames": source_move.get("totalFrames"),
                "landingLag": source_move.get("landingLag"),
                "sourceUrl": source_move["sourceUrl"],
            })

    variant_count = sum(counts.values())
    resolved_count = variant_count - len(unresolved)
    blocker_counts: dict[str, int] = {}
    for item in unresolved:
        blocker = item["blockerClass"]
        blocker_counts[blocker] = blocker_counts.get(blocker, 0) + 1

    return {
        "version": 2,
        "generatedAt": datetime.now(timezone.utc).replace(microsecond=0).isoformat().replace("+00:00", "Z"),
        "mappedMoves": len(move_assets),
        "variantCount": variant_count,
        "resolvedVariants": resolved_count,
        "unresolvedVariants": len(unresolved),
        "coverageCounts": dict(sorted(counts.items())),
        "timelineCounts": dict(sorted(timeline_counts.items())),
        "blockerCounts": dict(sorted(blocker_counts.items())),
        "fullExactVariants": counts.get("full", 0),
        "sourceTimedVariants": counts.get("source-timed", 0),
        "exactStaticVariants": counts.get("exact-static", 0),
        "partialExactVariants": counts.get("partial", 0),
        "untimedAnimatedVariants": counts.get("untimed-animation", 0),
        "staticVariants": counts.get("static", 0),
        "gapCount": len(unresolved),
        "gaps": unresolved,
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
        "version": 3,
        "generatedAt": generated_at,
        "moves": move_assets,
    }, indent=2) + "\n", encoding="utf-8")

    report = coverage_report(move_assets)
    COVERAGE_PATH.write_text(json.dumps(report, indent=2) + "\n", encoding="utf-8")

    source_manifest = json.loads(base.MEDIA_SOURCES.read_text(encoding="utf-8"))
    base.PROVENANCE_PATH.write_text(json.dumps({
        "version": 3,
        "fighterSources": fighter_sources,
        "visualMoveCount": len(move_assets),
        "visualVariantCount": report["variantCount"],
        "fullExactVariantCount": report["fullExactVariants"],
        "sourceTimedVariantCount": report["sourceTimedVariants"],
        "exactStaticVariantCount": report["exactStaticVariants"],
        "visualCoverageGapCount": report["gapCount"],
        "reviewedOverrideCount": len(OVERRIDES),
        "fightersScanned": source_manifest.get("fightersScanned", 0),
        "mediaBytes": media_size,
    }, indent=2) + "\n", encoding="utf-8")

    print(
        f"vendored {len(fighter_sources) or 89} fighter visuals, {len(move_assets)} move visual records, "
        f"{report['variantCount']} variants; {report['resolvedVariants']} resolved / {report['unresolvedVariants']} unresolved"
    )
    print(f"coverage blockers retained for follow-up: {report['blockerCounts']}")
    print(f"runtime media size: {media_size / 1024 / 1024:.1f} MiB")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
