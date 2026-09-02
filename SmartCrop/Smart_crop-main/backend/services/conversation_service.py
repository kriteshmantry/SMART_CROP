import uuid
from typing import Dict, List, Any

# Simple in-memory conversation store for demonstration.
# In production, use Redis or a database (SQLite/PostgreSQL).
_sessions: Dict[str, List[Dict[str, str]]] = {}

# Maximum number of messages to keep in context to prevent LLM context limit overflow
MAX_HISTORY_MESSAGES = 10

def create_session() -> str:
    """Creates a new unique session ID."""
    session_id = str(uuid.uuid4())
    _sessions[session_id] = []
    return session_id

def get_history(session_id: str) -> List[Dict[str, str]]:
    """Returns the chat history for a session."""
    if session_id not in _sessions:
        _sessions[session_id] = []
    return _sessions[session_id]

def add_message(session_id: str, role: str, content: str):
    """Adds a message to the session history."""
    if session_id not in _sessions:
        _sessions[session_id] = []
        
    _sessions[session_id].append({"role": role, "content": content})
    
    # Prune history if it gets too long, keeping the last MAX_HISTORY_MESSAGES
    if len(_sessions[session_id]) > MAX_HISTORY_MESSAGES:
        # keep system prompts if any, but in this implementation system prompt is injected at generation time
        _sessions[session_id] = _sessions[session_id][-MAX_HISTORY_MESSAGES:]
