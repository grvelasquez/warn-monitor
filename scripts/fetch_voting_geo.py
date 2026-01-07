
import csv
import json
import urllib.request
import math
from pathlib import Path
from collections import defaultdict

# Constants
COUNTY_FIPS = "06073" # San Diego
SWDB_BASE = "https://statewidedatabase.org/pub/data"
GAZ_URL = "https://www2.census.gov/geo/docs/maps-data/data/gazetteer/2020_Gazetteer/2020_gaz_tracts_06.txt"

OUTPUT_DIR = Path(__file__).parent.parent / 'public' / 'data'
ZIP_GEOJSON = OUTPUT_DIR / 'sd_zipcodes.json'

def download_csv(url):
    print(f"Downloading {url}...")
    with urllib.request.urlopen(url) as response:
        return list(csv.DictReader(response.read().decode('utf-8').splitlines()))

def parse_gazetteer():
    """Downloads and parses Census Gazetteer for CA Tracts."""
    print("Downloading Gazetteer...")
    tract_centroids = {}
    with urllib.request.urlopen(GAZ_URL) as response:
        # Tab separated
        lines = response.read().decode('utf-8').splitlines()
        headers = lines[0].split('\t')
        # Find indices
        try:
            geoid_idx = [i for i, h in enumerate(headers) if 'GEOID' in h][0]
            lat_idx = [i for i, h in enumerate(headers) if 'INTPTLAT' in h][0]
            lon_idx = [i for i, h in enumerate(headers) if 'INTPTLONG' in h][0]
        except IndexError:
            print("Error parsing Gazetteer headers")
            return {}
            
        for line in lines[1:]:
            parts = line.split('\t')
            if len(parts) <= lon_idx: continue
            geoid = parts[geoid_idx].strip()
            if not geoid.startswith(COUNTY_FIPS): continue
            
            try:
                lat = float(parts[lat_idx].strip())
                lon = float(parts[lon_idx].strip())
                tract_centroids[geoid] = (lon, lat) # GeoJSON usage: Lon, Lat
            except ValueError:
                continue
                
    print(f"Mapped {len(tract_centroids)} SD Tracts.")
    return tract_centroids

def load_zip_polygons():
    """Loads Zip Code polygons from GeoJSON."""
    if not ZIP_GEOJSON.exists():
        print("Zip GeoJSON not found!")
        return {}
        
    with open(ZIP_GEOJSON, 'r') as f:
        data = json.load(f)
        
    zip_polys = {}
    for feature in data['features']:
        zipcode = feature['properties']['ZIPCODE']
        geom = feature['geometry']
        # Handle Polygon and MultiPolygon
        polys = []
        if geom['type'] == 'Polygon':
            polys.append(geom['coordinates'][0]) # Outer ring
        elif geom['type'] == 'MultiPolygon':
            for poly in geom['coordinates']:
                polys.append(poly[0])
        
        zip_polys[zipcode] = polys
        
    return zip_polys

def point_in_polygon(x, y, poly):
    """Ray casting algorithm."""
    n = len(poly)
    inside = False
    p1x, p1y = poly[0]
    for i in range(n + 1):
        p2x, p2y = poly[i % n]
        if y > min(p1y, p2y):
            if y <= max(p1y, p2y):
                if x <= max(p1x, p2x):
                    if p1y != p2y:
                        xinters = (y - p1y) * (p2x - p1x) / (p2y - p1y) + p1x
                    if p1x == p2x or x <= xinters:
                        inside = not inside
        p1x, p1y = p2x, p2y
    return inside

def map_tracts_to_zips(tract_centroids, zip_polys):
    print("Mapping Tracts to Zips...")
    tract_to_zip = {}
    
    for tract, (lon, lat) in tract_centroids.items():
        # Check against all zips (optimization: bounding box check could be added)
        # For ~600 tracts and ~100 zips, brute force is acceptable (~60k ops)
        mapped = False
        for zipcode, polys in zip_polys.items():
            for poly in polys:
                if point_in_polygon(lon, lat, poly):
                    tract_to_zip[tract] = zipcode
                    mapped = True
                    break
            if mapped: break
        
        if not mapped:
            pass # Tract outside defined Zips
            
    print(f"Mapped {len(tract_to_zip)} Tracts to Zips.")
    return tract_to_zip

def normalize_tract_suffix(t):
    # SWDB tract: '20706' -> Need to match Gazetteer '06073020706'
    # Gazetteer has full FIPS.
    # SWDB has suffix. We need to reconstruct full FIPS.
    # '20706' -> '020706'
    t = t.strip()
    # Pad to 6 digits
    while len(t) < 6:
        t = '0' + t
    return f"{COUNTY_FIPS}{t}"

