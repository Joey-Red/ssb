#!/usr/bin/env python3
"""Augment UFD visual discovery with higher-value public SSBU visual archives.

This maintenance script runs immediately after discover-ufd-visuals.py. It uses
SmashWiki's per-fighter SSBU hitbox repositories plus the public Cross Mod based
Ultimate Hitbox Viewer archive, but only for moves that the committed coverage
audit currently reports as source-less or unresolved.

External media is never assumed exact merely because it exists. The normal
vendor still validates encoded timing against documented game timing. A higher-
quality animated source may supersede an unresolved UFD reference for coverage
purposes, while provenance is retained in a separate deterministic report.
"""
from __future__ import annotations

import importlib.util
import json
import re
from collections import defaultdict
from pathlib import Path
from typing import Any
from urllib.parse import quote, unquote, urlparse

from bs4 import BeautifulSoup
from curl_cffi import requests as browser_requests

ROOT = Path(__file__).resolve().parents[1]
UFD_DISCOVERY = ROOT / "scripts/discover-ufd-visuals.py"
FRAME_DATA = ROOT / "src/data/frameData.generated.json"
SOURCES = ROOT / "src/data/visualMediaSources.json"
COVERAGE = ROOT / "src/data/visualMediaCoverage.generated.json"
AUDIT = ROOT / "src/data/visualCoverageAudit.generated.json"
REPORT = ROOT / "src/data/externalVisualSources.generated.json"

WIKI_API = "https://www.ssbwiki.com/api.php"
WIKI_BASE = "https://www.ssbwiki.com"
DRAKE_TREE = "https://api.github.com/repos/drakeirving/ult-hitbox-viewer/git/trees/master?recursive=1"
DRAKE_RAW = "https://raw.githubusercontent.com/drakeirving/ult-hitbox-viewer/master/"
TIMEOUT = 45

spec = importlib.util.spec_from_file_location("ssb_ufd_discovery", UFD_DISCOVERY)
if spec is None or spec.loader is None:
    raise RuntimeError(f"unable to load {UFD_DISCOVERY}")
ufd = importlib.util.module_from_spec(spec)
spec.loader.exec_module(ufd)

WIKI_DISPLAY_OVERRIDES = {
    "banjo-and-kazooie": "Banjo & Kazooie",
    "bowser-jr": "Bowser Jr.",
    "dark-samus": "Dark Samus",
    "dr-mario": "Dr. Mario",
    "duck-hunt": "Duck Hunt",
    "ice-climbers": "Ice Climbers",
    "king-k-rool": "King K. Rool",
    "mega-man": "Mega Man",
    "mii-brawler": "Mii Brawler",
    "mii-gunner": "Mii Gunner",
    "mii-swordfighter": "Mii Swordfighter",
    "min-min": "Min Min",
    "mr-game-and-watch": "Mr. Game & Watch",
    "pac-man": "Pac-Man",
    "piranha-plant": "Piranha Plant",
    "rob": "R.O.B.",
    "rosalina-and-luma": "Rosalina & Luma",
    "toon-link": "Toon Link",
    "wii-fit-trainer": "Wii Fit Trainer",
    "young-link": "Young Link",
    "zero-suit-samus": "Zero Suit Samus",
}

DRAKE_FIGHTERS = {
    "isabelle": "Isabelle",
    "jigglypuff": "Jigglypuff",
    "piranha-plant": "Piranha Plant",
}

ANIMATED_EXTENSIONS = {".gif", ".apng", ".webp"}
SOURCE_PRIORITY = {"cross-mod-hitbox-viewer": 100, "smashwiki": 90}


def http_get(url: str, **params: Any) -> Any:
    response = browser_requests.get(
        url,
        params=params or None,
        impersonate="chrome",
        timeout=TIMEOUT,
        headers={
            "Accept-Language": "en-US,en;q=0.9",
            "User-Agent": "SSBUTrainingGuideSourceDiscovery/1.0",
        },
    )
    response.raise_for_status()
    return response


