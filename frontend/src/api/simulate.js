// ─── API layer ────────────────────────────────────────────────────────────────
// All backend calls go through here.
// If the backend is not running the mock fallback kicks in automatically.

import { generateMockResult } from './mockData'

/**
 * POST /api/simulate
 * @param {{ productType, apr, ageGroup, vulnerableRatio }} params
 * @returns {Promise<SimulationResult>}
 */
export async function runSimulation(params) {
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), 15000)

  try {
    const res = await fetch('/api/simulate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        product_type:                params.productType,
        target_age_group:            params.ageGroup,
        vulnerable_population_ratio: params.vulnerableRatio,
        simulation_days:             90,
        // credit
        apr:                         params.apr ?? 0,
        // insurance
        annual_premium:              params.annualPremium ?? null,
        claims_rejection_rate:       params.claimsRejectionRate ?? null,
        exclusion_ratio:             params.exclusionRatio ?? null,
        // investment
        annual_fee_pct:              params.annualFeePct ?? null,
        risk_rating:                 params.riskRating ?? null,
      }),
      signal: controller.signal,
    })
    if (!res.ok) throw new Error(`API ${res.status}`)
    const json = await res.json()
    // Normalise backend response → shared frontend shape
    return {
      risks:          json.risk_curve.map(d => d.risk_score),
      complaints:     json.risk_curve.map(d => d.cumulative_complaints),
      logs:           json.terminal_logs,
      summary:        json.summary,
      scorecard:      json.duty_scorecard      ?? null,
      recommendations: json.recommendations   ?? null,
      debateMessages: json.debate_messages     ?? null,
    }
  } catch (error) {
    console.warn('runSimulation failed, falling back to mock result:', error)
    return generateMockResult(params)
  } finally {
    clearTimeout(timeoutId)
  }
}
