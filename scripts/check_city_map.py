
import urllib.request
import csv

url = 'https://statewidedatabase.org/pub/data/G24/c073/c073_g24_srprec_to_city.csv'
print(f"Checking {url}")
try:
    with urllib.request.urlopen(url) as response:
        content = response.read().decode('utf-8')
        reader = csv.reader(content.splitlines())
        headers = next(reader)
        print(f"Headers: {headers}")
        # Print first few rows to see content
        for i, row in enumerate(reader):
            if i < 3:
                print(f"Row {i}: {row}")
            else:
                break
except Exception as e:
    print(f"Error: {e}")
