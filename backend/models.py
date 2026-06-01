from __future__ import annotations

from enum import Enum
from typing import List, Optional

from pydantic import BaseModel, Field


class ProductType(str, Enum):
    BNPL             = "buy-now-pay-later"
    HIGH_INTEREST    = "high-interest-loan"
    CREDIT_CARD      = "credit-card"
    PAYDAY           = "payday-loan"
    INVESTMENT       = "investment-product"


class SimulationRequest(BaseModel):
    product_type: ProductType
    apr: float = Field(..., ge=0, le=500, description="Annual Percentage Rate (%)")
    target_age_group: str = Field(..., description="e.g. '18-25', '26-40', '41-60', '60+'")
    vulnerable_population_ratio: float = Field(..., ge=0.0, le=1.0)
    simulation_days: int = Field(default=90, ge=30, le=365)


# ─── Existing simulation output ───────────────────────────────────────────────

class DayDataPoint(BaseModel):
    day: int
    risk_score: float
    cumulative_complaints: int


class TerminalLogEntry(BaseModel):
    timestamp: str
    persona: str
    message: str
    severity: str          # "LOW" | "MEDIUM" | "HIGH"


class SimulationSummary(BaseModel):
    peak_risk_score: float
    peak_risk_day: int
    total_complaints: int
    compliance_verdict: str  # "LOW_RISK" | "MEDIUM_RISK" | "HIGH_RISK" | "CRITICAL"


# ─── Consumer Duty (NEW) ──────────────────────────────────────────────────────

class DutyOutcome(BaseModel):
    outcome_id: str     # "products_services" | "price_value" | "consumer_understanding" | "consumer_support"
    name: str           # "Products & Services"
    rule_ref: str       # "PRIN 2A.2"
    status: str         # "GREEN" | "AMBER" | "RED"
    score: int          # 0-100
    evidence: str       # 1-sentence evidence statement
    weight: float       # contribution to overall score


class ConsumerDutyScorecard(BaseModel):
    outcomes: List[DutyOutcome]   # exactly 4
    overall_score: int
    overall_status: str            # "GREEN" | "AMBER" | "RED"


# ─── AI Fix-It Recommendations (NEW) ──────────────────────────────────────────

class Recommendation(BaseModel):
    priority: int           # 1, 2, 3
    outcome_affected: str   # matches DutyOutcome.outcome_id
    action: str             # short imperative ≤10 words
    detail: str             # 1-2 sentence explanation
    before_status: str      # current status
    after_status: str       # projected status after action
    score_delta: int        # projected score improvement


# ─── Multi-Agent Debate Messages (NEW) ────────────────────────────────────────

class DebateMessage(BaseModel):
    speaker: str        # "FCA Examiner" | "Compliance Officer" | persona name
    role: str           # "regulator" | "compliance" | "consumer"
    day: str            # "Opening Statement" | "Day 14" | etc.
    message: str
    severity: str       # "LOW" | "MEDIUM" | "HIGH"
    color_class: str    # Tailwind class e.g. "text-purple-400"
    emoji: str


# ─── Full simulation response ──────────────────────────────────────────────────

class SimulationResponse(BaseModel):
    simulation_id: str
    product_type: str
    apr: float
    risk_curve: List[DayDataPoint]
    summary: SimulationSummary
    terminal_logs: List[TerminalLogEntry]
    # New fields — Optional so existing callers remain backward-compatible
    duty_scorecard: Optional[ConsumerDutyScorecard] = None
    recommendations: Optional[List[Recommendation]] = None
    debate_messages: Optional[List[DebateMessage]] = None
