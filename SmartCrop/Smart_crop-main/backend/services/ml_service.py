from typing import Dict, Any, Optional, List
from schemas.ml import (
    CropRecommendationRequest, CropRecommendationResponse,
    ProductionPredictionRequest, ProductionPredictionResponse
)
from schemas.loan import LoanProfileInput, CandidateCropScoreItem, LoanDistressBreakdown
from services.crop_recommendation_service import recommend_crop as run_crop_recommendation
from services.yield_prediction_service import predict_yield_and_production
from services.profit_calculator_service import calculate_cost_revenue_profit, format_indian_currency
from services.loan_distress_service import calculate_loan_distress
from services.weather_service import get_weather_for_district
from services.distress_scorer import calculate_comprehensive_distress_score
import core.config as config

def recommend_crop(data: CropRecommendationRequest) -> CropRecommendationResponse:
    result = run_crop_recommendation(
        N=data.N,
        P=data.P,
        K=data.K,
        ph=data.ph,
        district=data.district,
        latitude=data.latitude,
        longitude=data.longitude,
        rainfall=data.rainfall,
        temperature=data.temperature,
        humidity=data.humidity,
        season=data.season,
        top_k=data.top_k or 5
    )
    
    return CropRecommendationResponse(
        recommended_crop=result['recommended_crop'],
        confidence=result['confidence'],
        top_recommendations=result['top_recommendations'],
        input_summary=result['input_summary']
    )

def predict_production(data: ProductionPredictionRequest) -> ProductionPredictionResponse:
    res = predict_yield_and_production(
        crop=data.crop,
        district=data.district,
        area_ha=data.area,
        season=data.season or 'Kharif',
        rainfall_mm=data.rainfall or 1100.0
    )
    return ProductionPredictionResponse(
        expected_production_tonnes=res['predicted_total_production_tonnes']
    )

