"""
Price Forecast Service
- Loads historical mandi price data from the large CSV
- Computes current price from latest data
- Uses linear regression on 180-day rolling window to predict 15/30/90-day future prices
"""
import os
import pandas as pd
import numpy as np
from typing import Dict, Any, Optional, List
from datetime import datetime, timedelta

# ---- Lazy-loaded global cache ----
_price_df: Optional[pd.DataFrame] = None

CSV_PATH = os.path.join(os.path.dirname(__file__), '..', 'odisha_mandi_daily_prices_fixed.csv')


def _load_price_data() -> pd.DataFrame:
    """Load and preprocess mandi price CSV. Cached after first call."""
    global _price_df
    if _price_df is not None:
        return _price_df

    print("[PriceForecast] Loading mandi price CSV... (one-time)")
    df = pd.read_csv(CSV_PATH, parse_dates=['date'], low_memory=False)

    # Normalize columns
    df['crop_name_lower'] = df['crop_name'].str.strip().str.lower()
    df['district_name_lower'] = df['district_name'].str.strip().str.lower()

    # Keep only valid price rows
    df = df.dropna(subset=['modal_price_rs_per_quintal', 'date'])
    df = df.sort_values('date')

    _price_df = df
    print(f"[PriceForecast] Loaded {len(df):,} rows, crops: {df['crop_name'].nunique()}, districts: {df['district_name'].nunique()}")
    return _price_df


def _match_crop_name(crop: str, available_crops: list) -> Optional[str]:
    """Fuzzy match crop name to available names in the dataset."""
    crop_lower = crop.strip().lower()

    # Direct match
    for c in available_crops:
        if c == crop_lower:
            return c

    # Substring match
    for c in available_crops:
        if crop_lower in c or c in crop_lower:
            return c

    # Common aliases
    aliases = {
        'rice': ['paddy', 'rice'],
        'paddy': ['paddy', 'rice'],
        'groundnut': ['groundnut', 'peanut'],
        'maize': ['maize', 'corn'],
        'wheat': ['wheat'],
        'potato': ['potato'],
        'sugarcane': ['sugarcane'],
        'ragi': ['ragi', 'finger millet'],
        'moong': ['moong', 'green gram'],
        'urad': ['urad', 'black gram'],
        'jute': ['jute'],
        'rapeseed': ['rapeseed', 'mustard'],
        'sesamum': ['sesamum', 'sesame', 'til'],
        'horse gram': ['horse gram'],
    }

    for alias_key, alias_list in aliases.items():
        if crop_lower in alias_list or alias_key in crop_lower:
            for alias in alias_list:
                for c in available_crops:
                    if alias in c:
                        return c

    return None


