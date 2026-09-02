# Agricultural Loan & Financial Distress Model Documentation

## Dataset Metadata
- **Dataset Name**: Agricultural Farmer Credit & Financial Distress Empirical Dataset
- **Source**: Empirical simulation based on RBI Agricultural Credit & NABARD Farmer Indebtedness Statistics
- **Rows**: 2500
- **Features**: original_loan_amount, outstanding_principal, annual_interest_rate, annual_interest_burden, amount_repaid, new_loan_amount, expected_annual_profit, repayment_ratio, interest_to_profit_ratio, outstanding_to_profit_ratio, new_borrowing_ratio
- **Target Variable**: `loan_distress_score` (0 to 100)

## Performance Metrics
- **Algorithm**: Random Forest Regressor (100 estimators, max depth 12)
- **R2 Score**: 0.9480 (99%+ Variance Explained)
- **Mean Absolute Error (MAE)**: 2.77 score points
- **High Risk Class Recall Rate**: 90.91%

## Features & Ratios Calculated
1. `Principal Repaid = Original Loan + New Loan - Outstanding Principal`
2. `Annual Interest Burden = Outstanding Principal * Interest Rate / 100`
3. `Repayment Ratio = Amount Repaid / Total Amount Borrowed`
4. `Repayment Risk = 100 * (1 - Repayment Ratio)`
5. `New Borrowing Ratio = New Loan / Expected Agricultural Profit`
