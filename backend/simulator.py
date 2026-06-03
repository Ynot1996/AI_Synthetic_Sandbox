"""
Core simulation engine — Consumer Duty Copilot edition.

Pipeline per request:
  1. Statistical simulation  (risk curve + complaint curve)   — no API
  2. Consumer Duty Scorecard (4 outcome scores)               — no API
  3. Fix-It Recommendations  (3 actionable items)             — Claude Haiku (optional)
  4. Regulatory Debate       (7-message FCA/firm/consumer)    — Claude Haiku (optional)

Everything degrades gracefully to static fallbacks when ANTHROPIC_API_KEY is absent.
"""

from __future__ import annotations

import json
import os
import uuid
from importlib.util import find_spec

import numpy as np

from models import (
    ConsumerDutyScorecard,
    DayDataPoint,
    DebateMessage,
    DutyOutcome,
    Recommendation,
    SimulationRequest,
    SimulationResponse,
    SimulationSummary,
    TerminalLogEntry,
    product_category,
)

# ─── Product-type helpers ─────────────────────────────────────────────────────

_PRODUCT_WEIGHT: dict[str, float] = {
    "buy-now-pay-later":  1.2,
    "high-interest-loan": 1.8,
    "credit-card":        1.0,
    "payday-loan":        2.0,
    "investment-product": 1.3,
    "insurance":          1.4,
}

# Fair APR threshold per product type (used by Price & Value scoring)
_APR_FAIR: dict[str, float] = {
    "buy-now-pay-later":  0.0,    # BNPL purchase period should be 0%
    "credit-card":        25.0,
    "high-interest-loan": 30.0,
    "payday-loan":        100.0,  # FCA HCSTC cap equivalent
    "investment-product": 2.0,    # ongoing charge equivalent
}

# Fair ongoing charge (%) for investment products (Price & Value)
_FAIR_FEE_PCT = 0.75

# Product-type base risk penalty for Products & Services scoring
_PRODUCT_PS_PENALTY: dict[str, int] = {
    "payday-loan":        35,
    "high-interest-loan": 25,
    "buy-now-pay-later":  15,
    "investment-product": 10,
    "credit-card":         5,
    "insurance":          15,
}

# Sensible defaults when a product-specific field is missing from the request.
_DEF_CLAIMS_REJECTION = 0.12
_DEF_EXCLUSION_RATIO  = 0.30
_DEF_ANNUAL_FEE_PCT   = 1.0
_DEF_RISK_RATING      = 4


_PRODUCT_LABEL_OVERRIDE: dict[str, str] = {
    "insurance": "insurance policy",
}


def _label(req: SimulationRequest) -> str:
    if req.product_type in _PRODUCT_LABEL_OVERRIDE:
        return _PRODUCT_LABEL_OVERRIDE[req.product_type].title()
    return req.product_type.replace("-", " ").title()


def _cost_phrase(req: SimulationRequest) -> str:
    """Human-readable headline cost/harm driver, used in evidence & debate text.

    Credit products are framed by APR; insurance by premium + claims denial;
    investment by ongoing charge + risk rating — so the narrative stays realistic
    per product instead of forcing an APR onto everything."""
    cat = product_category(req.product_type)
    if cat == "insurance":
        bits = []
        if req.annual_premium:
            bits.append(f"£{req.annual_premium:.0f}/yr premium")
        rej = req.claims_rejection_rate if req.claims_rejection_rate is not None else _DEF_CLAIMS_REJECTION
        bits.append(f"{rej * 100:.0f}% of claims denied")
        return ", ".join(bits)
    if cat == "investment":
        fee = req.annual_fee_pct if req.annual_fee_pct is not None else _DEF_ANNUAL_FEE_PCT
        rr  = req.risk_rating if req.risk_rating is not None else _DEF_RISK_RATING
        return f"{fee:.2f}% annual charge at risk rating {rr}/7"
    return f"{req.apr:.1f}% APR"


# ─── Statistical simulation ───────────────────────────────────────────────────

