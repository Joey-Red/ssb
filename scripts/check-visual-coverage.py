#!/usr/bin/env python3
"""Validate the generated visual-coverage release invariant."""
from __future__ import annotations

import argparse
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
REPORT = ROOT / "src/data/visualMediaCoverage.generated.json"


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--strict", action="store_true", help="fail unless unresolvedVariants is exactly zero")
    args = parser.parse_args()

    report = json.loads(REPORT.read_text(encoding="utf-8"))
    if report.get("version") != 2:
        raise SystemExit("visual coverage report must be version 2")
    variant_count = int(report.get("variantCount", -1))
    resolved = int(report.get("resolvedVariants", -1))
    unresolved = int(report.get("unresolvedVariants", -1))
    gaps = report.get("gaps", [])
    if variant_count < 1 or resolved < 0 or unresolved < 0:
        raise SystemExit("visual coverage report has invalid counts")
    if resolved + unresolved != variant_count:
        raise SystemExit(f"coverage accounting mismatch: {resolved} + {unresolved} != {variant_count}")
    if len(gaps) != unresolved:
        raise SystemExit(f"coverage gap list mismatch: {len(gaps)} != {unresolved}")
    duplicate_keys = []
    seen: set[str] = set()
    for gap in gaps:
        key = f"{gap['fighterId']}:{gap['moveId']}:{gap['variantId']}"
        if key in seen:
            duplicate_keys.append(key)
        seen.add(key)
        if not gap.get("blockerClass") or not gap.get("reason"):
            raise SystemExit(f"unclassified coverage blocker: {key}")
    if duplicate_keys:
        raise SystemExit("duplicate coverage blockers: " + ", ".join(sorted(set(duplicate_keys))))

    print(f"visual coverage: {resolved}/{variant_count} resolved; {unresolved} unresolved")
    if args.strict and unresolved != 0:
        blockers = report.get("blockerCounts", {})
        raise SystemExit(f"100% visual coverage required; {unresolved} variants remain: {blockers}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
