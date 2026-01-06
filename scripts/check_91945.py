import json

with open('public/data/sdar_neighborhood_data.json', 'r') as f:
    data = json.load(f)

for n in data['neighborhoods']:
    if n['zip_code'] == '91945':
        print(json.dumps(n, indent=2))
        break
