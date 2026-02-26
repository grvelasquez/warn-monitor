import requests
import json
import sys

FRED_API_KEY = "a72b02db4318645167d222b3d497ae02"
FRED_BASE_URL = "https://api.stlouisfed.org/fred/series/search"

def search_fred(query):
    params = {
        "search_text": query,
        "api_key": FRED_API_KEY,
        "file_type": "json",
    }
    response = requests.get(FRED_BASE_URL, params=params)
    data = response.json()
    for s in data.get("seriess", [])[:15]:
        print(f"ID: {s['id']} | Title: {s['title']} | Freq: {s['frequency_short']}")

if __name__ == "__main__":
    search_fred("ATNHPIUS41940Q")
