from fastapi import APIRouter, HTTPException
from schemas.chat import ChatRequest, ChatResponse
from services import chat_engine
import uuid

router = APIRouter()

@router.post("/chat", response_model=ChatResponse)
def chat_endpoint(request: ChatRequest):
    """
    Central Smart Assistant Chat Endpoint.
    Integrates:
      1. Local Qwen 14B LLM (Ollama http://localhost:11434)
      2. Pretrained ML Crop Cascading Pipeline & Financial Distress Score
      3. Live Weather & District Soil Profiles
      4. Irrigation Advisory Dataset (Water volume, methods, frequency)
    """
    try:
        session_id = request.session_id or str(uuid.uuid4())
        
        district = "Cuttack"
        season = "Kharif"
        area_ha = 2.5
        language = "en"
        analysis_data = None
        
        if request.context:
            district = request.context.get("district") or request.context.get("location") or "Cuttack"
            season = request.context.get("season") or "Kharif"
            try:
                area_ha = float(request.context.get("area_ha") or request.context.get("land_area") or 2.5)
            except ValueError:
                area_ha = 2.5
            language = request.context.get("language") or request.context.get("lang") or "en"
            analysis_data = request.context.get("analysis_data")
            
        reply = chat_engine.generate_response(
            message=request.message,
            history=None,
            language=language,
            district=district,
            season=season,
            area_ha=area_ha,
            analysis_data=analysis_data
        )
        
        return ChatResponse(
            reply=reply,
            session_id=session_id
        )
    except Exception as e:
        print(f"Chat endpoint error: {e}")
        raise HTTPException(status_code=500, detail=str(e))
