
import urllib.request
import urllib.error

base_url = 'https://www.huduser.gov/portal/datasets/usps/'
candidates = [
    'TRACT_ZIP_092024.xlsx',
    'TRACT_ZIP_062024.xlsx',
    'TRACT_ZIP_032024.xlsx',
    'TRACT_ZIP_122023.xlsx',
    'TRACT_ZIP_092023.xlsx',
]

print(f"Checking URLs in {base_url}")

for f in candidates:
    url = base_url + f
    try:
        req = urllib.request.Request(url, method='HEAD')
        with urllib.request.urlopen(req) as response:
            print(f"[FOUND] {f} - {response.getcode()}")
            break # Found one!
    except urllib.error.HTTPError as e:
        print(f"[MISSING] {f} - {e.code}")
    except Exception as e:
        print(f"[ERROR] {f} - {e}")
