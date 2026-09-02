# SmartCrop — AI Agricultural Advisory & Monitoring System

A production-ready AI-driven agricultural decision-support and distress intervention system for Odisha farmers and agricultural officers.

---

## 🏗️ Project Architecture

```
SmartCrop_Production_Clean/
├── backend/                  # FastAPI Unified Backend (ML models, RAG vector store, SQLite/PostgreSQL Auth & Distress scoring)
│   ├── models/               # SQLAlchemy DB Models
│   ├── routers/              # API Endpoints (Auth, ML, Weather, Chat, Farmers, Loan)
│   ├── services/             # ML inference pipelines, RAG, TTS, SMS
│   ├── main.py               # Application entry point & static SPA server
│   ├── Dockerfile            # Container definition for cloud deployment
│   ├── requirements.txt      # Python dependencies
│   └── .env.example          # Environment variables template
│
└── frontend/                 # React 19 + Vite + Tailwind CSS v4 PWA Frontend
    ├── src/                  # React source components & pages
    ├── dist/                 # Compiled production build (served by backend or Vercel)
    ├── package.json
    ├── vite.config.js
    └── vercel.json           # Vercel SPA routing configuration
```

---

## 🚀 Running Locally

### 1. Backend (FastAPI)
```bash
cd backend
pip install -r requirements.txt
python -m uvicorn main:app --host 127.0.0.1 --port 8000
```
* **Unified Web App**: [http://127.0.0.1:8000/](http://127.0.0.1:8000/)
* **Interactive API Docs**: [http://127.0.0.1:8000/docs](http://127.0.0.1:8000/docs)

### 2. Frontend (Vite Dev Server)
```bash
cd frontend
npm install
npm run dev
```
* **Vite Live Server**: [http://127.0.0.1:5173/](http://127.0.0.1:5173/)