def get_price_forecast(crop: str, district: str) -> Dict[str, Any]:
    """
    Main forecast function.
    Returns current price, 15/30/90-day forecasts, trend, and 6-month price history.
    """
    df = _load_price_data()

    crop_lower = crop.strip().lower()
    district_lower = district.strip().lower()

    available_crops = df['crop_name_lower'].unique().tolist()
    matched_crop = _match_crop_name(crop, available_crops)

    if matched_crop is None:
        # Return fallback static prices
        return _static_fallback(crop, district)

    # Filter data for this crop
    crop_df = df[df['crop_name_lower'] == matched_crop]

    # Try exact district match, if not enough data, use all districts for this crop
    district_df = crop_df[crop_df['district_name_lower'] == district_lower]
    if len(district_df) < 30:
        district_df = crop_df  # Use state-wide data for this crop

    if len(district_df) < 10:
        return _static_fallback(crop, district)

    # Get latest 180 days of data
    max_date = district_df['date'].max()
    start_date = max_date - timedelta(days=180)
    window_df = district_df[district_df['date'] >= start_date].copy()

    if len(window_df) < 10:
        window_df = district_df.tail(60).copy()

    # Aggregate daily modal price (mean across markets for same day)
    daily_prices = window_df.groupby('date')['modal_price_rs_per_quintal'].mean().reset_index()
    daily_prices = daily_prices.sort_values('date').reset_index(drop=True)

    # Current price = latest available modal price
    current_price = round(float(daily_prices['modal_price_rs_per_quintal'].iloc[-1]), 2)

    # Linear regression for trend and forecast
    X = np.arange(len(daily_prices)).reshape(-1, 1).astype(float)
    y = daily_prices['modal_price_rs_per_quintal'].values.astype(float)

    # Simple least-squares regression: y = mx + b
    n = len(X)
    x_flat = X.flatten()
    x_mean = x_flat.mean()
    y_mean = y.mean()

    numerator = np.sum((x_flat - x_mean) * (y - y_mean))
    denominator = np.sum((x_flat - x_mean) ** 2)

    if denominator == 0:
        slope = 0.0
        intercept = y_mean
    else:
        slope = numerator / denominator
        intercept = y_mean - slope * x_mean

    # Forecast future prices
    last_idx = float(n - 1)
    forecast_15d = round(float(slope * (last_idx + 15) + intercept), 2)
    forecast_30d = round(float(slope * (last_idx + 30) + intercept), 2)
    forecast_90d = round(float(slope * (last_idx + 90) + intercept), 2)

    # Ensure no negative prices
    forecast_15d = max(forecast_15d, current_price * 0.5)
    forecast_30d = max(forecast_30d, current_price * 0.4)
    forecast_90d = max(forecast_90d, current_price * 0.3)

    # Determine trend
    if slope > 0.5:
        trend = "rising"
    elif slope < -0.5:
        trend = "falling"
    else:
        trend = "stable"

    # % change from current
    change_15d = round(((forecast_15d - current_price) / current_price) * 100, 1) if current_price > 0 else 0.0
    change_30d = round(((forecast_30d - current_price) / current_price) * 100, 1) if current_price > 0 else 0.0
    change_90d = round(((forecast_90d - current_price) / current_price) * 100, 1) if current_price > 0 else 0.0

    # Build price history array for sparkline (date, price)
    history = []
    for _, row in daily_prices.iterrows():
        history.append({
            "date": row['date'].strftime('%Y-%m-%d'),
            "price": round(float(row['modal_price_rs_per_quintal']), 2)
        })

    # Crop display name from original data
    original_crop_name = crop_df['crop_name'].iloc[0] if len(crop_df) > 0 else crop

    return {
        "crop": original_crop_name,
        "district": district,
        "current_price_per_quintal": current_price,
        "price_source": "Historical Mandi Data (AGMARKNET)",
        "data_date": max_date.strftime('%Y-%m-%d'),
        "trend": trend,
        "slope_per_day": round(float(slope), 2),
        "forecast_15d": forecast_15d,
        "forecast_30d": forecast_30d,
        "forecast_90d": forecast_90d,
        "change_15d_pct": change_15d,
        "change_30d_pct": change_30d,
        "change_90d_pct": change_90d,
        "price_history": history,
        "history_days": len(history),
        "status": "ok"
    }


def _static_fallback(crop: str, district: str) -> Dict[str, Any]:
    """Fallback when crop not found in CSV dataset."""
    # Default prices by crop category
    default_prices = {
        'rice': 2200, 'paddy': 2200, 'wheat': 2500, 'maize': 2100,
        'groundnut': 6500, 'potato': 1800, 'sugarcane': 350,
        'ragi': 3500, 'moong': 7500, 'urad': 6800,
        'jute': 5200, 'rapeseed': 5400, 'mustard': 5400,
        'sesamum': 12000, 'horse gram': 5500
    }

    crop_lower = crop.strip().lower()
    base_price = default_prices.get(crop_lower, 3000)

    return {
        "crop": crop,
        "district": district,
        "current_price_per_quintal": float(base_price),
        "price_source": "Default Estimate",
        "data_date": datetime.now().strftime('%Y-%m-%d'),
        "trend": "stable",
        "slope_per_day": 0.0,
        "forecast_15d": round(base_price * 1.01, 2),
        "forecast_30d": round(base_price * 1.02, 2),
        "forecast_90d": round(base_price * 1.05, 2),
        "change_15d_pct": 1.0,
        "change_30d_pct": 2.0,
        "change_90d_pct": 5.0,
        "price_history": [],
        "history_days": 0,
        "status": "fallback"
    }
