import pandas as pd
import numpy as np
from sklearn.model_selection import StratifiedKFold, cross_val_score
from sklearn.ensemble import RandomForestClassifier, ExtraTreesClassifier
from sklearn.preprocessing import LabelEncoder
import xgboost as xgb

crop_obs = pd.read_csv('odisha_crop_observations_for_recommendation_fixed.csv')

print("=== RAW OBSERVATIONS TEST ===")
features = ['soil_ph', 'nitrogen', 'phosphorus', 'potassium', 'rainfall_mm', 'temperature_mean_c']
X = crop_obs[features]
y = crop_obs['crop_name']

rf = RandomForestClassifier(n_estimators=100, random_state=42)
skf = StratifiedKFold(n_splits=5, shuffle=True, random_state=42)
scores = cross_val_score(rf, X, y, cv=skf, scoring='accuracy')
print(f"Accuracy using ONLY (N, P, K, pH, Rain, Temp) on raw observations: {scores.mean()*100:.2f}% (+/- {scores.std()*100:.2f}%)")

# If we add season:
X_with_season = pd.get_dummies(crop_obs[features + ['season_name']], columns=['season_name'])
scores_season = cross_val_score(rf, X_with_season, y, cv=skf, scoring='accuracy')
print(f"Accuracy with Season added: {scores_season.mean()*100:.2f}% (+/- {scores_season.std()*100:.2f}%)")

# If we add district:
X_with_dist = pd.get_dummies(crop_obs[features + ['season_name', 'district_name']], columns=['season_name', 'district_name'])
scores_dist = cross_val_score(rf, X_with_dist, y, cv=skf, scoring='accuracy')
print(f"Accuracy with Season + District added: {scores_dist.mean()*100:.2f}% (+/- {scores_dist.std()*100:.2f}%)")
