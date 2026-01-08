
import sys
import json
from pathlib import Path

def extract_text(pdf_path):
    text_content = ""
    try:
        import pypdf
        reader = pypdf.PdfReader(pdf_path)
        for page in reader.pages:
            text_content += page.extract_text() + "\n"
        return text_content
    except ImportError:
        pass

    try:
        import PyPDF2
        reader = PyPDF2.PdfReader(pdf_path)
        for page in reader.pages:
            text_content += page.extract_text() + "\n"
        return text_content
    except ImportError:
        pass
        
    return None

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python extract_pdf.py <path_to_pdf>")
        sys.exit(1)
        
    pdf_path = sys.argv[1]
    text = extract_text(pdf_path)
    
    if text:
        print(text)
    else:
        print("ERROR: Could not import pypdf or PyPDF2. Please install one of them.")
        sys.exit(1)
