import { useState, useEffect, useRef, useCallback } from 'react'
import { runSimulation } from '../api/simulate'
import FormPanel, { categoryOf, CATEGORY_DEFAULTS } from './FormPanel'
import ChartPanel            from './ChartPanel'
import ConsumerDutyScorecard from './ConsumerDutyScorecard'
import RecommendPanel        from './RecommendPanel'
import TerminalLog           from './TerminalLog'

const DEFAULT_PARAMS = {
  productType:     'buy-now-pay-later',
  apr:             39.9,
  ageGroup:        '18–25',
  vulnerableRatio: 0.35,
}

export default function Dashboard({ presetParams }) {
  const [params, setParams] = useState(() => {
    if (!presetParams) return DEFAULT_PARAMS
    // Map Stage-1 audit product_type → Stage-2 simulator product type
    const AUDIT_TO_SIM = {
      'bnpl':             'buy-now-pay-later',
      'hcstc':            'payday-loan',
      'credit_card':      'credit-card',
      'mortgage':         'high-interest-loan',
      'savings':          'investment-product',
      'investment':       'investment-product',
      'insurance':        'insurance',
      'other':            'buy-now-pay-later',
    }
    const VALID_TYPES = ['buy-now-pay-later','high-interest-loan','credit-card','payday-loan','investment-product','insurance']
    const rawType = presetParams.product_type ?? ''
    const mapped  = AUDIT_TO_SIM[rawType] ?? rawType.replace(/_/g, '-')
    const productType = VALID_TYPES.includes(mapped) ? mapped : DEFAULT_PARAMS.productType
    const cat = categoryOf(productType)
    const ins = cat === 'insurance', inv = cat === 'investment'

    // Carry extracted product-specific params from the audited document;
    // fall back to category defaults so the simulation reflects THIS product.
    const annualPremium =
      presetParams.annual_premium  != null ? presetParams.annual_premium
      : presetParams.monthly_premium != null ? presetParams.monthly_premium * 12
      : ins ? CATEGORY_DEFAULTS.insurance.annualPremium
      : undefined

    return {
      productType,
      ageGroup:        presetParams.target_age_group ?? DEFAULT_PARAMS.ageGroup,
      vulnerableRatio: presetParams.vulnerable_population_ratio ?? DEFAULT_PARAMS.vulnerableRatio,
      apr:                 presetParams.apr ?? CATEGORY_DEFAULTS.credit.apr,
      annualPremium,
      claimsRejectionRate: presetParams.claims_rejection_rate ?? (ins ? CATEGORY_DEFAULTS.insurance.claimsRejectionRate : undefined),
      exclusionRatio:      presetParams.exclusion_ratio        ?? (ins ? CATEGORY_DEFAULTS.insurance.exclusionRatio      : undefined),
      annualFeePct:        presetParams.annual_fee_pct         ?? (inv ? CATEGORY_DEFAULTS.investment.annualFeePct       : undefined),
      riskRating:          presetParams.risk_rating            ?? (inv ? CATEGORY_DEFAULTS.investment.riskRating         : undefined),
    }
  })

  const [isRunning,       setIsRunning]       = useState(false)
  const [progress,        setProgress]        = useState(0)
  const [visiblePts,      setVisiblePts]      = useState(0)
  const [fullData,        setFullData]        = useState(null)
  const [summary,         setSummary]         = useState(null)
  const [scorecard,       setScorecard]       = useState(null)
  const [recommendations, setRecommendations] = useState(null)
  const [termLogs,        setTermLogs]        = useState([])
  const [debateMessages,  setDebateMessages]  = useState([])
  const [isDebateMode,    setIsDebateMode]    = useState(false)
  const [error,           setError]           = useState(null)

  const intervalRef  = useRef(null)
  const timeoutsRef  = useRef([])

  useEffect(() => () => {
    clearInterval(intervalRef.current)
    timeoutsRef.current.forEach(clearTimeout)
  }, [])

  const handleRun = useCallback(async () => {
    clearInterval(intervalRef.current)
    timeoutsRef.current.forEach(clearTimeout)
    timeoutsRef.current = []

    setError(null)
    setIsRunning(true); setVisiblePts(0); setProgress(0)
    setSummary(null); setFullData(null); setScorecard(null)
    setRecommendations(null); setTermLogs([]); setDebateMessages([]); setIsDebateMode(false)

    try {
      const data = await runSimulation(params)
      setFullData(data)

      // Reveal the full result in one commit, then stagger the panels with a
      // handful of timeouts. (The previous 60 ms setInterval re-rendered the
      // whole dashboard ~16×/s and could saturate the main thread / hard-freeze
      // the tab; a single-pass reveal is smoother and safe.)
      setVisiblePts(90)
      setProgress(100)
      setTermLogs(data.logs ?? [])
      setIsRunning(false)
      setSummary(data.summary)

      const t1 = setTimeout(() => setScorecard(data.scorecard), 250)
      const t2 = setTimeout(() => setRecommendations(data.recommendations), 600)
      const t3 = setTimeout(() => {
        if (data.debateMessages?.length) {
          setIsDebateMode(true)
          setDebateMessages([])
          data.debateMessages.forEach((msg, idx) => {
            const t = setTimeout(() => setDebateMessages(prev => [...prev, msg]), idx * 600)
            timeoutsRef.current.push(t)
          })
        }
      }, 1000)
      timeoutsRef.current.push(t1, t2, t3)
    } catch (err) {
      console.error('Stage 2 simulation failed:', err)
      setError('Simulation failed. Check browser console or backend status.')
      setIsRunning(false)
    }
  }, [params])

  const riskSlice      = fullData ? fullData.risks.slice(0, visiblePts)      : []
  const complaintSlice = fullData ? fullData.complaints.slice(0, visiblePts) : []
  const terminalLogs   = debateMessages.length ? debateMessages : termLogs
  const terminalDebate = debateMessages.length > 0

  return (
    <div className="min-h-screen px-4 md:px-6 py-6" style={{ background: '#08090a' }}>

      {/* Header */}
      <div className="mb-6 flex items-center gap-3 animate-fadeUp">
        <div className="w-px h-8 rounded-full"
             style={{ background: 'linear-gradient(180deg, #4f9cf9, #00d4aa)' }} />
        <div>
          <h1 className="text-base font-light tracking-wide text-white">
            Dynamic Simulation
          </h1>
          <p className="text-[9px] text-white/25 mt-0.5 tracking-widest uppercase">
            1,000 Virtual Agents · 90-Day FCA Stress-Test · PS22/9
          </p>
        </div>
        <div className="ml-auto flex items-center gap-2 text-[9px] text-white/15 tracking-wider">
          <span className="w-1.5 h-1.5 rounded-full bg-[#00d4aa]" />
          RegTech · Consumer Duty
        </div>
      </div>

      {/* Form | Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-[300px_1fr] gap-4 mb-4 animate-fadeUp delay-100">
        <FormPanel
          params={params} setParams={setParams}
          onRun={handleRun} isRunning={isRunning}
          progress={progress} summary={summary}
        />
        <ChartPanel
          risks={riskSlice} complaints={complaintSlice}
          isRunning={isRunning} progress={progress}
        />
      </div>

      {error && (
        <div className="mb-4 animate-fadeUp rounded-2xl p-4 bg-red-500/10 border border-red-500/20 text-red-100">
          <p className="text-sm font-medium">{error}</p>
          <p className="text-xs text-red-200/80 mt-1">Check browser console for details and confirm backend at 127.0.0.1:8000</p>
        </div>
      )}

      {scorecard && (
        <div className="mb-4 animate-fadeUp">
          <ConsumerDutyScorecard scorecard={scorecard} />
        </div>
      )}

      {recommendations && (
        <div className="mb-4 animate-fadeUp">
          <RecommendPanel recommendations={recommendations} />
        </div>
      )}

      <TerminalLog logs={terminalLogs} isRunning={isRunning} isDebateMode={terminalDebate} />
    </div>
  )
}
