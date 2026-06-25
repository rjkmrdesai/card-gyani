"""Shared helpers for the Card Gyani MITC scraper (stages 1-2)."""
from __future__ import annotations
import json
from pathlib import Path
from urllib.parse import urlsplit, urlunsplit, quote

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
