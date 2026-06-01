from __future__ import annotations

from enum import Enum
from typing import List

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


class DayDataPoint(BaseModel):
    day: int
    risk_score: float
    cumulative_complaints: int


class TerminalLogEntry(BaseModel):
    timestamp: str
    persona: str
    message: str
    severity: str  # "LOW" | "MEDIUM" | "HIGH"


class SimulationSummary(BaseModel):
    peak_risk_score: float
    peak_risk_day: int
    total_complaints: int
    compliance_verdict: str  # "LOW_RISK" | "MEDIUM_RISK" | "HIGH_RISK" | "CRITICAL"


class SimulationResponse(BaseModel):
    simulation_id: str
    product_type: str
    apr: float
    risk_curve: List[DayDataPoint]
    summary: SimulationSummary
    terminal_logs: List[TerminalLogEntry]
