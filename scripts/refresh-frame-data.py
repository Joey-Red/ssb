#!/usr/bin/env python3
"""Refresh the committed SSBU frame-data snapshot.

Ultimate Frame Data (UFD) remains the canonical factual reference shown to
users. UFD rejects GitHub-hosted runners, so maintenance builds read a public
GitHub mirror of UFD's normalized CSV facts instead. The deployed browser app
never calls either service at runtime.

Only structured factual fields are retained. Source-site prose, images,
animations, and hitbox media are intentionally excluded. The only value
extracted from a prose notes column is the factual autocancel frame window.
"""

from __future__ import annotations

import csv
import io
import json
import re
import sys
from concurrent.futures import ThreadPoolExecutor, as_completed
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

import requests

ROOT = Path(__file__).resolve().parents[1]
MANIFEST_PATH = ROOT / "src" / "data" / "ufd-manifest.json"
OUTPUT_PATH = ROOT / "src" / "data" / "frameData.generated.json"
MIRROR_BASE = "https://raw.githubusercontent.com/TheFakeNatty/smash-data/main/data/raw"
MIRROR_REPO = "https://github.com/TheFakeNatty/smash-data"
USER_AGENT = "ssbu-training-guide-frame-data-refresh/2.0 (+https://github.com/Joey-Red/ssb)"
TIMEOUT_SECONDS = 25
MIN_MOVES = 12
MAX_WORKERS = 8

EMPTY_VALUES = {"", "--", "-", "n/a", "N/A"}
AERIALS = {"neutral air", "forward air", "back air", "up air", "down air"}
GRAB_WORDS = ("grab", "pummel", "throw")
DEFENSE_WORDS = ("dodge", "roll", "ledge", "getup")
EXPECTED_COLUMNS = {
    "character",
    "section",
    "move",
    "startup",
    "total_frames",
    "landing_lag",
    "damage",
    "advantage_on_shield",
    "active_frames",
    "notes",
    "shield_lag",
    "shield_stun",
    "hitbox_type",
    "end_lag",
}


def clean(value: str | None) -> str | None:
    if value is None:
        return None
    normalized = " ".join(value.replace("\u00a0", " ").split()).strip()
    return None if normalized in EMPTY_VALUES else normalized


def first_integer(value: str | None) -> int | None:
    if not value:
        return None
    match = re.search(r"\d+", value)
    return int(match.group(0)) if match else None


def slugify(value: str) -> str:
    normalized = value.lower().replace("&", " and ")
    normalized = re.sub(r"[^a-z0-9]+", "-", normalized).strip("-")
    return normalized or "move"


def category_for(name: str, section: str | None) -> str:
    lower = name.lower().strip()
    base = re.sub(r"\s*\([^)]*\)\s*$", "", lower)
    section_lower = (section or "").lower()
    if base in AERIALS:
        return "aerial"
    if lower.startswith(("neutral b", "side b", "up b", "down b")):
        return "special"
    if any(word in lower for word in GRAB_WORDS):
        return "grab"
    if any(word in lower for word in DEFENSE_WORDS):
        return "defense"
    if "aerial" in section_lower and "air" in lower:
        return "aerial"
    if "special" in section_lower:
        return "special"
    if any(token in lower for token in ("jab", "tilt", "dash attack", "smash")):
        return "ground"
    return "misc"


def extract_autocancel(notes: str | None) -> str | None:
    """Extract only the factual autocancel window, never the source prose."""
    if not notes:
        return None
    match = re.search(r"auto\s*cancels?\s+on\s+frame\s+(.+?)(?:\.|$)", notes, flags=re.IGNORECASE)
    if not match:
        return None
    value = match.group(1)
    value = re.sub(r"\bframe\s+", "", value, flags=re.IGNORECASE)
    value = re.sub(r"\s+and\s+", "; ", value, flags=re.IGNORECASE)
    value = re.sub(r"\s+onward\b", "+", value, flags=re.IGNORECASE)
    value = re.sub(r"(?<=\d)[-–—](?=\d)", "–", value)
    return clean(value)


def empty_stats() -> dict[str, None]:
    # The transport mirror contains move rows, not the UFD movement-stat table.
    # Unknown is better than silently inferring or fabricating values.
    return {
        "weight": None,
        "gravity": None,
        "walkSpeed": None,
        "runSpeed": None,
        "initialDash": None,
        "airSpeed": None,
        "airAcceleration": None,
        "fallSpeed": None,
        "fastFallSpeed": None,
    }


