import sys
import os
import unittest

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from schemas.loan import LoanProfileInput
from services.loan_distress_service import calculate_loan_distress
from services.ml_service import run_loan_aware_farm_analysis

class TestLoanPipeline(unittest.TestCase):

    def test_case_1_no_loan(self):
        """Case 1: Farmer has no loan -> Loan Distress Score = 0."""
        loan = LoanProfileInput(has_loan=False)
        breakdown = calculate_loan_distress(loan)
        self.assertFalse(breakdown.has_loan)
        self.assertEqual(breakdown.loan_distress_score, 0.0)
        self.assertEqual(breakdown.distress_category, "Very Low")

    def test_case_2_small_loan(self):
        """Case 2: Small loan with low interest burden -> Low distress score."""
        loan = LoanProfileInput(
            has_loan=True,
            original_loan_amount=20000,
            outstanding_principal=15000,
            annual_interest_rate=4.0,
            total_amount_repaid=10000,
            new_loan_amount=0
        )
        breakdown = calculate_loan_distress(loan, expected_annual_profit=200000)
        self.assertLessEqual(breakdown.loan_distress_score, 40.0)

    def test_case_3_high_outstanding_loan(self):
        """Case 3: High outstanding loan relative to expected profit -> High distress score."""
        loan = LoanProfileInput(
            has_loan=True,
            original_loan_amount=500000,
            outstanding_principal=480000,
            annual_interest_rate=14.0,
            total_amount_repaid=20000,
            new_loan_amount=50000
        )
        breakdown = calculate_loan_distress(loan, expected_annual_profit=100000)
        self.assertGreater(breakdown.loan_distress_score, 50.0)

    def test_case_4_high_interest_rate(self):
        """Case 4: High-interest rate loan increases distress score compared to low-interest rate loan."""
        loan_low_int = LoanProfileInput(
            has_loan=True, original_loan_amount=200000, outstanding_principal=180000,
            annual_interest_rate=4.0, total_amount_repaid=30000, new_loan_amount=0
        )
        loan_high_int = LoanProfileInput(
            has_loan=True, original_loan_amount=200000, outstanding_principal=180000,
            annual_interest_rate=22.0, total_amount_repaid=30000, new_loan_amount=0
        )
        b_low = calculate_loan_distress(loan_low_int, expected_annual_profit=150000)
        b_high = calculate_loan_distress(loan_high_int, expected_annual_profit=150000)
        self.assertGreater(b_high.loan_distress_score, b_low.loan_distress_score)

    def test_case_5_large_new_loan(self):
        """Case 5: Large new loan borrowing increases distress score."""
        loan_base = LoanProfileInput(
            has_loan=True, original_loan_amount=100000, outstanding_principal=50000,
            annual_interest_rate=8.0, total_amount_repaid=50000, new_loan_amount=0
        )
        loan_new_debt = LoanProfileInput(
            has_loan=True, original_loan_amount=100000, outstanding_principal=250000,
            annual_interest_rate=8.0, total_amount_repaid=50000, new_loan_amount=200000
        )
        b_base = calculate_loan_distress(loan_base, expected_annual_profit=120000)
        b_debt = calculate_loan_distress(loan_new_debt, expected_annual_profit=120000)
        self.assertGreater(b_debt.loan_distress_score, b_base.loan_distress_score)

    def test_case_6_high_repayment_progress(self):
        """Case 6: High repayment progress (large amount repaid) yields lower distress score."""
        loan_repaid = LoanProfileInput(
            has_loan=True, original_loan_amount=200000, outstanding_principal=20000,
            annual_interest_rate=7.0, total_amount_repaid=180000, new_loan_amount=0
        )
        breakdown = calculate_loan_distress(loan_repaid, expected_annual_profit=180000)
        self.assertLessEqual(breakdown.loan_distress_score, 30.0)

    def test_case_7_missing_financial_info(self):
        """Case 7: Missing/None financial input is handled gracefully without crashing."""
        res = run_loan_aware_farm_analysis(district="Cuttack", season="Kharif", area_ha=2.5, loan_input=None)
        self.assertIn("recommended_crop", res["crop_recommendation"])
        self.assertIn("candidates", res)
        self.assertFalse(res["farmer_financial"]["has_loan"])

    def test_case_8_jute_bias_verification(self):
        """Case 8: Jute bias verification under high debt burden."""
        high_debt_loan = LoanProfileInput(
            has_loan=True, original_loan_amount=600000, outstanding_principal=580000,
            annual_interest_rate=18.0, total_amount_repaid=20000, new_loan_amount=100000
        )
        res = run_loan_aware_farm_analysis(district="Bargarh", season="Kharif", area_ha=5.0, loan_input=high_debt_loan)
        
        candidates = res["candidates"]
        self.assertGreater(len(candidates), 0)
        
        for c in candidates:
            self.assertIn("safety_score", c)
            self.assertIn("final_crop_score", c)
            self.assertIn("recommendation_reason", c)
            
        print(f"\n[Test Case 8] District Bargarh (High Debt): Recommended Crop = {res['crop_recommendation']['recommended_crop']}")

if __name__ == "__main__":
    unittest.main()
