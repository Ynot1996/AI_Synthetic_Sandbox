import { useState, useEffect, useRef, useCallback } from 'react'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js'
import { Line } from 'react-chartjs-2'

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler)

// ─── Mock data helpers ────────────────────────────────────────────────────────

function generateMockRiskCurve(apr, vulnerableRatio, productType) {
  const WEIGHTS = {
    'buy-now-pay-later': 1.2,
    'high-interest-loan': 1.8,
    'credit-card': 1.0,
    'payday-loan': 2.0,
    'investment-product': 1.3,
  }
  const weight = WEIGHTS[productType] ?? 1.0
  const base = Math.min((Math.min(apr / 200, 1) * 0.6 + vulnerableRatio * 0.4) * Math.min(weight, 2), 1)
  const risks = [], complaints = []
  let cum = 0
  for (let day = 1; day <= 90; day++) {
    const logistic = base / (1 + Math.exp(-0.09 * (day - 36)))
    const noise = (Math.random() - 0.5) * 3.5
    risks.push(Math.max(0, Math.min(100, logistic * 100 + noise)))
    const ramp = Math.min(day / 30, 1)
    cum += Math.max(0, Math.floor(base * 15 * ramp * (1 + (Math.random() - 0.5) * 0.3)))
    complaints.push(cum)
  }
  return { risks, complaints }
}

function generateMockLogs(apr, productType) {
  const label = productType.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
  return [
    {
      timestamp: 'Day 14',
      persona: 'Sarah, 32 — Single mother, low financial literacy',
      message: `I took this ${label} thinking it was affordable, but at ${apr}% APR I'm now paying back nearly double what I borrowed. Nobody explained the true cost when I signed up.`,
      severity: 'HIGH',
    },
    {
      timestamp: 'Day 36',
      persona: 'Jake, 23 — Graduate, first-time borrower',
      message: `The app made it so easy to sign up — I didn't realise ${apr}% APR was this expensive until I missed a payment. The marketing felt genuinely misleading.`,
      severity: 'MEDIUM',
    },
    {
      timestamp: 'Day 67',
      persona: 'Margaret, 68 — Retired pensioner, fixed income',
      message: `My bank adviser recommended this ${label} but never clearly explained the charges. On my pension I simply cannot keep up with the repayments. This should not be allowed.`,
      severity: 'HIGH',
    },
  ]
}

// ─── Constants ────────────────────────────────────────────────────────────────

const PRODUCT_TYPES = [
  { value: 'buy-now-pay-later',  label: 'Buy Now, Pay Later (BNPL)' },
  { value: 'high-interest-loan', label: 'High-Interest Personal Loan' },
  { value: 'credit-card',        label: 'Credit Card' },
  { value: 'payday-loan',        label: 'Payday Loan' },
  { value: 'investment-product', label: 'Investment Product' },
]

const AGE_GROUPS = ['18–25', '26–40', '41–60', '60+']

const VERDICT = {
  LOW_RISK:    { bg: 'bg-emerald-500/10', text: 'text-emerald-400', border: 'border-emerald-500/40', label: 'LOW RISK' },
  MEDIUM_RISK: { bg: 'bg-yellow-500/10',  text: 'text-yellow-400',  border: 'border-yellow-500/40',  label: 'MEDIUM RISK' },
  HIGH_RISK:   { bg: 'bg-orange-500/10',  text: 'text-orange-400',  border: 'border-orange-500/40',  label: 'HIGH RISK' },
  CRITICAL:    { bg: 'bg-red-500/10',     text: 'text-red-400',     border: 'border-red-500/40',     label: 'CRITICAL' },
}

const SEVERITY_COLOR = { HIGH: 'text-red-400', MEDIUM: 'text-yellow-400', LOW: 'text-emerald-400' }

function getVerdict(peak) {
  if (peak >= 75) return 'CRITICAL'
  if (peak >= 50) return 'HIGH_RISK'
  if (peak >= 25) return 'MEDIUM_RISK'
  return 'LOW_RISK'
}

// ─── Log trigger days (when logs pop into terminal relative to animation) ─────
const LOG_TRIGGER = [14, 36, 67]

// ─── Dashboard ────────────────────────────────────────────────────────────────

