#!/usr/bin/env python3
"""
Parse Lender-Mediated Properties Report PDF to extract data.
"""

import pdfplumber
import json

pdf_path = r'c:\Users\grvel\Dashboard\sdar_reports\December 2025\Lender-Mediated Properties Report.pdf'

with pdfplumber.open(pdf_path) as pdf:
    print(f"Total pages: {len(pdf.pages)}")
    
    for i, page in enumerate(pdf.pages[:2]):  # Pages 1-2
        text = page.extract_text()
        print(f"\n{'='*60}")
        print(f"PAGE {i+1}")
        print('='*60)
        if text:
            print(text)
        else:
            print("No text extracted")
        
        # Also try extracting tables
        tables = page.extract_tables()
        if tables:
            print(f"\n--- Tables found: {len(tables)} ---")
            for j, table in enumerate(tables):
                print(f"\nTable {j+1}:")
                for row in table[:10]:  # First 10 rows
                    print(row)
