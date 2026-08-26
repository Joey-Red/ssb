#!/usr/bin/env python3
"""Recover verified source-less moves from exact SmashWiki SSBU sources.

This pass has two conservative lanes:

1. A tiny explicit registry for known move files whose file/category semantics
   identify one specific frame-data move but whose names are not reliably found
   by the generic discovery passes.
2. SmashWiki's ``Dodges (SSBU)`` category. Category page titles directly state
   fighter + action (Spot dodge, Forward roll, Back roll, or Air dodge), so they
   can recover real defensive animations even when the media filename itself does
   not contain the token ``SSBU`` (for example ``LucarioSpotdodge.gif``).

Neither lane asserts exact game-frame timing merely because an animation exists.
The full-motion vendor remains the timing gate and keeps the source provenance.
"""
from __future__ import annotations

import importlib.util
import json
import re
from collections import defaultdict
from pathlib import Path
from typing import Any
from urllib.parse import quote, urlparse

ROOT = Path(__file__).resolve().parents[1]
EXTERNAL_DISCOVERY = ROOT / "scripts/discover-external-visuals.py"
FRAME_DATA = ROOT / "src/data/frameData.generated.json"
SOURCES = ROOT / "src/data/visualMediaSources.json"
AUDIT = ROOT / "src/data/visualCoverageAudit.generated.json"
REPORT = ROOT / "src/data/smashwikiCuratedGapVisuals.generated.json"

spec = importlib.util.spec_from_file_location("ssb_external_discovery", EXTERNAL_DISCOVERY)
if spec is None or spec.loader is None:
    raise RuntimeError(f"unable to load {EXTERNAL_DISCOVERY}")
ext = importlib.util.module_from_spec(spec)
spec.loader.exec_module(ext)

# Each mapping is intentionally explicit: fighter id + exact committed move name
# + exact SmashWiki file title. Do not add a mapping unless the file semantics
# unambiguously identify the move.
CURATED: tuple[dict[str, str], ...] = (
    {
        "fighterId": "duck-hunt",
        "moveName": "Down B (Wild Gunman)",
        "fileTitle": "File:Duck Hunt Down B SSBU.gif",
        "verification": "SmashWiki Duck Hunt SSBU media labels this animation as Down B",
    },
    {
        "fighterId": "duck-hunt",
        "moveName": "Up B (Duck Jump)",
        "fileTitle": "File:Duck Hunt Up B SSBU.gif",
        "verification": "SmashWiki file describes Duck Hunt's up special in Ultimate",
    },
    {
        "fighterId": "kazuya",
        "moveName": "Down B (Heaven's Door)",
        "fileTitle": "File:Kazuya Down B SSBU.gif",
        "verification": "SmashWiki Kazuya SSBU media labels this animation as Down B; Heaven's Door is his down special",
    },
    {
        "fighterId": "mega-man",
        "moveName": "Up B (Rush Coil)",
        "fileTitle": "File:Mega Man Up B SSBU.gif",
        "verification": "SmashWiki Mega Man SSBU media labels this animation as Up B",
    },
    {
        "fighterId": "min-min",
        "moveName": "Down B (Arms Change)",
        "fileTitle": "File:Min Min Down B SSBU.gif",
        "verification": "SmashWiki Min Min SSBU media labels this animation as Down B",
    },
    {
        "fighterId": "rob",
        "moveName": "Side B (Arm Rotor)",
        "fileTitle": "File:ROB Side B SSBU.gif",
        "verification": "SmashWiki R.O.B. SSBU media labels this animation as Side B",
    },
    {
        "fighterId": "ryu",
        "moveName": "Side B (Tatsumaki Senpukyaku)",
        "fileTitle": "File:Ryu Side B SSBU.gif",
        "verification": "SmashWiki Ryu SSBU media labels this animation as Side B",
    },
    {
        "fighterId": "wii-fit-trainer",
        "moveName": "Down B (Deep Breathing)",
        "fileTitle": "File:Wii Fit Trainer Down B SSBU.gif",
        "verification": "SmashWiki Wii Fit Trainer SSBU media labels this animation as Down B",
    },
)

