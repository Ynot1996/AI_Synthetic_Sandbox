// ─── Mock data generator ──────────────────────────────────────────────────────
// Used when the backend is not running.
// All scoring logic mirrors backend/simulator.py exactly so the offline demo
// looks identical to the live demo.

// ── Statistical curves ────────────────────────────────────────────────────────

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

// ── Consumer Duty scoring (mirrors backend/simulator.py) ──────────────────────

const APR_FAIR = {
  'buy-now-pay-later':  0,
  'credit-card':        25,
  'high-interest-loan': 30,
  'payday-loan':        100,
  'investment-product': 2,
}

const PRODUCT_PS_PENALTY = {
  'payday-loan':        35,
  'high-interest-loan': 25,
  'buy-now-pay-later':  15,
  'investment-product': 10,
  'credit-card':         5,
}

function toStatus(score) {
  if (score >= 70) return 'GREEN'
  if (score >= 40) return 'AMBER'
  return 'RED'
}

function scoreProductsServices({ productType, ageGroup, vulnerableRatio }) {
  let s = 100
  s -= PRODUCT_PS_PENALTY[productType] ?? 0
  if (ageGroup === '18–25' || ageGroup === '18-25')
    s -= ['payday-loan', 'high-interest-loan'].includes(productType) ? 15 : 8
  if (ageGroup === '60+')
    s -= ['payday-loan', 'investment-product'].includes(productType) ? 10 : 5
  s -= Math.floor(Math.max(0, vulnerableRatio - 0.20) * 40)
  return Math.max(0, Math.min(100, s))
}

function scorePriceValue({ productType, apr }) {
  const fair = APR_FAIR[productType] ?? 25
  if (apr <= fair) return 90
  if (apr <= fair * 2) return Math.max(0, Math.round(90 - ((apr - fair) / Math.max(fair, 0.01)) * 40))
  return Math.max(0, Math.round(50 - Math.min((apr - fair * 2) / (fair * 3 + 1), 1) * 40))
}

function scoreConsumerUnderstanding({ apr, ageGroup, vulnerableRatio }, summary) {
  let s = 100
  if (apr > 100) s -= 30
  else if (apr > 50) s -= 20
  else if (apr > 25) s -= 10
  const agePenalty = { '18–25': 20, '18-25': 20, '26–40': 5, '26-40': 5, '41–60': 0, '41-60': 0, '60+': 12 }
  s -= agePenalty[ageGroup] ?? 0
  s -= Math.floor(vulnerableRatio * 25)
  const rate = summary.total_complaints / 1000
  if (rate > 0.10) s -= 25
  else if (rate > 0.05) s -= 15
  else if (rate > 0.02) s -= 8
  return Math.max(0, Math.min(100, s))
}

function scoreConsumerSupport(summary) {
  let s = 100
  if (summary.peak_risk_score >= 75) s -= 40
  else if (summary.peak_risk_score >= 50) s -= 25
  else if (summary.peak_risk_score >= 25) s -= 12
  if (summary.total_complaints > 500) s -= 30
  else if (summary.total_complaints > 200) s -= 18
  else if (summary.total_complaints > 80) s -= 8
  if (summary.peak_risk_day > 60) s -= 10
  else if (summary.peak_risk_day > 40) s -= 5
  return Math.max(0, Math.min(100, s))
}

function evidenceText(outcomeId, params, summary, score) {
  const label = params.productType.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
  const vpct  = Math.round(params.vulnerableRatio * 100)
  const rate  = (summary.total_complaints / 1000).toFixed(1) + '%'

  if (outcomeId === 'products_services') {
    if (score >= 70) return `${label} is suitable for the ${params.ageGroup} age group with ${vpct}% vulnerable users.`
    if (score >= 40) return `${label} targeting ${params.ageGroup} with ${vpct}% vulnerable users raises suitability concerns under PRIN 2A.2.`
    return `PRIN 2A.2 breach likely: ${label} is inappropriate for ${params.ageGroup} with ${vpct}% vulnerable users.`
  }
  if (outcomeId === 'price_value') {
    if (score >= 70) return `${params.apr.toFixed(1)}% APR is within an acceptable fair-value range for this product type.`
    if (score >= 40) return `${params.apr.toFixed(1)}% APR exceeds fair-value thresholds — FCA may require justification under PRIN 2A.3.`
    return `${params.apr.toFixed(1)}% APR constitutes poor value under PRIN 2A.3; consumers pay significantly more than market alternatives.`
  }
  if (outcomeId === 'consumer_understanding') {
    if (score >= 70) return `Complaint rate of ${rate} is within acceptable range for the ${params.ageGroup} demographic.`
    if (score >= 40) return `Complaint rate of ${rate} and ${params.apr.toFixed(1)}% APR suggest ${vpct}% of users may not fully understand their obligations.`
    return `Complaint rate of ${rate} combined with ${params.apr.toFixed(1)}% APR indicates widespread failure of consumer understanding under PRIN 2A.4.`
  }
  // consumer_support
  if (score >= 70) return `Peak risk of ${summary.peak_risk_score.toFixed(0)} at Day ${summary.peak_risk_day} is manageable within standard support frameworks.`
  if (score >= 40) return `Peak risk of ${summary.peak_risk_score.toFixed(0)} at Day ${summary.peak_risk_day} and ${summary.total_complaints} complaints require enhanced support capacity.`
  return `Crisis-level support gap: ${summary.total_complaints} complaints peaked at Day ${summary.peak_risk_day} — standard support frameworks are inadequate under PRIN 2A.5.`
}

