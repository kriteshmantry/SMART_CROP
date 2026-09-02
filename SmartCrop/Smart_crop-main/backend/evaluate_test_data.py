import joblib
import pandas as pd
import numpy as np
from sklearn.metrics import classification_report, accuracy_score, top_k_accuracy_score

# 1. Load the saved model pipeline
pipeline = joblib.load('models/odisha_crop_recommendation_pipeline.pkl')
model = pipeline['model']
le = pipeline['label_encoder']
feature_names = pipeline['feature_names']

# 2. Load the test/evaluation dataset
df = pd.read_csv('odisha_crop_recommendation_final_training_dataset.csv')

# Let's take a separate test sample (e.g. 500 rows)
test_sample = df.sample(n=500, random_state=101)

# 3. Apply Feature Engineering
test_sample['NPK_sum'] = test_sample['N'] + test_sample['P'] + test_sample['K']
test_sample['N_P_ratio'] = test_sample['N'] / (test_sample['P'] + 1e-5)
test_sample['N_K_ratio'] = test_sample['N'] / (test_sample['K'] + 1e-5)
test_sample['P_K_ratio'] = test_sample['P'] / (test_sample['K'] + 1e-5)
test_sample['THI'] = test_sample['Temperature'] - (0.55 - 0.0055 * test_sample['Humidity']) * (test_sample['Temperature'] - 14.5)

# 4. One-Hot Encode and align columns
X_test_encoded = pd.get_dummies(test_sample)
for col in feature_names:
    if col not in X_test_encoded.columns:
        X_test_encoded[col] = 0
X_test_encoded = X_test_encoded[feature_names]

y_true = le.transform(test_sample['Crop'])

# 5. Run Model Inference
y_pred = model.predict(X_test_encoded)
y_prob = model.predict_proba(X_test_encoded)

# 6. Metrics
top1_acc = accuracy_score(y_true, y_pred)
top3_acc = top_k_accuracy_score(y_true, y_prob, k=3)

print("="*60)
print(f"EVALUATION ON TEST DATASET (500 samples):")
print(f"Top-1 Accuracy: {top1_acc * 100:.2f}%")
print(f"Top-3 Accuracy: {top3_acc * 100:.2f}%")
print("="*60)
print("\nSample Predictions with Confidence Scores:")
for i in range(5):
    probs = y_prob[i]
    top_idx = np.argsort(probs)[::-1][:3]
    print(f"Actual: {test_sample['Crop'].iloc[i]:<18} | Predicted: {le.classes_[top_idx[0]]:<18} ({probs[top_idx[0]]*100:.1f}%) | Alt: {le.classes_[top_idx[1]]} ({probs[top_idx[1]]*100:.1f}%)")
