import os
from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    PROJECT_NAME: str = "SmartCrop AI Agriculture"
    WEATHERSTACK_API_KEY: str = os.getenv("WEATHERSTACK_API_KEY", "")
    LLM_API_BASE: str = os.getenv("LLM_API_BASE", "http://localhost:11434/v1")
    LLM_MODEL_NAME: str = os.getenv("LLM_MODEL_NAME", "qwen2.5:14b")
    LLM_API_KEY: str = os.getenv("LLM_API_KEY", "sk-dummy")
    
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

settings = Settings()

# Risk Component Weights for Crop Distress Component
WEIGHT_PROFIT_RISK = 0.30
WEIGHT_CLIMATE_RISK = 0.20
WEIGHT_COST_RISK = 0.15
WEIGHT_MARKET_RISK = 0.10

# Final Combined Distress Weights (Crop Risk vs Farmer Loan Risk)
WEIGHT_CROP_DISTRESS = 0.75
WEIGHT_LOAN_DISTRESS = 0.25

# Final Crop Recommendation Score Weights (Suitability vs Profit vs Safety)
WEIGHT_SUITABILITY_SCORE = 0.40
WEIGHT_PROFIT_SCORE = 0.35
WEIGHT_SAFETY_SCORE = 0.25