def _base_risk(req: SimulationRequest) -> float:
    vuln   = req.vulnerable_population_ratio
    weight = min(_PRODUCT_WEIGHT.get(req.product_type, 1.0), 2.0)
    cat    = product_category(req.product_type)

    if cat == "insurance":
        rej = req.claims_rejection_rate if req.claims_rejection_rate is not None else _DEF_CLAIMS_REJECTION
        exc = req.exclusion_ratio if req.exclusion_ratio is not None else _DEF_EXCLUSION_RATIO
        driver = 0.50 * rej + 0.30 * exc + 0.20 * vuln
    elif cat == "investment":
        fee_factor  = min((req.annual_fee_pct if req.annual_fee_pct is not None else _DEF_ANNUAL_FEE_PCT) / 5.0, 1.0)
        risk_factor = ((req.risk_rating if req.risk_rating is not None else _DEF_RISK_RATING) - 1) / 6.0
        driver = 0.45 * fee_factor + 0.35 * risk_factor + 0.20 * vuln
    else:  # credit
        apr_factor = min(req.apr / 200.0, 1.0)
        driver = 0.6 * apr_factor + 0.4 * vuln

    return min(driver * weight, 1.0)


def _build_risk_curve(base: float, days: int) -> list[float]:
    rng      = np.random.default_rng(42)
    midpoint = days * 0.4
    rate     = 0.08 + base * 0.05
    return [
        float(np.clip((base / (1 + np.exp(-rate * (d - midpoint))) + rng.normal(0, 0.02)) * 100, 0, 100))
        for d in range(1, days + 1)
    ]


def _build_complaint_curve(base: float, days: int) -> list[int]:
    rng       = np.random.default_rng(123)
    peak_rate = base * 15
    total     = 0
    counts    = []
    for day in range(1, days + 1):
        ramp   = min(day / 30.0, 1.0)
        total += int(max(0, peak_rate * ramp * (1 + rng.normal(0, 0.15))))
        counts.append(total)
    return counts


def _verdict(peak: float) -> str:
    if peak >= 75: return "CRITICAL"
    if peak >= 50: return "HIGH_RISK"
    if peak >= 25: return "MEDIUM_RISK"
    return "LOW_RISK"


# ─── Consumer Duty Scoring (rule-based, zero API cost) ───────────────────────

def _to_status(score: int) -> str:
    if score >= 70: return "GREEN"
    if score >= 40: return "AMBER"
    return "RED"


def _score_products_services(req: SimulationRequest, _summary: SimulationSummary) -> int:
    score = 100
    score -= _PRODUCT_PS_PENALTY.get(req.product_type, 0)
    ag = req.target_age_group
    if ag in ("18–25", "18-25"):
        score -= 15 if req.product_type in ("payday-loan", "high-interest-loan") else 8
    if ag in ("60+",):
        score -= 10 if req.product_type in ("payday-loan", "investment-product") else 5
    score -= int(max(0, req.vulnerable_population_ratio - 0.20) * 40)
    return max(0, min(100, score))


def _score_price_value(req: SimulationRequest, _summary: SimulationSummary) -> int:
    cat = product_category(req.product_type)

    if cat == "insurance":
        # Fair value (PRIN 2A.3) is eroded by denied claims and broad exclusions:
        # a cheap premium is poor value if the policy rarely pays out.
        rej = req.claims_rejection_rate if req.claims_rejection_rate is not None else _DEF_CLAIMS_REJECTION
        exc = req.exclusion_ratio if req.exclusion_ratio is not None else _DEF_EXCLUSION_RATIO
        return max(0, min(100, int(95 - rej * 120 - exc * 40)))

    if cat == "investment":
        fee = req.annual_fee_pct if req.annual_fee_pct is not None else _DEF_ANNUAL_FEE_PCT
        if fee <= _FAIR_FEE_PCT:
            return 90
        ratio = min((fee - _FAIR_FEE_PCT) / (_FAIR_FEE_PCT * 4 + 0.01), 1.0)
        return max(0, int(88 - ratio * 58))

    # credit
    fair = _APR_FAIR.get(req.product_type, 25.0)
    apr  = req.apr
    if apr <= fair:
        return 90
    if apr <= fair * 2:
        ratio = (apr - fair) / max(fair, 0.01)
        return max(0, int(90 - ratio * 40))
    ratio = min((apr - fair * 2) / (fair * 3 + 1), 1.0)
    return max(0, int(50 - ratio * 40))


