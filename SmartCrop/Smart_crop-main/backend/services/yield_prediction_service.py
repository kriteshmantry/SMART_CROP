import os
import joblib
import numpy as np
import pandas as pd
from typing import Dict, Any, Optional

ARTIFACT_PATH = os.path.join(os.path.dirname(__file__), '..', 'models', 'odisha_yield_prediction_pipeline.pkl')

pipeline = None
if os.path.exists(ARTIFACT_PATH):
    try:
        pipeline = joblib.load(ARTIFACT_PATH)
        print(f"Loaded Yield Prediction Pipeline ({pipeline.get('model_name')})")
    except Exception as e:
        print(f"Error loading yield pipeline: {e}")

# Default yield baselines per crop (tonnes/ha) in Odisha
CROP_YIELD_BASELINES = {
    'Sugarcane': 65.0,
    'Potato': 17.5,
    'Rice': 3.2,
    'Maize': 3.5,
    'Jute': 2.2,
    'Wheat': 2.6,
    'Groundnut': 1.7,
    'Ragi': 1.3,
    'Rapeseed &Mustard': 1.1,
    'Moong(Green Gram)': 0.9,
    'Urad': 0.88,
    'Horse Gram': 0.75,
    'Sesamum': 0.62
}

def predict_yield_and_production(
    crop: str,
    district: str,
    area_ha: float,
    season: str = 'Kharif',
    nitrogen: float = 55.0,
    phosphorus: float = 32.0,
    potassium: float = 45.0,
    ph: float = 6.4,
    rainfall_mm: float = 1100.0,
    temperature_c: float = 27.5,
    humidity: float = 75.0,
    year: str = '2024-25'
) -> Dict[str, Any]:
    """
    Predicts expected crop yield in tonnes/hectare and total expected production in tonnes.
    Prevents target leakage by evaluating area, crop, district, soil, and climate inputs before harvest.
    """
    global pipeline
    if pipeline is None and os.path.exists(ARTIFACT_PATH):
        pipeline = joblib.load(ARTIFACT_PATH)

    if pipeline is not None:
        try:
            feature_names = pipeline['feature_names']
            model = pipeline['model']

            npk_sum = nitrogen + phosphorus + potassium
            n_p_ratio = nitrogen / (phosphorus + 1e-5)
            n_k_ratio = nitrogen / (potassium + 1e-5)
            p_k_ratio = phosphorus / (potassium + 1e-5)

            input_df = pd.DataFrame([{
                'area_sown_ha': area_ha,
                'nitrogen': nitrogen,
                'phosphorus': phosphorus,
                'potassium': potassium,
                'soil_ph': ph,
                'rainfall_mm': rainfall_mm,
                'temperature_mean_c': temperature_c,
                'relative_humidity_percent': humidity,
                'elevation_m': 150.0,
                'latitude': 20.5,
                'longitude': 85.5,
                'NPK_sum': npk_sum,
                'N_P_ratio': n_p_ratio,
                'N_K_ratio': n_k_ratio,
                'P_K_ratio': p_k_ratio,
                'crop_name': crop,
                'district_name': district,
                'season': season,
                'agricultural_year': year,
                'agro_climatic_zone': 'East and South Eastern Coastal Plain',
                'coastal_status': 'Inland',
                'predominant_soil_type': 'Alluvial'
            }])

            input_encoded = pd.get_dummies(input_df)
            for col in feature_names:
                if col not in input_encoded.columns:
                    input_encoded[col] = 0
            input_encoded = input_encoded[feature_names]

            pred_yield = float(model.predict(input_encoded)[0])
            pred_yield = max(0.2, round(pred_yield, 2))
            total_production = round(pred_yield * area_ha, 2)

            return {
                'crop': crop,
                'district': district,
                'area_ha': area_ha,
                'season': season,
                'predicted_yield_tonnes_per_ha': pred_yield,
                'predicted_total_production_tonnes': total_production,
                'model_used': pipeline.get('model_name', 'XGBoost Regressor'),
                'status': 'Success'
            }
        except Exception as e:
            print(f"Yield ML Prediction Error: {e}")

    # Baseline fallback calculation
    base_yield = CROP_YIELD_BASELINES.get(crop, 2.5)
    pred_yield = round(base_yield * np.random.uniform(0.95, 1.05), 2)
    total_prod = round(pred_yield * area_ha, 2)

    return {
        'crop': crop,
        'district': district,
        'area_ha': area_ha,
        'season': season,
        'predicted_yield_tonnes_per_ha': pred_yield,
        'predicted_total_production_tonnes': total_prod,
        'model_used': 'Odisha Agronomic Baseline',
        'status': 'Success (Fallback)'
    }
