#!/usr/bin/env python3
"""
Housing Supply Overview PDF Parser
Extracts all data from the SDAR Housing Supply Overview Report.
"""

import pdfplumber
import json
import re
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

def extract_table_data(text, categories, has_all_row=True, is_currency=False):
    """
    Extract table data for given categories (price ranges or square footage).
    Returns list of dicts with category, all_properties, single_family, condos data.
    """
    results = []
    
    for category in categories:
        # Escape special regex characters
        escaped = re.escape(category)
        
        if is_currency:
            # For currency values like median price
            pattern = rf'{escaped}\s+\$?([\d,]+)\s+\$?([\d,]+)\s+([+-])?\s*([\d.]+)%?\s+\$?([\d,]+)\s+\$?([\d,]+)\s+([+-])?\s*([\d.]+)%?\s+\$?([\d,]+)\s+\$?([\d,]+)\s+([+-])?\s*([\d.]+)%'
        else:
            # For count values (pending sales, closed sales, inventory)
            pattern = rf'{escaped}\s+([\d,]+)\s+([\d,]+)\s+([+-])?\s*([\d.]+)%?\s+([\d,]+)\s+([\d,]+)\s+([+-])?\s*([\d.]+)%?\s+([\d,]+)\s+([\d,]+)\s+([+-])?\s*([\d.]+)%'
        
        match = re.search(pattern, text)
        if match:
            results.append({
                'category': category,
                'all_properties': {
                    '2025': parse_number(match.group(1)),
                    '2026': parse_number(match.group(2)),
                    'change': parse_pct(match.group(3), match.group(4))
                },
                'single_family': {
                    '2025': parse_number(match.group(5)),
                    '2026': parse_number(match.group(6)),
                    'change': parse_pct(match.group(7), match.group(8))
                },
                'condos': {
                    '2025': parse_number(match.group(9)),
                    '2026': parse_number(match.group(10)),
                    'change': parse_pct(match.group(11), match.group(12))
                }
            })
    
    return results

def extract_pending_sales(text):
    """Extract pending sales data from page 2."""
    price_ranges = [
        '$250,000 and Below',
        '$250,001 to $500,000',
        '$500,001 to $750,000',
        '$750,001 to $1,000,000',
        '$1,000,001 to $1,250,000',
        '$1,250,001 to $2,000,000',
        '$2,000,001 to $5,000,000',
        '$5,000,001 and Above'
    ]
    
    sq_footage = [
        '1,500 Sq Ft and Below',
        '1,501 to 2,000 Sq Ft',
        '2,001 to 3,000 Sq Ft',
        '3,001 to 4,000 Sq Ft',
        '4,001 to 6,000 Sq Ft',
        '6,001 Sq Ft and Above'
    ]
    
    return {
        'by_price_range': extract_table_data(text, price_ranges),
        'by_sq_footage': extract_table_data(text, sq_footage)
    }

def extract_closed_sales(text):
    """Extract closed sales data from page 3."""
    price_ranges = [
        '$250,000 and Below',
        '$250,001 to $500,000',
        '$500,001 to $750,000',
        '$750,001 to $1,000,000',
        '$1,000,001 to $1,250,000',
        '$1,250,001 to $2,000,000',
        '$2,000,001 to $5,000,000',
        '$5,000,001 and Above'
    ]
    
    sq_footage = [
        '1,500 Sq Ft and Below',
        '1,501 to 2,000 Sq Ft',
        '2,001 to 3,000 Sq Ft',
        '3,001 to 4,000 Sq Ft',
        '4,001 to 6,000 Sq Ft',
        '6,001 Sq Ft and Above'
    ]
    
    return {
        'by_price_range': extract_table_data(text, price_ranges),
        'by_sq_footage': extract_table_data(text, sq_footage)
    }

def extract_median_price(text):
    """Extract median sales price data from page 4."""
    sq_footage = [
        '1,500 Sq Ft and Below',
        '1,501 to 2,000 Sq Ft',
        '2,001 to 3,000 Sq Ft',
        '3,001 to 4,000 Sq Ft',
        '4,001 to 6,000 Sq Ft',
        '6,001 Sq Ft and Above'
    ]
    
    return {
        'by_sq_footage': extract_table_data(text, sq_footage, is_currency=True)
    }