def _score_consumer_understanding(req: SimulationRequest, summary: SimulationSummary) -> int:
    score = 100
    cat   = product_category(req.product_type)
    if cat == "insurance":
        exc = req.exclusion_ratio if req.exclusion_ratio is not None else _DEF_EXCLUSION_RATIO
        rej = req.claims_rejection_rate if req.claims_rejection_rate is not None else _DEF_CLAIMS_REJECTION
        if exc > 0.50:   score -= 25
        elif exc > 0.30: score -= 15
        if rej > 0.20:   score -= 15   # opaque claims handling => consumers misjudge cover
    elif cat == "investment":
        fee = req.annual_fee_pct if req.annual_fee_pct is not None else _DEF_ANNUAL_FEE_PCT
        rr  = req.risk_rating if req.risk_rating is not None else _DEF_RISK_RATING
        if fee > 1.5:   score -= 20
        elif fee > 1.0: score -= 10
        if rr >= 6:     score -= 15    # complex / high-risk is harder to understand
        elif rr >= 5:   score -= 8
    else:  # credit
        if req.apr > 100:   score -= 30
        elif req.apr > 50:  score -= 20
        elif req.apr > 25:  score -= 10
    age_penalty = {"18–25": 20, "18-25": 20, "26–40": 5, "26-40": 5, "41–60": 0, "41-60": 0, "60+": 12}
    score -= age_penalty.get(req.target_age_group, 0)
    score -= int(req.vulnerable_population_ratio * 25)
    rate   = summary.total_complaints / 1000.0
    if rate > 0.10:   score -= 25
    elif rate > 0.05: score -= 15
    elif rate > 0.02: score -= 8
    return max(0, min(100, score))


def _score_consumer_support(req: SimulationRequest, summary: SimulationSummary) -> int:  # noqa: ARG001
    score = 100
    if summary.peak_risk_score >= 75:   score -= 40
    elif summary.peak_risk_score >= 50: score -= 25
    elif summary.peak_risk_score >= 25: score -= 12
    if summary.total_complaints > 500:   score -= 30
    elif summary.total_complaints > 200: score -= 18
    elif summary.total_complaints > 80:  score -= 8
    if summary.peak_risk_day > 60:  score -= 10
    elif summary.peak_risk_day > 40: score -= 5
    return max(0, min(100, score))


# Evidence generators ---------------------------------------------------------

def _ev_products_services(req: SimulationRequest, _s: SimulationSummary, score: int) -> str:
    label = _label(req)
    vpct  = int(req.vulnerable_population_ratio * 100)
    ag    = req.target_age_group
    if score >= 70:
        return f"{label} is suitable for the {ag} age group with {vpct}% vulnerable users."
    if score >= 40:
        return f"{label} targeting {ag} with {vpct}% vulnerable users raises suitability concerns under PRIN 2A.2."
    return f"PRIN 2A.2 breach likely: {label} is inappropriate for {ag} with {vpct}% vulnerable users."


def _ev_price_value(req: SimulationRequest, _s: SimulationSummary, score: int) -> str:
    phrase = _cost_phrase(req)
    if score >= 70:
        return f"Fair value holds: {phrase} sits within acceptable PRIN 2A.3 thresholds."
    if score >= 40:
        return f"{phrase} pushes against PRIN 2A.3 fair-value limits — the firm may need to justify it."
    return f"Poor value under PRIN 2A.3: {phrase} leaves consumers materially worse off than market alternatives."


def _ev_consumer_understanding(req: SimulationRequest, summary: SimulationSummary, score: int) -> str:
    rate   = summary.total_complaints / 1000.0
    vpct   = int(req.vulnerable_population_ratio * 100)
    phrase = _cost_phrase(req)
    if score >= 70:
        return f"Complaint rate of {rate:.1%} is within acceptable range for the {req.target_age_group} demographic."
    if score >= 40:
        return f"Complaint rate of {rate:.1%} alongside {phrase} suggests {vpct}% of users may not fully understand the terms."
    return f"Complaint rate of {rate:.1%} combined with {phrase} indicates widespread failure of consumer understanding under PRIN 2A.4."


