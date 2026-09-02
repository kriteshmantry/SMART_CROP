import pandas as pd
import json

obs = pd.read_csv('odisha_crop_observations_for_recommendation_fixed.csv')
geo = pd.read_csv('odisha_district_geography_fixed.csv')
weather = pd.read_csv('odisha_weather_master_ml_fixed.csv')
soil = pd.read_csv('odisha_district_soil_fertility_categories_fixed.csv')

# District Soil averages from observation data
district_soil = obs.groupby('district_name').agg({
    'nitrogen': 'mean',
    'phosphorus': 'mean',
    'potassium': 'mean',
    'soil_ph': 'mean'
}).reset_index()

# District Weather seasonal averages
weather['agri_season'] = weather['season'].map({
    'Monsoon': 'Kharif',
    'Post-Monsoon': 'Kharif',
    'Winter': 'Rabi',
    'Pre-Monsoon': 'Summer'
}).fillna('Kharif')

district_climate = weather.groupby(['district_name', 'agri_season']).agg({
    'rainfall_mm': lambda x: round(x.sum() / 10, 1), # average annual/seasonal total
    'temperature_mean_c': 'mean',
    'relative_humidity_percent': 'mean'
}).reset_index()

print("District Soil Defaults:")
print(district_soil.head(5))

# Export complete District Profiles JSON for backend & frontend
profiles = {}
for _, drow in geo.iterrows():
    dname = drow['district_name']
    d_lat = float(drow['latitude'])
    d_lon = float(drow['longitude'])
    d_elev = float(drow['elevation_m'])
    d_zone = drow['agro_climatic_zone']
    d_coastal = drow['coastal_status']
    
    # Soil defaults
    s_match = district_soil[district_soil['district_name'] == dname]
    if len(s_match) > 0:
        n_val = round(float(s_match['nitrogen'].values[0]), 1)
        p_val = round(float(s_match['phosphorus'].values[0]), 1)
        k_val = round(float(s_match['potassium'].values[0]), 1)
        ph_val = round(float(s_match['soil_ph'].values[0]), 2)
    else:
        n_val, p_val, k_val, ph_val = 55.0, 32.0, 45.0, 6.4
        
    # Climate defaults per season
    clim_dict = {}
    for s_name in ['Kharif', 'Rabi', 'Summer']:
        c_match = district_climate[(district_climate['district_name'] == dname) & (district_climate['agri_season'] == s_name)]
        if len(c_match) > 0:
            rain_val = round(float(c_match['rainfall_mm'].values[0]), 1)
            temp_val = round(float(c_match['temperature_mean_c'].values[0]), 1)
            hum_val = round(float(c_match['relative_humidity_percent'].values[0]), 1)
        else:
            rain_val, temp_val, hum_val = 1100.0 if s_name == 'Kharif' else 150.0, 27.0, 75.0
            
        clim_dict[s_name] = {
            'rainfall': rain_val,
            'temperature': temp_val,
            'humidity': hum_val
        }
        
    profiles[dname] = {
        'latitude': d_lat,
        'longitude': d_lon,
        'elevation': d_elev,
        'agro_climatic_zone': d_zone,
        'coastal_status': d_coastal,
        'soil': {
            'N': n_val,
            'P': p_val,
            'K': k_val,
            'pH': ph_val
        },
        'seasons': clim_dict
    }

with open('odisha_district_profiles.json', 'w') as f:
    json.dump(profiles, f, indent=2)

print(f"Exported {len(profiles)} district profiles to odisha_district_profiles.json")
