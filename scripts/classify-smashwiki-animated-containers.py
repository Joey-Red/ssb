#!/usr/bin/env python3
"""Promote category-verified SmashWiki PNG containers to animation media.

SmashWiki stores a number of Ultimate animations as APNG while retaining the
ordinary ``.png`` filename suffix. Extension-only classification therefore
mislabels those files as static images. SmashWiki's ``Animated images (SSBU)``
category is explicit source metadata that the file is animated and belongs to
Ultimate, so use that metadata to correct only already-discovered SmashWiki
variants. This changes media decoding semantics, never move identity or timing.
"""
from __future__ import annotations

import importlib.util
import json
from pathlib import Path
from urllib.parse import unquote, urlparse

ROOT = Path(__file__).resolve().parents[1]
SHORTHAND = ROOT / "scripts/discover-smashwiki-shorthand-visuals.py"
SOURCES = ROOT / "src/data/visualMediaSources.json"
REPORT = ROOT / "src/data/smashwikiAnimatedContainers.generated.json"

spec = importlib.util.spec_from_file_location("ssb_smashwiki_shorthand", SHORTHAND)
if spec is None or spec.loader is None:
    raise RuntimeError(f"unable to load {SHORTHAND}")
short = importlib.util.module_from_spec(spec)
spec.loader.exec_module(short)


def filename_candidates(variant: dict[str, object]) -> set[str]:
    names: set[str] = set()
    url = str(variant.get("downloadUrl") or "")
    if url:
        basename = unquote(Path(urlparse(url).path).name).lower()
        if basename:
            names.add(basename)
    label = str(variant.get("label") or "").strip()
    if label:
        names.add(f"{label}.png".lower())
    return names


def main() -> int:
    sources = json.loads(SOURCES.read_text(encoding="utf-8"))
    if sources.get("version") != 3:
        raise SystemExit("visual source manifest must use schema version 3")

    categorized = short.ssbu_animated_titles()
    if len(categorized) < 1000:
        raise SystemExit(
            f"SmashWiki Ultimate animated-media category unexpectedly small: {len(categorized)} files"
        )

    promoted: list[dict[str, str]] = []
    checked = 0
    for move in sources.get("moves", []):
        for variant in move.get("variants", []):
            if str(variant.get("sourceProvider") or "") != "smashwiki":
                continue
            if str(variant.get("sourceFormat") or "").lower() != "png":
                continue
            checked += 1
            matches = sorted(filename_candidates(variant) & categorized)
            if not matches:
                continue
            if variant.get("mediaType") == "animation":
                continue
            variant["mediaType"] = "animation"
            variant["sourceAnimationEvidence"] = "smashwiki-category-animated-images-ssbu"
            promoted.append({
                "fighterId": str(move.get("fighterId") or ""),
                "moveId": str(move.get("moveId") or ""),
                "variantId": str(variant.get("id") or ""),
                "fileTitle": matches[0],
            })

    SOURCES.write_text(json.dumps(sources, indent=2) + "\n", encoding="utf-8")
    REPORT.write_text(json.dumps({
        "version": 1,
        "category": short.SSBU_ANIMATED_CATEGORY,
        "categoryFiles": len(categorized),
        "smashwikiPngVariantsChecked": checked,
        "promotedAnimatedPngVariants": len(promoted),
        "promoted": promoted,
        "policy": "category metadata changes animation decoding only; it does not assert exact game-frame timing",
    }, indent=2) + "\n", encoding="utf-8")
    print(
        f"SmashWiki animated containers: promoted {len(promoted)}/{checked} PNG variants "
        f"using {len(categorized)} category-verified SSBU animations"
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