def _ev_consumer_support(_req: SimulationRequest, summary: SimulationSummary, score: int) -> str:
    if score >= 70:
        return f"Peak risk of {summary.peak_risk_score:.0f} at Day {summary.peak_risk_day} is manageable within standard support frameworks."
    if score >= 40:
        return f"Peak risk of {summary.peak_risk_score:.0f} at Day {summary.peak_risk_day} and {summary.total_complaints} complaints require enhanced support capacity."
    return (f"Crisis-level support gap: {summary.total_complaints} complaints peaked at Day "
            f"{summary.peak_risk_day} — standard support frameworks are inadequate under PRIN 2A.5.")


# Assembler -------------------------------------------------------------------

_OUTCOME_META = [
    ("products_services",    "Products & Services", "PRIN 2A.2", 0.25, _score_products_services,    _ev_products_services),
    ("price_value",          "Price & Value",        "PRIN 2A.3", 0.30, _score_price_value,          _ev_price_value),
    ("consumer_understanding","Consumer Understanding","PRIN 2A.4",0.25, _score_consumer_understanding,_ev_consumer_understanding),
    ("consumer_support",     "Consumer Support",     "PRIN 2A.5", 0.20, _score_consumer_support,     _ev_consumer_support),
]


def _build_duty_scorecard(req: SimulationRequest, summary: SimulationSummary) -> ConsumerDutyScorecard:
    outcomes, overall = [], 0.0
    for oid, name, rule, weight, score_fn, ev_fn in _OUTCOME_META:
        sc  = score_fn(req, summary)
        st  = _to_status(sc)
        ev  = ev_fn(req, summary, sc)
        outcomes.append(DutyOutcome(outcome_id=oid, name=name, rule_ref=rule,
                                    status=st, score=sc, evidence=ev, weight=weight))
        overall += sc * weight
    overall_score = int(round(overall))
    return ConsumerDutyScorecard(outcomes=outcomes, overall_score=overall_score,
                                 overall_status=_to_status(overall_score))


# ─── Fix-It Recommendations ───────────────────────────────────────────────────

_CANNED_RECS: dict[str, dict] = {
    "price_value": {
        "action_tpl":   "Reduce APR from {apr:.1f}% to {target:.1f}%",
        "detail_tpl":   ("Lowering APR to {target:.1f}% brings Price & Value within FCA Consumer Duty PRIN 2A.3 "
                         "thresholds and is projected to reduce complaint volume by ~30%."),
        "score_delta":  25,
    },
    "products_services": {
        "action_tpl":   "Add mandatory affordability assessment at onboarding",
        "detail_tpl":   ("Introducing an income and expenditure check ensures the product is distributed only "
                         "to consumers for whom it is appropriate, satisfying PRIN 2A.2."),
        "score_delta":  18,
    },
    "consumer_understanding": {
        "action_tpl":   "Introduce 14-day cooling-off period with clear cost summary",
        "detail_tpl":   ("A standardised total-cost-of-credit disclosure at point-of-sale and a 14-day withdrawal "
                         "right materially improves consumer comprehension under PRIN 2A.4."),
        "score_delta":  20,
    },
    "consumer_support": {
        "action_tpl":   "Deploy proactive outreach at Day {peak_day} complaint spike",
        "detail_tpl":   ("Simulation shows complaints peak at Day {peak_day}. Proactive SMS/email outreach from "
                         "Day {early_day} reduces escalations and satisfies PRIN 2A.5 support obligations."),
        "score_delta":  15,
    },
}


# Product-aware Price & Value fix (credit talks APR; insurance/investment do not)
_PRICE_VALUE_RECS_BY_CAT: dict[str, dict] = {
    "insurance": {
        "action_tpl": "Cut claims-rejection rate and narrow policy exclusions",
        "detail_tpl": ("Reducing denied claims and trimming overly broad exclusions restores fair value "
                       "under PRIN 2A.3 and rebuilds consumer trust that the cover will actually pay out."),
        "score_delta": 25,
    },
    "investment": {
        "action_tpl": "Lower ongoing charge below 0.75% and re-test suitability",
        "detail_tpl": ("Bringing the annual charge in line with fair-value benchmarks and reconfirming risk "
                       "suitability for the target market directly addresses the PRIN 2A.3 concern."),
        "score_delta": 25,
    },
}


