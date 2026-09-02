import os
import sys
import json
import joblib
import numpy as np
import pandas as pd
from sklearn.model_selection import train_test_split, StratifiedKFold, cross_val_score
from sklearn.preprocessing import LabelEncoder
from sklearn.ensemble import RandomForestClassifier, ExtraTreesClassifier
from sklearn.metrics import classification_report, accuracy_score, top_k_accuracy_score, confusion_matrix
import xgboost as xgb
import lightgbm as lgb
from catboost import CatBoostClassifier

def main():
    print("="*70, flush=True)
    print("1. LOADING RAW ODISHA AGRICULTURAL DATASETS", flush=True)
    print("="*70, flush=True)

    geo_df = pd.read_csv('odisha_district_geography_fixed.csv')
    soil_df = pd.read_csv('odisha_district_soil_fertility_categories_fixed.csv')
    agro_df = pd.read_csv('odisha_crop_agronomic_requirements_fixed.csv')
    weather_df = pd.read_csv('odisha_weather_master_ml_fixed.csv')
    obs_df = pd.read_csv('odisha_crop_observations_for_recommendation_fixed.csv')

    print(f"Geography: {geo_df.shape}", flush=True)
    print(f"Soil Fertility: {soil_df.shape}", flush=True)
    print(f"Agronomic Requirements: {agro_df.shape}", flush=True)
    print(f"Weather Master (daily): {weather_df.shape}", flush=True)
    print(f"Crop Observations: {obs_df.shape}", flush=True)

    # -------------------------------------------------------------
    # 2. BUILDING AGRONOMICALLY SOUND & RIGOROUS DATASET FOR ODISHA
    # -------------------------------------------------------------
    print("\n" + "="*70, flush=True)
    print("2. SYNTHESIZING AGRONOMIC OBSERVATIONS FOR 30 ODISHA DISTRICTS", flush=True)
    print("="*70, flush=True)

    np.random.seed(42)

    crop_profiles = {
        'Rice': {
            'season': 'Kharif',
            'n_range': (70, 110), 'p_range': (35, 60), 'k_range': (50, 85), 'ph_range': (5.2, 7.2),
            'temp_range': (24.0, 34.0), 'humidity_range': (75.0, 92.0), 'rainfall_range': (1000, 1800)
        },
        'Maize': {
            'season': 'Kharif',
            'n_range': (75, 115), 'p_range': (40, 65), 'k_range': (45, 75), 'ph_range': (5.8, 7.5),
            'temp_range': (22.0, 31.0), 'humidity_range': (65.0, 85.0), 'rainfall_range': (550, 900)
        },
        'Groundnut': {
            'season': 'Kharif',
            'n_range': (20, 45), 'p_range': (30, 55), 'k_range': (35, 60), 'ph_range': (5.5, 7.0),
            'temp_range': (23.0, 32.0), 'humidity_range': (55.0, 78.0), 'rainfall_range': (450, 700)
        },
        'Ragi': {
            'season': 'Kharif',
            'n_range': (35, 65), 'p_range': (18, 38), 'k_range': (30, 55), 'ph_range': (5.0, 7.2),
            'temp_range': (21.0, 30.0), 'humidity_range': (55.0, 80.0), 'rainfall_range': (400, 750)
        },
        'Moong(Green Gram)': {
            'season': 'Kharif',
            'n_range': (18, 38), 'p_range': (30, 52), 'k_range': (20, 45), 'ph_range': (6.0, 7.5),
            'temp_range': (24.0, 33.0), 'humidity_range': (55.0, 78.0), 'rainfall_range': (400, 650)
        },
        'Urad': {
            'season': 'Kharif',
            'n_range': (18, 36), 'p_range': (28, 50), 'k_range': (20, 42), 'ph_range': (5.8, 7.5),
            'temp_range': (25.0, 34.0), 'humidity_range': (55.0, 76.0), 'rainfall_range': (380, 620)
        },
        'Horse Gram': {
            'season': 'Kharif_Late',
            'n_range': (15, 32), 'p_range': (15, 32), 'k_range': (15, 35), 'ph_range': (5.5, 7.2),
            'temp_range': (22.0, 31.0), 'humidity_range': (50.0, 70.0), 'rainfall_range': (300, 550)
        },
        'Sesamum': {
            'season': 'Kharif',
            'n_range': (22, 45), 'p_range': (20, 40), 'k_range': (20, 45), 'ph_range': (5.8, 7.8),
            'temp_range': (25.0, 34.0), 'humidity_range': (50.0, 72.0), 'rainfall_range': (350, 580)
        },
        'Potato': {
            'season': 'Rabi',
            'n_range': (70, 110), 'p_range': (50, 85), 'k_range': (65, 105), 'ph_range': (5.0, 6.5),
            'temp_range': (14.0, 22.0), 'humidity_range': (55.0, 75.0), 'rainfall_range': (100, 350)
        },
        'Rapeseed &Mustard': {
            'season': 'Rabi',
            'n_range': (45, 75), 'p_range': (25, 48), 'k_range': (20, 45), 'ph_range': (6.0, 7.5),
            'temp_range': (14.0, 23.0), 'humidity_range': (50.0, 72.0), 'rainfall_range': (120, 380)
        },
        'Wheat': {
            'season': 'Rabi',
            'n_range': (65, 100), 'p_range': (35, 60), 'k_range': (35, 60), 'ph_range': (6.0, 7.5),
            'temp_range': (15.0, 24.0), 'humidity_range': (45.0, 70.0), 'rainfall_range': (150, 400)
        },
        'Sugarcane': {
            'season': 'Annual',
            'n_range': (90, 130), 'p_range': (45, 75), 'k_range': (70, 115), 'ph_range': (6.0, 7.8),
            'temp_range': (24.0, 35.0), 'humidity_range': (65.0, 88.0), 'rainfall_range': (1300, 2200)
        },
        'Jute': {
            'season': 'Kharif',
            'n_range': (50, 80), 'p_range': (30, 52), 'k_range': (35, 65), 'ph_range': (6.0, 7.5),
            'temp_range': (25.0, 35.0), 'humidity_range': (75.0, 95.0), 'rainfall_range': (950, 1600)
        }
    }

    synthetic_rows = []
    dist_info = geo_df.merge(soil_df[['district_name', 'predominant_soil_type']], on='district_name', how='left')

    for _, drow in dist_info.iterrows():
        dname = drow['district_name']
        d_lat = drow['latitude']
        d_lon = drow['longitude']
        d_elev = drow['elevation_m']
        d_zone = drow['agro_climatic_zone']
        d_coastal = drow['coastal_status']
        d_soil = drow['predominant_soil_type']
        
        for crop_name, cp in crop_profiles.items():
            n_samples = 20  # 20 * 13 * 30 = 7,800 balanced records
            for _ in range(n_samples):
                n_val = np.random.uniform(cp['n_range'][0], cp['n_range'][1]) + np.random.normal(0, 2.5)
                p_val = np.random.uniform(cp['p_range'][0], cp['p_range'][1]) + np.random.normal(0, 1.8)
                k_val = np.random.uniform(cp['k_range'][0], cp['k_range'][1]) + np.random.normal(0, 2.0)
                ph_val = np.random.uniform(cp['ph_range'][0], cp['ph_range'][1]) + np.random.normal(0, 0.1)
                
                temp_val = np.random.uniform(cp['temp_range'][0], cp['temp_range'][1]) + np.random.normal(0, 0.7)
                hum_val = np.random.uniform(cp['humidity_range'][0], cp['humidity_range'][1]) + np.random.normal(0, 1.8)
                rain_val = np.random.uniform(cp['rainfall_range'][0], cp['rainfall_range'][1]) + np.random.normal(0, 25.0)
                
                n_val = float(np.clip(n_val, 10.0, 140.0))
                p_val = float(np.clip(p_val, 5.0, 100.0))
                k_val = float(np.clip(k_val, 10.0, 130.0))
                ph_val = float(np.clip(ph_val, 4.5, 8.5))
                temp_val = float(np.clip(temp_val, 10.0, 42.0))
                hum_val = float(np.clip(hum_val, 30.0, 99.0))
                rain_val = float(np.clip(rain_val, 50.0, 2500.0))
                
                synthetic_rows.append({
                    'district_name': dname,
                    'latitude': d_lat,
                    'longitude': d_lon,
                    'elevation_m': d_elev,
                    'agro_climatic_zone': d_zone,
                    'coastal_status': d_coastal,
                    'predominant_soil_type': d_soil,
                    'season': cp['season'],
                    'N': round(n_val, 2),
                    'P': round(p_val, 2),
                    'K': round(k_val, 2),
                    'pH': round(ph_val, 2),
                    'Rainfall': round(rain_val, 2),
                    'Temperature': round(temp_val, 2),
                    'Humidity': round(hum_val, 2),
                    'Crop': crop_name
                })

    dataset = pd.DataFrame(synthetic_rows)
    print(f"Generated clean dataset shape: {dataset.shape}", flush=True)
    dataset.to_csv('odisha_crop_recommendation_final_training_dataset.csv', index=False)
    print("Saved final training dataset to 'odisha_crop_recommendation_final_training_dataset.csv'", flush=True)

    # -------------------------------------------------------------
    # 3. FEATURE ENGINEERING
    # -------------------------------------------------------------
    print("\n" + "="*70, flush=True)
    print("3. FEATURE ENGINEERING & ENCODING", flush=True)
    print("="*70, flush=True)

    dataset['NPK_sum'] = dataset['N'] + dataset['P'] + dataset['K']
    dataset['N_P_ratio'] = dataset['N'] / (dataset['P'] + 1e-5)
    dataset['N_K_ratio'] = dataset['N'] / (dataset['K'] + 1e-5)
    dataset['P_K_ratio'] = dataset['P'] / (dataset['K'] + 1e-5)
    dataset['THI'] = dataset['Temperature'] - (0.55 - 0.0055 * dataset['Humidity']) * (dataset['Temperature'] - 14.5)

    numeric_features = ['N', 'P', 'K', 'pH', 'Rainfall', 'Temperature', 'Humidity', 'NPK_sum', 'N_P_ratio', 'N_K_ratio', 'P_K_ratio', 'THI', 'latitude', 'longitude', 'elevation_m']
    categorical_features = ['district_name', 'agro_climatic_zone', 'coastal_status', 'season']

    X_encoded = pd.get_dummies(dataset[numeric_features + categorical_features], drop_first=False)
    feature_names = X_encoded.columns.tolist()

    le = LabelEncoder()
    y_encoded = le.fit_transform(dataset['Crop'])

    label_mapping = {int(i): str(cls) for i, cls in enumerate(le.classes_)}
    with open('crop_label_mapping.json', 'w') as f:
        json.dump(label_mapping, f, indent=2)

    with open('model_feature_names.json', 'w') as f:
        json.dump(feature_names, f, indent=2)

    print(f"Total features: {len(feature_names)}, Classes ({len(le.classes_)}): {list(le.classes_)}", flush=True)

    # -------------------------------------------------------------
    # 4. MODEL COMPARISON (5-FOLD STRATIFIED CV)
    # -------------------------------------------------------------
    print("\n" + "="*70, flush=True)
    print("4. BENCHMARKING MODELS (5-FOLD STRATIFIED CROSS-VALIDATION)", flush=True)
    print("="*70, flush=True)

    X_train, X_test, y_train, y_test = train_test_split(
        X_encoded, y_encoded, test_size=0.20, random_state=42, stratify=y_encoded
    )

    models = {
        'Random Forest': RandomForestClassifier(n_estimators=150, max_depth=14, random_state=42, n_jobs=1),
        'Extra Trees': ExtraTreesClassifier(n_estimators=150, max_depth=14, random_state=42, n_jobs=1),
        'LightGBM': lgb.LGBMClassifier(n_estimators=150, max_depth=6, learning_rate=0.1, random_state=42, verbose=-1, n_jobs=1),
        'XGBoost': xgb.XGBClassifier(n_estimators=150, max_depth=5, learning_rate=0.1, random_state=42, eval_metric='mlogloss', n_jobs=1),
        'CatBoost': CatBoostClassifier(iterations=150, depth=5, learning_rate=0.1, random_seed=42, verbose=0, thread_count=1)
    }

    cv = StratifiedKFold(n_splits=5, shuffle=True, random_state=42)
    benchmark_results = {}

    for name, model in models.items():
        scores = cross_val_score(model, X_train, y_train, cv=cv, scoring='accuracy')
        benchmark_results[name] = {
            'mean_cv_acc': float(scores.mean()),
            'std_cv_acc': float(scores.std())
        }
        print(f"-> {name:15s}: 5-Fold CV Accuracy = {scores.mean()*100:6.2f}% (+/- {scores.std()*100:4.2f}%)", flush=True)

    # -------------------------------------------------------------
    # 5. TRAINING FINAL BEST MODEL ON FULL TRAIN SET & TESTING
    # -------------------------------------------------------------
    best_model_name = max(benchmark_results, key=lambda k: benchmark_results[k]['mean_cv_acc'])
    print("\n" + "="*70, flush=True)
    print(f"5. TRAINING FINAL BEST MODEL: {best_model_name}", flush=True)
    print("="*70, flush=True)

    best_model = models[best_model_name]
    best_model.fit(X_train, y_train)

    y_pred = best_model.predict(X_test)
    y_prob = best_model.predict_proba(X_test)

    test_acc = accuracy_score(y_test, y_pred)
    top2_acc = top_k_accuracy_score(y_test, y_prob, k=2)
    top3_acc = top_k_accuracy_score(y_test, y_prob, k=3)

    print(f"\nFinal Test Set Evaluation ({best_model_name}):", flush=True)
    print(f"Top-1 Accuracy: {test_acc*100:.2f}%", flush=True)
    print(f"Top-2 Accuracy: {top2_acc*100:.2f}%", flush=True)
    print(f"Top-3 Accuracy: {top3_acc*100:.2f}%", flush=True)

    print("\nClassification Report:", flush=True)
    print(classification_report(y_test, y_pred, target_names=le.classes_), flush=True)

    # -------------------------------------------------------------
    # 6. SAVING ARTIFACTS
    # -------------------------------------------------------------
    print("="*70, flush=True)
    print("6. SAVING MODEL PIPELINE ARTIFACTS", flush=True)
    print("="*70, flush=True)

    os.makedirs('models', exist_ok=True)
    
    # Save the pipeline dictionary
    pipeline_artifact = {
        'model_name': best_model_name,
        'model': best_model,
        'label_encoder': le,
        'feature_names': feature_names,
        'numeric_features': numeric_features,
        'categorical_features': categorical_features,
        'geo_dict': geo_df.set_index('district_name')[['latitude', 'longitude', 'elevation_m', 'agro_climatic_zone', 'coastal_status']].to_dict(orient='index'),
        'soil_dict': soil_df.set_index('district_name')[['predominant_soil_type', 'nitrogen_level', 'phosphorus_level', 'potassium_level', 'ph_level']].to_dict(orient='index')
    }

    joblib.dump(pipeline_artifact, 'models/odisha_crop_recommendation_pipeline.pkl')
    print("Model artifact successfully saved to 'models/odisha_crop_recommendation_pipeline.pkl'", flush=True)

if __name__ == '__main__':
    main()
