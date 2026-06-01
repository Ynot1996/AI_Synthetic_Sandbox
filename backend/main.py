from dotenv import load_dotenv
load_dotenv()

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware

from models import SimulationRequest, SimulationResponse
from simulator import run_simulation

app = FastAPI(
    title="AI Synthetic Sandbox API",
    description="RegTech Compliance Stress-Tester — 1,000 virtual agents over 90 days",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:3000",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/", tags=["health"])
async def health():
    return {"status": "ok", "service": "AI Synthetic Sandbox API v1.0"}


@app.post("/api/simulate", response_model=SimulationResponse, tags=["simulation"])
async def simulate(request: SimulationRequest):
    try:
        return run_simulation(request)
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc)) from exc