def canonical(value: str) -> str:
    text = ufd.normalized(value)
    replacements = (
        ("neutral attack rapid jab finisher", "rapid jab finisher"),
        ("neutral attack rapid jab", "rapid jab"),
        ("neutral attack 1", "jab 1"),
        ("neutral attack 2", "jab 2"),
        ("neutral attack 3", "jab 3"),
        ("neutral attack", "jab"),
        ("neutral aerial", "neutral air"),
        ("forward aerial", "forward air"),
        ("back aerial", "back air"),
        ("up aerial", "up air"),
        ("down aerial", "down air"),
        ("neutral special", "neutral b"),
        ("side special", "side b"),
        ("up special", "up b"),
        ("down special", "down b"),
        ("standing grab", "grab"),
        ("edge attack", "ledge attack"),
        ("back roll", "backward roll"),
        ("air dodge neutral", "neutral air dodge"),
    )
    for old, new in replacements:
        text = text.replace(old, new)
    text = re.sub(r"\bmid\b", "", text)
    return " ".join(text.split())


def move_aliases(move: dict[str, Any]) -> set[str]:
    name = str(move.get("name") or move["id"])
    aliases = {canonical(name), canonical(move["id"].replace("-", " "))}
    base_name = re.sub(r"\s*\([^)]*\)\s*", " ", name).strip()
    if base_name:
        aliases.add(canonical(base_name))
    for inner in re.findall(r"\(([^)]*)\)", name):
        if inner.strip():
            aliases.add(canonical(inner))
    normalized_name = canonical(name)
    special_replacements = {
        "neutral b": "neutral special",
        "side b": "side special",
        "up b": "up special",
        "down b": "down special",
    }
    for old, new in special_replacements.items():
        if old in normalized_name:
            aliases.add(canonical(normalized_name.replace(old, new)))
            aliases.add(canonical(old))
    return {alias for alias in aliases if alias}


def label_tokens(value: str) -> set[str]:
    stop = {"ssbu", "hitbox", "hitboxes", "ground", "air", "aerial", "attack", "move"}
    return {token for token in canonical(value).split() if token not in stop and len(token) > 1}


def match_move(label: str, moves: list[dict[str, Any]]) -> tuple[dict[str, Any] | None, int]:
    candidate = canonical(label)
    candidate_tokens = label_tokens(candidate)
    scored: list[tuple[int, dict[str, Any]]] = []
    for move in moves:
        best = -1
        for alias in move_aliases(move):
            if not alias:
                continue
            if candidate == alias:
                best = max(best, 1000 + len(alias))
                continue
            if candidate.startswith(alias + " ") or alias.startswith(candidate + " "):
                best = max(best, 700 + min(len(alias), len(candidate)))
            elif alias in candidate:
                best = max(best, 500 + len(alias))
            alias_tokens = label_tokens(alias)
            if alias_tokens and candidate_tokens:
                overlap = len(alias_tokens & candidate_tokens)
                union = len(alias_tokens | candidate_tokens)
                if overlap:
                    best = max(best, 100 + int(300 * overlap / max(1, union)))
        if best >= 180:
            scored.append((best, move))
    if not scored:
        return None, 0
    scored.sort(key=lambda item: item[0], reverse=True)
    if len(scored) > 1 and scored[0][0] == scored[1][0]:
        return None, scored[0][0]
    return scored[0][1], scored[0][0]


def wiki_display(fighter_id: str, fighter: dict[str, Any]) -> str:
    if fighter_id in WIKI_DISPLAY_OVERRIDES:
        return WIKI_DISPLAY_OVERRIDES[fighter_id]
    name = str(fighter.get("name") or fighter_id).replace("_", " ")
    return " ".join(part.capitalize() for part in name.split())


def file_title_from_link(link: Any) -> str | None:
    title = str(link.get("title") or "")
    if title.startswith("File:"):
        return unquote(title)
    href = unquote(str(link.get("href") or ""))
    marker = "/File:"
    if marker in href:
        return "File:" + href.split(marker, 1)[1].split("#", 1)[0].split("?", 1)[0]
    marker = "title=File:"
    if marker in href:
        return "File:" + href.split(marker, 1)[1].split("&", 1)[0]
    return None


