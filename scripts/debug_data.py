#!/usr/bin/env python3
"""Debug script to show column names and sample data after filtering for SD."""

import requests
import pandas as pd
from io import BytesIO

WARN_URL = "https://edd.ca.gov/siteassets/files/jobs_and_training/warn/warn_report1.xlsx"

print("Downloading WARN data...")
response = requests.get(WARN_URL, timeout=60)
response.raise_for_status()

xl = pd.ExcelFile(BytesIO(response.content), engine='openpyxl')

# Read detailed report
for sheet_name in xl.sheet_names:
    if 'detailed' in sheet_name.lower():
        df = pd.read_excel(xl, sheet_name=sheet_name)
        break

print(f"\n=== RAW COLUMN NAMES (before normalization) ===")
for i, col in enumerate(df.columns):
    print(f"  {i}: '{col}'")

# Normalize column names
df.columns = df.columns.str.strip().str.lower().str.replace(' ', '_')

print(f"\n=== NORMALIZED COLUMN NAMES ===")
for i, col in enumerate(df.columns):
    print(f"  {i}: '{col}'")

# Filter for San Diego
county_cols = [c for c in df.columns if 'county' in c.lower()]
print(f"\n=== COUNTY COL: {county_cols[0] if county_cols else 'NOT FOUND'} ===")

if county_cols:
    sd_df = df[df[county_cols[0]].astype(str).str.lower().str.contains('san diego', na=False)]
    print(f"\n=== {len(sd_df)} SAN DIEGO NOTICES ===")
    
    # Show first 3 rows with all columns
    if len(sd_df) > 0:
        print("\n=== FIRST 3 SD NOTICES (all columns) ===")
        for idx, row in sd_df.head(3).iterrows():
            print(f"\n--- Row {idx} ---")
            for col in sd_df.columns:
                val = row[col]
                print(f"  '{col}': {val}")
