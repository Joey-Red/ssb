#!/usr/bin/env python3
"""Restore canonical provenance and conservatively repair visual timeline ownership.

The external visual discovery pass may add SmashWiki/Cross Mod variants to a move
that was originally discovered from Ultimate Frame Data. Move-level `sourceUrl`
must continue to describe that canonical parent record; variant-level provider
metadata carries the external provenance. Records created entirely by an external
provider keep their external source page.

Source filenames are frequently compact CamelCase stems (for example
``Banjo_KazooieDAirLanding``). The baseline classifier intentionally avoids
splitting CamelCase and historically missed those landing-only clips, causing a
27-frame landing animation to be audited against a 56-frame aerial action. This
normalization pass runs after all source discovery and repairs only timeline
ownership that can be established from explicit source-label semantics. It never
creates timing, images, or frame mappings.
"""
from __future__ import annotations

import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SOURCES = ROOT / "src/data/visualMediaSources.json"
UFD_MANIFEST = ROOT / "src/data/ufd-manifest.json"


def compact(value: object) -> str:
    return re.sub(r"[^a-z0-9]", "", str(value or "").lower())


def refine_timeline(move: dict, variant: dict) -> str:
    """Return a stronger timeline class only when the source label proves it."""
    current = str(variant.get("timelineClass") or "fighter-action")
    if current != "fighter-action":
        return current

    label = compact(variant.get("label") or variant.get("id"))
    # UFD/SmashWiki commonly concatenate `Landing` onto the move stem. A landing
    # clip owns the landing timeline and must never be stretched to the parent's
    # aerial/special Total Frames.
    if "landing" in label:
        return "landing"

    return current


def main() -> int:
    source = json.loads(SOURCES.read_text(encoding="utf-8"))
    ufd = json.loads(UFD_MANIFEST.read_text(encoding="utf-8"))
    if source.get("version") != 3 or ufd.get("version") != 1:
        raise SystemExit("visual source/UFD manifest schema mismatch")

    base = str(ufd.get("sourceBaseUrl") or "https://ultimateframedata.com").rstrip("/")
    pages = {
        entry["fighterId"]: f"{base}/{entry['ufdSlug']}"
        for entry in ufd.get("fighters", [])
        if entry.get("fighterId") and entry.get("ufdSlug")
    }

    restored = 0
    external_only = 0
    timeline_repairs = 0
    for move in source.get("moves", []):
        variants = move.get("variants", [])
        # UFD-discovered variants have no external sourceProvider field. Mixed
        # records therefore retain the UFD parent page while each external
        # variant keeps its own provider/provenance metadata.
        has_ufd_variant = any(not variant.get("sourceProvider") for variant in variants)
        if has_ufd_variant:
            expected = pages.get(move.get("fighterId"))
            if expected and move.get("sourceUrl") != expected:
                move["sourceUrl"] = expected
                restored += 1
        else:
            external_only += 1

        for variant in variants:
            refined = refine_timeline(move, variant)
            if refined != variant.get("timelineClass"):
                variant["timelineClass"] = refined
                variant["timingBasis"] = "independent-source"
                timeline_repairs += 1

    timeline_counts: dict[str, int] = {}
    for move in source.get("moves", []):
        for variant in move.get("variants", []):
            timeline = str(variant.get("timelineClass") or "fighter-action")
            timeline_counts[timeline] = timeline_counts.get(timeline, 0) + 1
    source["timelineCounts"] = dict(sorted(timeline_counts.items()))

    SOURCES.write_text(json.dumps(source, indent=2) + "\n", encoding="utf-8")
    print(
        f"source provenance: restored {restored} mixed records; retained {external_only} external-only records; "
        f"reclassified {timeline_repairs} explicit landing timelines"
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
