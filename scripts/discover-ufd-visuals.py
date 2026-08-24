#!/usr/bin/env python3
"""Discover UFD move visuals for the full SSBU roster.

This is maintenance-only networking. The deployed SPA never contacts UFD.
The script browser-impersonates Chrome because UFD rejects normal hosted-runner
HTTP clients, maps each visual to the project's committed frame-data move IDs,
and writes a deterministic source manifest consumed by the local asset vendor.
"""
from __future__ import annotations

import json
import re
import sys
from concurrent.futures import ThreadPoolExecutor, as_completed
from pathlib import Path
from typing import Any
from urllib.parse import urljoin, urlparse

from bs4 import BeautifulSoup
from curl_cffi import requests as browser_requests

ROOT = Path(__file__).resolve().parents[1]
UFD_MANIFEST = ROOT / "src/data/ufd-manifest.json"
FRAME_DATA = ROOT / "src/data/frameData.generated.json"
OUTPUT = ROOT / "src/data/visualMediaSources.json"
MAX_WORKERS = 6
TIMEOUT = 45
MEDIA_EXTENSIONS = {".gif", ".png", ".webp", ".jpg", ".jpeg"}


def normalized(value: str) -> str:
    value = value.lower().replace("&", " and ")
    value = value.replace("mr. ", "mr ").replace("f.l.u.d.d.", "fludd")
    value = re.sub(r"[^a-z0-9]+", " ", value)
    return " ".join(value.split())


def visual_id(url: str) -> str:
    stem = Path(urlparse(url).path).stem
    value = normalized(stem).replace(" ", "-")
    return value or "visual"


def extension(url: str) -> str:
    return Path(urlparse(url).path).suffix.lower()


def active_span(active: str | None, startup: int | None, total: str | None) -> tuple[int, int] | None:
    if active:
        # Raw UFD notation can include parenthetical duration ranges or rehit
        # counts after the first active frame, e.g. 5/7/.../23(1-2). The first
        # numerical token is the authoritative first active frame; later
        # numbers can extend the displayed active/impact study span, but they
        # must never move its start backwards.
        cleaned = re.sub(r"\b\d+\s*x\b", "", active, flags=re.IGNORECASE)
        values = [int(value) for value in re.findall(r"\d+", cleaned)]
        if values:
            start = values[0]
            end = max(values)
            if start > 0 and end >= start:
                return start, end
    # Throws/pummels and some specials expose a visual but no conventional
    # active-window field. Keep a short impact study window around startup.
    if startup and startup > 0:
        total_value = None
        if total:
            match = re.search(r"\d+", total)
            total_value = int(match.group()) if match else None
        end = startup + 7
        if total_value:
            end = min(end, total_value)
        return startup, max(startup, end)
    return None


def move_aliases(name: str) -> list[str]:
    aliases = [normalized(name)]
    lower = normalized(name)
    replacements = {
        "backward throw": "back throw",
        "forward throw": "forward throw",
        "neutral b": "neutral special",
        "side b": "side special",
        "up b": "up special",
        "down b": "down special",
    }
    for old, new in replacements.items():
        if old in lower:
            aliases.append(lower.replace(old, new))
    return list(dict.fromkeys(alias for alias in aliases if alias))


def match_move(container_text: str, moves: list[dict[str, Any]]) -> dict[str, Any] | None:
    text = normalized(container_text)
    # UFD sometimes prefixes landing-state labels before the actual move name.
    prefixes = ("normal landing ", "landing ", "aerial ", "grounded ")
    candidates = [text]
    for prefix in prefixes:
        if text.startswith(prefix):
            candidates.append(text[len(prefix):])

    scored: list[tuple[int, dict[str, Any]]] = []
    for move in moves:
        for alias in move_aliases(move["name"]):
            for candidate in candidates:
                if candidate.startswith(alias + " ") or candidate == alias:
                    scored.append((len(alias), move))
                    break
                # A few containers prepend small state labels. Restrict a
                # fallback containment match to the beginning of the row so
                # damage/notes cannot accidentally match another move.
                position = candidate.find(alias)
                if 0 <= position <= 24:
                    scored.append((len(alias) - position, move))
                    break
    return max(scored, key=lambda item: item[0])[1] if scored else None


def media_url(anchor: Any, page_url: str) -> str | None:
    image = anchor.find("img")
    nodes = [anchor] + ([image] if image else [])
    for node in nodes:
        for key in ("data-featherlight", "data-src", "data-original", "href", "src"):
            raw = node.get(key)
            if not isinstance(raw, str):
                continue
            absolute = urljoin(page_url, raw)
            path = urlparse(absolute).path.lower()
            if "/hitboxes/" in path and extension(absolute) in MEDIA_EXTENSIONS:
                return absolute
    return None


