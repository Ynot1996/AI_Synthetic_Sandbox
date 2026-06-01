// ─── Dashboard ────────────────────────────────────────────────────────────────
// Top-level page component.
// Owns all state and coordinates the three sub-panels:
//   FormPanel   → left  (inputs + verdict)
//   ChartPanel  → right (90-day chart)
//   TerminalLog → bottom (virtual user feedback)

import { useState, useEffect, useRef, useCallback } from 'react'
import { runSimulation } from '../api/simulate'
import FormPanel    from './FormPanel'
import ChartPanel   from './ChartPanel'
import TerminalLog  from './TerminalLog'

// Days at which each terminal log entry pops in during the animation
const LOG_TRIGGER_DAYS = [14, 36, 67]

const DEFAULT_PARAMS = {
  productType:     'buy-now-pay-later',
  apr:             39.9,
  ageGroup:        '18–25',
  vulnerableRatio: 0.35,
}

export default function Dashboard() {
  // ── form state ──────────────────────────────────────────────────────────────
  const [params, setParams] = useState(DEFAULT_PARAMS)

  // ── simulation state ────────────────────────────────────────────────────────
  const [isRunning, setIsRunning]   = useState(false)
  const [progress,  setProgress]    = useState(0)
  const [visiblePts, setVisiblePts] = useState(0)   // how many chart points are revealed
  const [fullData,  setFullData]    = useState(null) // complete 90-day dataset
  const [termLogs,  setTermLogs]    = useState([])
  const [summary,   setSummary]     = useState(null)

  const intervalRef = useRef(null)

  useEffect(() => () => clearInterval(intervalRef.current), [])

  // ── start simulation ─────────────────────────────────────────────────────────
  const handleRun = useCallback(async () => {
    clearInterval(intervalRef.current)

    // Reset
    setIsRunning(true)
    setVisiblePts(0)
    setProgress(0)
    setTermLogs([])
    setSummary(null)
    setFullData(null)

    // Fetch (or mock)
    const data = await runSimulation(params)
    setFullData(data)

    // Animate: reveal 2 data-points every 60 ms
    let pt     = 0
    let logIdx = 0

    intervalRef.current = setInterval(() => {
      pt = Math.min(pt + 2, 90)
      setVisiblePts(pt)
      setProgress(Math.round((pt / 90) * 100))

      // Drip terminal logs in at the right day milestones
      while (logIdx < data.logs.length && LOG_TRIGGER_DAYS[logIdx] <= pt) {
        const entry = data.logs[logIdx] // capture value before incrementing
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

  // ── derived chart slices ──────────────────────────────────────────────────────
  const riskSlice     = fullData ? fullData.risks.slice(0, visiblePts)      : []
  const complaintSlice = fullData ? fullData.complaints.slice(0, visiblePts) : []

  // ── render ────────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gray-950 text-gray-100 p-4 md:p-6 selection:bg-blue-600/40">

      {/* Header */}
      <div className="mb-6 flex items-center gap-3">
        <div className="w-1.5 h-9 rounded-full bg-gradient-to-b from-blue-400 to-blue-600" />
        <div>
          <h1 className="text-xl md:text-2xl font-bold tracking-tight">AI Synthetic Sandbox</h1>
          <p className="text-xs text-gray-500 mt-0.5">
            Compliance Stress-Tester · 1,000 Virtual Users · 90-Day Simulation
          </p>
        </div>
        <div className="ml-auto flex items-center gap-2 text-xs text-gray-600">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block" />
          RegTech · FCA-aligned
        </div>
      </div>

      {/* Form | Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-[320px_1fr] gap-4 mb-4">
        <FormPanel
          params={params}
          setParams={setParams}
          onRun={handleRun}
          isRunning={isRunning}
          progress={progress}
          summary={summary}
        />
        <ChartPanel
          risks={riskSlice}
          complaints={complaintSlice}
          isRunning={isRunning}
          progress={progress}
        />
      </div>

      {/* Terminal */}
      <TerminalLog logs={termLogs} isRunning={isRunning} />
    </div>
  )
}
