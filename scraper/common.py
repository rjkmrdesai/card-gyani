"""Shared helpers for the Card Gyani MITC scraper (stages 1-2)."""
from __future__ import annotations
import json
import re
import unicodedata
from pathlib import Path
from urllib.parse import urlsplit, urlunsplit, quote

# Replacement char (U+FFFD) sitting before a number is almost always a rupee
# sign that failed to decode during PDF extraction.
_RUPEE_BEFORE_NUM = re.compile(r"�+\s*(?=\d)")


def sanitize(value):
    """Clean a value (recursively for dict/list) of mojibake before it goes into
    a sheet or Supabase. Fixes the ₹-decoded-as-U+FFFD case, repairs common
    UTF-8-as-Latin1 mojibake, strips stray replacement / zero-width chars, and
    normalizes to NFC. Non-strings pass through unchanged."""
    if isinstance(value, dict):
        return {k: sanitize(v) for k, v in value.items()}
    if isinstance(value, list):
        return [sanitize(v) for v in value]
    if not isinstance(value, str):
        return value
    s = unicodedata.normalize("NFC", value)
    s = s.replace("â‚¹", "₹").replace("â‚¬", "€")     # UTF-8 read as Latin-1
    s = _RUPEE_BEFORE_NUM.sub("₹", s)                 # � before a number -> ₹
    s = s.replace("�", "")                       # any remaining replacement chars
    s = s.replace("​", "").replace("﻿", "") # zero-width space / BOM
    s = re.sub(r"[ \t]+", " ", s).strip()
    return s

ROOT = Path(__file__).resolve().parent
SOURCES_JSON = ROOT / "sources.json"
SOURCES_DIR = ROOT / "sources"        # cached raw downloads (gitignored)
EXTRACTED_DIR = ROOT / "extracted"    # extracted text + tables (gitignored)

# Banks' WAFs (e.g. HDFC) 403 a bot UA, so we present a normal browser UA.
# Bot identity is still declared via the X-Scraper header in fetch.py.
BROWSER_UA = (
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) "
    "AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36"
)

MIN_HOST_INTERVAL = 2.0   # seconds between hits to the same host (politeness)


def load_sources() -> tuple[dict, list[dict]]:
    data = json.loads(SOURCES_JSON.read_text(encoding="utf-8"))
    return data.get("_meta", {}), data.get("banks", [])


def normalize_url(url: str) -> str:
    """Make a manifest URL safe to request without double-encoding.

    Encodes spaces and stray '&' in the PATH (e.g. SBM's 'T&C.pdf') while
    preserving already-percent-encoded sequences (e.g. RBL's '%20'). Leaves the
    query string intact (e.g. YES Bank's '?name=...').
    """
    parts = urlsplit(url)
    # safe='/%' keeps path separators and existing %xx escapes; encodes ' ', '&', etc.
    path = quote(parts.path, safe="/%")
    return urlunsplit((parts.scheme, parts.netloc, path, parts.query, parts.fragment))


def host_of(url: str) -> str:
    return urlsplit(url).netloc.lower()


def read_status(path: Path) -> dict:
    if path.exists():
        try:
            return json.loads(path.read_text(encoding="utf-8"))
        except Exception:
            return {}
    return {}


def write_json(path: Path, obj) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(obj, indent=2, ensure_ascii=False), encoding="utf-8")
