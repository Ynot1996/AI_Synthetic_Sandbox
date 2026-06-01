# AI Synthetic Sandbox

A RegTech demo app for FCA Consumer Duty analysis and 90-day behavioural simulation.

## What this project does

This repo contains a frontend + backend proof of concept:

- **Stage 1: Static Audit**
  - Upload a PDF or TXT financial product document
  - Extract text and run a compliance audit
  - Return flagged clauses, issue summaries, and suggestions
- **Stage 2: Dynamic Simulation**
  - Run a 90-day risk and complaint simulation using product parameters
  - Show a Consumer Duty scorecard, recommendations, and debate-style narrative

## Tech stack

- Frontend: React 18, Vite 5, Tailwind CSS, Chart.js
- Backend: FastAPI, Python 3, NumPy, pdfplumber, google-genai
- Proxy: Vite proxy forwards `/api` calls to the backend

## Setup

### Backend

1. Install Python dependencies:

```bash
cd backend
python3 -m pip install -r requirements.txt
```

2. Create `backend/.env` with:

```env
GEMINI_API_KEY=your_gemini_api_key
```

3. Optional for recommendation/debate enhancements:

```env
ANTHROPIC_API_KEY=your_anthropic_api_key
```

### Frontend

1. Install Node dependencies:

```bash
cd frontend
npm install
```

## Run the project

### Start backend

```bash
cd backend
python3 -m uvicorn main:app --reload --host 127.0.0.1 --port 8000
```

### Start frontend

```bash
cd frontend
npm run dev
```

Open the app in your browser at `http://localhost:5173`.

## Main app structure

### Frontend

- `frontend/src/pages/UploadPage.jsx` — file upload UI and validation
- `frontend/src/api/audit.js` — upload and SSE audit requests
- `frontend/src/api/simulate.js` — simulation request and fallback logic
- `frontend/src/components/Dashboard.jsx` — simulation progress and result flow
- `frontend/vite.config.js` — proxy `/api` to `http://localhost:8000`

### Backend

- `backend/main.py` — API routes:
  - `POST /api/audit`
  - `POST /api/audit/stream`
  - `POST /api/report`
  - `POST /api/simulate`
- `backend/auditor.py` — text extraction and Gemini compliance prompt
- `backend/simulator.py` — simulation engine, scorecard, recommendations, debate
- `backend/report_generator.py` — PDF report generation
- `backend/fca_knowledge.py` — FCA Consumer Duty prompt content
- `backend/models.py` — request/response schemas

## Supported document formats

- `.pdf`
- `.txt`

Maximum upload file size: **10 MB**

## Notes for the team

- Stage 2 uses a local backend simulation engine. The frontend calls `/api/simulate` and renders results with a progress animation.
- If Stage 2 appears to hang, check the browser console and verify the backend is running.
- The project will fall back to mock simulation data if the backend call fails.

## Cleanup completed

Removed old handoff notes and temporary local files that were not part of the working app.

## Useful commands

```bash
# Run backend
cd backend
python3 -m uvicorn main:app --reload --host 127.0.0.1 --port 8000

# Run frontend
cd frontend
npm run dev
```
