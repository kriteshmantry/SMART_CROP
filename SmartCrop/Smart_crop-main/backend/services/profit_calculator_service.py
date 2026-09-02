import math

def format_indian_currency(val: float) -> str:
    """Format currency in Indian numerical system (e.g. ₹44,32,816 instead of ₹4,432,816.00)."""
    if val is None:
        return "₹0"
    val_int = int(round(val))
    is_neg = val_int < 0
    val_str = str(abs(val_int))
    
    if len(val_str) <= 3:
        formatted = val_str
    else:
        last3 = val_str[-3:]
        rest = val_str[:-3]
        groups = []
        while len(rest) > 2:
            groups.append(rest[-2:])
            rest = rest[:-2]
        if rest:
            groups.append(rest)
        groups.reverse()
        formatted = ",".join(groups) + "," + last3
        
    if is_neg:
        formatted = "-" + formatted
    return f"₹{formatted}"

CULTIVATION_COSTS_PER_HA = {
    'Rice': 65000.0,
    'Maize': 45000.0,
    'Groundnut': 55000.0,
    'Ragi': 22000.0,
    'Moong(Green Gram)': 20000.0,
    'Urad': 20000.0,
    'Horse Gram': 18000.0,
    'Sesamum': 25000.0,
    'Potato': 110000.0,
    'Rapeseed &Mustard': 30000.0,
    'Wheat': 45000.0,
    'Sugarcane': 120000.0,
    'Jute': 50000.0
}

def calculate_farm_profit(
    crop: str,
    district: str,
    area_ha: float,
    predicted_yield: float,
    mandi_price_per_quintal: float,
    cost_per_ha: float = None
) -> dict:
    """
    Calculate financial breakdown for a crop based on area, yield, price, and cultivation cost.
    Uses Indian numerical formatting (lakhs, crores, thousands).
    """
    if cost_per_ha is None:
        cost_per_ha = CULTIVATION_COSTS_PER_HA.get(crop, 40000.0)
        
    total_cost_inr = round(cost_per_ha * area_ha, 2)
    
    price_per_tonne = mandi_price_per_quintal * 10.0
    total_production_tonnes = predicted_yield * area_ha
    total_revenue_inr = round(total_production_tonnes * price_per_tonne, 2)

    net_profit_inr = round(total_revenue_inr - total_cost_inr, 2)
    
    roi_percent = round((net_profit_inr / total_cost_inr) * 100.0, 2) if total_cost_inr > 0 else 0.0

    return {
        'crop': crop,
        'district': district,
        'area_ha': area_ha,
        'cost_per_ha_inr': cost_per_ha,
        'total_cost_inr': total_cost_inr,
        'mandi_price_per_quintal': mandi_price_per_quintal,
        'mandi_price_per_tonne': price_per_tonne,
        'total_revenue_inr': total_revenue_inr,
        'net_profit_inr': net_profit_inr,
        'roi_percent': roi_percent,
        'formatted_cost': format_indian_currency(total_cost_inr),
        'formatted_revenue': format_indian_currency(total_revenue_inr),
        'formatted_profit': format_indian_currency(net_profit_inr),
        'status': 'Profitable' if net_profit_inr >= 0 else 'Loss'
    }

calculate_cost_revenue_profit = calculate_farm_profit
