# Media rights and provenance policy

The SSBU Training Guide is public and must not treat “available on the web” as permission to redistribute an asset.

## Allowed embedded media

An image, animation, diagram, or icon may be bundled into the app only when at least one of these is true:

1. **Project-owned** — created specifically for this repository and containing no copied game art.
2. **Explicitly licensed** — the asset has a redistribution license compatible with this repository, and the repository records the source, author/attribution, and license.

## Source-link-only media

Nintendo/Super Smash Bros. screenshots, fighter renders, move GIFs, Ultimate Frame Data hitbox images, wiki images, tournament screenshots, and other third-party media are **source-link-only by default**. The app may link users to the original source page, but it must not download, mirror, hotlink, or bundle the media without an explicit rights review.

## Data is separate from media

Factual frame values are stored in the project-owned normalized data schema with source metadata. That does not grant permission to copy the source site's prose, layout, images, or animations.

## Required asset metadata

Any future bundled third-party asset must have a `MediaAsset` record containing:

- stable project id;
- fighter id when applicable;
- source URL;
- author/attribution when required;
- license name or grant;
- status `explicitly-licensed`.

An asset without that record does not ship.

## Current visual strategy

The application uses project-owned procedural fighter identity marks and abstract frame timelines. These provide visual structure without copying Nintendo character art or third-party hitbox GIFs. External UFD/SmashWiki links remain available for users who want the original reference material.
