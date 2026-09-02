try:
    from googletrans import Translator
    translator = Translator()
except ImportError:
    translator = None

def generate_advisory(crop: str, soil_type: str, rainfall_dev: float, language: str = "en") -> str:
    advice = f"Current focus on {crop} in {soil_type} soil. "
    
    if rainfall_dev < -20:
        advice += "Rainfall is significantly below normal. Consider delaying sowing or arranging backup irrigation immediately. "
    elif rainfall_dev > 20:
        advice += "Rainfall is above normal. Ensure proper field drainage to prevent root rot. "
    else:
        advice += "Weather conditions are stable. Continue standard farming practices. "
        
    advice += "Keep monitoring mandi prices and stay in touch with local agricultural officers."
    
    if language != "en" and translator is not None:
        try:
            translation = translator.translate(advice, dest=language)
            return translation.text
        except Exception:
            return advice
            
    return advice
