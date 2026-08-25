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
MEDIA_EXTENSIONS = {".gif", ".png", ".webp", ".jpg", ".jpeg", ".apng"}

# UFD's Pit page currently links its aerial Guardian Orbitars image to a dead
# dark_pit path. The ground variant remains valid, so omit only the dead URL
# instead of failing the complete 89-fighter asset refresh.
BROKEN_MEDIA_URLS = {
    "https://ultimateframedata.com/hitboxes/dark_pit/PitGuardianOrbitarsAerial.gif",
}

PROJECTILE_WORDS = {
    "arrow", "axe", "banana", "beam", "bell", "bomb", "boomerang", "book",
    "c4", "cannonball", "chakram", "cherry", "cross", "egg", "fireball",
    "fruit", "galaxian", "gordo", "grenade", "hydrant", "key", "melon",
    "metalblade", "mechakoopa", "missile", "needle", "orange", "pellet",
    "projectile", "soccerball", "spring", "strawberry", "thunderjolt",
    "turnip", "watershuriken", "gyro", "ptooie", "rear egg", "holy water",
}
EFFECT_WORDS = {"burst", "boom", "detonate", "explosion", "explode", "vortex"}
CHARGE_WORDS = {"charge", "charged", "charging", "full charge", "max", "maximum", "minimum", "partial charge"}
STATE_WORDS = {"idle", "drive", "travel", "flying", "falling", "loop", "rapid"}


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


def unique_visual_id(record: dict[str, Any], url: str) -> str:
    """Return a deterministic ID even when UFD reuses one stem across formats."""
    base = visual_id(url)
    used = {str(variant.get("id", "")) for variant in record.get("variants", [])}
    if base not in used:
        return base

    media_suffix = extension(url).lstrip(".") or "media"
    candidate = f"{base}-{media_suffix}"
    counter = 2
    while candidate in used:
        candidate = f"{base}-{media_suffix}-{counter}"
        counter += 1
    return candidate


def positive_frame(value: str | None) -> int | None:
    match = re.search(r"\d+", value or "")
    if not match:
        return None
    parsed = int(match.group())
    return parsed if parsed > 0 else None


def active_span(active: str | None, startup: int | None, total: str | None) -> tuple[int, int] | None:
    if active:
        values = [int(value) for value in re.findall(r"\d+", active)]
        values = [value for value in values if value > 0]
        if values:
            return values[0], max(values)
    if startup and startup > 0:
        total_value = positive_frame(total)
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
                if absolute in BROKEN_MEDIA_URLS:
                    return None
                return absolute
    return None


def timeline_class(fighter_id: str, move_name: str, label: str) -> str:
    """Classify what the source depicts without asserting unsupported timing.

    This classification only chooses which timeline owns the visual. It does not
    make a source exact. Exactness is decided later by the vendor from documented
    game timing and encoded source timing.
    """
    label_text = normalized(label)
    combined = normalized(f"{move_name} {label}")
    words = set(combined.split())
    compact_label = label_text.replace(" ", "")

    # Pikachu's Down-B source named PikachuThunder depicts the separately
    # generated thunderbolt, not Pikachu's parent action. The bolt is created
    # independently and can remain active after Pikachu is interruptible, so it
    # must own an independent projectile timeline rather than inherit the
    # parent move's Total Frames/active span.
    if fighter_id == "pikachu" and compact_label == "pikachuthunder":
        return "projectile"

    if "landing" in words or label_text.endswith(" landing"):
        return "landing"
    if fighter_id == "rosalina-and-luma" and "luma" in words:
        return "companion-action"
    if "bulletarts" in compact_label:
        return "effect"
    if any(word in combined for word in EFFECT_WORDS):
        return "effect"
    if any(word.replace(" ", "") in compact_label for word in PROJECTILE_WORDS):
        return "projectile"
    if any(word in combined for word in CHARGE_WORDS):
        return "charge-state"
    if any(word in combined for word in STATE_WORDS):
        return "loop-state"
    if "swap" in combined or "transform" in combined:
        return "transition"
    return "fighter-action"


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
            "totalFrames": positive_frame(move.get("totalFrames")),
            "startupFrame": move.get("startupFrame"),
            "active": move.get("active"),
            "activeSpan": list(active_span(move.get("active"), move.get("startupFrame"), move.get("totalFrames")) or []),
            "landingLag": positive_frame(move.get("landingLag")),
            "variants": [],
        })
        if any(variant["downloadUrl"] == url for variant in record["variants"]):
            continue
        identifier = unique_visual_id(record, url)
        label = Path(urlparse(url).path).stem
        timeline = timeline_class(fighter_id, move["name"], label)
        ext = extension(url)
        record["variants"].append({
            "id": identifier,
            "label": label,
            "downloadUrl": url,
            "sourceFormat": ext.lstrip("."),
            "mediaType": "animation" if ext in {".gif", ".apng"} else "image",
            "timelineClass": timeline,
            "timingBasis": "parent-action" if timeline == "fighter-action" else "independent-source",
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
    duplicate_variant_ids = [
        f"{move['fighterId']}:{move['moveId']}"
        for move in moves
        if len({variant['id'] for variant in move['variants']}) != len(move["variants"])
    ]
    if duplicate_variant_ids:
        raise SystemExit("duplicate visual variant ids remain: " + ", ".join(duplicate_variant_ids))

    timeline_counts: dict[str, int] = {}
    for move in moves:
        for variant in move["variants"]:
            timeline = variant["timelineClass"]
            timeline_counts[timeline] = timeline_counts.get(timeline, 0) + 1

    output = {
        "version": 3,
        "source": "Ultimate Frame Data",
        "generatedBy": "scripts/discover-ufd-visuals.py",
        "fightersScanned": len(entries),
        "fightersWithVisuals": mapped_fighters,
        "mappedMoves": len(moves),
        "mappedVariants": mapped_variants,
        "timelineCounts": dict(sorted(timeline_counts.items())),
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
