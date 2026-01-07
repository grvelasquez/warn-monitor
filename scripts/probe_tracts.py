
import urllib.request
import urllib.error

base_url = 'https://www2.census.gov/geo/docs/maps-data/data/rel/2020/zcta520/'
candidates = [
    'tab20_zcta520_tract20_natl.txt',
    'tab20_zcta520_tract20_natl.zip', # ZIP preferred for size
    'tab20_zcta520_tabblock20_natl.zip' # Re-check block zip
]

print(f"Checking URLs in {base_url}")

for f in candidates:
    url = base_url + f
    try:
        req = urllib.request.Request(url, method='HEAD')
        with urllib.request.urlopen(req) as response:
            print(f"[FOUND] {f} - {response.getcode()}")
    except urllib.error.HTTPError as e:
        print(f"[MISSING] {f} - {e.code}")
    except Exception as e:
        print(f"[ERROR] {f} - {e}")
