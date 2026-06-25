#!/usr/bin/env python3
"""Stage 2 — extract text + tables from cached MITCs.

- PDF  -> pdfplumber text + extract_tables, per page.
- HTML -> BeautifulSoup: visible text + every <table> as rows.
- Scanned PDFs are AUTO-DETECTED (near-empty text) and OCR'd via tesseract if
  the binaries are installed; otherwise flagged scanned/needs_review (no crash).

Outputs per source:
  scraper/extracted/<id>.txt
  scraper/extracted/<id>.tables.json
  scraper/extracted/_extract_status.json   (summary)

Usage:
  python extract.py                  # extract everything fetched
  python extract.py --only sbi hdfc  # just these ids
"""
from __future__ import annotations
import argparse
import re
import sys

from common import SOURCES_DIR, EXTRACTED_DIR, load_sources, write_json

# near-empty text => treat as scanned and try OCR
SCANNED_CHARS_PER_PAGE = 50


def clean_text(s: str) -> str:
    s = s.replace("\xa0", " ")
    s = re.sub(r"[ \t]+", " ", s)
    s = re.sub(r"\n{3,}", "\n\n", s)
    return s.strip()


# ---------- HTML ----------
def extract_html(path):
    from bs4 import BeautifulSoup
    soup = BeautifulSoup(path.read_bytes(), "lxml")
    for tag in soup(["script", "style", "noscript", "svg"]):
        tag.decompose()

    tables = []
    for ti, table in enumerate(soup.find_all("table")):
        rows = []
        for tr in table.find_all("tr"):
            cells = tr.find_all(["th", "td"])
            row = [clean_text(c.get_text(" ", strip=True)) for c in cells]
            if any(row):
                rows.append(row)
        if rows:
            tables.append({"index": ti, "rows": rows})

    text = clean_text(soup.get_text("\n", strip=True))
    return text, tables, {"n_pages": None, "scanned": False, "ocr_used": False}


# ---------- PDF ----------
def ocr_pdf(path):
    """Return OCR'd text, or None if OCR tooling is unavailable."""
    try:
        from pdf2image import convert_from_path
        import pytesseract
        images = convert_from_path(str(path), dpi=300)
        return "\n\n".join(pytesseract.image_to_string(img) for img in images)
    except Exception as e:  # missing poppler/tesseract or any OCR error
        print(f"      (OCR unavailable: {type(e).__name__}: {str(e).splitlines()[0][:80]})")
        return None


def extract_pdf(path):
    import pdfplumber
    page_texts, tables = [], []
    with pdfplumber.open(str(path)) as pdf:
        n_pages = len(pdf.pages)
        for pi, page in enumerate(pdf.pages):
            page_texts.append(page.extract_text() or "")
            for tbl in (page.extract_tables() or []):
                rows = [[clean_text(c or "") for c in row] for row in tbl]
                if any(any(r) for r in rows):
                    tables.append({"page": pi + 1, "rows": rows})

    text = clean_text("\n\n".join(page_texts))
    scanned = len(text) < SCANNED_CHARS_PER_PAGE * max(n_pages, 1)
    ocr_used = False
    if scanned:
        print(f"      scanned/near-empty ({len(text)} chars over {n_pages} pages) -> OCR")
        ocr = ocr_pdf(path)
        if ocr and len(ocr) > len(text):
            text, ocr_used = clean_text(ocr), True
    return text, tables, {"n_pages": n_pages, "scanned": scanned, "ocr_used": ocr_used}


def process(bank) -> dict:
    bid = bank["id"]
    # find the cached file (fetch may have overridden the extension)
    candidates = [SOURCES_DIR / f"{bid}.pdf", SOURCES_DIR / f"{bid}.html"]
    src = next((p for p in candidates if p.exists()), None)
    rec = {"id": bid, "bank": bank["bank"]}
    if not src:
        rec.update(ok=False, error="no cached source file (run fetch.py first)")
        return rec

    kind = "pdf" if src.suffix == ".pdf" else "html"
    try:
        if kind == "pdf":
            text, tables, meta = extract_pdf(src)
        else:
            text, tables, meta = extract_html(src)
    except Exception as e:
        rec.update(ok=False, error=f"{type(e).__name__}: {e}")
        return rec

    EXTRACTED_DIR.mkdir(parents=True, exist_ok=True)
    (EXTRACTED_DIR / f"{bid}.txt").write_text(text, encoding="utf-8")
    write_json(EXTRACTED_DIR / f"{bid}.tables.json", {"id": bid, "source": kind, "tables": tables})

    needs_review = bool(meta.get("scanned") and not meta.get("ocr_used"))
    rec.update(ok=True, kind=kind, chars=len(text), n_tables=len(tables),
               needs_review=needs_review, **meta)
    return rec


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--only", nargs="*", help="limit to these source ids")
    args = ap.parse_args()

    _meta, banks = load_sources()
    if args.only:
        wanted = set(args.only)
        banks = [b for b in banks if b["id"] in wanted]

    results = []
    for bank in banks:
        rec = process(bank)
        results.append(rec)
        if rec.get("ok"):
            flag = "REVIEW" if rec.get("needs_review") else "ok    "
            print(f"[{flag}] {rec['id']:<9} {rec['kind']:<4} chars={rec['chars']:>7} "
                  f"tables={rec['n_tables']:>3}" + ("  (scanned, no OCR)" if rec.get("needs_review") else ""))
        else:
            print(f"[FAIL  ] {rec['id']:<9} {rec.get('error')}")

    write_json(EXTRACTED_DIR / "_extract_status.json", {"results": results})
    ok = sum(1 for r in results if r.get("ok"))
    print(f"\nextract: {ok}/{len(results)} ok  ->  {EXTRACTED_DIR / '_extract_status.json'}")
    return 0 if ok else 1


if __name__ == "__main__":
    sys.exit(main())
