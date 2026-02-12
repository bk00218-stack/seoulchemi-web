# -*- coding: utf-8 -*-
import json
import requests

# Load stores data
with open('stores_import.json', 'r', encoding='utf-8') as f:
    stores = json.load(f)

print(f"Loaded {len(stores)} stores")

# Call the import API
url = 'https://seoulchemi-web.vercel.app/api/stores/import'

payload = {
    'stores': stores,
    'deleteExisting': True
}

print(f"Calling {url}...")
print("This may take a few minutes...")

response = requests.post(
    url,
    json=payload,
    headers={'Content-Type': 'application/json'},
    timeout=300  # 5 minute timeout
)

print(f"Status: {response.status_code}")
print(f"Response: {response.text[:2000]}")
