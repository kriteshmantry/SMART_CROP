import pandas as pd

df = pd.read_csv('Odisha_Synthetic_Cost_of_Cultivation_District_Crop.csv')
print("=== COST OF CULTIVATION DATASET ===")
print("Shape:", df.shape)
print("Columns:", df.columns.tolist())
print("\nSample Rows:")
print(df.head(10))

print("\nCrops:", df['crop_name'].unique() if 'crop_name' in df.columns else "No crop_name")
print("Summary stats of Cost per Hectare:")
for col in df.columns:
    if 'cost' in col.lower() or 'inr' in col.lower() or 'per_ha' in col.lower() or 'ha' in col.lower():
        print(f"Stats for {col}:")
        print(df[col].describe())
