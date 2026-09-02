import os
import secrets
from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session

import database_login
from models_login import FarmerLoginDetails
import schemas

router = APIRouter()

def get_db():
    db = database_login.LoginSessionLocal()
    try:
        yield db
    finally:
        db.close()


import database
import models

ODISHA_DISTRICTS_MAP = {
    "angul": "Angul", "balangir": "Balangir", "balasore": "Balasore", "baleswar": "Balasore",
    "bargarh": "Bargarh", "bhadrak": "Bhadrak", "boudh": "Boudh", "cuttack": "Cuttack",
    "deogarh": "Deogarh", "dhenkanal": "Dhenkanal", "gajapati": "Gajapati", "ganjam": "Ganjam",
    "jagatsinghpur": "Jagatsinghpur", "jajpur": "Jajpur", "jharsuguda": "Jharsuguda",
    "kalahandi": "Kalahandi", "kandhamal": "Kandhamal", "kendrapara": "Kendrapara",
    "kendujhar": "Kendujhar", "keonjhar": "Kendujhar", "khordha": "Khordha", "khurda": "Khordha",
    "koraput": "Koraput", "malkangiri": "Malkangiri", "mayurbhanj": "Mayurbhanj",
    "nabarangpur": "Nabarangpur", "nayagarh": "Nayagarh", "nuapada": "Nuapada",
    "puri": "Puri", "rayagada": "Rayagada", "sambalpur": "Sambalpur",
    "subarnapur": "Subarnapur", "sonepur": "Subarnapur", "sundargarh": "Sundargarh"
}

def sync_farmer_to_main_db(phone: str, first_name: str, last_name: str, district: str, land_area_ha: float = 2.5, language: str = "en"):
    main_db = database.SessionLocal()
    try:
        farmer_name = f"{first_name} {last_name}".strip()
        existing = main_db.query(models.Farmer).filter(models.Farmer.phone == phone).first()
        if existing:
            existing.name = farmer_name
            existing.district = district
            existing.language = language
        else:
            new_farmer = models.Farmer(
                name=farmer_name,
                phone=phone,
                language=language,
                district=district,
                crop="Paddy",
                soil_type="Alluvial",
                loan_amount=0.0,
                days_to_loan_due=60
            )
            main_db.add(new_farmer)
            main_db.flush()
            new_record = models.FarmerRecord(
                farmer_id=new_farmer.id,
                rainfall_deviation_percent=-15.0,
                mandi_price_drop_percent=12.0,
                distress_score=45.0
            )
            main_db.add(new_record)
        main_db.commit()
    except Exception as e:
        main_db.rollback()
        print(f"Error syncing farmer to main DB: {e}")
    finally:
        main_db.close()


@router.post("/auth/check-mobile", response_model=schemas.PhoneCheckResponse)
def check_mobile(req: schemas.PhoneCheckRequest, db: Session = Depends(get_db)):
    phone = "".join(filter(str.isdigit, req.phone.strip()))
    
    if len(phone) < 10:
        raise HTTPException(status_code=400, detail="Please enter a valid 10-digit mobile number.")
        
    farmer = db.query(FarmerLoginDetails).filter(FarmerLoginDetails.phone == phone).first()
    exists = farmer is not None
    msg = "Mobile number registered. Please enter your 4-digit PIN to log in." if exists else "New farmer account. Please set a 4-digit PIN to register."
    
    return {
        "status": "success",
        "exists": exists,
        "phone": phone,
        "message": msg
    }


