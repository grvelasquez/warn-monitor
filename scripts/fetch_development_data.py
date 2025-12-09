#!/usr/bin/env python3
"""
Fetch San Diego Building Permits from City and County APIs
- City of San Diego: ArcGIS REST Service
- County of San Diego: OData API
"""

import json
import requests
from datetime import datetime, timedelta
from pathlib import Path
from collections import defaultdict

# API Endpoints
COUNTY_API = "https://opendata.arcgis.com/api/v3/datasets/d60e1d4f21ef4e4488a9e437f4ed33f4_0/downloads/data"
CITY_PERMITS_API = "https://services1.arcgis.com/Ezd4pnB7bJIKxLIA/arcgis/rest/services/DSD_Permits/FeatureServer/0/query"

# Region mapping for zip codes
ZIP_TO_REGION = {
    # Coastal
    "92037": "Coastal", "92014": "Coastal", "92075": "Coastal", "92024": "Coastal",
    "92007": "Coastal", "92008": "Coastal", "92109": "Coastal", "92107": "Coastal",
    "92106": "Coastal", "92118": "Coastal", "92054": "Coastal", "92083": "Coastal",
    # Urban San Diego
    "92101": "Urban San Diego", "92102": "Urban San Diego", "92103": "Urban San Diego",
    "92104": "Urban San Diego", "92105": "Urban San Diego", "92108": "Urban San Diego",
    "92115": "Urban San Diego", "92116": "Urban San Diego", "92110": "Urban San Diego",
    # Central San Diego
    "92111": "Central San Diego", "92117": "Central San Diego", "92122": "Central San Diego",
    "92123": "Central San Diego", "92124": "Central San Diego", "92126": "Central San Diego",
    "92127": "Central San Diego", "92128": "Central San Diego", "92129": "Central San Diego",
    "92130": "Central San Diego", "92131": "Central San Diego",
    # North County Inland
    "92025": "North County Inland", "92026": "North County Inland", "92027": "North County Inland",
    "92028": "North County Inland", "92029": "North County Inland", "92064": "North County Inland",
    "92065": "North County Inland", "92069": "North County Inland", "92078": "North County Inland",
    "92082": "North County Inland", "92084": "North County Inland",
    # East County
    "91901": "East County", "91902": "East County", "91905": "East County",
    "91916": "East County", "91931": "East County", "91935": "East County",
    "91941": "East County", "91942": "East County", "91945": "East County",
    "91977": "East County", "91978": "East County", "92019": "East County",
    "92020": "East County", "92021": "East County", "92040": "East County",
    "92071": "East County", "92119": "East County", "92120": "East County",
    # South County
    "91902": "South County", "91910": "South County", "91911": "South County",
    "91913": "South County", "91914": "South County", "91915": "South County",
    "91932": "South County", "91950": "South County", "92113": "South County",
    "92154": "South County", "92173": "South County",
}

def get_region(zipcode):
    """Get region from zip code."""
    if zipcode:
        zip5 = str(zipcode)[:5]
        return ZIP_TO_REGION.get(zip5, "Other")
    return "Other"

