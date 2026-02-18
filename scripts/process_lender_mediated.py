"""
Lender-Mediated Properties Report PDF Parser
Extracts all data from the SDAR Lender-Mediated Properties Report.
"""

import pdfplumber
import json
import re
import os
from pathlib import Path
from datetime import datetime

def parse_number(value_str):
    """Parse a number from string."""
    if not value_str or value_str == '--' or value_str == '-':
        return None
    cleaned = re.sub(r'[$,%+\s]', '', value_str.strip())
    try:
        if '.' in cleaned:
            return float(cleaned)
        return int(cleaned)
    except ValueError:
        return None

def parse_pct(sign, value):
    """Parse a percentage with optional sign."""
    if value is None or value == '--':
        return None
    pct = float(value) if value else 0.0
    if sign and '-' in sign:
        pct = -pct
    return pct

def parse_pct_str(pct_str):
    """Parse percentage from string like '+ 5.0%' or '- 10.5%'."""
    if not pct_str or pct_str == '--':
        return None
    match = re.search(r'([+-])?\s*([\d.]+)%?', pct_str)
    if match:
        sign = match.group(1)
        value = float(match.group(2))
        if sign == '-':
            return -value
        return value
    return None

def extract_summary_data(text):
    """Extract executive summary data from page 1."""
    summary = {}
    
    # New Listings decreased 72.4 percent to 424
    match = re.search(r'New Listings.*?decreased\s+([\d.]+)\s+percent\s+to\s+([\d,]+)', text)
    if match:
        summary['new_listings_change'] = -float(match.group(1))
        summary['new_listings_total'] = parse_number(match.group(2))
    
    # Traditional New Listings decreased 72.6 percent to 403
    match = re.search(r'Traditional New Listings.*?decreased\s+([\d.]+)\s+percent\s+to\s+([\d,]+)', text)
    if match:
        summary['new_listings_traditional_change'] = -float(match.group(1))
        summary['new_listings_traditional'] = parse_number(match.group(2))
    
    # Lender-mediated New Listings decreased 68.2 percent to 21
    match = re.search(r'Lender-mediated New Listings.*?decreased\s+([\d.]+)\s+percent\s+to\s+([\d,]+)', text)
    if match:
        summary['new_listings_lender_mediated_change'] = -float(match.group(1))
        summary['new_listings_lender_mediated'] = parse_number(match.group(2))
    
    # Share of New Listings that were lender-mediated rose to 5.0 percent
    match = re.search(r'Share of New Listings.*?(rose|fell)\s+to\s+([\d.]+)\s+percent', text)
    if match:
        summary['share_new_listings'] = float(match.group(2))
    
    # Closed Sales were down 6.3 percent to 1,673
    match = re.search(r'Closed Sales were\s+(?:down|up)\s+([\d.]+)\s+percent\s+to\s+([\d,]+)', text)
    if match:
        summary['closed_sales_change'] = -float(match.group(1)) if 'down' in text else float(match.group(1))
        summary['closed_sales_total'] = parse_number(match.group(2))
    
    # Traditional Closed Sales were down 5.9 percent to 1,598
    match = re.search(r'Traditional Closed Sales.*?(?:down|up)\s+([\d.]+)\s+percent\s+to\s+([\d,]+)', text)
    if match:
        summary['closed_sales_traditional_change'] = -float(match.group(1))
        summary['closed_sales_traditional'] = parse_number(match.group(2))
    
    # Lender-mediated Closed Sales were down 13.8 percent to 75
    match = re.search(r'Lender-mediated Closed Sales.*?(?:down|up)\s+([\d.]+)\s+percent\s+to\s+([\d,]+)', text)
    if match:
        summary['closed_sales_lender_mediated_change'] = -float(match.group(1))
        summary['closed_sales_lender_mediated'] = parse_number(match.group(2))
    
    # Share of Closed Sales that were lender-mediated fell to 4.5 percent
    match = re.search(r'Share of Closed Sales.*?(rose|fell)\s+to\s+([\d.]+)\s+percent', text)
    if match:
        summary['share_closed_sales'] = float(match.group(2))
    
    # The overall Median Sales Price rose 3.0 percent to $901,000
    match = re.search(r'overall Median Sales Price\s+(rose|fell)\s+([\d.]+)\s+percent\s+to\s+\$([\d,]+)', text)
    if match:
        change = float(match.group(2))
        summary['median_price_change'] = change if match.group(1) == 'rose' else -change
        summary['median_price_total'] = parse_number(match.group(3))
    
    # The traditional Median Sales Price rose 3.1 percent to $904,000
    match = re.search(r'traditional Median Sales Price\s+(rose|fell)\s+([\d.]+)\s+percent\s+to\s+\$([\d,]+)', text)
    if match:
        change = float(match.group(2))
        summary['median_price_traditional_change'] = change if match.group(1) == 'rose' else -change
        summary['median_price_traditional'] = parse_number(match.group(3))
    
    # The lender-mediated Median Sales Price rose 8.1 percent to $848,600
    match = re.search(r'lender-mediated Median Sales Price\s+(rose|fell)\s+([\d.]+)\s+percent\s+to\s+\$([\d,]+)', text)
    if match:
        change = float(match.group(2))
        summary['median_price_lender_mediated_change'] = change if match.group(1) == 'rose' else -change
        summary['median_price_lender_mediated'] = parse_number(match.group(3))
    
    return summary

