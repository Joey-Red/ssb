#!/usr/bin/env python3
"""Extract structured UFD dodge/roll timing from the maintenance mirror.

The project intentionally does not bundle source-site prose in frameData. This
builder keeps that rule intact by extracting only the factual intangibility span
and total-frame value needed by timing-only defense schematics. UFD remains the
canonical source shown to users; TheFakeNatty/smash-data is only the same
maintenance transport already used by refresh-frame-data.py.
"""
from __future__ import annotations

import csv
import io
import json
import re
from concurrent.futures import ThreadPoolExecutor, as_completed
from pathlib import Path
from typing import Any

import requests

ROOT = Path(__file__).resolve().parents[1]
MANIFEST = ROOT / "src/data/ufd-manifest.json"
FRAME_DATA = ROOT / "src/data/frameData.generated.json"
OUTPUT = ROOT / "src/data/visualDefenseTiming.generated.json"
MIRROR_BASE = "https://raw.githubusercontent.com/TheFakeNatty/smash-data/main/data/raw"
MIRROR_REPO = "https://github.com/TheFakeNatty/smash-data"
USER_AGENT = "ssbu-training-guide-defense-timing/1.0 (+https://github.com/Joey-Red/ssb)"
TIMEOUT = 25
MAX_WORKERS = 8


def slugify(value: str) -> str:
    normalized = value.lower().replace("&", " and ")
    normalized = re.sub(r"[^a-z0-9]+", "-", normalized).strip("-")
    return normalized or "move"


def positive_numbers(value: str | None) -> list[int]:
    return [int(item) for item in re.findall(r"\d+", str(value or "")) if int(item) > 0]


def parse_total_frames(value: str | None) -> int | None:
    values = positive_numbers(value)
    return max(values) if values else None


def parse_intangibility(notes: str | None) -> tuple[int, int] | None:
    if not notes:
        return None
    match = re.search(
        r"\bintangible(?:\s+on)?\s+frames?\s*(\d+)\s*(?:-|–|—|to)\s*(\d+)\b",
        notes,
        flags=re.IGNORECASE,
    )
    if match:
        return int(match.group(1)), int(match.group(2))
    match = re.search(r"\bintangible(?:\s+on)?\s+frame\s*(\d+)\b", notes, flags=re.IGNORECASE)
    if match:
        value = int(match.group(1))
        return value, value
    return None


def fetch_one(entry: dict[str, str], canonical_base: str) -> tuple[str, list[dict[str, Any]]]:
    fighter_id = entry["fighterId"]
    ufd_slug = entry["ufdSlug"]
    url = f"{MIRROR_BASE}/{ufd_slug}_moves.csv"
    response = requests.get(url, headers={"User-Agent": USER_AGENT, "Accept": "text/csv"}, timeout=TIMEOUT)
    response.raise_for_status()
    reader = csv.DictReader(io.StringIO(response.text))
    seen: set[str] = set()
    rows: list[dict[str, Any]] = []
    for row in reader:
        name = " ".join(str(row.get("move") or "").split()).strip()
        if not name or name.lower() == "stats":
            continue
        name_key = name.lower()
        if name_key in seen:
            continue
        seen.add(name_key)
        span = parse_intangibility(row.get("notes"))
        if not span:
            continue
        start, end = span
        total = parse_total_frames(row.get("total_frames"))
        if start <= 0 or end < start:
            raise RuntimeError(f"invalid intangibility span {start}-{end} for {fighter_id}:{name}")
        if total is not None and end > total:
            raise RuntimeError(f"intangibility span {start}-{end} exceeds total {total} for {fighter_id}:{name}")
        rows.append({
            "fighterId": fighter_id,
            "moveId": slugify(name),
            "moveName": name,
            "startFrame": start,
            "endFrame": end,
            "totalFrames": total,
            "totalFramesRaw": " ".join(str(row.get("total_frames") or "").split()) or None,
            "canonicalSourceUrl": f"{canonical_base}/{ufd_slug}",
            "transportUrl": url,
        })
    return fighter_id, rows


def main() -> int:
    manifest = json.loads(MANIFEST.read_text(encoding="utf-8"))
    frame_data = json.loads(FRAME_DATA.read_text(encoding="utf-8"))
    canonical_base = str(manifest["sourceBaseUrl"]).rstrip("/")
    entries = manifest["fighters"]
    frame_defense = {
        (fighter_id, move["id"]): move
        for fighter_id, fighter in frame_data.get("fighters", {}).items()
        for move in fighter.get("moves", [])
        if move.get("category") == "defense"
    }

    extracted: list[dict[str, Any]] = []
    failures: list[str] = []
    with ThreadPoolExecutor(max_workers=MAX_WORKERS) as pool:
        futures = {pool.submit(fetch_one, entry, canonical_base): entry for entry in entries}
        for future in as_completed(futures):
            entry = futures[future]
            try:
                _, rows = future.result()
                extracted.extend(rows)
            except Exception as exc:
                failures.append(f"{entry['fighterId']}: {exc}")
    if failures:
        raise SystemExit("defense timing fetch failed: " + "; ".join(sorted(failures)))

    by_key: dict[str, dict[str, Any]] = {}
    ignored_not_in_frame_data = 0
    for row in extracted:
        pair = (row["fighterId"], row["moveId"])
        if pair not in frame_defense:
            ignored_not_in_frame_data += 1
            continue
        key = f"{pair[0]}:{pair[1]}"
        prior = by_key.get(key)
        if prior and (
            prior["startFrame"], prior["endFrame"], prior.get("totalFrames")
        ) != (
            row["startFrame"], row["endFrame"], row.get("totalFrames")
        ):
            raise SystemExit(f"conflicting defense timing evidence for {key}")
        by_key[key] = row

    if len(by_key) < 750:
        raise SystemExit(f"unexpectedly low defense intangibility coverage: {len(by_key)}")

    rows_with_total = sum(1 for row in by_key.values() if isinstance(row.get("totalFrames"), int))
    payload = {
        "version": 1,
        "canonicalSource": "Ultimate Frame Data",
        "canonicalBaseUrl": canonical_base,
        "maintenanceTransport": MIRROR_REPO,
        "frameDataDefenseRows": len(frame_defense),
        "documentedIntangibilityRows": len(by_key),
        "documentedTotalFrameRows": rows_with_total,
        "ignoredMirrorRowsNotInFrameData": ignored_not_in_frame_data,
        "policy": {
            "structuredFactsOnly": True,
            "bundlesSourceProse": False,
            "runtimeNetworkDependency": False,
            "eligibleAsGameplayVisual": False,
        },
        "entries": dict(sorted(by_key.items())),
    }
    OUTPUT.write_text(json.dumps(payload, indent=2) + "\n", encoding="utf-8")
    print(
        f"defense timing evidence: {len(by_key)}/{len(frame_defense)} defense rows with documented intangibility; "
        f"{rows_with_total} also carry structured total-frame timing"
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
