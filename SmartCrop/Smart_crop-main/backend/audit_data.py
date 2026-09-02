import pandas as pd
import numpy as np

def audit_datasets():
    files = {
        'crop_obs': 'backend/odisha_crop_observations_for_recommendation_fixed.csv',
        'weather': 'backend/odisha_weather_master_ml_fixed.csv',
        'soil': 'backend/odisha_district_soil_fertility_categories_fixed.csv',
        'geo': 'backend/odisha_district_geography_fixed.csv',
        'agronomic': 'backend/odisha_crop_agronomic_requirements_fixed.csv'
    }

    dfs = {}
    for k, v in files.items():
        try:
            df = pd.read_csv(v)
            dfs[k] = df
            print(f"=== {k} ({v}) ===")
            print(f"Shape: {df.shape}")
            print(f"Columns: {df.columns.tolist()}")
            print(df.head(2))
            print("-" * 50)
        except Exception as e:
            print(f"Error {k}: {e}")

    if 'crop_obs' in dfs:
        df_crop = dfs['crop_obs']
        print("\n=== CROP OBSERVATIONS DEEP DIVE ===")
        print("Crop value counts:")
        print(df_crop['crop_name'].value_counts() if 'crop_name' in df_crop.columns else df_crop.iloc[:, 0].value_counts())
        print("\nMissing values:")
        print(df_crop.isnull().sum())
        print(f"\nDuplicates count: {df_crop.duplicated().sum()}")

if __name__ == '__main__':
    audit_datasets()