DODGE_CATEGORY = "Category:Dodges (SSBU)"
DODGE_PAGE_RE = re.compile(r"^(?P<fighter>.+?) \(SSBU\)/(?P<action>Spot dodge|Forward roll|Back roll|Air dodge)$", re.IGNORECASE)
DODGE_ACTION_NAMES = {
    "spot dodge": "Spot Dodge",
    "forward roll": "Forward Roll",
    "back roll": "Backward Roll",
    # SmashWiki's undirected Air dodge page represents the neutral air dodge.
    # Directional air dodges stay source-less unless a source explicitly names
    # the represented direction.
    "air dodge": "Neutral Air Dodge",
}


def exact_move(fighter: dict[str, Any], name: str) -> dict[str, Any] | None:
    matches = [move for move in fighter.get("moves", []) if str(move.get("name")) == name]
    if len(matches) != 1:
        return None
    return matches[0]


def compact(value: object) -> str:
    return re.sub(r"[^a-z0-9]+", "", str(value or "").lower())


def dodge_category_pages() -> list[str]:
    pages: list[str] = []
    continuation: str | None = None
    while True:
        params: dict[str, Any] = {
            "action": "query",
            "format": "json",
            "list": "categorymembers",
            "cmtitle": DODGE_CATEGORY,
            "cmnamespace": 0,
            "cmlimit": "max",
        }
        if continuation:
            params["cmcontinue"] = continuation
        payload = ext.http_get(ext.WIKI_API, **params).json()
        for row in payload.get("query", {}).get("categorymembers", []):
            title = str(row.get("title") or "")
            if title and DODGE_PAGE_RE.fullmatch(title):
                pages.append(title)
        continuation = payload.get("continue", {}).get("cmcontinue")
        if not continuation:
            break
    return sorted(set(pages))


def page_animated_files(page_title: str) -> list[tuple[str, dict[str, Any]]]:
    payload = ext.http_get(
        ext.WIKI_API,
        action="parse",
        page=page_title,
        prop="images",
        format="json",
        redirects=1,
    ).json()
    names = [str(name) for name in payload.get("parse", {}).get("images", [])]
    file_titles = [f"File:{name}" for name in names if Path(name).suffix.lower() in ext.ANIMATED_EXTENSIONS]
    infos = ext.image_info(file_titles)
    return sorted(infos.items(), key=lambda item: item[0])


def fighter_id_for_wiki_name(frame_data: dict[str, Any], display_name: str) -> str | None:
    wanted = compact(display_name)
    matches: list[str] = []
    for fighter_id, fighter in frame_data.get("fighters", {}).items():
        candidates = {
            compact(ext.wiki_display(fighter_id, fighter)),
            compact(fighter.get("name")),
            compact(fighter_id),
        }
        if wanted in candidates:
            matches.append(fighter_id)
    return matches[0] if len(matches) == 1 else None


def choose_dodge_animation(
    files: list[tuple[str, dict[str, Any]]],
    fighter_name: str,
    action: str,
) -> tuple[str, dict[str, Any]] | None:
    if not files:
        return None
    action_compact = compact(action).replace("backroll", "backroll").replace("forwardroll", "forwardroll")
    fighter_compact = compact(fighter_name)

    scored: list[tuple[int, str, dict[str, Any]]] = []
    aliases = {
        "spotdodge": ("spotdodge", "sdodge"),
        "forwardroll": ("forwardroll", "froll"),
        "backroll": ("backroll", "broll"),
        "airdodge": ("airdodge", "adodge"),
    }
    wanted_aliases = aliases.get(action_compact, (action_compact,))
    for title, info in files:
        stem = compact(Path(title.removeprefix("File:")).stem)
        score = 0
        if fighter_compact and fighter_compact in stem:
            score += 100
        if any(alias in stem for alias in wanted_aliases):
            score += 200
        # The page itself is already authoritative for fighter/action, but when
        # several animated files are embedded prefer the one whose filename also
        # states the same semantics.
        scored.append((score, title, info))
    scored.sort(key=lambda row: (row[0], row[1]), reverse=True)
    if not scored or scored[0][0] < 200:
        return None
    if len(scored) > 1 and scored[0][0] == scored[1][0]:
        return None
    return scored[0][1], scored[0][2]


