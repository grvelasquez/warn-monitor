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
    """Extract all metrics using regex parsing for better reliability."""
    result = {'detached': {}, 'attached': {}}
    
    current_section = None
    
    def parse_pct(s):
        """Parse a percentage string like '+ 77.8' or '- 33.3' or '0.0' or '77.8'."""
        if not s:
            return 0.0
        s = s.strip().replace(' ', '')
        try:
            return float(s)
        except:
            return 0.0

    lines = text.split('\n')
    
    for line in lines:
        line_clean = line.strip()
        
        # Detect section headers
        if 'Detached' in line_clean and 'December' in line_clean:
            current_section = 'detached'
            continue
        elif 'Attached' in line_clean and 'December' in line_clean:
            current_section = 'attached'
            continue
            
        if not current_section:
            continue
            
        # 1. New Listings
        if 'New Listings' in line_clean:
            match = re.search(r'New Listings\*?\s+([\d,]+)\s+([\d,]+)\s*([+-]?\s*[\d.]+)%\s*([\d,]+)\s+([\d,]+)\s*([+-]?\s*[\d.]+)%', line_clean)
            if match:
                result[current_section]['new_listings_2024'] = parse_number(match.group(1))
                result[current_section]['new_listings_2025'] = parse_number(match.group(2))
                result[current_section]['new_listings_pct_change'] = parse_pct(match.group(3))
                result[current_section]['new_listings_ytd_2024'] = parse_number(match.group(4))
                result[current_section]['new_listings_ytd_2025'] = parse_number(match.group(5))
                result[current_section]['new_listings_ytd_pct_change'] = parse_pct(match.group(6))

        # 2. Pending Sales
        elif 'Pending Sales' in line_clean:
            match = re.search(r'Pending Sales\*?\s+([\d,]+)\s+([\d,]+)\s*([+-]?\s*[\d.]+)%\s*([\d,]+)\s+([\d,]+)\s*([+-]?\s*[\d.]+)%', line_clean)
            if match:
                result[current_section]['pending_sales_2024'] = parse_number(match.group(1))
                result[current_section]['pending_sales_2025'] = parse_number(match.group(2))
                result[current_section]['pending_sales_pct_change'] = parse_pct(match.group(3))
                result[current_section]['pending_sales_ytd_2024'] = parse_number(match.group(4))
                result[current_section]['pending_sales_ytd_2025'] = parse_number(match.group(5))
                result[current_section]['pending_sales_ytd_pct_change'] = parse_pct(match.group(6))

        # 3. Closed Sales
        elif 'Closed Sales' in line_clean and 'Price' not in line_clean:
            match = re.search(r'Closed Sales\*?\s+([\d,]+)\s+([\d,]+)\s*([+-]?\s*[\d.]+)%\s*([\d,]+)\s+([\d,]+)\s*([+-]?\s*[\d.]+)%', line_clean)
            if match:
                result[current_section]['closed_sales_2024'] = parse_number(match.group(1))
                result[current_section]['closed_sales_2025'] = parse_number(match.group(2))
                result[current_section]['closed_sales_pct_change'] = parse_pct(match.group(3))
                result[current_section]['closed_sales_ytd_2024'] = parse_number(match.group(4))
                result[current_section]['closed_sales_ytd_2025'] = parse_number(match.group(5))
                result[current_section]['closed_sales_ytd_pct_change'] = parse_pct(match.group(6))

        # 4. Median Sales Price
        elif 'Median Sales Price' in line_clean:
            match = re.search(r'Median Sales Price\*?\s*\$?([\d,]+)\s*\$?([\d,]+)\s*([+-]?\s*[\d.]+)%\s*\$?([\d,]+)\s*\$?([\d,]+)\s*([+-]?\s*[\d.]+)%', line_clean)
            if match:
                result[current_section]['median_price_2024'] = parse_number(match.group(1))
                result[current_section]['median_price_2025'] = parse_number(match.group(2))
                result[current_section]['median_price_pct_change'] = parse_pct(match.group(3))
                result[current_section]['median_price_ytd_2024'] = parse_number(match.group(4))
                result[current_section]['median_price_ytd_2025'] = parse_number(match.group(5))
                result[current_section]['median_price_ytd_pct_change'] = parse_pct(match.group(6))

        # 5. Percent of Original List Price
        elif 'Percent of Original List Price' in line_clean or 'List Price Received' in line_clean:
            match = re.search(r'(?:Percent of Original List Price|List Price Received)\*?\s*([\d.]+)%\s*([\d.]+)%\s*([+-]?\s*[\d.]+)%\s*([\d.]+)%\s*([\d.]+)%\s*([+-]?\s*[\d.]+)%', line_clean)
            if match:
                result[current_section]['pct_orig_price_2024'] = float(match.group(1))
                result[current_section]['pct_orig_price_2025'] = float(match.group(2))
                result[current_section]['pct_orig_price_pct_change'] = parse_pct(match.group(3))
                result[current_section]['pct_orig_price_ytd_2024'] = float(match.group(4))
                result[current_section]['pct_orig_price_ytd_2025'] = float(match.group(5))
                result[current_section]['pct_orig_price_ytd_pct_change'] = parse_pct(match.group(6))

        # 6. Days on Market
        elif 'Days on Market' in line_clean:
            match = re.search(r'Days on Market.*?\*?\s+(\d+)\s+(\d+)\s*([+-]?\s*[\d.]+)%\s+(\d+)\s+(\d+)\s*([+-]?\s*[\d.]+)%', line_clean)
            if match:
                result[current_section]['dom_2024'] = int(match.group(1))
                result[current_section]['dom_2025'] = int(match.group(2))
                result[current_section]['dom_pct_change'] = parse_pct(match.group(3))
                result[current_section]['dom_ytd_2024'] = int(match.group(4))
                result[current_section]['dom_ytd_2025'] = int(match.group(5))
                result[current_section]['dom_ytd_pct_change'] = parse_pct(match.group(6))

        # 7. Inventory (Monthly Only)
        elif 'Inventory of Homes' in line_clean:
            match = re.search(r'Inventory of Homes.*?\*?\s+([\d,]+)\s+([\d,]+)\s*([+-]?\s*[\d.]+)%', line_clean)
            if match:
                result[current_section]['inventory_2024'] = parse_number(match.group(1))
                result[current_section]['inventory_2025'] = parse_number(match.group(2))
                result[current_section]['inventory_pct_change'] = parse_pct(match.group(3))

        # 8. Months Supply (Monthly Only)
        elif 'Months Supply' in line_clean:
            match = re.search(r'Months Supply.*?\*?\s+([\d.]+)\s+([\d.]+)\s*([+-]?\s*[\d.]+)%', line_clean)
            if match:
                result[current_section]['months_supply_2024'] = float(match.group(1))
                result[current_section]['months_supply_2025'] = float(match.group(2))
                result[current_section]['months_supply_pct_change'] = parse_pct(match.group(3))

        # 9. Affordability
        elif 'Housing Affordability Index' in line_clean:
            match = re.search(r'Housing Affordability Index\*?\s+(\d+)\s+(\d+)\s*([+-]?\s*[\d.]+)%', line_clean)
            if match:
                result[current_section]['affordability_2024'] = int(match.group(1))
                result[current_section]['affordability_2025'] = int(match.group(2))
                result[current_section]['affordability_pct_change'] = parse_pct(match.group(3))
    
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
                'report_month': 'December 2025',
                'detached': metrics['detached'],
                'attached': metrics['attached']
            }
            
    except Exception as e:
        print(f"Error parsing {pdf_path}: {e}")
        return None

