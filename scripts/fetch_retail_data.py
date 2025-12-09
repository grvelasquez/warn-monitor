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

# San Diego neighborhoods with approximate bounding boxes
# Organized by region for comprehensive county coverage
SD_NEIGHBORHOODS = {
    # === CENTRAL SAN DIEGO ===
    "Downtown": {"s": 32.70, "w": -117.18, "n": 32.73, "e": -117.14},
    "Gaslamp": {"s": 32.70, "w": -117.17, "n": 32.72, "e": -117.15},
    "Little Italy": {"s": 32.72, "w": -117.17, "n": 32.74, "e": -117.16},
    "Hillcrest": {"s": 32.74, "w": -117.17, "n": 32.76, "e": -117.14},
    "North Park": {"s": 32.74, "w": -117.14, "n": 32.76, "e": -117.11},
    "South Park": {"s": 32.72, "w": -117.13, "n": 32.74, "e": -117.11},
    "Normal Heights": {"s": 32.76, "w": -117.11, "n": 32.78, "e": -117.08},
    "University Heights": {"s": 32.76, "w": -117.14, "n": 32.78, "e": -117.11},
    "Kensington": {"s": 32.76, "w": -117.10, "n": 32.78, "e": -117.08},
    "Mission Valley": {"s": 32.76, "w": -117.17, "n": 32.78, "e": -117.10},
    "Mission Hills": {"s": 32.74, "w": -117.19, "n": 32.76, "e": -117.17},
    "Bankers Hill": {"s": 32.72, "w": -117.17, "n": 32.74, "e": -117.15},
    
    # === COASTAL ===
    "La Jolla": {"s": 32.82, "w": -117.30, "n": 32.87, "e": -117.24},
    "Pacific Beach": {"s": 32.78, "w": -117.26, "n": 32.82, "e": -117.23},
    "Mission Beach": {"s": 32.76, "w": -117.26, "n": 32.78, "e": -117.24},
    "Ocean Beach": {"s": 32.74, "w": -117.26, "n": 32.76, "e": -117.23},
    "Point Loma": {"s": 32.70, "w": -117.26, "n": 32.74, "e": -117.22},
    "Coronado": {"s": 32.66, "w": -117.20, "n": 32.70, "e": -117.16},
    
    # === SOUTH BAY ===
    "Barrio Logan": {"s": 32.68, "w": -117.15, "n": 32.70, "e": -117.12},
    "Logan Heights": {"s": 32.70, "w": -117.13, "n": 32.72, "e": -117.10},
    "National City": {"s": 32.65, "w": -117.12, "n": 32.68, "e": -117.08},
    "Chula Vista": {"s": 32.60, "w": -117.10, "n": 32.66, "e": -117.02},
    "Imperial Beach": {"s": 32.56, "w": -117.14, "n": 32.60, "e": -117.10},
    "San Ysidro": {"s": 32.54, "w": -117.08, "n": 32.58, "e": -117.02},
    
    # === EAST COUNTY ===
    "City Heights": {"s": 32.74, "w": -117.10, "n": 32.76, "e": -117.06},
    "El Cajon": {"s": 32.78, "w": -116.98, "n": 32.82, "e": -116.92},
    "La Mesa": {"s": 32.76, "w": -117.04, "n": 32.80, "e": -116.98},
    "Spring Valley": {"s": 32.72, "w": -117.00, "n": 32.76, "e": -116.94},
    "Santee": {"s": 32.82, "w": -117.00, "n": 32.88, "e": -116.94},
    "Lemon Grove": {"s": 32.72, "w": -117.04, "n": 32.76, "e": -117.00},
    
    # === NORTH COUNTY COASTAL ===
    "Oceanside": {"s": 33.18, "w": -117.42, "n": 33.24, "e": -117.34},
    "Carlsbad": {"s": 33.10, "w": -117.36, "n": 33.18, "e": -117.26},
    "Encinitas": {"s": 33.02, "w": -117.30, "n": 33.08, "e": -117.24},
    "Del Mar": {"s": 32.94, "w": -117.28, "n": 32.98, "e": -117.24},
    "Solana Beach": {"s": 32.98, "w": -117.28, "n": 33.02, "e": -117.24},
    
    # === NORTH COUNTY INLAND ===
    "Escondido": {"s": 33.10, "w": -117.12, "n": 33.16, "e": -117.04},
    "San Marcos": {"s": 33.12, "w": -117.20, "n": 33.16, "e": -117.12},
    "Vista": {"s": 33.18, "w": -117.26, "n": 33.24, "e": -117.18},
    "Poway": {"s": 32.94, "w": -117.06, "n": 33.00, "e": -116.98},
    "Rancho Bernardo": {"s": 33.00, "w": -117.10, "n": 33.04, "e": -117.04},
}

