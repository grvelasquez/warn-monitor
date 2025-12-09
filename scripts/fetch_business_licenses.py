#!/usr/bin/env python3
"""
Fetch San Diego Business Tax Certificates from City Open Data Portal
for historical business trends analysis (gentrification indicators)
"""

import json
import requests
from datetime import datetime
from pathlib import Path
from collections import defaultdict

# City of San Diego Open Data API endpoint
# Business Tax Certificates dataset
SD_BUSINESS_API = "https://data.sandiego.gov/api/3/action/datastore_search"
DATASET_ID = "business-tax-certificates"
RESOURCE_ID = "business-certificates"

# Alternative: Direct CSV download
CSV_URL = "https://seshat.datasd.org/business_listings/sd_businesses_active_datasd.csv"

# NAICS codes for gentrification indicators
GENTRIFICATION_NAICS = {
    "coffee_shops": ["722515"],  # Coffee shops
    "fitness": ["713940"],  # Fitness centers
    "breweries": ["312120"],  # Breweries
    "yoga": ["713940", "611699"],  # Yoga/fitness
    "art_galleries": ["453920"],  # Art dealers
    "pet_services": ["812910", "453910"],  # Pet services/stores
    "organic_grocery": ["445110", "445299"],  # Grocery stores
}

# Traditional business NAICS codes
TRADITIONAL_NAICS = {
    "laundry": ["812310"],  # Laundromats
    "fast_food": ["722513"],  # Fast food
    "check_cashing": ["522390"],  # Check cashing
    "auto_repair": ["811111", "811112"],  # Auto repair
    "liquor_stores": ["445310"],  # Liquor stores
}

# Zip codes by San Diego neighborhood
ZIP_NEIGHBORHOODS = {
    "92101": "Downtown",
    "92102": "Golden Hill",
    "92103": "Hillcrest",
    "92104": "North Park",
    "92105": "City Heights",
    "92106": "Point Loma",
    "92107": "Ocean Beach",
    "92108": "Mission Valley",
    "92109": "Pacific Beach",
    "92110": "Old Town",
    "92111": "Linda Vista",
    "92113": "Logan Heights",
    "92115": "College Area",
    "92116": "Normal Heights",
    "92117": "Clairemont",
    "92120": "Grantville",
    "92122": "UTC",
    "92123": "Serra Mesa",
    "92037": "La Jolla",
}


def fetch_business_data_csv():
    """Fetch business data from CSV endpoint."""
    print("Fetching business license data from City of San Diego...")
    
    try:
        response = requests.get(CSV_URL, timeout=60)
        response.raise_for_status()
        
        # Parse CSV
        import csv
        from io import StringIO
        
        reader = csv.DictReader(StringIO(response.text))
        businesses = list(reader)
        
        print(f"  Found {len(businesses)} businesses")
        return businesses
    except Exception as e:
        print(f"  Error fetching CSV: {e}")
        return []


def categorize_business(naics_code, business_name=""):
    """Categorize a business based on NAICS code and name."""
    if not naics_code:
        naics_code = ""
    
    naics_code = str(naics_code)[:6]  # First 6 digits
    name_lower = business_name.lower() if business_name else ""
    
    # Check gentrification indicators
    for category, codes in GENTRIFICATION_NAICS.items():
        if any(naics_code.startswith(code) for code in codes):
            return ("gentrifying", category)
    
    # Check traditional indicators
    for category, codes in TRADITIONAL_NAICS.items():
        if any(naics_code.startswith(code) for code in codes):
            return ("traditional", category)
    
    # Name-based detection for common gentrification indicators
    gentrifying_keywords = ["coffee", "cafe", "yoga", "pilates", "brewery", "taproom", 
                           "gallery", "artisan", "organic", "wellness", "juice", "smoothie",
                           "cowork", "boutique", "vegan", "craft"]
    
    traditional_keywords = ["auto", "tire", "check cash", "pawn", "liquor", "99 cent",
                           "dollar", "laundry", "carniceria", "taqueria"]
    
    for keyword in gentrifying_keywords:
        if keyword in name_lower:
            return ("gentrifying", "keyword_match")
    
    for keyword in traditional_keywords:
        if keyword in name_lower:
            return ("traditional", "keyword_match")
    
    return ("other", "uncategorized")


