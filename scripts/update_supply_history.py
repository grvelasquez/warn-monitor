
import json
from pathlib import Path
from datetime import datetime
import argparse

def calculate_changes(observations: list) -> dict:
    """Calculate year-over-year changes."""
    if len(observations) < 13:
        return {"yoy": 0.0}
    
    current = observations[-1]["value"]
    previous_year = observations[-13]["value"]
    
    yoy = round(((current - previous_year) / previous_year) * 100, 2) if previous_year else 0.0
    
    return {"yoy": yoy, "current_value": current, "last_date": observations[-1]["date"]}

def main():
    parser = argparse.ArgumentParser(description='Add new monthly supply data to history.')
    parser.add_argument('date', help='Date (YYYY-MM-DD)')
    parser.add_argument('value', type=float, help='Active Listing Count')
    
    args = parser.parse_args()
    
    base_path = Path(__file__).parent.parent / "public" / "data"
    history_path = base_path / "supply_history.json"
    
    if not history_path.exists():
        print(f"Error: {history_path} not found.")
        return

    with open(history_path, 'r') as f:
        data = json.load(f)
    
    history = data.get("history", [])
    
    # Check if date already exists
    existing = next((item for item in history if item["date"] == args.date), None)
    if existing:
        print(f"Updating existing record for {args.date}: {existing['value']} -> {args.value}")
        existing["value"] = args.value
    else:
        print(f"Adding new record: {args.date} = {args.value}")
        history.append({"date": args.date, "value": args.value})
        # Sort by date
        history.sort(key=lambda x: x["date"])
    
    # Update stats
    stats = calculate_changes(history)
    
    data["history"] = history
    data["meta"]["lastUpdate"] = stats["last_date"]
    data["summary"] = {
        "current_value": stats["current_value"],
        "yoy_change": stats["yoy"]
    }
    
    with open(history_path, 'w') as f:
        json.dump(data, f, indent=2)
        
    print(f"Saved to {history_path}")
    print(f"New Summary: {data['summary']}")

if __name__ == "__main__":
    main()