# Gentrification indicator categories
GENTRIFICATION_INDICATORS = {
    "coffee_specialty": {
        "query": 'amenity=cafe',
        "label": "Coffee/Cafes",
        "weight": 0.8,
        "icon": "☕"
    },
    "yoga_fitness": {
        "query": 'leisure=fitness_centre',
        "label": "Fitness/Yoga",
        "weight": 0.9,
        "icon": "🧘"
    },
    "brewery_taproom": {
        "query": 'amenity=pub',
        "label": "Breweries/Pubs",
        "weight": 0.7,
        "icon": "🍺"
    },
    "art_gallery": {
        "query": 'tourism=gallery',
        "label": "Art Galleries",
        "weight": 1.0,
        "icon": "🎨"
    },
    "organic_grocery": {
        "query": 'shop=supermarket',
        "label": "Grocery/Markets",
        "weight": 0.5,
        "icon": "🥗"
    },
    "pet_services": {
        "query": 'shop=pet',
        "label": "Pet Shops",
        "weight": 0.6,
        "icon": "🐕"
    },
    "coworking": {
        "query": 'amenity=coworking_space',
        "label": "Coworking",
        "weight": 1.0,
        "icon": "💼"
    },
}

# Traditional/baseline indicators (for comparison)
TRADITIONAL_INDICATORS = {
    "laundromat": {
        "query": 'shop=laundry',
        "label": "Laundromats",
        "weight": -0.5,
        "icon": "🧺"
    },
    "fast_food": {
        "query": 'amenity=fast_food',
        "label": "Fast Food",
        "weight": -0.3,
        "icon": "🍔"
    },
    "check_cashing": {
        "query": 'amenity=money_transfer',
        "label": "Check Cashing",
        "weight": -0.8,
        "icon": "💵"
    },
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
        "gentrifying": {},
        "traditional": {},
        "gentrificationScore": 0,
    }
    
    gentrifying_total = 0
    traditional_total = 0
    
    # Fetch gentrification indicators
    for key, config in GENTRIFICATION_INDICATORS.items():
        count = fetch_poi_count(config["query"], bbox)
        result["gentrifying"][key] = {
            "count": count,
            "label": config["label"],
            "icon": config["icon"],
        }
        gentrifying_total += count * config["weight"]
    
    # Fetch traditional indicators
    for key, config in TRADITIONAL_INDICATORS.items():
        count = fetch_poi_count(config["query"], bbox)
        result["traditional"][key] = {
            "count": count,
            "label": config["label"],
            "icon": config["icon"],
        }
        traditional_total += count * abs(config["weight"])
    
    # Calculate gentrification score (0-1)
    if gentrifying_total + traditional_total > 0:
        result["gentrificationScore"] = round(
            gentrifying_total / (gentrifying_total + traditional_total + 1), 
            2
        )
    
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
    total_gentrifying = defaultdict(int)
    total_traditional = defaultdict(int)
    
    for n in neighborhoods:
        for key, data in n.get("gentrifying", {}).items():
            total_gentrifying[key] += data["count"]
        for key, data in n.get("traditional", {}).items():
            total_traditional[key] += data["count"]
    
    # Top gentrifying neighborhoods
    sorted_neighborhoods = sorted(
        neighborhoods, 
        key=lambda x: x.get("gentrificationScore", 0), 
        reverse=True
    )
    
    return {
        "totalGentrifying": dict(total_gentrifying),
        "totalTraditional": dict(total_traditional),
        "topGentrifying": [n["name"] for n in sorted_neighborhoods[:5]],
        "lowestGentrifying": [n["name"] for n in sorted_neighborhoods[-3:]],
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
        "indicators": {
            "gentrifying": {k: v["label"] for k, v in GENTRIFICATION_INDICATORS.items()},
            "traditional": {k: v["label"] for k, v in TRADITIONAL_INDICATORS.items()},
        }
    }
    
    # Save to file
    output_path.parent.mkdir(parents=True, exist_ok=True)
    with open(output_path, "w") as f:
        json.dump(output, f, indent=2)
    
    print(f"\nSuccessfully saved data to {output_path}")
    print(f"Neighborhoods: {len(neighborhoods)}")
    print(f"Top gentrifying: {summary['topGentrifying']}")


if __name__ == "__main__":
    main()
