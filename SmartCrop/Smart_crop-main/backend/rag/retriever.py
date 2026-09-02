import os
import json
import faiss
import numpy as np
from rag.embeddings import generate_embedding

# Paths
VECTOR_STORE_DIR = os.path.join(os.path.dirname(__file__), 'vector_store')
FAISS_INDEX_PATH = os.path.join(VECTOR_STORE_DIR, 'index.faiss')
METADATA_PATH = os.path.join(VECTOR_STORE_DIR, 'metadata.json')

_index = None
_metadata = None

def load_vector_store():
    """Loads the FAISS index and metadata into memory."""
    global _index, _metadata
    
    if not os.path.exists(FAISS_INDEX_PATH) or not os.path.exists(METADATA_PATH):
        print("Vector store not found. Please run the ingestion script.")
        return False
        
    try:
        _index = faiss.read_index(FAISS_INDEX_PATH)
        with open(METADATA_PATH, 'r', encoding='utf-8') as f:
            _metadata = json.load(f)
        return True
    except Exception as e:
        print(f"Error loading vector store: {e}")
        return False

def retrieve_context(query: str, top_k: int = 3) -> list[dict]:
    """
    Given a user query, generate its embedding, search FAISS,
    and return the top_k most relevant text chunks.
    """
    global _index, _metadata
    
    if _index is None or _metadata is None:
        if not load_vector_store():
            return []
            
    # Generate embedding for the query
    query_emb = generate_embedding(query)
    query_vec = np.array([query_emb], dtype=np.float32)
    
    # Search the index
    # D = distances, I = indices
    distances, indices = _index.search(query_vec, top_k)
    
    results = []
    for i, idx in enumerate(indices[0]):
        if idx != -1 and idx < len(_metadata):
            doc = _metadata[idx]
            results.append({
                'content': doc['content'],
                'source': doc.get('source', 'Unknown'),
                'distance': float(distances[0][i])
            })
            
    return results
