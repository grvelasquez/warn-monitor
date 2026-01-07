
import urllib.request

# Guessing URL structure based on 2020
candidates = [
    'https://www2.census.gov/geo/docs/maps-data/data/gazetteer/2010_Gazetteer/2010_gaz_tracts_06.txt',
    'https://www2.census.gov/geo/docs/maps-data/data/gazetteer/2010_gazetteer/2010_gaz_tracts_06.txt',
    'https://www2.census.gov/geo/docs/maps-data/data/gazetteer/2010_Gazetteer/2010_gaz_tracts_national.txt'
]

print("Checking 2010 Gazetteer...")

for url in candidates:
    print(f"Checking {url}")
    try:
        req = urllib.request.Request(url, method='HEAD')
        with urllib.request.urlopen(req) as response:
            print(f"[FOUND] {url}")
    except Exception as e:
        print(f"[MISSING] {e}")
