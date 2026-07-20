---
name: monthly-update
description: Refresh every SDAR dashboard to the latest month of data — download PDFs, parse, rewrite AI summaries, verify, commit, push. Use when the user asks to update the site/dashboards to a new month (e.g. "update to July data", "run the monthly update").
---

# SDAR Monthly Data Update

Goal: move the whole dashboard to the target month in one session, ending with a
pushed `chore: update all dashboard data for <Month> <Year>` commit on `main`
(Vercel auto-deploys from `main`).

The target month is normally the month BEFORE the current one (SDAR publishes
each month's reports around the 5th of the following month). If the user names a
month, use that.

## Steps

1. **Sync first.** `git fetch` + fast-forward `main` to `origin/main` before
   touching anything (automated daily commits land on the remote constantly; a
   stale clone caused a painful divergence once). If the working tree has
   unrelated changes, leave them alone — commit only the files listed in step 6.

2. **Run the pipeline:**
   ```
   python scripts/monthly_update.py                     # previous month
   python scripts/monthly_update.py --month "July 2026" # explicit
   ```
   It downloads all 97 per-zip LMU PDFs + the 3 county PDFs (mmi/hso/fss
   endpoints), verifies each PDF really is the target month (aborts otherwise —
   if it aborts saying the month isn't published yet, stop and tell the user),
   runs every parser + analysis + historical script, and ends with a
   **FIGURES REPORT**. Idempotent — re-run after any partial failure.

3. **Month labels are automatic.** All "06-2026"-style tags, badges, YTD lines,
   and "Current as of" strings derive from `meta.report_period` via
   `src/utils/reportPeriod.js` — do NOT hand-edit labels. Optionally bump
   `DEFAULT_PERIOD` there (pre-fetch fallback only).

4. **Rewrite the 3 AI executive summaries** using ONLY figures from the FIGURES
   REPORT (never invent numbers, and don't reuse last month's — the narrative
   genuinely flips month to month: prices plateaued in May, reaccelerated in June):
   - `src/aiAnalysisData.js` — detached + attached paragraphs (SDAR page).
   - `src/SupplyDashboard.jsx` — "AI Executive Summary" section: header
     paragraph + blocks 1–5. Block titles should match direction (e.g.
     "Pricing Plateau" vs "Pricing Reaccelerates").
   - `src/LenderMediatedDashboard.jsx` — "AI Executive Summary" section:
     intro + sections 1–4, including the Highest-Share zips and Zero-LM zips
     from the report.

5. **Append the LM trend point** in `LenderMediatedDashboard.jsx` (~line 500):
   the FIGURES REPORT prints the exact `{ date: 'MM-YYYY', value: N }` line.
   APPEND it — never relabel the existing historical dates.

6. **Verify, then ship.** Start the `dev` preview; check Supply,
   Lender-Mediated, and Real Estate pages show the new month with no console
   errors. Then commit ONLY: the 5 data JSONs (`historical_indicators`,
   `housing_supply_data`, `lender_mediated_data`, `neighborhood_analysis`,
   `sdar_neighborhood_data`; include `sdar_data.json` if changed) + the 3 source
   files edited in steps 4–5. Message: `chore: update all dashboard data for
   <Month> <Year>`. Push; if rejected, fetch + rebase/cherry-pick onto
   `origin/main` (the remote moves daily) — never force-push.

## Notes
- `sdar_reports/` is gitignored — PDFs never get committed.
- Report URLs live in `scripts/monthly_update.py` (codes: lmu / mmi / hso / fss).
- The old Desktop scraper (`C:\Users\grvel\Desktop\Claude scraper\`) is
  superseded by the orchestrator; the zip list is now `scripts/sdar_zips.csv`.
