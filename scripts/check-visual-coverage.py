#!/usr/bin/env python3
"""Validate generated visual-coverage accounting and the true zero-gap invariant."""
from __future__ import annotations

import argparse
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
REPORT = ROOT / "src/data/visualMediaCoverage.generated.json"
AUDIT = ROOT / "src/data/visualCoverageAudit.generated.json"


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument(
        "--strict",
        action="store_true",
        help="fail unless both unresolved source variants and source-less frame-data moves are exactly zero",
    )
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

    audit = json.loads(AUDIT.read_text(encoding="utf-8"))
    if audit.get("version") != 2:
        raise SystemExit("visual coverage audit must be version 2")
    audit_unresolved_variants = int(audit.get("unresolvedVariants", -1))
    source_less_moves = int(audit.get("movesWithoutSourceVisual", -1))
    unresolved_total = int(audit.get("unresolvedTotal", -1))
    if audit_unresolved_variants != unresolved:
        raise SystemExit(
            "audit/source report mismatch: "
            f"{audit_unresolved_variants} audit variants != {unresolved} source-report variants"
        )
    if source_less_moves < 0 or unresolved_total < 0:
        raise SystemExit("visual coverage audit has invalid unresolved counts")
    if unresolved + source_less_moves != unresolved_total:
        raise SystemExit(
            "audit total mismatch: "
            f"{unresolved} variants + {source_less_moves} source-less moves != {unresolved_total}"
        )

    print(
        f"visual coverage: {resolved}/{variant_count} source variants resolved; "
        f"{source_less_moves} frame-data moves have no real visual; "
        f"{unresolved_total} total blockers"
    )
    if args.strict and unresolved_total != 0:
        blockers = report.get("blockerCounts", {})
        missing_categories = audit.get("missingMoveCategories", {})
        raise SystemExit(
            "100% source-backed visual coverage required; "
            f"{unresolved_total} blockers remain "
            f"({unresolved} unresolved variants: {blockers}; "
            f"{source_less_moves} source-less moves: {missing_categories})"
        )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
