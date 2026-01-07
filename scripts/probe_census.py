
import urllib.request
import urllib.error

base_url = 'https://www2.census.gov/geo/docs/maps-data/data/rel/2020/zcta520/'
candidates = [
    'tab20_zcta520_tabblock20_natl.txt',
    'tab20_zcta520_tabblock20_natl.zip',
    'tab20_zcta520_tabblock20_natl.csv',
    'zcta520_tabblock20_natl.txt',
]

print(f"Checking URLs in {base_url}")

# Check directory listing first
try:
    with urllib.request.urlopen(base_url) as response:
        print("Directory index found!")
        print(response.read().decode('utf-8')[:1000])
except Exception as e:
    print(f"No directory index: {e}")

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
