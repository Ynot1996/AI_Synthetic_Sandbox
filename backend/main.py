from dotenv import load_dotenv
load_dotenv()

from fastapi import FastAPI, HTTPException, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse, Response

from models import SimulationRequest, SimulationResponse
from simulator import run_simulation
from auditor import run_audit, stream_audit
from report_generator import generate_audit_pdf

app = FastAPI(
    title="Universal RegTech OS API",
    description="Stage 1: PDF Compliance Audit | Stage 2: Behaviour Simulation",
    version="2.0.0",
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
    return {"status": "ok", "service": "Universal RegTech OS API v2.0"}


# ── Stage 1: Static Audit ─────────────────────────────────────────────────────

@app.post("/api/audit", tags=["audit"])
async def audit(file: UploadFile = File(...)):
    """
    Upload a PDF (or .txt) financial product document.
    Returns a structured FCA Consumer Duty audit report.
    """
    allowed = {".pdf", ".txt"}
    suffix = "." + file.filename.rsplit(".", 1)[-1].lower() if "." in file.filename else ""
    if suffix not in allowed:
        raise HTTPException(status_code=400, detail="Only PDF and TXT files are supported.")

    file_bytes = await file.read()
    if len(file_bytes) > 10 * 1024 * 1024:  # 10 MB guard
        raise HTTPException(status_code=400, detail="File too large (max 10 MB).")

    try:
        result = run_audit(file.filename, file_bytes)
    except ValueError as exc:
        raise HTTPException(status_code=422, detail=str(exc)) from exc
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc)) from exc

    return result


@app.post("/api/audit/stream", tags=["audit"])
async def audit_stream(file: UploadFile = File(...)):
    """
    Streaming version of /api/audit using Server-Sent Events.
    Each SSE event has the shape: { event, message? | result? }
    """
    allowed = {".pdf", ".txt"}
    suffix = "." + file.filename.rsplit(".", 1)[-1].lower() if "." in file.filename else ""
    if suffix not in allowed:
        raise HTTPException(status_code=400, detail="Only PDF and TXT files are supported.")

    file_bytes = await file.read()
    if len(file_bytes) > 10 * 1024 * 1024:
        raise HTTPException(status_code=400, detail="File too large (max 10 MB).")

    return StreamingResponse(
        stream_audit(file.filename, file_bytes),
        media_type="text/event-stream",
        headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"},
    )


# ── PDF Report Export ─────────────────────────────────────────────────────────

@app.post("/api/report", tags=["report"])
async def generate_report(audit_result: dict):
    """Generate a PDF compliance report from an audit result JSON."""
    try:
        pdf_bytes = generate_audit_pdf(audit_result)
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc)) from exc

    audit_id = audit_result.get("audit_id", "report")
    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={"Content-Disposition": f'attachment; filename="regtech-audit-{audit_id}.pdf"'},
    )


# ── Stage 2: Dynamic Simulation ───────────────────────────────────────────────

@app.post("/api/simulate", response_model=SimulationResponse, tags=["simulation"])
async def simulate(request: SimulationRequest):
    try:
        return run_simulation(request)
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc)) from exc
