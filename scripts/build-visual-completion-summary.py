#!/usr/bin/env python3
"""Write the compact visual-completion result after evidence finalization."""
from __future__ import annotations

import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
AUDIT = ROOT / "src/data/visualCoverageAudit.generated.json"
TIMING = ROOT / "src/data/rubenTimingOverrides.generated.json"
EXTERNAL = ROOT / "src/data/externalVisualSources.generated.json"
ARCHIVE = ROOT / "src/data/ultimateHitboxesArchive.generated.json"
CAPTURE = ROOT / "src/data/visualCaptureQueue.generated.json"
OUT = ROOT / "docs/VISUAL_COMPLETION_SUMMARY.generated.md"


def load_optional(path: Path) -> dict:
    if not path.exists():
        return {}
    payload = json.loads(path.read_text(encoding="utf-8"))
    return payload if isinstance(payload, dict) else {}


def main() -> int:
    audit = json.loads(AUDIT.read_text(encoding="utf-8"))
    if audit.get("version") != 3:
        raise SystemExit("visual completion summary requires finalized evidence audit version 3")

    timing = load_optional(TIMING)
    external = load_optional(EXTERNAL)
    archive = load_optional(ARCHIVE)
    capture = load_optional(CAPTURE)

    total = int(audit.get("totalFrameDataMoves", 0))
    evidence_mapped = int(audit.get("mappedEvidenceVisualMoves", audit.get("mappedVisualMoves", 0)))
    visual_gaps = int(audit.get("movesWithoutSourceVisual", -1))
    action_specific = int(audit.get("actionSpecificMappedVisualMoves", 0))
    action_specific_missing = int(audit.get("movesWithoutActionSpecificSourceVisual", 0))
    evidence_fallbacks = int(audit.get("evidenceBackedFallbackMoves", 0))
    related = int(audit.get("relatedSourceEvidenceFallbackMoves", 0))
    schematic = int(audit.get("timingSchematicEvidenceFallbackMoves", 0))
    unresolved_variants = int(audit.get("unresolvedVariants", 0))
    capture_count = int(capture.get("jobCount", len(capture.get("jobs", []))))
    blockers = audit.get("blockerCounts", {})
    action_categories = audit.get("actionSpecificMissingMoveCategories", {})

    if visual_gaps != 0 or evidence_mapped != total:
        raise SystemExit(
            f"visual evidence completion is not zero-gap: mapped={evidence_mapped}/{total}, gaps={visual_gaps}"
        )
    if action_specific + action_specific_missing != total:
        raise SystemExit("action-specific source accounting mismatch")
    if evidence_fallbacks != action_specific_missing or related + schematic != evidence_fallbacks:
        raise SystemExit("evidence fallback accounting mismatch")

    lines = [
        "# Visual Completion Summary",
        "",
        "This file is generated after source discovery, media vendoring, strict source auditing, local evidence-fallback construction, and final zero-gap evidence validation.",
        "",
        f"- Frame-data move rows: **{total}**",
        f"- Move rows with an evidence-backed same-origin visual: **{evidence_mapped}/{total}**",
        f"- Blocking visual gaps: **{visual_gaps}**",
        f"- Action-specific source/reviewed visuals: **{action_specific}**",
        f"- Evidence-backed fallback visuals: **{evidence_fallbacks}**",
        f"  - Related-source references: **{related}**",
        f"  - Documented timing schematics: **{schematic}**",
        f"- Action-specific source variants still unsuitable for exact mapping: **{unresolved_variants}**",
        f"- Optional action-specific capture/source upgrades: **{action_specific_missing} move rows**",
        f"- Deterministic upgrade/capture queue entries: **{capture_count}**",
        "",
        "## Result",
        "",
        "**Visual coverage is complete: no frame-data move is blank or lacks an evidence-backed local visual.**",
        "",
        "Fallback visuals are deliberately labelled. Related-source references are not claimed to be the target substate, and timing schematics are not claimed to be gameplay footage, fighter-pose evidence, or hitbox geometry.",
        "",
        "## Optional fidelity upgrades",
        "",
        "The following counts describe opportunities to replace conservative evidence fallbacks or partial source variants with better action-specific gameplay media. They are quality upgrades, not missing-visual blockers.",
        "",
    ]

    if action_categories:
        lines.append("### Move rows without action-specific gameplay media")
        lines.append("")
        for name, count in sorted(action_categories.items(), key=lambda item: (-item[1], item[0])):
            lines.append(f"- `{name}`: **{count}**")
        lines.append("")

    lines.append("### Source-variant exactness queue")
    lines.append("")
    if blockers:
        for name, count in sorted(blockers.items(), key=lambda item: (-item[1], item[0])):
            lines.append(f"- `{name}`: **{count}**")
    else:
        lines.append("- None")

    lines.extend([
        "",
        "## Evidence policy",
        "",
        "A visual gap reaches zero only when the runtime has a same-origin representation backed by committed evidence. Exact gameplay/frame claims remain stricter: synthetic timing schematics and related-source references never become action-specific gameplay or exact hitbox evidence merely by closing the visual gap.",
        "",
        f"Maintenance notes: automatic Ruben timing resolutions **{timing.get('resolvedTimingGaps', 0)} / {timing.get('targetTimingGaps', 0)}**; external candidates accepted **{external.get('acceptedCandidates', 0)}**; reference-only archive corroborations **{archive.get('metadataCorroborations', 0)}**.",
    ])

    OUT.write_text("\n".join(lines).rstrip() + "\n", encoding="utf-8")
    print(
        f"visual completion: {evidence_mapped}/{total} evidence-backed moves; "
        f"blocking visual gaps={visual_gaps}; optional action-specific upgrades={action_specific_missing}"
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