export default function Dashboard() {
  const [params, setParams] = useState({
    productType: 'buy-now-pay-later',
    apr: 39.9,
    ageGroup: '18–25',
    vulnerableRatio: 0.35,
  })

  const [isRunning, setIsRunning]       = useState(false)
  const [progress, setProgress]         = useState(0)
  const [visiblePts, setVisiblePts]     = useState(0)
  const [fullData, setFullData]         = useState(null)   // {risks[], complaints[], logs[]}
  const [termLogs, setTermLogs]         = useState([])
  const [summary, setSummary]           = useState(null)

  const termRef    = useRef(null)
  const intervalRef = useRef(null)

  // Auto-scroll terminal
  useEffect(() => {
    if (termRef.current) termRef.current.scrollTop = termRef.current.scrollHeight
  }, [termLogs])

  // Cleanup on unmount
  useEffect(() => () => clearInterval(intervalRef.current), [])

  const runSimulation = useCallback(async () => {
    clearInterval(intervalRef.current)
    setIsRunning(true)
    setVisiblePts(0)
    setProgress(0)
    setTermLogs([])
    setSummary(null)
    setFullData(null)

    let data
    try {
      const res = await fetch('/api/simulate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          product_type: params.productType,
          apr: params.apr,
          target_age_group: params.ageGroup,
          vulnerable_population_ratio: params.vulnerableRatio,
          simulation_days: 90,
        }),
        signal: AbortSignal.timeout(12000),
      })
      if (!res.ok) throw new Error('API error')
      const json = await res.json()
      data = {
        risks:      json.risk_curve.map(d => d.risk_score),
        complaints: json.risk_curve.map(d => d.cumulative_complaints),
        logs:       json.terminal_logs,
        summary:    json.summary,
      }
    } catch {
      // Fallback: generate mock data entirely in the browser
      const mock = generateMockRiskCurve(params.apr, params.vulnerableRatio, params.productType)
      const peak = Math.max(...mock.risks)
      data = {
        risks:      mock.risks,
        complaints: mock.complaints,
        logs:       generateMockLogs(params.apr, params.productType),
        summary: {
          peak_risk_score:    Math.round(peak * 10) / 10,
          peak_risk_day:      mock.risks.indexOf(peak) + 1,
          total_complaints:   mock.complaints[89],
          compliance_verdict: getVerdict(peak),
        },
      }
    }

    setFullData(data)

    // Progressive chart animation: reveal 2 points every ~60 ms
    let pt = 0
    let logIdx = 0
    intervalRef.current = setInterval(() => {
      pt = Math.min(pt + 2, 90)
      setVisiblePts(pt)
      setProgress(Math.round((pt / 90) * 100))

      // Inject terminal logs at the right day markers.
      // Capture the log entry by value before incrementing logIdx,
      // otherwise the closure picks up the already-incremented index.
      while (logIdx < data.logs.length && LOG_TRIGGER[logIdx] <= pt) {
        const entry = data.logs[logIdx]
        setTermLogs(prev => [...prev, entry])
        logIdx++
      }

      if (pt >= 90) {
        clearInterval(intervalRef.current)
        setIsRunning(false)
        setSummary(data.summary)
      }
    }, 60)
  }, [params])

  // ─── Chart data ─────────────────────────────────────────────────────────────

  const labels       = Array.from({ length: visiblePts }, (_, i) => `Day ${i + 1}`)
  const riskSlice     = fullData ? fullData.risks.slice(0, visiblePts) : []
  const compSlice     = fullData ? fullData.complaints.slice(0, visiblePts) : []

  const chartData = {
    labels,
    datasets: [
      {
        label: 'Compliance Risk Score',
        data: riskSlice,
        borderColor: 'rgb(239,68,68)',
        backgroundColor: 'rgba(239,68,68,0.12)',
        borderWidth: 2.5,
        fill: true,
        tension: 0.4,
        yAxisID: 'y',
        pointRadius: 0,
        pointHoverRadius: 5,
      },
      {
        label: 'Cumulative Complaints',
        data: compSlice,
        borderColor: 'rgb(234,179,8)',
        backgroundColor: 'rgba(234,179,8,0.06)',
        borderWidth: 2,
        fill: false,
        tension: 0.4,
        yAxisID: 'y1',
        borderDash: [5, 4],
        pointRadius: 0,
        pointHoverRadius: 5,
      },
    ],
  }

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    animation: { duration: 0 },
    interaction: { mode: 'index', intersect: false },
    scales: {
      x: {
        grid: { color: 'rgba(255,255,255,0.04)' },
        ticks: { color: '#6b7280', maxTicksLimit: 10, font: { size: 11 } },
      },
      y: {
        type: 'linear',
        position: 'left',
        min: 0,
        max: 100,
        grid: { color: 'rgba(255,255,255,0.05)' },
        ticks: { color: '#ef4444', font: { size: 11 } },
        title: { display: true, text: 'Risk Score', color: '#ef4444', font: { size: 11 } },
      },
      y1: {
        type: 'linear',
        position: 'right',
        grid: { drawOnChartArea: false },
        ticks: { color: '#eab308', font: { size: 11 } },
        title: { display: true, text: 'Complaints', color: '#eab308', font: { size: 11 } },
      },
    },
    plugins: {
      legend: {
        labels: { color: '#d1d5db', usePointStyle: true, pointStyleWidth: 14, padding: 20 },
      },
      tooltip: {
        backgroundColor: 'rgba(17,24,39,0.96)',
        titleColor: '#f3f4f6',
        bodyColor: '#9ca3af',
        borderColor: 'rgba(75,85,99,0.5)',
        borderWidth: 1,
        padding: 10,
        callbacks: {
          label: ctx =>
            ctx.datasetIndex === 0
              ? `  Risk: ${ctx.parsed.y.toFixed(1)}`
              : `  Complaints: ${Math.round(ctx.parsed.y)}`,
        },
      },
    },
  }

  // ─── Render ──────────────────────────────────────────────────────────────────

  const verdictStyle = summary ? (VERDICT[summary.compliance_verdict] ?? VERDICT.MEDIUM_RISK) : null

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100 p-4 md:p-6 selection:bg-blue-600/40">

      {/* ── Header ── */}
      <div className="mb-6 flex items-center gap-3">
        <div className="w-1.5 h-9 rounded-full bg-gradient-to-b from-blue-400 to-blue-600" />
        <div>
          <h1 className="text-xl md:text-2xl font-bold tracking-tight">
            AI Synthetic Sandbox
          </h1>
          <p className="text-xs text-gray-500 mt-0.5">
            Compliance Stress-Tester · 1,000 Virtual Users · 90-Day Simulation
          </p>
        </div>
        <div className="ml-auto flex items-center gap-2 text-xs text-gray-600">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block" />
          RegTech · FCA-aligned
        </div>
      </div>

      {/* ── Main grid ── */}
      <div className="grid grid-cols-1 lg:grid-cols-[320px_1fr] gap-4 mb-4">

        {/* ── Left: Parameters ── */}
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5 flex flex-col gap-5">
          <h2 className="text-[11px] font-semibold uppercase tracking-widest text-gray-500">
            Product Parameters
          </h2>

          {/* Product Type */}
          <div>
            <label className="block text-xs text-gray-400 mb-1.5">Product Type</label>
            <select
              value={params.productType}
              onChange={e => setParams(p => ({ ...p, productType: e.target.value }))}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-100 focus:outline-none focus:border-blue-500 transition cursor-pointer"
            >
              {PRODUCT_TYPES.map(pt => (
                <option key={pt.value} value={pt.value}>{pt.label}</option>
              ))}
            </select>
          </div>

          {/* APR Slider */}
          <div>
            <div className="flex justify-between items-baseline mb-2">
              <label className="text-xs text-gray-400">Annual Percentage Rate (APR)</label>
              <span className="text-base font-bold text-blue-400">{params.apr.toFixed(1)}%</span>
            </div>
            <input
              type="range" min="0" max="300" step="0.5"
              value={params.apr}
              onChange={e => setParams(p => ({ ...p, apr: parseFloat(e.target.value) }))}
              className="w-full h-1.5 bg-gray-700 rounded-full appearance-none cursor-pointer text-blue-500 accent-blue-500"
            />
            <div className="flex justify-between text-[10px] text-gray-600 mt-1">
              <span>0%</span><span>300%</span>
            </div>
          </div>

          {/* Age Group */}
          <div>
            <label className="block text-xs text-gray-400 mb-2">Target Age Group</label>
            <div className="grid grid-cols-4 gap-1.5">
              {AGE_GROUPS.map(ag => (
                <button
                  key={ag}
                  onClick={() => setParams(p => ({ ...p, ageGroup: ag }))}
                  className={`py-2 rounded-lg text-xs font-medium border transition-all ${
                    params.ageGroup === ag
                      ? 'bg-blue-600 border-blue-500 text-white shadow-lg shadow-blue-500/20'
                      : 'bg-gray-800 border-gray-700 text-gray-400 hover:border-gray-600 hover:text-gray-300'
                  }`}
                >
                  {ag}
                </button>
              ))}
            </div>
          </div>

          {/* Vulnerable Population */}
          <div>
            <div className="flex justify-between items-baseline mb-2">
              <label className="text-xs text-gray-400">Vulnerable Population</label>
              <span className="text-base font-bold text-orange-400">
                {Math.round(params.vulnerableRatio * 100)}%
              </span>
            </div>
            <input
              type="range" min="0" max="1" step="0.01"
              value={params.vulnerableRatio}
              onChange={e => setParams(p => ({ ...p, vulnerableRatio: parseFloat(e.target.value) }))}
              className="w-full h-1.5 bg-gray-700 rounded-full appearance-none cursor-pointer accent-orange-500"
            />
            <div className="flex justify-between text-[10px] text-gray-600 mt-1">
              <span>0%</span><span>100%</span>
            </div>
          </div>

          {/* Run button */}
          <button
            onClick={runSimulation}
            disabled={isRunning}
            className={`mt-1 w-full py-3 rounded-xl font-semibold text-sm tracking-wide transition-all ${
              isRunning
                ? 'bg-gray-800 text-gray-500 cursor-not-allowed'
                : 'bg-blue-600 hover:bg-blue-500 active:scale-95 text-white shadow-lg shadow-blue-600/30'
            }`}
          >
            {isRunning ? `Simulating… ${progress}%` : '▶  Run Simulation'}
          </button>

          {/* Verdict card */}
          {summary && verdictStyle && (
            <div className={`border rounded-xl p-4 ${verdictStyle.bg} ${verdictStyle.border} animate-fadeSlideIn`}>
              <div className={`text-[10px] font-bold uppercase tracking-widest mb-3 ${verdictStyle.text}`}>
                Compliance Verdict · {verdictStyle.label}
              </div>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <div className="text-[10px] text-gray-500 mb-0.5">Peak Risk</div>
                  <div className={`text-xl font-bold ${verdictStyle.text}`}>
                    {summary.peak_risk_score}
                  </div>
                </div>
                <div>
                  <div className="text-[10px] text-gray-500 mb-0.5">Peak Day</div>
                  <div className="text-xl font-bold text-gray-100">#{summary.peak_risk_day}</div>
                </div>
                <div className="col-span-2">
                  <div className="text-[10px] text-gray-500 mb-0.5">Total Complaints (90d)</div>
                  <div className="text-xl font-bold text-gray-100">
                    {summary.total_complaints.toLocaleString()}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* ── Right: Chart ── */}
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5 flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-[11px] font-semibold uppercase tracking-widest text-gray-500">
              90-Day Risk Analysis
            </h2>
            {isRunning && (
              <div className="flex items-center gap-2 text-xs text-blue-400">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse inline-block" />
                Simulating 1,000 agents…
              </div>
            )}
          </div>

          <div className="flex-1 min-h-[280px]">
            {fullData && visiblePts > 0 ? (
              <Line data={chartData} options={chartOptions} />
            ) : (
              <div className="h-full flex flex-col items-center justify-center gap-3 text-gray-700">
                <svg className="w-14 h-14" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={0.8}
                    d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
                <p className="text-sm">Set parameters and run the simulation</p>
              </div>
            )}
          </div>

          {/* Progress bar */}
          {isRunning && (
            <div className="mt-4 h-1 bg-gray-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-blue-500 rounded-full transition-all duration-75"
                style={{ width: `${progress}%` }}
              />
            </div>
          )}
        </div>
      </div>

      {/* ── Terminal Log ── */}
      <div className="bg-black border border-gray-800 rounded-2xl overflow-hidden">
        {/* Title bar */}
        <div className="flex items-center gap-2.5 px-4 py-2.5 bg-gray-900/80 border-b border-gray-800">
          <span className="w-3 h-3 rounded-full bg-red-500/70" />
          <span className="w-3 h-3 rounded-full bg-yellow-500/70" />
          <span className="w-3 h-3 rounded-full bg-emerald-500/70" />
          <span className="ml-2 text-[11px] text-gray-600 font-mono">
            virtual-agent-terminal — 1,000 synthetic users
          </span>
        </div>

        {/* Log body */}
        <div
          ref={termRef}
          className="h-52 overflow-y-auto px-4 py-3 font-mono text-xs space-y-4 scroll-smooth"
        >
          {termLogs.length === 0 ? (
            <p className="text-gray-700">
              {isRunning ? '$ Initialising agents…' : '$ Awaiting simulation. Adjust parameters and press ▶ Run.'}
            </p>
          ) : (
            termLogs.map((log, i) => (
              <div key={i} className="animate-fadeSlideIn">
                <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 mb-0.5">
                  <span className="text-gray-600">[{log.timestamp}]</span>
                  <span className="text-blue-400 font-medium">{log.persona}</span>
                  <span className={`font-bold uppercase text-[10px] ${SEVERITY_COLOR[log.severity] ?? 'text-gray-400'}`}>
                    [{log.severity}]
                  </span>
                </div>
                <p className={`pl-3 leading-relaxed border-l border-gray-800 ${SEVERITY_COLOR[log.severity] ?? 'text-gray-300'}`}>
                  "{log.message}"
                </p>
              </div>
            ))
          )}
          {isRunning && (
            <span className="text-emerald-500 animate-pulse">█</span>
          )}
        </div>
      </div>
    </div>
  )
}