def parse_rows(text: str) -> tuple[str, list[dict[str, Any]]]:
    reader = csv.DictReader(io.StringIO(text))
    columns = set(reader.fieldnames or [])
    missing = EXPECTED_COLUMNS - columns
    if missing:
        raise RuntimeError(f"mirror CSV is missing columns: {sorted(missing)}")

    moves: list[dict[str, Any]] = []
    seen_names: set[str] = set()
    character_name = ""

    for row in reader:
        name = clean(row.get("move"))
        character_name = character_name or clean(row.get("character")) or ""
        if not name or name.lower() == "stats":
            continue

        # The mirror repeats the same logical move under multiple presentation
        # sections. Keep the first exact move-name occurrence only.
        name_key = " ".join(name.lower().split())
        if name_key in seen_names:
            continue

        startup = clean(row.get("startup"))
        active = clean(row.get("active_frames"))
        total_frames = clean(row.get("total_frames"))
        landing_lag = clean(row.get("landing_lag"))
        damage = clean(row.get("damage"))
        on_shield = clean(row.get("advantage_on_shield"))
        shield_lag = clean(row.get("shield_lag"))
        shield_stun = clean(row.get("shield_stun"))
        hitbox_type = clean(row.get("hitbox_type"))
        end_lag = clean(row.get("end_lag"))
        autocancel = extract_autocancel(clean(row.get("notes")))

        # Drop navigation/place-holder rows that contain no move facts.
        if not any((startup, active, total_frames, landing_lag, damage, on_shield, shield_lag, shield_stun, end_lag, autocancel)):
            continue

        seen_names.add(name_key)
        moves.append(
            {
                "id": slugify(name),
                "name": name,
                "category": category_for(name, clean(row.get("section"))),
                "startup": startup,
                "startupFrame": first_integer(startup),
                "active": active,
                "totalFrames": total_frames,
                # The mirror does not expose a distinct authoritative FAF field.
                "faf": None,
                "landingLag": landing_lag,
                "autocancel": autocancel,
                "damage": damage,
                "onShield": on_shield,
                "shieldLag": shield_lag,
                "shieldStun": shield_stun,
                "hitboxType": hitbox_type,
                "endLag": end_lag,
                "notes": None,
            }
        )

    return character_name, moves


def fetch_fighter(entry: dict[str, str], canonical_base: str) -> tuple[str, dict[str, Any]]:
    fighter_id = entry["fighterId"]
    ufd_slug = entry["ufdSlug"]
    mirror_url = f"{MIRROR_BASE}/{ufd_slug}_moves.csv"
    canonical_url = f"{canonical_base}/{ufd_slug}"
    response = requests.get(
        mirror_url,
        headers={"User-Agent": USER_AGENT, "Accept": "text/csv,text/plain;q=0.9,*/*;q=0.1"},
        timeout=TIMEOUT_SECONDS,
    )
    response.raise_for_status()
    name, moves = parse_rows(response.text)
    if len(moves) < MIN_MOVES:
        raise RuntimeError(f"only {len(moves)} unique factual move rows parsed")
    return fighter_id, {
        "fighterId": fighter_id,
        "name": name or fighter_id,
        "sourceUrl": canonical_url,
        "stats": empty_stats(),
        "moves": moves,
    }


def main() -> int:
    manifest = json.loads(MANIFEST_PATH.read_text(encoding="utf-8"))
    canonical_base = manifest["sourceBaseUrl"].rstrip("/")
    entries = manifest["fighters"]
    fighters: dict[str, Any] = {}
    failures: list[str] = []

    print(f"Refreshing {len(entries)} fighters from maintenance mirror: {MIRROR_REPO}")
    with ThreadPoolExecutor(max_workers=MAX_WORKERS) as pool:
        future_by_entry = {pool.submit(fetch_fighter, entry, canonical_base): entry for entry in entries}
        for future in as_completed(future_by_entry):
            entry = future_by_entry[future]
            fighter_id = entry["fighterId"]
            try:
                result_id, data = future.result()
                fighters[result_id] = data
                print(f"[ok] {fighter_id}: {len(data['moves'])} unique move rows")
            except Exception as error:
                failures.append(f"{fighter_id}: {error}")
                print(f"[failed] {fighter_id}: {error}", file=sys.stderr)

    if failures:
        print("\nFrame-data refresh failed; refusing to write a partial snapshot:", file=sys.stderr)
        for failure in sorted(failures):
            print(f"- {failure}", file=sys.stderr)
        return 1

    # Keep fighter order stable according to the project's canonical manifest.
    ordered_fighters = {entry["fighterId"]: fighters[entry["fighterId"]] for entry in entries}
    snapshot = {
        "version": 1,
        "generatedAt": datetime.now(timezone.utc).isoformat().replace("+00:00", "Z"),
        "source": {
            "id": "ultimate-frame-data",
            "label": "Ultimate Frame Data",
            "baseUrl": canonical_base,
            "transportMirror": MIRROR_REPO,
        },
        "fighters": ordered_fighters,
    }
    OUTPUT_PATH.write_text(json.dumps(snapshot, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    row_count = sum(len(data["moves"]) for data in ordered_fighters.values())
    print(f"\nWrote {len(ordered_fighters)} fighters / {row_count} unique move rows to {OUTPUT_PATH.relative_to(ROOT)}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