def build_precinct_zip_weights(sr_blk_map, tract_to_zip):
    print("Building Precinct -> Zip weights...")
    prec_zip_counts = defaultdict(lambda: defaultdict(float))
    
    for row in sr_blk_map:
        prec = row.get('srprec')
        tract_suffix = row.get('tract')
        if not prec or not tract_suffix: continue
        
        # We don't have block-to-tract map in this file directly?
        # Column 'tract' is in the file (checked headers earlier).
        # Headers: ['srprec', 'tract', 'block', ... 'pctsrprec']
        
        full_tract = normalize_tract_suffix(tract_suffix)
        zipcode = tract_to_zip.get(full_tract)
        
        try:
            pct = float(row['pctsrprec'])
        except:
            pct = 0.0
            
        if pct <= 0: continue
        
        if zipcode:
            prec_zip_counts[prec][zipcode] += pct
        else:
            prec_zip_counts[prec]['Unknown'] += pct
            
    # Normalize
    prec_weights = {}
    for prec, zips in prec_zip_counts.items():
        total_p = sum(zips.values())
        if total_p > 0:
            prec_weights[prec] = {z: p/total_p for z, p in zips.items()}
            
    return prec_weights

def process_year(year, blk_map_url, sov_url, city_map_url, tract_to_zip, pres_columns):
    print(f"\nProcessing {year}...")
    
    # 1. Block Map
    try:
        sr_blk_map = download_csv(blk_map_url)
    except Exception as e:
        print(f"Failed to download block map: {e}")
        return None
        
    prec_weights = build_precinct_zip_weights(sr_blk_map, tract_to_zip)
    
    # 2. City Map
    city_map = {}
    try:
        city_rows = download_csv(city_map_url)
        for row in city_rows:
            prec = row.get('srprec') or row.get('SRPREC')
            city = row.get('city') or row.get('CITY', 'Unknown')
            if prec: city_map[prec] = city
    except Exception as e:
        print(f"Failed to download city map: {e}")

    # 3. SOV Data
    try:
        sov_data = download_csv(sov_url)
    except Exception as e:
        print(f"Failed to download SOV data: {e}")
        return None
        
    # Aggregation Buckets
    zip_votes = defaultdict(lambda: defaultdict(float))
    zip_meta = defaultdict(lambda: {'precincts': set()})
    
    city_votes = defaultdict(lambda: defaultdict(float))
    
    county_votes = defaultdict(float)
    
    all_precincts = []
    
    for row in sov_data:
        prec = row.get('srprec') or row.get('SRPREC')
        if not prec: continue
        
        # Parse Votes
        prec_candidate_votes = {}
        prec_total = 0
        for col, cand in pres_columns.items():
            try:
                val = float(row.get(col, 0))
            except:
                val = 0
            if val > 0:
                prec_candidate_votes[cand] = val
                prec_total += val
        
        if prec_total == 0: continue

        # County Totals
        for cand, val in prec_candidate_votes.items():
            county_votes[cand] += val
        county_votes['total'] += prec_total
        
        # Precinct List
        all_precincts.append({
            'precinct': prec, 
            'total': round(prec_total),
            'city': city_map.get(prec, 'Unknown'),
            **{c: round(v) for c, v in prec_candidate_votes.items()}
        })

        # City Aggregation
        city = city_map.get(prec, 'Unincorporated') # Default to Unincorporated if missing
        # Some maps use 'Unincorporated' explicitly, others might not map it?
        # Use city map value, default to Unknown? Or specific default?
        if not city_map.get(prec): city = 'Unincorporated' 
        
        for cand, val in prec_candidate_votes.items():
            city_votes[city][cand] += val
        city_votes[city]['total'] += prec_total

        # Zip Aggregation
        weights = prec_weights.get(prec, {'Unknown': 1.0})
        for z, w in weights.items():
            if w <= 0: continue
            for cand, votes in prec_candidate_votes.items():
                zip_votes[z][cand] += votes * w
            zip_votes[z]['total'] += prec_total * w
            zip_meta[z]['precincts'].add(prec)
            
    # Formatter
    def format_cand_stats(votes_dict, total):
        return {
            cand: {
                'votes': round(val),
                'percentage': round(val / total * 100, 2) if total > 0 else 0
            }
            for cand, val in votes_dict.items() 
            if cand != 'total' and round(val) > 0
        }

    # Output Construction
    output = {
        'year': year,
        'county': 'San Diego',
        'total_votes': round(county_votes['total']),
        'num_precincts': len(all_precincts),
        'candidates': format_cand_stats(county_votes, county_votes['total']),
        'precincts': all_precincts, # Include full list for drill down
        'by_city': {},
        'by_zipcode': {}
    }
    
    # Process Cities
    for city, counts in city_votes.items():
        if counts['total'] < 10: continue
        output['by_city'][city] = {
            'total_votes': round(counts['total']),
            'candidates': format_cand_stats(counts, counts['total'])
        }
        
    # Process Zips
    for z, counts in zip_votes.items():
        if z == 'Unknown': continue
        if counts['total'] < 10: continue
        
        output['by_zipcode'][z] = {
            'total_votes': round(counts['total']),
            'candidates': format_cand_stats(counts, counts['total']),
            'precinct_count': len(zip_meta[z]['precincts']),
            'precinct_ids': list(zip_meta[z]['precincts'])
        }
    
    print(f"  Aggregated {len(output['by_city'])} Cities, {len(output['by_zipcode'])} Zips")
    return output

