#!/usr/bin/env python3
"""Generate local seekable schematic sprite sheets for timing-only runtime moves.

Every synthetic move shares one compact five-cell sheet with other synthetic
moves for the same fighter. The cells are illustrative status cards built from
the already-vendored local fighter render plus a phase label. They are not game
captures, do not invent character poses or collision geometry, and remain
excluded from factual/source-backed coverage.
"""
from __future__ import annotations

import json
import shutil
from pathlib import Path
from typing import Any

from PIL import Image, ImageDraw, ImageFont

ROOT = Path(__file__).resolve().parents[1]
REPORT = ROOT / "src/data/visualSyntheticFallbacks.generated.json"
RUNTIME_DIR = ROOT / "public/data/visual-media"
RENDER_DIR = ROOT / "public/media/fighters/renders"
OUTPUT_DIR = ROOT / "public/media/synthetic-phase-sheets"
PHASES = ("startup", "active", "recovery", "intangible", "other")
PHASE_TO_CELL = {phase: index for index, phase in enumerate(PHASES)}
CELL_W = 420
CELL_H = 260


def fit_render(path: Path) -> Image.Image:
    image = Image.open(path).convert("RGBA")
    image.thumbnail((220, 205), Image.Resampling.LANCZOS)
    return image


def draw_cell(render: Image.Image, phase: str) -> Image.Image:
    cell = Image.new("RGBA", (CELL_W, CELL_H), (9, 11, 12, 255))
    draw = ImageDraw.Draw(cell)
    font = ImageFont.load_default()

    # Keep the fighter pose untouched. Only the surrounding schematic status
    # changes between cells, so no gameplay animation is fabricated.
    x = 32 + (220 - render.width) // 2
    y = 30 + (205 - render.height) // 2
    cell.alpha_composite(render, (x, y))

    draw.rectangle((274, 28, 396, 232), outline=(94, 101, 106, 255), width=2)
    draw.text((288, 46), "TIMING", fill=(225, 228, 230, 255), font=font)
    draw.text((288, 66), "SCHEMATIC", fill=(225, 228, 230, 255), font=font)
    draw.line((288, 91, 380, 91), fill=(94, 101, 106, 255), width=1)
    draw.text((288, 112), phase.upper(), fill=(255, 255, 255, 255), font=font)
    if phase == "intangible":
        draw.text((288, 140), "documented", fill=(210, 214, 217, 255), font=font)
        draw.text((288, 156), "intangibility", fill=(210, 214, 217, 255), font=font)
    elif phase == "other":
        draw.text((288, 140), "timing-only", fill=(210, 214, 217, 255), font=font)
    else:
        draw.text((288, 140), "documented", fill=(210, 214, 217, 255), font=font)
        draw.text((288, 156), "phase", fill=(210, 214, 217, 255), font=font)
    draw.text((288, 202), "not gameplay footage", fill=(160, 166, 171, 255), font=font)
    return cell


def build_sheet(fighter_id: str) -> dict[str, Any]:
    render_path = RENDER_DIR / f"{fighter_id}.webp"
    if not render_path.exists():
        raise SystemExit(f"missing local fighter render: {render_path}")
    render = fit_render(render_path)
    sheet = Image.new("RGBA", (CELL_W * len(PHASES), CELL_H), (0, 0, 0, 0))
    for index, phase in enumerate(PHASES):
        sheet.alpha_composite(draw_cell(render, phase), (index * CELL_W, 0))
    path = OUTPUT_DIR / f"{fighter_id}.webp"
    path.parent.mkdir(parents=True, exist_ok=True)
    sheet.convert("RGB").save(path, "WEBP", quality=82, method=6)
    return {
        "src": f"/media/synthetic-phase-sheets/{fighter_id}.webp",
        "frameWidth": CELL_W,
        "frameHeight": CELL_H,
        "columns": len(PHASES),
        "frameCount": len(PHASES),
        "frameNumbers": list(range(1, len(PHASES) + 1)),
    }


def main() -> int:
    report = json.loads(REPORT.read_text(encoding="utf-8"))
    if report.get("version") != 2:
        raise SystemExit("synthetic fallback report must be version 2")

    shutil.rmtree(OUTPUT_DIR, ignore_errors=True)
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    fighter_ids = sorted({row["fighterId"] for row in report.get("fallbacks", [])})
    sheets = {fighter_id: build_sheet(fighter_id) for fighter_id in fighter_ids}

    fallback_keys = {(row["fighterId"], row["moveId"]) for row in report.get("fallbacks", [])}
    updated = 0
    for fighter_id in fighter_ids:
        runtime_path = RUNTIME_DIR / f"{fighter_id}.json"
        runtime = json.loads(runtime_path.read_text(encoding="utf-8"))
        for move in runtime.get("moves", []):
            key = (fighter_id, move.get("moveId"))
            if key not in fallback_keys:
                continue
            frames = move.get("frames") or []
            if len(frames) != int(move.get("totalFrames") or 0):
                raise SystemExit(f"synthetic frame count mismatch: {fighter_id}:{move.get('moveId')}")
            cells: list[int] = []
            for frame in frames:
                phase = str(frame.get("phase") or "other")
                if phase not in PHASE_TO_CELL:
                    raise SystemExit(f"unknown synthetic phase {phase}: {fighter_id}:{move.get('moveId')}")
                cells.append(PHASE_TO_CELL[phase])
            variants = move.get("variants") or []
            variant = next((item for item in variants if item.get("sourceFormat") == "synthetic-illustrative"), None)
            if not variant:
                raise SystemExit(f"synthetic variant missing: {fighter_id}:{move.get('moveId')}")
            sprite = dict(sheets[fighter_id])
            sprite["gameFrameCells"] = cells
            variant["spriteSheet"] = sprite
            variant["coverageReason"] = (
                "No verified moving gameplay source is available. This fully local seekable schematic uses documented timing "
                "phases with the vendored fighter render and never claims to reproduce the fighter's real pose or hitboxes."
            )
            variant["timelineBasis"] = "documented-frame-data-local-schematic-animation"
            variant["mappingMethod"] = "synthetic-phase-schematic-not-source-evidence"
            updated += 1
        runtime_path.write_text(json.dumps(runtime, separators=(",", ":")) + "\n", encoding="utf-8")

    expected = int(report.get("fallbackCount") or 0)
    if updated != expected:
        raise SystemExit(f"expected {expected} synthetic players, updated {updated}")

    report["localSchematicSheetCount"] = len(sheets)
    report["seekableSchematicPlayers"] = updated
    report["policy"]["runtimeAssets"] = "same-origin local schematic sprite sheets"
    report["policy"]["playerControls"] = "seek/play/pause/previous/next/speed"
    REPORT.write_text(json.dumps(report, indent=2) + "\n", encoding="utf-8")
    print(f"local schematic animations: {updated} moves / {len(sheets)} fighter sheets")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
