
import urllib.request
import urllib.error

# California Tracts
url = 'https://www2.census.gov/geo/docs/maps-data/data/gazetteer/2020_Gazetteer/2020_gaz_tracts_06.txt'

print(f"Checking {url}")
try:
    with urllib.request.urlopen(url) as response:
        print(f"[FOUND] {url} - {response.getcode()}")
        # Check header
        content = response.read(200).decode('utf-8')
        print(f"Header: {content.splitlines()[0]}")
except Exception as e:
    print(f"[ERROR] {e}")