def parse_monthly_indicators(pdf_path):
    """Parse the Monthly Indicators PDF for county-wide data."""
    try:
        with pdfplumber.open(pdf_path) as pdf:
            if len(pdf.pages) < 3:
                print(f"Monthly Indicators PDF has fewer than 3 pages")
                return None
            
            result = {
                'detached': {},
                'attached': {}
            }
            
            # Page 2 = Detached Market Overview
            detached_text = pdf.pages[1].extract_text()
            if detached_text:
                result['detached'] = parse_market_overview_page(detached_text)
            
            # Page 3 = Attached Market Overview
            attached_text = pdf.pages[2].extract_text()
            if attached_text:
                result['attached'] = parse_market_overview_page(attached_text)
            
            return result
            
    except Exception as e:
        print(f"Error parsing Monthly Indicators: {e}")
        return None

def parse_market_overview_page(text):
    """Parse a market overview page (Detached or Attached) from Monthly Indicators.
    
    Format: MetricName Monthly2024 Monthly2025 +/-X.X% YTD2024 YTD2025 +/-X.X%
    Example: New Listings 1,317 1,108 - 15.9% 18,991 21,757 + 14.6%
    """
    metrics = {}
    
    def parse_pct(sign, value):
        """Parse a percentage with optional sign."""
        pct = float(value) if value else 0.0
        if sign and '-' in sign:
            pct = -pct
        return pct
    
    # New Listings: "New Listings 1,317 1,108 - 15.9% 18,991 21,757 + 14.6%"
    match = re.search(r'New Listings\s+([\d,]+)\s+([\d,]+)\s*([+-])?\s*([\d.]+)%\s*([\d,]+)\s+([\d,]+)\s*([+-])?\s*([\d.]+)%', text)
    if match:
        metrics['new_listings_2024'] = parse_number(match.group(1))
        metrics['new_listings_2025'] = parse_number(match.group(2))
        metrics['new_listings_pct_change'] = parse_pct(match.group(3), match.group(4))
        metrics['new_listings_ytd_2024'] = parse_number(match.group(5))
        metrics['new_listings_ytd_2025'] = parse_number(match.group(6))
        metrics['new_listings_ytd_pct_change'] = parse_pct(match.group(7), match.group(8))
    
    # Pending Sales
    match = re.search(r'Pending Sales\s+([\d,]+)\s+([\d,]+)\s*([+-])?\s*([\d.]+)%\s*([\d,]+)\s+([\d,]+)\s*([+-])?\s*([\d.]+)%', text)
    if match:
        metrics['pending_sales_2024'] = parse_number(match.group(1))
        metrics['pending_sales_2025'] = parse_number(match.group(2))
        metrics['pending_sales_pct_change'] = parse_pct(match.group(3), match.group(4))
        metrics['pending_sales_ytd_2024'] = parse_number(match.group(5))
        metrics['pending_sales_ytd_2025'] = parse_number(match.group(6))
        metrics['pending_sales_ytd_pct_change'] = parse_pct(match.group(7), match.group(8))
    
    # Closed Sales
    match = re.search(r'Closed Sales\s+([\d,]+)\s+([\d,]+)\s*([+-])?\s*([\d.]+)%\s*([\d,]+)\s+([\d,]+)\s*([+-])?\s*([\d.]+)%', text)
    if match:
        metrics['closed_sales_2024'] = parse_number(match.group(1))
        metrics['closed_sales_2025'] = parse_number(match.group(2))
        metrics['closed_sales_pct_change'] = parse_pct(match.group(3), match.group(4))
        metrics['closed_sales_ytd_2024'] = parse_number(match.group(5))
        metrics['closed_sales_ytd_2025'] = parse_number(match.group(6))
        metrics['closed_sales_ytd_pct_change'] = parse_pct(match.group(7), match.group(8))
    
    # Median Sales Price: "$1,019,500 $1,050,000 + 3.0% $1,050,000 $1,055,000 + 0.5%"
    match = re.search(r'Median Sales Price\s*\$?([\d,]+)\s*\$?([\d,]+)\s*([+-])?\s*([\d.]+)%\s*\$?([\d,]+)\s*\$?([\d,]+)\s*([+-])?\s*([\d.]+)%', text)
    if match:
        metrics['median_price_2024'] = parse_number(match.group(1))
        metrics['median_price_2025'] = parse_number(match.group(2))
        metrics['median_price_pct_change'] = parse_pct(match.group(3), match.group(4))
        metrics['median_price_ytd_2024'] = parse_number(match.group(5))
        metrics['median_price_ytd_2025'] = parse_number(match.group(6))
        metrics['median_price_ytd_pct_change'] = parse_pct(match.group(7), match.group(8))
    
    # Average Sales Price
    match = re.search(r'Average Sales Price\s*\$?([\d,]+)\s*\$?([\d,]+)\s*([+-])?\s*([\d.]+)%\s*\$?([\d,]+)\s*\$?([\d,]+)\s*([+-])?\s*([\d.]+)%', text)
    if match:
        metrics['avg_price_2024'] = parse_number(match.group(1))
        metrics['avg_price_2025'] = parse_number(match.group(2))
        metrics['avg_price_pct_change'] = parse_pct(match.group(3), match.group(4))
        metrics['avg_price_ytd_2024'] = parse_number(match.group(5))
        metrics['avg_price_ytd_2025'] = parse_number(match.group(6))
        metrics['avg_price_ytd_pct_change'] = parse_pct(match.group(7), match.group(8))
    
    # Pct of Orig Price Received: "97.9% 97.1% - 0.8% 99.2% 97.8% - 1.4%"
    match = re.search(r'Pct\.?\s*of\s*Orig\.?\s*Price\s*Received\s*([\d.]+)%\s*([\d.]+)%\s*([+-])?\s*([\d.]+)%\s*([\d.]+)%\s*([\d.]+)%\s*([+-])?\s*([\d.]+)%', text)
    if match:
        metrics['pct_orig_price_2024'] = float(match.group(1))
        metrics['pct_orig_price_2025'] = float(match.group(2))
        metrics['pct_orig_price_pct_change'] = parse_pct(match.group(3), match.group(4))
        metrics['pct_orig_price_ytd_2024'] = float(match.group(5))
        metrics['pct_orig_price_ytd_2025'] = float(match.group(6))
        metrics['pct_orig_price_ytd_pct_change'] = parse_pct(match.group(7), match.group(8))
    
    # Days on Market: "36 43 + 19.4% 30 37 + 23.3%"
    match = re.search(r'Days on Market Until Sale\s+(\d+)\s+(\d+)\s*([+-])?\s*([\d.]+)%\s*(\d+)\s+(\d+)\s*([+-])?\s*([\d.]+)%', text)
    if match:
        metrics['dom_2024'] = int(match.group(1))
        metrics['dom_2025'] = int(match.group(2))
        metrics['dom_pct_change'] = parse_pct(match.group(3), match.group(4))
        metrics['dom_ytd_2024'] = int(match.group(5))
        metrics['dom_ytd_2025'] = int(match.group(6))
        metrics['dom_ytd_pct_change'] = parse_pct(match.group(7), match.group(8))
    
    # Inventory: "2,838 2,667 - 6.0%" (no YTD for inventory)
    match = re.search(r'Inventory of Homes for Sale\s+([\d,]+)\s+([\d,]+)\s*([+-])?\s*([\d.]+)%', text)
    if match:
        metrics['inventory_2024'] = parse_number(match.group(1))
        metrics['inventory_2025'] = parse_number(match.group(2))
        metrics['inventory_pct_change'] = parse_pct(match.group(3), match.group(4))
    
    # Months Supply: "2.3 2.2 - 4.3%" (no YTD for months supply)
    match = re.search(r'Months Supply of Inventory\s+([\d.]+)\s+([\d.]+)\s*([+-])?\s*([\d.]+)%', text)
    if match:
        metrics['months_supply_2024'] = float(match.group(1))
        metrics['months_supply_2025'] = float(match.group(2))
        metrics['months_supply_pct_change'] = parse_pct(match.group(3), match.group(4))
    
    # Housing Affordability Index: "39 40 + 2.6%"
    match = re.search(r'Housing Affordability Index\s+(\d+)\s+(\d+)\s*([+-])?\s*([\d.]+)%', text)
    if match:
        metrics['affordability_2024'] = int(match.group(1))
        metrics['affordability_2025'] = int(match.group(2))
        metrics['affordability_pct_change'] = parse_pct(match.group(3), match.group(4))
    
    return metrics

