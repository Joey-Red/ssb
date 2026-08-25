#!/usr/bin/env python3
"""Build a deterministic capture/import queue for unresolved visual variants.

This script never captures or invents game imagery. It turns the generated
coverage blockers into explicit local-capture jobs so the final hard cases can
be produced frame-by-frame from a lawful local game/training setup and imported
with provenance instead of being silently guessed.
"""
from __future__ import annotations

import json
from datetime import datetime, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
COVERAGE = ROOT / "src/data/visualMediaCoverage.generated.json"
OUTPUT = ROOT / "src/data/visualCaptureQueue.generated.json"


def main() -> int:
    report = json.loads(COVERAGE.read_text(encoding="utf-8"))
    if report.get("version") != 2:
        raise SystemExit("coverage report must be version 2")

    jobs = []
    for gap in sorted(
        report.get("gaps", []),
        key=lambda item: (item["fighterId"], item["moveId"], item["variantId"]),
    ):
        key = f"{gap['fighterId']}:{gap['moveId']}:{gap['variantId']}"
        target = gap.get("totalFrames") if gap.get("timelineClass") == "fighter-action" else gap.get("landingLag")
        jobs.append({
            "key": key,
            "fighterId": gap["fighterId"],
            "moveId": gap["moveId"],
            "moveLabel": gap["moveLabel"],
            "variantId": gap["variantId"],
            "variantLabel": gap["variantLabel"],
            "timelineClass": gap["timelineClass"],
            "blockerClass": gap["blockerClass"],
            "documentedTargetFrames": target,
            "sourceUrl": gap["sourceUrl"],
            "captureRequirements": {
                "advanceMode": "one-game-frame-at-a-time",
                "start": "first frame of the represented action/state",
                "end": "last documented frame or clearly defined end of independent state",
                "interactionDisplay": "enable hitbox/grabbox visualization when the represented frame has one",
                "noInterpolation": True,
                "noSyntheticFrames": True,
            },
            "expectedImport": {
                "directory": f"captures/{gap['fighterId']}/{gap['moveId']}/{gap['variantId']}",
                "metadata": "capture.json",
                "frames": "0001.png ... NNNN.png",
            },
        })

    payload = {
        "version": 1,
        "generatedAt": datetime.now(timezone.utc).replace(microsecond=0).isoformat().replace("+00:00", "Z"),
        "unresolvedVariants": report.get("unresolvedVariants", len(jobs)),
        "jobs": jobs,
    }
    OUTPUT.write_text(json.dumps(payload, indent=2) + "\n", encoding="utf-8")
    print(f"capture queue: {len(jobs)} unresolved variants")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
