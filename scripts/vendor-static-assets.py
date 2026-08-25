#!/usr/bin/env python3
"""Vendor runtime visuals into public/ for zero third-party browser requests.

Maintenance-only networking downloads discovered UFD visuals and converts them to
compact same-origin WebP assets. GIFs are not shipped wholesale for the full roster:
only the documented active/impact span is packed into an exact frame-addressable
sprite sheet. Static UFD hitbox images remain clearly static references.
"""
from __future__ import annotations

import hashlib
import io
import json
import math
import re
import shutil
import time
from concurrent.futures import ThreadPoolExecutor, as_completed
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

import requests
from PIL import Image, ImageSequence

ROOT = Path(__file__).resolve().parents[1]
ROSTER_PATH = ROOT / "src/data/roster.ts"
MEDIA_SOURCES = ROOT / "src/data/visualMediaSources.json"
GENERATED_MANIFEST = ROOT / "src/data/visualMediaAssets.generated.json"
PUBLIC = ROOT / "public"
FIGHTER_RENDER_DIR = PUBLIC / "media/fighters/renders"
FIGHTER_THUMB_DIR = PUBLIC / "media/fighters/thumbs"
HITBOX_DIR = PUBLIC / "media/hitboxes"
SHEET_DIR = PUBLIC / "media/frame-sheets"
PROVENANCE_PATH = PUBLIC / "media/asset-provenance.json"
MAX_WORKERS = 6
MAX_EDGE = 300
WEBP_QUALITY = 72
MEDIA_BUDGET_BYTES = 780 * 1024 * 1024

HEADERS = {
    "User-Agent": "Mozilla/5.0 (compatible; SSBUTrainingGuideAssetVendor/2.0)",
    "Accept": "image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8",
}

CODE_CANDIDATES: dict[str, list[str]] = {
    "mii-brawler": ["mii_fighter"],
    "mii-swordfighter": ["mii_fighter"],
    "mii-gunner": ["mii_fighter"],
    "squirtle": ["pokemon_trainer"],
    "ivysaur": ["pokemon_trainer"],
    "charizard": ["pokemon_trainer"],
    "min-min": ["minmin", "min_min"],
    "mr-game-and-watch": ["mr_game_and_watch", "game_and_watch"],
    "rosalina-and-luma": ["rosalina_and_luma", "rosetta_and_chiko"],
    "pac-man": ["pac_man", "pacman"],
    "piranha-plant": ["piranha_plant", "packun_flower"],
    "incineroar": ["incineroar", "gaogaen"],
    "isabelle": ["isabelle", "shizue"],
    "hero": ["hero", "dq_hero"],
    "pyra": ["pyra", "homura"],
    "mythra": ["mythra", "hikari", "pyra", "homura"],
}


def roster_ids() -> list[str]:
    text = ROSTER_PATH.read_text(encoding="utf-8")
    ids = re.findall(r"\{\s*id:\s*'([^']+)'", text)
    if len(ids) != 89 or len(set(ids)) != 89:
        raise SystemExit(f"expected 89 unique roster ids, found {len(ids)} / {len(set(ids))}")
    return ids


def candidates(fighter_id: str) -> list[str]:
    values = CODE_CANDIDATES.get(fighter_id, []) + [fighter_id.replace("-", "_")]
    return list(dict.fromkeys(values))


def fetch_bytes(url: str, *, referer: str | None = None) -> bytes:
    headers = dict(HEADERS)
    if referer:
        headers["Referer"] = referer
    last_error: Exception | None = None
    for attempt in range(4):
        try:
            response = requests.get(url, headers=headers, timeout=60)
            if response.status_code in {429, 500, 502, 503, 504}:
                raise RuntimeError(f"HTTP {response.status_code}")
            response.raise_for_status()
            if not response.content:
                raise RuntimeError("empty response")
            return response.content
        except Exception as exc:  # noqa: BLE001
            last_error = exc
            if attempt < 3:
                time.sleep(1.0 + attempt * 1.5)
    raise RuntimeError(f"failed to download {url}: {last_error}")