def extract_pct_list_price(text):
    """Extract percent of original list price received from page 5."""
    price_ranges = [
        '$250,000 and Below',
        '$250,001 to $500,000',
        '$500,001 to $750,000',
        '$750,001 to $1,000,000',
        '$1,000,001 to $1,250,000',
        '$1,250,001 to $2,000,000',
        '$2,000,001 to $5,000,000',
        '$5,000,001 and Above'
    ]
    
    results = []
    for category in price_ranges:
        escaped = re.escape(category)
        # Pattern for percentage values like "96.3% 97.3% + 1.0%"
        pattern = rf'{escaped}\s+([\d.]+)%\s+([\d.]+)%\s+([+-])?\s*([\d.]+)%?\s+([\d.]+)%\s+([\d.]+)%\s+([+-])?\s*([\d.]+)%?\s+([\d.]+)%\s+([\d.]+)%\s+([+-])?\s*([\d.]+)%'
        match = re.search(pattern, text)
        if match:
            results.append({
                'category': category,
                'all_properties': {
                    '2025': float(match.group(1)),
                    '2026': float(match.group(2)),
                    'change': parse_pct(match.group(3), match.group(4))
                },
                'single_family': {
                    '2025': float(match.group(5)),
                    '2026': float(match.group(6)),
                    'change': parse_pct(match.group(7), match.group(8))
                },
                'condos': {
                    '2025': float(match.group(9)),
                    '2026': float(match.group(10)),
                    'change': parse_pct(match.group(11), match.group(12))
                }
            })
    
    return {'by_price_range': results}

def extract_days_on_market(text):
    """Extract days on market data from page 6."""
    price_ranges = [
        '$250,000 and Below',
        '$250,001 to $500,000',
        '$500,001 to $750,000',
        '$750,001 to $1,000,000',
        '$1,000,001 to $1,250,000',
        '$1,250,001 to $2,000,000',
        '$2,000,001 to $5,000,000',
        '$5,000,001 and Above'
    ]
    
    sq_footage = [
        '1,500 Sq Ft and Below',
        '1,501 to 2,000 Sq Ft',
        '2,001 to 3,000 Sq Ft',
        '3,001 to 4,000 Sq Ft',
        '4,001 to 6,000 Sq Ft',
        '6,001 Sq Ft and Above'
    ]
    
    return {
        'by_price_range': extract_table_data(text, price_ranges),
        'by_sq_footage': extract_table_data(text, sq_footage)
    }

def extract_inventory(text):
    """Extract inventory of homes for sale from page 7."""
    price_ranges = [
        '$250,000 and Below',
        '$250,001 to $500,000',
        '$500,001 to $750,000',
        '$750,001 to $1,000,000',
        '$1,000,001 to $1,250,000',
        '$1,250,001 to $2,000,000',
        '$2,000,001 to $5,000,000',
        '$5,000,001 and Above'
    ]
    
    sq_footage = [
        '1,500 Sq Ft and Below',
        '1,501 to 2,000 Sq Ft',
        '2,001 to 3,000 Sq Ft',
        '3,001 to 4,000 Sq Ft',
        '4,001 to 6,000 Sq Ft',
        '6,001 Sq Ft and Above'
    ]
    
    return {
        'by_price_range': extract_table_data(text, price_ranges),
        'by_sq_footage': extract_table_data(text, sq_footage)
    }

def extract_months_supply(text):
    """Extract months supply of inventory from page 8."""
    price_ranges = [
        '$250,000 and Below',
        '$250,001 to $500,000',
        '$500,001 to $750,000',
        '$750,001 to $1,000,000',
        '$1,000,001 to $1,250,000',
        '$1,250,001 to $2,000,000',
        '$2,000,001 to $5,000,000',
        '$5,000,001 and Above'
    ]
    
    results = []
    for category in price_ranges:
        escaped = re.escape(category)
        # Pattern for decimal months like "3.3 1.9 - 42.4%"
        pattern = rf'{escaped}\s+([\d.]+)\s+([\d.]+)\s+([+-])?\s*([\d.]+)%?\s+([\d.]+)\s+([\d.]+)\s+([+-])?\s*([\d.]+)%?\s+([\d.]+)\s+([\d.]+)\s+([+-])?\s*([\d.]+)%'
        match = re.search(pattern, text)
        if match:
            results.append({
                'category': category,
                'all_properties': {
                    '2025': float(match.group(1)),
                    '2026': float(match.group(2)),
                    'change': parse_pct(match.group(3), match.group(4))
                },
                'single_family': {
                    '2025': float(match.group(5)),
                    '2026': float(match.group(6)),
                    'change': parse_pct(match.group(7), match.group(8))
                },
                'condos': {
                    '2025': float(match.group(9)),
                    '2026': float(match.group(10)),
                    'change': parse_pct(match.group(11), match.group(12))
                }
            })
    
    return {'by_price_range': results}

