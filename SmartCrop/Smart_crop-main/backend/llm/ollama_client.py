import os
import requests
import json
from typing import Dict, Any, List, Optional
from core.config import settings

class OllamaClient:
    def __init__(self, base_url: str = None, model: str = None):
        self.base_url = base_url or os.getenv("OLLAMA_BASE_URL", "http://127.0.0.1:11434")
        self.model = model or os.getenv("OLLAMA_MODEL", "qwen3:14b")

    def check_health(self) -> bool:
        """Check if Ollama is running on port 11434."""
        try:
            res = requests.get(f"{self.base_url}/api/version", timeout=1.0)
            return res.status_code == 200
        except Exception:
            return False
            
    def list_models(self) -> List[str]:
        """List available models in Ollama."""
        try:
            res = requests.get(f"{self.base_url}/api/tags", timeout=1.0)
            if res.status_code == 200:
                data = res.json()
                return [m.get("name") for m in data.get("models", [])]
            return []
        except Exception:
            return []

    def get_active_model(self) -> str:
        """Select available Qwen 3 14B model installed in Ollama."""
        available = self.list_models()
        if not available:
            return self.model
            
        candidates = ["qwen3:14b", "qwen2.5:14b", "qwen:14b", "qwen2.5-coder:14b", "qwen2.5:7b", "qwen:latest"]
        for cand in candidates:
            for m in available:
                if cand in m.lower():
                    return m
                    
        return available[0]

    def generate_chat_response(
        self, 
        system_prompt: str, 
        user_message: str, 
        history: List[Dict] = None, 
        temperature: float = 0.3, 
        max_tokens: int = 400
    ) -> str:
        """
        Generates a rich, RAG-augmented chat response from local Qwen3 14B model.
        """
        active_model = self.get_active_model()
        messages = [{"role": "system", "content": system_prompt}]
        
        if history:
            for item in history:
                if isinstance(item, dict) and "role" in item:
                    role_name = item.get("role", "user")
                    content_str = item.get("content") or item.get("text") or ""
                    if role_name in ["user", "assistant"] and content_str.strip():
                        messages.append({"role": role_name, "content": content_str})
            
        messages.append({"role": "user", "content": user_message})
        
        payload = {
            "model": active_model,
            "messages": messages,
            "stream": False,
            "options": {
                "temperature": temperature,
                "num_predict": max_tokens
            }
        }
        
        try:
            # 2 second timeout for instant RAG execution
            res = requests.post(f"{self.base_url}/api/chat", json=payload, timeout=2.0)
            if res.status_code == 200:
                data = res.json()
                content = data.get("message", {}).get("content", "")
                
                if "<think>" in content and "</think>" in content:
                    content = content.split("</think>")[-1].strip()
                elif "<think>" in content:
                    content = content.replace("<think>", "").strip()
                    
                return content
            else:
                return None
        except Exception as e:
            return None

ollama_client = OllamaClient()
