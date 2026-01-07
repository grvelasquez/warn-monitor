#!/usr/bin/env python3
"""
FRED Data Fetcher for San Diego Housing Supply
Fetches Active Listing Count (ACTLISCOU6073) data from Federal Reserve Economic Data API.
"""

import json
import requests
from datetime import datetime
from pathlib import Path

# FRED API Configuration
FRED_API_KEY = "a72b02db4318645167d222b3d497ae02"
FRED_BASE_URL = "https://api.stlouisfed.org/fred/series/observations"

# San Diego Supply Series
SUPPLY_SERIES = {
    "ACTLISCOU6073": "Housing Inventory: Active Listing Count in San Diego County, CA"
}


def fetch_fred_series(series_id: str, limit: int = 120) -> list:
    """Fetch observations from FRED API for a given series."""
    params = {
        "series_id": series_id,
        "api_key": FRED_API_KEY,
        "file_type": "json",
        "sort_order": "desc",
        "limit": limit,  # 10 years of data
    }
    
    try:
        response = requests.get(FRED_BASE_URL, params=params, timeout=30)
        response.raise_for_status()
        data = response.json()
        
        observations = data.get("observations", [])
        clean_obs = []
        for obs in observations:
            if obs.get("value") and obs["value"] != ".":
                clean_obs.append({
                    "date": obs["date"],
                    "value": float(obs["value"])
                })
        # Sort ascending for chart
        return sorted(clean_obs, key=lambda x: x["date"])
    except Exception as e:
        print(f"Error fetching {series_id}: {e}")
        return []


def calculate_changes(observations: list) -> dict:
    """Calculate year-over-year changes."""
    if len(observations) < 13:
        return {"yoy": 0.0}
    
    current = observations[-1]["value"]
    previous_year = observations[-13]["value"]
    
    yoy = round(((current - previous_year) / previous_year) * 100, 2) if previous_year else 0.0
    
    return {"yoy": yoy, "current_value": current, "last_date": observations[-1]["date"]}


def save_data(data: dict, output_path: str):
    """Save data to JSON file."""
    path = Path(output_path)
    path.parent.mkdir(parents=True, exist_ok=True)
    
    with open(path, "w") as f:
        json.dump(data, f, indent=2)
    
    print(f"Successfully wrote data to {output_path}")


def main():
    print("Fetching Supply data from FRED...")
    series_id = "ACTLISCOU6073"
    observations = fetch_fred_series(series_id)
    
    if not observations:
        print("Failed to fetch data")
        return

    stats = calculate_changes(observations)
    
    output = {
        "meta": {
            "generated": datetime.now().isoformat(),
            "source": "FRED (Federal Reserve Bank of St. Louis)",
            "series_id": series_id,
            "title": SUPPLY_SERIES[series_id],
            "lastUpdate": stats["last_date"]
        },
        "summary": {
            "current_value": stats["current_value"],
            "yoy_change": stats["yoy"]
        },
        "history": observations
    }

    base_path = Path(__file__).parent.parent / "public" / "data"
    save_data(output, str(base_path / "supply_fred.json"))
    
    print(f"Current Value: {stats['current_value']}")
    print(f"YoY Change: {stats['yoy']}%")


if __name__ == "__main__":
    main()
