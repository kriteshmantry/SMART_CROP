import requests
import os

api_key = os.getenv("WEATHERSTACK_API_KEY", "")
url = f'http://api.weatherstack.com/current?access_key={api_key}&query=Cuttack'
print("Sending request...", flush=True)
try:
    res = requests.get(url, timeout=5).json()
    print("Response received:", flush=True)
    print(res, flush=True)
except Exception as e:
    print("Error:", e, flush=True)
