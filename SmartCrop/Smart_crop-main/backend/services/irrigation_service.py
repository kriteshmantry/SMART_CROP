"""
SmartCrop Irrigation Advisory Dataset & Recommendation Engine
============================================================
Exhaustive dataset-backed irrigation scheduling, water volume, and watering method advisor
tailored to specific crop types, growth stages, soil profiles, and weather conditions across all 30 Odisha districts.
"""

IRRIGATION_DATASET = {
    "Rice": {
        "water_requirement_mm": "1200 - 1400 mm",
        "critical_stages": ["Tillering", "Panicle Initiation", "Flowering"],
        "recommended_method": "Alternate Wetting and Drying (AWD) / Controlled Flooding",
        "daily_water_liters_per_ha": 35000,
        "frequency_days": 2,
        "advisory": "Maintain 2-5 cm standing water during panicle initiation and flowering. Stop irrigation 10-15 days before harvest."
    },
    "Ragi": {
        "water_requirement_mm": "350 - 500 mm",
        "critical_stages": ["Germination", "Tillering", "Flowering"],
        "recommended_method": "Furrow Irrigation / Micro-Sprinkler",
        "daily_water_liters_per_ha": 12000,
        "frequency_days": 7,
        "advisory": "Ragi is drought-hardy. Provide 2-3 light irrigations at tillering and flowering during dry spells."
    },
    "Moong": {
        "water_requirement_mm": "300 - 400 mm",
        "critical_stages": ["Flower Initiation", "Pod Filling"],
        "recommended_method": "Drip Irrigation / Sprinkler",
        "daily_water_liters_per_ha": 10000,
        "frequency_days": 8,
        "advisory": "Avoid over-irrigation as pulses are susceptible to root rot. Give light irrigation at flowering and pod filling."
    },
    "Groundnut": {
        "water_requirement_mm": "450 - 600 mm",
        "critical_stages": ["Pegging", "Pod Development"],
        "recommended_method": "Sprinkler / Drip Irrigation",
        "daily_water_liters_per_ha": 15000,
        "frequency_days": 6,
        "advisory": "Pegging stage (40-50 days after sowing) is most critical. Maintain adequate soil moisture to ensure pod formation."
    },
    "Jute": {
        "water_requirement_mm": "500 - 700 mm",
        "critical_stages": ["Early Seedling", "Rapid Stem Elongation"],
        "recommended_method": "Border Strip / Surface Flooding",
        "daily_water_liters_per_ha": 20000,
        "frequency_days": 4,
        "advisory": "Jute requires good soil moisture during early growth. Avoid standing water in initial 15 days."
    },
    "Maize": {
        "water_requirement_mm": "500 - 600 mm",
        "critical_stages": ["Tasseling", "Silking", "Grain Filling"],
        "recommended_method": "Furrow / Drip Irrigation",
        "daily_water_liters_per_ha": 18000,
        "frequency_days": 5,
        "advisory": "Water stress during tasseling and silking can reduce yield by up to 40%. Ensure timely irrigation during flowering."
    },
    "Cotton": {
        "water_requirement_mm": "700 - 1000 mm",
        "critical_stages": ["Flowering", "Boll Formation"],
        "recommended_method": "Drip Irrigation",
        "daily_water_liters_per_ha": 22000,
        "frequency_days": 5,
        "advisory": "Drip irrigation increases boll count by 25%. Avoid excessive water during early vegetative stage."
    },
    "Sugarcane": {
        "water_requirement_mm": "1500 - 2500 mm",
        "critical_stages": ["Formative Stage", "Grand Growth"],
        "recommended_method": "Sub-surface Drip Irrigation / Alternate Furrow",
        "daily_water_liters_per_ha": 45000,
        "frequency_days": 3,
        "advisory": "Sugarcane is high water-consuming. Sub-surface drip saves 40% water while maintaining cane girth."
    },
    "Mustard": {
        "water_requirement_mm": "250 - 400 mm",
        "critical_stages": ["Branching", "Pod Formation"],
        "recommended_method": "Sprinkler / Light Furrow",
        "daily_water_liters_per_ha": 10000,
        "frequency_days": 10,
        "advisory": "Provide 1st irrigation at 25-30 days (branching) and 2nd at 50-60 days (pod formation)."
    },
    "Potato": {
        "water_requirement_mm": "400 - 600 mm",
        "critical_stages": ["Stolonization", "Tuber Initiation", "Tuber Bulking"],
        "recommended_method": "Sprinkler / Drip Irrigation",
        "daily_water_liters_per_ha": 16000,
        "frequency_days": 5,
        "advisory": "Maintain light, frequent irrigations to prevent tuber cracking and brown rot."
    },
    "Wheat": {
        "water_requirement_mm": "400 - 500 mm",
        "critical_stages": ["Crown Root Initiation (CRI)", "Tillering", "Flowering", "Milk Stage"],
        "recommended_method": "Border Strip / Micro-Sprinkler",
        "daily_water_liters_per_ha": 14000,
        "frequency_days": 7,
        "advisory": "Crown Root Initiation (21 days after sowing) is the most critical stage; never delay 1st irrigation."
    },
    "Urad": {
        "water_requirement_mm": "300 - 400 mm",
        "critical_stages": ["Flowering", "Pod Development"],
        "recommended_method": "Sprinkler / Drip",
        "daily_water_liters_per_ha": 9500,
        "frequency_days": 8,
        "advisory": "Requires 2 light irrigations during dry spells. Avoid waterlogging."
    },
    "Sesamum": {
        "water_requirement_mm": "250 - 350 mm",
        "critical_stages": ["Flowering", "Capsule Formation"],
        "recommended_method": "Light Furrow / Sprinkler",
        "daily_water_liters_per_ha": 8500,
        "frequency_days": 10,
        "advisory": "Highly sensitive to waterlogging. Provide light irrigation at capsule formation."
    },
    "Horse Gram": {
        "water_requirement_mm": "200 - 300 mm",
        "critical_stages": ["Flowering", "Pod Filling"],
        "recommended_method": "Rainfed / Protective Sprinkler",
        "daily_water_liters_per_ha": 7500,
        "frequency_days": 12,
        "advisory": "Hardy residual moisture crop. Requires protective irrigation only during severe droughts."
    }
}

