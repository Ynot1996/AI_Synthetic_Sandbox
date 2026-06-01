// ─── Mock data generator ──────────────────────────────────────────────────────
// Used when the backend is not running.
// Frontend devs can work entirely against this file without needing Python.

const PRODUCT_WEIGHTS = {
  'buy-now-pay-later':  1.2,
  'high-interest-loan': 1.8,
  'credit-card':        1.0,
  'payday-loan':        2.0,
  'investment-product': 1.3,
}

function getVerdict(peak) {
  if (peak >= 75) return 'CRITICAL'
  if (peak >= 50) return 'HIGH_RISK'
  if (peak >= 25) return 'MEDIUM_RISK'
  return 'LOW_RISK'
}

function buildCurves(base) {
  const risks = [], complaints = []
  let cum = 0
  for (let day = 1; day <= 90; day++) {
    const logistic = base / (1 + Math.exp(-0.09 * (day - 36)))
    risks.push(Math.max(0, Math.min(100, logistic * 100 + (Math.random() - 0.5) * 3.5)))
    const ramp = Math.min(day / 30, 1)
    cum += Math.max(0, Math.floor(base * 15 * ramp * (1 + (Math.random() - 0.5) * 0.3)))
    complaints.push(cum)
  }
  return { risks, complaints }
}

function buildLogs(apr, productType) {
  const label = productType.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
  return [
    {
      timestamp: 'Day 14',
      persona:   'Sarah, 32 — Single mother, low financial literacy',
      message:   `I took this ${label} thinking it was affordable, but at ${apr}% APR I'm paying back nearly double. Nobody explained the true cost.`,
      severity:  'HIGH',
    },
    {
      timestamp: 'Day 36',
      persona:   'Jake, 23 — Graduate, first-time borrower',
      message:   `The app made signing up so easy. I didn't realise ${apr}% APR was this expensive until I missed a payment.`,
      severity:  'MEDIUM',
    },
    {
      timestamp: 'Day 67',
      persona:   'Margaret, 68 — Retired pensioner, fixed income',
      message:   `My adviser recommended this ${label} but never explained the charges. On my pension I simply cannot keep up.`,
      severity:  'HIGH',
    },
  ]
}

/**
 * Generate a full mock simulation result.
 * @param {{ productType, apr, vulnerableRatio }} params
 * @returns {SimulationResult}
 */
export function generateMockResult({ productType, apr, vulnerableRatio }) {
  const weight = PRODUCT_WEIGHTS[productType] ?? 1.0
  const base   = Math.min((Math.min(apr / 200, 1) * 0.6 + vulnerableRatio * 0.4) * Math.min(weight, 2), 1)
  const { risks, complaints } = buildCurves(base)
  const peak = Math.max(...risks)

  return {
    risks,
    complaints,
    logs: buildLogs(apr, productType),
    summary: {
      peak_risk_score:    Math.round(peak * 10) / 10,
      peak_risk_day:      risks.indexOf(peak) + 1,
      total_complaints:   complaints[89],
      compliance_verdict: getVerdict(peak),
    },
  }
}