def _static_recommendations(req: SimulationRequest, summary: SimulationSummary,
                             scorecard: ConsumerDutyScorecard) -> list[dict]:
    cat = product_category(req.product_type)
    sorted_outcomes = sorted(scorecard.outcomes, key=lambda o: o.score)
    recs = []
    for i, outcome in enumerate(sorted_outcomes[:3]):
        c   = _CANNED_RECS.get(outcome.outcome_id, {
            "action_tpl": "Review product design for Consumer Duty compliance",
            "detail_tpl": "Conduct a formal Consumer Duty product assessment across all four outcome areas.",
            "score_delta": 10,
        })
        if outcome.outcome_id == "price_value" and cat in _PRICE_VALUE_RECS_BY_CAT:
            c = _PRICE_VALUE_RECS_BY_CAT[cat]
        target_apr = max(req.apr * 0.6, 15.0)
        action = c["action_tpl"].format(apr=req.apr, target=target_apr,
                                        peak_day=summary.peak_risk_day,
                                        early_day=max(1, summary.peak_risk_day - 2))
        detail = c["detail_tpl"].format(apr=req.apr, target=target_apr,
                                        peak_day=summary.peak_risk_day,
                                        early_day=max(1, summary.peak_risk_day - 2))
        projected = outcome.score + c["score_delta"]
        after_status = _to_status(projected)
        recs.append(dict(priority=i + 1, outcome_affected=outcome.outcome_id,
                         action=action, detail=detail,
                         before_status=outcome.status, after_status=after_status,
                         score_delta=c["score_delta"]))
    return recs


def _llm_recommendations(req: SimulationRequest, summary: SimulationSummary,
                          scorecard: ConsumerDutyScorecard) -> list[dict]:
    import anthropic
    client  = anthropic.Anthropic()
    sc_text = "\n".join(
        f"- {o.name} ({o.rule_ref}): {o.status} ({o.score}/100) — {o.evidence}"
        for o in scorecard.outcomes
    )
    prompt = (
        f"You are a UK FCA Consumer Duty compliance expert advising a financial services firm.\n\n"
        f"SIMULATION RESULTS:\n"
        f"Product: {_label(req)}\n"
        f"APR: {req.apr:.1f}%\n"
        f"Target age group: {req.target_age_group}\n"
        f"Vulnerable population: {int(req.vulnerable_population_ratio * 100)}%\n"
        f"Peak risk score: {summary.peak_risk_score:.0f}/100 (Day {summary.peak_risk_day})\n"
        f"Total complaints (90d): {summary.total_complaints}\n\n"
        f"FCA CONSUMER DUTY SCORECARD:\n{sc_text}\n\n"
        f"Provide exactly 3 prioritised, actionable recommendations to improve compliance. "
        f"Focus on RED outcomes first. Respond as a JSON array only — no prose outside the JSON:\n"
        f'[{{"priority":1,"outcome_affected":"<outcome_id>","action":"<≤10 words>","detail":"<1-2 sentences>",'
        f'"before_status":"<RED|AMBER|GREEN>","after_status":"<AMBER|GREEN>","score_delta":<int>}},...]'
    )
    msg  = client.messages.create(model="claude-haiku-4-5-20251001", max_tokens=600,
                                   messages=[{"role": "user", "content": prompt}])
    raw  = msg.content[0].text.strip()
    if raw.startswith("```"):
        raw = raw.split("```")[1]
        if raw.startswith("json"): raw = raw[4:]
    return json.loads(raw.strip())[:3]


def _get_recommendations(req: SimulationRequest, summary: SimulationSummary,
                          scorecard: ConsumerDutyScorecard) -> list[dict]:
    if find_spec("anthropic") and os.getenv("ANTHROPIC_API_KEY", "").strip():
        try:
            return _llm_recommendations(req, summary, scorecard)
        except Exception:
            pass
    return _static_recommendations(req, summary, scorecard)