def recover_dodge_category(
    frame_data: dict[str, Any],
    sources: dict[str, Any],
    source_less: set[tuple[str, str]],
    source_by_key: dict[tuple[str, str], dict[str, Any]],
) -> tuple[list[dict[str, Any]], list[dict[str, str]]]:
    accepted: list[dict[str, Any]] = []
    skipped: list[dict[str, str]] = []

    for page_title in dodge_category_pages():
        match = DODGE_PAGE_RE.fullmatch(page_title)
        if match is None:
            continue
        wiki_fighter = match.group("fighter")
        action = match.group("action")
        fighter_id = fighter_id_for_wiki_name(frame_data, wiki_fighter)
        if fighter_id is None:
            skipped.append({"pageTitle": page_title, "reason": "fighter page title did not map uniquely to roster"})
            continue
        fighter = frame_data["fighters"][fighter_id]
        move_name = DODGE_ACTION_NAMES[action.lower()]
        move = exact_move(fighter, move_name)
        if move is None:
            skipped.append({"pageTitle": page_title, "reason": f"no unique committed move named {move_name}"})
            continue
        key = (fighter_id, move["id"])
        if key not in source_less or key in source_by_key:
            skipped.append({"pageTitle": page_title, "reason": "move already has a discovered source visual"})
            continue

        picked = choose_dodge_animation(page_animated_files(page_title), wiki_fighter, action)
        if picked is None:
            skipped.append({"pageTitle": page_title, "reason": "no unique animated file matching the page action"})
            continue
        file_title, info = picked
        url = str(info.get("url") or "")
        suffix = Path(urlparse(url).path).suffix.lower()
        if suffix not in ext.ANIMATED_EXTENSIONS:
            continue

        page_url = f"{ext.WIKI_BASE}/{quote(page_title.replace(' ', '_'), safe='()&._-/')}"
        record = ext.frame_move_record(fighter_id, fighter, move, page_url)
        label = Path(file_title.removeprefix("File:")).stem
        variant = {
            "id": f"smashwiki-dodge-{ext.ufd.visual_id(url)}",
            "label": label,
            "downloadUrl": url,
            "sourceFormat": suffix.lstrip("."),
            "mediaType": "animation",
            "timelineClass": "fighter-action",
            "timingBasis": "parent-action",
            "sourceProvider": "smashwiki",
            "sourcePageUrl": str(info.get("descriptionurl") or page_url),
            "sourceAttribution": "SmashWiki Dodges (SSBU) category animation; preserve file-page provenance and revision history",
            "sourceQuality": ext.SOURCE_PRIORITY["smashwiki"],
        }
        record["variants"].append(variant)
        sources["moves"].append(record)
        source_by_key[key] = record
        accepted.append({
            "fighterId": fighter_id,
            "moveId": move["id"],
            "moveName": move_name,
            "pageTitle": page_title,
            "fileTitle": file_title,
            "sourcePageUrl": variant["sourcePageUrl"],
            "verification": "SmashWiki page is explicitly categorized as an SSBU dodge and names this fighter/action",
        })

    return accepted, skipped


