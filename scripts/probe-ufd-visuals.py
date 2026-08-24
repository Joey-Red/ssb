#!/usr/bin/env python3
"""Temporary maintenance probe for UFD hitbox-link discovery."""
from __future__ import annotations

from urllib.parse import urljoin

from bs4 import BeautifulSoup
from curl_cffi import requests as browser_requests

URL = "https://ultimateframedata.com/mario"

response = browser_requests.get(
    URL,
    impersonate="chrome",
    timeout=45,
    headers={
        "Accept-Language": "en-US,en;q=0.9",
        "Referer": "https://ultimateframedata.com/smash",
    },
)
print("STATUS", response.status_code)
print("TYPE", response.headers.get("content-type"))
response.raise_for_status()

soup = BeautifulSoup(response.text, "html.parser")
hitbox_links = soup.select("a.hitboximg")
print("HITBOX_LINK_COUNT", len(hitbox_links))
for index, tag in enumerate(hitbox_links[:60], start=1):
    attrs = {key: value for key, value in tag.attrs.items() if key in {"href", "data-src", "data-featherlight", "class"}}
    image = tag.find("img")
    img_attrs = {}
    if image:
        img_attrs = {key: value for key, value in image.attrs.items() if key in {"src", "data-src", "data-original", "loading", "class"}}
    container = tag.find_parent("div", class_="movecontainer")
    move_text = " ".join(container.get_text(" ", strip=True).split())[:180] if container else ""
    candidates = []
    for node in (tag, image):
        if not node:
            continue
        for key in ("href", "src", "data-src", "data-original", "data-featherlight"):
            raw = node.get(key)
            if isinstance(raw, str) and (".gif" in raw.lower() or "/hitboxes/" in raw.lower()):
                candidates.append(urljoin(URL, raw))
    print(f"LINK {index}: attrs={attrs!r} img={img_attrs!r} candidates={candidates!r} move={move_text!r}")
