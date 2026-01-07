
import urllib.request
import csv

files = [
    'https://statewidedatabase.org/pub/data/G12/c073/c073_g12_sov_data_by_g12_srprec.csv',
    'https://statewidedatabase.org/pub/data/G16/c073/c073_g16_sov_data_by_g16_srprec.csv',
]

for url in files:
    print(f"\nChecking {url.split('/')[-1]}")
    try:
        req = urllib.request.Request(url, method='GET')
        # Range header to get just first few KB
        req.add_header('Range', 'bytes=0-2048')
        
        with urllib.request.urlopen(req) as response:
            content = response.read().decode('utf-8', errors='ignore')
            lines = content.splitlines()
            headers = lines[0].split(',')
            # Filter for Presidential columns (PRS or similar)
            pres_cols = [h for h in headers if h.startswith('PRS') or h.startswith('US')] # Sometimes USPRE...
            print(f"  Presidential Columns: {pres_cols}")
            
    except Exception as e:
        print(f"  Error: {e}")
