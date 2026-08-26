#!/usr/bin/env python3
"""Validate visual coverage accounting and zero-gap evidence completion.

Schema v2 is the strict action-specific source audit used during discovery.
Schema v3 is the finalized runtime evidence audit: every move must have a local,
evidence-backed visual, while action-specific gameplay/exactness gaps remain
separately measurable and can still be enforced with ``--strict``.
"""
from __future__ import annotations

import argparse
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
REPORT = ROOT / "src/data/visualMediaCoverage.generated.json"
AUDIT = ROOT / "src/data/visualCoverageAudit.generated.json"


def validate_variant_report(report: dict) -> tuple[int, int, int]:
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

    duplicate_keys: list[str] = []
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
    return variant_count, resolved, unresolved


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument(
        "--strict",
        action="store_true",
        help="also require every move/source variant to have action-specific exact-capable source/reviewed media",
    )
    args = parser.parse_args()

    report = json.loads(REPORT.read_text(encoding="utf-8"))
    variant_count, resolved, unresolved = validate_variant_report(report)
    audit = json.loads(AUDIT.read_text(encoding="utf-8"))
    version = int(audit.get("version", -1))
    if version not in {2, 3}:
        raise SystemExit("visual coverage audit must be schema version 2 or finalized version 3")

    audit_unresolved_variants = int(audit.get("unresolvedVariants", -1))
    if audit_unresolved_variants != unresolved:
        raise SystemExit(
            "audit/source report mismatch: "
            f"{audit_unresolved_variants} audit variants != {unresolved} source-report variants"
        )

    if version == 2:
        source_less_moves = int(audit.get("movesWithoutSourceVisual", -1))
        unresolved_total = int(audit.get("unresolvedTotal", -1))
        if source_less_moves < 0 or unresolved_total < 0:
            raise SystemExit("visual coverage audit has invalid unresolved counts")
        if unresolved + source_less_moves != unresolved_total:
            raise SystemExit(
                "audit total mismatch: "
                f"{unresolved} variants + {source_less_moves} source-less moves != {unresolved_total}"
            )
        print(
            f"strict source audit: {resolved}/{variant_count} source variants resolved; "
            f"{source_less_moves} frame-data moves need action-specific media; "
            f"{unresolved_total} strict source-quality gaps"
        )
        if args.strict and unresolved_total != 0:
            raise SystemExit(
                "100% action-specific source coverage required; "
                f"{unresolved_total} strict gaps remain"
            )
        return 0

    total_moves = int(audit.get("totalFrameDataMoves", -1))
    evidence_mapped = int(audit.get("mappedEvidenceVisualMoves", -1))
    evidence_gaps = int(audit.get("movesWithoutSourceVisual", -1))
    action_specific = int(audit.get("actionSpecificMappedVisualMoves", -1))
    action_missing = int(audit.get("movesWithoutActionSpecificSourceVisual", -1))
    fallback_count = int(audit.get("evidenceBackedFallbackMoves", -1))
    related = int(audit.get("relatedSourceEvidenceFallbackMoves", -1))
    schematic = int(audit.get("timingSchematicEvidenceFallbackMoves", -1))
    exact_quality_total = int(audit.get("actionSpecificUnresolvedTotal", -1))

    if min(total_moves, evidence_mapped, evidence_gaps, action_specific, action_missing,
           fallback_count, related, schematic, exact_quality_total) < 0:
        raise SystemExit("finalized evidence audit has invalid counts")
    if evidence_mapped != total_moves or evidence_gaps != 0:
        raise SystemExit(
            f"zero-gap evidence invariant failed: mapped={evidence_mapped}/{total_moves}, gaps={evidence_gaps}"
        )
    if action_specific + action_missing != total_moves:
        raise SystemExit("action-specific move accounting mismatch")
    if fallback_count != action_missing or related + schematic != fallback_count:
        raise SystemExit("evidence fallback accounting mismatch")
    if unresolved + action_missing != exact_quality_total:
        raise SystemExit(
            "action-specific quality accounting mismatch: "
            f"{unresolved} variants + {action_missing} move rows != {exact_quality_total}"
        )

    policy = audit.get("evidenceVisualPolicy", {})
    required_policy = {
        "allFrameDataMovesRepresented": True,
        "allRuntimeMediaSameOrigin": True,
        "actionSpecificGameplayRequiredForExactCoverage": True,
        "relatedSourceFallbackIsExactTargetEvidence": False,
        "timingSchematicIsGameplayFootage": False,
        "fabricatedPoseOrHitboxGeometryAllowed": False,
    }
    for key, expected in required_policy.items():
        if policy.get(key) is not expected:
            raise SystemExit(f"evidence policy invariant failed: {key}={policy.get(key)!r}, expected {expected!r}")

    print(
        f"visual evidence coverage: {evidence_mapped}/{total_moves}; blocking visual gaps={evidence_gaps}; "
        f"action-specific media={action_specific}; evidence fallbacks={fallback_count}"
    )

    if args.strict and exact_quality_total != 0:
        blockers = report.get("blockerCounts", {})
        categories = audit.get("actionSpecificMissingMoveCategories", {})
        raise SystemExit(
            "100% action-specific exact-capable source coverage required; "
            f"{exact_quality_total} optional fidelity gaps remain "
            f"({unresolved} source variants: {blockers}; {action_missing} move rows: {categories})"
        )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
