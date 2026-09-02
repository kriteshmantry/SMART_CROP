import requests, json

r = requests.post('http://127.0.0.1:8000/api/price-forecast', json={'crop': 'Groundnut', 'district': 'Angul'})
d = r.json()

# Print without the big price_history array
summary = {k: v for k, v in d.items() if k != 'price_history'}
print(json.dumps(summary, indent=2))
print(f"History data points: {len(d.get('price_history', []))}")
