import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse

import models
import database

import models_login
import database_login

from routers import ml, weather, chat, auth, farmers, loan

# Initialize Main SQLite DB & Login Details SQLite DB (login_details.db)
models.Base.metadata.create_all(bind=database.engine)
database_login.init_login_db()

app = FastAPI(
    title="SmartCrop Unified AI Agriculture API",
    description="Unified Master Backend Combining ML Cascading Pipeline, Loan Financial Distress ML Model, 4-Digit PIN Auth with SQLite login_details.db, Weather & Chat Assistant",
    version="2.2.0"
)

# CORS configuration
allowed_origins_env = os.getenv("ALLOWED_ORIGINS", "*")
if allowed_origins_env == "*" or not allowed_origins_env:
    origins = ["*"]
else:
    origins = [origin.strip() for origin in allowed_origins_env.split(",") if origin.strip()]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins if origins != ["*"] else ["*"],
    allow_credentials=True if origins != ["*"] else False, # Safe credentials handling
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include API routers (prefixed with /api)
app.include_router(ml.router, prefix="/api", tags=["Machine Learning & Cascading Pipeline"])
app.include_router(loan.router, prefix="/api", tags=["Loan Financial Distress"])
app.include_router(auth.router, prefix="/api", tags=["4-Digit PIN & Registration Auth"])
app.include_router(farmers.router, prefix="/api", tags=["Farmer Records & Officer Dashboard"])
app.include_router(weather.router, prefix="/api", tags=["Weather & Soil Profiles"])
app.include_router(chat.router, prefix="/api", tags=["Chatbot Assistant"])

from services.tts_engine import generate_speech_audio
from fastapi import HTTPException
from pydantic import BaseModel

class TTSRequest(BaseModel):
    text: str
    lang: str = "hi"

@app.api_route("/api/tts-audio", methods=["GET", "POST"])
def get_tts_audio(req: TTSRequest = None, text: str = None, lang: str = "hi"):
    """
    Returns crystal-clear, HD Google Speech AI Audio stream via GET or POST.
    """
    try:
        speech_text = req.text if (req and req.text) else (text or "Namaste")
        speech_lang = req.lang if (req and req.lang) else lang
        file_path = generate_speech_audio(speech_text, speech_lang)
        return FileResponse(file_path, media_type="audio/mpeg", filename="advisory.mp3")
    except Exception as e:
        print(f"TTS endpoint error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# Path to the React static frontend directory (targets dist build)
base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
frontend_dist = os.path.abspath(os.path.join(base_dir, "frontend", "dist"))

if not os.path.exists(frontend_dist):
    frontend_dist = os.path.abspath(os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "frontend", "dist"))
if not os.path.exists(frontend_dist):
    frontend_dist = os.path.abspath(os.path.join(base_dir, "frontend"))

if os.path.exists(frontend_dist):
    assets_dir = os.path.join(frontend_dist, "assets")
    if os.path.exists(assets_dir):
        app.mount("/assets", StaticFiles(directory=assets_dir), name="assets")

    @app.get("/{full_path:path}")
    async def serve_react_app(full_path: str):
        if full_path.startswith("api"):
            return None
        
        file_path = os.path.join(frontend_dist, full_path)
        if os.path.isfile(file_path):
            return FileResponse(file_path)

        return FileResponse(os.path.join(frontend_dist, "index.html"))
else:
    @app.get("/")
    def read_root():
        return {"message": "Welcome to SmartCrop Unified Master AI API"}



