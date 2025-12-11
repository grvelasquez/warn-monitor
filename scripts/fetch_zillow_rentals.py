#!/usr/bin/env python3
"""
Zillow Rental Data Fetcher for San Diego Neighborhoods
Downloads ZORI (Zillow Observed Rent Index) data and filters for San Diego County.
"""

import json
import requests
import csv
from datetime import datetime
from pathlib import Path
from io import StringIO

# Zillow ZORI CSV URL (ZIP-level data)
ZORI_URL = "https://files.zillowstatic.com/research/public_csvs/zori/Zip_zori_uc_sfrcondomfr_sm_sa_month.csv"

# San Diego County ZIP codes (matching our SDAR coverage)
SD_ZIPS = [
    "91901", "91902", "91910", "91911", "91913", "91914", "91915", "91916", "91917",
    "91931", "91932", "91934", "91935", "91941", "91942", "91945", "91948", "91950",
    "91962", "91963", "92007", "92008", "92009", "92010", "92011", "92014", "92024",
    "92037", "92040", "92054", "92056", "92057", "92058", "92059", "92060", "92061",
    "92064", "92065", "92066", "92067", "92069", "92070", "92071", "92075", "92078",
    "92081", "92082", "92083", "92084", "92086", "92091", "92101", "92102", "92103",
    "92104", "92105", "92106", "92107", "92108", "92109", "92110", "92111", "92113",
    "92114", "92115", "92116", "92117", "92118", "92119", "92120", "92121", "92122",
    "92123", "92124", "92126", "92127", "92128", "92129", "92130", "92131", "92139",
    "92154", "92173"
]

# Neighborhood names for ZIP codes
ZIP_NAMES = {
    "91901": "Alpine", "91902": "Bonita", "91910": "Chula Vista North", "91911": "Chula Vista South",
    "91913": "Chula Vista Eastlake", "91914": "Chula Vista NE", "91915": "Chula Vista SE",
    "91932": "Imperial Beach", "91941": "La Mesa Mount Helix", "91942": "La Mesa Grossmont",
    "91945": "Lemon Grove", "91950": "National City", "92007": "Cardiff", "92008": "Carlsbad NW",
    "92009": "Carlsbad SE", "92010": "Carlsbad NE", "92011": "Carlsbad SW", "92014": "Del Mar",
    "92024": "Encinitas", "92037": "La Jolla", "92040": "Lakeside", "92054": "Oceanside South",
    "92056": "Oceanside East", "92057": "Oceanside North", "92064": "Poway", "92065": "Ramona",
    "92067": "Rancho Santa Fe", "92069": "San Marcos South", "92071": "Santee", "92075": "Solana Beach",
    "92078": "San Marcos North", "92081": "Vista South", "92101": "Downtown", "92102": "Golden Hill/South Park",
    "92103": "Hillcrest/Mission Hills", "92104": "North Park", "92105": "City Heights",
    "92106": "Point Loma", "92107": "Ocean Beach", "92108": "Mission Valley", "92109": "Pacific Beach",
    "92110": "Morena", "92111": "Linda Vista", "92113": "Logan Heights", "92114": "Encanto",
    "92115": "College", "92116": "Kensington/Normal Heights", "92117": "Clairemont", "92118": "Coronado",
    "92119": "San Carlos", "92120": "Allied Gardens/Del Cerro", "92121": "Sorrento Valley",
    "92122": "University City", "92123": "Serra Mesa", "92124": "Tierrasanta", "92126": "Mira Mesa",
    "92127": "Rancho Bernardo West", "92128": "Rancho Bernardo East", "92129": "Penasquitos",
    "92130": "Carmel Valley", "92131": "Scripps Ranch", "92139": "Paradise Hills",
    "92154": "Nestor/Otay Mesa", "92173": "San Ysidro"
}


def fetch_zori_data():
    """Fetch ZORI CSV from Zillow and parse it."""
    print(f"Fetching Zillow ZORI data from {ZORI_URL}...")
    
    try:
        response = requests.get(ZORI_URL, timeout=60)
        response.raise_for_status()
        
        # Parse CSV
        reader = csv.DictReader(StringIO(response.text))
        rows = list(reader)
        print(f"  Downloaded {len(rows)} ZIP code records")
        return rows
    except Exception as e:
        print(f"Error fetching ZORI data: {e}")
        return []


def filter_san_diego(rows):
    """Filter for San Diego County ZIPs only."""
    sd_rows = []
    for row in rows:
        zip_code = str(row.get("RegionName", "")).strip()
        if zip_code in SD_ZIPS:
            sd_rows.append(row)
    
    print(f"  Found {len(sd_rows)} San Diego County ZIP codes")
    return sd_rows


def get_date_columns(row):
    """Get all date columns (YYYY-MM-DD format) from a row."""
    date_cols = []
    for key in row.keys():
        if key and len(key) == 10 and key[4] == '-' and key[7] == '-':
            try:
                datetime.strptime(key, "%Y-%m-%d")
                date_cols.append(key)
            except ValueError:
                pass
    return sorted(date_cols)


