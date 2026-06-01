# AI Synthetic Sandbox

A RegTech prototype that audits financial product documents against FCA Consumer Duty and simulates product behaviour over 90 days.

## What this project does

This project is built as a two-stage RegTech workflow:

1. **Stage 1: Static Audit**
   - Upload a PDF or TXT document
   - Extract text from the document
   - Run an FCA Consumer Duty compliance audit
   - Return flagged clauses, issue details, and suggested revisions

2. **Stage 2: Dynamic Simulation**
   - Take extracted or user-entered parameters
   - Run a 90-day risk and complaints simulation
   - Produce a Consumer Duty scorecard, recommendations, and debate-style narrative

## Tech stack

- Frontend: React 18, Vite 5, Tailwind CSS, Chart.js
- Backend: FastAPI, Python, NumPy, pdfplumber, google-genai
- API: uploaded document audit, SSE streaming audit, simulation, PDF report export

## Requirements

### Backend

- Python 3.11+ recommended
- Install dependencies:

```bash
cd backend
python3 -m pip install -r requirements.txt
```

- Create a `.env` file in `backend/` with:

```env
GEMINI_API_KEY=your_gemini_api_key
```

Optionally, if you want to enable Anthropic-based recommendations and debate generation:

```env
ANTHROPIC_API_KEY=your_anthropic_api_key
```

### Frontend

- Node.js 18+ recommended
- Install dependencies:

```bash
cd frontend
npm install
```

## How to run

### Start backend

```bash
cd backend
python3 -m uvicorn main:app --reload --host 127.0.0.1 --port 8000
```

The backend will be available at `http://127.0.0.1:8000`.

### Start frontend

```bash
cd frontend
npm run dev
```

The frontend will be available at `http://localhost:5173`.

## Main application flow

### Frontend

- `frontend/src/pages/UploadPage.jsx` handles file upload and file validation
- `frontend/src/api/audit.js` handles upload requests to `/api/audit` and `/api/audit/stream`
- `frontend/src/components/Dashboard.jsx` handles Stage 2 simulation UI and progress animation
- `frontend/vite.config.js` proxies `/api` to the backend at `http://localhost:8000`

### Backend

- `backend/main.py` defines API endpoints:
  - `POST /api/audit`
  - `POST /api/audit/stream`
  - `POST /api/report`
  - `POST /api/simulate`
- `backend/auditor.py` performs PDF/TXT text extraction and calls Gemini for compliance audit
- `backend/simulator.py` runs the simulation engine and builds scorecard recommendations
- `backend/report_generator.py` exports PDF audit reports
- `backend/fca_knowledge.py` stores FCA prompt and knowledge content

## Supported upload formats

- PDF `.pdf`
- Text `.txt`

Maximum upload size: **10 MB**

## Important details for teammates

- The Stage 2 progress bar is a frontend animation over the simulation result. If you see it stop early, that usually means the HTTP call or local state update failed.
- `/api/simulate` should return a JSON response quickly because it uses a local NumPy simulation engine.
- `/api/audit` and `/api/audit/stream` require `GEMINI_API_KEY` to be set.
- The frontend uses direct fetch for `/api/audit` and proxy-based fetch for `/api/simulate`.

## Debugging tips

- Check browser console for fetch errors or JS exceptions
- Confirm backend is running on `127.0.0.1:8000`
- Confirm frontend is running on `127.0.0.1:5173`
- Confirm `backend/.env` has a valid `GEMINI_API_KEY`

## What is complete in this branch

- File upload flow for Stage 1 audit
- Real-time audit log UI for document analysis
- Stage 2 simulation engine combined with frontend animation
- Consumer Duty scorecard display
- Recommendation and debate-style results display
- PDF report export endpoint

## Recommended next tasks

1. Verify Stage 2 simulation from the frontend is successfully calling `/api/simulate`
2. Add browser-side error handling for Stage 2 failures
3. Clean up any temporary local test files before sharing the repo
4. Review and remove any secrets from tracked files before pushing

## Notes

This README replaces the old handoff-style notes and is intended to help the team understand how to run the project, where the main code lives, and what the current app flow is.
