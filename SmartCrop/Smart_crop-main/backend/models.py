from sqlalchemy import Boolean, Column, Integer, String, Float, ForeignKey, DateTime
from sqlalchemy.orm import relationship
from datetime import datetime
from database import Base

class Farmer(Base):
    __tablename__ = "farmers"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True)
    phone = Column(String, unique=True, index=True)
    language = Column(String, default="en")
    district = Column(String, index=True)
    crop = Column(String)
    soil_type = Column(String)
    
    loan_amount = Column(Float, default=0.0)
    days_to_loan_due = Column(Integer, default=365)
    
    records = relationship("FarmerRecord", back_populates="farmer")
    financial_profile = relationship("FarmerFinancialProfile", back_populates="farmer", uselist=False)


class FarmerRecord(Base):
    __tablename__ = "farmer_records"

    id = Column(Integer, primary_key=True, index=True)
    farmer_id = Column(Integer, ForeignKey("farmers.id"))
    
    rainfall_deviation_percent = Column(Float, default=0.0)
    mandi_price_drop_percent = Column(Float, default=0.0)
    distress_score = Column(Float, default=0.0)
    
    farmer = relationship("Farmer", back_populates="records")


class FarmerFinancialProfile(Base):
    __tablename__ = "farmer_financial_profiles"

    id = Column(Integer, primary_key=True, index=True)
    farmer_id = Column(Integer, ForeignKey("farmers.id"), unique=True)
    
    has_loan = Column(Boolean, default=False)
    original_loan_amount = Column(Float, default=0.0)
    outstanding_principal = Column(Float, default=0.0)
    annual_interest_rate = Column(Float, default=0.0)
    total_amount_repaid = Column(Float, default=0.0)
    new_loan_amount = Column(Float, default=0.0)
    loan_start_date = Column(String, nullable=True)
    loan_tenure_months = Column(Integer, default=12)
    repayment_frequency = Column(String, default="Yearly") # Monthly, Quarterly, Half-yearly, Yearly
    lender_source = Column(String, default="Bank") # Bank, Cooperative, Government scheme, Microfinance, Other
    
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    farmer = relationship("Farmer", back_populates="financial_profile")