def extract_summary(text):
    """Extract quick facts summary from page 1."""
    summary = {}
    
    # Look for quick facts percentages (5.6%, 6.7%, 0.0%)
    match = re.search(r'\+?\s*([\d.]+)%\s+\+?\s*([\d.]+)%\s+[-+]?\s*([\d.]+)%', text)
    if match:
        summary['pending_sales_change'] = float(match.group(1))
        summary['inventory_change'] = float(match.group(2))
        summary['months_supply_change'] = float(match.group(3))
    
    return summary

def parse_supply_pdf(pdf_path):
    """Parse the entire Housing Supply Overview PDF."""
    result = {
        'meta': {
            'generated': datetime.now().isoformat(),
            'source': 'SDAR Housing Supply Overview Report',
            'report_period': 'January 2026'
        }
    }
    
    with pdfplumber.open(pdf_path) as pdf:
        # Page 1 - Quick Facts
        if len(pdf.pages) >= 1:
            text = pdf.pages[0].extract_text() or ''
            result['summary'] = extract_summary(text)
        
        # Page 2 - Pending Sales
        if len(pdf.pages) >= 2:
            text = pdf.pages[1].extract_text() or ''
            result['pending_sales'] = extract_pending_sales(text)
        
        # Page 3 - Closed Sales
        if len(pdf.pages) >= 3:
            text = pdf.pages[2].extract_text() or ''
            result['closed_sales'] = extract_closed_sales(text)
        
        # Page 4 - Median Sales Price
        if len(pdf.pages) >= 4:
            text = pdf.pages[3].extract_text() or ''
            result['median_price'] = extract_median_price(text)
        
        # Page 5 - Percent of Original List Price
        if len(pdf.pages) >= 5:
            text = pdf.pages[4].extract_text() or ''
            result['pct_list_price'] = extract_pct_list_price(text)
        
        # Page 6 - Days on Market
        if len(pdf.pages) >= 6:
            text = pdf.pages[5].extract_text() or ''
            result['days_on_market'] = extract_days_on_market(text)
        
        # Page 7 - Inventory
        if len(pdf.pages) >= 7:
            text = pdf.pages[6].extract_text() or ''
            result['inventory'] = extract_inventory(text)
        
        # Page 8 - Months Supply
        if len(pdf.pages) >= 8:
            text = pdf.pages[7].extract_text() or ''
            result['months_supply'] = extract_months_supply(text)
    
    return result

def main():
    """Main function."""
    reports_dir = Path(__file__).parent.parent / "sdar_reports" / "January 2026"
    pdf_path = reports_dir / "Supply Overview.pdf"
    output_path = Path(__file__).parent.parent / "public" / "data" / "housing_supply_data.json"
    
    if not pdf_path.exists():
        print(f"PDF not found: {pdf_path}")
        return
    
    print(f"Parsing: {pdf_path}")
    data = parse_supply_pdf(pdf_path)
    
    # Print summary
    print(f"\n=== Summary ===")
    print(f"Pending Sales sections: {len(data.get('pending_sales', {}).get('by_price_range', []))}")
    print(f"Closed Sales sections: {len(data.get('closed_sales', {}).get('by_price_range', []))}")
    print(f"Inventory sections: {len(data.get('inventory', {}).get('by_price_range', []))}")
    print(f"Months Supply sections: {len(data.get('months_supply', {}).get('by_price_range', []))}")
    
    # Save to JSON
    output_path.parent.mkdir(parents=True, exist_ok=True)
    with open(output_path, 'w') as f:
        json.dump(data, f, indent=2)
    
    print(f"\nSaved to: {output_path}")

if __name__ == "__main__":
    main()
