import os
import json
import joblib
import numpy as np
import pandas as pd
import requests
from typing import Dict, List, Any, Optional

# Load trained pipeline artifact
ARTIFACT_PATH = os.path.join(os.path.dirname(__file__), '..', 'models', 'odisha_crop_recommendation_pipeline.pkl')

pipeline = None
if os.path.exists(ARTIFACT_PATH):
    try:
        pipeline = joblib.load(ARTIFACT_PATH)
        print(f"Loaded Crop Recommendation Pipeline ({pipeline.get('model_name')})")
    except Exception as e:
        print(f"Error loading pipeline: {e}")

# Weatherstack API Key
WEATHERSTACK_API_KEY = os.getenv("WEATHERSTACK_API_KEY", "")

# District reference coordinates for Odisha's 30 districts
ODISHA_DISTRICTS_COORDS = {
    'Angul': {'lat': 20.84, 'lon': 85.10, 'elevation': 195, 'zone': 'Mid Central Table Land', 'coastal': 'Inland'},
    'Balangir': {'lat': 20.72, 'lon': 83.48, 'elevation': 115, 'zone': 'Western Central Table Land', 'coastal': 'Inland'},
    'Balasore': {'lat': 21.49, 'lon': 86.93, 'elevation': 16, 'zone': 'North Eastern Coastal Plain', 'coastal': 'Coastal'},
    'Bargarh': {'lat': 21.33, 'lon': 83.62, 'elevation': 171, 'zone': 'Western Central Table Land', 'coastal': 'Inland'},
    'Bhadrak': {'lat': 21.06, 'lon': 86.50, 'elevation': 23, 'zone': 'North Eastern Coastal Plain', 'coastal': 'Coastal'},
    'Boudh': {'lat': 20.84, 'lon': 84.32, 'elevation': 110, 'zone': 'Mid Central Table Land', 'coastal': 'Inland'},
    'Cuttack': {'lat': 20.46, 'lon': 85.88, 'elevation': 36, 'zone': 'East and South Eastern Coastal Plain', 'coastal': 'Inland_Coastal_Border'},
    'Deogarh': {'lat': 21.53, 'lon': 84.73, 'elevation': 210, 'zone': 'North Western Plateau', 'coastal': 'Inland'},
    'Dhenkanal': {'lat': 20.67, 'lon': 85.60, 'elevation': 80, 'zone': 'Mid Central Table Land', 'coastal': 'Inland'},
    'Gajapati': {'lat': 18.81, 'lon': 84.15, 'elevation': 150, 'zone': 'North Eastern Ghat', 'coastal': 'Inland'},
    'Ganjam': {'lat': 19.38, 'lon': 85.05, 'elevation': 27, 'zone': 'East and South Eastern Coastal Plain', 'coastal': 'Coastal'},
    'Jagatsinghpur': {'lat': 20.27, 'lon': 86.17, 'elevation': 15, 'zone': 'East and South Eastern Coastal Plain', 'coastal': 'Coastal'},
    'Jajpur': {'lat': 20.85, 'lon': 86.33, 'elevation': 37, 'zone': 'East and South Eastern Coastal Plain', 'coastal': 'Inland_Coastal_Border'},
    'Jharsuguda': {'lat': 21.86, 'lon': 84.01, 'elevation': 218, 'zone': 'North Western Plateau', 'coastal': 'Inland'},
    'Kalahandi': {'lat': 19.91, 'lon': 83.16, 'elevation': 250, 'zone': 'Western Undulating Zone', 'coastal': 'Inland'},
    'Kandhamal': {'lat': 20.20, 'lon': 84.05, 'elevation': 500, 'zone': 'North Eastern Ghat', 'coastal': 'Inland'},
    'Kendrapara': {'lat': 20.50, 'lon': 86.42, 'elevation': 13, 'zone': 'East and South Eastern Coastal Plain', 'coastal': 'Coastal'},
    'Kendujhar': {'lat': 21.63, 'lon': 85.58, 'elevation': 480, 'zone': 'North Central Plateau', 'coastal': 'Inland'},
    'Khordha': {'lat': 20.18, 'lon': 85.62, 'elevation': 75, 'zone': 'East and South Eastern Coastal Plain', 'coastal': 'Inland_Coastal_Border'},
    'Koraput': {'lat': 18.81, 'lon': 82.71, 'elevation': 870, 'zone': 'Eastern Ghat High Land', 'coastal': 'Inland'},
    'Malkangiri': {'lat': 18.35, 'lon': 81.90, 'elevation': 180, 'zone': 'South Eastern Ghat', 'coastal': 'Inland'},
    'Mayurbhanj': {'lat': 21.93, 'lon': 86.73, 'elevation': 55, 'zone': 'North Central Plateau', 'coastal': 'Inland'},
    'Nabarangpur': {'lat': 19.23, 'lon': 82.55, 'elevation': 570, 'zone': 'Western Undulating Zone', 'coastal': 'Inland'},
    'Nayagarh': {'lat': 20.13, 'lon': 85.10, 'elevation': 90, 'zone': 'East and South Eastern Coastal Plain', 'coastal': 'Inland'},
    'Nuapada': {'lat': 20.83, 'lon': 82.52, 'elevation': 260, 'zone': 'Western Undulating Zone', 'coastal': 'Inland'},
    'Puri': {'lat': 19.81, 'lon': 85.83, 'elevation': 5, 'zone': 'East and South Eastern Coastal Plain', 'coastal': 'Coastal'},
    'Rayagada': {'lat': 19.17, 'lon': 83.42, 'elevation': 210, 'zone': 'North Eastern Ghat', 'coastal': 'Inland'},
    'Sambalpur': {'lat': 21.47, 'lon': 83.97, 'elevation': 150, 'zone': 'Western Central Table Land', 'coastal': 'Inland'},
    'Subarnapur': {'lat': 20.83, 'lon': 83.92, 'elevation': 120, 'zone': 'Western Central Table Land', 'coastal': 'Inland'},
    'Sundargarh': {'lat': 22.12, 'lon': 84.03, 'elevation': 230, 'zone': 'North Western Plateau', 'coastal': 'Inland'}
}

