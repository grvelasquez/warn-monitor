import os
import re
import json
import traceback
import sys
try:
    import pdfplumber
except ImportError:
    print("pdfplumber not installed")
    sys.exit(1)

MONTHS = {
    'Jan': 1, 'January': 1,
    'Feb': 2, 'February': 2,
    'Mar': 3, 'March': 3,
    'Apr': 4, 'April': 4,
    'May': 5,
    'Jun': 6, 'June': 6,
    'Jul': 7, 'July': 7,
    'Aug': 8, 'August': 8,
    'Sep': 9, 'September': 9,
    'Oct': 10, 'October': 10,
    'Nov': 11, 'November': 11,
    'Dec': 12, 'December': 12
}

def clean_number(s):
    if not s:
        return None
    s = s.replace(',', '').replace('$', '').replace('%', '').strip()
    try:
        if '.' in s:
            return float(s)
        return int(s)
    except ValueError:
        return None

def extract_metric(text, metric_name):
    """
    Looks for a line starting with metric_name and extracts the 'current year' value.
    Usually the line format is:
    [Metric Name] [Last Year Value] [This Year Value] [Percent Change] ...
    Because spacing can be weird (e.g., $1,000,000$1,050,000), we use regex.
    """
    pattern = re.compile(rf'^{metric_name}\s+(.*)$', re.MULTILINE | re.IGNORECASE)
    match = pattern.search(text)
    if not match:
        return None
        
    line_remainder = match.group(1).strip()
    
    # Extract all numbers that might have commas, dots, or dollar signs.
    # Pattern explanation: matches optionally starting with $, followed by digits (and commas), optionally a decimal part.
    numbers = re.findall(r'\$?\d{1,3}(?:,\d{3})*(?:\.\d+)?', line_remainder)
    
    if len(numbers) >= 2:
        # The second number is typically the 'current year' value in these SDAR reports
        return clean_number(numbers[1])
    elif len(numbers) == 1:
        # In some rare formats or if data is missing for previous year, there might just be one?
        return clean_number(numbers[0])
    
    return None

def process_pdfs(directory_path, output_json):
    history = []
    
    if not os.path.exists(directory_path):
        print(f"Directory not found: {directory_path}")
        return
        
    files = [f for f in os.listdir(directory_path) if f.lower().endswith('.pdf')]
    print(f"Found {len(files)} PDFs. Processing...")
    
    for filename in sorted(files):
        # Extract month and year from filename, e.g., "April 2017.pdf", "Dec 2025.pdf"
        name_parts = os.path.splitext(filename)[0].split()
        if len(name_parts) < 2:
            print(f"Skipping {filename}: unexpected name format.")
            continue
            
        month_str = name_parts[0]
        year_str = name_parts[1]
        
        try:
            year = int(year_str)
            month = MONTHS.get(month_str[:3].capitalize(), 1) # Default to 1 if not found
        except ValueError:
            print(f"Skipping {filename}: could not parse year/month.")
            continue
            
        pdf_path = os.path.join(directory_path, filename)
        
        data_point = {
            'period': f"{year}-{month:02d}",
            'year': year,
            'month': month,
            'monthName': month_str,
            'detached': {},
            'attached': {}
        }
        
        try:
            with pdfplumber.open(pdf_path) as pdf:
                # Page 1 (index 0) = Cover / Market Snapshot
                # Page 2 (index 1) = Detached Market Overview
                # Page 3 (index 2) = Attached Market Overview
                
                if len(pdf.pages) > 1:
                    text_detached = pdf.pages[1].extract_text() or ""
                    data_point['detached'] = {
                        'medianPrice': extract_metric(text_detached, "Median Sales Price"),
                        'closedSales': extract_metric(text_detached, "Closed Sales"),
                        'inventory': extract_metric(text_detached, "Inventory of Homes for Sale"),
                        'monthsSupply': extract_metric(text_detached, "Months Supply of Inventory"),
                        'daysOnMarket': extract_metric(text_detached, "Days on Market Until Sale"),
                        'newListings': extract_metric(text_detached, "New Listings")
                    }
                    
                if len(pdf.pages) > 2:
                    text_attached = pdf.pages[2].extract_text() or ""
                    data_point['attached'] = {
                        'medianPrice': extract_metric(text_attached, "Median Sales Price"),
                        'closedSales': extract_metric(text_attached, "Closed Sales"),
                        'inventory': extract_metric(text_attached, "Inventory of Homes for Sale"),
                        'monthsSupply': extract_metric(text_attached, "Months Supply of Inventory"),
                        'daysOnMarket': extract_metric(text_attached, "Days on Market Until Sale"),
                        'newListings': extract_metric(text_attached, "New Listings")
                    }
                    
        except Exception as e:
            print(f"Error extracting {filename}: {e}")
            continue
            
        history.append(data_point)
        print(f"Processed: {data_point['period']}")
        
    # Sort history chronologically
    history.sort(key=lambda x: (x['year'], x['month']))
    
    # Write to JSON
    os.makedirs(os.path.dirname(output_json), exist_ok=True)
    with open(output_json, 'w') as f:
        json.dump(history, f, indent=2)
        
    print(f"\nSuccessfully extracted data to {output_json}")

if __name__ == "__main__":
    pdf_dir = "sdar_reports/Monthly Indicators"
    output = "public/data/historical_indicators.json"
    process_pdfs(pdf_dir, output)
