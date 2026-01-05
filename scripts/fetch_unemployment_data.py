#!/usr/bin/env python3
"""
Fetch San Diego Unemployment Data from California EDD Open Data Portal
Uses the Local Area Unemployment Statistics (LAUS) dataset.
"""

import json
import requests
from datetime import datetime
from pathlib import Path

# California Open Data Portal API endpoint for LAUS data
# Resource: Local Area Unemployment Statistics (LAUS)
CA_DATA_PORTAL_URL = "https://data.ca.gov/api/3/action/datastore_search"
LAUS_RESOURCE_ID = "b4bc4656-7866-420f-8d87-4eda4c9996ed"

def fetch_sd_unemployment(limit: int = 36) -> list:
    """Fetch San Diego County unemployment data from CA EDD."""
    params = {
        "resource_id": LAUS_RESOURCE_ID,
        "limit": limit,
        "sort": "Year desc, Month desc",
        "filters": json.dumps({"Area Name": "San Diego County"})
    }
    
    try:
        response = requests.get(CA_DATA_PORTAL_URL, params=params, timeout=30)
        response.raise_for_status()
        data = response.json()
        
        if not data.get("success"):
            print(f"API returned error: {data}")
            return []
        
        records = data.get("result", {}).get("records", [])
        
        # Process records - extract unemployment rate
        clean_records = []
        # Month name to number mapping
        month_map = {
            "January": "01", "February": "02", "March": "03", "April": "04",
            "May": "05", "June": "06", "July": "07", "August": "08",
            "September": "09", "October": "10", "November": "11", "December": "12"
        }
        for record in records:
            year = record.get("Year")
            month_name = record.get("Month")
            unemployment_rate = record.get("Unemployment Rate")
            
            if year and month_name and unemployment_rate:
                # Format date as YYYY-MM
                month_num = month_map.get(month_name, "01")
                date_str = f"{year}-{month_num}"
                clean_records.append({
                    "date": date_str,
                    "value": float(unemployment_rate),
                    "month_name": month_name
                })
        
        return clean_records
    except Exception as e:
        print(f"Error fetching EDD unemployment data: {e}")
        return []

def main():
    print("Fetching San Diego County unemployment data from CA EDD...")
    
    unemployment_data = fetch_sd_unemployment(36)
    
    if not unemployment_data:
        print("Failed to fetch unemployment data from EDD")
        return
    
    # Sort by date (oldest first for charts)
    unemployment_data.sort(key=lambda x: x["date"])
    
    # Build output
    output = {
        "meta": {
            "generated": datetime.now().isoformat(),
            "source": "California EDD - Local Area Unemployment Statistics (LAUS)",
            "area": "San Diego County",
            "lastUpdate": unemployment_data[-1]["date"] if unemployment_data else None,
        },
        "currentRate": unemployment_data[-1]["value"] if unemployment_data else None,
        "history": [
            {
                "date": item["date"],
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
    print(f"Latest data: {output['meta']['lastUpdate']}")
    print(f"Data points: {len(unemployment_data)}")

if __name__ == "__main__":
    main()
