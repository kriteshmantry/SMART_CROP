import pandas as pd
import numpy as np

prod_df = pd.read_csv('odisha_crop_production_history_fixed.csv')
print("=== CROP PRODUCTION HISTORY DATASET ===")
print("Shape:", prod_df.shape)
print("\nColumns:", prod_df.columns.tolist())
print("\nMissing values:\n", prod_df.isnull().sum())
print("\nSample Rows:")
print(prod_df.head(5))

print("\nCrops included:", prod_df['crop_name'].unique())
print("Districts included:", prod_df['district_name'].nunique())
print("Years included:", prod_df['agricultural_year'].unique())
print("Seasons included:", prod_df['season'].unique())

print("\nYield summary stats by crop (tonnes/ha):")
print(prod_df.groupby('crop_name')['yield_tonnes_per_ha'].describe())
