from fastapi import APIRouter, HTTPException
from services import weather_service
from typing import Dict, Any

router = APIRouter()

@router.get("/weather/{district}")
def get_weather(district: str) -> Dict[str, Any]:
    try:
        return weather_service.get_current_weather(district)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
