"""
SmartCrop NLP & Advanced ChatGPT Intent Classification Engine
============================================================
Classifies user intent across all agricultural, financial, scheme, price, and general chatbot categories.
"""

import re
from typing import Dict, Any, List

CROPS = ["groundnut", "maize", "moong", "ragi", "rice", "paddy", "cotton", "mustard", "sugarcane", "potato", "wheat", "urad", "jute", "sesamum", "horse gram", "arhar", "tur", "bhendi", "tomato"]
DISTRICTS = [
  "angul","balangir","balasore","bargarh","bhadrak","boudh","cuttack","deogarh", 
  "dhenkanal","gajapati","ganjam","jagatsinghpur","jajpur","jharsuguda","kalahandi", 
  "kandhamal","kendrapara","kendujhar","khordha","koraput","malkangiri","mayurbhanj", 
  "nabarangpur","nayagarh","nuapada","puri","rayagada","sambalpur","subarnapur","sundargarh"
]

def process_query(query: str) -> Dict[str, Any]:
    text = query.lower()
    
    intent = "GENERAL_CHATBOT"
    if any(k in text for k in ["profit", "money", "earning", "revenue", "highest profit", "better profit", "more profit", "income"]):
        intent = "PROFIT_ANALYSIS"
    elif any(k in text for k in ["scheme", "kalia", "pm-kisan", "fasal bima", "subsidy", "government", "sarkari", "yojana"]):
        intent = "GOVT_SCHEME"
    elif any(k in text for k in ["price", "mandi", "market", "rate", "bhav", "rate list", "quintal"]):
        intent = "MANDI_PRICE"
    elif any(k in text for k in ["compare", "comparison", "all crops", "options", "difference", "list", "candidate"]):
        intent = "CROP_COMPARISON"
    elif any(k in text for k in ["irrigation", "water", "pani", "jala", "volume", "liters", "drip", "sprinkler"]):
        intent = "IRRIGATION_ADVISORY"
    elif any(k in text for k in ["fertilizer", "npk", "urea", "dap", "potash", "manure", "compost", "khata", "lime", "soil"]):
        intent = "SOIL_FERTILIZER"
    elif any(k in text for k in ["pest", "insect", "disease", "fungus", "yellow", "spot", "worm", "keeda", "poka", "blight", "virus"]):
        intent = "PEST_DISEASE"
    elif any(k in text for k in ["yield", "production", "boost", "increase", "better", "grow", "sowing", "seed"]):
        intent = "YIELD_AGRONOMY"
    elif any(k in text for k in ["hello", "hi", "hey", "namaste", "my name is", "who are you"]):
        intent = "GREETING"

    extracted_crops = [c.capitalize() for c in CROPS if c in text]
    if "paddy" in text and "Rice" not in extracted_crops:
        extracted_crops.append("Rice")

    extracted_districts = [d.capitalize() for d in DISTRICTS if d in text]

    return {
        "intent": intent,
        "crops": extracted_crops,
        "districts": extracted_districts,
        "is_profit_focused": intent == "PROFIT_ANALYSIS",
        "raw_query": query
    }
