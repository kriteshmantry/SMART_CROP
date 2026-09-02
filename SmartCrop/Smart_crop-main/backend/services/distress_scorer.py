"""
SmartCrop Comprehensive Multi-Factor Distress & Risk Scoring Engine
===================================================================
Incorporates 4 Critical Risk Indicators:
  1. Financial Debt & Loan Burden (45%)
  2. Weather Rainfall Deficit / Flood Risk (20%)
  3. Wind Speed Forecast & Cyclone/Disaster Risk (15%)
  4. Crop Survivability & Agronomic Vulnerability Risk (20%)

Categorization (0 to 100):
  - Low Risk: 0.0 to 35.0
  - Moderate Risk: 35.1 to 65.0
  - High Risk: 65.1 to 100.0
"""

def calculate_comprehensive_distress_score(
    loan_amount: float = 0.0,
    outstanding_principal: float = 0.0,
    annual_interest_rate: float = 7.0,
    expected_profit: float = 150000.0,
    days_to_loan_due: int = 180,
    rainfall_deviation_pct: float = -15.0,
    wind_speed_kmh: float = 18.0,
    is_cyclone_alert: bool = False,
    crop_name: str = "Paddy",
    mandi_price_drop_pct: float = 5.0
) -> dict:
    """
    Computes accurate multi-factor distress score (0-100) and risk level.
    """
    orig_loan = float(loan_amount or 0.0)
    out_prin = float(outstanding_principal or orig_loan * 0.7)
    safe_profit = max(10000.0, float(expected_profit or 150000.0))

    # 1. Financial & Loan Debt Burden Risk (Weight: 45%)
    if orig_loan <= 0 and out_prin <= 0:
        fin_risk = 0.0
    else:
        debt_to_profit_ratio = out_prin / safe_profit
        annual_interest = out_prin * (annual_interest_rate / 100.0)
        interest_to_profit_ratio = annual_interest / safe_profit
        due_urgency_score = max(0.0, (180.0 - float(days_to_loan_due or 180)) / 180.0) * 100.0

        raw_fin_score = (
            0.40 * min(100.0, debt_to_profit_ratio * 40.0) +
            0.35 * min(100.0, interest_to_profit_ratio * 150.0) +
            0.25 * due_urgency_score
        )
        fin_risk = round(max(0.0, min(100.0, raw_fin_score)), 1)

    # 2. Weather & Rainfall Deficit / Flood Risk (Weight: 20%)
    rain_dev = float(rainfall_deviation_pct or 0.0)
    if rain_dev < 0:
        rain_risk = min(100.0, abs(rain_dev) * 2.2)
    else:
        rain_risk = min(100.0, max(0.0, (rain_dev - 15.0) * 2.5))
    rain_risk = round(rain_risk, 1)

    # 3. Wind Speed Forecast & Extreme Disaster Possibility (Weight: 15%)
    wind_kmh = float(wind_speed_kmh or 15.0)
    wind_risk = max(0.0, (wind_kmh - 12.0) * 2.8)
    if is_cyclone_alert:
        wind_risk = max(wind_risk, 85.0)
    wind_risk = round(min(100.0, wind_risk), 1)

    # 4. Crop Survivability & Agronomic Vulnerability (Weight: 20%)
    crop = (crop_name or "Paddy").strip().lower()
    if any(k in crop for k in ["ragi", "millet", "moong", "gram", "pulse", "groundnut"]):
        base_vulnerability = 20.0
    elif any(k in crop for k in ["maize", "arhar", "urad", "sesame", "mustard"]):
        base_vulnerability = 40.0
    else:
        base_vulnerability = 65.0

    price_drop = max(0.0, float(mandi_price_drop_pct or 0.0))
    crop_risk = round(min(100.0, base_vulnerability + (price_drop * 1.5)), 1)

    # Composite Distress Calculation
    total_score = round(
        0.45 * fin_risk +
        0.20 * rain_risk +
        0.15 * wind_risk +
        0.20 * crop_risk,
        1
    )
    total_score = max(0.0, min(100.0, total_score))

    # Categorization
    if total_score <= 35.0:
        category = "Low Risk"
    elif total_score <= 65.0:
        category = "Moderate Risk"
    else:
        category = "High Risk"

    reasons = []
    if fin_risk > 60:
        reasons.append(f"High loan debt burden ({fin_risk}/100)")
    if rain_risk > 50:
        reasons.append(f"Severe rainfall deficit/excess risk ({rain_risk}/100)")
    if wind_risk > 50:
        reasons.append(f"High wind speed/cyclone threat ({wind_risk}/100)")
    if crop_risk > 60:
        reasons.append(f"Crop vulnerability to weather ({crop_risk}/100)")

    risk_rationale = "; ".join(reasons) if reasons else "Normal operational baseline risk."

    return {
        "distress_score": total_score,
        "distress_category": category,
        "breakdown": {
            "financial_debt_risk": fin_risk,
            "rainfall_weather_risk": rain_risk,
            "wind_disaster_risk": wind_risk,
            "crop_survivability_risk": crop_risk
        },
        "risk_rationale": risk_rationale
    }


def calculate_distress_score(rainfall_dev: float = 0.0, price_drop: float = 0.0, days_to_loan: int = 180) -> float:
    """Legacy backward-compatible wrapper."""
    res = calculate_comprehensive_distress_score(
        rainfall_deviation_pct=rainfall_dev,
        mandi_price_drop_pct=price_drop,
        days_to_loan_due=days_to_loan
    )
    return res["distress_score"]
