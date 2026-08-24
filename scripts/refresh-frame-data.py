#!/usr/bin/env python3
"""Refresh the committed SSBU frame-data snapshot from Ultimate Frame Data.

This script is a maintenance tool only. The browser application never scrapes
or calls Ultimate Frame Data at runtime; it reads the generated JSON snapshot.
Raw move notation is preserved whenever UFD represents ranges, multi-hits,
early/late hitboxes, or move-specific values.
"""

from __future__ import annotations

import json
import re
import sys
import time
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

import requests
from bs4 import BeautifulSoup

ROOT = Path(__file__).resolve().parents[1]
MANIFEST_PATH = ROOT / "src" / "data" / "ufd-manifest.json"
OUTPUT_PATH = ROOT / "src" / "data" / "frameData.generated.json"
USER_AGENT = "ssbu-training-guide-frame-data-refresh/1.0 (+https://github.com/Joey-Red/ssb)"
TIMEOUT_SECONDS = 20
MIN_MOVES = 12

EMPTY_VALUES = {"", "--", "-", "n/a", "N/A"}
AERIALS = {"neutral air", "forward air", "back air", "up air", "down air"}
GROUND_WORDS = ("jab", "tilt", "dash attack", "smash")
GRAB_WORDS = ("grab", "pummel", "throw")
DEFENSE_WORDS = ("dodge", "roll")


def clean(value: str | None) -> str | None:
    if value is None:
        return None
    value = " ".join(value.replace("\u00a0", " ").split()).strip()
    return None if value in EMPTY_VALUES else value


def first_integer(value: str | None) -> int | None:
    if not value:
        return None
    match = re.search(r"\d+", value)
    return int(match.group(0)) if match else None


def slugify(value: str) -> str:
    value = value.lower().replace("&", " and ")
    value = re.sub(r"[^a-z0-9]+", "-", value).strip("-")
    return value or "move"


def category_for(name: str) -> str:
    lower = name.lower().strip()
    base = re.sub(r"\s*\([^)]*\)\s*$", "", lower)
    if base in AERIALS:
        return "aerial"
    if lower.startswith(("neutral b", "side b", "up b", "down b")):
        return "special"
    if any(word in lower for word in GRAB_WORDS):
        return "grab"
    if any(word in lower for word in DEFENSE_WORDS):
        return "defense"
    if lower.startswith(GROUND_WORDS) or any(word in lower for word in (" tilt", " smash")):
        return "ground"
    return "misc"


def field(container: Any, class_name: str) -> str | None:
    node = container.find(class_=class_name)
    return clean(node.get_text(" ", strip=True) if node else None)


def parse_stats(soup: BeautifulSoup) -> dict[str, str | None]:
    text = soup.get_text("\n", strip=True)

    def match(*patterns: str) -> str | None:
        for pattern in patterns:
            result = re.search(pattern, text, flags=re.IGNORECASE)
            if result:
                return clean(result.group(1))
        return None

    fall_pair = re.search(
        r"Fall\s*Speed\s*/\s*Fast\s*Fall\s*Speed\s*[—–-]\s*([\d.]+)\s*/\s*([\d.]+)",
        text,
        flags=re.IGNORECASE,
    )

    return {
        "weight": match(r"Weight\s*[—–-]\s*([\d.]+)"),
        "gravity": match(r"Gravity\s*[—–-]\s*([\d.]+)"),
        "walkSpeed": match(r"Walk\s*Speed\s*[—–-]\s*([\d.]+)", r"Walk\s*[—–-]\s*([\d.]+)"),
        "runSpeed": match(r"Run\s*Speed\s*[—–-]\s*([\d.]+)", r"Run\s*[—–-]\s*([\d.]+)"),
        "initialDash": match(r"Initial\s*Dash\s*[—–-]\s*([\d.]+)"),
        "airSpeed": match(r"Air\s*Speed\s*[—–-]\s*([\d.]+)"),
        "airAcceleration": match(r"Total\s*Air\s*Acceleration\s*[—–-]\s*([\d.]+)"),
        "fallSpeed": clean(fall_pair.group(1)) if fall_pair else match(r"Fall\s*Speed\s*[—–-]\s*([\d.]+)"),
        "fastFallSpeed": clean(fall_pair.group(2)) if fall_pair else match(r"Fast\s*Fall\s*Speed\s*[—–-]\s*([\d.]+)"),
    }


