#!/usr/bin/env python3
"""Finalize the multi-source visual manifest after external discovery.

External discovery marks an unresolved lower-quality UFD reference as optional
only when a stronger animated candidate for the same move/timeline was found.
This reconciliation step removes those superseded references from required
runtime vendoring while retaining the replacement/provenance relation in
externalVisualSources.generated.json.
"""
from __future__ import annotations

import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SOURCES = ROOT / "src/data/visualMediaSources.json"
REPORT = ROOT / "src/data/externalVisualSources.generated.json"


def main() -> int:
    sources = json.loads(SOURCES.read_text(encoding="utf-8"))
    report = json.loads(REPORT.read_text(encoding="utf-8"))
    if sources.get("version") != 3 or report.get("version") != 1:
        raise SystemExit("external visual source schema mismatch")

    removed = []
    empty_moves = []
    for move in sources.get("moves", []):
        kept = []
        for variant in move.get("variants", []):
            if variant.get("coverageRequired") is False and variant.get("supersededBy"):
                removed.append({
                    "fighterId": move["fighterId"],
                    "moveId": move["moveId"],
                    "variantId": variant.get("id"),
                    "supersededBy": variant.get("supersededBy"),
                })
                continue
            kept.append(variant)
        move["variants"] = kept
        if not kept:
            empty_moves.append(f"{move['fighterId']}:{move['moveId']}")

    if empty_moves:
        raise SystemExit("external reconciliation removed every variant for: " + ", ".join(empty_moves))

    sources["mappedMoves"] = len(sources.get("moves", []))
    sources["mappedVariants"] = sum(len(move.get("variants", [])) for move in sources.get("moves", []))
    SOURCES.write_text(json.dumps(sources, indent=2) + "\n", encoding="utf-8")

    report["removedSupersededReferences"] = len(removed)
    report["removed"] = removed
    REPORT.write_text(json.dumps(report, indent=2) + "\n", encoding="utf-8")
    print(f"external reconciliation: removed {len(removed)} superseded unresolved source references")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
