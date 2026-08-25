#!/usr/bin/env python3
"""Restore canonical move-level provenance after multi-source augmentation.

The external visual discovery pass may add SmashWiki/Cross Mod variants to a move
that was originally discovered from Ultimate Frame Data. Move-level `sourceUrl`
must continue to describe that canonical parent record; variant-level provider
metadata carries the external provenance. Records created entirely by an external
provider keep their external source page.
"""
from __future__ import annotations

import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SOURCES = ROOT / "src/data/visualMediaSources.json"
UFD_MANIFEST = ROOT / "src/data/ufd-manifest.json"


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

    SOURCES.write_text(json.dumps(source, indent=2) + "\n", encoding="utf-8")
    print(f"source provenance: restored {restored} mixed records; retained {external_only} external-only records")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