def main() -> int:
    frame_data = json.loads(FRAME_DATA.read_text(encoding="utf-8"))
    sources = json.loads(SOURCES.read_text(encoding="utf-8"))
    audit = json.loads(AUDIT.read_text(encoding="utf-8"))
    if sources.get("version") != 3 or audit.get("version") != 2:
        raise SystemExit("visual source/audit schema mismatch")

    source_less = {
        (row["fighterId"], row["moveId"])
        for row in audit.get("movesWithoutVisuals", [])
    }
    source_by_key = {
        (move["fighterId"], move["moveId"]): move
        for move in sources.get("moves", [])
    }

    infos = ext.image_info([entry["fileTitle"] for entry in CURATED])
    accepted: list[dict[str, Any]] = []
    skipped: list[dict[str, str]] = []

    for entry in CURATED:
        fighter_id = entry["fighterId"]
        fighter = frame_data.get("fighters", {}).get(fighter_id)
        if fighter is None:
            raise SystemExit(f"curated SmashWiki mapping references unknown fighter {fighter_id}")
        move = exact_move(fighter, entry["moveName"])
        if move is None:
            raise SystemExit(
                f"curated SmashWiki mapping no longer uniquely matches {fighter_id}: {entry['moveName']}"
            )
        key = (fighter_id, move["id"])
        if key not in source_less or key in source_by_key:
            skipped.append({
                "fighterId": fighter_id,
                "moveId": move["id"],
                "reason": "move already has a discovered source visual",
            })
            continue

        info = infos.get(entry["fileTitle"])
        if info is None:
            # MediaWiki may normalize spaces/underscores. Match by basename as a
            # deterministic fallback, never by fuzzy fighter/move text.
            wanted = entry["fileTitle"].removeprefix("File:").replace("_", " ")
            info = next(
                (
                    value for title, value in infos.items()
                    if title.removeprefix("File:").replace("_", " ") == wanted
                ),
                None,
            )
        if info is None:
            raise SystemExit(f"verified SmashWiki file is unavailable: {entry['fileTitle']}")

        url = str(info.get("url") or "")
        suffix = Path(urlparse(url).path).suffix.lower()
        if suffix not in ext.ANIMATED_EXTENSIONS:
            raise SystemExit(f"verified SmashWiki source is not animated: {entry['fileTitle']}")

        label = Path(entry["fileTitle"].removeprefix("File:")).stem
        timeline = ext.ufd.timeline_class(
            fighter_id,
            str(move.get("name") or move["id"]),
            label,
        )
        record = ext.frame_move_record(
            fighter_id,
            fighter,
            move,
            str(info.get("descriptionurl") or f"{ext.WIKI_BASE}/{entry['fileTitle']}"),
        )
        variant = {
            "id": f"smashwiki-curated-{ext.ufd.visual_id(url)}",
            "label": label,
            "downloadUrl": url,
            "sourceFormat": suffix.lstrip("."),
            "mediaType": "animation",
            "timelineClass": timeline,
            "timingBasis": "parent-action" if timeline == "fighter-action" else "independent-source",
            "sourceProvider": "smashwiki",
            "sourcePageUrl": str(info.get("descriptionurl") or f"{ext.WIKI_BASE}/{entry['fileTitle']}"),
            "sourceAttribution": "SmashWiki verified SSBU move animation; preserve file-page provenance and revision history",
            "sourceQuality": ext.SOURCE_PRIORITY["smashwiki"],
        }
        record["variants"].append(variant)
        sources["moves"].append(record)
        source_by_key[key] = record
        accepted.append({
            "fighterId": fighter_id,
            "moveId": move["id"],
            "moveName": entry["moveName"],
            "fileTitle": entry["fileTitle"],
            "sourcePageUrl": variant["sourcePageUrl"],
            "verification": entry["verification"],
        })

    dodge_accepted, dodge_skipped = recover_dodge_category(frame_data, sources, source_less, source_by_key)
    accepted.extend(dodge_accepted)
    skipped.extend(dodge_skipped)

    sources["moves"].sort(key=lambda move: (move["fighterId"], move["moveId"]))
    timeline_counts: dict[str, int] = defaultdict(int)
    for move in sources["moves"]:
        for variant in move.get("variants", []):
            timeline_counts[str(variant.get("timelineClass", "fighter-action"))] += 1
    sources.update({
        "mappedMoves": len(sources["moves"]),
        "mappedVariants": sum(len(move.get("variants", [])) for move in sources["moves"]),
        "timelineCounts": dict(sorted(timeline_counts.items())),
    })
    SOURCES.write_text(json.dumps(sources, indent=2) + "\n", encoding="utf-8")

    report = {
        "version": 1,
        "registryEntries": len(CURATED),
        "dodgeCategory": DODGE_CATEGORY,
        "dodgeCategoryPages": len(dodge_category_pages()),
        "recoveredSourceLessMoves": len(accepted),
        "accepted": accepted,
        "skipped": skipped,
    }
    REPORT.write_text(json.dumps(report, indent=2) + "\n", encoding="utf-8")
    print(
        f"curated SmashWiki gap recovery: {len(accepted)} newly source-backed moves / "
        f"{len(skipped)} already covered or unavailable"
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
