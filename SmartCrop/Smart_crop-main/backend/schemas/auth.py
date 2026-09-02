from pydantic import BaseModel
from typing import Optional

class PhoneCheckRequest(BaseModel):
    phone: str

class PhoneCheckResponse(BaseModel):
    status: str
    exists: bool
    phone: str
    message: str

class FarmerProfileSchema(BaseModel):
    phone: str
    first_name: Optional[str] = ""
    last_name: Optional[str] = ""
    district: Optional[str] = "Cuttack"
    dob: Optional[str] = ""
    land_area_ha: Optional[float] = 2.5
    preferred_language: Optional[str] = "en"

class PinRegisterRequest(BaseModel):
    phone: str
    pin: str
    first_name: Optional[str] = ""
    last_name: Optional[str] = ""
    district: Optional[str] = "Cuttack"
    dob: Optional[str] = ""
    land_area_ha: Optional[float] = 2.5
    preferred_language: Optional[str] = "en"
    role: Optional[str] = "farmer"

class PinLoginRequest(BaseModel):
    phone: str
    pin: str
    role: Optional[str] = "farmer"

class AuthTokenResponse(BaseModel):
    status: str
    token: str
    role: str
    phone: Optional[str] = None
    message: Optional[str] = None
    profile: Optional[FarmerProfileSchema] = None

class OTPRequest(BaseModel):
    phone: str
    role: Optional[str] = "farmer"

class OTPVerify(BaseModel):
    phone: str
    otp: str
    role: Optional[str] = "farmer"

class OTPResponse(BaseModel):
    status: str
    message: str
    expires_in: int = 300
    resend_cooldown: int = 30
    test_otp: Optional[str] = None

class OfficerLogin(BaseModel):
    username: str
    password: str