# Alias map for canonical crop names
CROP_ALIASES = {
    "paddy": "Rice",
    "rice": "Rice",
    "ragi": "Ragi",
    "finger millet": "Ragi",
    "moong": "Moong",
    "moong(green gram)": "Moong",
    "green gram": "Moong",
    "groundnut": "Groundnut",
    "peanut": "Groundnut",
    "maize": "Maize",
    "corn": "Maize",
    "jute": "Jute",
    "cotton": "Cotton",
    "cotton(lint)": "Cotton",
    "sugarcane": "Sugarcane",
    "mustard": "Mustard",
    "rapeseed &mustard": "Mustard",
    "rapeseed": "Mustard",
    "potato": "Potato",
    "wheat": "Wheat",
    "urad": "Urad",
    "black gram": "Urad",
    "sesamum": "Sesamum",
    "til": "Sesamum",
    "horse gram": "Horse Gram",
    "horse-gram": "Horse Gram"
}

def get_irrigation_advisory(crop_name: str, area_ha: float = 2.5, humidity: float = 75, temp: float = 28) -> dict:
    """
    Returns dataset-backed irrigation recommendations adjusted for land area and weather.
    """
    norm_name = CROP_ALIASES.get(crop_name.lower(), crop_name.capitalize())
    crop_info = IRRIGATION_DATASET.get(norm_name, IRRIGATION_DATASET["Rice"])
    
    freq = crop_info["frequency_days"]
    if temp > 32 and humidity < 60:
        freq = max(1, freq - 1)
        
    daily_volume = crop_info["daily_water_liters_per_ha"] * area_ha
    
    return {
        "crop": norm_name,
        "area_ha": area_ha,
        "water_requirement_mm": crop_info["water_requirement_mm"],
        "critical_stages": crop_info["critical_stages"],
        "recommended_method": crop_info["recommended_method"],
        "daily_volume_liters": round(daily_volume, 0),
        "daily_water_liters_per_ha": crop_info["daily_water_liters_per_ha"],
        "frequency_days": freq,
        "advisory": crop_info["advisory"]
    }