def first_available(urls: list[str], *, referer: str | None = None) -> tuple[bytes, str]:
    failures: list[str] = []
    for url in urls:
        try:
            return fetch_bytes(url, referer=referer), url
        except Exception as exc:  # noqa: BLE001
            failures.append(f"{url}: {exc}")
    raise RuntimeError("; ".join(failures))


def open_rgba(data: bytes) -> Image.Image:
    with Image.open(io.BytesIO(data)) as image:
        return image.convert("RGBA")


def alpha_crop(image: Image.Image) -> Image.Image:
    alpha = image.getchannel("A")
    box = alpha.getbbox()
    return image.crop(box) if box else image


def save_render(image: Image.Image, output: Path) -> None:
    image = alpha_crop(image)
    image.thumbnail((900, 900), Image.Resampling.LANCZOS)
    output.parent.mkdir(parents=True, exist_ok=True)
    image.save(output, "WEBP", lossless=True, method=6)


def save_thumbnail(image: Image.Image, output: Path) -> None:
    image = alpha_crop(image)
    image.thumbnail((176, 176), Image.Resampling.LANCZOS)
    canvas = Image.new("RGBA", (192, 192), (0, 0, 0, 0))
    x = (canvas.width - image.width) // 2
    y = (canvas.height - image.height) // 2
    canvas.alpha_composite(image, (x, y))
    output.parent.mkdir(parents=True, exist_ok=True)
    canvas.save(output, "WEBP", lossless=True, method=6)


def vendor_fighter(fighter_id: str) -> dict[str, str]:
    codes = candidates(fighter_id)
    render_urls = [f"https://www.smashbros.com/assets_v2/img/fighter/{code}/main.png" for code in codes]
    thumb_urls = [f"https://www.smashbros.com/assets_v2/img/fighter/thumb_v/{code}.png" for code in codes]
    thumb_data, thumb_source = first_available(thumb_urls, referer="https://www.smashbros.com/")
    try:
        render_data, render_source = first_available(render_urls, referer="https://www.smashbros.com/")
    except Exception:
        render_data, render_source = thumb_data, thumb_source
    save_render(open_rgba(render_data), FIGHTER_RENDER_DIR / f"{fighter_id}.webp")
    save_thumbnail(open_rgba(thumb_data), FIGHTER_THUMB_DIR / f"{fighter_id}.webp")
    return {"renderSource": render_source, "thumbSource": thumb_source}


def ensure_fighter_assets() -> dict[str, dict[str, str]]:
    ids = roster_ids()
    previous: dict[str, Any] = {}
    if PROVENANCE_PATH.exists():
        try:
            previous = json.loads(PROVENANCE_PATH.read_text(encoding="utf-8"))
        except json.JSONDecodeError:
            previous = {}
    sources: dict[str, dict[str, str]] = dict(previous.get("fighterSources", {}))
    failures: list[str] = []
    for fighter_id in ids:
        render = FIGHTER_RENDER_DIR / f"{fighter_id}.webp"
        thumb = FIGHTER_THUMB_DIR / f"{fighter_id}.webp"
        if render.exists() and thumb.exists():
            continue
        try:
            sources[fighter_id] = vendor_fighter(fighter_id)
            print(f"fighter repaired: {fighter_id}")
        except Exception as exc:  # noqa: BLE001
            failures.append(f"{fighter_id}: {exc}")
    if failures:
        raise RuntimeError("fighter asset failures:\n" + "\n".join(failures))
    missing = [fighter_id for fighter_id in ids if not (FIGHTER_RENDER_DIR / f"{fighter_id}.webp").exists() or not (FIGHTER_THUMB_DIR / f"{fighter_id}.webp").exists()]
    if missing:
        raise RuntimeError(f"missing local fighter assets: {', '.join(missing)}")
    return sources


def source_visual_frames(data: bytes) -> list[Image.Image]:
    with Image.open(io.BytesIO(data)) as source:
        return [frame.convert("RGBA").copy() for frame in ImageSequence.Iterator(source)]