def extract_inventory_data(text):
    """Extract inventory data from page 2."""
    inventory = {
        'by_property_type': [],
        'by_price_range': []
    }
    
    # Parse inventory by property type
    # Pattern: "Single-Family Homes 111 60 - 45.9% 2,154 967 - 55.1% 2,265 1,027 - 54.7% 4.9% 5.8%"
    property_types = ['Single-Family Homes', 'Condos - Townhomes', 'All Properties']
    for ptype in property_types:
        pattern = rf'{ptype}\s+(\d+)\s+(\d+)\s+([+-])?\s*([\d.]+)%\s+([\d,]+)\s+([\d,]+)\s+([+-])?\s*([\d.]+)%\s+([\d,]+)\s+([\d,]+)\s+([+-])?\s*([\d.]+)%\s+([\d.]+)%\s+([\d.]+)%'
        match = re.search(pattern, text)
        if match:
            inventory['by_property_type'].append({
                'type': ptype,
                'lender_mediated': {
                    '2025': int(match.group(1)),
                    '2026': int(match.group(2)),
                    'change': parse_pct(match.group(3), match.group(4))
                },
                'traditional': {
                    '2025': parse_number(match.group(5)),
                    '2026': parse_number(match.group(6)),
                    'change': parse_pct(match.group(7), match.group(8))
                },
                'total_market': {
                    '2025': parse_number(match.group(9)),
                    '2026': parse_number(match.group(10)),
                    'change': parse_pct(match.group(11), match.group(12))
                },
                'share': {
                    '2025': float(match.group(13)),
                    '2026': float(match.group(14))
                }
            })
    
    # Parse inventory by price range
    price_ranges = [
        '$250,000 and Below',
        '$250,001 to $500,000',
        '$500,001 to $750,000',
        '$750,001 to $1,000,000',
        '$1,000,001 to $1,250,000',
        '$1,250,001 and Above'
    ]
    
    for prange in price_ranges:
        # Escape special regex characters in price range
        escaped = re.escape(prange)
        pattern = rf'{escaped}\s+(\d+)\s+(\d+)\s+([+-])?\s*([\d.]+)%\s+([\d,]+)\s+([\d,]+)\s+([+-])?\s*([\d.]+)%\s+([\d,]+)\s+([\d,]+)\s+([+-])?\s*([\d.]+)%\s+([\d.]+)%\s+([\d.]+)%'
        match = re.search(pattern, text)
        if match:
            inventory['by_price_range'].append({
                'range': prange,
                'lender_mediated': {
                    '2025': int(match.group(1)),
                    '2026': int(match.group(2)),
                    'change': parse_pct(match.group(3), match.group(4))
                },
                'traditional': {
                    '2025': parse_number(match.group(5)),
                    '2026': parse_number(match.group(6)),
                    'change': parse_pct(match.group(7), match.group(8))
                },
                'total_market': {
                    '2025': parse_number(match.group(9)),
                    '2026': parse_number(match.group(10)),
                    'change': parse_pct(match.group(11), match.group(12))
                },
                'share': {
                    '2025': float(match.group(13)),
                    '2026': float(match.group(14))
                }
            })
    
    return inventory