def main():
    # 1. Gazetteer & Zip Polys
    tract_centroids = parse_gazetteer()
    zip_polys = load_zip_polygons()
    if not tract_centroids or not zip_polys: return
    tract_to_zip = map_tracts_to_zips(tract_centroids, zip_polys)
    
    results = {}
    
    # 2024
    results['2024'] = process_year(
        '2024',
        f"{SWDB_BASE}/G24/c073/c073_g24_sr_blk_map.csv",
        f"{SWDB_BASE}/G24/c073/c073_g24_sov_data_by_g24_srprec.csv",
        f"{SWDB_BASE}/G24/c073/c073_g24_srprec_to_city.csv",
        tract_to_zip,
        {'PRSDEM01': 'Harris', 'PRSREP01': 'Trump', 'PRSAIP01': 'Kennedy', 'PRSGRN01': 'Stein', 'PRSLIB01': 'Oliver', 'PRSPAF01': 'De la Cruz'}
    )
    
    # 2020
    results['2020'] = process_year(
        '2020',
        f"{SWDB_BASE}/G20/c073/c073_g20_sr_blk_map.csv",
        f"{SWDB_BASE}/G20/c073/c073_g20_sov_data_by_g20_srprec.csv",
        f"{SWDB_BASE}/G20/c073/c073_g20_srprec_to_city.csv",
        tract_to_zip,
        {'PRSDEM01': 'Biden', 'PRSREP01': 'Trump', 'PRSLIB01': 'Jorgensen', 'PRSGRN01': 'Hawkins', 'PRSAIP01': 'De La Fuente', 'PRSPAF01': 'La Riva'}
    )
    
    # 2016
    results['2016'] = process_year(
        '2016',
        f"{SWDB_BASE}/G16/c073/c073_g16_sr_blk_map.csv",
        f"{SWDB_BASE}/G16/c073/c073_g16_sov_data_by_g16_srprec.csv",
        f"{SWDB_BASE}/G16/c073/c073_g16_srprec_to_city.csv",
        tract_to_zip,
        {'PRSDEM01': 'Clinton', 'PRSREP01': 'Trump', 'PRSLIB01': 'Johnson', 'PRSGRN01': 'Stein', 'PRSPAF01': 'La Riva'}
    )

    # 2012
    results['2012'] = process_year(
        '2012',
        f"{SWDB_BASE}/G12/c073/c073_g12_sr_blk_map.csv",
        f"{SWDB_BASE}/G12/c073/c073_g12_sov_data_by_g12_srprec.csv",
        f"{SWDB_BASE}/G12/c073/c073_g12_srprec_to_city.csv",
        tract_to_zip,
        {'PRSDEM01': 'Obama', 'PRSREP01': 'Romney', 'PRSLIB01': 'Johnson', 'PRSGRN01': 'Stein', 'PRSPAF01': 'Barr', 'PRSAIP01': 'Hoefling'}
    )
    
    # Full overwrite of elections data
    final_data = {
        "source": "California Statewide Database (UC Berkeley)",
        "county": "San Diego",
        "last_updated": "2025-01-07",
        "granularity": "precinct",
        "elections": results
    }
            
    with open(OUTPUT_DIR / 'voting_data.json', 'w') as f:
        json.dump(final_data, f, indent=2)
    print(f"\nUpdated {OUTPUT_DIR / 'voting_data.json'}")

if __name__ == '__main__':
    main()