def resized_frames(frames: list[Image.Image]) -> tuple[list[Image.Image], int, int]:
    if not frames:
        raise RuntimeError("animation contains no source images")
    width, height = frames[0].size
    if any(frame.size != (width, height) for frame in frames):
        raise RuntimeError("animation contains inconsistent frame sizes")
    scale = min(1.0, MAX_EDGE / max(width, height))
    frame_width = max(1, round(width * scale))
    frame_height = max(1, round(height * scale))
    if (frame_width, frame_height) != (width, height):
        frames = [frame.resize((frame_width, frame_height), Image.Resampling.LANCZOS) for frame in frames]
    return frames, frame_width, frame_height


def make_sheet(frames: list[Image.Image], frame_numbers: list[int], output: Path, columns: int = 6) -> dict[str, Any]:
    frames, frame_width, frame_height = resized_frames(frames)
    rows = math.ceil(len(frames) / columns)
    sheet = Image.new("RGBA", (frame_width * columns, frame_height * rows), (0, 0, 0, 0))
    for index, frame in enumerate(frames):
        sheet.alpha_composite(frame, ((index % columns) * frame_width, (index // columns) * frame_height))
    output.parent.mkdir(parents=True, exist_ok=True)
    sheet.save(output, "WEBP", quality=WEBP_QUALITY, method=4)
    return {
        "frameWidth": frame_width,
        "frameHeight": frame_height,
        "columns": columns,
        "frameCount": len(frames),
        "frameNumbers": frame_numbers,
    }


def save_static_reference(data: bytes, output: Path) -> None:
    image = open_rgba(data)
    image.thumbnail((MAX_EDGE, MAX_EDGE), Image.Resampling.LANCZOS)
    output.parent.mkdir(parents=True, exist_ok=True)
    image.save(output, "WEBP", quality=WEBP_QUALITY, method=4)


def safe_name(value: str) -> str:
    value = re.sub(r"[^a-zA-Z0-9._-]+", "-", value).strip("-.")
    return value[:96] or "visual"


def process_variant(move: dict[str, Any], variant: dict[str, Any]) -> tuple[str, dict[str, Any]]:
    fighter_id = move["fighterId"]
    move_id = move["moveId"]
    variant_id = safe_name(variant["id"])
    data = fetch_bytes(variant["downloadUrl"], referer=move["sourceUrl"])
    sha = hashlib.sha256(data).hexdigest()
    result: dict[str, Any] = {
        "id": variant_id,
        "label": variant.get("label") or variant_id,
        "sha256": sha,
    }

    if variant["mediaType"] == "image":
        relative = f"media/hitboxes/{fighter_id}/{move_id}/{variant_id}.webp"
        save_static_reference(data, PUBLIC / relative)
        result["imageSrc"] = relative
        result["sourceFrameCount"] = 1
        return f"{fighter_id}:{move_id}", result

    all_frames = source_visual_frames(data)
    span = move.get("activeSpan") or []
    if len(span) == 2:
        start, end = int(span[0]), int(span[1])
    else:
        start, end = 1, min(len(all_frames), 8)

    total_frames = move.get("totalFrames")
    max_documented_frame = int(total_frames) if isinstance(total_frames, int) and total_frames > 0 else len(all_frames)
    max_source_frame = min(len(all_frames), max_documented_frame)
    frame_numbers = [
        number
        for number in range(max(1, start), max(start, end) + 1)
        if number <= max_source_frame
    ]
    if not frame_numbers:
        # Preserve an honest source reference even if its visual sequence starts
        # later/ends earlier than the documented timing window. Never map a
        # sprite cell beyond the documented Total Frames value.
        fallback_limit = max(1, max_source_frame)
        fallback = min(max(1, move.get("startupFrame") or 1), fallback_limit)
        frame_numbers = [fallback]
    selected = [all_frames[number - 1] for number in frame_numbers]
    relative = f"media/frame-sheets/{fighter_id}/{move_id}/{variant_id}.webp"
    sheet = make_sheet(selected, frame_numbers, PUBLIC / relative)
    result["spriteSheet"] = {"src": relative, **sheet}
    result["sourceFrameCount"] = len(all_frames)
    return f"{fighter_id}:{move_id}", result


def directory_bytes(path: Path) -> int:
    return sum(item.stat().st_size for item in path.rglob("*") if item.is_file()) if path.exists() else 0


def vendor_visuals() -> dict[str, Any]:
    source_manifest = json.loads(MEDIA_SOURCES.read_text(encoding="utf-8"))
    if source_manifest.get("version") != 2:
        raise RuntimeError("visual source manifest must be version 2; run discover-ufd-visuals.py first")

    shutil.rmtree(HITBOX_DIR, ignore_errors=True)
    shutil.rmtree(SHEET_DIR, ignore_errors=True)
    HITBOX_DIR.mkdir(parents=True, exist_ok=True)
    SHEET_DIR.mkdir(parents=True, exist_ok=True)

    generated: dict[str, dict[str, Any]] = {
        f"{move['fighterId']}:{move['moveId']}": {"variants": []}
        for move in source_manifest["moves"]
    }
    failures: list[str] = []
    work = [(move, variant) for move in source_manifest["moves"] for variant in move["variants"]]
    print(f"processing {len(source_manifest['moves'])} mapped moves / {len(work)} source variants")

    with ThreadPoolExecutor(max_workers=MAX_WORKERS) as pool:
        futures = {pool.submit(process_variant, move, variant): (move, variant) for move, variant in work}
        completed = 0
        for future in as_completed(futures):
            move, variant = futures[future]
            try:
                key, record = future.result()
                generated[key]["variants"].append(record)
                completed += 1
                if completed % 100 == 0 or completed == len(work):
                    print(f"visual assets: {completed}/{len(work)}")
            except Exception as exc:  # noqa: BLE001
                failures.append(f"{move['fighterId']}:{move['moveId']}:{variant['id']}: {exc}")

    if failures:
        raise RuntimeError("visual asset failures:\n" + "\n".join(failures))

    for move in source_manifest["moves"]:
        key = f"{move['fighterId']}:{move['moveId']}"
        order = {safe_name(variant["id"]): index for index, variant in enumerate(move["variants"])}
        generated[key]["variants"].sort(key=lambda variant: order.get(variant["id"], 9999))

    return generated


def main() -> int:
    for directory in (FIGHTER_RENDER_DIR, FIGHTER_THUMB_DIR):
        directory.mkdir(parents=True, exist_ok=True)

    fighter_sources = ensure_fighter_assets()
    move_assets = vendor_visuals()
    media_size = directory_bytes(PUBLIC / "media")
    if media_size > MEDIA_BUDGET_BYTES:
        raise SystemExit(f"vendored media is {media_size / 1024 / 1024:.1f} MiB, above {MEDIA_BUDGET_BYTES / 1024 / 1024:.0f} MiB budget")

    GENERATED_MANIFEST.write_text(json.dumps({
        "version": 2,
        "generatedAt": datetime.now(timezone.utc).replace(microsecond=0).isoformat().replace("+00:00", "Z"),
        "moves": move_assets,
    }, indent=2) + "\n", encoding="utf-8")

    source_manifest = json.loads(MEDIA_SOURCES.read_text(encoding="utf-8"))
    PROVENANCE_PATH.write_text(json.dumps({
        "version": 2,
        "fighterSources": fighter_sources,
        "visualMoveCount": len(move_assets),
        "visualVariantCount": sum(len(record["variants"]) for record in move_assets.values()),
        "fightersScanned": source_manifest.get("fightersScanned", 0),
        "mediaBytes": media_size,
    }, indent=2) + "\n", encoding="utf-8")

    print(f"vendored {len(fighter_sources) or 89} fighter visuals, {len(move_assets)} move visual records, {sum(len(record['variants']) for record in move_assets.values())} variants")
    print(f"runtime media size: {media_size / 1024 / 1024:.1f} MiB")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
