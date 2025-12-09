#!/usr/bin/env python3
"""
WARN Data Fetcher for San Diego County
Downloads California EDD WARN data and filters for San Diego County.
Outputs JSON for the React dashboard.
"""

import json
import hashlib
import requests
import pandas as pd
from datetime import datetime
from pathlib import Path

# California EDD WARN Report URL
WARN_URL = "https://edd.ca.gov/siteassets/files/jobs_and_training/warn/warn_report1.xlsx"

# San Diego zip code to region and neighborhood mapping
SD_ZIP_INFO = {
    # Central San Diego
    "92101": {"region": "Central San Diego", "neighborhood": "Downtown", "city": "San Diego"},
    "92102": {"region": "Central San Diego", "neighborhood": "Golden Hill", "city": "San Diego"},
    "92103": {"region": "Central San Diego", "neighborhood": "Hillcrest", "city": "San Diego"},
    "92104": {"region": "Central San Diego", "neighborhood": "North Park", "city": "San Diego"},
    "92105": {"region": "Central San Diego", "neighborhood": "City Heights", "city": "San Diego"},
    "92106": {"region": "Central San Diego", "neighborhood": "Point Loma", "city": "San Diego"},
    "92107": {"region": "Central San Diego", "neighborhood": "Ocean Beach", "city": "San Diego"},
    "92108": {"region": "Central San Diego", "neighborhood": "Mission Valley", "city": "San Diego"},
    "92109": {"region": "Central San Diego", "neighborhood": "Pacific Beach", "city": "San Diego"},
    "92110": {"region": "Central San Diego", "neighborhood": "Old Town", "city": "San Diego"},
    "92111": {"region": "Central San Diego", "neighborhood": "Linda Vista", "city": "San Diego"},
    "92113": {"region": "Central San Diego", "neighborhood": "Logan Heights", "city": "San Diego"},
    "92114": {"region": "Central San Diego", "neighborhood": "Encanto", "city": "San Diego"},
    "92115": {"region": "Central San Diego", "neighborhood": "College Area", "city": "San Diego"},
    "92116": {"region": "Central San Diego", "neighborhood": "Normal Heights", "city": "San Diego"},
    "92117": {"region": "Central San Diego", "neighborhood": "Clairemont", "city": "San Diego"},
    "92118": {"region": "South Bay", "neighborhood": "Coronado", "city": "Coronado"},
    "92119": {"region": "Central San Diego", "neighborhood": "San Carlos", "city": "San Diego"},
    "92120": {"region": "Central San Diego", "neighborhood": "Grantville", "city": "San Diego"},
    "92121": {"region": "Central San Diego", "neighborhood": "Sorrento Valley", "city": "San Diego"},
    "92122": {"region": "Central San Diego", "neighborhood": "University City", "city": "San Diego"},
    "92123": {"region": "Central San Diego", "neighborhood": "Kearny Mesa", "city": "San Diego"},
    "92124": {"region": "Central San Diego", "neighborhood": "Tierrasanta", "city": "San Diego"},
    "92126": {"region": "Central San Diego", "neighborhood": "Mira Mesa", "city": "San Diego"},
    "92127": {"region": "North County Inland", "neighborhood": "Rancho Bernardo", "city": "San Diego"},
    "92128": {"region": "North County Inland", "neighborhood": "Rancho Bernardo", "city": "San Diego"},
    "92129": {"region": "Central San Diego", "neighborhood": "Rancho Peñasquitos", "city": "San Diego"},
    "92130": {"region": "Central San Diego", "neighborhood": "Carmel Valley", "city": "San Diego"},
    "92131": {"region": "Central San Diego", "neighborhood": "Scripps Ranch", "city": "San Diego"},
    "92037": {"region": "Central San Diego", "neighborhood": "La Jolla", "city": "San Diego"},
    "92014": {"region": "North County Coastal", "neighborhood": "Del Mar", "city": "Del Mar"},
    
    # South Bay
    "91901": {"region": "East County", "neighborhood": "Alpine", "city": "Alpine"},
    "91902": {"region": "South Bay", "neighborhood": "Bonita", "city": "Bonita"},
    "91910": {"region": "South Bay", "neighborhood": "Chula Vista", "city": "Chula Vista"},
    "91911": {"region": "South Bay", "neighborhood": "Chula Vista", "city": "Chula Vista"},
    "91913": {"region": "South Bay", "neighborhood": "Eastlake", "city": "Chula Vista"},
    "91914": {"region": "South Bay", "neighborhood": "Eastlake", "city": "Chula Vista"},
    "91915": {"region": "South Bay", "neighborhood": "Otay Ranch", "city": "Chula Vista"},
    "91932": {"region": "South Bay", "neighborhood": "Imperial Beach", "city": "Imperial Beach"},
    "91941": {"region": "East County", "neighborhood": "La Mesa", "city": "La Mesa"},
    "91942": {"region": "East County", "neighborhood": "La Mesa", "city": "La Mesa"},
    "91945": {"region": "South Bay", "neighborhood": "Lemon Grove", "city": "Lemon Grove"},
    "91950": {"region": "South Bay", "neighborhood": "National City", "city": "National City"},
    "91977": {"region": "South Bay", "neighborhood": "Spring Valley", "city": "Spring Valley"},
    "91978": {"region": "South Bay", "neighborhood": "Spring Valley", "city": "Spring Valley"},
    "92154": {"region": "South Bay", "neighborhood": "Otay Mesa", "city": "San Diego"},
    "92173": {"region": "South Bay", "neighborhood": "San Ysidro", "city": "San Diego"},
    
    # North County Coastal
    "92007": {"region": "North County Coastal", "neighborhood": "Cardiff", "city": "Encinitas"},
    "92008": {"region": "North County Coastal", "neighborhood": "Carlsbad", "city": "Carlsbad"},
    "92009": {"region": "North County Coastal", "neighborhood": "Carlsbad", "city": "Carlsbad"},
    "92010": {"region": "North County Coastal", "neighborhood": "Carlsbad", "city": "Carlsbad"},
    "92011": {"region": "North County Coastal", "neighborhood": "Carlsbad", "city": "Carlsbad"},
    "92024": {"region": "North County Coastal", "neighborhood": "Encinitas", "city": "Encinitas"},
    "92054": {"region": "North County Coastal", "neighborhood": "Oceanside", "city": "Oceanside"},
    "92056": {"region": "North County Coastal", "neighborhood": "Oceanside", "city": "Oceanside"},
    "92057": {"region": "North County Coastal", "neighborhood": "Oceanside", "city": "Oceanside"},
    "92058": {"region": "North County Coastal", "neighborhood": "Oceanside", "city": "Oceanside"},
    "92075": {"region": "North County Coastal", "neighborhood": "Solana Beach", "city": "Solana Beach"},
    
    # North County Inland
    "92025": {"region": "North County Inland", "neighborhood": "Escondido", "city": "Escondido"},
    "92026": {"region": "North County Inland", "neighborhood": "Escondido", "city": "Escondido"},
    "92027": {"region": "North County Inland", "neighborhood": "Escondido", "city": "Escondido"},
    "92028": {"region": "North County Inland", "neighborhood": "Fallbrook", "city": "Fallbrook"},
    "92029": {"region": "North County Inland", "neighborhood": "Escondido", "city": "Escondido"},
    "92064": {"region": "North County Inland", "neighborhood": "Poway", "city": "Poway"},
    "92065": {"region": "North County Inland", "neighborhood": "Ramona", "city": "Ramona"},
    "92069": {"region": "North County Inland", "neighborhood": "San Marcos", "city": "San Marcos"},
    "92078": {"region": "North County Inland", "neighborhood": "San Marcos", "city": "San Marcos"},
    "92081": {"region": "North County Inland", "neighborhood": "Vista", "city": "Vista"},
    "92083": {"region": "North County Inland", "neighborhood": "Vista", "city": "Vista"},
    "92084": {"region": "North County Inland", "neighborhood": "Vista", "city": "Vista"},
    
    # East County
    "92019": {"region": "East County", "neighborhood": "El Cajon", "city": "El Cajon"},
    "92020": {"region": "East County", "neighborhood": "El Cajon", "city": "El Cajon"},
    "92021": {"region": "East County", "neighborhood": "El Cajon", "city": "El Cajon"},
    "92040": {"region": "East County", "neighborhood": "Lakeside", "city": "Lakeside"},
    "92071": {"region": "East County", "neighborhood": "Santee", "city": "Santee"},
}