@router.post("/auth/register-pin", response_model=schemas.AuthTokenResponse)
def register_pin(req: schemas.PinRegisterRequest, db: Session = Depends(get_db)):
    phone = "".join(filter(str.isdigit, req.phone.strip()))
    pin = req.pin.strip()
    
    if len(phone) < 10:
        raise HTTPException(status_code=400, detail="Please enter a valid 10-digit mobile number.")
    if len(pin) != 4 or not pin.isdigit():
        raise HTTPException(status_code=400, detail="PIN must be exactly 4 numeric digits.")
        
    first_name = (req.first_name and req.first_name.strip()) or "Farmer"
    last_name = (req.last_name and req.last_name.strip()) or (phone[-4:] if len(phone) >= 4 else "Node")
    district = req.district.strip() if (req.district and req.district.strip()) else "Cuttack"
    dob = req.dob.strip() if (req.dob and req.dob.strip()) else "1990-01-01"
    land_area = float(req.land_area_ha or 2.5)
    pref_lang = (req.preferred_language and req.preferred_language.strip()) or "en"

    existing = db.query(FarmerLoginDetails).filter(FarmerLoginDetails.phone == phone).first()
    if existing:
        existing.pin = pin
        existing.first_name = first_name if first_name != "Farmer" else (existing.first_name or first_name)
        existing.last_name = last_name if last_name != phone[-4:] else (existing.last_name or last_name)
        existing.district = district or existing.district
        existing.dob = dob or existing.dob
        existing.land_area_ha = land_area or existing.land_area_ha
        existing.preferred_language = pref_lang or existing.preferred_language or "en"
        farmer = existing
    else:
        farmer = FarmerLoginDetails(
            phone=phone,
            pin=pin,
            first_name=first_name,
            last_name=last_name,
            district=district,
            dob=dob,
            land_area_ha=land_area,
            preferred_language=pref_lang
        )
        db.add(farmer)
        
    db.commit()
    db.refresh(farmer)
    
    # Synchronize to main DB (smartcrop.db)
    sync_farmer_to_main_db(farmer.phone, farmer.first_name, farmer.last_name, farmer.district, farmer.land_area_ha, farmer.preferred_language)

    token = f"smartcrop-farmer-token-{secrets.token_hex(16)}"
    return {
        "status": "success",
        "token": token,
        "role": "farmer",
        "phone": phone,
        "message": f"Farmer account for mobile {phone} registered successfully!",
        "profile": {
            "phone": farmer.phone,
            "first_name": farmer.first_name,
            "last_name": farmer.last_name,
            "district": farmer.district,
            "dob": farmer.dob,
            "land_area_ha": farmer.land_area_ha,
            "preferred_language": farmer.preferred_language or "en"
        }
    }


@router.post("/auth/login-pin", response_model=schemas.AuthTokenResponse)
def login_pin(req: schemas.PinLoginRequest, db: Session = Depends(get_db)):
    phone = "".join(filter(str.isdigit, req.phone.strip()))
    pin = req.pin.strip()
    
    if len(phone) < 10:
        raise HTTPException(status_code=400, detail="Please enter a valid 10-digit mobile number.")
        
    farmer = db.query(FarmerLoginDetails).filter(FarmerLoginDetails.phone == phone).first()
    if not farmer:
        raise HTTPException(
            status_code=404, 
            detail=f"Mobile number {phone} is not registered yet. Click 'Sign Up' below to create your account in 5 seconds!"
        )
        
    if farmer.pin != pin:
        raise HTTPException(
            status_code=401, 
            detail="Incorrect 4-digit PIN. Please enter your registered PIN."
        )

    # Ensure main DB sync exists
    sync_farmer_to_main_db(farmer.phone, farmer.first_name, farmer.last_name, farmer.district, farmer.land_area_ha, farmer.preferred_language)
        
    token = f"smartcrop-farmer-token-{secrets.token_hex(16)}"
    return {
        "status": "success",
        "token": token,
        "role": "farmer",
        "phone": phone,
        "message": "PIN verified successfully. Logging in...",
        "profile": {
            "phone": farmer.phone,
            "first_name": farmer.first_name,
            "last_name": farmer.last_name,
            "district": farmer.district,
            "dob": farmer.dob,
            "land_area_ha": farmer.land_area_ha,
            "preferred_language": farmer.preferred_language or "en"
        }
    }


@router.get("/auth/farmer-profile/{phone}")
def get_farmer_profile(phone: str, db: Session = Depends(get_db)):
    clean_phone = "".join(filter(str.isdigit, phone.strip()))
    farmer = db.query(FarmerLoginDetails).filter(FarmerLoginDetails.phone == clean_phone).first()
    if not farmer:
        raise HTTPException(status_code=404, detail="Farmer profile not found.")
        
    return {
        "status": "success",
        "profile": {
            "phone": farmer.phone,
            "first_name": farmer.first_name,
            "last_name": farmer.last_name,
            "district": farmer.district,
            "dob": farmer.dob,
            "land_area_ha": farmer.land_area_ha,
            "preferred_language": farmer.preferred_language or "en"
        }
    }