def image_info(file_titles: list[str]) -> dict[str, dict[str, Any]]:
    found: dict[str, dict[str, Any]] = {}
    unique = list(dict.fromkeys(file_titles))
    for start in range(0, len(unique), 40):
        batch = unique[start:start + 40]
        payload = http_get(
            WIKI_API,
            action="query",
            format="json",
            prop="imageinfo",
            iiprop="url|mime|size",
            redirects=1,
            titles="|".join(batch),
        ).json()
        for page in payload.get("query", {}).get("pages", {}).values():
            info = (page.get("imageinfo") or [None])[0]
            if not info:
                continue
            found[str(page.get("title"))] = info
    return found


def smashwiki_candidates(fighter_id: str, fighter: dict[str, Any], targets: set[str]) -> list[dict[str, Any]]:
    display = wiki_display(fighter_id, fighter)
    page_title = f"{display} (SSBU)/Hitboxes"
    payload = http_get(WIKI_API, action="parse", page=page_title, prop="text", format="json", redirects=1).json()
    html = payload.get("parse", {}).get("text", {}).get("*")
    if not html:
        return []
    page_url = f"{WIKI_BASE}/{quote(page_title.replace(' ', '_'), safe='()&._-/')}"
    soup = BeautifulSoup(html, "html.parser")
    moves = list(fighter.get("moves", []))
    rows: list[tuple[dict[str, Any], str, str, int]] = []
    file_titles: list[str] = []
    for row in soup.select("tr"):
        cells = row.find_all(["th", "td"], recursive=False)
        if len(cells) < 2:
            continue
        label = " ".join(cells[0].get_text(" ", strip=True).split())
        move, score = match_move(label, moves)
        if not move or move["id"] not in targets:
            continue
        row_files: list[str] = []
        for link in row.find_all("a"):
            title = file_title_from_link(link)
            if title and title.lower().endswith((".gif", ".png", ".webp", ".jpg", ".jpeg", ".apng")):
                row_files.append(title)
        for title in dict.fromkeys(row_files):
            rows.append((move, label, title, score))
            file_titles.append(title)

    infos = image_info(file_titles)
    candidates: list[dict[str, Any]] = []
    for move, row_label, title, score in rows:
        info = infos.get(title)
        if not info:
            continue
        url = str(info.get("url") or "")
        ext = Path(urlparse(url).path).suffix.lower()
        if ext not in ufd.MEDIA_EXTENSIONS:
            continue
        file_label = title.removeprefix("File:")
        timeline = ufd.timeline_class(fighter_id, str(move.get("name") or move["id"]), file_label)
        candidates.append({
            "fighterId": fighter_id,
            "moveId": move["id"],
            "matchLabel": row_label,
            "matchScore": score,
            "id": f"smashwiki-{ufd.visual_id(url)}",
            "label": Path(file_label).stem,
            "downloadUrl": url,
            "sourceFormat": ext.lstrip("."),
            "mediaType": "animation" if ext in ANIMATED_EXTENSIONS else "image",
            "timelineClass": timeline,
            "timingBasis": "parent-action" if timeline == "fighter-action" else "independent-source",
            "sourceProvider": "smashwiki",
            "sourcePageUrl": str(info.get("descriptionurl") or page_url),
            "sourceAttribution": "SmashWiki SSBU hitbox repository; preserve file-page provenance and revision history",
            "sourceQuality": SOURCE_PRIORITY["smashwiki"],
        })
    return candidates