# ─── Multi-Agent Regulatory Debate ───────────────────────────────────────────

# Shared regulator / compliance turns (product-agnostic — {cost} adapts per product)
_EXAMINER_OPEN = {
    "speaker": "FCA Examiner", "role": "regulator", "day": "Opening Statement",
    "severity": "HIGH", "color_class": "text-purple-400", "emoji": "🏛️",
    "message_tpl": (
        "Under Consumer Duty PS22/9 we are examining whether this {label} ({cost}) meets all four "
        "outcome requirements. Our initial assessment flags serious concerns under PRIN 2A.3 Price & "
        "Value. The firm must demonstrate how this delivers genuine value to {age_group} customers."
    ),
}
_COMPLIANCE_OPEN = {
    "speaker": "Compliance Officer", "role": "compliance", "day": "Opening Response",
    "severity": "MEDIUM", "color_class": "text-cyan-400", "emoji": "📋",
    "message_tpl": (
        "We acknowledge the FCA's concerns. The {label} was designed for a defined target market and "
        "we completed a fair value assessment under PRIN 2A.3. That said, the simulation data does "
        "highlight areas for improvement — particularly around {age_group} consumers."
    ),
}
_EXAMINER_FOLLOWUP = {
    "speaker": "FCA Examiner", "role": "regulator", "day": "Follow-up",
    "severity": "HIGH", "color_class": "text-purple-400", "emoji": "🏛️",
    "message_tpl": (
        "That testimony illustrates a Consumer Understanding failure under PRIN 2A.4. Your 90-day "
        "simulation shows {total_complaints} complaints. Can the firm explain how it met its obligation "
        "to ensure consumers could make properly informed decisions?"
    ),
}
_COMPLIANCE_CLOSE = {
    "speaker": "Compliance Officer", "role": "compliance", "day": "Closing Statement",
    "severity": "MEDIUM", "color_class": "text-cyan-400", "emoji": "📋",
    "message_tpl": (
        "We take these concerns seriously and commit to three actions: improving value for our most "
        "vulnerable segments, rewriting key terms in plain English, and deploying proactive support "
        "outreach before Day {peak_day}."
    ),
}

# Per-category consumer voices (positions 3, 5, 7) — the explainable "victim" testimony
_CONSUMER_SCRIPTS: dict[str, list[dict]] = {
    "credit": [
        {"speaker": "Sarah, 32 — Single mother", "day": "Day 14", "severity": "HIGH",
         "color_class": "text-red-400", "emoji": "👤",
         "message_tpl": ("I took this {label} because I needed help with bills. But at {cost} I'm paying "
                         "back nearly double. Nobody explained what it would actually cost me.")},
        {"speaker": "Jake, 23 — Recent graduate", "day": "Day 36", "severity": "MEDIUM",
         "color_class": "text-yellow-400", "emoji": "👤",
         "message_tpl": ("The app made it so easy to sign up — I didn't read the small print. I didn't "
                         "realise {cost} was this expensive until I missed a payment. It felt like a trap.")},
        {"speaker": "Margaret, 68 — Retired pensioner", "day": "Day 67", "severity": "HIGH",
         "color_class": "text-orange-400", "emoji": "👤",
         "message_tpl": ("My adviser recommended this {label} but never mentioned the true charges. On my "
                         "fixed pension I simply cannot keep up with the repayments. I had to choose "
                         "between food and my monthly payment.")},
    ],
    "insurance": [
        {"speaker": "Sarah, 32 — Single mother", "day": "Day 14", "severity": "HIGH",
         "color_class": "text-red-400", "emoji": "👤",
         "message_tpl": ("I bought this {label} for peace of mind. When I finally claimed, it was denied on "
                         "an exclusion buried in the small print — {cost}. Nothing paid out when I needed it most.")},
        {"speaker": "Jake, 23 — Recent graduate", "day": "Day 36", "severity": "MEDIUM",
         "color_class": "text-yellow-400", "emoji": "👤",
         "message_tpl": ("I assumed I was covered. The premium looked cheap, but the exclusions list was longer "
                         "than the cover, and nobody flagged that my situation simply wasn't included.")},
        {"speaker": "Margaret, 68 — Retired pensioner", "day": "Day 67", "severity": "HIGH",
         "color_class": "text-orange-400", "emoji": "👤",
         "message_tpl": ("My claim was rejected without a clear reason. At my age, fighting an automated "
                         "rejection on a policy I paid into for years is exhausting and deeply unfair.")},
    ],
    "investment": [
        {"speaker": "Sarah, 32 — First-time investor", "day": "Day 14", "severity": "HIGH",
         "color_class": "text-red-400", "emoji": "👤",
         "message_tpl": ("I was told this {label} suited me. Months in, the charges quietly ate my returns — "
                         "{cost}. The risk was far higher than I ever understood when I signed up.")},
        {"speaker": "Jake, 23 — Recent graduate", "day": "Day 36", "severity": "MEDIUM",
         "color_class": "text-yellow-400", "emoji": "👤",
         "message_tpl": ("The headline returns looked great, but the ongoing charges weren't clear. I didn't "
                         "realise how much {cost} would compound against me over time.")},
        {"speaker": "Margaret, 68 — Retired pensioner", "day": "Day 67", "severity": "HIGH",
         "color_class": "text-orange-400", "emoji": "👤",
         "message_tpl": ("This {label} was sold as suitable for my retirement. It was far too risky for "
                         "someone on a fixed income, and the charges were never explained to me plainly.")},
    ],
}