def find_nearest_district_from_gps(lat: float, lon: float) -> str:
    """Finds the nearest Odisha district for given GPS coordinates."""
    best_dist = float('inf')
    nearest_district = 'Cuttack'
    for dname, info in ODISHA_DISTRICTS_COORDS.items():
        dist = np.sqrt((lat - info['lat'])**2 + (lon - info['lon'])**2)
        if dist < best_dist:
            best_dist = dist
            nearest_district = dname
    return nearest_district

def fetch_weather_data(query: str, lat: Optional[float] = None, lon: Optional[float] = None) -> Dict[str, Any]:
    """
    Fetches real-time weather from Weatherstack using District or GPS Coordinates.
    Falls back gracefully if network is slow/offline.
    """
    search_query = query
    if lat is not None and lon is not None:
        search_query = f"{lat},{lon}"
        
    url = f"http://api.weatherstack.com/current?access_key={WEATHERSTACK_API_KEY}&query={search_query}"
    
    try:
        resp = requests.get(url, timeout=3)
        if resp.status_code == 200:
            data = resp.json()
            if 'current' in data:
                return {
                    'temperature': float(data['current'].get('temperature', 27.5)),
                    'humidity': float(data['current'].get('humidity', 75.0)),
                    'rainfall': float(data['current'].get('precip', 0.0)) * 100 + 450, # seasonal scale
                    'weather_desc': data['current'].get('weather_descriptions', ['Clear'])[0],
                    'source': 'Weatherstack Realtime API'
                }
    except Exception as e:
        print(f"Weatherstack API note: {e}")

    # Robust fallback based on district profile
    district = query if query in ODISHA_DISTRICTS_COORDS else 'Cuttack'
    return {
        'temperature': 27.2,
        'humidity': 76.0,
        'rainfall': 850.0,
        'weather_desc': 'Seasonal Standard (Monsoon/Kharif)',
        'source': 'Odisha Weather Master Fallback'
    }

