#!/usr/bin/env python3
"""Build compact same-origin runtime visual indexes, one JSON file per fighter."""
from __future__ import annotations

import json
import shutil
from pathlib import Path
from typing import Any

ROOT = Path(__file__).resolve().parents[1]
SOURCES = ROOT / "src/data/visualMediaSources.json"
ASSETS = ROOT / "src/data/visualMediaAssets.generated.json"
OUTPUT = ROOT / "public/data/visual-media"


def main() -> int:
    source = json.loads(SOURCES.read_text(encoding="utf-8"))
    assets = json.loads(ASSETS.read_text(encoding="utf-8"))
    if source.get("version") != 3 or assets.get("version") != 3:
        raise SystemExit("visual source/assets must both be version 3")

    shutil.rmtree(OUTPUT, ignore_errors=True)
    OUTPUT.mkdir(parents=True, exist_ok=True)
    grouped: dict[str, list[dict[str, Any]]] = {}

    for move in source["moves"]:
        key = f"{move['fighterId']}:{move['moveId']}"
        staged = assets["moves"].get(key)
        if not staged or not staged.get("variants"):
            raise SystemExit(f"missing staged runtime visual variants for {key}")
        active_span = move.get("activeSpan") or []
        fallback_total = (active_span[1] if len(active_span) == 2 else None) or move.get("startupFrame") or 1
        record = {
            "id": f"{move['fighterId']}-{move['moveId']}-ufd",
            "fighterId": move["fighterId"],
            "moveId": move["moveId"],
            "label": move["label"],
            "sourceUrl": move["sourceUrl"],
            "totalFrames": move.get("totalFrames") or fallback_total,
            "frames": [],
            "variants": staged["variants"],
        }
        grouped.setdefault(move["fighterId"], []).append(record)

    if len(grouped) != 89:
        raise SystemExit(f"expected runtime indexes for 89 fighters, found {len(grouped)}")

    total_bytes = 0
    for fighter_id, moves in grouped.items():
        payload = json.dumps({"version": 1, "fighterId": fighter_id, "moves": moves}, separators=(",", ":")) + "\n"
        path = OUTPUT / f"{fighter_id}.json"
        path.write_text(payload, encoding="utf-8")
        total_bytes += path.stat().st_size

    print(f"wrote {len(grouped)} fighter visual indexes / {sum(len(moves) for moves in grouped.values())} moves / {total_bytes / 1024:.1f} KiB")
    if total_bytes > 16 * 1024 * 1024:
        raise SystemExit(f"runtime visual indexes unexpectedly large: {total_bytes / 1024 / 1024:.1f} MiB")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
