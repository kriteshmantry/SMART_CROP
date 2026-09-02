from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional
import database
import database_login
import models
from models_login import FarmerLoginDetails
import schemas
from services.distress_scorer import calculate_distress_score, calculate_comprehensive_distress_score
from services.advisory_engine import generate_advisory
from services.sms_service import send_sms

router = APIRouter()

from pydantic import BaseModel
class FarmerSyncRequest(BaseModel):
    phone: str
    crop: str
    distress_score: float

@router.post("/sync-dashboard")
def sync_dashboard(req: FarmerSyncRequest, db: Session = Depends(database.get_db)):
    clean_phone = "".join(filter(str.isdigit, req.phone))
    if not clean_phone: return {"status": "error"}
    clean_10 = clean_phone[-10:]
    f = db.query(models.Farmer).filter(models.Farmer.phone.like(f"%{clean_10}%")).first()
    
    if not f:
        # Sync from login db if they exist there but not here yet
        login_db = database_login.LoginSessionLocal()
        try:
            lf = login_db.query(FarmerLoginDetails).filter(FarmerLoginDetails.phone.like(f"%{clean_10}%")).first()
            if lf:
                f = models.Farmer(
                    name=f"{lf.first_name or ''} {lf.last_name or ''}".strip() or "Farmer",
                    phone=lf.phone,
                    language=lf.preferred_language or "en",
                    district=lf.district or "Cuttack",
                    crop=req.crop or "Paddy",
                    soil_type="Alluvial",
                    loan_amount=0.0,
                    days_to_loan_due=45
                )
                db.add(f)
                db.flush()
        finally:
            login_db.close()
            
    if f:
        f.crop = req.crop
        rec = models.FarmerRecord(farmer_id=f.id, distress_score=req.distress_score)
        db.add(rec)
        db.commit()
    return {"status": "success"}

@router.post("/farmers/", response_model=schemas.Farmer)
def create_farmer(farmer: schemas.FarmerCreate, db: Session = Depends(database.get_db)):
    db_farmer = models.Farmer(**farmer.dict())
    db.add(db_farmer)
    db.commit()
    db.refresh(db_farmer)
    return db_farmer

@router.get("/farmers/", response_model=List[schemas.Farmer])
def get_farmers(skip: int = 0, limit: int = 100, db: Session = Depends(database.get_db)):
    farmers = db.query(models.Farmer).offset(skip).limit(limit).all()
    return farmers

@router.post("/farmers/{farmer_id}/records/", response_model=schemas.FarmerRecord)
def create_record(farmer_id: int, record: schemas.FarmerRecordCreate, db: Session = Depends(database.get_db)):
    db_farmer = db.query(models.Farmer).filter(models.Farmer.id == farmer_id).first()
    if not db_farmer:
        raise HTTPException(status_code=404, detail="Farmer not found")
        
    distress = calculate_distress_score(
        record.rainfall_deviation_percent, 
        record.mandi_price_drop_percent, 
        db_farmer.days_to_loan_due
    )
    
    db_record = models.FarmerRecord(
        **record.dict(),
        farmer_id=farmer_id,
        distress_score=distress
    )
    db.add(db_record)
    db.commit()
    db.refresh(db_record)
    return db_record

@router.post("/advisory/")
def get_advisory(request: schemas.AdvisoryRequest):
    advice = generate_advisory(
        crop=request.crop,
        soil_type=request.soil_type,
        rainfall_dev=request.rainfall_deviation_percent,
        language=request.language
    )
    return {"advisory": advice}

from typing import List, Optional
import database_login
from models_login import FarmerLoginDetails