def extract_listings_sales_data(text):
    """Extract new listings and closed sales data from page 3."""
    data = {}
    
    # Pattern: "New Listings 66 21 - 68.2% 1,473 403 - 72.6% 1,539 424 - 72.4% 4.3% 5.0%"
    match = re.search(r'New Listings\s+(\d+)\s+(\d+)\s+([+-])?\s*([\d.]+)%\s+([\d,]+)\s+([\d,]+)\s+([+-])?\s*([\d.]+)%\s+([\d,]+)\s+([\d,]+)\s+([+-])?\s*([\d.]+)%\s+([\d.]+)%\s+([\d.]+)%', text)
    if match:
        data['new_listings'] = {
            'lender_mediated': {
                '2025': int(match.group(1)),
                '2026': int(match.group(2)),
                'change': parse_pct(match.group(3), match.group(4))
            },
            'traditional': {
                '2025': parse_number(match.group(5)),
                '2026': parse_number(match.group(6)),
                'change': parse_pct(match.group(7), match.group(8))
            },
            'total_market': {
                '2025': parse_number(match.group(9)),
                '2026': parse_number(match.group(10)),
                'change': parse_pct(match.group(11), match.group(12))
            },
            'share': {
                '2025': float(match.group(13)),
                '2026': float(match.group(14))
            }
        }
    
    # Pattern: "Closed Sales 87 75 - 13.8% 1,698 1,598 - 5.9% 1,785 1,673 - 6.3% 4.9% 4.5%"
    match = re.search(r'Closed Sales\s+(\d+)\s+(\d+)\s+([+-])?\s*([\d.]+)%\s+([\d,]+)\s+([\d,]+)\s+([+-])?\s*([\d.]+)%\s+([\d,]+)\s+([\d,]+)\s+([+-])?\s*([\d.]+)%\s+([\d.]+)%\s+([\d.]+)%', text)
    if match:
        data['closed_sales'] = {
            'lender_mediated': {
                '2025': int(match.group(1)),
                '2026': int(match.group(2)),
                'change': parse_pct(match.group(3), match.group(4))
            },
            'traditional': {
                '2025': parse_number(match.group(5)),
                '2026': parse_number(match.group(6)),
                'change': parse_pct(match.group(7), match.group(8))
            },
            'total_market': {
                '2025': parse_number(match.group(9)),
                '2026': parse_number(match.group(10)),
                'change': parse_pct(match.group(11), match.group(12))
            },
            'share': {
                '2025': float(match.group(13)),
                '2026': float(match.group(14))
            }
        }
    
    return data

