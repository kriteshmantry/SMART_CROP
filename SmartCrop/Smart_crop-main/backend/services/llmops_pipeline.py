"""
SmartCrop LLMOps Pipeline & Telemetry Tracker
=============================================
Tracks RAG node retrieval, prompt tokens, execution latency, intent predictions, and fallback status.
"""

import time
from typing import Dict, Any, List

class LLMOpsTracker:
    def __init__(self):
        self.logs: List[Dict[str, Any]] = []

    def log_interaction(
        self,
        query: str,
        intent: str,
        retrieved_nodes_count: int,
        model_used: str,
        latency_ms: float,
        fallback_used: bool,
        response_preview: str
    ):
        entry = {
            "timestamp": time.time(),
            "query": query,
            "intent": intent,
            "retrieved_nodes_count": retrieved_nodes_count,
            "model_used": model_used,
            "latency_ms": round(latency_ms, 2),
            "fallback_used": fallback_used,
            "response_preview": response_preview[:80] + "..." if len(response_preview) > 80 else response_preview
        }
        self.logs.append(entry)
        print(f"[LLMOps] Telemetry: Latency={entry['latency_ms']}ms | Intent={intent} | Nodes={retrieved_nodes_count} | Fallback={fallback_used}")

    def get_telemetry_summary(self) -> Dict[str, Any]:
        if not self.logs:
            return {"total_calls": 0, "avg_latency_ms": 0.0, "fallback_rate": 0.0}
            
        total = len(self.logs)
        avg_lat = sum(l["latency_ms"] for l in self.logs) / total
        fallbacks = sum(1 for l in self.logs if l["fallback_used"])
        return {
            "total_calls": total,
            "avg_latency_ms": round(avg_lat, 2),
            "fallback_rate": round(fallbacks / total, 2),
            "recent_logs": self.logs[-5:]
        }

llmops_tracker = LLMOpsTracker()
