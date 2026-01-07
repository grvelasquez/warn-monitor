
import json

def check_data():
    try:
        with open('src/data/neighborhood_descriptions.json', 'r') as f:
            data = json.load(f)
        
        target_zip = "92101"
        filtered = [d for d in data if d.get('zipCode') == target_zip]
        
        print(f"Found {len(filtered)} entries for {target_zip}")
        for item in filtered:
            print(f"- {item.get('neighborhood')}")

    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    check_data()
