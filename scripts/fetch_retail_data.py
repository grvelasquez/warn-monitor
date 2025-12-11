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
    # === SOUTH COUNTY (91xxx) ===
    "91901-Alpine": {"s": 32.82, "w": -116.78, "n": 32.86, "e": -116.72},
    "91902-Bonita": {"s": 32.66, "w": -117.04, "n": 32.70, "e": -116.98},
    "91905-Boulevard": {"s": 32.66, "w": -116.32, "n": 32.72, "e": -116.24},
    "91906-Campo": {"s": 32.60, "w": -116.50, "n": 32.66, "e": -116.42},
    "91910-Chula Vista North": {"s": 32.62, "w": -117.08, "n": 32.66, "e": -117.02},
    "91911-Chula Vista South": {"s": 32.58, "w": -117.10, "n": 32.62, "e": -117.04},
    "91913-Chula Vista Eastlake": {"s": 32.62, "w": -116.98, "n": 32.66, "e": -116.92},
    "91914-Chula Vista NE": {"s": 32.66, "w": -116.98, "n": 32.70, "e": -116.92},
    "91915-Chula Vista SE": {"s": 32.58, "w": -116.98, "n": 32.62, "e": -116.92},
    "91916-Descanso": {"s": 32.84, "w": -116.64, "n": 32.88, "e": -116.58},
    "91917-Dulzura": {"s": 32.62, "w": -116.78, "n": 32.68, "e": -116.72},
    "91931-Guatay": {"s": 32.84, "w": -116.58, "n": 32.88, "e": -116.52},
    "91932-Imperial Beach": {"s": 32.56, "w": -117.14, "n": 32.60, "e": -117.10},
    "91934-Jacumba": {"s": 32.60, "w": -116.22, "n": 32.64, "e": -116.16},
    "91935-Jamul": {"s": 32.70, "w": -116.88, "n": 32.76, "e": -116.82},
    "91941-La Mesa Mount Helix": {"s": 32.76, "w": -117.00, "n": 32.80, "e": -116.94},
    "91942-La Mesa Grossmont": {"s": 32.78, "w": -117.02, "n": 32.82, "e": -116.96},
    "91945-Lemon Grove": {"s": 32.72, "w": -117.04, "n": 32.76, "e": -117.00},
    "91948-Mount Laguna": {"s": 32.86, "w": -116.44, "n": 32.92, "e": -116.38},
    "91950-National City": {"s": 32.65, "w": -117.12, "n": 32.68, "e": -117.08},
    "91962-Pine Valley": {"s": 32.82, "w": -116.56, "n": 32.86, "e": -116.50},
    "91963-Potrero": {"s": 32.58, "w": -116.64, "n": 32.64, "e": -116.58},
    
    # === NORTH COUNTY (92xxx) ===
    "92007-Cardiff": {"s": 33.00, "w": -117.30, "n": 33.02, "e": -117.26},
    "92008-Carlsbad NW": {"s": 33.15, "w": -117.36, "n": 33.18, "e": -117.30},
    "92009-Carlsbad SE": {"s": 33.10, "w": -117.30, "n": 33.14, "e": -117.24},
    "92010-Carlsbad NE": {"s": 33.14, "w": -117.30, "n": 33.18, "e": -117.24},
    "92011-Carlsbad SW": {"s": 33.10, "w": -117.36, "n": 33.14, "e": -117.30},
    "92014-Del Mar": {"s": 32.94, "w": -117.28, "n": 32.98, "e": -117.24},
    "92024-Encinitas": {"s": 33.02, "w": -117.30, "n": 33.08, "e": -117.24},
    "92037-La Jolla": {"s": 32.82, "w": -117.30, "n": 32.87, "e": -117.24},
    "92040-Lakeside": {"s": 32.84, "w": -116.94, "n": 32.88, "e": -116.88},
    "92054-Oceanside South": {"s": 33.18, "w": -117.40, "n": 33.22, "e": -117.34},
    "92056-Oceanside East": {"s": 33.20, "w": -117.32, "n": 33.24, "e": -117.26},
    "92057-Oceanside North": {"s": 33.22, "w": -117.40, "n": 33.26, "e": -117.34},
    "92058-Oceanside Central": {"s": 33.20, "w": -117.40, "n": 33.22, "e": -117.34},
    "92059-Pala": {"s": 33.36, "w": -117.10, "n": 33.40, "e": -117.04},
    "92060-Palomar Mountain": {"s": 33.32, "w": -116.88, "n": 33.38, "e": -116.82},
    "92061-Pauma Valley": {"s": 33.32, "w": -117.00, "n": 33.36, "e": -116.94},
    "92064-Poway": {"s": 32.94, "w": -117.06, "n": 33.00, "e": -116.98},
    "92065-Ramona": {"s": 33.02, "w": -116.90, "n": 33.08, "e": -116.82},
    "92066-Ranchita": {"s": 33.20, "w": -116.56, "n": 33.24, "e": -116.50},
    "92067-Rancho Santa Fe": {"s": 32.98, "w": -117.22, "n": 33.04, "e": -117.16},
    "92069-San Marcos South": {"s": 33.12, "w": -117.18, "n": 33.16, "e": -117.12},
    "92070-Santa Ysabel": {"s": 33.10, "w": -116.70, "n": 33.14, "e": -116.64},
    "92071-Santee": {"s": 32.82, "w": -117.00, "n": 32.88, "e": -116.94},
    "92075-Solana Beach": {"s": 32.98, "w": -117.28, "n": 33.02, "e": -117.24},
    "92078-San Marcos North": {"s": 33.14, "w": -117.18, "n": 33.18, "e": -117.12},
    "92081-Vista South": {"s": 33.18, "w": -117.26, "n": 33.22, "e": -117.20},
    "92082-Valley Center": {"s": 33.20, "w": -117.06, "n": 33.24, "e": -117.00},
    "92083-Vista West": {"s": 33.20, "w": -117.26, "n": 33.24, "e": -117.20},
    "92084-Vista East": {"s": 33.20, "w": -117.20, "n": 33.24, "e": -117.14},
    "92086-Warner Springs": {"s": 33.30, "w": -116.68, "n": 33.36, "e": -116.62},
    "92091-Rancho Santa Fe South": {"s": 32.96, "w": -117.22, "n": 33.00, "e": -117.16},
    
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
