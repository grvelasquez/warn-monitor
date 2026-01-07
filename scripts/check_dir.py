
import urllib.request

urls = [
    'https://statewidedatabase.org/pub/data/G24/c073/',
    'https://statewidedatabase.org/pub/data/G20/c073/'
]

for url in urls:
    print(f"checking {url}")
    try:
        with urllib.request.urlopen(url) as response:
            content = response.read().decode('utf-8')
            print(content[:500]) # First 500 chars to see if it's HTML index
    except Exception as e:
        print(f"Error: {e}")