def analyze_businesses(businesses):
    """Analyze business data for gentrification trends."""
    
    by_zip = defaultdict(lambda: {
        "gentrifying": defaultdict(int),
        "traditional": defaultdict(int),
        "total": 0,
        "gentrificationScore": 0,
    })
    
    by_year = defaultdict(lambda: {
        "gentrifying": 0,
        "traditional": 0,
        "total": 0,
    })
    
    for biz in businesses:
        # Get zip code
        zip_code = str(biz.get("business_zip", "") or biz.get("zip", ""))[:5]
        if not zip_code or zip_code not in ZIP_NEIGHBORHOODS:
            continue
        
        # Get NAICS and name
        naics = biz.get("naics", "") or biz.get("naics_code", "") or ""
        name = biz.get("dba_name", "") or biz.get("business_name", "") or ""
        
        # Get year
        start_date = biz.get("account_start_date", "") or biz.get("start_date", "")
        if start_date:
            try:
                year = int(start_date[:4])
            except:
                year = None
        else:
            year = None
        
        # Categorize
        biz_type, category = categorize_business(naics, name)
        
        # Update zip stats
        by_zip[zip_code][biz_type][category] += 1
        by_zip[zip_code]["total"] += 1
        
        # Update year stats (last 10 years)
        if year and year >= 2015:
            by_year[year][biz_type] += 1
            by_year[year]["total"] += 1
    
    # Calculate gentrification scores by zip
    for zip_code, data in by_zip.items():
        gen_count = sum(data["gentrifying"].values())
        trad_count = sum(data["traditional"].values())
        total = gen_count + trad_count
        
        if total > 0:
            data["gentrificationScore"] = round(gen_count / total, 2)
    
    return dict(by_zip), dict(by_year)


def build_output(by_zip, by_year):
    """Build the final JSON output."""
    
    # Convert to neighborhood format
    neighborhoods = []
    for zip_code, data in by_zip.items():
        if zip_code in ZIP_NEIGHBORHOODS:
            neighborhoods.append({
                "zip": zip_code,
                "name": ZIP_NEIGHBORHOODS[zip_code],
                "gentrifying": dict(data["gentrifying"]),
                "traditional": dict(data["traditional"]),
                "total": data["total"],
                "gentrificationScore": data["gentrificationScore"],
            })
    
    # Sort by score
    neighborhoods.sort(key=lambda x: x["gentrificationScore"], reverse=True)
    
    # Build year trend data
    years = []
    for year in sorted(by_year.keys()):
        data = by_year[year]
        total = data["gentrifying"] + data["traditional"]
        years.append({
            "year": year,
            "gentrifying": data["gentrifying"],
            "traditional": data["traditional"],
            "total": data["total"],
            "gentrificationRatio": round(data["gentrifying"] / total, 2) if total > 0 else 0,
        })
    
    return {
        "meta": {
            "generated": datetime.now().isoformat(),
            "source": "City of San Diego Business Tax Certificates",
            "neighborhoods_count": len(neighborhoods),
        },
        "neighborhoods": neighborhoods,
        "yearlyTrend": years,
        "topGentrifying": [n["name"] for n in neighborhoods[:5]],
        "lowestGentrifying": [n["name"] for n in neighborhoods[-3:] if n["gentrificationScore"] < 0.5],
    }


def main():
    output_path = Path(__file__).parent.parent / "public" / "data" / "business_licenses.json"
    
    # Fetch data
    businesses = fetch_business_data_csv()
    
    if not businesses:
        print("No data fetched, creating placeholder")
        # Create placeholder with mock data structure
        output = {
            "meta": {
                "generated": datetime.now().isoformat(),
                "source": "City of San Diego Business Tax Certificates",
                "neighborhoods_count": 0,
                "note": "Live data fetch failed, using placeholder"
            },
            "neighborhoods": [],
            "yearlyTrend": [],
        }
    else:
        # Analyze
        by_zip, by_year = analyze_businesses(businesses)
        
        # Build output
        output = build_output(by_zip, by_year)
    
    # Save
    output_path.parent.mkdir(parents=True, exist_ok=True)
    with open(output_path, "w") as f:
        json.dump(output, f, indent=2)
    
    print(f"\nSaved to {output_path}")


if __name__ == "__main__":
    main()
