#!/usr/bin/env python3
"""Vendor all runtime visual assets into public/ for zero third-party asset requests.

Network access is maintenance/build-time only. The deployed SPA references only files
under its own Vite BASE_URL. Fighter art is sourced from the official Smash site;
registered hitbox animations are sourced from Ultimate Frame Data and converted into
seekable local sprite sheets.
"""

from __future__ import annotations

import hashlib
import io
import json
import math
import re
from datetime import datetime, timezone
from pathlib import Path

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

SESSION = requests.Session()
SESSION.headers.update({
    "User-Agent": "Mozilla/5.0 (compatible; SSBUTrainingGuideAssetVendor/1.0)",
    "Accept": "image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8",
})

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
    headers = {"Referer": referer} if referer else None
    response = SESSION.get(url, headers=headers, timeout=45)
    response.raise_for_status()
    if not response.content:
        raise RuntimeError(f"empty response from {url}")
    return response.content


def first_available(urls: list[str], *, referer: str | None = None) -> tuple[bytes, str]:
    failures: list[str] = []
    for url in urls:
        try:
            return fetch_bytes(url, referer=referer), url
        except Exception as exc:  # noqa: BLE001 - collect all source candidates
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


def composed_gif_frames(data: bytes) -> list[Image.Image]:
    with Image.open(io.BytesIO(data)) as source:
        return [frame.convert("RGBA") for frame in ImageSequence.Iterator(source)]


def make_sheet(frames: list[Image.Image], output: Path, columns: int = 8, max_edge: int = 480) -> dict[str, int | str]:
    if not frames:
        raise RuntimeError("animation contains no frames")
    width, height = frames[0].size
    if any(frame.size != (width, height) for frame in frames):
        raise RuntimeError("animation contains inconsistent frame sizes")
    scale = min(1.0, max_edge / max(width, height))
    frame_width = max(1, round(width * scale))
    frame_height = max(1, round(height * scale))
    if (frame_width, frame_height) != (width, height):
        frames = [frame.resize((frame_width, frame_height), Image.Resampling.LANCZOS) for frame in frames]
    rows = math.ceil(len(frames) / columns)
    sheet = Image.new("RGBA", (frame_width * columns, frame_height * rows), (0, 0, 0, 0))
    for index, frame in enumerate(frames):
        sheet.alpha_composite(frame, ((index % columns) * frame_width, (index // columns) * frame_height))
    output.parent.mkdir(parents=True, exist_ok=True)
    sheet.save(output, "WEBP", lossless=True, method=6)
    return {"frameWidth": frame_width, "frameHeight": frame_height, "columns": columns}


def vendor_visuals() -> dict[str, object]:
    source_manifest = json.loads(MEDIA_SOURCES.read_text(encoding="utf-8"))
    generated: dict[str, object] = {}
    for move in source_manifest["moves"]:
        fighter_id = move["fighterId"]
        move_id = move["moveId"]
        key = f"{fighter_id}:{move_id}"
        data = fetch_bytes(move["downloadUrl"], referer=move["sourceUrl"])
        gif_path = HITBOX_DIR / fighter_id / f"{move_id}.gif"
        gif_path.parent.mkdir(parents=True, exist_ok=True)
        gif_path.write_bytes(data)

        frames = composed_gif_frames(data)
        expected = int(move["totalFrames"])
        if len(frames) != expected:
            raise RuntimeError(f"{key}: expected {expected} source frames, found {len(frames)}")
        sheet_path = SHEET_DIR / fighter_id / f"{move_id}.webp"
        sheet = make_sheet(frames, sheet_path)
        generated[key] = {
            "previewSrc": f"media/hitboxes/{fighter_id}/{move_id}.gif",
            "spriteSheet": {
                "src": f"media/frame-sheets/{fighter_id}/{move_id}.webp",
                **sheet,
            },
            "sha256": hashlib.sha256(data).hexdigest(),
        }
    return generated


def main() -> int:
    for directory in (FIGHTER_RENDER_DIR, FIGHTER_THUMB_DIR, HITBOX_DIR, SHEET_DIR):
        directory.mkdir(parents=True, exist_ok=True)

    fighter_sources: dict[str, dict[str, str]] = {}
    failures: list[str] = []
    for fighter_id in roster_ids():
        try:
            fighter_sources[fighter_id] = vendor_fighter(fighter_id)
            print(f"fighter: {fighter_id}")
        except Exception as exc:  # noqa: BLE001 - report every failed roster asset together
            failures.append(f"{fighter_id}: {exc}")

    if failures:
        raise SystemExit("fighter asset failures:\n" + "\n".join(failures))

    move_assets = vendor_visuals()
    GENERATED_MANIFEST.write_text(json.dumps({
        "version": 1,
        "generatedAt": datetime.now(timezone.utc).replace(microsecond=0).isoformat().replace("+00:00", "Z"),
        "moves": move_assets,
    }, indent=2) + "\n", encoding="utf-8")

    provenance_path = PUBLIC / "media/asset-provenance.json"
    provenance_path.write_text(json.dumps({
        "version": 1,
        "fighterSources": fighter_sources,
        "visualMoveCount": len(move_assets),
    }, indent=2) + "\n", encoding="utf-8")

    print(f"vendored {len(fighter_sources)} fighter visuals and {len(move_assets)} exact move sheets")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