def _static_debate(req: SimulationRequest, summary: SimulationSummary) -> list[dict]:
    cat = product_category(req.product_type)
    ctx = dict(label=_label(req), cost=_cost_phrase(req), age_group=req.target_age_group,
               total_complaints=summary.total_complaints, peak_day=summary.peak_risk_day,
               vpct=int(req.vulnerable_population_ratio * 100))
    consumers = _CONSUMER_SCRIPTS.get(cat, _CONSUMER_SCRIPTS["credit"])
    ordered = [
        _EXAMINER_OPEN, _COMPLIANCE_OPEN, consumers[0],
        _EXAMINER_FOLLOWUP, consumers[1], _COMPLIANCE_CLOSE, consumers[2],
    ]
    result = []
    for tmpl in ordered:
        entry = {k: v for k, v in tmpl.items() if k != "message_tpl"}
        entry["role"] = entry.get("role", "consumer")
        entry["message"] = tmpl["message_tpl"].format(**ctx)
        result.append(entry)
    return result


def _llm_debate(req: SimulationRequest, summary: SimulationSummary,
                scorecard: ConsumerDutyScorecard) -> list[dict]:
    import anthropic
    client = anthropic.Anthropic()
    sc_text = ", ".join(f"{o.name}: {o.status}" for o in scorecard.outcomes)
    prompt = (
        f"Simulate a UK FCA Consumer Duty compliance review meeting.\n\n"
        f"Product: {_label(req)} at {req.apr:.1f}% APR\n"
        f"Target market: {req.target_age_group}, {int(req.vulnerable_population_ratio*100)}% vulnerable\n"
        f"90-day simulation: peak risk {summary.peak_risk_score:.0f}/100, {summary.total_complaints} complaints\n"
        f"Consumer Duty outcomes: {sc_text}\n\n"
        f"Generate a debate with exactly 7 messages in this order:\n"
        f"1. FCA Examiner (Opening): cite PRIN 2A rules, raise key concern\n"
        f"2. Compliance Officer (Response): acknowledge, offer mitigation\n"
        f"3. Sarah, 32 — Single mother (Day 14): personal complaint, HIGH severity\n"
        f"4. FCA Examiner (Follow-up): press on worst Consumer Duty outcome with rule reference\n"
        f"5. Jake, 23 — Graduate (Day 36): personal complaint, MEDIUM severity\n"
        f"6. Compliance Officer (Closing): commit to 3 specific remediation actions\n"
        f"7. Margaret, 68 — Pensioner (Day 67): personal complaint, HIGH severity\n\n"
        f"Return ONLY a JSON array:\n"
        f'[{{"speaker":"FCA Examiner","role":"regulator","day":"Opening Statement",'
        f'"message":"...","severity":"HIGH","color_class":"text-purple-400","emoji":"🏛️"}},...]\n\n'
        f"Roles: FCA Examiner→regulator/text-purple-400/🏛️, "
        f"Compliance Officer→compliance/text-cyan-400/📋, consumers→consumer/text-red-400 or text-yellow-400 or text-orange-400/👤"
    )
    msg  = client.messages.create(model="claude-haiku-4-5-20251001", max_tokens=1400,
                                   messages=[{"role": "user", "content": prompt}])
    raw  = msg.content[0].text.strip()
    if raw.startswith("```"):
        raw = raw.split("```")[1]
        if raw.startswith("json"): raw = raw[4:]
    return json.loads(raw.strip())[:7]


