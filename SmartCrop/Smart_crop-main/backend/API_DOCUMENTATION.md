# 🌾 Krushi Shayaka - Standalone Backend API Documentation

The **Krushi Shayaka Backend** is 100% decoupled, stateless, and RESTful. Anyone can use or deploy this backend independently and build custom Web apps, React/Vue/Next.js frontends, or Mobile Apps (Flutter/React Native/iOS/Android) without altering the backend logic.

---

## 🚀 Quick Start Server Execution

Run the backend server directly:
```bash
cd backend
pip install -r requirements.txt
python -m uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

Interactive OpenAPI Swagger Documentation will be live at:
- **Swagger UI**: `http://localhost:8000/docs`
- **ReDoc UI**: `http://localhost:8000/redoc`

---

## 🔌 Decoupled API Endpoints Reference

### 1. 🌟 Master Cascading Analysis Endpoint
**`POST /api/full-farm-analysis`**

Runs the end-to-end ML pipeline in sequence:
`District / GPS` ➔ `Model 1: Crop Recommendation` ➔ `Model 2: Yield & Harvest Predictor` ➔ `Model 3: Mandi Price & Revenue Estimate`.

#### Request Payload:
```json
{
  "district": "Cuttack",
  "season": "Kharif",
  "area_ha": 2.5,
  "latitude": 20.46,
  "longitude": 85.88
}
```

#### Response Example:
```json
{
  "location_summary": {
    "district": "Cuttack",
    "season": "Kharif",
    "area_ha": 2.5,
    "area_acres": 6.2,
    "weather_source": "Partly Cloudy"
  },
  "crop_recommendation": {
    "recommended_crop": "Rice",
    "confidence": 0.998,
    "top_recommendations": [
      { "crop": "Rice", "probability": 0.998, "confidence_percentage": "99.8%" },
      { "crop": "Maize", "probability": 0.001, "confidence_percentage": "0.1%" }
    ]
  },
  "yield_prediction": {
    "crop": "Rice",
    "district": "Cuttack",
    "area_ha": 2.5,
    "season": "Kharif",
    "predicted_yield_tonnes_per_ha": 4.06,
    "predicted_total_production_tonnes": 10.15,
    "model_used": "Random Forest Regressor"
  },
  "market_price_summary": {
    "crop": "Rice",
    "district": "Cuttack",
    "mandi_price_per_quintal": 2200.0,
    "mandi_price_per_tonne": 22000.0
  },
  "economic_estimate": {
    "predicted_total_production_tonnes": 10.15,
    "predicted_total_quintals": 101.5,
    "estimated_gross_revenue_inr": 223300.0,
    "formatted_revenue": "₹2,23,300.00"
  }
}
```

---

### 2. 🌱 Standalone Crop Recommendation Model
**`POST /api/crop-recommendation`**

#### Request Payload:
```json
{
  "N": 56.6,
  "P": 31.7,
  "K": 42.8,
  "ph": 6.39,
  "district": "Cuttack",
  "season": "Kharif",
  "temperature": 27.5,
  "humidity": 76.0,
  "rainfall": 1150.0,
  "top_k": 3
}
```

---

### 3. 🎯 Standalone Yield & Production Regressor
**`POST /api/yield-prediction`**

#### Request Payload:
```json
{
  "crop": "Rice",
  "district": "Cuttack",
  "area_ha": 2.5,
  "season": "Kharif",
  "nitrogen": 56.6,
  "phosphorus": 31.7,
  "potassium": 42.8,
  "ph": 6.39,
  "rainfall_mm": 1150.0,
  "temperature_c": 27.5,
  "humidity": 75.0
}
```

#### Response Example:
```json
{
  "crop": "Rice",
  "district": "Cuttack",
  "area_ha": 2.5,
  "season": "Kharif",
  "predicted_yield_tonnes_per_ha": 4.06,
  "predicted_total_production_tonnes": 10.15,
  "model_used": "Random Forest Regressor",
  "status": "Success"
}
```

---

### 4. 📊 District Soil & Climate Profile Baseline
**`GET /api/district-profile/{district_name}`**

Returns dataset soil parameters ($N, P, K, pH$) and seasonal weather baselines for any of Odisha's 30 districts (e.g. `/api/district-profile/Koraput`).

---

### 5. 🌤️ Live District Weather Feed
**`GET /api/weather/{district_name}`**

Fetches live temperature, condition, humidity, and rainfall from Weatherstack API.

---

### 6. 💰 Mandi Market Price Query
**`POST /api/market-price`**

#### Request Payload:
```json
{
  "crop": "Rice",
  "district": "Cuttack"
}
```

---

### 7. 💬 Local Qwen LLM Chatbot
**`POST /api/chat`**

#### Request Payload:
```json
{
  "message": "Which fertilizer is recommended for Rice in Cuttack?",
  "context": { "district": "Cuttack", "season": "Kharif" }
}
```

---

## 💻 Sample Code for Custom Frontend Integration

### JavaScript / Fetch API:
```javascript
const response = await fetch("http://localhost:8000/api/full-farm-analysis", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    district: "Koraput",
    season: "Kharif",
    area_ha: 3.0
  })
});

const data = await response.json();
console.log("Recommended Crop:", data.crop_recommendation.recommended_crop);
console.log("Predicted Yield:", data.yield_prediction.predicted_yield_tonnes_per_ha, "t/ha");
console.log("Gross Revenue:", data.economic_estimate.formatted_revenue);
```

### Python / Requests:
```python
import requests

res = requests.post("http://localhost:8000/api/full-farm-analysis", json={
    "district": "Balangir",
    "season": "Rabi",
    "area_ha": 5.0
})

print(res.json())
```