def run_loan_aware_farm_analysis(
    district: str,
    season: str,
    area_ha: float,
    loan_input: Optional[LoanProfileInput] = None,
    latitude: Optional[float] = None,
    longitude: Optional[float] = None,
    current_crop: Optional[str] = None
) -> Dict[str, Any]:
    if loan_input is None:
        loan_input = LoanProfileInput(has_loan=False)

    weather_data = get_weather_for_district(district)
    temp = weather_data.get("temperature", 27.5)
    hum = weather_data.get("humidity", 76.0)
    rain = weather_data.get("rainfall_mm", 1150.0)

    # Load dynamic district soil profile
    import os, json
    profiles_path = os.path.join(os.path.dirname(__file__), '..', 'odisha_district_profiles.json')
    soil_N, soil_P, soil_K, soil_pH = 56.6, 31.7, 42.8, 6.39
    if os.path.exists(profiles_path):
        with open(profiles_path, 'r') as f:
            profiles = json.load(f)
            if district in profiles and "soil" in profiles[district]:
                soil = profiles[district]["soil"]
                # Add standard basal fertilizer application to native soil (Urea/DAP/MOP)
                # Without this, the unfertilized native soil only qualifies for hardy crops like Ragi.
                soil_N = soil.get("N", soil_N) + 25.0
                soil_P = soil.get("P", soil_P) + 10.0
                soil_K = soil.get("K", soil_K) + 15.0
                soil_pH = soil.get("pH", soil_pH)

    rec_req = CropRecommendationRequest(
        district=district,
        season=season,
        latitude=latitude,
        longitude=longitude,
        N=soil_N, P=soil_P, K=soil_K, ph=soil_pH,
        temperature=temp, humidity=hum, rainfall=rain,
        top_k=5
    )
    rec_res = recommend_crop(rec_req)
    top_candidates_raw = rec_res.top_recommendations[:5]

    # FORCE inclusion of the user's current crop if it exists
    if current_crop:
        # Check if it's already in the top 5
        exists = any(c.crop.lower() == current_crop.lower() for c in top_candidates_raw)
        if not exists:
            # We don't have a strict probability for it since it didn't make top 5, so we assign a moderate suitability
            from schemas.ml import CropRecommendationItem
            forced_crop = CropRecommendationItem(
                crop=current_crop,
                probability=0.55,
                reasons=[f"Selected by farmer for evaluation in {district}"]
            )
            top_candidates_raw.append(forced_crop)

    evaluated_candidates = []
    max_expected_profit = 0.0

    for cand in top_candidates_raw:
        c_name = cand.crop
        suitability_prob = cand.probability
        suitability_score = round(suitability_prob * 100.0, 1)

        y_res = predict_yield_and_production(
            crop=c_name,
            district=district,
            area_ha=area_ha,
            season=season,
            rainfall_mm=rain
        )
        yield_rate = y_res['predicted_yield_tonnes_per_ha']
        total_prod = y_res['predicted_total_production_tonnes']
        
        from services.weather_service import get_market_price
        
        try:
            market_data = get_market_price(c_name, district)
            mandi_price = market_data.get("price_per_quintal", 5000.0)
        except Exception:
            mandi_price = 5000.0

        prof_res = calculate_cost_revenue_profit(
            crop=c_name,
            district=district,
            area_ha=area_ha,
            predicted_yield=yield_rate,
            mandi_price_per_quintal=mandi_price
        )

        cost_per_ha = prof_res['cost_per_ha_inr']
        total_cost = prof_res['total_cost_inr']
        mandi_p_q = prof_res['mandi_price_per_quintal']
        total_rev = prof_res['total_revenue_inr']
        net_prof = prof_res['net_profit_inr']

        if net_prof > max_expected_profit:
            max_expected_profit = net_prof

        evaluated_candidates.append({
            'crop': c_name,
            'suitability_score': suitability_score,
            'yield_rate': yield_rate,
            'total_prod': total_prod,
            'mandi_price_q': mandi_p_q,
            'total_rev': total_rev,
            'cost_per_ha': cost_per_ha,
            'total_cost': total_cost,
            'net_prof': net_prof
        })

    base_profit = max(50000.0, max_expected_profit)
    loan_breakdown: LoanDistressBreakdown = calculate_loan_distress(loan_input, expected_annual_profit=base_profit)
    loan_distress_score = loan_breakdown.loan_distress_score

    profits = [item['net_prof'] for item in evaluated_candidates]
    min_prof = min(profits)
    max_prof = max(profits)
    prof_range = max_prof - min_prof if max_prof > min_prof else 1.0

    scored_candidates: List[CandidateCropScoreItem] = []

    for item in evaluated_candidates:
        c_name = item['crop']
        s_score = item['suitability_score']
        net_p = item['net_prof']

        profit_score = round(100.0 * (net_p - min_prof) / prof_range, 1) if max_prof > min_prof else 75.0

        weather_wind = float(weather_data.get("wind_speed", 18.0) if isinstance(weather_data, dict) else 18.0)
        weather_rain_dev = float(weather_data.get("rainfall_deviation", -15.0) if isinstance(weather_data, dict) else -15.0)

        distress_eval = calculate_comprehensive_distress_score(
            loan_amount=loan_input.original_loan_amount if loan_input.has_loan else 0.0,
            outstanding_principal=loan_input.outstanding_principal if loan_input.has_loan else 0.0,
            annual_interest_rate=loan_input.annual_interest_rate if loan_input.has_loan else 7.0,
            expected_profit=net_p,
            days_to_loan_due=180,
            rainfall_deviation_pct=weather_rain_dev,
            wind_speed_kmh=weather_wind,
            crop_name=c_name,
            mandi_price_drop_pct=10.0 if net_p < 0 else 0.0
        )
        final_distress = distress_eval["distress_score"]
        crop_distress_comp = distress_eval["breakdown"]["crop_survivability_risk"]

        safety_score = round(max(0.0, min(100.0, 100.0 - final_distress)), 1)

        final_crop_score = round(
            config.WEIGHT_SUITABILITY_SCORE * s_score +
            config.WEIGHT_PROFIT_SCORE * profit_score +
            config.WEIGHT_SAFETY_SCORE * safety_score,
            1
        )

        reason = f"Excellent agronomic suitability ({s_score}/100) with expected net profit of ₹{net_p:,.0f} and safety score of {safety_score}/100."
        if loan_distress_score > 60:
            reason += f" (Adjusted for high farmer loan burden score: {loan_distress_score}/100)."

        scored_candidates.append(CandidateCropScoreItem(
            rank=0,
            crop=c_name,
            suitability_score=s_score,
            predicted_yield_tonnes_per_ha=round(item['yield_rate'], 2),
            predicted_total_production_tonnes=round(item['total_prod'], 2),
            mandi_price_per_quintal=round(item['mandi_price_q'], 2),
            expected_gross_revenue=round(item['total_rev'], 2),
            cultivation_cost_per_ha=round(item['cost_per_ha'], 2),
            total_cultivation_cost=round(item['total_cost'], 2),
            expected_net_profit=round(net_p, 2),
            profit_score=profit_score,
            crop_distress_component=crop_distress_comp,
            loan_distress_score=loan_distress_score,
            final_distress_score=final_distress,
            safety_score=safety_score,
            final_crop_score=final_crop_score,
            recommendation_reason=reason
        ))

    scored_candidates.sort(key=lambda x: x.final_crop_score, reverse=True)

    for idx, cand in enumerate(scored_candidates):
        cand.rank = idx + 1

    top_3_candidates = scored_candidates[:3]
    
    # Make sure the current_crop is in the returned list so frontend doesn't fall back to Maize!
    if current_crop:
        if not any(c.crop.lower() == current_crop.lower() for c in top_3_candidates):
            current_crop_cand = next((c for c in scored_candidates if c.crop.lower() == current_crop.lower()), None)
            if current_crop_cand:
                top_3_candidates.append(current_crop_cand)
    master_recommended_crop = top_3_candidates[0].crop

    top_cand = top_3_candidates[0]
    legacy_yield = {
        "crop": top_cand.crop,
        "district": district,
        "area_ha": area_ha,
        "season": season,
        "predicted_yield_tonnes_per_ha": top_cand.predicted_yield_tonnes_per_ha,
        "predicted_total_production_tonnes": top_cand.predicted_total_production_tonnes,
        "model_used": "Random Forest Regressor",
        "status": "Success"
    }

    legacy_market = {
        "crop": top_cand.crop,
        "district": district,
        "mandi_price_per_quintal": top_cand.mandi_price_per_quintal,
        "mandi_price_per_tonne": top_cand.mandi_price_per_quintal * 10.0,
        "price_date": "2023-10-25"
    }

    legacy_profit = {
        "crop": top_cand.crop,
        "district": district,
        "area_ha": area_ha,
        "cost_per_ha_inr": top_cand.cultivation_cost_per_ha,
        "total_cost_inr": top_cand.total_cultivation_cost,
        "mandi_price_per_quintal": top_cand.mandi_price_per_quintal,
        "mandi_price_per_tonne": top_cand.mandi_price_per_quintal * 10.0,
        "total_revenue_inr": top_cand.expected_gross_revenue,
        "net_profit_inr": top_cand.expected_net_profit,
        "roi_percent": round((top_cand.expected_net_profit / max(1.0, top_cand.total_cultivation_cost)) * 100, 2),
        "formatted_cost": format_indian_currency(top_cand.total_cultivation_cost),
        "formatted_revenue": format_indian_currency(top_cand.expected_gross_revenue),
        "formatted_profit": format_indian_currency(top_cand.expected_net_profit),
        "status": "Profitable"
    }

    return {
        "location_summary": {
            "district": district,
            "season": season,
            "area_ha": area_ha,
            "weather_source": weather_data.get("condition", "Partly Cloudy")
        },
        "crop_recommendation": {
            "recommended_crop": master_recommended_crop,
            "confidence": round(top_cand.suitability_score / 100.0, 4),
            "top_recommendations": [
                {"crop": c.crop, "probability": c.suitability_score / 100.0, "confidence_percentage": f"{c.suitability_score}%"}
                for c in top_3_candidates
            ],
            "input_summary": rec_res.input_summary
        },
        "yield_prediction": legacy_yield,
        "market_price_summary": legacy_market,
        "profit_analysis": legacy_profit,
        "farmer_financial": loan_breakdown.model_dump(),
        "candidates": [c.model_dump() for c in top_3_candidates]
    }
