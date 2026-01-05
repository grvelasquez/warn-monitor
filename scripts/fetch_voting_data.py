"""
Fetch and process presidential voting data for San Diego County.
Data source: California Statewide Database (UC Berkeley)

Uses SR (Super Registration) precinct data which maps cleanly to cities.
"""
import csv
import json
import urllib.request
from pathlib import Path
from collections import defaultdict

# San Diego County = c073
DATA_URLS = {
    '2024': {
        'sov': 'https://statewidedatabase.org/pub/data/G24/c073/c073_g24_sov_data_by_g24_srprec.csv',
        'city_map': 'https://statewidedatabase.org/pub/data/G24/c073/c073_g24_srprec_to_city.csv',
    },
    '2020': {
        'sov': 'https://statewidedatabase.org/pub/data/G20/c073/c073_g20_sov_data_by_g20_srprec.csv',
        # 2020 may not have city map, will use 2024 mapping as approximation
    }
}

# Presidential race column prefixes
PRES_COLUMNS_2024 = {
    'PRSDEM01': 'Harris',
    'PRSREP01': 'Trump',
    'PRSAIP01': 'Kennedy',
    'PRSGRN01': 'Stein',
    'PRSLIB01': 'Oliver',
    'PRSPAF01': 'De la Cruz',
}

PRES_COLUMNS_2020 = {
    'PRSDEM01': 'Biden',
    'PRSREP01': 'Trump',
    'PRSLIB01': 'Jorgensen',
    'PRSGRN01': 'Hawkins',
    'PRSAIP01': 'De La Fuente',
    'PRSPAF01': 'La Riva',
}

OUTPUT_DIR = Path(__file__).parent.parent / 'public' / 'data'


def download_csv(url: str) -> list[dict]:
    """Download and parse a CSV file from URL."""
    print(f"  Downloading: {url.split('/')[-1]}")
    with urllib.request.urlopen(url) as response:
        content = response.read().decode('utf-8')
        reader = csv.DictReader(content.splitlines())
        return list(reader)


def safe_int(value) -> int:
    """Convert value to int, treating non-numeric as 0."""
    if value is None or value == '' or value == '***':
        return 0
    try:
        return int(float(value))
    except ValueError:
        return 0


def extract_presidential_data(rows: list[dict], pres_columns: dict, year: str, city_map: dict = None) -> dict:
    """Extract presidential voting data from SOV rows."""
    totals = defaultdict(int)
    precinct_data = []
    city_totals = defaultdict(lambda: defaultdict(int))
    
    for row in rows:
        # Get precinct ID
        precinct_id = row.get('srprec') or row.get('SRPREC') or row.get('precinct', 'unknown')
        city = city_map.get(precinct_id, 'Unincorporated') if city_map else 'Unknown'
        
        precinct_votes = {'precinct': precinct_id, 'city': city}
        precinct_total = 0
        
        for col, candidate in pres_columns.items():
            votes = safe_int(row.get(col, 0))
            totals[candidate] += votes
            precinct_votes[candidate] = votes
            precinct_total += votes
            city_totals[city][candidate] += votes
        
        city_totals[city]['total'] += precinct_total
        precinct_votes['total'] = precinct_total
        if precinct_total > 0:
            precinct_data.append(precinct_votes)
    
    total_votes = sum(totals.values())
    
    # Build city-level results
    cities_data = {}
    for city, votes in city_totals.items():
        city_total = votes['total']
        if city_total > 0:
            cities_data[city] = {
                'total_votes': city_total,
                'candidates': {
                    name: {
                        'votes': votes[name],
                        'percentage': round(votes[name] / city_total * 100, 2)
                    }
                    for name in pres_columns.values() if votes[name] > 0
                }
            }
    
    return {
        'year': year,
        'county': 'San Diego',
        'total_votes': total_votes,
        'num_precincts': len(precinct_data),
        'candidates': {
            name: {
                'votes': votes,
                'percentage': round(votes / total_votes * 100, 2) if total_votes > 0 else 0
            }
            for name, votes in sorted(totals.items(), key=lambda x: -x[1])
        },
        'by_city': dict(sorted(cities_data.items(), key=lambda x: -x[1]['total_votes'])),
        'precincts': precinct_data  # All precincts
    }


def main():
    print("Fetching San Diego County Presidential Voting Data")
    print("=" * 50)
    
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    
    # Download city mapping
    print("\nDownloading city mapping...")
    try:
        city_rows = download_csv(DATA_URLS['2024']['city_map'])
        city_map = {}
        for row in city_rows:
            prec = row.get('srprec') or row.get('SRPREC', '')
            city = row.get('city') or row.get('CITY', 'Unknown')
            city_map[prec] = city
        print(f"  Mapped {len(city_map)} precincts to cities")
    except Exception as e:
        print(f"  Warning: Could not load city mapping: {e}")
        city_map = {}
    
    results = {}
    
    # 2024 data
    print("\n2024 General Election:")
    rows_2024 = download_csv(DATA_URLS['2024']['sov'])
    print(f"  Downloaded {len(rows_2024)} SR precinct records")
    if rows_2024:
        # Show available columns
        cols = list(rows_2024[0].keys())
        pres_cols = [c for c in cols if c.startswith('PRS')]
        print(f"  Presidential columns: {pres_cols}")
    results['2024'] = extract_presidential_data(rows_2024, PRES_COLUMNS_2024, '2024', city_map)
    
    # 2020 data
    print("\n2020 General Election:")
    rows_2020 = download_csv(DATA_URLS['2020']['sov'])
    print(f"  Downloaded {len(rows_2020)} SR precinct records")
    results['2020'] = extract_presidential_data(rows_2020, PRES_COLUMNS_2020, '2020', city_map)
    
    # Save results
    output_file = OUTPUT_DIR / 'voting_data.json'
    with open(output_file, 'w') as f:
        json.dump({
            'source': 'California Statewide Database (UC Berkeley)',
            'county': 'San Diego',
            'last_updated': '2024-12-20',
            'granularity': 'precinct',
            'note': 'Data is at precinct level, aggregated to cities. Can be further aggregated to zip codes using census block mapping.',
            'elections': results
        }, f, indent=2)
    
    print(f"\nSaved to: {output_file}")
    
    # Print summary
    for year, data in results.items():
        print(f"\n{year} Results ({data['num_precincts']} precincts, {data['total_votes']:,} total votes):")
        for candidate, info in list(data['candidates'].items())[:3]:
            print(f"  {candidate}: {info['votes']:,} ({info['percentage']}%)")
        
        print(f"\n  Top 5 cities by votes:")
        for city, city_data in list(data['by_city'].items())[:5]:
            top_candidate = max(city_data['candidates'].items(), key=lambda x: x[1]['votes'])
            print(f"    {city}: {city_data['total_votes']:,} votes ({top_candidate[0]} {top_candidate[1]['percentage']}%)")


if __name__ == '__main__':
    main()
