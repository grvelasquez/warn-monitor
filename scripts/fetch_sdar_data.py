import requests
import datetime
import json
import re
from pathlib import Path
from bs4 import BeautifulSoup

# Base URL patterns for 10K Research reports
# They typically follow: https://sdar.stats.10kresearch.com/docs/mmi/[YYYY-MM]/x/report?src=page
BASE_URL = "https://sdar.stats.10kresearch.com/docs/mmi/{date}/x/report?src=page"

def get_latest_available_report_date():
    """
    Finds the latest available report date by checking previous months.
    """
    today = datetime.date.today()
    headers = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
    }
    
    # Check up to 3 months back
    for i in range(1, 4):
        year = today.year
        month = today.month - i
        if month <= 0:
            month += 12
            year -= 1
        
        date_str = f"{year}-{month:02d}"
        url = BASE_URL.format(date=date_str)
        
        try:
            print(f"Checking {url}...")
            # Use GET instead of HEAD as some servers block HEAD
            response = requests.get(url, headers=headers, timeout=10, allow_redirects=True)
            print(f"  Status: {response.status_code}")
            
            if response.status_code == 200:
                # content-type check to ensure we didn't get a generic error page
                if 'application/pdf' in response.headers.get('Content-Type', '') or \
                   'text/html' in response.headers.get('Content-Type', ''): 
                    print(f"  Found report for {date_str}")
                    return date_str
        except Exception as e:
            print(f"  Error checking {date_str}: {e}")
            continue
            
    return None

def fetch_report_data(date_str):
    """
    Fetches and parses the report page for the given date.
    Note: Since the detailed data is often rendered dynamically or in PDF,
    we might initially just get the summary or availability status.
    Reliable scraping of the PDF content would require PDF parsing libraries.
    For now, we'll establish the link and basic status.
    """
    url = BASE_URL.format(date=date_str)
    
    try:
        response = requests.get(url, timeout=10)
        response.raise_for_status()
        
        # In a real implementation with more robust dependencies (like pdfplumber),
        # we would parse the PDF or detailed HTML.
        # For this version, we will generate a structured data object that points to this source
        # and carries the date, potentially scraping basic meta tags if available.
        
        return {
            "report_date": date_str,
            "report_url": url,
            "status": "available",
            # Placeholder structure for where parsed data would go
            # In V2 we can add PDF parsing text extraction
            "summary": {
                "detached_median": None,
                "attached_median": None,
                "market_status": "Data available in report"
            }
        }
        
    except Exception as e:
        print(f"Error fetching report: {e}")
        return None

def main():
    print("Starting SDAR data fetch...")
    
    latest_date = get_latest_available_report_date()
    
    output_data = {
        "meta": {
            "last_updated": datetime.datetime.now().isoformat(),
            "source": "SDAR / 10K Research",
            "latest_report_period": latest_date
        },
        "data_available": False,
        "report_url": None
    }

    if latest_date:
        print(f"Latest available report: {latest_date}")
        report_data = fetch_report_data(latest_date)
        
        if report_data:
            output_data["data_available"] = True
            output_data["report_url"] = report_data["report_url"]
            output_data["current_period"] = report_data
            
            # Since we can't reliably parse the numbers without complex PDF tools in this env,
            # we will create a 'live' link for the user to click in the dashboard
            # and potentially mock the 'latest' numbers based on the last known if parsing fails.
    else:
        print("No recent reports found.")

    # Save to public/data/sdar_data.json
    output_path = Path(__file__).parent.parent / "public" / "data" / "sdar_data.json"
    output_path.parent.mkdir(parents=True, exist_ok=True)
    
    with open(output_path, "w") as f:
        json.dump(output_data, f, indent=2)
        
    print(f"Saved data info to {output_path}")

if __name__ == "__main__":
    main()
