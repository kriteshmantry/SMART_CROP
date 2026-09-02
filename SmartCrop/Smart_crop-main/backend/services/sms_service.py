import os
import requests
import logging
from dotenv import load_dotenv

env_path = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), ".env")
load_dotenv(dotenv_path=env_path, override=True)

logger = logging.getLogger("uvicorn")

SMS_PROVIDER = os.getenv("SMS_PROVIDER", "fast2sms").lower()
FAST2SMS_API_KEY = os.getenv("FAST2SMS_API_KEY", "")
TWILIO_ACCOUNT_SID = os.getenv("TWILIO_ACCOUNT_SID", "")
TWILIO_AUTH_TOKEN = os.getenv("TWILIO_AUTH_TOKEN", "")
TWILIO_PHONE_NUMBER = os.getenv("TWILIO_PHONE_NUMBER", "")

def format_phone_fast2sms(phone: str) -> str:
    clean = "".join(filter(str.isdigit, phone))
    if len(clean) > 10 and clean.startswith("91"):
        return clean[2:]
    return clean[-10:] if len(clean) >= 10 else clean

def format_phone_e164(phone: str) -> str:
    clean = "".join(filter(str.isdigit, phone))
    if clean.startswith("91") and len(clean) == 12:
        return f"+{clean}"
    if len(clean) == 10:
        return f"+91{clean}"
    return f"+{clean}" if not phone.startswith("+") else phone

def send_sms(phone: str, message: str, role: str = "farmer") -> dict:
    # 1. Fast2SMS Provider
    if SMS_PROVIDER == "fast2sms" and FAST2SMS_API_KEY and FAST2SMS_API_KEY != "your_fast2sms_api_key_here":
        target_phone = format_phone_fast2sms(phone)
        try:
            url = "https://www.fast2sms.com/dev/bulkV2"
            headers = {
                "authorization": FAST2SMS_API_KEY,
                "Content-Type": "application/json"
            }
            payload = {
                "message": message,
                "language": "english",
                "route": "q",
                "numbers": target_phone
            }
            
            response = requests.post(url, headers=headers, json=payload, timeout=10.0)
            data = response.json()
            
            if response.status_code == 200 and data.get("return") is True:
                print(f"[Fast2SMS] Successfully sent SMS to {target_phone} ({role})")
                return {"success": True, "provider": "fast2sms", "message": "SMS delivered via Fast2SMS"}
            else:
                error_msg = data.get("message", ["Delivery failed"])[0] if isinstance(data.get("message"), list) else data.get("message")
                print(f"[Fast2SMS] API responded with error: {error_msg}")
        except Exception as e:
            print(f"[Fast2SMS] Error sending SMS: {str(e)}")

    # 2. Twilio Provider
    elif SMS_PROVIDER == "twilio" and TWILIO_ACCOUNT_SID and TWILIO_AUTH_TOKEN and TWILIO_ACCOUNT_SID != "your_twilio_sid":
        target_phone = format_phone_e164(phone)
        try:
            url = f"https://api.twilio.com/2010-04-01/Accounts/{TWILIO_ACCOUNT_SID}/Messages.json"
            auth = (TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN)
            payload = {
                "To": target_phone,
                "From": TWILIO_PHONE_NUMBER,
                "Body": message
            }
            
            response = requests.post(url, auth=auth, data=payload, timeout=10.0)
            if response.status_code in [200, 201]:
                print(f"[Twilio] Successfully sent SMS to {target_phone} ({role})")
                return {"success": True, "provider": "twilio", "message": "SMS delivered via Twilio"}
            else:
                print(f"[Twilio] Error: {response.status_code} - {response.text}")
        except Exception as e:
            print(f"[Twilio] Error sending SMS: {str(e)}")

    # 3. Sandbox / Development Console Fallback
    print("\n" + "="*60)
    print(f"[SMARTCROP REAL-TIME SMS DISPATCH] -> {phone}")
    print(f"Target Role: {role.upper()}")
    print(f"Message: {message}")
    if not FAST2SMS_API_KEY or FAST2SMS_API_KEY == "your_fast2sms_api_key_here":
        print("(To send real SMS to mobile, add FAST2SMS_API_KEY in backend/.env)")
    print("="*60 + "\n")
    
    return {"success": True, "provider": "sandbox", "message": "Sandbox Mode: SMS printed to console.", "content": message}


def send_otp_sms(phone: str, otp: str, role: str = "farmer") -> dict:
    portal_name = "SmartCrop Officer Portal" if role.lower() == "officer" else "SmartCrop Farmer Assistant"
    message = f"Your {portal_name} verification code is: {otp}. Valid for 5 minutes. Do not share with anyone."
    
    res = send_sms(phone, message, role)
    if res.get("provider") == "sandbox":
        res["otp"] = otp
    return res