def fetch_city_permits():
    """Fetch permits from City of San Diego ArcGIS service."""
    print("Fetching City of San Diego permits...")
    
    # City of San Diego DSD Permits MapServer
    api_url = "https://gis.sandiego.gov/arcgis/rest/services/DoIT_Public/DSD_Permits/MapServer/0/query"
    
    params = {
        "where": "1=1",  # Get all records
        "outFields": "*",
        "returnGeometry": "false",
        "f": "json",
        "resultRecordCount": 2000,
        "orderByFields": "IssueDate DESC",
    }
    
    try:
        response = requests.get(api_url, params=params, timeout=60)
        response.raise_for_status()
        data = response.json()
        
        features = data.get("features", [])
        print(f"  Found {len(features)} City permits")
        
        permits = []
        for f in features:
            attrs = f.get("attributes", {})
            permits.append({
                "source": "City",
                "permit_type": attrs.get("PermitType", "") or attrs.get("PERMIT_TYPE", "") or "",
                "status": attrs.get("Status", "") or attrs.get("STATUS", "") or "",
                "address": attrs.get("Address", "") or attrs.get("ADDRESS", "") or attrs.get("StreetAddress", "") or "",
                "zipcode": str(attrs.get("ZipCode", "") or attrs.get("ZIP_CODE", "") or attrs.get("Zip", "") or "")[:5],
                "issue_date": attrs.get("IssueDate") or attrs.get("ISSUE_DATE"),
                "valuation": attrs.get("Valuation", 0) or attrs.get("VALUATION", 0) or 0,
                "description": attrs.get("Description", "") or attrs.get("DESCRIPTION", "") or "",
            })
        return permits
    except Exception as e:
        print(f"  Error fetching City permits: {e}")
        return []

def fetch_county_permits():
    """Fetch permits from County of San Diego OData API."""
    print("Fetching County of San Diego permits...")
    
    # County uses OData - try direct query
    api_url = "https://services1.arcgis.com/wQn2v2M9mV9n8k6F/arcgis/rest/services/Building_Permits_and_Inspections_Public_View/FeatureServer/0/query"
    
    one_year_ago = datetime.now() - timedelta(days=365)
    date_filter = one_year_ago.strftime("%Y-%m-%d")
    
    params = {
        "where": f"ISSUED_DATE >= DATE '{date_filter}'",
        "outFields": "*",
        "returnGeometry": "false",
        "f": "json",
        "resultRecordCount": 5000,
    }
    
    try:
        response = requests.get(api_url, params=params, timeout=60)
        response.raise_for_status()
        data = response.json()
        
        features = data.get("features", [])
        print(f"  Found {len(features)} County permits")
        
        permits = []
        for f in features:
            attrs = f.get("attributes", {})
            permits.append({
                "source": "County",
                "permit_type": attrs.get("PERMIT_TYPE", "") or attrs.get("TYPE", ""),
                "status": attrs.get("STATUS", ""),
                "address": attrs.get("SITE_ADDRESS", "") or attrs.get("ADDRESS", ""),
                "zipcode": str(attrs.get("SITE_ZIP", "") or attrs.get("ZIP", ""))[:5],
                "issue_date": attrs.get("ISSUED_DATE"),
                "valuation": attrs.get("VALUATION", 0) or 0,
                "description": attrs.get("DESCRIPTION", ""),
            })
        return permits
    except Exception as e:
        print(f"  Error fetching County permits: {e}")
        return []

def deduplicate_permits(city_permits, county_permits):
    """Remove duplicates by address+zipcode key. City takes priority."""
    seen = set()
    unique = []
    
    # City permits take priority (processed first)
    for p in city_permits:
        key = f"{p['address'].lower().strip()}|{p['zipcode']}"
        if key and key not in seen:
            seen.add(key)
            unique.append(p)
    
    # Add county permits that don't duplicate city
    for p in county_permits:
        key = f"{p['address'].lower().strip()}|{p['zipcode']}"
        if key and key not in seen:
            seen.add(key)
            unique.append(p)
    
    removed = len(city_permits) + len(county_permits) - len(unique)
    if removed > 0:
        print(f"  Removed {removed} duplicate permits")
    
    return unique

def categorize_permit(permit_type, description):
    """Categorize permit into standard types."""
    text = f"{permit_type} {description}".lower()
    
    if any(x in text for x in ["single family", "sfr", "sfd", "detached"]):
        return "Single Family"
    elif any(x in text for x in ["multi", "apartment", "condo", "townhome", "duplex", "triplex"]):
        return "Multi-Family"
    elif any(x in text for x in ["mixed use", "mixed-use"]):
        return "Mixed Use"
    elif any(x in text for x in ["commercial", "office", "retail", "restaurant", "hotel"]):
        return "Commercial"
    elif any(x in text for x in ["remodel", "renovation", "alteration", "addition", "repair"]):
        return "Renovation"
    elif any(x in text for x in ["demo", "demolition"]):
        return "Demolition"
    else:
        return "Other"

