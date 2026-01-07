
import urllib.request

files = {
    '2012': 'https://statewidedatabase.org/pub/data/G12/c073/c073_g12_sov_data_by_g12_srprec.csv',
    '2016': 'https://statewidedatabase.org/pub/data/G16/c073/c073_g16_sov_data_by_g16_srprec.csv',
}

with open('headers_dump.txt', 'w') as f:
    for year, url in files.items():
        f.write(f"\n=== {year} ===\n")
        try:
            req = urllib.request.Request(url, method='GET')
            req.add_header('Range', 'bytes=0-8192') 
            with urllib.request.urlopen(req) as response:
                content = response.read().decode('utf-8', errors='ignore')
                headers = content.splitlines()[0].split(',')
                f.write(','.join(headers))
        except Exception as e:
            f.write(f"Error: {e}")
