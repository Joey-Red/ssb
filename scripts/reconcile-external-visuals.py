#!/usr/bin/env python3
"""Finalize the multi-source visual manifest after external discovery.

Discovery may identify a stronger external animation for an unresolved move,
but move-level similarity is not enough to retire several distinct source
variants. This step removes an old unresolved reference only when replacement
is unambiguous:

- it is the only superseded variant in that move/timeline, or
- the old/new variant labels are strongly equivalent and carry the same numeric
  state markers.

Ambiguous replacements remain additive. Their old references are restored to
required coverage so the audit cannot improve merely because one broad clip was
found for a move that has several distinct states.
"""
from __future__ import annotations

import json
import re
from collections import Counter
from difflib import SequenceMatcher
from pathlib import Path
from typing import Any

ROOT = Path(__file__).resolve().parents[1]
SOURCES = ROOT / "src/data/visualMediaSources.json"
REPORT = ROOT / "src/data/externalVisualSources.generated.json"


def compact_label(value: Any) -> str:
    return re.sub(r"[^a-z0-9]+", "", str(value or "").lower())


def numeric_markers(value: Any) -> tuple[str, ...]:
    return tuple(re.findall(r"\d+", str(value or "")))


def equivalent_variant(old: dict[str, Any], replacement: dict[str, Any]) -> bool:
    old_label = compact_label(old.get("label") or old.get("id"))
    new_label = compact_label(replacement.get("label") or replacement.get("id"))
    if not old_label or not new_label:
        return False
    if old_label == new_label:
        return True

    old_numbers = numeric_markers(old.get("label") or old.get("id"))
    new_numbers = numeric_markers(replacement.get("label") or replacement.get("id"))
    if old_numbers != new_numbers:
        return False

    # With the same state markers, require near-identical names. This admits
    # provider/fighter naming differences while rejecting one generic clip as a
    # replacement for several numbered charge/loop/strength states.
    return SequenceMatcher(None, old_label, new_label).ratio() >= 0.90


def main() -> int:
    sources = json.loads(SOURCES.read_text(encoding="utf-8"))
    report = json.loads(REPORT.read_text(encoding="utf-8"))
    if sources.get("version") != 3 or report.get("version") != 1:
        raise SystemExit("external visual source schema mismatch")

    removed: list[dict[str, Any]] = []
    rejected: list[dict[str, Any]] = []
    empty_moves: list[str] = []

    for move in sources.get("moves", []):
        variants = list(move.get("variants", []))
        by_id = {str(variant.get("id")): variant for variant in variants}
        flagged = [
            variant for variant in variants
            if variant.get("coverageRequired") is False and variant.get("supersededBy")
        ]
        flagged_per_timeline = Counter(str(variant.get("timelineClass", "fighter-action")) for variant in flagged)

        kept = []
        for variant in variants:
            if variant not in flagged:
                kept.append(variant)
                continue

            replacement_id = str(variant.get("supersededBy"))
            replacement = by_id.get(replacement_id)
            timeline = str(variant.get("timelineClass", "fighter-action"))
            unambiguous = flagged_per_timeline[timeline] == 1
            equivalent = bool(replacement and equivalent_variant(variant, replacement))

            if replacement and str(replacement.get("timelineClass", "fighter-action")) == timeline and (unambiguous or equivalent):
                removed.append({
                    "fighterId": move["fighterId"],
                    "moveId": move["moveId"],
                    "variantId": variant.get("id"),
                    "supersededBy": replacement_id,
                    "basis": "single-unresolved-variant" if unambiguous else "variant-label-equivalence",
                })
                continue

            # Restore ambiguous source references to required coverage. Keep the
            # external candidate too: the vendor can validate it independently,
            # but its existence cannot erase a distinct unresolved state.
            variant.pop("coverageRequired", None)
            variant.pop("supersededBy", None)
            rejected.append({
                "fighterId": move["fighterId"],
                "moveId": move["moveId"],
                "variantId": variant.get("id"),
                "candidateReplacement": replacement_id,
                "reason": "multiple unresolved variants share this timeline and the candidate is not variant-equivalent",
            })
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
    report["rejectedAmbiguousSupersessions"] = len(rejected)
    report["removed"] = removed
    report["rejected"] = rejected
    REPORT.write_text(json.dumps(report, indent=2) + "\n", encoding="utf-8")
    print(
        f"external reconciliation: removed {len(removed)} unambiguous unresolved source references; "
        f"kept {len(rejected)} ambiguous references required"
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
