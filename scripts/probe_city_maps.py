
import urllib.request
import urllib.error

years = ['G12', 'G16']
base_pattern = "https://statewidedatabase.org/pub/data/{}/c073/c073_{}_srprec_to_city.csv"

print("Checking City Map URLs...")

for y in years:
    yy = y.lower()
    url = base_pattern.format(y, yy)
    try:
        req = urllib.request.Request(url, method='HEAD')
        with urllib.request.urlopen(req) as response:
            print(f"[FOUND] {url}")
    except urllib.error.HTTPError as e:
        print(f"[MISSING] {url} - {e.code}")
    except Exception as e:
        print(f"[ERROR] {url} - {e}")
