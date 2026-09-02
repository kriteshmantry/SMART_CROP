import pandas as pd
import numpy as np

# Load datasets
crop_obs = pd.read_csv('odisha_crop_observations_for_recommendation_fixed.csv')
geo = pd.read_csv('odisha_district_geography_fixed.csv')
soil = pd.read_csv('odisha_district_soil_fertility_categories_fixed.csv')
agronomic = pd.read_csv('odisha_crop_agronomic_requirements_fixed.csv')

print("="*60)
print("1. CROP DISTRIBUTION IN OBSERVATION DATASET:")
print(crop_obs['crop_name'].value_counts())
print(f"Total crops: {crop_obs['crop_name'].nunique()}, Total samples: {len(crop_obs)}")

print("\n" + "="*60)
print("2. SEASONS PER CROP:")
print(pd.crosstab(crop_obs['crop_name'], crop_obs['season_name']))

print("\n" + "="*60)
print("3. DISTRICTS PER CROP (Sample distribution):")
print(f"Unique districts in crop obs: {crop_obs['district_name'].nunique()}")

print("\n" + "="*60)
print("4. SUMMARY STATS OF SOIL & WEATHER FEATURES PER CROP:")
features = ['nitrogen', 'phosphorus', 'potassium', 'soil_ph', 'rainfall_mm', 'temperature_mean_c']
for feat in features:
    if feat in crop_obs.columns:
        print(f"\nMean {feat} by crop:")
        print(crop_obs.groupby('crop_name')[feat].agg(['mean', 'std', 'min', 'max']))

print("\n" + "="*60)
print("5. CHECKING IDENTICAL/NEAR IDENTICAL SAMPLES (CONTRADICTIONS):")
# If features are nearly identical for different crops within the same district & season
cols_to_check = ['district_name', 'season_name', 'soil_ph', 'nitrogen', 'phosphorus', 'potassium', 'rainfall_mm']
dups = crop_obs.duplicated(subset=cols_to_check, keep=False)
print(f"Number of rows sharing EXACT same soil + district + season + rainfall: {dups.sum()} out of {len(crop_obs)}")
if dups.sum() > 0:
    print("\nSample overlapping cases:")
    sample_dups = crop_obs[dups].sort_values(by=cols_to_check)[cols_to_check + ['crop_name']].head(20)
    print(sample_dups)

print("\n" + "="*60)
print("6. CHECKING AGRO-CLIMATIC & GEOGRAPHY MERGE:")
merged = crop_obs.merge(geo[['district_id', 'agro_climatic_zone', 'coastal_status', 'elevation_m']], on='district_id', how='left')
print(f"Merged shape: {merged.shape}")
print(merged[['district_name', 'agro_climatic_zone', 'coastal_status', 'elevation_m']].head(5))
