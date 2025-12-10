#!/usr/bin/env python3
"""
Fetch San Diego neighborhood business data from Yelp Fusion API.
This provides real-time business counts for popular neighborhoods.

To use:
1. Get a Yelp API key from https://www.yelp.com/developers/v3/manage_app
2. Set environment variable: YELP_API_KEY=your_key_here
3. Run: python scripts/fetch_yelp_data.py

Output: public/data/yelp_snapshot.json
"""

import json
import os
import requests
from datetime import datetime
from pathlib import Path
from time import sleep

# Yelp Fusion API endpoint
YELP_API_BASE = "https://api.yelp.com/v3/businesses/search"

# Popular San Diego neighborhoods with coordinates
NEIGHBORHOODS = {
    "Downtown (Gaslamp)": {"lat": 32.7116, "lon": -117.1603, "location": "Gaslamp Quarter, San Diego, CA"},
    "East Village": {"lat": 32.7134, "lon": -117.1502, "location": "East Village, San Diego, CA"},
    "Little Italy": {"lat": 32.7242, "lon": -117.1680, "location": "Little Italy, San Diego, CA"},
    "North Park": {"lat": 32.7486, "lon": -117.1289, "location": "North Park, San Diego, CA"},
    "Hillcrest": {"lat": 32.7480, "lon": -117.1617, "location": "Hillcrest, San Diego, CA"},
    "La Jolla": {"lat": 32.8473, "lon": -117.2713, "location": "La Jolla, CA"},
    "Pacific Beach": {"lat": 32.7997, "lon": -117.2359, "location": "Pacific Beach, San Diego, CA"},
    "Normal Heights": {"lat": 32.7651, "lon": -117.0981, "location": "Normal Heights, San Diego, CA"},
    "Del Mar": {"lat": 32.9595, "lon": -117.2653, "location": "Del Mar, CA"},
    "Ocean Beach": {"lat": 32.7499, "lon": -117.2494, "location": "Ocean Beach, San Diego, CA"},
    "Coronado": {"lat": 32.6859, "lon": -117.1831, "location": "Coronado, CA"},
    "South Park": {"lat": 32.7270, "lon": -117.1275, "location": "South Park, San Diego, CA"},
    "University Heights": {"lat": 32.7651, "lon": -117.1281, "location": "University Heights, San Diego, CA"},
    "Kensington": {"lat": 32.7651, "lon": -117.0981, "location": "Kensington, San Diego, CA"},
    "Mission Hills": {"lat": 32.7516, "lon": -117.1772, "location": "Mission Hills, San Diego, CA"},
}

# Business categories to track (Yelp category aliases)
CATEGORIES = {
    "restaurants": {"alias": "restaurants", "label": "Restaurants", "icon": "🍽️"},
    "bars": {"alias": "bars", "label": "Bars/Nightlife", "icon": "🍸"},
    "breweries": {"alias": "breweries", "label": "Breweries", "icon": "🍺"},
    "coffee": {"alias": "coffee", "label": "Coffee Shops", "icon": "☕"},
    "hotels": {"alias": "hotels", "label": "Hotels", "icon": "🏨"},
    "shopping": {"alias": "shopping", "label": "Retail/Shopping", "icon": "🛍️"},
    "arts": {"alias": "galleries", "label": "Art Galleries", "icon": "🎨"},
    "fitness": {"alias": "gyms,yoga", "label": "Fitness/Yoga", "icon": "🧘"},
}


def get_api_key():
    """Get Yelp API key from environment."""
    api_key = os.environ.get("YELP_API_KEY")
    if not api_key:
        print("ERROR: YELP_API_KEY environment variable not set")
        print("Get a free API key from: https://www.yelp.com/developers/v3/manage_app")
        return None
    return api_key


