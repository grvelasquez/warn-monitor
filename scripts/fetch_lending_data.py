#!/usr/bin/env python3
"""
FRED Data Fetcher for San Diego Lending Dashboard
Fetches mortgage rates and economic data from Federal Reserve Economic Data API.
"""

import json
import requests
from datetime import datetime, timedelta
from pathlib import Path

# FRED API Configuration
FRED_API_KEY = "a72b02db4318645167d222b3d497ae02"
FRED_BASE_URL = "https://api.stlouisfed.org/fred/series/observations"

# Series to fetch
FRED_SERIES = {
    "MORTGAGE30US": {"name": "30-Year Fixed Rate", "type": "rate"},
    "MORTGAGE15US": {"name": "15-Year Fixed Rate", "type": "rate"},
    "MORTGAGE5US": {"name": "5/1 ARM Rate", "type": "rate"},
    "FEDFUNDS": {"name": "Fed Funds Rate", "type": "rate"},
    "CPIAUCSL": {"name": "CPI (Inflation)", "type": "index"},
}

# San Diego specific series (if available)
SD_SERIES = {
    "CASAND0URN": {"name": "San Diego Unemployment Rate", "type": "rate"},
}

def fetch_fred_series(series_id: str, limit: int = 52) -> list:
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
        # Filter out missing values and convert to proper format
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

def get_rate_change(observations: list) -> float:
    """Calculate week-over-week change from observations."""
    if len(observations) >= 2:
        return round(observations[0]["value"] - observations[1]["value"], 2)
    return 0.0

def build_rate_history(observations: list, limit: int = 12) -> list:
    """Build monthly rate history from weekly observations."""
    monthly = {}
    for obs in observations:
        month_key = obs["date"][:7]  # YYYY-MM
        if month_key not in monthly:
            monthly[month_key] = obs["value"]
    
    # Get last N months
    sorted_months = sorted(monthly.keys(), reverse=True)[:limit]
    sorted_months.reverse()  # Oldest first
    
    return [{"date": m, "rate": monthly[m]} for m in sorted_months]

def fetch_lending_data() -> dict:
    """Fetch all lending data and compile into JSON."""
    print("Fetching FRED data...")
    
    # Fetch main series
    mortgage30 = fetch_fred_series("MORTGAGE30US", 52)
    mortgage15 = fetch_fred_series("MORTGAGE15US", 52)
    mortgage5 = fetch_fred_series("MORTGAGE5US", 52)
    fedfunds = fetch_fred_series("FEDFUNDS", 12)
    
    # San Diego unemployment
    sd_unemployment = fetch_fred_series("CASAND0URN", 12)
    
    # Build current rates
    current_rates = {
        "rate30": mortgage30[0]["value"] if mortgage30 else 6.85,
        "rate15": mortgage15[0]["value"] if mortgage15 else 6.02,
        "rateARM": mortgage5[0]["value"] if mortgage5 else 6.18,
        "fedFunds": fedfunds[0]["value"] if fedfunds else 5.33,
        # Static estimates for these (not in FRED)
        "jumboRate": round((mortgage30[0]["value"] if mortgage30 else 6.85) + 0.27, 2),
        "fhaRate": round((mortgage30[0]["value"] if mortgage30 else 6.85) - 0.40, 2),
        "vaRate": round((mortgage30[0]["value"] if mortgage30 else 6.85) - 0.60, 2),
    }
    
    # Week-over-week changes
    week_change = {
        "rate30": get_rate_change(mortgage30),
        "rate15": get_rate_change(mortgage15),
        "rateARM": get_rate_change(mortgage5),
    }
    
    # Build historical data for charts
    rate_history = []
    monthly_30 = {obs["date"][:7]: obs["value"] for obs in mortgage30}
    monthly_15 = {obs["date"][:7]: obs["value"] for obs in mortgage15}
    monthly_arm = {obs["date"][:7]: obs["value"] for obs in mortgage5}
    
    all_months = sorted(set(monthly_30.keys()) | set(monthly_15.keys()) | set(monthly_arm.keys()))[-12:]
    
    for month in all_months:
        rate_history.append({
            "date": month,
            "rate30": monthly_30.get(month, None),
            "rate15": monthly_15.get(month, None),
            "rateARM": monthly_arm.get(month, None),
        })
    
    # San Diego specific data
    sd_data = {
        "unemploymentRate": sd_unemployment[0]["value"] if sd_unemployment else 4.2,
    }
    
    # 2025 San Diego Loan Limits (static - updated annually by FHFA)
    # SD County is a high-cost area: conforming=$806,500, high-balance/FHA=$1,077,550
    loan_limits = {
        "conforming": 806500,
        "highBalance": 1077550,
        "jumbo": 1077551,
        "fha": 1077550,
    }
    
    # Compile output
    output = {
        "meta": {
            "generated": datetime.now().isoformat(),
            "source": "FRED (Federal Reserve Economic Data)",
            "lastUpdate": mortgage30[0]["date"] if mortgage30 else None,
        },
        "currentRates": current_rates,
        "weekChange": week_change,
        "rateHistory": rate_history,
        "loanLimits": loan_limits,
        "sanDiego": sd_data,
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
    output_path = Path(__file__).parent.parent / "public" / "data" / "lending_data.json"
    
    data = fetch_lending_data()
    save_data(data, str(output_path))
    
    print(f"\nCurrent 30-Year Rate: {data['currentRates']['rate30']}%")
    print(f"Week Change: {data['weekChange']['rate30']}%")

if __name__ == "__main__":
    main()
