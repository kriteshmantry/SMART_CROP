import os
from sentence_transformers import SentenceTransformer

# We use a small, fast model for local execution
EMBEDDING_MODEL_NAME = "all-MiniLM-L6-v2"
_model = None

def get_embedding_model():
    """Lazy load the sentence transformer model to save memory if unused."""
    global _model
    if _model is None:
        print(f"Loading embedding model {EMBEDDING_MODEL_NAME}...")
        _model = SentenceTransformer(EMBEDDING_MODEL_NAME)
    return _model

def generate_embedding(text: str) -> list[float]:
    """Generate an embedding for a single piece of text."""
    model = get_embedding_model()
    # Return as list of floats
    return model.encode(text).tolist()

def generate_embeddings(texts: list[str]) -> list[list[float]]:
    """Generate embeddings for multiple texts."""
    model = get_embedding_model()
    embeddings = model.encode(texts)
    return embeddings.tolist()
