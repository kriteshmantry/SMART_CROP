from typing import Optional
from fastapi import APIRouter, HTTPException
from schemas.ml import (
    CropRecommendationRequest, CropRecommendationResponse,
    YieldPredictionRequest, YieldPredictionResponse,
    FullFarmAnalysisRequest, FullFarmAnalysisResponse,
    ProfitCalculationRequest, ProfitCalculationResponse,
    ProductionPredictionRequest, ProductionPredictionResponse,
    MarketPriceRequest, MarketPriceResponse,
    PriceForecastRequest, PriceForecastResponse
)
from schemas.loan import LoanProfileInput
from services import ml_service, weather_service
from services.yield_prediction_service import predict_yield_and_production
from services.profit_calculator_service import calculate_farm_profit
from services.price_forecast_service import get_price_forecast
import json
import os

router = APIRouter()

PROFILES_PATH = os.path.join(os.path.dirname(__file__), '..', 'odisha_district_profiles.json')
district_profiles = {}
if os.path.exists(PROFILES_PATH):
    with open(PROFILES_PATH, 'r') as f:
        district_profiles = json.load(f)

@router.get("/district-profile/{district}")
def get_district_profile(district: str):
    if district in district_profiles:
        return district_profiles[district]
    for dname, data in district_profiles.items():
        if dname.lower() == district.lower():
            return data
    raise HTTPException(status_code=404, detail=f"District '{district}' not found.")

@router.post("/crop-recommendation", response_model=CropRecommendationResponse)
def get_crop_recommendation(request: CropRecommendationRequest):
    try:
        return ml_service.recommend_crop(request)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/yield-prediction", response_model=YieldPredictionResponse)
def get_yield_prediction(request: YieldPredictionRequest):
    try:
        res = predict_yield_and_production(
            crop=request.crop,
            district=request.district,
            area_ha=request.area_ha,
            season=request.season or "Kharif",
            nitrogen=request.nitrogen or 55.0,
            phosphorus=request.phosphorus or 32.0,
            potassium=request.potassium or 45.0,
            ph=request.ph or 6.4,
            rainfall_mm=request.rainfall_mm or 1100.0,
            temperature_c=request.temperature_c or 27.5,
            humidity=request.humidity or 75.0
        )
        return YieldPredictionResponse(**res)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/profit-calculation", response_model=ProfitCalculationResponse)
def compute_profit(request: ProfitCalculationRequest):
    try:
        res = calculate_farm_profit(
            crop=request.crop,
            district=request.district,
            area_ha=request.area_ha,
            production_tonnes=request.production_tonnes,
            mandi_price_per_quintal=request.mandi_price_per_quintal
        )
        return ProfitCalculationResponse(**res)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

class FullFarmAnalysisPayload(FullFarmAnalysisRequest):
    loan_input: Optional[LoanProfileInput] = None

@router.post("/full-farm-analysis")
def run_full_farm_analysis(payload: FullFarmAnalysisPayload):
    try:
        district_name = payload.district or "Cuttack"
        season_name = payload.season or "Kharif"
        area_ha = payload.area_ha or 2.5
        current_crop = getattr(payload, "current_crop", None)

        analysis_result = ml_service.run_loan_aware_farm_analysis(
            district=district_name,
            season=season_name,
            area_ha=area_ha,
            loan_input=payload.loan_input,
            latitude=payload.latitude,
            longitude=payload.longitude,
            current_crop=current_crop
        )

        rec_crop = analysis_result["crop_recommendation"]["recommended_crop"]
        try:
            forecast = get_price_forecast(rec_crop, district_name)
            analysis_result["price_forecast"] = forecast
        except Exception:
            analysis_result["price_forecast"] = None

        return analysis_result
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/production-prediction", response_model=ProductionPredictionResponse)
def get_production_prediction(request: ProductionPredictionRequest):
    try:
        return ml_service.predict_production(request)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/market-price", response_model=MarketPriceResponse)
def get_market_price(request: MarketPriceRequest):
    try:
        data = weather_service.get_market_price(request.crop, request.district)
        return MarketPriceResponse(
            crop=data["crop"],
            market=request.market or data["district"],
            current_price_per_quintal=data["price_per_quintal"],
            date=data["date"]
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/price-forecast", response_model=PriceForecastResponse)
def get_price_forecast_endpoint(request: PriceForecastRequest):
    try:
        result = get_price_forecast(request.crop, request.district)
        return PriceForecastResponse(**result)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