def smashwiki_defense_candidates(fighter_id: str, fighter: dict[str, Any], targets: set[str]) -> list[dict[str, Any]]:
    """Probe each fighter's file prefix for dodge/roll media absent from hitbox tables."""
    if not targets:
        return []
    display = wiki_display(fighter_id, fighter)
    prefixes = [re.sub(r"[^A-Za-z0-9]", "", display), display.split()[0].replace(".", "")]
    moves = list(fighter.get("moves", []))
    candidates: list[dict[str, Any]] = []
    seen_titles: set[str] = set()
    for prefix in dict.fromkeys(prefix for prefix in prefixes if len(prefix) >= 3):
        continuation: str | None = None
        for _ in range(4):
            params: dict[str, Any] = {
                "action": "query", "format": "json", "list": "allimages", "ailimit": "max",
                "aiprefix": prefix, "aiprop": "url|mime|size",
            }
            if continuation:
                params["aicontinue"] = continuation
            payload = http_get(WIKI_API, **params).json()
            for image in payload.get("query", {}).get("allimages", []):
                title = str(image.get("name") or "")
                if title in seen_titles or "ssbu" not in title.lower():
                    continue
                compact = canonical(title)
                if not any(word in compact for word in ("dodge", "roll", "escape")):
                    continue
                seen_titles.add(title)
                move, score = match_move(title, moves)
                if not move or move["id"] not in targets:
                    continue
                url = str(image.get("url") or "")
                ext = Path(urlparse(url).path).suffix.lower()
                if ext not in ufd.MEDIA_EXTENSIONS:
                    continue
                candidates.append({
                    "fighterId": fighter_id,
                    "moveId": move["id"],
                    "matchLabel": title,
                    "matchScore": score,
                    "id": f"smashwiki-{ufd.visual_id(url)}",
                    "label": Path(title).stem,
                    "downloadUrl": url,
                    "sourceFormat": ext.lstrip("."),
                    "mediaType": "animation" if ext in ANIMATED_EXTENSIONS else "image",
                    "timelineClass": "fighter-action",
                    "timingBasis": "parent-action",
                    "sourceProvider": "smashwiki",
                    "sourcePageUrl": str(image.get("descriptionurl") or f"{WIKI_BASE}/File:{quote(title)}"),
                    "sourceAttribution": "SmashWiki SSBU movement/defense media",
                    "sourceQuality": SOURCE_PRIORITY["smashwiki"],
                })
            continuation = payload.get("continue", {}).get("aicontinue")
            if not continuation:
                break
    return candidates


def drake_candidates(frame_data: dict[str, Any], target_moves: dict[str, set[str]]) -> list[dict[str, Any]]:
    payload = http_get(DRAKE_TREE).json()
    tree = payload.get("tree", [])
    if payload.get("truncated"):
        raise RuntimeError("Ultimate Hitbox Viewer tree response was truncated")
    candidates: list[dict[str, Any]] = []
    for item in tree:
        path = str(item.get("path") or "")
        match = re.fullmatch(r"data/([^/]+)/video/gif/(.+\.gif)", path, flags=re.IGNORECASE)
        if not match:
            continue
        directory, filename = match.groups()
        fighter_id = next((fid for fid, dirname in DRAKE_FIGHTERS.items() if dirname.lower() == directory.lower()), None)
        if not fighter_id or not target_moves.get(fighter_id):
            continue
        fighter = frame_data["fighters"][fighter_id]
        move, score = match_move(Path(filename).stem, list(fighter.get("moves", [])))
        if not move or move["id"] not in target_moves[fighter_id]:
            continue
        timeline = ufd.timeline_class(fighter_id, str(move.get("name") or move["id"]), Path(filename).stem)
        raw_url = DRAKE_RAW + quote(path, safe="/")
        candidates.append({
            "fighterId": fighter_id,
            "moveId": move["id"],
            "matchLabel": Path(filename).stem,
            "matchScore": score,
            "id": f"crossmod-{ufd.visual_id(raw_url)}",
            "label": Path(filename).stem,
            "downloadUrl": raw_url,
            "sourceFormat": "gif",
            "mediaType": "animation",
            "timelineClass": timeline,
            "timingBasis": "parent-action" if timeline == "fighter-action" else "independent-source",
            "sourceProvider": "cross-mod-hitbox-viewer",
            "sourcePageUrl": f"https://github.com/drakeirving/ult-hitbox-viewer/blob/master/{quote(path, safe='/')}",
            "sourceAttribution": "Ultimate Hitbox Viewer / EyeDonutz Cross Mod render archive",
            "sourceQuality": SOURCE_PRIORITY["cross-mod-hitbox-viewer"],
        })
    return candidates


