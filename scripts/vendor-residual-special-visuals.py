#!/usr/bin/env python3
"""Vendor only the explicit residual-special variants added after the full pass.

PR #19 produces the authoritative full-roster media corpus. The residual-special
follow-up adds only a handful of new source records, so deleting/reprocessing the
entire media tree again would be wasteful. This script runs the exact same
process_variant() implementation for variants whose IDs start with
``smashwiki-residual-``, merges those runtime records into the existing generated
manifest, and regenerates coverage/provenance reports.

No timing or coverage semantics are changed here.
"""
from __future__ import annotations

import importlib.util
import json
from concurrent.futures import ThreadPoolExecutor, as_completed
from pathlib import Path
from typing import Any

ROOT = Path(__file__).resolve().parents[1]
VENDOR_SCRIPT = ROOT / "scripts/vendor-full-motion-assets.py"
REVENDOR_SCRIPT = ROOT / "scripts/revendor-historical-visuals.py"
PREFIX = "smashwiki-residual-"

vendor_spec = importlib.util.spec_from_file_location("ssb_vendor_full_motion_assets", VENDOR_SCRIPT)
if vendor_spec is None or vendor_spec.loader is None:
    raise RuntimeError(f"unable to load {VENDOR_SCRIPT}")
vendor = importlib.util.module_from_spec(vendor_spec)
vendor_spec.loader.exec_module(vendor)

revendor_spec = importlib.util.spec_from_file_location("ssb_revendor_historical", REVENDOR_SCRIPT)
if revendor_spec is None or revendor_spec.loader is None:
    raise RuntimeError(f"unable to load {REVENDOR_SCRIPT}")
revendor = importlib.util.module_from_spec(revendor_spec)
revendor_spec.loader.exec_module(revendor)


def residual_work(source_manifest: dict[str, Any]) -> list[tuple[dict[str, Any], dict[str, Any]]]:
    work: list[tuple[dict[str, Any], dict[str, Any]]] = []
    for move in source_manifest.get("moves", []):
        for variant in move.get("variants", []):
            if str(variant.get("id", "")).startswith(PREFIX):
                work.append((move, variant))
    if not work:
        raise RuntimeError("no residual-special variants found in source manifest")
    return work


def merge_record(move_assets: dict[str, Any], key: str, record: dict[str, Any]) -> None:
    staged = move_assets.setdefault(key, {"variants": []})
    variants = staged.get("variants")
    if not isinstance(variants, list):
        raise RuntimeError(f"invalid runtime record for {key}")
    for index, existing in enumerate(variants):
        if existing.get("id") == record["id"]:
            variants[index] = record
            return
    variants.append(record)


def sort_touched_variants(
    move_assets: dict[str, Any],
    source_manifest: dict[str, Any],
    touched: set[str],
) -> None:
    source_by_key = {
        f"{move['fighterId']}:{move['moveId']}": move
        for move in source_manifest.get("moves", [])
    }
    for key in touched:
        source_move = source_by_key.get(key)
        staged = move_assets.get(key)
        if not source_move or not isinstance(staged, dict):
            continue
        variants = staged.get("variants")
        if not isinstance(variants, list):
            continue
        order = {
            vendor.base.safe_name(str(variant["id"])): index
            for index, variant in enumerate(source_move.get("variants", []))
        }
        variants.sort(key=lambda item: order.get(str(item.get("id")), 9999))


def main() -> int:
    source_manifest = json.loads(vendor.base.MEDIA_SOURCES.read_text(encoding="utf-8"))
    if source_manifest.get("version") != 3:
        raise RuntimeError("visual source manifest must use schema version 3")

    move_assets = revendor.load_existing_assets()
    work = residual_work(source_manifest)
    move_keys = {f"{move['fighterId']}:{move['moveId']}" for move, _ in work}
    if len(move_keys) != 4:
        raise RuntimeError(f"expected four residual move records, found {len(move_keys)}")

    print(f"target-vendoring {len(work)} residual variants across {len(move_keys)} moves")
    failures: list[str] = []
    touched: set[str] = set()
    with ThreadPoolExecutor(max_workers=vendor.base.MAX_WORKERS) as pool:
        futures = {
            pool.submit(vendor.process_variant, move, variant): (move, variant)
            for move, variant in work
        }
        for future in as_completed(futures):
            move, variant = futures[future]
            try:
                key, record = future.result()
                merge_record(move_assets, key, record)
                touched.add(key)
            except Exception as exc:  # noqa: BLE001
                failures.append(
                    f"{move['fighterId']}:{move['moveId']}:{variant['id']}: {exc}"
                )

    if failures:
        raise RuntimeError("residual visual asset failures:\n" + "\n".join(failures))
    if touched != move_keys:
        missing = sorted(move_keys - touched)
        raise RuntimeError("residual move records not processed: " + ", ".join(missing))

    sort_touched_variants(move_assets, source_manifest, touched)
    revendor.write_reports(move_assets)
    print(f"residual targeted vendor complete: {len(work)} variants / {len(touched)} moves")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
