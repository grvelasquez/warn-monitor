
import urllib.request
import urllib.error

# Patterns usually: c073_gYY_sov_data_by_gYY_srprec.csv and c073_gYY_sr_blk_map.csv
years = ['G12', 'G16']
base_pattern = "https://statewidedatabase.org/pub/data/{}/c073/"

files_to_check = [
    "c073_{}_sov_data_by_{}_srprec.csv",
    "c073_{}_sr_blk_map.csv"
]

print("Checking Historical Data URLs...")

for y in years:
    yy = y.lower() # g16 -> c073_g16...
    base = base_pattern.format(y)
    print(f"\nChecking {y}:")
    for f_pat in files_to_check:
        fname = f_pat.format(yy, yy).replace('__', '_') # handle single replacement case if any
        # actually for map: c073_g16_sr_blk_map.csv -> simple format
        # for sov: c073_g16_sov_data_by_g16_srprec.csv
        
        # Correction for loop
        if 'blk_map' in f_pat:
            fname = f"c073_{yy}_sr_blk_map.csv"
        else:
            fname = f"c073_{yy}_sov_data_by_{yy}_srprec.csv"
            
        url = base + fname
        try:
            req = urllib.request.Request(url, method='HEAD')
            with urllib.request.urlopen(req) as response:
                print(f"[FOUND] {fname}")
        except urllib.error.HTTPError as e:
            print(f"[MISSING] {fname} - {e.code}")
        except Exception as e:
            print(f"[ERROR] {fname} - {e}")