def process_zip_data(row, date_columns):
    """Process a single ZIP's rental data."""
    zip_code = str(row.get("RegionName", "")).strip()
    
    # Get the most recent data points
    recent_dates = date_columns[-12:]  # Last 12 months
    
    history = []
    for date in recent_dates:
        val = row.get(date, "")
        if val and val != "":
            try:
                history.append({
                    "date": date,
                    "rent": round(float(val), 0)
                })
            except ValueError:
                pass
    
    if not history:
        return None
    
    current_rent = history[-1]["rent"] if history else None
    
    # Calculate YoY change
    yoy_change = None
    if len(history) >= 12:
        current = history[-1]["rent"]
        year_ago = history[-12]["rent"]
        if year_ago > 0:
            yoy_change = round(((current - year_ago) / year_ago) * 100, 1)
    
    # Calculate 3-month change
    three_month_change = None
    if len(history) >= 3:
        current = history[-1]["rent"]
        three_ago = history[-3]["rent"]
        if three_ago > 0:
            three_month_change = round(((current - three_ago) / three_ago) * 100, 1)
    
    return {
        "zip_code": zip_code,
        "neighborhood": ZIP_NAMES.get(zip_code, zip_code),
        "current_rent": current_rent,
        "yoy_change": yoy_change,
        "three_month_change": three_month_change,
        "history": history[-6:]  # Last 6 months for charts
    }


def build_rental_data(sd_rows):
    """Build the final rental data structure."""
    if not sd_rows:
        return None
    
    # Get date columns from first row
    date_columns = get_date_columns(sd_rows[0])
    
    if not date_columns:
        print("  ERROR: No date columns found in data")
        return None
    
    latest_date = date_columns[-1]
    print(f"  Latest data: {latest_date}")
    
    # Check if data is current (should be within last 3 months for December 2025)
    latest_dt = datetime.strptime(latest_date, "%Y-%m-%d")
    now = datetime.now()
    months_old = (now.year - latest_dt.year) * 12 + (now.month - latest_dt.month)
    
    if months_old > 3:
        print(f"  WARNING: Data is {months_old} months old!")
    
    # Process each ZIP
    neighborhoods = []
    total_rent = 0
    rent_count = 0
    
    for row in sd_rows:
        zip_data = process_zip_data(row, date_columns)
        if zip_data and zip_data["current_rent"]:
            neighborhoods.append(zip_data)
            total_rent += zip_data["current_rent"]
            rent_count += 1
    
    # Sort by current rent (descending)
    neighborhoods.sort(key=lambda x: x["current_rent"] or 0, reverse=True)
    
    # Build summary
    avg_rent = round(total_rent / rent_count) if rent_count > 0 else 0
    max_rent = max((n["current_rent"] for n in neighborhoods), default=0)
    min_rent = min((n["current_rent"] for n in neighborhoods if n["current_rent"]), default=0)
    
    # Average YoY change
    yoy_values = [n["yoy_change"] for n in neighborhoods if n["yoy_change"] is not None]
    avg_yoy = round(sum(yoy_values) / len(yoy_values), 1) if yoy_values else None
    
    return {
        "meta": {
            "generated": datetime.now().isoformat(),
            "source": "Zillow ZORI (Observed Rent Index)",
            "data_date": latest_date,
            "neighborhoods_count": len(neighborhoods),
            "data_freshness_months": months_old
        },
        "summary": {
            "avg_rent": avg_rent,
            "max_rent": max_rent,
            "min_rent": min_rent,
            "avg_yoy_change": avg_yoy
        },
        "neighborhoods": neighborhoods
    }


def save_data(data, output_path):
    """Save data to JSON file."""
    path = Path(output_path)
    path.parent.mkdir(parents=True, exist_ok=True)
    
    with open(path, "w") as f:
        json.dump(data, f, indent=2)
    
    print(f"\nSuccessfully saved data to {output_path}")


def main():
    output_path = Path(__file__).parent.parent / "public" / "data" / "zillow_rental_data.json"
    
    # Fetch ZORI data
    rows = fetch_zori_data()
    if not rows:
        print("Failed to fetch ZORI data")
        return
    
    # Filter for San Diego
    sd_rows = filter_san_diego(rows)
    if not sd_rows:
        print("No San Diego data found")
        return
    
    # Build rental data
    data = build_rental_data(sd_rows)
    if not data:
        print("Failed to build rental data")
        return
    
    # Save
    save_data(data, str(output_path))
    
    # Print summary
    print(f"\nSummary:")
    print(f"  Neighborhoods: {data['meta']['neighborhoods_count']}")
    print(f"  Avg Rent: ${data['summary']['avg_rent']:,}")
    print(f"  Max Rent: ${data['summary']['max_rent']:,}")
    print(f"  Min Rent: ${data['summary']['min_rent']:,}")
    print(f"  Avg YoY Change: {data['summary']['avg_yoy_change']}%")


if __name__ == "__main__":
    main()
