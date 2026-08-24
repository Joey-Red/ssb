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
links = []
for tag in soup.find_all(["a", "img"]):
    raw = tag.get("href") or tag.get("src")
    if raw and ".gif" in raw.lower():
        links.append((tag, urljoin(URL, raw)))

print("GIF_COUNT", len(links))
for index, (tag, absolute) in enumerate(links[:20], start=1):
    print(f"GIF {index}: {absolute}")
    node = tag
    for depth in range(5):
        if node is None:
            break
        text = " ".join(node.get_text(" ", strip=True).split())[:300]
        classes = " ".join(node.get("class", [])) if hasattr(node, "get") else ""
        print(f"  P{depth}: <{getattr(node, 'name', '?')}> class={classes!r} text={text!r}")
        node = node.parent