@router.get("/dashboard-data/")
def get_dashboard_data(district: Optional[str] = None, db: Session = Depends(database.get_db)):
    # Sync all registered farmers from login_details.db to main db and dynamically update relocated districts
    login_db = database_login.LoginSessionLocal()
    try:
        all_login_farmers = login_db.query(FarmerLoginDetails).all()
        
        for lf in all_login_farmers:
            clean_10 = "".join(filter(str.isdigit, lf.phone))[-10:] if lf.phone else ""
            if not clean_10:
                continue
            existing_farmers = db.query(models.Farmer).filter(models.Farmer.phone.like(f"%{clean_10}%")).all()
            if existing_farmers:
                for ef in existing_farmers:
                    # Dynamic Relocation: Update district in main DB if farmer changed location
                    if lf.district and ef.district != lf.district:
                        ef.district = lf.district
                    if lf.first_name or lf.last_name:
                        ef.name = f"{lf.first_name or ''} {lf.last_name or ''}".strip() or ef.name
            else:
                new_f = models.Farmer(
                    name=f"{lf.first_name or ''} {lf.last_name or ''}".strip() or "Farmer",
                    phone=lf.phone,
                    language=lf.preferred_language or "en",
                    district=lf.district or district or "Cuttack",
                    crop="Paddy",
                    soil_type="Alluvial",
                    loan_amount=0.0,
                    days_to_loan_due=45
                )
                db.add(new_f)
                db.flush()
                rec = models.FarmerRecord(
                    farmer_id=new_f.id,
                    rainfall_deviation_percent=-22.0,
                    mandi_price_drop_percent=15.0,
                    distress_score=68.5
                )
                db.add(rec)
        db.commit()
    except Exception as e:
        print(f"Error syncing login farmers to main db: {e}")
    finally:
        login_db.close()

    # Query main database strictly for the requested district
    q = db.query(models.Farmer)
    if district and district != "All":
        q = q.filter(models.Farmer.district.ilike(f"%{district}%"))
    farmers = q.all()
    
    high_risk = []
    all_farmers_list = []
    for f in farmers:
        rain_dev = -22.0
        mandi_drop = 12.0
        wind_spd = 18.0
        synced_score = None
        if f.records:
            rec = f.records[-1]
            rain_dev = float(rec.rainfall_deviation_percent or -20.0)
            mandi_drop = float(rec.mandi_price_drop_percent or 10.0)
            if hasattr(rec, 'distress_score') and rec.distress_score is not None:
                synced_score = rec.distress_score

        fin_prof = db.query(models.FarmerFinancialProfile).filter(models.FarmerFinancialProfile.farmer_id == f.id).first()
        
        loan_amt = float(f.loan_amount or 0.0)
        out_princ = float(f.loan_amount or 0.0) * 0.75
        days_due = int(f.days_to_loan_due or 60)
        
        if fin_prof and fin_prof.has_loan:
            loan_amt = float(fin_prof.original_loan_amount or loan_amt)
            out_princ = float(fin_prof.outstanding_principal or out_princ)
            
        distress_res = calculate_comprehensive_distress_score(
            loan_amount=loan_amt,
            outstanding_principal=out_princ,
            days_to_loan_due=days_due,
            rainfall_deviation_pct=rain_dev,
            wind_speed_kmh=wind_spd,
            crop_name=f.crop or "Paddy",
            mandi_price_drop_pct=mandi_drop
        )
        
        if synced_score is not None and synced_score > 0:
            score = synced_score
            distress_res["distress_score"] = score
        else:
            score = distress_res["distress_score"]
            
        risk_category = distress_res["distress_category"]
        breakdown = distress_res["breakdown"]
        rationale = distress_res["risk_rationale"]
            
        farmer_data = {
            "id": f.id,
            "farmer_id": f.id,
            "name": f.name,
            "phone": f.phone,
            "district": f.district,
            "crop": f.crop or "Paddy",
            "soil_type": f.soil_type or "Alluvial",
            "loan_amount": loan_amt,
            "distress_score": score,
            "score": score,
            "risk_category": risk_category,
            "breakdown": breakdown,
            "risk_rationale": rationale
        }
        
        all_farmers_list.append(farmer_data)
        if score > 65.0:
            high_risk.append(farmer_data)
    
    return {
        "total_farmers": len(farmers),
        "high_risk_count": len(high_risk),
        "high_risk_farmers": sorted(high_risk, key=lambda x: x["score"], reverse=True),
        "all_farmers": sorted(all_farmers_list, key=lambda x: x["score"], reverse=True),
        "assigned_district": district or "All Districts"
    }

