import { useState, useEffect, useRef, useCallback } from 'react'
import { runSimulation } from '../api/simulate'
import FormPanel             from './FormPanel'
import ChartPanel            from './ChartPanel'
import ConsumerDutyScorecard from './ConsumerDutyScorecard'
import RecommendPanel        from './RecommendPanel'
import TerminalLog           from './TerminalLog'

const LOG_TRIGGER_DAYS = [14, 36, 67]

const DEFAULT_PARAMS = {
  productType:     'buy-now-pay-later',
  apr:             39.9,
  ageGroup:        '18–25',
  vulnerableRatio: 0.35,
}

export default function Dashboard({ presetParams }) {
  const [params, setParams] = useState(() => {
    if (!presetParams) return DEFAULT_PARAMS
    return {
      productType:     presetParams.product_type?.replace(/_/g, '-') ?? DEFAULT_PARAMS.productType,
      apr:             presetParams.apr             ?? DEFAULT_PARAMS.apr,
      ageGroup:        presetParams.target_age_group ?? DEFAULT_PARAMS.ageGroup,
      vulnerableRatio: presetParams.vulnerable_population_ratio ?? DEFAULT_PARAMS.vulnerableRatio,
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

    setIsRunning(true); setVisiblePts(0); setProgress(0)
    setSummary(null); setFullData(null); setScorecard(null)
    setRecommendations(null); setTermLogs([]); setDebateMessages([]); setIsDebateMode(false)

    const data = await runSimulation(params)
    setFullData(data)

    let pt = 0, logIdx = 0
    intervalRef.current = setInterval(() => {
      pt = Math.min(pt + 2, 90)
      setVisiblePts(pt)
      setProgress(Math.round((pt / 90) * 100))

      while (logIdx < (data.logs?.length ?? 0) && LOG_TRIGGER_DAYS[logIdx] <= pt) {
        setTermLogs(prev => [...prev, data.logs[logIdx++]])
      }

      if (pt >= 90) {
        clearInterval(intervalRef.current)
        setIsRunning(false)
        setSummary(data.summary)

        const t1 = setTimeout(() => setScorecard(data.scorecard), 300)
        const t2 = setTimeout(() => setRecommendations(data.recommendations), 800)
        const t3 = setTimeout(() => {
          if (data.debateMessages?.length) {
            setDebateMessages([]); setIsDebateMode(true)
            data.debateMessages.forEach((msg, idx) => {
              const t = setTimeout(() => setDebateMessages(prev => [...prev, msg]), idx * 700)
              timeoutsRef.current.push(t)
            })
          }
        }, 1200)

        timeoutsRef.current.push(t1, t2, t3)
      }
    }, 60)
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
