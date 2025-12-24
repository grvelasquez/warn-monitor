import json
import csv
import os

# Data from User Request
METRO_SAN_DIEGO = {
    "zone": "Metro San Diego",
    "mha_code": "CA038",
    "income_e5_with_dep": 7650,
    "income_e5_without_dep": 6750,
    "bah_e5_with_dep": 3987,
    "bah_e5_without_dep": 3132
}

CAMP_PENDLETON = {
    "zone": "Camp Pendleton Area",
    "mha_code": "CA024",
    "income_e5_with_dep": 7580,
    "income_e5_without_dep": 6700,
    "bah_e5_with_dep": 3921,
    "bah_e5_without_dep": 3084
}

# Zip Codes definitely in CA024 based on user input and search
# Oceanside, Fallbrook, Vista, San Onofre, Bonsall
CAMP_PENDLETON_ZIPS = {
    '92054', '92058', '92028', '92057', '92056', 
    '92081', '92083', '92084', '92085', '92003', '92055'
}

def generate_csv():
    # Load all SD zip codes to ensure coverage
    with open('public/data/sd_zipcodes.json', 'r') as f:
        data = json.load(f)
    
    zip_to_city = {}
    for feature in data['features']:
        zip_code = feature['properties']['ZIPCODE']
        city = feature['properties']['NAME']
        zip_to_city[zip_code] = city

    # Add any missing zips mentioned by user that weren't in the GeoJSON
    missing_zips = {
        '92058': 'Oceanside',
        '92003': 'Bonsall',
        '92055': 'Camp Pendleton'
    }
    for z, c in missing_zips.items():
        if z not in zip_to_city:
            zip_to_city[z] = c

    all_zips = sorted(zip_to_city.keys())

    output_path = 'public/data/military_income_floor_2025.csv'
    
    with open(output_path, 'w', newline='') as csvfile:
        fieldnames = [
            'zip_code', 'city', 'zone', 'mha_code', 
            'income_e5_with_dep', 'income_e5_without_dep', 
            'bah_e5_with_dep', 'bah_e5_without_dep'
        ]
        writer = csv.DictWriter(csvfile, fieldnames=fieldnames)
        writer.writeheader()

        for zip_code in all_zips:
            city = zip_to_city[zip_code]
            
            # Use logic: CA024 if in CAMP_PENDLETON_ZIPS, else CA038
            if zip_code in CAMP_PENDLETON_ZIPS:
                config = CAMP_PENDLETON
            else:
                config = METRO_SAN_DIEGO
            
            row = {
                'zip_code': zip_code,
                'city': city,
                'zone': config['zone'],
                'mha_code': config['mha_code'],
                'income_e5_with_dep': config['income_e5_with_dep'],
                'income_e5_without_dep': config['income_e5_without_dep'],
                'bah_e5_with_dep': config['bah_e5_with_dep'],
                'bah_e5_without_dep': config['bah_e5_without_dep']
            }
            writer.writerow(row)

    print(f"Generated {output_path} with {len(all_zips)} rows.")

if __name__ == "__main__":
    generate_csv()
