import os
import json
import csv
import numpy as np
from rag.embeddings import generate_embeddings

# Paths
BASE_DIR = os.path.dirname(os.path.dirname(__file__))
RAG_DIR = os.path.dirname(__file__)
VECTOR_STORE_DIR = os.path.join(RAG_DIR, 'vector_store')

INDEX_DATA_PATH = os.path.join(VECTOR_STORE_DIR, 'index.npy')
METADATA_PATH = os.path.join(VECTOR_STORE_DIR, 'metadata.json')

CSV_SOURCE = os.path.join(BASE_DIR, 'odisha_crop_agronomic_requirements_fixed.csv')
TXT_SOURCE = os.path.join(RAG_DIR, 'knowledge_base.txt')

def create_chunks_from_csv(file_path):
    """Reads the CSV and converts each row into a descriptive text chunk."""
    chunks = []
    if not os.path.exists(file_path):
        print(f"File not found: {file_path}")
        return chunks
        
    with open(file_path, 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        for row in reader:
            # Create a descriptive paragraph for each crop
            content = (
                f"Crop: {row['crop_name']}. "
                f"It is typically grown in the {row['season_name']} season in Odisha. "
                f"Sowing occurs between month {row['sowing_start_month']} and {row['sowing_end_month']}, "
                f"and harvesting between month {row['harvesting_start_month']} and {row['harvesting_end_month']}. "
                f"The crop duration is approximately {row['crop_duration_days']} days. "
                f"Optimal conditions for {row['crop_name']} include: "
                f"temperature between {row['optimal_temperature_min_c']}°C and {row['optimal_temperature_max_c']}°C, "
                f"rainfall between {row['optimal_rainfall_min_mm']}mm and {row['optimal_rainfall_max_mm']}mm "
                f"(water requirement is {row['water_requirement_mm']}mm). "
                f"It prefers soil pH between {row['soil_ph_min']} and {row['soil_ph_max']} with a {row['preferred_soil_texture']} texture. "
                f"Nutrient requirements: Nitrogen is {row['nitrogen_requirement']}, Phosphorus is {row['phosphorus_requirement']}, "
                f"Potassium is {row['potassium_requirement']}. "
                f"It needs {row['drainage_requirement']}. Drought tolerance is {row['drought_tolerance']} and "
                f"waterlogging tolerance is {row['waterlogging_tolerance']}."
            )
            chunks.append({
                'content': content,
                'source': f"Agronomic CSV ({row['crop_name']})"
            })
    return chunks

def create_chunks_from_txt(file_path):
    """Simple splitting of text by double newlines (paragraphs/sections)."""
    chunks = []
    if not os.path.exists(file_path):
        print(f"File not found: {file_path}")
        return chunks
        
    with open(file_path, 'r', encoding='utf-8') as f:
        text = f.read()
        
    # Very basic chunking
    sections = text.split('\n\n')
    for sec in sections:
        sec = sec.strip()
        if len(sec) > 20:
            chunks.append({
                'content': sec,
                'source': 'knowledge_base.txt'
            })
    return chunks

def run_ingestion():
    print("Starting document ingestion for RAG...")
    
    os.makedirs(VECTOR_STORE_DIR, exist_ok=True)
    
    documents = []
    
    # 1. Load CSV
    print(f"Loading {CSV_SOURCE}...")
    csv_docs = create_chunks_from_csv(CSV_SOURCE)
    documents.extend(csv_docs)
    print(f"Loaded {len(csv_docs)} chunks from CSV.")
    
    # 2. Load TXT
    print(f"Loading {TXT_SOURCE}...")
    txt_docs = create_chunks_from_txt(TXT_SOURCE)
    documents.extend(txt_docs)
    print(f"Loaded {len(txt_docs)} chunks from TXT.")
    
    if not documents:
        print("No documents to ingest!")
        return
        
    # 3. Generate Embeddings
    print("Generating embeddings (this may take a moment and download the model if first time)...")
    texts = [doc['content'] for doc in documents]
    embeddings = generate_embeddings(texts)
    
    # 4. Save Embeddings as Numpy array (simulating FAISS for small datasets)
    print(f"Saving embeddings array to {INDEX_DATA_PATH}...")
    emb_array = np.array(embeddings, dtype=np.float32)
    np.save(INDEX_DATA_PATH, emb_array)
    
    # 5. Save metadata
    print(f"Saving metadata to {METADATA_PATH}...")
    with open(METADATA_PATH, 'w', encoding='utf-8') as f:
        json.dump(documents, f, indent=2)
        
    print("Ingestion complete!")

if __name__ == "__main__":
    run_ingestion()
