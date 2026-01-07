
import json
from pathlib import Path

path = Path('public/data/voting_data.json')
try:
    with open(path, 'r') as f:
        data = json.load(f)
        
    e12 = data.get('elections', {}).get('2012')
    if not e12:
        print("MISSING 2012 KEY")
    else:
        print("2012 FOUND")
        print(f"Total Votes: {e12.get('total_votes')}")
        print(f"Candidates: {list(e12.get('candidates', {}).keys())}")
        print(f"City Count: {len(e12.get('by_city', {}))}")
        print(f"Zip Count: {len(e12.get('by_zipcode', {}))}")
        
    e16 = data.get('elections', {}).get('2016')
    if not e16:
        print("MISSING 2016 KEY")
    else:
        print("2016 FOUND")
        print(f"Total Votes: {e16.get('total_votes')}")
        print(f"Candidates: {list(e16.get('candidates', {}).keys())}")
        
except Exception as e:
    print(f"ERROR: {e}")
