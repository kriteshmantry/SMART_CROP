from services.crop_recommendation_service import recommend_crop
import json

print("=== TEST CASE 1: High N, High Rainfall (Rice scenario in Cuttack) ===")
res1 = recommend_crop(N=90, P=45, K=65, ph=6.4, district="Cuttack", rainfall=1350, temperature=28.0, humidity=82.0)
print(json.dumps(res1, indent=2))

print("\n=== TEST CASE 2: Low N Legume, Moderate Rainfall (Groundnut / Moong in Balangir) ===")
res2 = recommend_crop(N=28, P=38, K=42, ph=6.2, district="Balangir", rainfall=520, temperature=27.0, humidity=65.0)
print(json.dumps(res2, indent=2))

print("\n=== TEST CASE 3: Winter / Cool Season, High N & P (Potato in Koraput) ===")
res3 = recommend_crop(N=85, P=65, K=80, ph=5.8, district="Koraput", season="Rabi", rainfall=180, temperature=18.0, humidity=60.0)
print(json.dumps(res3, indent=2))

print("\n=== TEST CASE 4: GPS Coordinates (Puri Coast: 19.81, 85.83) ===")
res4 = recommend_crop(N=80, P=42, K=50, ph=6.5, latitude=19.81, longitude=85.83)
print(json.dumps(res4, indent=2))