def aggregate_permits(permits):
    """Aggregate permits into summary statistics."""
    by_region = defaultdict(lambda: {"permits": 0, "value": 0, "units": 0})
    by_type = defaultdict(int)
    total_value = 0
    
    for p in permits:
        region = get_region(p["zipcode"])
        category = categorize_permit(p["permit_type"], p["description"])
        value = p["valuation"] if p["valuation"] else 0
        
        by_region[region]["permits"] += 1
        by_region[region]["value"] += value
        
        # Estimate units (rough - 1 per permit for residential)
        if category in ["Single Family", "Multi-Family"]:
            by_region[region]["units"] += 1
        
        by_type[category] += 1
        total_value += value
    
    return {
        "by_region": dict(by_region),
        "by_type": dict(by_type),
        "total_value": total_value,
    }

def build_output(city_permits, county_permits):
    """Build the final JSON output."""
    # Deduplicate permits (City takes priority)
    all_permits = deduplicate_permits(city_permits, county_permits)
    
    if not all_permits:
        print("No permits fetched, using fallback data")
        return None
    
    aggregated = aggregate_permits(all_permits)
    
    # Build region data for chart
    regions = []
    for region in ["Coastal", "Urban San Diego", "Central San Diego", "North County Inland", "East County", "South County"]:
        data = aggregated["by_region"].get(region, {"permits": 0, "value": 0, "units": 0})
        regions.append({
            "region": region,
            "permits": data["permits"],
            "value": round(data["value"] / 1000000, 1),  # In millions
            "units": data["units"],
        })
    
    # Build type data for pie chart
    type_colors = {
        "Single Family": "#14b8a6",
        "Multi-Family": "#3b82f6",
        "Mixed Use": "#a855f7",
        "Commercial": "#f59e0b",
        "Renovation": "#6366f1",
        "Demolition": "#ef4444",
        "Other": "#64748b",
    }
    
    types = []
    for ptype, count in sorted(aggregated["by_type"].items(), key=lambda x: -x[1]):
        types.append({
            "type": ptype,
            "count": count,
            "color": type_colors.get(ptype, "#64748b"),
        })
    
    output = {
        "meta": {
            "generated": datetime.now().isoformat(),
            "sources": ["City of San Diego DSD", "County of San Diego"],
            "period": "Last 12 months",
            "city_count": len(city_permits),
            "county_count": len(county_permits),
        },
        "summary": {
            "totalPermits": len(all_permits),
            "totalValue": round(aggregated["total_value"] / 1000000, 1),  # In millions
            "residentialUnits": sum(r.get("units", 0) for r in aggregated["by_region"].values()),
        },
        "permitsByRegion": regions,
        "permitsByType": types[:7],  # Top 7 types
    }
    
    return output

def save_data(data, output_path):
    """Save data to JSON file."""
    path = Path(output_path)
    path.parent.mkdir(parents=True, exist_ok=True)
    
    with open(path, "w") as f:
        json.dump(data, f, indent=2)
    
    print(f"Successfully wrote data to {output_path}")

def main():
    output_path = Path(__file__).parent.parent / "public" / "data" / "development_data.json"
    
    # Fetch from both sources
    city_permits = fetch_city_permits()
    county_permits = fetch_county_permits()
    
    # Build output
    data = build_output(city_permits, county_permits)
    
    if data:
        save_data(data, str(output_path))
        print(f"\nTotal permits: {data['summary']['totalPermits']}")
        print(f"City: {data['meta']['city_count']}, County: {data['meta']['county_count']}")
    else:
        print("Failed to fetch permit data")

if __name__ == "__main__":
    main()
