import pandas as pd

for name in ['odisha_crop_production_history_fixed.csv', 'odisha_agricultural_inputs_fixed.csv', 'odisha_district_crop_calendar_fixed.csv', 'odisha_district_soil_fertility_categories_fixed.csv']:
    df = pd.read_csv(name)
    print(f"=== {name} ===")
    print("Shape:", df.shape)
    print("Columns:", df.columns.tolist())
    print(df.head(2))
    print("-" * 50)
