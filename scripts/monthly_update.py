#!/usr/bin/env python3
"""
One-shot SDAR monthly data pipeline.

Downloads every source PDF for the target month, verifies each one is really
that month, runs all parsers + analysis, and prints the key figures needed
to rewrite the dashboards' AI executive summaries.

Usage:
  python scripts/monthly_update.py                     # target = previous calendar month
  python scripts/monthly_update.py --month "June 2026" # explicit
  python scripts/monthly_update.py --skip-download     # PDFs already in place
  python scripts/monthly_update.py --figures-only      # just reprint the figures report

Idempotent: existing PDFs are kept (re-run safely after a partial failure).

Report sources (sdar.stats.10kresearch.com):
  per-zip LMU : /docs/lmu/x/<slug>                 (no date; serves latest published month)
  Monthly Ind.: /docs/mmi/<YYYY-MM>/x/report?src=page
  Housing Sup.: /docs/hso/<YYYY-MM>/x/report?src=page
  Lender-Med. : /docs/fss/<YYYY-MM>/x/report?src=page  ("FSS" per the PDF's Subject metadata)
"""
import argparse
import csv
import datetime
import json
import shutil
import subprocess
import sys
import time
import urllib.parse
from pathlib import Path

import pdfplumber
import requests

from sdar_common import MONTH_NAMES, REPORTS_ROOT, parse_month_folder

BASE = "https://sdar.stats.10kresearch.com/docs"
UA = ("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
      "(KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36")
SCRIPTS = Path(__file__).parent
DATA = SCRIPTS.parent / "public" / "data"

COUNTY_REPORTS = [  # (code, filename suffix)
    ("mmi", "Monthly Indicators"),
    ("hso", "Housing Supply"),
    ("fss", "Lender Mediated"),
]


def previous_month():
    today = datetime.date.today()
    y, m = (today.year, today.month - 1) if today.month > 1 else (today.year - 1, 12)
    return f"{MONTH_NAMES[m - 1]} {y}"


def fetch_pdf(url, dest):
    """Download url to dest; return True only if it's a real PDF."""
    r = requests.get(url, headers={"User-Agent": UA}, timeout=30, allow_redirects=True)
    if r.status_code != 200 or not r.content.startswith(b"%PDF"):
        return False
    dest.write_bytes(r.content)
    return True


def pdf_first_page_text(path):
    with pdfplumber.open(path) as pdf:
        return pdf.pages[0].extract_text() or ""


def assert_period(path, period, label):
    """Abort if the PDF's first page doesn't mention the target period."""
    if period not in pdf_first_page_text(path):
        raise SystemExit(
            f"ABORT: {label} ({path.name}) does not say '{period}'.\n"
            f"The endpoint may still be serving the prior month — try again in a few days."
        )
    print(f"  verified {label}: {period}")


def download_all(period, month_dir):
    month_name, year = period.split()[0], int(period.split()[1])
    yyyymm = f"{year}-{MONTH_NAMES.index(month_name) + 1:02d}"
    month_dir.mkdir(parents=True, exist_ok=True)

    # --- 97 per-zip LMU PDFs ---
    rows = list(csv.DictReader(open(SCRIPTS / "sdar_zips.csv", encoding="utf-8-sig")))
    ok = skip = fail = 0
    failed = []
    for row in rows:
        slug = row["slug"].strip('"')
        dest = month_dir / f"{slug}.pdf"
        if dest.exists():
            skip += 1
            continue
        url = f"{BASE}/lmu/x/{urllib.parse.quote(slug)}"
        if fetch_pdf(url, dest):
            ok += 1
        else:
            fail += 1
            failed.append(slug)
        time.sleep(0.4)
    print(f"LMU per-zip: downloaded {ok}, skipped {skip}, failed {fail}")
    if failed:
        print("  FAILED:", ", ".join(failed))
        raise SystemExit("ABORT: some per-zip PDFs failed — re-run to retry (existing files are kept).")

    # LMU endpoint serves "latest" — make sure latest == target month.
    sample = next(p for p in sorted(month_dir.glob("[0-9]*.pdf")))
    if f"Local Market Update for {period}" not in pdf_first_page_text(sample):
        raise SystemExit(
            f"ABORT: LMU PDFs are not for {period} (checked {sample.name}). "
            f"The site is serving a different month — delete {month_dir} and retry later."
        )
    print(f"  verified LMU: {period}")

    # --- 3 county-wide PDFs ---
    for code, suffix in COUNTY_REPORTS:
        dest = month_dir / f"{month_name} {suffix}.pdf"
        if not dest.exists():
            url = f"{BASE}/{code}/{yyyymm}/x/report?src=page"
            if not fetch_pdf(url, dest):
                raise SystemExit(f"ABORT: county report '{code}' ({yyyymm}) not available yet at {url}")
        assert_period(dest, period, suffix)

    # Monthly Indicators also feeds the 10-year historical series.
    hist = REPORTS_ROOT / "Monthly Indicators" / f"{period}.pdf"
    if not hist.exists():
        shutil.copy2(month_dir / f"{month_name} Monthly Indicators.pdf", hist)
        print(f"  copied Monthly Indicators -> {hist.name}")


