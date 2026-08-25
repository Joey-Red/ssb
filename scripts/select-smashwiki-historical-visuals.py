#!/usr/bin/env python3
"""Select a fuller historical SmashWiki revision only when it proves a gain.

SmashWiki file pages retain old EyeDonutz/Zeckemyro revisions. Some current or
mirrored files can be shorter than a documented fighter action while a previous
revision contains the complete rendered sequence. This script is intentionally
conservative:

- only externally discovered SmashWiki animated fighter-action variants qualify;
- the current candidate is decoded first;
- history is examined only when the current source has fewer images than the
  documented Total Frames;
- a historical revision is selected only if it reaches Total Frames and the
  current candidate does not;
- the original URL, file page, revision timestamp, and measured frame counts are
  retained as provenance.

This does not itself claim exactness. The normal full-motion vendor still makes
that decision after the replacement has been selected.
"""
from __future__ import annotations

import io
import json
from pathlib import Path
from typing import Any
from urllib.parse import unquote, urlparse

from PIL import Image
from curl_cffi import requests as browser_requests

ROOT = Path(__file__).resolve().parents[1]
SOURCES = ROOT / "src/data/visualMediaSources.json"
OUTPUT = ROOT / "src/data/smashwikiHistoricalVisuals.generated.json"
WIKI_API = "https://www.ssbwiki.com/api.php"
TIMEOUT = 45
MAX_REVISIONS = 12


def get(url: str, **params: Any) -> Any:
    response = browser_requests.get(
        url,
        params=params or None,
        impersonate="chrome",
        timeout=TIMEOUT,
        headers={"User-Agent": "SSBUTrainingGuideHistorySelector/1.0"},
    )
    response.raise_for_status()
    return response


def frame_count(url: str) -> int:
    data = get(url).content
    with Image.open(io.BytesIO(data)) as image:
        return int(getattr(image, "n_frames", 1))


def file_title(source_page_url: str) -> str | None:
    path = unquote(urlparse(source_page_url).path).lstrip("/")
    if path.startswith("wiki/"):
        path = path[5:]
    if not path.startswith("File:"):
        return None
    return path.replace("_", " ")


def revisions(title: str) -> list[dict[str, Any]]:
    payload = get(
        WIKI_API,
        action="query",
        format="json",
        prop="imageinfo",
        iiprop="url|timestamp|mime|size",
        iilimit="max",
        titles=title,
    ).json()
    pages = list(payload.get("query", {}).get("pages", {}).values())
    if not pages:
        return []
    return list(pages[0].get("imageinfo") or [])[:MAX_REVISIONS]


def main() -> int:
    sources = json.loads(SOURCES.read_text(encoding="utf-8"))
    if sources.get("version") != 3:
        raise SystemExit("visualMediaSources.json must be schema version 3")

    selected: list[dict[str, Any]] = []
    checked = 0
    warnings: list[str] = []
    count_cache: dict[str, int] = {}

    def measured(url: str) -> int:
        if url not in count_cache:
            count_cache[url] = frame_count(url)
        return count_cache[url]

    for move in sources.get("moves", []):
        target = move.get("totalFrames")
        if not isinstance(target, int) or target <= 0:
            continue
        for variant in move.get("variants", []):
            if variant.get("sourceProvider") != "smashwiki":
                continue
            if variant.get("mediaType") != "animation" or variant.get("timelineClass") != "fighter-action":
                continue
            page = str(variant.get("sourcePageUrl") or "")
            title = file_title(page)
            if not title:
                continue
            current_url = str(variant.get("downloadUrl") or "")
            if not current_url:
                continue
            try:
                current_count = measured(current_url)
                checked += 1
                if current_count >= target:
                    continue
                history = revisions(title)
                best: tuple[int, str, str | None] | None = None
                for revision in history:
                    url = str(revision.get("url") or "")
                    if not url or url == current_url:
                        continue
                    try:
                        count = measured(url)
                    except Exception as exc:  # noqa: BLE001
                        warnings.append(f"{title} {revision.get('timestamp')}: {exc}")
                        continue
                    if count < target:
                        continue
                    # Prefer the smallest complete revision (least unexplained
                    # excess), then the newest ordering returned by MediaWiki.
                    score = count - target
                    if best is None or score < best[0]:
                        best = (score, url, revision.get("timestamp"))
                if best is None:
                    continue
                _, chosen_url, timestamp = best
                chosen_count = measured(chosen_url)
                original = current_url
                variant["downloadUrl"] = chosen_url
                variant["sourceProvider"] = "smashwiki-history"
                variant["sourceOriginalCurrentUrl"] = original
                variant["sourceRevisionTimestamp"] = timestamp
                variant["sourceAttribution"] = (
                    "Historical SmashWiki SSBU hitbox revision selected because the current file is shorter "
                    "than documented Total Frames while this revision reaches the documented fighter action"
                )
                selected.append({
                    "fighterId": move["fighterId"],
                    "moveId": move["moveId"],
                    "variantId": variant["id"],
                    "fileTitle": title,
                    "targetFrames": target,
                    "currentFrameCount": current_count,
                    "historicalFrameCount": chosen_count,
                    "currentUrl": original,
                    "selectedUrl": chosen_url,
                    "revisionTimestamp": timestamp,
                    "sourcePageUrl": page,
                })
            except Exception as exc:  # noqa: BLE001
                warnings.append(f"{move['fighterId']}:{move['moveId']}:{variant.get('id')}: {exc}")

    SOURCES.write_text(json.dumps(sources, indent=2) + "\n", encoding="utf-8")
    OUTPUT.write_text(json.dumps({
        "version": 1,
        "checkedCurrentSmashWikiAnimations": checked,
        "selectedHistoricalRevisions": len(selected),
        "policy": "historical revision is selected only when current source is short and history reaches documented Total Frames",
        "warnings": warnings,
        "selected": selected,
    }, indent=2) + "\n", encoding="utf-8")
    print(f"SmashWiki history: checked {checked}; selected {len(selected)} demonstrably fuller revisions")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
