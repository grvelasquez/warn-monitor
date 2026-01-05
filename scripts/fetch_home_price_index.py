#!/usr/bin/env python3
"""
FRED Data Fetcher for Case-Shiller Home Price Index
Fetches S&P CoreLogic Case-Shiller U.S. National Home Price Index data from Federal Reserve Economic Data API.
"""

import json
import requests
from datetime import datetime
from pathlib import Path

# FRED API Configuration
FRED_API_KEY = "a72b02db4318645167d222b3d497ae02"
FRED_BASE_URL = "https://api.stlouisfed.org/fred/series/observations"

# San Diego Home Price Index series
SD_HOME_PRICE_SERIES = {
    "SDXRSA": {"name": "Seasonally Adjusted", "key": "sa"},
    "SDXRNSA": {"name": "Not Seasonally Adjusted", "key": "nsa"},
}

# U.S. National Home Price Index series (Case-Shiller)
US_HOME_PRICE_SERIES = {
    "CSUSHPISA": {"name": "Seasonally Adjusted", "key": "sa"},
    "CSUSHPINSA": {"name": "Not Seasonally Adjusted", "key": "nsa"},
}


def fetch_fred_series(series_id: str, limit: int = 60) -> list:
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


def calculate_changes(observations: list) -> dict:
    """Calculate month-over-month and year-over-year changes."""
    if len(observations) < 2:
        return {"mom": 0.0, "yoy": 0.0}
    
    current = observations[0]["value"]
    previous_month = observations[1]["value"] if len(observations) > 1 else current
    previous_year = observations[12]["value"] if len(observations) > 12 else current
    
    mom = round(((current - previous_month) / previous_month) * 100, 2) if previous_month else 0.0
    yoy = round(((current - previous_year) / previous_year) * 100, 2) if previous_year else 0.0
    
    return {"mom": mom, "yoy": yoy}


def build_history(sa_obs: list, nsa_obs: list, limit: int = 36) -> list:
    """Build combined history for charting."""
    # Create lookup by date
    sa_lookup = {obs["date"]: obs["value"] for obs in sa_obs}
    nsa_lookup = {obs["date"]: obs["value"] for obs in nsa_obs}
    
    # Get all unique dates and sort
    all_dates = sorted(set(sa_lookup.keys()) | set(nsa_lookup.keys()))[-limit:]
    
    history = []
    for date in all_dates:
        history.append({
            "date": date[:7],  # YYYY-MM format
            "sa": sa_lookup.get(date),
            "nsa": nsa_lookup.get(date),
        })
    
    return history


def fetch_home_price_data(sa_series: str, nsa_series: str, description: str) -> dict:
    """Fetch home price index data and compile into JSON."""
    print(f"Fetching {description} data from FRED...")
    
    # Fetch series
    sa_obs = fetch_fred_series(sa_series, 60)
    nsa_obs = fetch_fred_series(nsa_series, 60)
    
    if not sa_obs and not nsa_obs:
        print(f"Warning: No data fetched for {description}")
        return None
    
    # Current values
    current = {
        "seasonallyAdjusted": {
            "value": round(sa_obs[0]["value"], 2) if sa_obs else None,
            "date": sa_obs[0]["date"] if sa_obs else None
        },
        "notSeasonallyAdjusted": {
            "value": round(nsa_obs[0]["value"], 2) if nsa_obs else None,
            "date": nsa_obs[0]["date"] if nsa_obs else None
        }
    }
    
    # Calculate changes
    sa_changes = calculate_changes(sa_obs)
    nsa_changes = calculate_changes(nsa_obs)
    
    changes = {
        "monthOverMonth": {"sa": sa_changes["mom"], "nsa": nsa_changes["mom"]},
        "yearOverYear": {"sa": sa_changes["yoy"], "nsa": nsa_changes["yoy"]}
    }
    
    # Build history
    history = build_history(sa_obs, nsa_obs, 36)
    
    # Compile output
    output = {
        "meta": {
            "generated": datetime.now().isoformat(),
            "source": "FRED (S&P CoreLogic Case-Shiller)",
            "lastUpdate": sa_obs[0]["date"] if sa_obs else None,
            "description": description
        },
        "current": current,
        "changes": changes,
        "history": history
    }
    
    return output


def save_data(data: dict, output_path: str):
    """Save data to JSON file."""
    path = Path(output_path)
    path.parent.mkdir(parents=True, exist_ok=True)
    
    with open(path, "w") as f:
        json.dump(data, f, indent=2)
    
    print(f"Successfully wrote data to {output_path}")


def main():
    base_path = Path(__file__).parent.parent / "public" / "data"
    
    # Fetch San Diego HPI (for main panel)
    sd_data = fetch_home_price_data(
        "SDXRSA", "SDXRNSA", 
        "S&P CoreLogic Case-Shiller CA-San Diego Home Price Index (Jan 2000 = 100)"
    )
    if sd_data:
        save_data(sd_data, str(base_path / "home_price_index.json"))
        print(f"\nSan Diego SA Index: {sd_data['current']['seasonallyAdjusted']['value']}")
        print(f"San Diego YoY Change (SA): {sd_data['changes']['yearOverYear']['sa']}%")
    
    # Fetch US National HPI (for key indicators panel)
    us_data = fetch_home_price_data(
        "CSUSHPISA", "CSUSHPINSA",
        "S&P CoreLogic Case-Shiller U.S. National Home Price Index (Jan 2000 = 100)"
    )
    if us_data:
        save_data(us_data, str(base_path / "us_home_price_index.json"))
        print(f"\nUS National SA Index: {us_data['current']['seasonallyAdjusted']['value']}")
        print(f"US National YoY Change (SA): {us_data['changes']['yearOverYear']['sa']}%")


if __name__ == "__main__":
    main()
