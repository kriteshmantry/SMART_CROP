from pydantic import BaseModel
from typing import Optional, List, Dict, Any

class LoanProfileInput(BaseModel):
    has_loan: bool = False
    original_loan_amount: Optional[float] = 0.0
    outstanding_principal: Optional[float] = 0.0
    annual_interest_rate: Optional[float] = 0.0
    total_amount_repaid: Optional[float] = 0.0
    new_loan_amount: Optional[float] = 0.0
    loan_start_date: Optional[str] = None
    loan_tenure_months: Optional[int] = 12
    repayment_frequency: Optional[str] = "Yearly"
    lender_source: Optional[str] = "Bank"

class LoanDistressBreakdown(BaseModel):
    has_loan: bool
    original_loan_amount: float
    outstanding_principal: float
    annual_interest_rate: float
    annual_interest_burden: float
    monthly_interest_burden: float
    principal_repaid_calculated: float
    repayment_ratio: float
    repayment_risk_score: float
    new_borrowing_ratio: float
    loan_distress_score: float
    distress_category: str # Very Low, Low, Moderate, High, Very High
    data_consistency_flag: Optional[str] = None

class CandidateCropScoreItem(BaseModel):
    rank: int
    crop: str
    suitability_score: float
    predicted_yield_tonnes_per_ha: float
    predicted_total_production_tonnes: float
    mandi_price_per_quintal: float
    expected_gross_revenue: float
    cultivation_cost_per_ha: float
    total_cultivation_cost: float
    expected_net_profit: float
    profit_score: float
    crop_distress_component: float
    loan_distress_score: float
    final_distress_score: float
    safety_score: float
    final_crop_score: float
    recommendation_reason: str