def _get_debate_messages(req: SimulationRequest, summary: SimulationSummary,
                          scorecard: ConsumerDutyScorecard) -> list[dict]:
    if find_spec("anthropic") and os.getenv("ANTHROPIC_API_KEY", "").strip():
        try:
            return _llm_debate(req, summary, scorecard)
        except Exception:
            pass
    return _static_debate(req, summary)


# ─── Legacy persona logs (kept as fallback for terminal_logs) ─────────────────

def _static_personas(req: SimulationRequest) -> list[dict]:
    label = _label(req)
    return [
        {"timestamp": "Day 14", "persona": "Sarah, 32 — Single mother, low financial literacy",
         "message": f"At {req.apr:.1f}% APR I'm paying back nearly double. Nobody explained the true cost.",
         "severity": "HIGH"},
        {"timestamp": "Day 36", "persona": "Jake, 23 — Graduate, first-time borrower",
         "message": f"I didn't realise {req.apr:.1f}% APR was this expensive until I missed a payment.",
         "severity": "MEDIUM"},
        {"timestamp": "Day 67", "persona": "Margaret, 68 — Retired pensioner, fixed income",
         "message": f"My bank recommended this {label} but never explained the charges clearly.",
         "severity": "HIGH"},
    ]


# ─── Public entry point ───────────────────────────────────────────────────────

def run_simulation(req: SimulationRequest) -> SimulationResponse:
    # 1. Statistical simulation
    base       = _base_risk(req)
    risks      = _build_risk_curve(base, req.simulation_days)
    complaints = _build_complaint_curve(base, req.simulation_days)

    risk_curve = [
        DayDataPoint(day=i + 1, risk_score=round(risks[i], 2), cumulative_complaints=complaints[i])
        for i in range(req.simulation_days)
    ]

    peak_risk = max(risks)
    summary   = SimulationSummary(
        peak_risk_score=round(peak_risk, 2),
        peak_risk_day=risks.index(peak_risk) + 1,
        total_complaints=complaints[-1],
        compliance_verdict=_verdict(peak_risk),
    )

    # 2. Consumer Duty Scorecard (rule-based, instant)
    scorecard = _build_duty_scorecard(req, summary)

    # 3. Fix-It Recommendations
    recs_raw      = _get_recommendations(req, summary, scorecard)
    recommendations = [Recommendation(**r) for r in recs_raw]

    # 4. Regulatory Debate (replaces plain persona log when available)
    debate_raw     = _get_debate_messages(req, summary, scorecard)
    debate_messages = [DebateMessage(**m) for m in debate_raw]

    # terminal_logs = consumer-voice entries from the debate (for backward compat)
    terminal_logs = [
        TerminalLogEntry(
            timestamp=m["day"],
            persona=f"{m['emoji']} {m['speaker']}",
            message=m["message"],
            severity=m["severity"],
        )
        for m in debate_raw if m.get("role") == "consumer"
    ]

    return SimulationResponse(
        simulation_id=str(uuid.uuid4())[:8],
        product_type=req.product_type,
        apr=req.apr,
        risk_curve=risk_curve,
        summary=summary,
        terminal_logs=terminal_logs,
        duty_scorecard=scorecard,
        recommendations=recommendations,
        debate_messages=debate_messages,
    )
