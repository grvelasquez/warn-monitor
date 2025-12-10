#!/usr/bin/env python3
"""
SDAR PDF Report Parser - Simplified version
Extracts real estate data from Local Market Update PDFs.
"""

import pdfplumber
import json
import re
import os
from pathlib import Path
from datetime import datetime

def parse_number(value_str):
    """Parse a number from string."""
    if not value_str or value_str == '--':
        return None
    cleaned = re.sub(r'[$,%+\s]', '', value_str.strip())
    try:
        if '.' in cleaned:
            return float(cleaned)
        return int(cleaned)
    except ValueError:
        return None

def extract_all_metrics(text):
    """Extract all metrics using line-by-line parsing."""
    result = {'detached': {}, 'attached': {}}
    
    # Split into detached and attached sections
    lines = text.split('\n')
    current_section = None
    
    for i, line in enumerate(lines):
        line_clean = line.strip()
        
        # Detect section headers
        if 'Detached' in line_clean and 'November' in line_clean:
            current_section = 'detached'
            continue
        elif 'Attached' in line_clean and 'November' in line_clean:
            current_section = 'attached'
            continue
        
        if not current_section:
            continue
            
        # Parse metric lines - format: "Metric Name VALUE1 VALUE2 CHANGE ..."
        if 'Median Sales Price' in line_clean:
            # Find all dollar amounts
            prices = re.findall(r'\$([\d,]+)', line_clean)
            if len(prices) >= 2:
                result[current_section]['median_price_2024'] = parse_number(prices[0])
                result[current_section]['median_price_2025'] = parse_number(prices[1])
                
        elif 'Days on Market' in line_clean:
            numbers = re.findall(r'\b(\d+)\b', line_clean)
            if len(numbers) >= 2:
                result[current_section]['dom_2024'] = int(numbers[0])
                result[current_section]['dom_2025'] = int(numbers[1])
                
        elif 'Inventory of Homes' in line_clean:
            numbers = re.findall(r'\b(\d+)\b', line_clean)
            if len(numbers) >= 2:
                result[current_section]['inventory_2024'] = int(numbers[0])
                result[current_section]['inventory_2025'] = int(numbers[1])
                
        elif 'Closed Sales' in line_clean and 'Price' not in line_clean:
            numbers = re.findall(r'\b(\d+)\b', line_clean)
            if len(numbers) >= 2:
                result[current_section]['closed_sales_2024'] = int(numbers[0])
                result[current_section]['closed_sales_2025'] = int(numbers[1])
                
        elif 'New Listings' in line_clean:
            numbers = re.findall(r'\b(\d+)\b', line_clean)
            if len(numbers) >= 2:
                result[current_section]['new_listings_2024'] = int(numbers[0])
                result[current_section]['new_listings_2025'] = int(numbers[1])
                
        elif 'Months Supply' in line_clean:
            numbers = re.findall(r'([\d.]+)', line_clean)
            if len(numbers) >= 2:
                result[current_section]['months_supply_2024'] = float(numbers[0])
                result[current_section]['months_supply_2025'] = float(numbers[1])
    
    return result

def parse_zip_pdf(pdf_path):
    """Parse a zip code PDF."""
    try:
        with pdfplumber.open(pdf_path) as pdf:
            if not pdf.pages:
                return None
            
            text = pdf.pages[0].extract_text()
            if not text:
                return None
            
            # Extract zip code
            zip_match = re.search(r'\b(9\d{4})\b', text)
            zip_code = zip_match.group(1) if zip_match else None
            
            # Extract neighborhood from filename
            filename = os.path.basename(pdf_path)
            name_match = re.match(r'\d+-(.+)\.pdf', filename)
            neighborhood = name_match.group(1).replace(',', ', ') if name_match else filename
            
            # Extract metrics
            metrics = extract_all_metrics(text)
            
            return {
                'file': filename,
                'zip_code': zip_code,
                'neighborhood': neighborhood,
                'report_month': 'November 2025',
                'detached': metrics['detached'],
                'attached': metrics['attached']
            }
            
    except Exception as e:
        print(f"Error parsing {pdf_path}: {e}")
        return None

def main():
    """Main function."""
    reports_dir = Path(__file__).parent.parent / "sdar_reports"
    output_path = Path(__file__).parent.parent / "public" / "data" / "sdar_neighborhood_data.json"
    
    if not reports_dir.exists():
        print(f"Reports directory not found: {reports_dir}")
        return
    
    zip_pdfs = list(reports_dir.glob("[0-9]*-*.pdf"))
    print(f"Found {len(zip_pdfs)} zip code PDFs")
    
    neighborhoods = []
    
    for pdf_path in sorted(zip_pdfs):
        print(f"Processing: {pdf_path.name}")
        data = parse_zip_pdf(pdf_path)
        if data:
            neighborhoods.append(data)
            det_price = data['detached'].get('median_price_2025')
            att_price = data['attached'].get('median_price_2025')
            det_str = f"${det_price:,}" if det_price else "N/A"
            att_str = f"${att_price:,}" if att_price else "N/A"
            print(f"  -> {data['neighborhood']}: Detached {det_str}, Attached {att_str}")
    
    # Summary stats
    det_prices = [n['detached'].get('median_price_2025') for n in neighborhoods if n['detached'].get('median_price_2025')]
    att_prices = [n['attached'].get('median_price_2025') for n in neighborhoods if n['attached'].get('median_price_2025')]
    
    output = {
        "meta": {
            "generated": datetime.now().isoformat(),
            "source": "SDAR Local Market Updates",
            "report_period": "November 2025",
            "neighborhoods_count": len(neighborhoods)
        },
        "summary": {
            "avg_detached_median": round(sum(det_prices) / len(det_prices)) if det_prices else None,
            "avg_attached_median": round(sum(att_prices) / len(att_prices)) if att_prices else None,
            "highest_detached": max(det_prices) if det_prices else None,
            "lowest_detached": min(det_prices) if det_prices else None,
            "highest_attached": max(att_prices) if att_prices else None,
            "lowest_attached": min(att_prices) if att_prices else None,
        },
        "neighborhoods": neighborhoods
    }
    
    output_path.parent.mkdir(parents=True, exist_ok=True)
    with open(output_path, 'w') as f:
        json.dump(output, f, indent=2)
    
    print(f"\nSaved {len(neighborhoods)} neighborhoods to {output_path}")
    if det_prices:
        print(f"  Avg Detached: ${output['summary']['avg_detached_median']:,}")
    if att_prices:
        print(f"  Avg Attached: ${output['summary']['avg_attached_median']:,}")

if __name__ == "__main__":
    main()
