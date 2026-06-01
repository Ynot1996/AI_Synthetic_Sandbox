// ─── Dashboard ────────────────────────────────────────────────────────────────
// Top-level page coordinator.
// Owns all state and wires together:
//   FormPanel            → left  (inputs + verdict)
//   ChartPanel           → right (90-day chart)
//   ConsumerDutyScorecard → full-width (4 outcome cards, revealed after animation)
//   RecommendPanel       → full-width (3 AI fix-it cards, staggered reveal)
//   TerminalLog          → full-width (regulatory debate or plain persona log)

import { useState, useEffect, useRef, useCallback } from 'react'
import { runSimulation } from '../api/simulate'
import FormPanel             from './FormPanel'
import ChartPanel            from './ChartPanel'
import ConsumerDutyScorecard from './ConsumerDutyScorecard'
import RecommendPanel        from './RecommendPanel'
import TerminalLog           from './TerminalLog'

// Days at which each consumer-voice entry pops into the terminal during animation
const LOG_TRIGGER_DAYS = [14, 36, 67]

const DEFAULT_PARAMS = {
  productType:     'buy-now-pay-later',
  apr:             39.9,
  ageGroup:        '18–25',
  vulnerableRatio: 0.35,
}

export default function Dashboard() {
  // ── form ──────────────────────────────────────────────────────────────────
  const [params, setParams] = useState(DEFAULT_PARAMS)

  // ── simulation ────────────────────────────────────────────────────────────
  const [isRunning,  setIsRunning]  = useState(false)
  const [progress,   setProgress]   = useState(0)
  const [visiblePts, setVisiblePts] = useState(0)
  const [fullData,   setFullData]   = useState(null)
  const [summary,    setSummary]    = useState(null)

  // ── new panels ────────────────────────────────────────────────────────────
  const [scorecard,        setScorecard]        = useState(null)
  const [recommendations,  setRecommendations]  = useState(null)
  const [termLogs,         setTermLogs]         = useState([])   // consumer voices during animation
  const [debateMessages,   setDebateMessages]   = useState([])   // full debate after animation
  const [isDebateMode,     setIsDebateMode]     = useState(false)

  const intervalRef = useRef(null)
  const timeoutsRef = useRef([])

  // Cleanup on unmount
  useEffect(() => () => {
    clearInterval(intervalRef.current)
    timeoutsRef.current.forEach(clearTimeout)
  }, [])

  // ── run simulation ─────────────────────────────────────────────────────────
  const handleRun = useCallback(async () => {
    clearInterval(intervalRef.current)
    timeoutsRef.current.forEach(clearTimeout)
    timeoutsRef.current = []

    // Reset all state
    setIsRunning(true)
    setVisiblePts(0)
    setProgress(0)
    setSummary(null)
    setFullData(null)
    setScorecard(null)
    setRecommendations(null)
    setTermLogs([])
    setDebateMessages([])
    setIsDebateMode(false)

    const data = await runSimulation(params)
    setFullData(data)

    // Animate chart: reveal 2 points every 60 ms
    let pt     = 0
    let logIdx = 0

    intervalRef.current = setInterval(() => {
      pt = Math.min(pt + 2, 90)
      setVisiblePts(pt)
      setProgress(Math.round((pt / 90) * 100))

      // Drip consumer voices during animation
      while (logIdx < (data.logs?.length ?? 0) && LOG_TRIGGER_DAYS[logIdx] <= pt) {
        const entry = data.logs[logIdx]
        setTermLogs(prev => [...prev, entry])
        logIdx++
      }

      if (pt >= 90) {
        clearInterval(intervalRef.current)
        setIsRunning(false)
        setSummary(data.summary)

        // Staggered reveal of new panels
        const t1 = setTimeout(() => setScorecard(data.scorecard), 300)
        const t2 = setTimeout(() => setRecommendations(data.recommendations), 800)

        // Switch terminal to full debate mode after recommendations appear
        const t3 = setTimeout(() => {
          if (data.debateMessages?.length) {
            setDebateMessages([])
            setIsDebateMode(true)
            data.debateMessages.forEach((msg, idx) => {
              const t = setTimeout(() => {
                setDebateMessages(prev => [...prev, msg])
              }, idx * 700)
              timeoutsRef.current.push(t)
            })
          }
        }, 1200)

        timeoutsRef.current.push(t1, t2, t3)
      }
    }, 60)
  }, [params])

  // ── derived chart slices ──────────────────────────────────────────────────
  const riskSlice      = fullData ? fullData.risks.slice(0, visiblePts)      : []
  const complaintSlice = fullData ? fullData.complaints.slice(0, visiblePts) : []

  // Terminal shows debate when available, consumer voices during animation otherwise
  const terminalLogs      = debateMessages.length ? debateMessages : termLogs
  const terminalIsDebate  = debateMessages.length > 0

  // ── render ─────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gray-950 text-gray-100 p-4 md:p-6 selection:bg-blue-600/40">

      {/* Header */}
      <div className="mb-6 flex items-center gap-3">
        <div className="w-1.5 h-9 rounded-full bg-gradient-to-b from-blue-400 to-blue-600" />
        <div>
          <h1 className="text-xl md:text-2xl font-bold tracking-tight">AI Synthetic Sandbox</h1>
          <p className="text-xs text-gray-500 mt-0.5">
            Consumer Duty Copilot · 1,000 Virtual Users · 90-Day FCA Stress-Test
          </p>
        </div>
        <div className="ml-auto flex items-center gap-2 text-xs text-gray-600">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block" />
          RegTech · PS22/9
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

      {/* Consumer Duty Scorecard — staggered reveal at +300ms */}
      {scorecard && (
        <div className="mb-4 animate-fadeSlideIn">
          <ConsumerDutyScorecard scorecard={scorecard} />
        </div>
      )}

      {/* Fix-It Advisor — staggered reveal at +800ms */}
      {recommendations && (
        <div className="mb-4 animate-fadeSlideIn">
          <RecommendPanel recommendations={recommendations} />
        </div>
      )}

      {/* Terminal — debate mode after full animation */}
      <TerminalLog
        logs={terminalLogs}
        isRunning={isRunning}
        isDebateMode={terminalIsDebate}
      />
    </div>
  )
}
