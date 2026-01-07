
import urllib.request
import urllib.error

base_url = 'https://statewidedatabase.org/pub/data/G24/c073/'
candidates = [
    'c073_g24_block_assignment_by_srprec.csv',
    'c073_g24_block_assignment.csv',
    'c073_g24_blk_map.csv',
    'c073_g24_srprec_block.csv',
    'c073_g24_sov_data_by_g24_srprec.csv' # Known good one to verify connectivity
]

print(f"Checking URLs in {base_url}")

for f in candidates:
    url = base_url + f
    try:
        with urllib.request.urlopen(url) as response:
            print(f"[FOUND] {f} - {response.getcode()}")
    except urllib.error.HTTPError as e:
        print(f"[MISSING] {f} - {e.code}")
    except Exception as e:
        print(f"[ERROR] {f} - {e}")
