import json
import os
from datetime import datetime

# Path setups
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DATA_PATH = os.path.join(BASE_DIR, 'public', 'data', 'sdar_neighborhood_data.json')
OUTPUT_PATH = os.path.join(BASE_DIR, 'public', 'data', 'neighborhood_analysis.json')

def load_data():
    with open(DATA_PATH, 'r', encoding='utf-8') as f:
        return json.load(f)

def format_price(price):
    if not price: return "N/A"
    return f"${price:,.0f}"

def calculate_percent_change(current, previous):
    if not current or not previous or previous == 0:
        return 0.0
    return ((current - previous) / previous) * 100

def get_market_type(months_supply):
    if months_supply is None: return "market"
    if months_supply < 2:
        return "extreme seller's market"
    elif months_supply < 4:
        return "seller's market"
    elif months_supply < 6:
        return "balanced market"
    else:
        return "buyer's market"

def generate_property_analysis(metrics, prop_type_name):
    if not metrics:
        return f"Insufficient data available for {prop_type_name} analysis."

    price = metrics.get('median_price_2025')
    price_change = metrics.get('price_change_ytd')
    inventory = metrics.get('inventory_2025')
    inventory_change = metrics.get('inv_change')
    dom = metrics.get('dom_2025')
    dom_change = metrics.get('dom_change')
    sales = metrics.get('closed_sales_2025')
    listings = metrics.get('new_listings_2025')
    
    # Calculate months supply if not present (simple approximation)
    months_supply = None
    if sales and sales > 0:
        months_supply = inventory / (sales / 12) if sales else 0
        months_supply = round(months_supply, 1)

    market_type = get_market_type(months_supply)
    
    # Build Narrative
    narrative = []
    
    # 1. Price Context
    if price_change and price_change > 5:
        narrative.append(f"The {prop_type_name} segment remains robust, with the median price appreciating {price_change}% to {format_price(price)}.")
    elif price_change and price_change < -5:
        narrative.append(f"The {prop_type_name} market is correcting, showing a {abs(price_change)}% decline in median price to {format_price(price)}.")
    elif price:
        narrative.append(f"Prices in the {prop_type_name} sector have stabilized at {format_price(price)}, reflecting a {price_change if price_change else 0}% shift year-over-year.")
    else:
        narrative.append(f"Pricing data for {prop_type_name} properties is currently limited.")

    # 2. Inventory & Velocity
    if inventory == 0:
         narrative.append("Inventory is non-existent with zero active listings, making new opportunities extremely rare.")
    elif inventory_change and inventory_change < -20:
        narrative.append(f"Inventory has tightened significantly ({inventory_change}%), leaving just {inventory} homes on the market.")
    elif inventory_change and inventory_change > 20:
        narrative.append(f"Supply is expanding, with active listings up {inventory_change}% to {inventory} units.")
    else:
        narrative.append(f"Inventory levels are holding steady at {inventory} units.")

    # 3. Time on Market / Comparison
    if dom:
        if dom < 30:
            narrative.append(f"Homes are selling rapidly, averaging just {dom} days on market.")
        elif dom > 60:
            narrative.append(f"Patience is key for sellers, with homes averaging {dom} days to sell.")
        else:
            narrative.append(f"The average time to sell is {dom} days, indicative of a normal transaction pace.")

    # 4. Closing thought based on supply
    if months_supply:
        narrative.append(f"Current conditions point to a {market_type} with approx. {months_supply} months of supply.")

    return " ".join(narrative)

def generate_general_overview(zip_code, data_detached, data_attached):
    # Determine overall tone
    price_trend_sum = 0
    count = 0
    
    if data_detached and 'price_change_ytd' in data_detached:
        price_trend_sum += data_detached['price_change_ytd'] or 0
        count += 1
    if data_attached and 'price_change_ytd' in data_attached:
        price_trend_sum += data_attached['price_change_ytd'] or 0
        count += 1
        
    avg_change = price_trend_sum / count if count > 0 else 0
    
    intro = f"{zip_code} enters 2026 with "
    
    if avg_change > 5:
        intro += "strong momentum as property values continue to climb."
    elif avg_change < -5:
        intro += "buyers finding increased leverage as prices adjust downward."
    else:
        intro += "a steady market environment, showing resilience despite broader economic shifts."
        
    # Mention volume
    total_sales = (data_detached.get('closed_sales_2025', 0) or 0) + (data_attached.get('closed_sales_2025', 0) or 0)
    
    if total_sales == 0:
        intro += " Transaction activity has been very quiet recently."
    elif total_sales < 5:
        intro += " Sales volume remains low, suggesting a pause in activity."
    else:
        intro += " Market activity remains consistent."

    return intro

def main():
    print("Generating AI Analysis for all zip codes...")
    data = load_data()
    analysis_output = {}

    # The data structure is { "meta": ..., "neighborhoods": [ { "zip_code": "...", ... } ] }
    neighborhoods_list = data.get('neighborhoods', [])
    
    for item in neighborhoods_list:
        zip_code = item.get('zip_code')
        if not zip_code: continue
        
        metrics = item # The item itself contains 'detached' and 'attached' keys
        
        detached_data = metrics.get('detached')
        attached_data = metrics.get('attached')
        
        # Skip if absolutely no data (e.g. some region keys might be weird)
        if not detached_data and not attached_data:
            continue

        detached_text = generate_property_analysis(detached_data, "single-family")
        attached_text = generate_property_analysis(attached_data, "condo/townhome")
        
        general_overview = generate_general_overview(zip_code, detached_data, attached_data)
        
        analysis_output[zip_code] = {
            "general_overview": general_overview,
            "detached": detached_text,
            "attached": attached_text
        }

    # Ensure Alpine (91901) uses the specialized/hand-crafted one if we want, 
    # OR we overwrite it to be consistent. 
    # The Prompt said "Now do for all", implying consistent generation. 
    # However, I will preserve the high-quality one if it was manually provided? 
    # Actually, the user said "do for all", so I should probably generate it to match the requested style.
    # BUT, the user liked the previous one. I'll stick to generation for scalability. 
    # If the user wants specific overrides, we can add them later.

    with open(OUTPUT_PATH, 'w', encoding='utf-8') as f:
        json.dump(analysis_output, f, indent=2)
    
    print(f"Successfully generated analysis for {len(analysis_output)} zip codes to {OUTPUT_PATH}")

if __name__ == "__main__":
    main()