def extract_price_dom_data(text):
    """Extract median sales price and days on market from page 4."""
    data = {
        'median_price': [],
        'days_on_market': []
    }
    
    property_types = ['Single-Family Homes', 'Condos - Townhomes', 'All Properties']
    
    # Median Sales Price pattern
    for ptype in property_types:
        # Pattern: "$880,000 $955,000 + 8.5% $1,007,500 $1,055,000 + 4.7% $1,000,000 $1,050,000 + 5.0%"
        pattern = rf'{ptype}\s+\$?([\d,]+)\s+\$?([\d,]+)\s+([+-])?\s*([\d.]+)%\s+\$?([\d,]+)\s+\$?([\d,]+)\s+([+-])?\s*([\d.]+)%\s+\$?([\d,]+)\s+\$?([\d,]+)\s+([+-])?\s*([\d.]+)%'
        match = re.search(pattern, text)
        if match:
            data['median_price'].append({
                'type': ptype,
                'lender_mediated': {
                    '2025': parse_number(match.group(1)),
                    '2026': parse_number(match.group(2)),
                    'change': parse_pct(match.group(3), match.group(4))
                },
                'traditional': {
                    '2025': parse_number(match.group(5)),
                    '2026': parse_number(match.group(6)),
                    'change': parse_pct(match.group(7), match.group(8))
                },
                'total_market': {
                    '2025': parse_number(match.group(9)),
                    '2026': parse_number(match.group(10)),
                    'change': parse_pct(match.group(11), match.group(12))
                }
            })
    
    # Days on Market pattern - search in the second half of the text (after median price section)
    dom_section = text.split('Days on Market')[-1] if 'Days on Market' in text else text
    
    for ptype in property_types:
        # Pattern: "47 60 + 27.7% 40 43 + 7.5% 40 44 + 10.0%"
        pattern = rf'{ptype}\s+(\d+)\s+(\d+)\s+([+-])?\s*([\d.]+)%\s+(\d+)\s+(\d+)\s+([+-])?\s*([\d.]+)%\s+(\d+)\s+(\d+)\s+([+-])?\s*([\d.]+)%'
        match = re.search(pattern, dom_section)
        if match:
            data['days_on_market'].append({
                'type': ptype,
                'lender_mediated': {
                    '2025': int(match.group(1)),
                    '2026': int(match.group(2)),
                    'change': parse_pct(match.group(3), match.group(4))
                },
                'traditional': {
                    '2025': int(match.group(5)),
                    '2026': int(match.group(6)),
                    'change': parse_pct(match.group(7), match.group(8))
                },
                'total_market': {
                    '2025': int(match.group(9)),
                    '2026': int(match.group(10)),
                    'change': parse_pct(match.group(11), match.group(12))
                }
            })
    
    return data

def extract_area_inventory_closed_sales(text):
    """Extract inventory and closed sales by area from pages 5-7."""
    areas = []
    
    # Pattern: "91901 – Alpine 20 1 5.0% 149 7 4.7%"
    pattern = r'(\d{5})\s*[–-]\s*([A-Za-z\s,–-]+?)\s+(\d+)\s+(\d+)\s+([\d.]+|--)%?\s+(\d+)\s+(\d+)\s+([\d.]+|--)%'
    
    for match in re.finditer(pattern, text):
        zip_code = match.group(1)
        neighborhood = match.group(2).strip()
        
        inv_total = int(match.group(3))
        inv_lm = int(match.group(4))
        inv_share = float(match.group(5)) if match.group(5) != '--' else 0.0
        
        sales_total = int(match.group(6))
        sales_lm = int(match.group(7))
        sales_share = float(match.group(8)) if match.group(8) != '--' else 0.0
        
        areas.append({
            'zip_code': zip_code,
            'neighborhood': neighborhood,
            'inventory': {
                'total_market': inv_total,
                'lender_mediated': inv_lm,
                'share': inv_share
            },
            'closed_sales': {
                'total_market': sales_total,
                'lender_mediated': sales_lm,
                'share': sales_share
            }
        })
    
    return areas

def extract_area_median_price(text):
    """Extract median sales price by area from pages 8-10."""
    areas = []
    
    # Pattern: "92020 – El Cajon $723,750 $740,000 + 2.2% $775,000 $858,750 + 10.8%"
    pattern = r'(\d{5})\s*[–-]\s*([A-Za-z\s,–-]+?)\s+\$?([\d,]+)\s+\$?([\d,]+)\s+([+-])?[\s]*([\d.]+|--)\%?\s+\$?([\d,]+)\s+\$?([\d,]+)\s+([+-])?[\s]*([\d.]+|--)\%?'
    
    for match in re.finditer(pattern, text):
        zip_code = match.group(1)
        neighborhood = match.group(2).strip()
        
        lm_2024 = parse_number(match.group(3))
        lm_2025 = parse_number(match.group(4))
        lm_sign = match.group(5)
        lm_change_val = match.group(6)
        lm_change = parse_pct(lm_sign, lm_change_val) if lm_change_val != '--' else None
        
        trad_2024 = parse_number(match.group(7))
        trad_2025 = parse_number(match.group(8))
        trad_sign = match.group(9)
        trad_change_val = match.group(10)
        trad_change = parse_pct(trad_sign, trad_change_val) if trad_change_val != '--' else None
        
        areas.append({
            'zip_code': zip_code,
            'neighborhood': neighborhood,
            'lender_mediated': {
                '2025': lm_2024,
                '2026': lm_2025,
                'change': lm_change
            },
            'traditional': {
                '2025': trad_2024,
                '2026': trad_2025,
                'change': trad_change
            }
        })
    
    return areas