@router.post("/auth/update-district")
def update_district(req: dict, db: Session = Depends(get_db)):
    phone = "".join(filter(str.isdigit, str(req.get("phone", "")).strip()))
    new_district = str(req.get("district", "")).strip()
    if not phone or not new_district:
        raise HTTPException(status_code=400, detail="Phone and district are required.")
        
    clean_10 = phone[-10:] if len(phone) >= 10 else phone

    # 1. Update in FarmerLoginDetails (login_details.db)
    farmer_login = db.query(FarmerLoginDetails).filter(FarmerLoginDetails.phone.like(f"%{clean_10}%")).first()
    first_name = "Farmer"
    last_name = clean_10[-4:]
    land_area = 2.5
    lang = "en"
    
    if farmer_login:
        farmer_login.district = new_district
        first_name = farmer_login.first_name or first_name
        last_name = farmer_login.last_name or last_name
        land_area = farmer_login.land_area_ha or land_area
        lang = farmer_login.preferred_language or lang
        db.commit()
    
    # 2. Direct update in main smartcrop.db (models.Farmer)
    main_db = database.SessionLocal()
    try:
        main_farmers = main_db.query(models.Farmer).filter(models.Farmer.phone.like(f"%{clean_10}%")).all()
        if main_farmers:
            for mf in main_farmers:
                mf.district = new_district
            main_db.commit()
        else:
            sync_farmer_to_main_db(phone, first_name, last_name, new_district, land_area, lang)
    except Exception as e:
        main_db.rollback()
        print(f"Error updating main farmer district: {e}")
    finally:
        main_db.close()
        
    return {"status": "success", "message": f"District relocated to {new_district} for farmer {phone}"}


# Retain OTP Request & Verify for legacy compatibility
@router.post("/auth/request-otp", response_model=schemas.OTPResponse)
def request_otp(req: schemas.OTPRequest, db: Session = Depends(get_db)):
    phone = "".join(filter(str.isdigit, req.phone.strip()))
    farmer = db.query(FarmerLoginDetails).filter(FarmerLoginDetails.phone == phone).first()
    exists = farmer is not None
    return {
        "status": "success",
        "message": "Enter your 4-digit PIN to continue." if exists else "Set up a 4-digit PIN to register.",
        "expires_in": 300,
        "resend_cooldown": 30
    }


@router.post("/auth/verify-otp", response_model=schemas.AuthTokenResponse)
def verify_otp(req: schemas.OTPVerify, db: Session = Depends(get_db)):
    phone = "".join(filter(str.isdigit, req.phone.strip()))
    pin = req.otp.strip()
    
    farmer = db.query(FarmerLoginDetails).filter(FarmerLoginDetails.phone == phone).first()
    if farmer:
        if farmer.pin != pin:
            raise HTTPException(status_code=401, detail="Incorrect 4-digit PIN. Please enter your registered PIN.")
    else:
        if len(pin) == 4 and pin.isdigit():
            farmer = FarmerLoginDetails(phone=phone, pin=pin, first_name="Farmer", last_name=phone[-4:])
            db.add(farmer)
            db.commit()
            db.refresh(farmer)
            
    if farmer:
        sync_farmer_to_main_db(farmer.phone, farmer.first_name, farmer.last_name, farmer.district or "Cuttack", farmer.land_area_ha or 2.5, "en")

    token = f"smartcrop-farmer-token-{secrets.token_hex(16)}"
    return {
        "status": "success",
        "token": token,
        "role": "farmer",
        "phone": phone,
        "message": "Authenticated successfully.",
        "profile": {
            "phone": farmer.phone,
            "first_name": farmer.first_name,
            "last_name": farmer.last_name,
            "district": farmer.district,
            "dob": farmer.dob,
            "land_area_ha": farmer.land_area_ha
        } if farmer else None
    }


@router.post("/auth/officer-login")
def officer_login(req: schemas.OfficerLogin):
    username = req.username.strip().lower()
    password = req.password.strip()

    if password != "123":
        raise HTTPException(status_code=401, detail="Invalid credentials. Password must be 123.")

    if username == "admin":
        return {
            "status": "success",
            "token": f"smartcrop-officer-token-{secrets.token_hex(16)}",
            "role": "officer",
            "district": "Khordha",
            "username": "admin"
        }

    if username.startswith("admin_"):
        raw_dist = username[6:].strip()
        matched_district = ODISHA_DISTRICTS_MAP.get(raw_dist, raw_dist.capitalize())
        return {
            "status": "success",
            "token": f"smartcrop-officer-token-{secrets.token_hex(16)}",
            "role": "officer",
            "district": matched_district,
            "username": req.username
        }

    matched_district = ODISHA_DISTRICTS_MAP.get(username, "Khordha")
    return {
        "status": "success",
        "token": f"smartcrop-officer-token-{secrets.token_hex(16)}",
        "role": "officer",
        "district": matched_district,
        "username": req.username
    }

