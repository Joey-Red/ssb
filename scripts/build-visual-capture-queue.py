#!/usr/bin/env python3
"""Build a deterministic capture/import queue for unresolved visual coverage.

The queue includes both unresolved variants of known source visuals and frame-
data moves for which discovery found no visual source at all. It never captures
or invents game imagery; each job is an explicit lawful-local-capture task with
provenance requirements.
"""
from __future__ import annotations

import json
import re
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

ROOT = Path(__file__).resolve().parents[1]
COVERAGE = ROOT / "src/data/visualMediaCoverage.generated.json"
AUDIT = ROOT / "src/data/visualCoverageAudit.generated.json"
OUTPUT = ROOT / "src/data/visualCaptureQueue.generated.json"


def positive_frame(value: Any) -> int | None:
    if isinstance(value, int):
        return value if value > 0 else None
    match = re.search(r"\d+", str(value or ""))
    if not match:
        return None
    parsed = int(match.group())
    return parsed if parsed > 0 else None


def capture_job(*, key: str, fighter_id: str, move_id: str, move_label: str,
                variant_id: str, variant_label: str, timeline_class: str,
                blocker_class: str, target: int | None, source_url: str | None,
                category: str | None = None) -> dict[str, Any]:
    return {
        "key": key,
        "fighterId": fighter_id,
        "moveId": move_id,
        "moveLabel": move_label,
        "variantId": variant_id,
        "variantLabel": variant_label,
        "timelineClass": timeline_class,
        "blockerClass": blocker_class,
        "moveCategory": category,
        "documentedTargetFrames": target,
        "sourceUrl": source_url,
        "captureRequirements": {
            "fps": 60,
            "advanceMode": "one-game-frame-at-a-time",
            "start": "first frame of the represented action/state",
            "end": "last documented frame or clearly defined end of independent state",
            "interactionDisplay": "hitbox-grabbox-enabled where the represented action can create an attack/grab collision",
            "noInterpolation": True,
            "noSyntheticFrames": True,
            "noDroppedFrames": True,
        },
        "expectedImport": {
            "directory": f"captures/{fighter_id}/{move_id}/{variant_id}",
            "metadata": "capture.json",
            "frames": "0001.png ... NNNN.png",
        },
    }


def main() -> int:
    report = json.loads(COVERAGE.read_text(encoding="utf-8"))
    audit = json.loads(AUDIT.read_text(encoding="utf-8"))
    if report.get("version") != 2 or audit.get("version") != 2:
        raise SystemExit("coverage/audit schema mismatch; regenerate visual coverage first")

    jobs: list[dict[str, Any]] = []
    for gap in sorted(
        report.get("gaps", []),
        key=lambda item: (item["fighterId"], item["moveId"], item["variantId"]),
    ):
        key = f"{gap['fighterId']}:{gap['moveId']}:{gap['variantId']}"
        target = gap.get("totalFrames") if gap.get("timelineClass") == "fighter-action" else gap.get("landingLag")
        jobs.append(capture_job(
            key=key,
            fighter_id=gap["fighterId"],
            move_id=gap["moveId"],
            move_label=gap["moveLabel"],
            variant_id=gap["variantId"],
            variant_label=gap["variantLabel"],
            timeline_class=gap["timelineClass"],
            blocker_class=gap["blockerClass"],
            target=positive_frame(target),
            source_url=gap.get("sourceUrl"),
        ))

    for move in audit.get("movesWithoutVisuals", []):
        fighter_id = move["fighterId"]
        move_id = move["moveId"]
        variant_id = "manual-full-move"
        key = f"{fighter_id}:{move_id}:{variant_id}"
        jobs.append(capture_job(
            key=key,
            fighter_id=fighter_id,
            move_id=move_id,
            move_label=move["moveLabel"],
            variant_id=variant_id,
            variant_label="Reviewed full-move capture",
            timeline_class="fighter-action",
            blocker_class="no-source-visual",
            target=positive_frame(move.get("totalFrames")),
            source_url=move.get("sourceUrl"),
            category=move.get("category"),
        ))

    jobs.sort(key=lambda item: (item["fighterId"], item["moveId"], item["variantId"]))
    keys = [job["key"] for job in jobs]
    if len(keys) != len(set(keys)):
        raise SystemExit("capture queue contains duplicate keys")

    payload = {
        "version": 2,
        "generatedAt": datetime.now(timezone.utc).replace(microsecond=0).isoformat().replace("+00:00", "Z"),
        "unresolvedSourceVariants": report.get("unresolvedVariants", 0),
        "movesWithoutSourceVisual": audit.get("movesWithoutSourceVisual", 0),
        "jobCount": len(jobs),
        "jobs": jobs,
    }
    OUTPUT.write_text(json.dumps(payload, indent=2) + "\n", encoding="utf-8")
    print(
        f"capture queue: {len(jobs)} jobs "
        f"({payload['unresolvedSourceVariants']} source variants + {payload['movesWithoutSourceVisual']} source-less moves)"
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
