import os
import json
import joblib
import numpy as np
import pandas as pd
from sklearn.model_selection import train_test_split, KFold, cross_val_score
from sklearn.preprocessing import LabelEncoder
from sklearn.ensemble import RandomForestRegressor, ExtraTreesRegressor
from sklearn.metrics import r2_score, mean_squared_error, mean_absolute_error
import xgboost as xgb
import lightgbm as lgb
from catboost import CatBoostRegressor

def main():
    print("="*70, flush=True)
    print("1. LOADING & MERGING DATASETS FOR YIELD PREDICTION", flush=True)
    print("="*70, flush=True)

    prod_df = pd.read_csv('odisha_crop_production_history_fixed.csv')
    soil_df = pd.read_csv('odisha_district_soil_fertility_categories_fixed.csv')
    geo_df = pd.read_csv('odisha_district_geography_fixed.csv')
    obs_df = pd.read_csv('odisha_crop_observations_for_recommendation_fixed.csv')

    # Calculate average soil parameters per district
    district_soil = obs_df.groupby('district_name').agg({
        'nitrogen': 'mean',
        'phosphorus': 'mean',
        'potassium': 'mean',
        'soil_ph': 'mean'
    }).reset_index()

    # Merge soil and geography into crop production history
    df = prod_df.merge(geo_df[['district_name', 'latitude', 'longitude', 'elevation_m', 'agro_climatic_zone', 'coastal_status']], on='district_name', how='left')
    df = df.merge(district_soil, on='district_name', how='left')
    df = df.merge(soil_df[['district_name', 'predominant_soil_type']], on='district_name', how='left')

    # Add realistic environmental variations per row to represent weather fluctuations
    np.random.seed(42)

    # Base seasonal weather lookup per district/crop
    crop_rain_base = {
        'Rice': 1350, 'Sugarcane': 1800, 'Jute': 1200, 'Maize': 700,
        'Groundnut': 550, 'Moong(Green Gram)': 500, 'Urad': 480, 'Ragi': 550,
        'Sesamum': 450, 'Horse Gram': 400, 'Potato': 220, 'Wheat': 280, 'Rapeseed &Mustard': 250
    }
    
    crop_temp_base = {
        'Potato': 18.0, 'Wheat': 19.5, 'Rapeseed &Mustard': 20.0,
        'Rice': 28.5, 'Sugarcane': 29.0, 'Jute': 28.5, 'Maize': 27.0,
        'Groundnut': 27.5, 'Moong(Green Gram)': 28.0, 'Urad': 28.5,
        'Ragi': 26.5, 'Sesamum': 28.5, 'Horse Gram': 27.0
    }

    df['rainfall_mm'] = df['crop_name'].map(crop_rain_base) + np.random.normal(0, 45.0, len(df))
    df['temperature_mean_c'] = df['crop_name'].map(crop_temp_base) + np.random.normal(0, 1.2, len(df))
    df['relative_humidity_percent'] = 75.0 + np.random.normal(0, 5.0, len(df))

    print(f"Merged Dataset Shape: {df.shape}", flush=True)

    # -------------------------------------------------------------
    # 2. FEATURE ENGINEERING & DATA LEAKAGE PREVENTION
    # -------------------------------------------------------------
    print("\n" + "="*70, flush=True)
    print("2. FEATURE ENGINEERING & PREVENTING TARGET LEAKAGE", flush=True)
    print("="*70, flush=True)

    # Target Variable
    y = df['yield_tonnes_per_ha']

    # Explicitly REMOVE production_tonnes and yield_calculation_status to prevent data leakage!
    # Area sown is kept as a feature to predict yield & total production
    df['NPK_sum'] = df['nitrogen'] + df['phosphorus'] + df['potassium']
    df['N_P_ratio'] = df['nitrogen'] / (df['phosphorus'] + 1e-5)
    df['N_K_ratio'] = df['nitrogen'] / (df['potassium'] + 1e-5)
    df['P_K_ratio'] = df['phosphorus'] / (df['potassium'] + 1e-5)

    numeric_features = [
        'area_sown_ha', 'nitrogen', 'phosphorus', 'potassium', 'soil_ph',
        'rainfall_mm', 'temperature_mean_c', 'relative_humidity_percent',
        'elevation_m', 'latitude', 'longitude', 'NPK_sum', 'N_P_ratio', 'N_K_ratio', 'P_K_ratio'
    ]
    categorical_features = ['crop_name', 'district_name', 'season', 'agricultural_year', 'agro_climatic_zone', 'coastal_status', 'predominant_soil_type']

    X_encoded = pd.get_dummies(df[numeric_features + categorical_features], drop_first=False)
    feature_names = X_encoded.columns.tolist()

    with open('yield_model_feature_names.json', 'w') as f:
        json.dump(feature_names, f, indent=2)

    print(f"Engineered Features count: {len(feature_names)}", flush=True)
    print(f"Target: yield_tonnes_per_ha (min: {y.min():.2f}, max: {y.max():.2f}, mean: {y.mean():.2f})", flush=True)

    # -------------------------------------------------------------
    # 3. BENCHMARKING REGRESSORS (5-FOLD CV)
    # -------------------------------------------------------------
    print("\n" + "="*70, flush=True)
    print("3. BENCHMARKING REGRESSORS (5-FOLD CROSS-VALIDATION)", flush=True)
    print("="*70, flush=True)

    X_train, X_test, y_train, y_test, area_train, area_test = train_test_split(
        X_encoded, y, df['area_sown_ha'], test_size=0.20, random_state=42
    )

    models = {
        'Random Forest Regressor': RandomForestRegressor(n_estimators=150, max_depth=14, random_state=42, n_jobs=1),
        'Extra Trees Regressor': ExtraTreesRegressor(n_estimators=150, max_depth=14, random_state=42, n_jobs=1),
        'LightGBM Regressor': lgb.LGBMRegressor(n_estimators=150, max_depth=6, learning_rate=0.1, random_state=42, verbose=-1, n_jobs=1),
        'XGBoost Regressor': xgb.XGBRegressor(n_estimators=150, max_depth=5, learning_rate=0.1, random_state=42, n_jobs=1),
        'CatBoost Regressor': CatBoostRegressor(iterations=150, depth=5, learning_rate=0.1, random_seed=42, verbose=0, thread_count=1)
    }

    kf = KFold(n_splits=5, shuffle=True, random_state=42)
    benchmark_results = {}

    for name, model in models.items():
        scores_r2 = cross_val_score(model, X_train, y_train, cv=kf, scoring='r2')
        scores_neg_rmse = cross_val_score(model, X_train, y_train, cv=kf, scoring='neg_root_mean_squared_error')
        
        benchmark_results[name] = {
            'mean_r2': float(scores_r2.mean()),
            'mean_rmse': float(-scores_neg_rmse.mean())
        }
        print(f"-> {name:24s}: 5-Fold R2 Score = {scores_r2.mean():.4f} | RMSE = {-scores_neg_rmse.mean():.4f} tonnes/ha", flush=True)

    # -------------------------------------------------------------
    # 4. TRAINING BEST REGRESSOR & EVALUATING ON TEST SET
    # -------------------------------------------------------------
    best_model_name = max(benchmark_results, key=lambda k: benchmark_results[k]['mean_r2'])
    print("\n" + "="*70, flush=True)
    print(f"4. TRAINING FINAL BEST YIELD MODEL: {best_model_name}", flush=True)
    print("="*70, flush=True)

    best_model = models[best_model_name]
    best_model.fit(X_train, y_train)

    # Predictions
    y_pred_yield = best_model.predict(X_test)
    
    # Calculate Expected Production in Tonnes (Predicted Yield * Area)
    y_pred_production = y_pred_yield * area_test
    y_actual_production = y_test * area_test

    r2 = r2_score(y_test, y_pred_yield)
    rmse = np.sqrt(mean_squared_error(y_test, y_pred_yield))
    mae = mean_absolute_error(y_test, y_pred_yield)

    r2_prod = r2_score(y_actual_production, y_pred_production)
    rmse_prod = np.sqrt(mean_squared_error(y_actual_production, y_pred_production))

    print(f"\nFinal Test Set Results ({best_model_name}):", flush=True)
    print(f"Yield Prediction R² Score : {r2:.4f} ({r2*100:.2f}%)", flush=True)
    print(f"Yield RMSE               : {rmse:.4f} tonnes/ha", flush=True)
    print(f"Yield MAE                : {mae:.4f} tonnes/ha", flush=True)
    print(f"Production R² Score       : {r2_prod:.4f} ({r2_prod*100:.2f}%)", flush=True)
    print(f"Production RMSE          : {rmse_prod:.2f} tonnes", flush=True)

    # -------------------------------------------------------------
    # 5. SAVING ARTIFACTS
    # -------------------------------------------------------------
    print("="*70, flush=True)
    print("5. SAVING PRODUCTION YIELD PIPELINE ARTIFACTS", flush=True)
    print("="*70, flush=True)

    os.makedirs('models', exist_ok=True)
    
    pipeline_artifact = {
        'model_name': best_model_name,
        'model': best_model,
        'feature_names': feature_names,
        'numeric_features': numeric_features,
        'categorical_features': categorical_features
    }

    joblib.dump(pipeline_artifact, 'models/odisha_yield_prediction_pipeline.pkl')
    print("Yield Model artifact successfully saved to 'models/odisha_yield_prediction_pipeline.pkl'", flush=True)

if __name__ == '__main__':
    main()
