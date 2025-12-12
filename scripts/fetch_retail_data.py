#!/usr/bin/env python3
"""
Fetch San Diego retail/business data from OpenStreetMap Overpass API
for gentrification indicators (cafes, yoga studios, breweries, etc.)
"""

import json
import requests
from datetime import datetime
from pathlib import Path
from collections import defaultdict

# Overpass API endpoint (no API key required)
OVERPASS_API = "https://overpass-api.de/api/interpreter"

# San Diego County bounding box (approximate)
SD_BBOX = {
    "south": 32.5,
    "west": -117.6,
    "north": 33.5,
    "east": -116.1
}

# San Diego County ZIP codes with bounding boxes (matching SDAR data - 85 zip codes)
# Format: "ZIP-Name": {"s": south, "w": west, "n": north, "e": east}
SD_NEIGHBORHOODS = {
    # === SAN DIEGO CITY (921xx) ===
    "92101-Downtown": {"s": 32.70, "w": -117.17, "n": 32.74, "e": -117.14},
    "92102-Golden Hill South Park": {"s": 32.70, "w": -117.13, "n": 32.74, "e": -117.09},
    "92103-Hillcrest Mission Hills": {"s": 32.74, "w": -117.19, "n": 32.76, "e": -117.14},
    "92104-North Park": {"s": 32.74, "w": -117.14, "n": 32.76, "e": -117.11},
    "92105-City Heights": {"s": 32.74, "w": -117.10, "n": 32.76, "e": -117.06},
    "92106-Point Loma": {"s": 32.70, "w": -117.26, "n": 32.74, "e": -117.22},
    "92107-Ocean Beach": {"s": 32.74, "w": -117.26, "n": 32.76, "e": -117.23},
    "92108-Mission Valley": {"s": 32.76, "w": -117.17, "n": 32.78, "e": -117.10},
    "92109-Pacific Beach Mission Beach": {"s": 32.78, "w": -117.26, "n": 32.82, "e": -117.23},
    "92110-Morena": {"s": 32.76, "w": -117.22, "n": 32.80, "e": -117.18},
    "92111-Linda Vista": {"s": 32.78, "w": -117.17, "n": 32.82, "e": -117.14},
    "92113-Logan Heights": {"s": 32.68, "w": -117.13, "n": 32.72, "e": -117.09},
    "92114-Encanto": {"s": 32.68, "w": -117.08, "n": 32.72, "e": -117.02},
    "92115-College": {"s": 32.76, "w": -117.06, "n": 32.78, "e": -117.02},
    "92116-Kensington Normal Heights": {"s": 32.76, "w": -117.11, "n": 32.78, "e": -117.08},
    "92117-Clairemont": {"s": 32.82, "w": -117.20, "n": 32.86, "e": -117.14},
    "92118-Coronado": {"s": 32.66, "w": -117.20, "n": 32.70, "e": -117.16},
    "92119-San Carlos": {"s": 32.78, "w": -117.02, "n": 32.82, "e": -116.98},
    "92120-Allied Gardens Del Cerro": {"s": 32.78, "w": -117.06, "n": 32.82, "e": -117.02},
    "92121-Sorrento Valley": {"s": 32.88, "w": -117.22, "n": 32.92, "e": -117.18},
    "92122-University City": {"s": 32.86, "w": -117.22, "n": 32.90, "e": -117.18},
    "92123-Serra Mesa": {"s": 32.80, "w": -117.14, "n": 32.82, "e": -117.10},
    "92124-Tierrasanta": {"s": 32.82, "w": -117.10, "n": 32.86, "e": -117.04},
    "92126-Mira Mesa": {"s": 32.90, "w": -117.14, "n": 32.94, "e": -117.08},
    "92127-Rancho Bernardo West": {"s": 33.00, "w": -117.12, "n": 33.04, "e": -117.06},
    "92128-Rancho Bernardo East": {"s": 33.00, "w": -117.06, "n": 33.04, "e": -117.00},
    "92129-Penasquitos": {"s": 32.94, "w": -117.12, "n": 32.98, "e": -117.06},
    "92130-Carmel Valley": {"s": 32.92, "w": -117.24, "n": 32.98, "e": -117.18},
    "92131-Scripps Ranch": {"s": 32.90, "w": -117.10, "n": 32.94, "e": -117.04},
    "92139-Paradise Hills": {"s": 32.66, "w": -117.08, "n": 32.70, "e": -117.02},
    "92154-Nestor Otay Mesa": {"s": 32.55, "w": -117.06, "n": 32.62, "e": -116.98},
    "92173-San Ysidro": {"s": 32.54, "w": -117.08, "n": 32.58, "e": -117.02},
}