def parse_moves(soup: BeautifulSoup) -> list[dict[str, Any]]:
    moves: list[dict[str, Any]] = []
    used_ids: dict[str, int] = {}

    for container in soup.find_all("div", class_=lambda value: value and "movecontainer" in str(value).split()):
        name = field(container, "movename")
        if not name or name.lower() == "stats":
            continue

        startup = field(container, "startup")
        active = field(container, "activeframes")
        total_frames = field(container, "totalframes")
        landing_lag = field(container, "landinglag")
        damage = field(container, "basedamage")
        on_shield = field(container, "advantage")
        shield_lag = field(container, "shieldlag")
        shield_stun = field(container, "shieldstun")
        hitbox_type = field(container, "whichhitbox")
        end_lag = field(container, "endlag")
        notes = field(container, "notes")

        # Ignore pure headings/placeholders, but retain defensive options and throws
        # even when they lack startup because their total/landing/intangibility data
        # is still useful to a frame reference.
        if not any((startup, active, total_frames, landing_lag, damage, on_shield, end_lag, notes)):
            continue

        base_id = slugify(name)
        occurrence = used_ids.get(base_id, 0) + 1
        used_ids[base_id] = occurrence
        move_id = base_id if occurrence == 1 else f"{base_id}-{occurrence}"

        moves.append(
            {
                "id": move_id,
                "name": name,
                "category": category_for(name),
                "startup": startup,
                "startupFrame": first_integer(startup),
                "active": active,
                "totalFrames": total_frames,
                "landingLag": landing_lag,
                "damage": damage,
                "onShield": on_shield,
                "shieldLag": shield_lag,
                "shieldStun": shield_stun,
                "hitboxType": hitbox_type,
                "endLag": end_lag,
                "notes": notes,
            }
        )

    return moves


def fetch_html(session: requests.Session, url: str) -> str:
    last_error: Exception | None = None
    for attempt in range(1, 4):
        try:
            response = session.get(url, timeout=TIMEOUT_SECONDS)
            response.raise_for_status()
            if "movecontainer" not in response.text:
                raise RuntimeError("response did not contain UFD move data")
            return response.text
        except Exception as error:  # requests exposes several transport exceptions
            last_error = error
            if attempt < 3:
                time.sleep(attempt * 1.25)
    raise RuntimeError(f"failed to fetch {url}: {last_error}")


def main() -> int:
    manifest = json.loads(MANIFEST_PATH.read_text(encoding="utf-8"))
    base_url = manifest["sourceBaseUrl"].rstrip("/")
    fighters: dict[str, Any] = {}
    failures: list[str] = []

    session = requests.Session()
    session.headers.update({"User-Agent": USER_AGENT, "Accept": "text/html,application/xhtml+xml"})

    for index, entry in enumerate(manifest["fighters"], start=1):
        fighter_id = entry["fighterId"]
        url = f"{base_url}/{entry['ufdSlug']}"
        print(f"[{index:02d}/{len(manifest['fighters'])}] {fighter_id} <- {url}")
        try:
            html = fetch_html(session, url)
            soup = BeautifulSoup(html, "html.parser")
            heading = soup.find("h1", class_=lambda value: value and "charactername" in str(value).split())
            name = clean(heading.get_text(" ", strip=True) if heading else None) or fighter_id
            moves = parse_moves(soup)
            if len(moves) < MIN_MOVES:
                raise RuntimeError(f"only {len(moves)} move rows parsed")
            fighters[fighter_id] = {
                "fighterId": fighter_id,
                "name": name,
                "sourceUrl": url,
                "stats": parse_stats(soup),
                "moves": moves,
            }
        except Exception as error:
            failures.append(f"{fighter_id}: {error}")
        time.sleep(0.05)

    if failures:
        print("\nFrame-data refresh failed; refusing to write a partial snapshot:", file=sys.stderr)
        for failure in failures:
            print(f"- {failure}", file=sys.stderr)
        return 1

    snapshot = {
        "version": 1,
        "generatedAt": datetime.now(timezone.utc).isoformat().replace("+00:00", "Z"),
        "source": {
            "id": "ultimate-frame-data",
            "label": "Ultimate Frame Data",
            "baseUrl": base_url,
        },
        "fighters": fighters,
    }
    OUTPUT_PATH.write_text(json.dumps(snapshot, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(f"\nWrote {len(fighters)} fighters to {OUTPUT_PATH.relative_to(ROOT)}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