def discover_fighter(entry: dict[str, str], fighter_data: dict[str, Any]) -> tuple[str, list[dict[str, Any]], dict[str, int]]:
    fighter_id = entry["fighterId"]
    page_url = f"https://ultimateframedata.com/{entry['ufdSlug']}"
    response = browser_requests.get(
        page_url,
        impersonate="chrome",
        timeout=TIMEOUT,
        headers={"Accept-Language": "en-US,en;q=0.9", "Referer": "https://ultimateframedata.com/smash"},
    )
    response.raise_for_status()
    soup = BeautifulSoup(response.text, "html.parser")
    moves = list(fighter_data["moves"])
    by_move: dict[str, dict[str, Any]] = {}
    visual_count = 0
    unmatched = 0

    for anchor in soup.select("a.hitboximg"):
        url = media_url(anchor, page_url)
        if not url:
            continue
        visual_count += 1
        container = anchor.find_parent("div", class_="movecontainer")
        if not container:
            unmatched += 1
            continue
        text = " ".join(container.get_text(" ", strip=True).split())
        move = match_move(text, moves)
        if not move:
            unmatched += 1
            continue
        key = move["id"]
        record = by_move.setdefault(key, {
            "fighterId": fighter_id,
            "moveId": move["id"],
            "label": f"{fighter_data['name']} {move['name']}",
            "sourceUrl": page_url,
            "totalFrames": int(re.search(r"\d+", move["totalFrames"] or "").group()) if re.search(r"\d+", move["totalFrames"] or "") else None,
            "startupFrame": move.get("startupFrame"),
            "active": move.get("active"),
            "activeSpan": list(active_span(move.get("active"), move.get("startupFrame"), move.get("totalFrames")) or []),
            "variants": [],
        })
        if any(variant["downloadUrl"] == url for variant in record["variants"]):
            continue
        record["variants"].append({
            "id": visual_id(url),
            "label": Path(urlparse(url).path).stem,
            "downloadUrl": url,
            "mediaType": "gif" if extension(url) == ".gif" else "image",
        })

    ordered = []
    for move in moves:
        record = by_move.get(move["id"])
        if record:
            ordered.append(record)
    stats = {"pageVisuals": visual_count, "mappedMoves": len(ordered), "unmatchedVisuals": unmatched}
    return fighter_id, ordered, stats


def main() -> int:
    ufd = json.loads(UFD_MANIFEST.read_text(encoding="utf-8"))
    frame = json.loads(FRAME_DATA.read_text(encoding="utf-8"))
    entries = ufd["fighters"]
    fighters = frame["fighters"]
    discovered: dict[str, list[dict[str, Any]]] = {}
    stats: dict[str, dict[str, int]] = {}
    failures: list[str] = []

    with ThreadPoolExecutor(max_workers=MAX_WORKERS) as pool:
        futures = {
            pool.submit(discover_fighter, entry, fighters[entry["fighterId"]]): entry
            for entry in entries
        }
        for future in as_completed(futures):
            entry = futures[future]
            fighter_id = entry["fighterId"]
            try:
                result_id, moves, fighter_stats = future.result()
                discovered[result_id] = moves
                stats[result_id] = fighter_stats
                print(f"[ok] {fighter_id}: {fighter_stats['mappedMoves']} moves / {fighter_stats['pageVisuals']} hitbox visuals ({fighter_stats['unmatchedVisuals']} unmatched)")
            except Exception as exc:  # noqa: BLE001
                failures.append(f"{fighter_id}: {exc}")
                print(f"[failed] {fighter_id}: {exc}", file=sys.stderr)

    if failures:
        print("Discovery failed; refusing partial manifest:", file=sys.stderr)
        for failure in sorted(failures):
            print(f"- {failure}", file=sys.stderr)
        return 1

    moves = [move for entry in entries for move in discovered[entry["fighterId"]]]
    mapped_fighters = sum(1 for entry in entries if discovered[entry["fighterId"]])
    mapped_variants = sum(len(move["variants"]) for move in moves)
    output = {
        "version": 2,
        "source": "Ultimate Frame Data",
        "generatedBy": "scripts/discover-ufd-visuals.py",
        "fightersScanned": len(entries),
        "fightersWithVisuals": mapped_fighters,
        "mappedMoves": len(moves),
        "mappedVariants": mapped_variants,
        "moves": moves,
    }
    OUTPUT.write_text(json.dumps(output, indent=2) + "\n", encoding="utf-8")
    print(f"Wrote {mapped_fighters}/{len(entries)} fighters, {len(moves)} mapped moves, {mapped_variants} source variants")
    if mapped_fighters < 80:
        raise SystemExit(f"visual discovery coverage unexpectedly low: {mapped_fighters} fighters")
    if len(moves) < 1200:
        raise SystemExit(f"visual discovery mapped only {len(moves)} moves; expected at least 1200")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