def run_parsers(period):
    steps = [
        (["python", "process_sdar_pdfs.py", "--month", period], "sdar neighborhoods + county"),
        (["python", "process_supply.py", "--month", period], "housing supply"),
        (["python", "process_lender_mediated.py", "--month", period], "lender-mediated"),
        (["python", "generate_ai_analysis.py"], "neighborhood analysis"),
        (["python", "extract_historical_data.py"], "historical indicators"),
    ]
    for cmd, label in steps:
        print(f"\n--- {label} ---")
        r = subprocess.run(cmd, cwd=SCRIPTS, capture_output=True, text=True)
        tail = "\n".join((r.stdout + r.stderr).strip().splitlines()[-3:])
        print(tail)
        if r.returncode != 0:
            raise SystemExit(f"ABORT: {label} failed (exit {r.returncode})")


def load(name):
    return json.load(open(DATA / name, encoding="utf-8"))


def figures_report(period):
    """Print every figure the hand-written AI summaries reference."""
    sd, hs, lm = load("sdar_neighborhood_data.json"), load("housing_supply_data.json"), load("lender_mediated_data.json")
    hist = load("historical_indicators.json")
    print("\n" + "=" * 62)
    print(f"FIGURES REPORT — {period}  (for the AI executive summaries)")
    print("=" * 62)
    for f, d in [("sdar", sd), ("supply", hs), ("lender", lm)]:
        assert d["meta"]["report_period"] == period, f"{f} report_period != {period}"
    yyyymm = f"{period.split()[1]}-{MONTH_NAMES.index(period.split()[0]) + 1:02d}"
    assert hist[-1]["period"] == yyyymm, f"historical last period {hist[-1]['period']} != {yyyymm} — historical step failed?"
    print(f"report_period OK in all 3 JSONs | historical last: {hist[-1]['period']}")

    cw = sd["county_wide"]
    for seg in ("detached", "attached"):
        c = cw[seg]
        print(f"\n[county {seg}]")
        print(f"  median {c['median_price_2025']:,} -> {c['median_price_2026']:,} ({c['median_price_pct_change']:+}%)"
              f" | inv {c['inventory_2025']:,} -> {c['inventory_2026']:,} ({c['inventory_pct_change']:+}%)"
              f" | supply {c['months_supply_2026']} mo")
        print(f"  DOM {c['dom_2025']} -> {c['dom_2026']} ({c['dom_pct_change']:+}%)"
              f" | new listings {c['new_listings_pct_change']:+}% | pending {c['pending_sales_pct_change']:+}%"
              f" | closed {c['closed_sales_pct_change']:+}%")

    inv = hs["inventory"]["by_price_range"]
    def tot(sec, sub, yr):
        return sum(i.get(sub, {}).get(yr, 0) for i in hs[sec]["by_price_range"])
    print("\n[supply rolling-12mo]")
    for sub in ("all_properties", "single_family", "condos"):
        a, b = tot("inventory", sub, "2025"), tot("inventory", sub, "2026")
        print(f"  inventory {sub}: {a:,} -> {b:,} ({(b - a) / a * 100:+.1f}%)")
    a, b = tot("closed_sales", "all_properties", "2025"), tot("closed_sales", "all_properties", "2026")
    print(f"  closed all: {a:,} -> {b:,} ({(b - a) / a * 100:+.1f}%)")
    print(f"  $5M+ inv: {inv[-1]['all_properties']} | $5M+ closed: {hs['closed_sales']['by_price_range'][-1]['all_properties']}")
    dom = hs["days_on_market"]["by_price_range"]
    band = next(i for i in dom if "750,001" in i["category"])
    print(f"  DOM $750K-1M: {band['all_properties']} | DOM $5M+: {dom[-1]['all_properties']}")
    plp = next(i for i in hs["pct_list_price"]["by_price_range"] if "750,001" in i["category"])
    print(f"  pct-list $750K-1M: {plp['all_properties']} | median 6001+sqft: {hs['median_price']['by_sq_footage'][-1]['all_properties']}")

    print("\n[lender-mediated]")
    li = {r["type"]: r for r in lm["inventory"]["by_property_type"]}
    for t in ("All Properties", "Single-Family Homes", "Condos - Townhomes"):
        print(f"  inv {t}: {li[t]['lender_mediated']} share {li[t]['share']}")
    act = lm["activity"]
    print(f"  new listings: {act['new_listings']['lender_mediated']} | closed: {act['closed_sales']['lender_mediated']} share {act['closed_sales']['share']}")
    pd_ = {r["type"]: r for r in lm["price_dom"]["median_price"]}
    for t in ("All Properties", "Single-Family Homes", "Condos - Townhomes"):
        print(f"  median {t}: LM {pd_[t]['lender_mediated']} | trad {pd_[t]['traditional']}")
    hi25 = sum(i["lender_mediated"]["2025"] for i in lm["inventory"]["by_price_range"] if "1,250,001" in i["range"])
    hi26 = sum(i["lender_mediated"]["2026"] for i in lm["inventory"]["by_price_range"] if "1,250,001" in i["range"])
    print(f"  $1.25M+ LM inv: {hi25} -> {hi26} ({(hi26 - hi25) / hi25 * 100:+.1f}%)" if hi25 else "")
    rows, zero = [], []
    for it in lm["area_inventory_sales"]:
        ivn = it["inventory"]; tm = ivn.get("total_market") or 0; l = ivn.get("lender_mediated") or 0
        if l == 0 and tm > 0:
            zero.append(f"{it['neighborhood']} ({it['zip_code']})")
        if ivn.get("share") is not None and tm >= 5:
            rows.append((ivn["share"], it["zip_code"], it["neighborhood"]))
    rows.sort(reverse=True)
    print(f"  top LM share: {[(z, n, f'{s}%') for s, z, n in rows[:3]]}")
    print(f"  zero-LM zips ({len(zero)}): {', '.join(zero[:5])}")
    print(f"\n  LM trend-chart point to append in LenderMediatedDashboard.jsx: "
          f"{{ date: '{datetime.datetime.strptime(period.split()[0], '%B').month:02d}-{period.split()[1]}', "
          f"value: {li['All Properties']['lender_mediated']['2026']} }}")
    print("=" * 62)


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--month", help='e.g. "June 2026" (default: previous calendar month)')
    ap.add_argument("--skip-download", action="store_true")
    ap.add_argument("--figures-only", action="store_true")
    args = ap.parse_args()

    period = args.month or previous_month()
    if not parse_month_folder(period):
        raise SystemExit(f'--month must look like "June 2026", got: {period!r}')
    month_dir = REPORTS_ROOT / period
    print(f"Target report period: {period}\n")

    if args.figures_only:
        figures_report(period)
        return
    if not args.skip_download:
        download_all(period, month_dir)
    run_parsers(period)
    figures_report(period)
    print("\nNEXT (manual, judgment-based): update month labels via meta.report_period fallbacks,")
    print("rewrite the 3 AI summaries from the figures above, append the LM trend point, verify, commit.")


if __name__ == "__main__":
    main()
