import pdfplumber
import re

# Debug: Extract text from 91945 PDF and show New Listings line
pdf_path = 'sdar_reports/December 2025/91945-LemonGrove.pdf'

with pdfplumber.open(pdf_path) as pdf:
    text = pdf.pages[0].extract_text()
    print("=== Full Text ===")
    print(text)
    print("\n=== Lines with 'New Listings' ===")
    for line in text.split('\n'):
        if 'New Listings' in line or 'Detached' in line or 'Attached' in line:
            print(repr(line))
