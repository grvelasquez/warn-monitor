"""
Shared helpers for the SDAR monthly data pipeline.

Report folders live in sdar_reports/ named "<Month> <Year>" (e.g. "June 2026").
Every parser resolves its target month the same way:
  1. --month "June 2026" CLI argument, if given
  2. otherwise the newest month-named folder in sdar_reports/
"""
import argparse
import re
from pathlib import Path

MONTH_NAMES = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December",
]

REPORTS_ROOT = Path(__file__).parent.parent / "sdar_reports"

_FOLDER_RE = re.compile(r"^(" + "|".join(MONTH_NAMES) + r") (\d{4})$")


def parse_month_folder(name):
    """'June 2026' -> (2026, 6) or None if not a month folder."""
    m = _FOLDER_RE.match(name.strip())
    if not m:
        return None
    return int(m.group(2)), MONTH_NAMES.index(m.group(1)) + 1


def find_latest_report_dir(root=REPORTS_ROOT):
    """Newest '<Month> <Year>' folder under sdar_reports/, or None."""
    best = None
    best_key = None
    if not root.exists():
        return None
    for p in root.iterdir():
        if not p.is_dir():
            continue
        key = parse_month_folder(p.name)
        if key and (best_key is None or key > best_key):
            best, best_key = p, key
    return best


def resolve_report_month(description):
    """Parse --month or auto-detect. Returns (reports_dir: Path, period: str, month_name: str)."""
    ap = argparse.ArgumentParser(description=description)
    ap.add_argument("--month", help='Report period, e.g. "June 2026". Default: newest folder in sdar_reports/')
    args = ap.parse_args()

    if args.month:
        if not parse_month_folder(args.month):
            raise SystemExit(f'--month must look like "June 2026", got: {args.month!r}')
        reports_dir = REPORTS_ROOT / args.month
        period = args.month
    else:
        reports_dir = find_latest_report_dir()
        if reports_dir is None:
            raise SystemExit(f"No '<Month> <Year>' folders found in {REPORTS_ROOT}")
        period = reports_dir.name

    month_name = period.split()[0]
    return reports_dir, period, month_name
