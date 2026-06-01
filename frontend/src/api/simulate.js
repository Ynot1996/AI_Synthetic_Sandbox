// ─── API layer ────────────────────────────────────────────────────────────────
// All calls to the backend go through here.
// If the backend is not running, mock data is used automatically.

import { generateMockResult } from './mockData'

/**
 * POST /api/simulate
 * @param {Object} params - { productType, apr, ageGroup, vulnerableRatio }
 * @returns {Promise<SimulationResult>}
 */
export async function runSimulation(params) {
  try {
    const res = await fetch('/api/simulate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        product_type:                params.productType,
        apr:                         params.apr,
        target_age_group:            params.ageGroup,
        vulnerable_population_ratio: params.vulnerableRatio,
        simulation_days:             90,
      }),
      signal: AbortSignal.timeout(12000),
    })
    if (!res.ok) throw new Error(`API ${res.status}`)
    const json = await res.json()
    // Normalise backend response → shared shape
    return {
      risks:      json.risk_curve.map(d => d.risk_score),
      complaints: json.risk_curve.map(d => d.cumulative_complaints),
      logs:       json.terminal_logs,
      summary:    json.summary,
    }
  } catch {
    // Backend not running → fall back to mock data
    return generateMockResult(params)
  }
}
