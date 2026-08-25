# Visual pipeline fast follow

This branch addresses two concrete causes of slow/no-progress visual completion work:

1. External discovery now refreshes the source-less audit immediately after the fresh UFD scrape, so moves that disappear from the fresh UFD manifest are searched externally in the same run instead of one run later.
2. Historical SmashWiki selection re-vendors only the selected historical variants instead of re-downloading and repacking the entire roster a second time.
3. `check-visual-coverage.py --strict` now requires both unresolved source variants and frame-data moves with no real visual to reach zero.

The changes do not relax source, timing, licensing, or evidence requirements.
