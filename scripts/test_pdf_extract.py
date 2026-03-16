import pdfplumber
import sys

def test_extract(pdf_path):
    print(f"Testing extraction on {pdf_path}")
    try:
        with pdfplumber.open(pdf_path) as pdf:
            print("\n--- Page 2 Text ---")
            text2 = pdf.pages[1].extract_text()
            print(text2)
            print("\n--- Page 3 Text ---")
            text3 = pdf.pages[2].extract_text()
            print(text3)
                
    except Exception as e:
        print(f"Error reading PDF: {e}")

if __name__ == "__main__":
    if len(sys.argv) > 1:
        test_extract(sys.argv[1])