function generateMockDutyScorecard(params, summary) {
  const meta = [
    { id: 'products_services',     name: 'Products & Services',   rule: 'PRIN 2A.2', w: 0.25, fn: scoreProductsServices },
    { id: 'price_value',           name: 'Price & Value',          rule: 'PRIN 2A.3', w: 0.30, fn: scorePriceValue },
    { id: 'consumer_understanding',name: 'Consumer Understanding', rule: 'PRIN 2A.4', w: 0.25, fn: scoreConsumerUnderstanding },
    { id: 'consumer_support',      name: 'Consumer Support',       rule: 'PRIN 2A.5', w: 0.20, fn: scoreConsumerSupport },
  ]
  let overall = 0
  const outcomes = meta.map(m => {
    const score = m.id === 'consumer_support'
      ? m.fn(summary)
      : m.id === 'consumer_understanding'
        ? m.fn(params, summary)
        : m.fn(params)
    const status = toStatus(score)
    overall += score * m.w
    return { outcome_id: m.id, name: m.name, rule_ref: m.rule, status, score,
             evidence: evidenceText(m.id, params, summary, score), weight: m.w }
  })
  const overallScore = Math.round(overall)
  return { outcomes, overall_score: overallScore, overall_status: toStatus(overallScore) }
}

// ── Recommendations ───────────────────────────────────────────────────────────

const CANNED_RECS = {
  price_value: {
    action: (apr) => `Reduce APR from ${apr.toFixed(1)}% to ${Math.max(apr * 0.6, 15).toFixed(1)}%`,
    detail: (apr) => `Lowering APR to ${Math.max(apr * 0.6, 15).toFixed(1)}% brings Price & Value within FCA Consumer Duty PRIN 2A.3 thresholds and is projected to reduce complaint volume by ~30%.`,
    delta: 25,
  },
  products_services: {
    action: () => 'Add mandatory affordability assessment at onboarding',
    detail: () => 'Introducing an income and expenditure check ensures the product is distributed only to consumers for whom it is appropriate, satisfying PRIN 2A.2.',
    delta: 18,
  },
  consumer_understanding: {
    action: () => 'Introduce 14-day cooling-off period with clear cost summary',
    detail: () => 'A standardised total-cost-of-credit disclosure at point-of-sale and a 14-day withdrawal right materially improves consumer comprehension under PRIN 2A.4.',
    delta: 20,
  },
  consumer_support: {
    action: (_, summary) => `Deploy proactive outreach at Day ${summary.peak_risk_day} complaint spike`,
    detail: (_, summary) => `Simulation shows complaints peak at Day ${summary.peak_risk_day}. Proactive SMS/email outreach from Day ${Math.max(1, summary.peak_risk_day - 2)} reduces escalations and satisfies PRIN 2A.5 support obligations.`,
    delta: 15,
  },
}

function generateMockRecommendations(params, summary, scorecard) {
  const sorted = [...scorecard.outcomes].sort((a, b) => a.score - b.score)
  return sorted.slice(0, 3).map((outcome, i) => {
    const c = CANNED_RECS[outcome.outcome_id] ?? {
      action: () => 'Review product design for Consumer Duty compliance',
      detail: () => 'Conduct a formal Consumer Duty product assessment across all four outcome areas.',
      delta: 10,
    }
    const projected = outcome.score + c.delta
    return {
      priority: i + 1,
      outcome_affected: outcome.outcome_id,
      action:  c.action(params.apr, summary),
      detail:  c.detail(params.apr, summary),
      before_status: outcome.status,
      after_status: toStatus(projected),
      score_delta: c.delta,
    }
  })
}

// ── Debate messages ───────────────────────────────────────────────────────────

