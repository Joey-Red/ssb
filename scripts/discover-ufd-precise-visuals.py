#!/usr/bin/env python3
"""Run UFD visual discovery using UFD's explicit move-name field first.

The baseline UFD scraper historically matched against the entire move card text.
Cards with several hitbox-variant labels before the move name can push that name
past the conservative fuzzy-match window, leaving real UFD GIFs unmapped. UFD's
HTML already exposes the canonical row label in ``div.movename``. This wrapper
reuses the existing discovery/vendor semantics but maps against that field first,
falling back to the legacy full-card text only when needed.

No timing, exactness, or source-quality rules are relaxed here. This changes only
which committed frame-data move receives a UFD media URL.
"""
from __future__ import annotations

import importlib.util
from pathlib import Path
from typing import Any
from urllib.parse import urlparse

ROOT = Path(__file__).resolve().parents[1]
BASE = ROOT / "scripts/discover-ufd-visuals.py"

spec = importlib.util.spec_from_file_location("ssb_ufd_discovery", BASE)
if spec is None or spec.loader is None:
    raise RuntimeError(f"unable to load {BASE}")
ufd = importlib.util.module_from_spec(spec)
spec.loader.exec_module(ufd)


def precise_discover_fighter(
    entry: dict[str, str],
    fighter_data: dict[str, Any],
) -> tuple[str, list[dict[str, Any]], dict[str, int]]:
    fighter_id = entry["fighterId"]
    page_url = f"https://ultimateframedata.com/{entry['ufdSlug']}"
    response = ufd.browser_requests.get(
        page_url,
        impersonate="chrome",
        timeout=ufd.TIMEOUT,
        headers={
            "Accept-Language": "en-US,en;q=0.9",
            "Referer": "https://ultimateframedata.com/smash",
        },
    )
    response.raise_for_status()
    soup = ufd.BeautifulSoup(response.text, "html.parser")
    moves = list(fighter_data["moves"])
    by_move: dict[str, dict[str, Any]] = {}
    visual_count = 0
    unmatched = 0

    for anchor in soup.select("a.hitboximg"):
        url = ufd.media_url(anchor, page_url)
        if not url:
            continue
        visual_count += 1
        container = anchor.find_parent("div", class_="movecontainer")
        if not container:
            unmatched += 1
            continue

        move_name_node = container.find("div", class_="movename")
        move_name_text = (
            " ".join(move_name_node.get_text(" ", strip=True).split())
            if move_name_node is not None
            else ""
        )
        move = ufd.match_move(move_name_text, moves) if move_name_text else None
        if move is None:
            legacy_text = " ".join(container.get_text(" ", strip=True).split())
            move = ufd.match_move(legacy_text, moves)
        if move is None:
            unmatched += 1
            continue

        key = move["id"]
        record = by_move.setdefault(
            key,
            {
                "fighterId": fighter_id,
                "moveId": move["id"],
                "label": f"{fighter_data['name']} {move['name']}",
                "sourceUrl": page_url,
                "totalFrames": ufd.positive_frame(move.get("totalFrames")),
                "startupFrame": move.get("startupFrame"),
                "active": move.get("active"),
                "activeSpan": list(
                    ufd.active_span(
                        move.get("active"),
                        move.get("startupFrame"),
                        move.get("totalFrames"),
                    )
                    or []
                ),
                "landingLag": ufd.positive_frame(move.get("landingLag")),
                "variants": [],
            },
        )
        if any(variant["downloadUrl"] == url for variant in record["variants"]):
            continue

        identifier = ufd.unique_visual_id(record, url)
        label = Path(urlparse(url).path).stem
        timeline = ufd.timeline_class(fighter_id, move["name"], label)
        ext = ufd.extension(url)
        record["variants"].append(
            {
                "id": identifier,
                "label": label,
                "downloadUrl": url,
                "sourceFormat": ext.lstrip("."),
                "mediaType": "animation" if ext in {".gif", ".apng"} else "image",
                "timelineClass": timeline,
                "timingBasis": (
                    "parent-action" if timeline == "fighter-action" else "independent-source"
                ),
            }
        )

    ordered: list[dict[str, Any]] = []
    for move in moves:
        record = by_move.get(move["id"])
        if record:
            ordered.append(record)
    stats = {
        "pageVisuals": visual_count,
        "mappedMoves": len(ordered),
        "unmatchedVisuals": unmatched,
    }
    return fighter_id, ordered, stats


def main() -> int:
    ufd.discover_fighter = precise_discover_fighter
    return int(ufd.main())


if __name__ == "__main__":
    raise SystemExit(main())
