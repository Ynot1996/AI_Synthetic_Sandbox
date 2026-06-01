"""
Core simulation engine.

Strategy: statistical distribution for 90-day curves (fast, deterministic) +
optional Claude Haiku call for 3 realistic persona complaints (if ANTHROPIC_API_KEY
is set).  Falls back to hand-crafted static templates when no key is present.
"""

from __future__ import annotations

import os
import uuid
from importlib.util import find_spec

import numpy as np

from models import (
    DayDataPoint,
    SimulationRequest,
    SimulationResponse,
    SimulationSummary,
    TerminalLogEntry,
)

# ─── Product-type risk multipliers ───────────────────────────────────────────

_PRODUCT_WEIGHT: dict[str, float] = {
    "buy-now-pay-later":  1.2,
    "high-interest-loan": 1.8,
    "credit-card":        1.0,
    "payday-loan":        2.0,
    "investment-product": 1.3,
}


# ─── Statistical helpers ──────────────────────────────────────────────────────

def _base_risk(req: SimulationRequest) -> float:
    """Normalised risk score in [0, 1] derived from product parameters."""
    apr_factor  = min(req.apr / 200.0, 1.0)
    vuln_factor = req.vulnerable_population_ratio
    weight      = min(_PRODUCT_WEIGHT.get(req.product_type, 1.0), 2.0)
    return min((0.6 * apr_factor + 0.4 * vuln_factor) * weight, 1.0)


def _build_risk_curve(base: float, days: int) -> list[float]:
    """Logistic growth curve + Gaussian noise → daily risk scores (0–100)."""
    rng      = np.random.default_rng(42)
    midpoint = days * 0.4
    rate     = 0.08 + base * 0.05
    scores   = []
    for day in range(1, days + 1):
        logistic = base / (1 + np.exp(-rate * (day - midpoint)))
        noise    = rng.normal(0, 0.02)
        scores.append(float(np.clip((logistic + noise) * 100, 0, 100)))
    return scores


def _build_complaint_curve(base: float, days: int) -> list[int]:
    """Cumulative complaint count with a 30-day ramp-up period."""
    rng       = np.random.default_rng(123)
    peak_rate = base * 15          # max ~15 complaints/day per 1,000 users at peak risk
    total     = 0
    counts    = []
    for day in range(1, days + 1):
        ramp    = min(day / 30.0, 1.0)
        daily   = int(max(0, peak_rate * ramp * (1 + rng.normal(0, 0.15))))
        total  += daily
        counts.append(total)
    return counts


def _verdict(peak: float) -> str:
    if peak >= 75: return "CRITICAL"
    if peak >= 50: return "HIGH_RISK"
    if peak >= 25: return "MEDIUM_RISK"
    return "LOW_RISK"


# ─── Persona generation: static fallback ─────────────────────────────────────

def _static_personas(req: SimulationRequest) -> list[dict]:
    label = req.product_type.replace("-", " ").title()
    return [
        {
            "timestamp": "Day 14",
            "persona":   "Sarah, 32 — Single mother, low financial literacy",
            "message": (
                f"I took this {label} thinking it was affordable, but at {req.apr:.1f}% APR "
                "I'm now paying back nearly double what I borrowed. "
                "Nobody explained the true cost when I signed up."
            ),
            "severity": "HIGH",
        },
        {
            "timestamp": "Day 36",
            "persona":   "Jake, 23 — Recent graduate, first-time borrower",
            "message": (
                f"The app made signing up for this {label} so easy that I didn't read the small print. "
                f"I didn't realise {req.apr:.1f}% APR was this expensive until I missed a payment. "
                "The marketing felt genuinely misleading."
            ),
            "severity": "MEDIUM",
        },
        {
            "timestamp": "Day 67",
            "persona":   "Margaret, 68 — Retired pensioner on fixed income",
            "message": (
                f"My bank adviser recommended this {label} but never clearly explained the charges. "
                "On my pension I simply cannot keep up with the repayments. "
                "This should not be legal."
            ),
            "severity": "HIGH",
        },
    ]


# ─── Persona generation: Claude Haiku ────────────────────────────────────────

_PERSONAS = [
    {
        "name": "Sarah, 32",
        "desc": "single mother of two, part-time shop assistant, low financial literacy, reliant on benefits",
        "day":  14,
        "severity": "HIGH",
    },
    {
        "name": "Jake, 23",
        "desc": "recent university graduate in his first job, enthusiastic about fintech apps, impulsive decision-maker",
        "day":  36,
        "severity": "MEDIUM",
    },
    {
        "name": "Margaret, 68",
        "desc": "retired NHS nurse on a fixed pension, modest savings, trusting of institutions, unfamiliar with digital finance",
        "day":  67,
        "severity": "HIGH",
    },
]


def _llm_personas(req: SimulationRequest) -> list[dict]:
    import anthropic  # only imported when key is present
    client = anthropic.Anthropic()
    label  = req.product_type.replace("-", " ").title()
    logs   = []

    for p in _PERSONAS:
        prompt = (
            f"You are running a UK RegTech compliance simulation.\n\n"
            f"Financial product: {label}\n"
            f"APR: {req.apr:.1f}%\n"
            f"Target age group: {req.target_age_group}\n"
            f"Customer: {p['name']} — {p['desc']}\n\n"
            f"Write a realistic first-person complaint (2–3 sentences) from this person about "
            f"the {label}. Reflect their background, the high cost, and the emotional impact. "
            f"UK English only. No hashtags or social-media style."
        )
        msg = client.messages.create(
            model="claude-haiku-4-5-20251001",
            max_tokens=250,
            messages=[{"role": "user", "content": prompt}],
        )
        logs.append({
            "timestamp": f"Day {p['day']}",
            "persona":   f"{p['name']} — {p['desc'].split(',')[0].strip()}",
            "message":   msg.content[0].text.strip(),
            "severity":  p["severity"],
        })
    return logs


def _get_personas(req: SimulationRequest) -> list[dict]:
    has_anthropic = find_spec("anthropic") is not None
    has_key       = bool(os.getenv("ANTHROPIC_API_KEY", "").strip())
    if has_anthropic and has_key:
        try:
            return _llm_personas(req)
        except Exception:
            pass
    return _static_personas(req)


# ─── Public entry point ───────────────────────────────────────────────────────

def run_simulation(req: SimulationRequest) -> SimulationResponse:
    base       = _base_risk(req)
    risks      = _build_risk_curve(base, req.simulation_days)
    complaints = _build_complaint_curve(base, req.simulation_days)

    risk_curve = [
        DayDataPoint(
            day=i + 1,
            risk_score=round(risks[i], 2),
            cumulative_complaints=complaints[i],
        )
        for i in range(req.simulation_days)
    ]

    peak_risk = max(risks)
    summary   = SimulationSummary(
        peak_risk_score=round(peak_risk, 2),
        peak_risk_day=risks.index(peak_risk) + 1,
        total_complaints=complaints[-1],
        compliance_verdict=_verdict(peak_risk),
    )

    terminal_logs = [TerminalLogEntry(**log) for log in _get_personas(req)]

    return SimulationResponse(
        simulation_id=str(uuid.uuid4())[:8],
        product_type=req.product_type,
        apr=req.apr,
        risk_curve=risk_curve,
        summary=summary,
        terminal_logs=terminal_logs,
    )