def parse_lender_mediated_pdf(pdf_path):
    """Parse the entire Lender-Mediated Properties Report PDF."""
    result = {
        'meta': {
            'generated': datetime.now().isoformat(),
            'source': 'SDAR Lender-Mediated Properties Report',
            'report_period': 'January 2026'
        }
    }
    
    with pdfplumber.open(pdf_path) as pdf:
        # Page 1 - Executive Summary
        if len(pdf.pages) >= 1:
            text = pdf.pages[0].extract_text() or ''
            result['summary'] = extract_summary_data(text)
        
        # Page 2 - Inventory by property type and price range
        if len(pdf.pages) >= 2:
            text = pdf.pages[1].extract_text() or ''
            result['inventory'] = extract_inventory_data(text)
        
        # Page 3 - New Listings and Closed Sales
        if len(pdf.pages) >= 3:
            text = pdf.pages[2].extract_text() or ''
            result['activity'] = extract_listings_sales_data(text)
        
        # Page 4 - Median Sales Price and Days on Market
        if len(pdf.pages) >= 4:
            text = pdf.pages[3].extract_text() or ''
            result['price_dom'] = extract_price_dom_data(text)
        
        # Pages 5-7 - Inventory and Closed Sales by Area
        area_inv_sales = []
        for i in range(4, 7):
            if len(pdf.pages) > i:
                text = pdf.pages[i].extract_text() or ''
                area_inv_sales.extend(extract_area_inventory_closed_sales(text))
        result['area_inventory_sales'] = area_inv_sales
        
        # Pages 8-10 - Median Sales Price by Area
        area_prices = []
        for i in range(7, 10):
            if len(pdf.pages) > i:
                text = pdf.pages[i].extract_text() or ''
                area_prices.extend(extract_area_median_price(text))
        result['area_median_prices'] = area_prices
    
    return result

def main():
    """Main function."""
    reports_dir = Path(__file__).parent.parent / "sdar_reports" / "January 2026"
    pdf_path = reports_dir / "Lender Mediated.pdf"
    output_path = Path(__file__).parent.parent / "public" / "data" / "lender_mediated_data.json"
    
    if not pdf_path.exists():
        print(f"PDF not found: {pdf_path}")
        return
    
    print(f"Parsing: {pdf_path}")
    data = parse_lender_mediated_pdf(pdf_path)
    
    # Print summary
    summary = data.get('summary', {})
    print(f"\n=== Summary ===")
    print(f"New Listings: {summary.get('new_listings_total')} ({summary.get('new_listings_change')}%)")
    print(f"Closed Sales: {summary.get('closed_sales_total')} ({summary.get('closed_sales_change')}%)")
    print(f"Median Price: ${summary.get('median_price_total'):,} ({summary.get('median_price_change')}%)")
    
    print(f"\n=== Inventory by Property Type ===")
    for item in data.get('inventory', {}).get('by_property_type', []):
        print(f"  {item['type']}: LM={item['lender_mediated']['2026']}, Trad={item['traditional']['2026']}, Total={item['total_market']['2026']}")
    
    print(f"\n=== Area Data ===")
    print(f"  Inventory/Sales areas: {len(data.get('area_inventory_sales', []))}")
    print(f"  Median Price areas: {len(data.get('area_median_prices', []))}")
    
    # Save to JSON
    output_path.parent.mkdir(parents=True, exist_ok=True)
    with open(output_path, 'w') as f:
        json.dump(data, f, indent=2)
    
    print(f"\nSaved to: {output_path}")

if __name__ == "__main__":
    main()