def get_zip_info(zipcode: str) -> dict:
    """Get region, neighborhood, and city for a San Diego zip code."""
    default = {"region": "San Diego County", "neighborhood": "San Diego", "city": "San Diego"}
    return SD_ZIP_INFO.get(str(zipcode)[:5], default)

def get_region(zipcode: str) -> str:
    """Get region for a San Diego zip code."""
    return get_zip_info(zipcode)["region"]

def calculate_risk_score(employees: int, notice_type: str) -> tuple:
    """Calculate risk score and level based on employees affected and notice type."""
    base_score = min(100, employees // 5)
    
    # Adjust for notice type
    if notice_type and "closure" in notice_type.lower():
        base_score = min(100, base_score + 20)
    elif notice_type and "relocation" in notice_type.lower():
        base_score = min(100, base_score + 15)
    
    # Determine risk level
    if base_score >= 70:
        level = "Critical"
    elif base_score >= 50:
        level = "High"
    elif base_score >= 25:
        level = "Moderate"
    else:
        level = "Low"
    
    return base_score, level

def fetch_warn_data():
    """Download WARN data from California EDD."""
    print(f"Downloading WARN data from {WARN_URL}")
    response = requests.get(WARN_URL, timeout=60)
    response.raise_for_status()
    return response.content

def parse_warn_data(excel_content: bytes) -> pd.DataFrame:
    """Parse WARN Excel file into DataFrame."""
    from io import BytesIO
    print("Parsing Excel data...")
    
    # The EDD Excel file has multiple sheets - we need the "Detailed WARN Report" sheet
    xl = pd.ExcelFile(BytesIO(excel_content), engine='openpyxl')
    
    # Find the detailed report sheet
    target_sheet = None
    for sheet_name in xl.sheet_names:
        if 'detailed' in sheet_name.lower():
            target_sheet = sheet_name
            break
    
    if target_sheet is None:
        # Fallback to first sheet if detailed not found
        target_sheet = xl.sheet_names[0] if xl.sheet_names else None
        print(f"Warning: 'Detailed WARN Report' sheet not found. Using: {target_sheet}")
    else:
        print(f"Reading sheet: {target_sheet}")
    
    # Skip the first row (contains description text), use row 1 as headers
    df = pd.read_excel(xl, sheet_name=target_sheet, header=1)
    
    # Standardize column names (handle variations in EDD formatting)
    df.columns = df.columns.astype(str).str.strip().str.lower().str.replace(' ', '_')
    
    print(f"Columns found: {list(df.columns)}")
    
    return df

def filter_san_diego(df: pd.DataFrame) -> pd.DataFrame:
    """Filter DataFrame for San Diego County notices."""
    # Look for county column (may be named differently)
    county_cols = [c for c in df.columns if 'county' in c.lower()]
    
    if not county_cols:
        print("Warning: No county column found. Attempting to filter by city/address.")
        return df
    
    county_col = county_cols[0]
    
    # Filter for San Diego County (case-insensitive)
    sd_df = df[df[county_col].astype(str).str.lower().str.contains('san diego', na=False)]
    
    print(f"Found {len(sd_df)} San Diego County notices")
    return sd_df

def process_notices(df: pd.DataFrame) -> dict:
    """Process filtered DataFrame into dashboard-ready JSON structure."""
    notices = []
    risk_scores = {}
    by_region = {}
    total_employees = 0
    
    # EDD columns have newlines - normalize them
    # Actual columns: 'county/parish', 'notice\ndate', 'processed\ndate', 'effective_\ndate', 
    #                 'company', 'layoff/\nclosure', 'no._of\nemployees', 'address', 'related_industry'
    
    # Function to find column with partial match (handles newlines)
    def find_col(df, patterns):
        for pattern in patterns:
            for col in df.columns:
                # Remove newlines for matching
                col_clean = col.replace('\n', '').replace('\r', '')
                if pattern in col_clean.lower():
                    return col
        return None
    
    company_col = find_col(df, ['company'])
    employees_col = find_col(df, ['no._of', 'employees', 'no_of'])
    layoff_date_col = find_col(df, ['effective_', 'effective'])
    notice_type_col = find_col(df, ['layoff/', 'closure', 'layoff'])
    address_col = find_col(df, ['address'])
    
    print(f"Using columns - company: {company_col}, employees: {employees_col}, date: {layoff_date_col}, type: {notice_type_col}, address: {address_col}")
    
    import re
    def parse_address(address_str):
        """Extract city and zip from address like '8695 Spectrum Center Blvd.  San Diego CA 92123'"""
        if pd.isna(address_str):
            return 'San Diego', '92101'
        
        address = str(address_str).strip()
        
        # Try to extract zip code (5 digits at end)
        zip_match = re.search(r'\b(\d{5})(?:-\d{4})?\s*$', address)
        zipcode = zip_match.group(1) if zip_match else '92101'
        
        # Try to extract city (word before state abbreviation)
        # Pattern: City Name CA or City Name, CA
        city_match = re.search(r'([A-Za-z\s]+?)(?:,?\s+CA)\s+\d{5}', address)
        if city_match:
            city = city_match.group(1).strip()
            # Clean up common artifacts
            city = re.sub(r'\s+', ' ', city)
            # Remove street suffix if it got captured
            if city.lower().endswith(('blvd', 'st', 'ave', 'dr', 'rd', 'way', 'ln', 'pl', 'ct')):
                parts = city.split()
                if len(parts) > 1:
                    city = ' '.join(parts[-2:]) if parts[-2][0].isupper() else parts[-1]
        else:
            city = 'San Diego'
        
        return city, zipcode
    
    for idx, row in df.iterrows():
        try:
            company = str(row.get(company_col, 'Unknown Company')).strip() if company_col else 'Unknown'
            
            # Parse address for city and zip
            address = row.get(address_col) if address_col else None
            city, zipcode = parse_address(address)
            
            # Handle employees count
            employees = 0
            if employees_col and pd.notna(row.get(employees_col)):
                try:
                    employees = int(float(row.get(employees_col, 0)))
                except (ValueError, TypeError):
                    employees = 0
            
            # Handle layoff date
            layoff_date = None
            if layoff_date_col and pd.notna(row.get(layoff_date_col)):
                try:
                    date_val = row.get(layoff_date_col)
                    if isinstance(date_val, datetime):
                        layoff_date = date_val.strftime('%Y-%m-%d')
                    else:
                        layoff_date = pd.to_datetime(date_val).strftime('%Y-%m-%d')
                except:
                    layoff_date = datetime.now().strftime('%Y-%m-%d')
            else:
                layoff_date = datetime.now().strftime('%Y-%m-%d')
            
            notice_type = str(row.get(notice_type_col, 'Layoff')).strip() if notice_type_col else 'Layoff'
            
            # Get neighborhood and region info from zip code mapping
            zip_info = get_zip_info(zipcode)
            region = zip_info["region"]
            neighborhood = zip_info["neighborhood"]
            city_name = zip_info["city"]
            score, risk_level = calculate_risk_score(employees, notice_type)
            
            # Generate unique ID
            notice_id = hashlib.md5(f"{company}{city_name}{layoff_date}".encode()).hexdigest()[:8]
            
            notice = {
                "notice_id": notice_id,
                "company_name": company,
                "city": city_name,
                "zipcode": zipcode,
                "employees_affected": employees,
                "layoff_date": layoff_date,
                "notice_type": notice_type,
                "region": region,
                "neighborhood": neighborhood,
            }
            notices.append(notice)
            total_employees += employees
            
            # Aggregate risk scores by zip
            if zipcode not in risk_scores:
                risk_scores[zipcode] = {
                    "score": score,
                    "risk_level": risk_level,
                    "total_employees": employees,
                    "factors": []
                }
            else:
                risk_scores[zipcode]["total_employees"] += employees
                # Recalculate risk based on total
                new_score, new_level = calculate_risk_score(
                    risk_scores[zipcode]["total_employees"], 
                    notice_type
                )
                risk_scores[zipcode]["score"] = new_score
                risk_scores[zipcode]["risk_level"] = new_level
            
            # Add factors
            if employees > 0:
                factor = f"{employees} employees affected"
                if factor not in risk_scores[zipcode]["factors"]:
                    risk_scores[zipcode]["factors"].append(factor)
            if "closure" in notice_type.lower():
                if "Plant closure" not in risk_scores[zipcode]["factors"]:
                    risk_scores[zipcode]["factors"].append("Plant closure")
            if "relocation" in notice_type.lower():
                if "Relocation out of area" not in risk_scores[zipcode]["factors"]:
                    risk_scores[zipcode]["factors"].append("Relocation out of area")
            
            # Aggregate by region
            if region not in by_region:
                by_region[region] = {"notice_count": 0, "total_employees": 0}
            by_region[region]["notice_count"] += 1
            by_region[region]["total_employees"] += employees
            
        except Exception as e:
            print(f"Warning: Could not process row {idx}: {e}")
            continue
    
    return {
        "meta": {
            "generated": datetime.now().isoformat(),
            "county": "San Diego",
            "total_notices": len(notices),
            "total_employees_affected": total_employees,
        },
        "notices": notices,
        "risk_scores": risk_scores,
        "by_region": by_region,
    }

def main():
    """Main function to fetch and process WARN data."""
    output_path = Path(__file__).parent.parent / "public" / "data" / "warn_data.json"
    
    try:
        # Fetch data
        excel_content = fetch_warn_data()
        
        # Parse Excel
        df = parse_warn_data(excel_content)
        print(f"Total notices in file: {len(df)}")
        
        # Filter for San Diego
        sd_df = filter_san_diego(df)
        
        if len(sd_df) == 0:
            print("No San Diego County notices found. Creating empty data file.")
            result = {
                "meta": {
                    "generated": datetime.now().isoformat(),
                    "county": "San Diego",
                    "total_notices": 0,
                    "total_employees_affected": 0,
                },
                "notices": [],
                "risk_scores": {},
                "by_region": {},
            }
        else:
            # Process notices
            result = process_notices(sd_df)
        
        # Write JSON output
        output_path.parent.mkdir(parents=True, exist_ok=True)
        with open(output_path, 'w', encoding='utf-8') as f:
            json.dump(result, f, indent=2)
        
        print(f"Successfully wrote {result['meta']['total_notices']} notices to {output_path}")
        print(f"Total employees affected: {result['meta']['total_employees_affected']}")
        
    except requests.RequestException as e:
        print(f"Error fetching WARN data: {e}")
        raise
    except Exception as e:
        print(f"Error processing WARN data: {e}")
        raise

if __name__ == "__main__":
    main()
