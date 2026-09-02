import os
import pickle
import numpy as np
import pandas as pd
from schemas.loan import LoanProfileInput, LoanDistressBreakdown

MODEL_PATH = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "models", "loan_distress", "loan_distress_pipeline.pkl")

_LOAN_MODEL_CACHE = None

def _load_loan_model():
    global _LOAN_MODEL_CACHE
    if _LOAN_MODEL_CACHE is None and os.path.exists(MODEL_PATH):
        try:
            with open(MODEL_PATH, "rb") as f:
                _LOAN_MODEL_CACHE = pickle.load(f)
            print(f"[LoanDistressService] Successfully loaded Loan Distress ML model.")
        except Exception as e:
            print(f"[LoanDistressService] Model load note: {e}")
    return _LOAN_MODEL_CACHE

def calculate_loan_distress(loan: LoanProfileInput, expected_annual_profit: float = 150000.0) -> LoanDistressBreakdown:
    """
    Computes Loan Financial Distress Score & Breakdown.
    If has_loan is False, returns Loan Distress Score = 0 with zero penalty.
    """
    if not loan.has_loan:
        return LoanDistressBreakdown(
            has_loan=False,
            original_loan_amount=0.0,
            outstanding_principal=0.0,
            annual_interest_rate=0.0,
            annual_interest_burden=0.0,
            monthly_interest_burden=0.0,
            principal_repaid_calculated=0.0,
            repayment_ratio=1.0,
            repayment_risk_score=0.0,
            new_borrowing_ratio=0.0,
            loan_distress_score=0.0,
            distress_category="Very Low",
            data_consistency_flag=None
        )

    orig_loan = float(loan.original_loan_amount or 0.0)
    out_principal = float(loan.outstanding_principal or 0.0)
    rate = float(loan.annual_interest_rate or 0.0)
    repaid = float(loan.total_amount_repaid or 0.0)
    new_loan = float(loan.new_loan_amount or 0.0)

    total_borrowed = orig_loan + new_loan
    if total_borrowed <= 0:
        total_borrowed = max(1.0, out_principal + repaid)

    # 1. Principal Repaid Formula
    principal_repaid_calc = max(0.0, total_borrowed - out_principal)

    # Check for consistency
    flag = None
    if repaid > 0 and repaid < (principal_repaid_calc * 0.5):
        flag = "Inconsistency Warning: Total amount repaid is significantly lower than calculated principal repaid."

    # 2. Interest Burden
    annual_interest_burden = out_principal * (rate / 100.0)
    monthly_interest_burden = annual_interest_burden / 12.0

    # 3. Repayment Ratio & Risk Score
    repayment_ratio = min(1.0, max(0.0, repaid / total_borrowed if total_borrowed > 0 else 1.0))
    repayment_risk_score = 100.0 * (1.0 - repayment_ratio)

    # 4. New Borrowing Ratio & Ratios
    safe_profit = max(10000.0, expected_annual_profit)
    new_borrowing_ratio = new_loan / safe_profit
    interest_to_profit_ratio = annual_interest_burden / safe_profit
    outstanding_to_profit_ratio = out_principal / safe_profit

    # Evaluate ML Model
    model_data = _load_loan_model()
    if model_data and "model" in model_data:
        try:
            input_df = pd.DataFrame([{
                'original_loan_amount': orig_loan,
                'outstanding_principal': out_principal,
                'annual_interest_rate': rate,
                'annual_interest_burden': annual_interest_burden,
                'amount_repaid': repaid,
                'new_loan_amount': new_loan,
                'expected_annual_profit': safe_profit,
                'repayment_ratio': repayment_ratio,
                'interest_to_profit_ratio': interest_to_profit_ratio,
                'outstanding_to_profit_ratio': outstanding_to_profit_ratio,
                'new_borrowing_ratio': new_borrowing_ratio
            }])
            raw_score = float(model_data["model"].predict(input_df)[0])
            distress_score = round(max(0.0, min(100.0, raw_score)), 1)
        except Exception as e:
            distress_score = _calculate_empirical_distress_score(repayment_ratio, interest_to_profit_ratio, outstanding_to_profit_ratio, new_borrowing_ratio)
    else:
        distress_score = _calculate_empirical_distress_score(repayment_ratio, interest_to_profit_ratio, outstanding_to_profit_ratio, new_borrowing_ratio)

    # Categorize
    if distress_score <= 20.0:
        cat = "Very Low"
    elif distress_score <= 40.0:
        cat = "Low"
    elif distress_score <= 60.0:
        cat = "Moderate"
    elif distress_score <= 80.0:
        cat = "High"
    else:
        cat = "Very High"

    return LoanDistressBreakdown(
        has_loan=True,
        original_loan_amount=round(orig_loan, 2),
        outstanding_principal=round(out_principal, 2),
        annual_interest_rate=round(rate, 2),
        annual_interest_burden=round(annual_interest_burden, 2),
        monthly_interest_burden=round(monthly_interest_burden, 2),
        principal_repaid_calculated=round(principal_repaid_calc, 2),
        repayment_ratio=round(repayment_ratio, 4),
        repayment_risk_score=round(repayment_risk_score, 1),
        new_borrowing_ratio=round(new_borrowing_ratio, 4),
        loan_distress_score=distress_score,
        distress_category=cat,
        data_consistency_flag=flag
    )

def _calculate_empirical_distress_score(repayment_ratio, interest_to_profit_ratio, outstanding_to_profit_ratio, new_borrowing_ratio):
    score = (
        0.35 * (100.0 * (1.0 - repayment_ratio)) +
        0.25 * min(100.0, interest_to_profit_ratio * 100.0) +
        0.25 * min(100.0, outstanding_to_profit_ratio * 20.0) +
        0.15 * min(100.0, new_borrowing_ratio * 50.0)
    )
    return round(max(0.0, min(100.0, score)), 1)
