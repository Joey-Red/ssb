#!/usr/bin/env python3
"""Re-vendor only SmashWiki variants whose historical revision was selected.

This is the fast second pass for the visual pipeline. The first full vendor pass
has already produced all runtime records/assets. Historical selection changes
only a small, explicit set of source URLs, so reprocessing the entire roster
again is unnecessary and expensive.

No coverage semantics are relaxed here: selected variants are processed by the
same process_variant() implementation as the full vendor pass, then the normal
coverage/provenance reports are regenerated from the updated records.
"""
from __future__ import annotations

import importlib.util
import json
from concurrent.futures import ThreadPoolExecutor, as_completed
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

ROOT = Path(__file__).resolve().parents[1]
VENDOR_SCRIPT = ROOT / "scripts/vendor-full-motion-assets.py"
HISTORICAL_REPORT = ROOT / "src/data/smashwikiHistoricalVisuals.generated.json"

spec = importlib.util.spec_from_file_location("ssb_vendor_full_motion_assets", VENDOR_SCRIPT)
if spec is None or spec.loader is None:
    raise RuntimeError(f"unable to load {VENDOR_SCRIPT}")
vendor = importlib.util.module_from_spec(spec)
spec.loader.exec_module(vendor)


def selected_keys() -> set[tuple[str, str, str]]:
    payload = json.loads(HISTORICAL_REPORT.read_text(encoding="utf-8"))
    if payload.get("version") != 1:
        raise RuntimeError("historical visual report must use schema version 1")
    selected = payload.get("selected")
    if not isinstance(selected, list):
        raise RuntimeError("historical visual report is missing selected list")
    return {
        (str(item["fighterId"]), str(item["moveId"]), str(item["variantId"]))
        for item in selected
    }


def load_existing_assets() -> dict[str, Any]:
    payload = json.loads(vendor.base.GENERATED_MANIFEST.read_text(encoding="utf-8"))
    if payload.get("version") != 3 or not isinstance(payload.get("moves"), dict):
        raise RuntimeError("full vendor pass must run before historical re-vendor")
    return payload["moves"]


def find_selected_work(
    source_manifest: dict[str, Any],
    wanted: set[tuple[str, str, str]],
) -> list[tuple[dict[str, Any], dict[str, Any]]]:
    work: list[tuple[dict[str, Any], dict[str, Any]]] = []
    found: set[tuple[str, str, str]] = set()
    for move in source_manifest["moves"]:
        for variant in move["variants"]:
            key = (
                str(move["fighterId"]),
                str(move["moveId"]),
                vendor.base.safe_name(str(variant["id"])),
            )
            if key in wanted:
                work.append((move, variant))
                found.add(key)
    missing = sorted(wanted - found)
    if missing:
        raise RuntimeError(
            "historical selections missing from source manifest: "
            + ", ".join(":".join(key) for key in missing)
        )
    return work


def replace_record(
    move_assets: dict[str, Any],
    key: str,
    record: dict[str, Any],
) -> None:
    staged = move_assets.get(key)
    if not isinstance(staged, dict) or not isinstance(staged.get("variants"), list):
        raise RuntimeError(f"missing first-pass runtime record for {key}")
    variants = staged["variants"]
    for index, existing in enumerate(variants):
        if existing.get("id") == record["id"]:
            variants[index] = record
            return
    raise RuntimeError(f"missing first-pass variant record for {key}:{record['id']}")


def write_reports(move_assets: dict[str, Any]) -> None:
    media_size = vendor.base.directory_bytes(vendor.base.PUBLIC / "media")
    if media_size > vendor.base.MEDIA_BUDGET_BYTES:
        raise RuntimeError(
            f"vendored media is {media_size / 1024 / 1024:.1f} MiB, above "
            f"{vendor.base.MEDIA_BUDGET_BYTES / 1024 / 1024:.0f} MiB budget"
        )

    generated_at = (
        datetime.now(timezone.utc)
        .replace(microsecond=0)
        .isoformat()
        .replace("+00:00", "Z")
    )
    vendor.base.GENERATED_MANIFEST.write_text(
        json.dumps(
            {"version": 3, "generatedAt": generated_at, "moves": move_assets},
            indent=2,
        )
        + "\n",
        encoding="utf-8",
    )

    report = vendor.coverage_report(move_assets)
    vendor.COVERAGE_PATH.write_text(
        json.dumps(report, indent=2) + "\n",
        encoding="utf-8",
    )

    source_manifest = json.loads(
        vendor.base.MEDIA_SOURCES.read_text(encoding="utf-8")
    )
    fighter_sources = {}
    if vendor.base.PROVENANCE_PATH.exists():
        prior = json.loads(vendor.base.PROVENANCE_PATH.read_text(encoding="utf-8"))
        if isinstance(prior.get("fighterSources"), dict):
            fighter_sources = prior["fighterSources"]

    vendor.base.PROVENANCE_PATH.write_text(
        json.dumps(
            {
                "version": 3,
                "fighterSources": fighter_sources,
                "visualMoveCount": len(move_assets),
                "visualVariantCount": report["variantCount"],
                "fullExactVariantCount": report["fullExactVariants"],
                "sourceTimedVariantCount": report["sourceTimedVariants"],
                "exactStaticVariantCount": report["exactStaticVariants"],
                "visualCoverageGapCount": report["gapCount"],
                "reviewedOverrideCount": len(vendor.OVERRIDES),
                "fightersScanned": source_manifest.get("fightersScanned", 0),
                "mediaBytes": media_size,
            },
            indent=2,
        )
        + "\n",
        encoding="utf-8",
    )
    print(
        f"historical re-vendor complete: {report['resolvedVariants']}/"
        f"{report['variantCount']} variants resolved; "
        f"{report['unresolvedVariants']} unresolved"
    )


def main() -> int:
    wanted = selected_keys()
    if not wanted:
        print("no historical revisions selected; keeping first-pass assets")
        return 0

    source_manifest = json.loads(
        vendor.base.MEDIA_SOURCES.read_text(encoding="utf-8")
    )
    if source_manifest.get("version") != 3:
        raise RuntimeError("visual source manifest must use schema version 3")

    move_assets = load_existing_assets()
    work = find_selected_work(source_manifest, wanted)
    print(
        f"re-vendoring {len(work)} historical variants only "
        f"(full second pass skipped)"
    )

    failures: list[str] = []
    with ThreadPoolExecutor(max_workers=vendor.base.MAX_WORKERS) as pool:
        futures = {
            pool.submit(vendor.process_variant, move, variant): (move, variant)
            for move, variant in work
        }
        for future in as_completed(futures):
            move, variant = futures[future]
            try:
                key, record = future.result()
                replace_record(move_assets, key, record)
            except Exception as exc:  # noqa: BLE001
                failures.append(
                    f"{move['fighterId']}:{move['moveId']}:{variant['id']}: {exc}"
                )

    if failures:
        raise RuntimeError(
            "historical visual asset failures:\n" + "\n".join(failures)
        )

    write_reports(move_assets)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