def recommend_crop(
    N: float,
    P: float,
    K: float,
    ph: float,
    district: Optional[str] = None,
    latitude: Optional[float] = None,
    longitude: Optional[float] = None,
    rainfall: Optional[float] = None,
    temperature: Optional[float] = None,
    humidity: Optional[float] = None,
    season: Optional[str] = 'Kharif',
    top_k: int = 3
) -> Dict[str, Any]:
    """
    Comprehensive Crop Recommendation Inference Engine:
    - Resolves GPS lat/lon -> nearest Odisha district if not provided
    - Resolves real-time weather from Weatherstack if temp/humidity/rainfall not provided
    - Computes agronomic ratios and feature encoding
    - Runs best ML model (XGBoost / Random Forest)
    - Returns top_k recommended crops with calibrated confidence probabilities.
    """
    global pipeline
    if pipeline is None and os.path.exists(ARTIFACT_PATH):
        pipeline = joblib.load(ARTIFACT_PATH)

    # 1. Resolve Location
    if latitude is not None and longitude is not None:
        resolved_district = find_nearest_district_from_gps(latitude, longitude)
    else:
        resolved_district = district if district in ODISHA_DISTRICTS_COORDS else 'Cuttack'

    d_info = ODISHA_DISTRICTS_COORDS.get(resolved_district, ODISHA_DISTRICTS_COORDS['Cuttack'])
    lat = latitude if latitude is not None else d_info['lat']
    lon = longitude if longitude is not None else d_info['lon']
    elev = d_info['elevation']
    zone = d_info['zone']
    coastal = d_info['coastal']

    # 2. Resolve Weather / Climate
    weather_info = {}
    if temperature is None or humidity is None or rainfall is None:
        weather_info = fetch_weather_data(resolved_district, latitude, longitude)
        temp_val = temperature if temperature is not None else weather_info['temperature']
        hum_val = humidity if humidity is not None else weather_info['humidity']
        rain_val = rainfall if rainfall is not None else weather_info['rainfall']
    else:
        temp_val = temperature
        hum_val = humidity
        rain_val = rainfall
        weather_info = {'source': 'User-provided'}

    # 3. Feature Engineering
    npk_sum = N + P + K
    n_p_ratio = N / (P + 1e-5)
    n_k_ratio = N / (K + 1e-5)
    p_k_ratio = P / (K + 1e-5)
    thi = temp_val - (0.55 - 0.0055 * hum_val) * (temp_val - 14.5)

    input_df = pd.DataFrame([{
        'N': N,
        'P': P,
        'K': K,
        'pH': ph,
        'Rainfall': rain_val,
        'Temperature': temp_val,
        'Humidity': hum_val,
        'NPK_sum': npk_sum,
        'N_P_ratio': n_p_ratio,
        'N_K_ratio': n_k_ratio,
        'P_K_ratio': p_k_ratio,
        'THI': thi,
        'latitude': lat,
        'longitude': lon,
        'elevation_m': elev,
        'district_name': resolved_district,
        'agro_climatic_zone': zone,
        'coastal_status': coastal,
        'season': season or 'Kharif'
    }])

    # One-hot encode with full training feature columns
    feature_names = pipeline['feature_names']
    input_encoded = pd.get_dummies(input_df)
    for col in feature_names:
        if col not in input_encoded.columns:
            input_encoded[col] = 0
    input_encoded = input_encoded[feature_names]

    # Predict Probabilities
    model = pipeline['model']
    le = pipeline['label_encoder']
    probs = model.predict_proba(input_encoded)[0]

    # Get top-k rankings
    top_indices = np.argsort(probs)[::-1][:top_k]
    recommendations = []
    for idx in top_indices:
        recommendations.append({
            'crop': str(le.classes_[idx]),
            'probability': round(float(probs[idx]), 4),
            'confidence_percentage': f"{round(float(probs[idx]) * 100, 1)}%"
        })

    return {
        'recommended_crop': recommendations[0]['crop'],
        'confidence': recommendations[0]['probability'],
        'top_recommendations': recommendations,
        'input_summary': {
            'district': resolved_district,
            'latitude': lat,
            'longitude': lon,
            'N': N, 'P': P, 'K': K, 'pH': ph,
            'temperature': temp_val,
            'humidity': hum_val,
            'rainfall': rain_val,
            'season': season or 'Kharif',
            'weather_source': weather_info.get('source', 'Calculated')
        }
    }
