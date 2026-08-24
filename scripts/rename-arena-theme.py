#!/usr/bin/env python3
"""Replace the retired alternate-theme name with Arena in maintained text files."""

from __future__ import annotations

import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
EXTENSIONS = {'.md', '.ts', '.tsx', '.css', '.html', '.json', '.yml', '.yaml', '.mjs', '.py'}
SKIP_DIRS = {'.git', 'node_modules', 'dist'}
REPLACEMENTS = [
    (re.compile(r'\bTITAN\b'), 'ARENA'),
    (re.compile(r'\bTitan\b'), 'Arena'),
    (re.compile(r'\btitan\b'), 'arena'),
]


def should_skip(path: Path) -> bool:
    if any(part in SKIP_DIRS for part in path.parts):
        return True
    return 'public' in path.parts and 'media' in path.parts


def main() -> int:
    changed = 0
    for path in ROOT.rglob('*'):
        if not path.is_file() or path.suffix.lower() not in EXTENSIONS or should_skip(path):
            continue
        text = path.read_text(encoding='utf-8')
        updated = text
        for pattern, replacement in REPLACEMENTS:
            updated = pattern.sub(replacement, updated)
        if updated != text:
            path.write_text(updated, encoding='utf-8')
            changed += 1
            print(f'renamed theme wording: {path.relative_to(ROOT)}')
    print(f'updated {changed} maintained text files')
    return 0


if __name__ == '__main__':
    raise SystemExit(main())