# Comprehensive OSM Categories
CATEGORIES = {
    # Food & Drink
    "coffee_specialty": {"query": 'amenity=cafe', "label": "Coffee/Cafes", "icon": "☕"},
    "restaurant": {"query": 'amenity=restaurant', "label": "Restaurants", "icon": "🍽️"},
    "fast_food": {"query": 'amenity=fast_food', "label": "Fast Food", "icon": "🍔"},
    "bar": {"query": 'amenity=bar', "label": "Bars", "icon": "🍸"},
    "brewery_taproom": {"query": 'amenity=pub', "label": "Pubs/Breweries", "icon": "🍺"},
    "ice_cream": {"query": 'amenity=ice_cream', "label": "Ice Cream", "icon": "🍦"},
    
    # Retail & Groceries
    "grocery": {"query": 'shop=supermarket', "label": "Grocery", "icon": "🛒"},
    "organic_grocery": {"query": 'shop=farm', "label": "Farm/Organic", "icon": "🥦"},
    "convenience": {"query": 'shop=convenience', "label": "Convenience", "icon": "🏪"},
    "clothing": {"query": 'shop=clothes', "label": "Clothing", "icon": "👗"},
    "electronics": {"query": 'shop=electronics', "label": "Electronics", "icon": "📱"},
    "pet_shop": {"query": 'shop=pet', "label": "Pet Shops", "icon": "🐕"},
    "bakery": {"query": 'shop=bakery', "label": "Bakeries", "icon": "🥐"},
    
    # Services
    "bank": {"query": 'amenity=bank', "label": "Banks", "icon": "🏦"},
    "atm": {"query": 'amenity=atm', "label": "ATMs", "icon": "🏧"},
    "laundromat": {"query": 'shop=laundry', "label": "Laundromats", "icon": "🧺"},
    "hair_salon": {"query": 'shop=hairdresser', "label": "Hair Salons", "icon": "💇"},
    "car_repair": {"query": 'shop=car_repair', "label": "Auto Repair", "icon": "🔧"},
    "gas_station": {"query": 'amenity=fuel', "label": "Gas Stations", "icon": "⛽"},
    
    # Health & Wellness
    "pharmacy": {"query": 'amenity=pharmacy', "label": "Pharmacies", "icon": "💊"},
    "fitness": {"query": 'leisure=fitness_centre', "label": "Fitness/Yoga", "icon": "🧘"},
    "clinic": {"query": 'amenity=clinic', "label": "Clinics", "icon": "🩺"},
    "dentist": {"query": 'amenity=dentist', "label": "Dentists", "icon": "🦷"},
    
    # Community & Public
    "school": {"query": 'amenity=school', "label": "Schools", "icon": "🏫"},
    "library": {"query": 'amenity=library', "label": "Libraries", "icon": "📚"},
    "park": {"query": 'leisure=park', "label": "Parks", "icon": "🌳"},
    "place_of_worship": {"query": 'amenity=place_of_worship', "label": "Worship", "icon": "⛪"},
    "coworking": {"query": 'amenity=coworking_space', "label": "Coworking", "icon": "💼"},
}


def build_overpass_query(category_query, bbox):
    """Build Overpass QL query for a specific category and bounding box."""
    return f"""
    [out:json][timeout:30];
    (
      node[{category_query}]({bbox['s']},{bbox['w']},{bbox['n']},{bbox['e']});
      way[{category_query}]({bbox['s']},{bbox['w']},{bbox['n']},{bbox['e']});
    );
    out count;
    """


def fetch_poi_count(category_query, bbox, timeout=30):
    """Fetch POI count from Overpass API."""
    query = build_overpass_query(category_query, bbox)
    
    try:
        response = requests.post(
            OVERPASS_API,
            data={"data": query},
            timeout=timeout
        )
        response.raise_for_status()
        data = response.json()
        
        # Extract count from response
        count = data.get("elements", [{}])[0].get("tags", {}).get("total", 0)
        if count == 0 and "elements" in data:
            count = len(data.get("elements", []))
        
        return int(count)
    except Exception as e:
        print(f"  Error fetching {category_query}: {e}")
        return 0


def fetch_neighborhood_data(neighborhood_name, bbox):
    """Fetch all indicator counts for a neighborhood."""
    print(f"  Fetching {neighborhood_name}...")
    
    result = {
        "name": neighborhood_name,
        "categories": {},
        "total_businesses": 0
    }
    
    total = 0
    
    # Fetch all categories
    for key, config in CATEGORIES.items():
        count = fetch_poi_count(config["query"], bbox)
        result["categories"][key] = {
            "count": count,
            "label": config["label"],
            "icon": config["icon"],
        }
        total += count
    
    result["total_businesses"] = total
    return result


def fetch_all_neighborhoods():
    """Fetch data for all neighborhoods."""
    print("Fetching OSM retail data for San Diego neighborhoods...")
    
    neighborhoods = []
    
    for name, bbox in SD_NEIGHBORHOODS.items():
        try:
            data = fetch_neighborhood_data(name, bbox)
            neighborhoods.append(data)
        except Exception as e:
            print(f"  Error with {name}: {e}")
            continue
    
    return neighborhoods


def calculate_county_summary(neighborhoods):
    """Calculate county-wide summary statistics."""
    total_counts = defaultdict(int)
    
    for n in neighborhoods:
        for key, data in n.get("categories", {}).items():
            total_counts[key] += data["count"]
    
    # Top neighborhoods by total business count
    sorted_neighborhoods = sorted(
        neighborhoods, 
        key=lambda x: x.get("total_businesses", 0), 
        reverse=True
    )
    
    return {
        "totalCounts": dict(total_counts),
        "topBusinessDistricts": [n["name"] for n in sorted_neighborhoods[:5]],
    }


def main():
    output_path = Path(__file__).parent.parent / "public" / "data" / "retail_data.json"
    
    # Fetch all neighborhood data
    neighborhoods = fetch_all_neighborhoods()
    
    if not neighborhoods:
        print("No data fetched, exiting")
        return
    
    # Calculate summary
    summary = calculate_county_summary(neighborhoods)
    
    # Build output
    output = {
        "meta": {
            "generated": datetime.now().isoformat(),
            "source": "OpenStreetMap Overpass API",
            "neighborhoods_count": len(neighborhoods),
        },
        "summary": summary,
        "neighborhoods": neighborhoods,
        "categories": {k: v["label"] for k, v in CATEGORIES.items()}
    }
    
    # Save to file
    output_path.parent.mkdir(parents=True, exist_ok=True)
    with open(output_path, "w") as f:
        json.dump(output, f, indent=2)
    
    print(f"\nSuccessfully saved data to {output_path}")
    print(f"Neighborhoods: {len(neighborhoods)}")
    print(f"Top districts: {summary['topBusinessDistricts']}")


if __name__ == "__main__":
    main()