def fetch_business_count(api_key, location, category_alias):
    """Fetch business count for a category in a location."""
    headers = {"Authorization": f"Bearer {api_key}"}
    params = {
        "location": location,
        "categories": category_alias,
        "limit": 1,  # We only need the total count
        "radius": 2000,  # 2km radius
    }
    
    try:
        response = requests.get(YELP_API_BASE, headers=headers, params=params, timeout=10)
        response.raise_for_status()
        data = response.json()
        return data.get("total", 0)
    except requests.exceptions.HTTPError as e:
        if e.response.status_code == 429:
            print(f"    Rate limited, waiting 5 seconds...")
            sleep(5)
            return fetch_business_count(api_key, location, category_alias)
        print(f"    Error: {e}")
        return 0
    except Exception as e:
        print(f"    Error fetching {category_alias}: {e}")
        return 0


def fetch_neighborhood_data(api_key, name, config):
    """Fetch all category counts for a neighborhood."""
    print(f"  Fetching {name}...")
    
    result = {
        "name": name,
        "location": config["location"],
        "coordinates": {"lat": config["lat"], "lon": config["lon"]},
        "categories": {},
        "total_businesses": 0,
    }
    
    for cat_key, cat_config in CATEGORIES.items():
        count = fetch_business_count(api_key, config["location"], cat_config["alias"])
        result["categories"][cat_key] = {
            "count": count,
            "label": cat_config["label"],
            "icon": cat_config["icon"],
        }
        result["total_businesses"] += count
        sleep(0.2)  # Rate limiting
    
    return result


def calculate_summary(neighborhoods):
    """Calculate summary statistics."""
    totals = {cat: 0 for cat in CATEGORIES.keys()}
    
    for n in neighborhoods:
        for cat_key, cat_data in n.get("categories", {}).items():
            totals[cat_key] += cat_data.get("count", 0)
    
    # Find top neighborhoods by restaurant count
    sorted_by_restaurants = sorted(
        neighborhoods,
        key=lambda x: x.get("categories", {}).get("restaurants", {}).get("count", 0),
        reverse=True
    )
    
    return {
        "total_counts": totals,
        "top_dining": [n["name"] for n in sorted_by_restaurants[:5]],
        "neighborhoods_tracked": len(neighborhoods),
    }


def main():
    api_key = get_api_key()
    if not api_key:
        print("\nSkipping Yelp fetch - no API key configured")
        print("Creating placeholder file with instructions...")
        
        # Create placeholder file
        output_path = Path(__file__).parent.parent / "public" / "data" / "yelp_snapshot.json"
        output_path.parent.mkdir(parents=True, exist_ok=True)
        
        placeholder = {
            "meta": {
                "generated": datetime.now().isoformat(),
                "source": "Yelp Fusion API (placeholder)",
                "status": "API key required",
                "instructions": "Set YELP_API_KEY environment variable to enable",
            },
            "neighborhoods": [],
            "summary": {},
        }
        
        with open(output_path, "w") as f:
            json.dump(placeholder, f, indent=2)
        
        print(f"Created placeholder at {output_path}")
        return
    
    print("Fetching Yelp data for San Diego neighborhoods...")
    
    neighborhoods = []
    for name, config in NEIGHBORHOODS.items():
        try:
            data = fetch_neighborhood_data(api_key, name, config)
            neighborhoods.append(data)
        except Exception as e:
            print(f"    Error with {name}: {e}")
            continue
    
    if not neighborhoods:
        print("No data fetched!")
        return
    
    # Calculate summary
    summary = calculate_summary(neighborhoods)
    
    # Build output
    output = {
        "meta": {
            "generated": datetime.now().isoformat(),
            "source": "Yelp Fusion API",
            "neighborhoods_count": len(neighborhoods),
            "categories_tracked": list(CATEGORIES.keys()),
        },
        "summary": summary,
        "neighborhoods": neighborhoods,
    }
    
    # Save to file
    output_path = Path(__file__).parent.parent / "public" / "data" / "yelp_snapshot.json"
    output_path.parent.mkdir(parents=True, exist_ok=True)
    
    with open(output_path, "w") as f:
        json.dump(output, f, indent=2)
    
    print(f"\nSuccessfully saved data to {output_path}")
    print(f"Neighborhoods: {len(neighborhoods)}")
    print(f"Top dining areas: {summary['top_dining']}")


if __name__ == "__main__":
    main()
