import pandas as pd
import json

agro = pd.read_csv('odisha_crop_agronomic_requirements_fixed.csv')
print("=== AGRONOMIC DATA ===")
for _, r in agro.iterrows():
    print(f"Crop: {r['crop_name']} | Season: {r['season_name']} | Sowing: {r['sowing_start_month']}-{r['sowing_end_month']} | Harvest: {r['harvesting_start_month']}-{r['harvesting_end_month']}")
    print(f"  Temp: {r['optimal_temperature_min_c']} to {r['optimal_temperature_max_c']} C | Rain: {r['optimal_rainfall_min_mm']} to {r['optimal_rainfall_max_mm']} mm")
    print(f"  pH: {r['soil_ph_min']} to {r['soil_ph_max']} | N: {r['nitrogen_requirement']} | P: {r['phosphorus_requirement']} | K: {r['potassium_requirement']} | Water: {r['water_requirement_mm']} mm")
    print()

weather = pd.read_csv('odisha_weather_master_ml_fixed.csv')
print("=== WEATHER SUMMARY ===")
print("Date range:", weather['date'].min(), "to", weather['date'].max())
print("Columns in weather:", weather.columns.tolist())
print(weather.groupby(['district_name', 'season'])[['rainfall_mm', 'temperature_mean_c', 'relative_humidity_percent']].mean().head(10))
