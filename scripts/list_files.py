
import urllib.request
import re

urls = {
    '2024': 'https://statewidedatabase.org/pub/data/G24/c073/',
    '2020': 'https://statewidedatabase.org/pub/data/G20/c073/'
}

for year, url in urls.items():
    print(f"\nFiles for {year}:")
    try:
        with urllib.request.urlopen(url) as response:
            content = response.read().decode('utf-8')
            # Simple regex to find csv links
            files = re.findall(r'href="([^"]+\.csv)"', content)
            for f in files:
                if 'block' in f or 'blk' in f:
                    print(f"  [BLOCK?] {f}")
                else:
                    print(f"  {f}")
                    
            zips = re.findall(r'href="([^"]+\.zip)"', content)
            for z in zips:
                if 'block' in z or 'blk' in z:
                     print(f"  [BLOCK-ZIP?] {z}")
                else:
                     print(f"  {z}")

    except Exception as e:
        print(f"Error: {e}")
