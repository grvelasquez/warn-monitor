
import urllib.request

files = [
    'https://statewidedatabase.org/pub/data/G12/c073/c073_g12_sov_data_by_g12_srprec.csv',
    'https://statewidedatabase.org/pub/data/G16/c073/c073_g16_sov_data_by_g16_srprec.csv',
]

for url in files:
    print(f"\nChecking {url.split('/')[-1]}")
    try:
        req = urllib.request.Request(url, method='GET')
        req.add_header('Range', 'bytes=0-8192') 
        
        with urllib.request.urlopen(req) as response:
            content = response.read().decode('utf-8', errors='ignore')
            lines = content.splitlines()
            headers = lines[0].split(',')
            print(f"  Headers: {headers}")
            
    except Exception as e:
        print(f"  Error: {e}")
