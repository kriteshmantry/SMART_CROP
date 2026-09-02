from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
import database
import models
import schemas
from services.loan_distress_service import calculate_loan_distress

router = APIRouter()

@router.post("/loan-distress", response_model=schemas.LoanDistressBreakdown)
def compute_loan_distress_standalone(loan: schemas.LoanProfileInput, expected_profit: float = 150000.0):
    return calculate_loan_distress(loan, expected_annual_profit=expected_profit)

@router.post("/financial-profile/{farmer_id}", response_model=schemas.LoanDistressBreakdown)
def save_farmer_financial_profile(farmer_id: int, loan: schemas.LoanProfileInput, db: Session = Depends(database.get_db)):
    db_farmer = db.query(models.Farmer).filter(models.Farmer.id == farmer_id).first()
    if not db_farmer:
        raise HTTPException(status_code=404, detail="Farmer not found")

    profile = db.query(models.FarmerFinancialProfile).filter(models.FarmerFinancialProfile.farmer_id == farmer_id).first()
    if not profile:
        profile = models.FarmerFinancialProfile(farmer_id=farmer_id)
        db.add(profile)

    profile.has_loan = loan.has_loan
    profile.original_loan_amount = loan.original_loan_amount or 0.0
    profile.outstanding_principal = loan.outstanding_principal or 0.0
    profile.annual_interest_rate = loan.annual_interest_rate or 0.0
    profile.total_amount_repaid = loan.total_amount_repaid or 0.0
    profile.new_loan_amount = loan.new_loan_amount or 0.0
    profile.loan_start_date = loan.loan_start_date
    profile.loan_tenure_months = loan.loan_tenure_months or 12
    profile.repayment_frequency = loan.repayment_frequency or "Yearly"
    profile.lender_source = loan.lender_source or "Bank"

    db.commit()
    db.refresh(profile)

    breakdown = calculate_loan_distress(loan)
    return breakdown

@router.post("/financial-profile-by-phone/{phone}", response_model=schemas.LoanDistressBreakdown)
def save_farmer_financial_profile_by_phone(phone: str, loan: schemas.LoanProfileInput, db: Session = Depends(database.get_db)):
    clean_phone = "".join(filter(str.isdigit, phone))[-10:]
    db_farmer = db.query(models.Farmer).filter(models.Farmer.phone.like(f"%{clean_phone}%")).first()
    if not db_farmer:
        # We can't save loan data if the farmer hasn't been synced to the main DB yet.
        # But wait, we can just create them!
        db_farmer = models.Farmer(
            name="Unknown",
            phone=clean_phone,
            language="en",
            district="Cuttack",
            crop="Paddy",
            soil_type="Alluvial",
            loan_amount=0.0
        )
        db.add(db_farmer)
        db.flush()

    profile = db.query(models.FarmerFinancialProfile).filter(models.FarmerFinancialProfile.farmer_id == db_farmer.id).first()
    if not profile:
        profile = models.FarmerFinancialProfile(farmer_id=db_farmer.id)
        db.add(profile)

    profile.has_loan = loan.has_loan
    profile.original_loan_amount = loan.original_loan_amount or 0.0
    profile.outstanding_principal = loan.outstanding_principal or 0.0
    profile.annual_interest_rate = loan.annual_interest_rate or 0.0
    profile.total_amount_repaid = loan.total_amount_repaid or 0.0
    profile.new_loan_amount = loan.new_loan_amount or 0.0
    profile.loan_start_date = loan.loan_start_date
    profile.loan_tenure_months = loan.loan_tenure_months or 12
    profile.repayment_frequency = loan.repayment_frequency or "Yearly"
    profile.lender_source = loan.lender_source or "Bank"

    db.commit()
    db.refresh(profile)

    breakdown = calculate_loan_distress(loan)
    return breakdown

@router.get("/financial-profile-by-phone/{phone}", response_model=schemas.LoanProfileInput)
def get_farmer_financial_profile_by_phone(phone: str, db: Session = Depends(database.get_db)):
    clean_phone = "".join(filter(str.isdigit, phone))[-10:]
    db_farmer = db.query(models.Farmer).filter(models.Farmer.phone.like(f"%{clean_phone}%")).first()
    
    if not db_farmer:
        return {"has_loan": False}

    profile = db.query(models.FarmerFinancialProfile).filter(models.FarmerFinancialProfile.farmer_id == db_farmer.id).first()
    if not profile:
        return {"has_loan": False}

    return schemas.LoanProfileInput(
        has_loan=profile.has_loan,
        original_loan_amount=profile.original_loan_amount,
        outstanding_principal=profile.outstanding_principal,
        annual_interest_rate=profile.annual_interest_rate,
        total_amount_repaid=profile.total_amount_repaid,
        new_loan_amount=profile.new_loan_amount,
        loan_start_date=profile.loan_start_date,
        loan_tenure_months=profile.loan_tenure_months,
        repayment_frequency=profile.repayment_frequency,
        lender_source=profile.lender_source
    )

@router.get("/financial-profile/{farmer_id}")
def get_farmer_financial_profile(farmer_id: int, db: Session = Depends(database.get_db)):
    profile = db.query(models.FarmerFinancialProfile).filter(models.FarmerFinancialProfile.farmer_id == farmer_id).first()
    if not profile:
        return {"has_loan": False, "loan_distress_score": 0.0, "distress_category": "Very Low"}

    loan_input = schemas.LoanProfileInput(
        has_loan=profile.has_loan,
        original_loan_amount=profile.original_loan_amount,
        outstanding_principal=profile.outstanding_principal,
        annual_interest_rate=profile.annual_interest_rate,
        total_amount_repaid=profile.total_amount_repaid,
        new_loan_amount=profile.new_loan_amount,
        loan_start_date=profile.loan_start_date,
        loan_tenure_months=profile.loan_tenure_months,
        repayment_frequency=profile.repayment_frequency,
        lender_source=profile.lender_source
    )
    breakdown = calculate_loan_distress(loan_input)
    return breakdown.dict()
