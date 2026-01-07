
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
        req.add_header('Range', 'bytes=0-4096') # Larger chunk
        
        with urllib.request.urlopen(req) as response:
            content = response.read().decode('utf-8', errors='ignore')
            lines = content.splitlines()
            headers = lines[0].split(',')
            print(f"  All Headers: {headers[:20]} ... (total {len(headers)})") 
            # Print headers that might contain 'PRE' or 'US' or candidate names?
            # Actually just print the first 50 headers, they usually put races early
            print(f"  First 50: {headers[:50]}")
            
    except Exception as e:
        print(f"  Error: {e}")
