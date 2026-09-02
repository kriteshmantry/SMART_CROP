"""
SmartCrop LLM Service Wrapper
Delegates directly to chat_engine.generate_response()
"""

from services import chat_engine

def generate_chat_response(prompt: str, context: str = "", language: str = "en") -> str:
    """
    Generate a response using the local Qwen 14B model + ML Pipeline + Live Weather + Irrigation Dataset.
    """
    # Extract district, season, area_ha if passed in context string
    district = "Cuttack"
    season = "Kharif"
    area_ha = 2.5
    
    if context:
        for line in context.split("\n"):
            if "district:" in line.lower():
                district = line.split(":", 1)[1].strip()
            elif "season:" in line.lower():
                season = line.split(":", 1)[1].strip()
            elif "area_ha:" in line.lower() or "land_area:" in line.lower():
                try:
                    area_ha = float(line.split(":", 1)[1].strip())
                except ValueError:
                    pass

    return chat_engine.generate_response(
        message=prompt,
        history=None,
        language=language,
        district=district,
        season=season,
        area_ha=area_ha
    )
