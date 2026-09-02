from pydantic import BaseModel
from typing import Optional, List, Dict, Any

class CropRecommendationRequest(BaseModel):
    N: float
    P: float
    K: float
    ph: float
    district: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    temperature: Optional[float] = None
    humidity: Optional[float] = None
    rainfall: Optional[float] = None
    season: Optional[str] = "Kharif"
    top_k: Optional[int] = 3

class CropRankItem(BaseModel):
    crop: str
    probability: float
    confidence_percentage: str

class CropRecommendationResponse(BaseModel):
    recommended_crop: str
    confidence: float
    top_recommendations: List[CropRankItem]
    input_summary: Dict[str, Any]

class YieldPredictionRequest(BaseModel):
    crop: str
    district: str
    area_ha: float
    season: Optional[str] = "Kharif"
    nitrogen: Optional[float] = 55.0
    phosphorus: Optional[float] = 32.0
    potassium: Optional[float] = 45.0
    ph: Optional[float] = 6.4
    rainfall_mm: Optional[float] = 1100.0
    temperature_c: Optional[float] = 27.5
    humidity: Optional[float] = 75.0

class YieldPredictionResponse(BaseModel):
    crop: str
    district: str
    area_ha: float
    season: str
    predicted_yield_tonnes_per_ha: float
    predicted_total_production_tonnes: float
    model_used: str
    status: str

# Master Unified Analysis Schema (Cascading Pipeline)
class FullFarmAnalysisRequest(BaseModel):
    district: Optional[str] = "Cuttack"
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    season: Optional[str] = "Kharif"
    area_ha: Optional[float] = 2.5
    current_crop: Optional[str] = None

class FullFarmAnalysisResponse(BaseModel):
    location_summary: Dict[str, Any]
    crop_recommendation: CropRecommendationResponse
    yield_prediction: YieldPredictionResponse
    market_price_summary: Dict[str, Any]
    profit_analysis: Dict[str, Any]
    price_forecast: Optional[Dict[str, Any]] = None

class ProfitCalculationRequest(BaseModel):
    crop: str
    district: str
    area_ha: float
    production_tonnes: float
    mandi_price_per_quintal: float

class ProfitCalculationResponse(BaseModel):
    crop: str
    district: str
    area_ha: float
    cost_per_ha_inr: float
    total_cost_inr: float
    mandi_price_per_quintal: float
    mandi_price_per_tonne: float
    total_revenue_inr: float
    net_profit_inr: float
    roi_percent: float
    formatted_cost: str
    formatted_revenue: str
    formatted_profit: str
    status: str

class ProductionPredictionRequest(BaseModel):
    crop: str
    district: str
    area: float
    season: str
    rainfall: Optional[float] = None

class ProductionPredictionResponse(BaseModel):
    expected_production_tonnes: float

class MarketPriceRequest(BaseModel):
    crop: str
    district: str
    market: Optional[str] = None

class MarketPriceResponse(BaseModel):
    crop: str
    market: str
    current_price_per_quintal: float
    date: str

class PriceForecastRequest(BaseModel):
    crop: str
    district: str

class PriceHistoryPoint(BaseModel):
    date: str
    price: float

class PriceForecastResponse(BaseModel):
    crop: str
    district: str
    current_price_per_quintal: float
    price_source: str
    data_date: str
    trend: str
    slope_per_day: float
    forecast_15d: float
    forecast_30d: float
    forecast_90d: float
    change_15d_pct: float
    change_30d_pct: float
    change_90d_pct: float
    price_history: List[PriceHistoryPoint]
    history_days: int
    status: str