def main():
    """Main function."""
    reports_dir = Path(__file__).parent.parent / "sdar_reports" / "December 2025"
    output_path = Path(__file__).parent.parent / "public" / "data" / "sdar_neighborhood_data.json"
    
    if not reports_dir.exists():
        print(f"Reports directory not found: {reports_dir}")
        return
    
    # Parse Monthly Indicators for county-wide data
    monthly_indicators_path = reports_dir / "Monthly Indicators.pdf"
    county_data = None
    if monthly_indicators_path.exists():
        print(f"Processing Monthly Indicators for county-wide data...")
        county_data = parse_monthly_indicators(monthly_indicators_path)
        if county_data:
            det = county_data.get('detached', {})
            att = county_data.get('attached', {})
            print(f"  -> County Detached: Median ${det.get('median_price_2025', 0):,}, DOM {det.get('dom_2025', 0)}, Inventory {det.get('inventory_2025', 0)}")
            print(f"  -> County Attached: Median ${att.get('median_price_2025', 0):,}, DOM {att.get('dom_2025', 0)}, Inventory {att.get('inventory_2025', 0)}")
    else:
        print(f"Monthly Indicators PDF not found at {monthly_indicators_path}")
    
    zip_pdfs = list(reports_dir.glob("[0-9]*-*.pdf"))
    print(f"\nFound {len(zip_pdfs)} zip code PDFs")
    
    neighborhoods = []
    
    first_pdf = True
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
    
    # Summary stats from neighborhoods
    det_prices = [n['detached'].get('median_price_2025') for n in neighborhoods if n['detached'].get('median_price_2025')]
    att_prices = [n['attached'].get('median_price_2025') for n in neighborhoods if n['attached'].get('median_price_2025')]
    
    output = {
        "meta": {
            "generated": datetime.now().isoformat(),
            "source": "SDAR Local Market Updates & Monthly Indicators",
            "report_period": "December 2025",
            "neighborhoods_count": len(neighborhoods)
        },
        "county_wide": county_data,  # Full San Diego County data from Monthly Indicators
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
