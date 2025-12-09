#!/usr/bin/env python3
"""
Fetch San Diego Unemployment Data from FRED API
"""

import json
import requests
from datetime import datetime
from pathlib import Path

FRED_API_KEY = "a72b02db4318645167d222b3d497ae02"
FRED_BASE_URL = "https://api.stlouisfed.org/fred/series/observations"

# San Diego County unemployment rate - correct series ID
SD_UNEMPLOYMENT_SERIES = "CASAND5URN"  # San Diego County, CA Unemployment Rate

def fetch_fred_series(series_id: str, limit: int = 36) -> list:
    """Fetch observations from FRED API for a given series."""
    params = {
        "series_id": series_id,
        "api_key": FRED_API_KEY,
        "file_type": "json",
        "sort_order": "desc",
        "limit": limit,
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
        return clean_obs
    except Exception as e:
        print(f"Error fetching {series_id}: {e}")
        return []

def main():
    print("Fetching San Diego unemployment data from FRED...")
    
    unemployment_data = fetch_fred_series(SD_UNEMPLOYMENT_SERIES, 36)
    
    if not unemployment_data:
        print("Failed to fetch unemployment data")
        return
    
    # Format for chart - reverse to chronological order
    unemployment_data.reverse()
    
    # Build output
    output = {
        "meta": {
            "generated": datetime.now().isoformat(),
            "source": "FRED - San Diego-Chula Vista-Carlsbad, CA",
            "series_id": SD_UNEMPLOYMENT_SERIES,
            "lastUpdate": unemployment_data[-1]["date"] if unemployment_data else None,
        },
        "currentRate": unemployment_data[-1]["value"] if unemployment_data else None,
        "history": [
            {
                "date": item["date"][:7],  # YYYY-MM format
                "rate": item["value"]
            }
            for item in unemployment_data
        ]
    }
    
    # Save to file
    output_path = Path(__file__).parent.parent / "public" / "data" / "unemployment_data.json"
    output_path.parent.mkdir(parents=True, exist_ok=True)
    
    with open(output_path, "w") as f:
        json.dump(output, f, indent=2)
    
    print(f"Successfully wrote data to {output_path}")
    print(f"Current SD Unemployment Rate: {output['currentRate']}%")
    print(f"Data points: {len(unemployment_data)}")

if __name__ == "__main__":
    main()