def frame_move_record(fighter_id: str, fighter: dict[str, Any], move: dict[str, Any], source_page: str) -> dict[str, Any]:
    return {
        "fighterId": fighter_id,
        "moveId": move["id"],
        "label": f"{fighter.get('name') or fighter_id} {move.get('name') or move['id']}",
        "sourceUrl": source_page,
        "totalFrames": ufd.positive_frame(move.get("totalFrames")),
        "startupFrame": move.get("startupFrame"),
        "active": move.get("active"),
        "activeSpan": list(ufd.active_span(move.get("active"), move.get("startupFrame"), move.get("totalFrames")) or []),
        "landingLag": ufd.positive_frame(move.get("landingLag")),
        "variants": [],
    }


def main() -> int:
    frame_data = json.loads(FRAME_DATA.read_text(encoding="utf-8"))
    sources = json.loads(SOURCES.read_text(encoding="utf-8"))
    coverage = json.loads(COVERAGE.read_text(encoding="utf-8"))
    audit = json.loads(AUDIT.read_text(encoding="utf-8"))
    if sources.get("version") != 3 or coverage.get("version") != 2 or audit.get("version") != 2:
        raise SystemExit("visual source/coverage/audit schema mismatch")

    target_moves: dict[str, set[str]] = defaultdict(set)
    gap_timelines: dict[tuple[str, str], set[str]] = defaultdict(set)
    gap_variants: dict[tuple[str, str, str], str] = {}
    for move in audit.get("movesWithoutVisuals", []):
        target_moves[move["fighterId"]].add(move["moveId"])
    for gap in coverage.get("gaps", []):
        target_moves[gap["fighterId"]].add(gap["moveId"])
        gap_timelines[(gap["fighterId"], gap["moveId"])].add(gap.get("timelineClass", "fighter-action"))
        gap_variants[(gap["fighterId"], gap["moveId"], gap["variantId"])] = gap.get("timelineClass", "fighter-action")

    discovered: list[dict[str, Any]] = []
    failures: list[str] = []
    for fighter_id in sorted(target_moves):
        fighter = frame_data["fighters"].get(fighter_id)
        if not fighter:
            continue
        try:
            found = smashwiki_candidates(fighter_id, fighter, target_moves[fighter_id])
            defense_targets = {
                move_id for move_id in target_moves[fighter_id]
                if next((m for m in fighter.get("moves", []) if m["id"] == move_id and m.get("category") == "defense"), None)
            }
            found.extend(smashwiki_defense_candidates(fighter_id, fighter, defense_targets))
            discovered.extend(found)
            print(f"[smashwiki] {fighter_id}: {len(found)} candidate visuals")
        except Exception as exc:  # noqa: BLE001
            failures.append(f"{fighter_id}: {exc}")
            print(f"[smashwiki-warning] {fighter_id}: {exc}")

    try:
        drake = drake_candidates(frame_data, target_moves)
        discovered.extend(drake)
        print(f"[cross-mod] {len(drake)} candidate visuals")
    except Exception as exc:  # noqa: BLE001
        failures.append(f"cross-mod: {exc}")
        print(f"[cross-mod-warning] {exc}")

    # Prefer one strongest candidate per move/timeline. Higher-fidelity Cross Mod
    # wins over SmashWiki; within a provider, a stronger textual match wins.
    best: dict[tuple[str, str, str], dict[str, Any]] = {}
    for candidate in discovered:
        key = (candidate["fighterId"], candidate["moveId"], candidate["timelineClass"])
        rank = (int(candidate["sourceQuality"]), int(candidate["matchScore"]), candidate["mediaType"] == "animation")
        previous = best.get(key)
        if previous is None:
            best[key] = candidate
            continue
        previous_rank = (int(previous["sourceQuality"]), int(previous["matchScore"]), previous["mediaType"] == "animation")
        if rank > previous_rank:
            best[key] = candidate

    source_by_key = {(move["fighterId"], move["moveId"]): move for move in sources["moves"]}
    added_moves = 0
    added_variants = 0
    superseded: list[dict[str, Any]] = []
    accepted: list[dict[str, Any]] = []
    for (fighter_id, move_id, timeline), candidate in sorted(best.items()):
        fighter = frame_data["fighters"][fighter_id]
        frame_move = next((move for move in fighter.get("moves", []) if move["id"] == move_id), None)
        if not frame_move:
            continue
        key = (fighter_id, move_id)
        record = source_by_key.get(key)
        if record is None:
            record = frame_move_record(fighter_id, fighter, frame_move, candidate["sourcePageUrl"])
            sources["moves"].append(record)
            source_by_key[key] = record
            added_moves += 1

        variant = {field: candidate[field] for field in (
            "id", "label", "downloadUrl", "sourceFormat", "mediaType", "timelineClass", "timingBasis",
            "sourceProvider", "sourcePageUrl", "sourceAttribution", "sourceQuality",
        )}
        used_ids = {str(item.get("id")) for item in record["variants"]}
        base_id = variant["id"]
        suffix = 2
        while variant["id"] in used_ids:
            variant["id"] = f"{base_id}-{suffix}"
            suffix += 1

        # If this move/timeline currently has unresolved UFD source variants and
        # the external candidate is animated, keep the old reference in runtime
        # but remove it from required coverage accounting. The replacement still
        # has to pass the normal vendor's timing checks to resolve the blocker.
        if candidate["mediaType"] == "animation" and timeline in gap_timelines.get(key, set()):
            for existing in record["variants"]:
                existing_key = (fighter_id, move_id, ufd.visual_id(existing.get("downloadUrl", "")))
                existing_safe = re.sub(r"[^a-zA-Z0-9_-]+", "-", str(existing.get("id") or "")).strip("-").lower()
                gap_timeline = gap_variants.get((fighter_id, move_id, existing_safe))
                if gap_timeline == timeline and existing.get("sourceProvider", "ultimate-frame-data") != candidate["sourceProvider"]:
                    existing["coverageRequired"] = False
                    existing["supersededBy"] = variant["id"]
                    superseded.append({
                        "fighterId": fighter_id,
                        "moveId": move_id,
                        "variantId": existing.get("id"),
                        "supersededBy": variant["id"],
                    })

        record["variants"].append(variant)
        record["sourceUrl"] = candidate["sourcePageUrl"] if added_moves else record.get("sourceUrl")
        added_variants += 1
        accepted.append(candidate)

    sources["moves"].sort(key=lambda move: (move["fighterId"], move["moveId"]))
    timeline_counts: dict[str, int] = defaultdict(int)
    for move in sources["moves"]:
        for variant in move["variants"]:
            timeline_counts[str(variant.get("timelineClass", "fighter-action"))] += 1
    sources.update({
        "source": "Ultimate Frame Data + curated external SSBU visual archives",
        "generatedBy": "scripts/discover-ufd-visuals.py + scripts/discover-external-visuals.py",
        "mappedMoves": len(sources["moves"]),
        "mappedVariants": sum(len(move["variants"]) for move in sources["moves"]),
        "timelineCounts": dict(sorted(timeline_counts.items())),
    })
    SOURCES.write_text(json.dumps(sources, indent=2) + "\n", encoding="utf-8")

    report = {
        "version": 1,
        "targetMoveCount": sum(len(moves) for moves in target_moves.values()),
        "rawCandidates": len(discovered),
        "acceptedCandidates": len(accepted),
        "addedMoves": added_moves,
        "addedVariants": added_variants,
        "supersededUnresolvedReferences": len(superseded),
        "providerCounts": dict(sorted({provider: sum(1 for item in accepted if item["sourceProvider"] == provider) for provider in SOURCE_PRIORITY}.items())),
        "warnings": failures,
        "accepted": accepted,
        "superseded": superseded,
    }
    REPORT.write_text(json.dumps(report, indent=2) + "\n", encoding="utf-8")
    print(
        f"external discovery: {len(discovered)} raw / {len(accepted)} accepted; "
        f"{added_moves} source-less moves gained media; {len(superseded)} unresolved references superseded"
    )
    if not accepted:
        raise SystemExit("external visual discovery found no usable candidates; refusing silent no-op")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