function generateMockDebateMessages({ productType, apr }, summary) {
  const label = productType.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
  return [
    { speaker: 'FCA Examiner', role: 'regulator', day: 'Opening Statement', severity: 'HIGH',
      color_class: 'text-purple-400', emoji: '🏛️',
      message: `Under Consumer Duty PS22/9, we are examining whether this ${label} at ${apr.toFixed(1)}% APR meets all four outcome requirements. Our initial assessment flags serious concerns under PRIN 2A.3 Price & Value.` },
    { speaker: 'Compliance Officer', role: 'compliance', day: 'Opening Response', severity: 'MEDIUM',
      color_class: 'text-cyan-400', emoji: '📋',
      message: `We acknowledge the FCA's concerns and have conducted a fair value assessment under PRIN 2A.3. However, the simulation data highlights areas for improvement we are committed to addressing.` },
    { speaker: 'Sarah, 32 — Single mother', role: 'consumer', day: 'Day 14', severity: 'HIGH',
      color_class: 'text-red-400', emoji: '👤',
      message: `I took this ${label} because I needed help with bills. But at ${apr.toFixed(1)}% APR I'm paying back nearly double. Nobody explained what it would actually cost me.` },
    { speaker: 'FCA Examiner', role: 'regulator', day: 'Follow-up', severity: 'HIGH',
      color_class: 'text-purple-400', emoji: '🏛️',
      message: `This illustrates a Consumer Understanding failure under PRIN 2A.4. Your simulation shows ${summary.total_complaints} complaints in 90 days. How did the firm meet its obligations to ensure informed decision-making?` },
    { speaker: 'Jake, 23 — Recent graduate', role: 'consumer', day: 'Day 36', severity: 'MEDIUM',
      color_class: 'text-yellow-400', emoji: '👤',
      message: `The app made it so easy to sign up — I didn't read the small print. I didn't realise ${apr.toFixed(1)}% APR was this expensive until I missed a payment. There was no cooling-off period.` },
    { speaker: 'Compliance Officer', role: 'compliance', day: 'Closing Statement', severity: 'MEDIUM',
      color_class: 'text-cyan-400', emoji: '📋',
      message: `We are committing to three immediate actions: reducing the APR for vulnerable segments, introducing a 14-day cooling-off period, and deploying proactive support outreach before Day ${summary.peak_risk_day}.` },
    { speaker: 'Margaret, 68 — Retired pensioner', role: 'consumer', day: 'Day 67', severity: 'HIGH',
      color_class: 'text-orange-400', emoji: '👤',
      message: `My adviser recommended this ${label} but never mentioned the true charges. On my fixed pension I cannot keep up with the repayments. This should never have been sold to me.` },
  ]
}

// ── Persona logs (legacy fallback) ───────────────────────────────────────────

function buildLogs(apr, productType) {
  const label = productType.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
  return [
    { timestamp: 'Day 14', persona: 'Sarah, 32 — Single mother, low financial literacy',
      message: `I took this ${label} thinking it was affordable, but at ${apr}% APR I'm paying back nearly double. Nobody explained the true cost.`, severity: 'HIGH' },
    { timestamp: 'Day 36', persona: 'Jake, 23 — Graduate, first-time borrower',
      message: `The app made signing up so easy. I didn't realise ${apr}% APR was this expensive until I missed a payment.`, severity: 'MEDIUM' },
    { timestamp: 'Day 67', persona: 'Margaret, 68 — Retired pensioner, fixed income',
      message: `My adviser recommended this ${label} but never explained the charges. On my pension I simply cannot keep up.`, severity: 'HIGH' },
  ]
}

// ── Public entry point ────────────────────────────────────────────────────────

/**
 * Generate a full mock simulation result including Consumer Duty scorecard,
 * recommendations, and regulatory debate messages.
 */
export function generateMockResult({ productType, apr, vulnerableRatio, ageGroup }) {
  const weight = PRODUCT_WEIGHTS[productType] ?? 1.0
  const base   = Math.min((Math.min(apr / 200, 1) * 0.6 + vulnerableRatio * 0.4) * Math.min(weight, 2), 1)
  const { risks, complaints } = buildCurves(base)
  const peak = Math.max(...risks)

  const summary = {
    peak_risk_score:    Math.round(peak * 10) / 10,
    peak_risk_day:      risks.indexOf(peak) + 1,
    total_complaints:   complaints[89],
    compliance_verdict: getVerdict(peak),
  }

  const params = { productType, apr, vulnerableRatio, ageGroup }
  const scorecard      = generateMockDutyScorecard(params, summary)
  const recommendations = generateMockRecommendations(params, summary, scorecard)
  const debateMessages  = generateMockDebateMessages({ productType, apr }, summary)

  // terminal_logs = consumer voices from debate (backward-compat)
  const logs = debateMessages
    .filter(m => m.role === 'consumer')
    .map(m => ({ timestamp: m.day, persona: `${m.emoji} ${m.speaker}`, message: m.message, severity: m.severity }))

  return { risks, complaints, logs, summary, scorecard, recommendations, debateMessages }
}