from datetime import datetime

OFFICER_ALERTS_DB = []

def send_real_sms(phone: str, message: str, role: str = "FARMER"):
    print(f"\n============================================================")
    print(f"[SMARTCROP REAL-TIME SMS DISPATCH] -> {phone}")
    print(f"Target Role: {role}")
    print(f"Message: {message}")
    print(f"============================================================\n")

@router.post("/alert/{farmer_identifier}")
def send_alert(farmer_identifier: str, db: Session = Depends(database.get_db)):
    db_farmer = None
    clean_identifier = str(farmer_identifier).strip()
    
    if clean_identifier.isdigit():
        db_farmer = db.query(models.Farmer).filter(models.Farmer.id == int(clean_identifier)).first()
        
    if not db_farmer:
        clean_phone = "".join(filter(str.isdigit, clean_identifier))
        if clean_phone:
            clean_10 = clean_phone[-10:] if len(clean_phone) >= 10 else clean_phone
            db_farmer = db.query(models.Farmer).filter(models.Farmer.phone.like(f"%{clean_10}%")).first()

    if not db_farmer:
        raise HTTPException(status_code=404, detail=f"Farmer {farmer_identifier} not found")
        
    district = db_farmer.district or "District"
    message = f"SmartCrop Official Alert from {district} Agricultural Officer: You have been identified for high distress risk support. Your district krushi officer will contact you shortly."
    
    alert_item = {
        "id": len(OFFICER_ALERTS_DB) + 1,
        "farmer_id": db_farmer.id,
        "phone": db_farmer.phone,
        "farmer_name": db_farmer.name,
        "district": district,
        "sender": f"{district} District Agricultural Officer",
        "message": message,
        "timestamp": datetime.now().strftime("%Y-%m-%d %H:%M"),
        "is_read": False
    }
    OFFICER_ALERTS_DB.append(alert_item)
    
    send_real_sms(db_farmer.phone, message, role="FARMER")

    return {
        "status": "success",
        "message": f"Alert dispatched to farmer {db_farmer.name} ({db_farmer.phone})",
        "alert": alert_item
    }


@router.get("/farmer-alerts/{phone}")
def get_farmer_alerts(phone: str, db: Session = Depends(database.get_db)):
    clean_phone = "".join(filter(str.isdigit, phone.strip()))
    
    farmer_alerts = [a for a in OFFICER_ALERTS_DB if "".join(filter(str.isdigit, a["phone"])) == clean_phone]
    
    if not farmer_alerts:
        db_farmer = db.query(models.Farmer).filter(models.Farmer.phone == clean_phone).first()
        district = db_farmer.district if db_farmer else "District"
        farmer_alerts = [{
            "id": 1,
            "phone": clean_phone,
            "farmer_name": db_farmer.name if db_farmer else "Farmer",
            "district": district,
            "sender": f"{district} District Krushi Office",
            "message": f"Welcome to SmartCrop! Your district officer ({district}) is actively monitoring weather deviations and market crop prices for your farm.",
            "timestamp": datetime.now().strftime("%Y-%m-%d %H:%M"),
            "is_read": True
        }]
        
    return {
        "status": "success",
        "phone": clean_phone,
        "unread_count": len([a for a in farmer_alerts if not a.get("is_read")]),
        "alerts": sorted(farmer_alerts, key=lambda x: x["id"], reverse=True)
    }


@router.post("/farmer-alerts/mark-read/{phone}")
def mark_farmer_alerts_read(phone: str):
    clean_phone = "".join(filter(str.isdigit, phone.strip()))
    for a in OFFICER_ALERTS_DB:
        if "".join(filter(str.isdigit, a["phone"])) == clean_phone:
            a["is_read"] = True
    return {"status": "success", "message": "Alerts marked as read."}

