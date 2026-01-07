
import json

def find_missing_snapshots():
    try:
        # Load descriptions
        with open('src/data/neighborhood_descriptions.json', 'r') as f:
            descriptions = json.load(f)
        description_zips = set(str(d.get('zipCode')) for d in descriptions)

        # Load dashboard data
        with open('public/data/sdar_neighborhood_data.json', 'r') as f:
            dashboard_data = json.load(f)
        
        dashboard_zips = []
        if 'neighborhoods' in dashboard_data:
            dashboard_zips = [(n.get('neighborhood'), str(n.get('zip_code'))) for n in dashboard_data['neighborhoods']]
        
        missing = []
        for name, zip_code in dashboard_zips:
            if zip_code not in description_zips:
                missing.append(f"{zip_code} - {name}")
        
        print(f"Total Dashboard Zips: {len(dashboard_zips)}")
        print(f"Total Description Zips: {len(description_zips)}")
        print(f"Missing Snapshots: {len(missing)}")
        print("\nMissing Zip Codes:")
        for m in sorted(missing):
            print(m)

    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    find_missing_snapshots()
