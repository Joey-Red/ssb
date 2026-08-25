#!/usr/bin/env python3
"""Temporarily merge generated game-data timing evidence into vendor overrides.

The workflow restores the tracked human-reviewed override file after media
vendoring. This keeps generated evidence auditable in its own report while
letting the existing strict vendor consume the proven Total Frames values.
"""
from __future__ import annotations

import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
MANUAL = ROOT / "src/data/visualTimelineOverrides.json"
GENERATED = ROOT / "src/data/rubenTimingOverrides.generated.json"


def main() -> int:
    manual = json.loads(MANUAL.read_text(encoding="utf-8"))
    generated = json.loads(GENERATED.read_text(encoding="utf-8"))
    if manual.get("version") != 1 or generated.get("version") != 1:
        raise SystemExit("timing override schema mismatch")
    manual_entries = manual.get("entries")
    generated_entries = generated.get("entries")
    if not isinstance(manual_entries, dict) or not isinstance(generated_entries, dict):
        raise SystemExit("timing override entries must be objects")

    collisions = sorted(set(manual_entries) & set(generated_entries))
    merged = dict(generated_entries)
    merged.update(manual_entries)  # human-reviewed evidence always wins
    manual["entries"] = merged
    MANUAL.write_text(json.dumps(manual, indent=2) + "\n", encoding="utf-8")
    print(
        f"applied {len(generated_entries)} generated timing overrides temporarily; "
        f"{len(collisions)} manual collisions preserved"
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
