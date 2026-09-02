from sqlalchemy import Column, Integer, String, Float, DateTime
from datetime import datetime
from database_login import LoginBase

class FarmerLoginDetails(LoginBase):
    __tablename__ = "farmer_login_details"

    id = Column(Integer, primary_key=True, index=True)
    phone = Column(String, unique=True, index=True, nullable=False)
    pin = Column(String, nullable=False)
    first_name = Column(String, nullable=True)
    last_name = Column(String, nullable=True)
    district = Column(String, default="Cuttack")
    dob = Column(String, nullable=True)
    land_area_ha = Column(Float, default=2.5)
    preferred_language = Column(String, default="en")
    created_at = Column(DateTime, default=datetime.utcnow)
