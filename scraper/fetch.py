#!/usr/bin/env python3
"""Stage 1 — fetch each MITC to scraper/sources/<id>.{pdf,html} (cached).

- Follows redirects, sends a browser-like UA (banks' WAFs block bot UAs),
  declares the bot via an X-Scraper header.
- Normalizes tricky URLs (encodes spaces / stray '&' in the path).
- Rate-limits to >=2s between hits to the same host.
- Skips anything already cached unless --refresh is passed.
- Writes scraper/sources/_fetch_status.json with per-source results.

Usage:
  python fetch.py                 # fetch all (cached ones skipped)
  python fetch.py --only sbi hdfc # fetch just these ids
  python fetch.py --refresh       # force re-download
"""
from __future__ import annotations
import argparse
import time
import sys
import requests

from common import (
    SOURCES_DIR, BROWSER_UA, MIN_HOST_INTERVAL,
    load_sources, normalize_url, host_of, write_json,
)

STATUS_PATH = SOURCES_DIR / "_fetch_status.json"


def ext_for(fmt: str) -> str:
    return "pdf" if fmt == "pdf" else "html"


def looks_like_pdf(content: bytes) -> bool:
    return content[:5].startswith(b"%PDF-")


def curl_fallback(url: str, dest) -> bool:
    """Some bank servers (e.g. SBM) fail the TLS handshake from LibreSSL/requests
    but succeed with `curl --tlsv1.2`. Shell out as a last resort."""
    import subprocess
    SOURCES_DIR.mkdir(parents=True, exist_ok=True)
    try:
        r = subprocess.run(
            ["curl", "-sSL", "--max-time", "45", "--tlsv1.2", "-A", BROWSER_UA,
             "-o", str(dest), url],
            capture_output=True, timeout=60)
        return r.returncode == 0 and dest.exists() and dest.stat().st_size > 0
    except Exception:
        return False


def fetch_one(session: requests.Session, bank: dict, refresh: bool) -> dict:
    bid = bank["id"]
    fmt = bank.get("format", "pdf")
    url = normalize_url(bank["mitc_url"])
    dest = SOURCES_DIR / f"{bid}.{ext_for(fmt)}"

    rec = {"id": bid, "bank": bank["bank"], "url": url, "format": fmt,
           "path": str(dest.relative_to(SOURCES_DIR.parent))}

    if dest.exists() and not refresh:
        rec.update(ok=True, cached=True, bytes=dest.stat().st_size,
                   note="already cached (use --refresh to force)")
        return rec

    try:
        resp = session.get(url, timeout=45, allow_redirects=True, stream=True)
        content = resp.content
        ctype = resp.headers.get("Content-Type", "").split(";")[0].strip()
        rec.update(http_status=resp.status_code, content_type=ctype,
                   bytes=len(content), final_url=resp.url)

        if resp.status_code != 200 or not content:
            rec.update(ok=False, error=f"HTTP {resp.status_code} / {len(content)} bytes")
            return rec

        # Sanity: a PDF source that came back as HTML is usually a block/error page.
        is_pdf_bytes = looks_like_pdf(content)
        if fmt == "pdf" and not is_pdf_bytes:
            rec.update(ok=False, warning="expected PDF but body is not %PDF- "
                       "(likely an error/redirect page); saved for inspection")
        elif fmt == "html" and is_pdf_bytes:
            rec.update(warning="manifest says html but body is a PDF; saving as .pdf")
            dest = SOURCES_DIR / f"{bid}.pdf"
            rec["path"] = str(dest.relative_to(SOURCES_DIR.parent))

        SOURCES_DIR.mkdir(parents=True, exist_ok=True)
        dest.write_bytes(content)
        rec.setdefault("ok", True)
        rec["cached"] = False
    except requests.exceptions.SSLError as e:
        if curl_fallback(url, dest):
            rec.update(ok=True, cached=False, bytes=dest.stat().st_size,
                       warning="requests SSLError -> fetched via curl --tlsv1.2 fallback")
        else:
            rec.update(ok=False, error=f"SSLError and curl fallback failed: {e}")
    except requests.RequestException as e:
        rec.update(ok=False, error=f"{type(e).__name__}: {e}")
    return rec


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--only", nargs="*", help="limit to these source ids")
    ap.add_argument("--refresh", action="store_true", help="force re-download")
    args = ap.parse_args()

    _meta, banks = load_sources()
    if args.only:
        wanted = set(args.only)
        banks = [b for b in banks if b["id"] in wanted]

    session = requests.Session()
    session.headers.update({
        "User-Agent": BROWSER_UA,
        "X-Scraper": "CardGyaniBot/1.0 (+https://cardgyani.com)",
        "Accept": "application/pdf,text/html,*/*",
        "Accept-Language": "en-IN,en;q=0.9",
    })

    last_hit: dict[str, float] = {}
    results = []
    for bank in banks:
        host = host_of(normalize_url(bank["mitc_url"]))
        # politeness: space out hits to the same host
        wait = MIN_HOST_INTERVAL - (time.monotonic() - last_hit.get(host, 0))
        will_hit_network = not (SOURCES_DIR / f"{bank['id']}.{ext_for(bank.get('format','pdf'))}").exists() or args.refresh
        if will_hit_network and wait > 0:
            time.sleep(wait)
        rec = fetch_one(session, bank, args.refresh)
        if will_hit_network:
            last_hit[host] = time.monotonic()
        results.append(rec)
        flag = "ok " if rec.get("ok") else "FAIL"
        extra = rec.get("warning") or rec.get("error") or rec.get("note") or ""
        print(f"[{flag}] {rec['id']:<9} {rec.get('bytes',0):>9} B  {extra}")

    write_json(STATUS_PATH, {"results": results})
    ok = sum(1 for r in results if r.get("ok"))
    print(f"\nfetch: {ok}/{len(results)} ok  ->  {STATUS_PATH.relative_to(SOURCES_DIR.parent.parent) if False else STATUS_PATH}")
    return 0 if ok else 1


if __name__ == "__main__":
    sys.exit(main())
