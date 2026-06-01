import { useEffect, useRef, useState } from 'react'
import { streamAudit } from '../api/audit'

const STEPS = [
  'Initialising document parser...',
  'Loading FCA knowledge base — FG22/5 · PS22/9...',
  'Extracting document structure and clauses...',
  'Running PRIN 2A cross-cutting rules check...',
  'Auditing Products & Services outcome (PRIN 2A.2)...',
  'Auditing Price & Value outcome (PRIN 2A.3)...',
  'Auditing Consumer Understanding outcome (PRIN 2A.4)...',
  'Auditing Consumer Support outcome (PRIN 2A.5)...',
  'Checking vulnerable consumer indicators (FG21/1)...',
  'Generating Consumer Duty scorecard...',
]

export default function AnalysisPage({ file, onComplete, onError }) {
  const [logs, setLogs]         = useState([])
  const [progress, setProgress] = useState(0)
  const [status, setStatus]     = useState('running')
  const logEndRef               = useRef(null)

  useEffect(() => {
    logEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [logs])

  useEffect(() => {
    let cancelled = false
    let stepIdx = 0

    const stepInterval = setInterval(() => {
      if (cancelled || stepIdx >= STEPS.length) return
      setLogs(prev => [...prev, { type: 'step', text: STEPS[stepIdx] }])
      setProgress(Math.min(Math.round(((stepIdx + 1) / STEPS.length) * 80), 80))
      stepIdx++
    }, 650)

    ;(async () => {
      try {
        for await (const event of streamAudit(file)) {
          if (cancelled) return
          if (event.event === 'log') {
            setLogs(prev => [...prev, { type: 'api', text: event.message }])
          } else if (event.event === 'complete') {
            clearInterval(stepInterval)
            setProgress(100)
            setStatus('done')
            setLogs(prev => [...prev, { type: 'success', text: 'Audit complete — generating report...' }])
            setTimeout(() => { if (!cancelled) onComplete(event.result) }, 700)
          } else if (event.event === 'error') {
            clearInterval(stepInterval)
            setStatus('error')
            setLogs(prev => [...prev, { type: 'error', text: event.message }])
            onError(event.message)
          }
        }
      } catch (e) {
        if (cancelled) return
        clearInterval(stepInterval)
        setStatus('error')
        setLogs(prev => [...prev, { type: 'error', text: e.message }])
        onError(e.message)
      }
    })()

    return () => { cancelled = true; clearInterval(stepInterval) }
  }, [])

  const dotColor = status === 'done' ? '#00d4aa' : status === 'error' ? '#f87171' : '#4f9cf9'
  const label    = status === 'done' ? 'Audit Complete' : status === 'error' ? 'Error' : 'Analysing'

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6 py-12"
         style={{ background: '#08090a' }}>

      {/* File header */}
      <div className="w-full max-w-2xl mb-7 animate-fadeUp">
        <div className="flex items-center gap-2 mb-1">
          <span className="w-1.5 h-1.5 rounded-full animate-pulse-dot" style={{ background: dotColor }} />
          <span className="text-[10px] tracking-[0.3em] text-white/25 uppercase">{label}</span>
        </div>
        <h2 className="text-lg font-light text-white/70">{file.name}</h2>
      </div>

      {/* Progress bar */}
      <div className="w-full max-w-2xl mb-5 animate-fadeUp delay-100">
        <div className="flex justify-between text-[10px] text-white/20 mb-2 tracking-wider">
          <span>FCA Consumer Duty Audit</span>
          <span>{progress}%</span>
        </div>
        <div className="h-px bg-white/[0.06] rounded-full overflow-hidden">
          <div className="h-full rounded-full transition-all duration-700 ease-out"
               style={{ width: `${progress}%`, background: 'linear-gradient(90deg, #4f9cf9, #00d4aa)' }} />
        </div>
      </div>

      {/* Terminal */}
      <div className="w-full max-w-2xl glass rounded-2xl overflow-hidden animate-fadeUp delay-200">
        {/* Title bar */}
        <div className="flex items-center gap-2 px-4 py-2.5 border-b border-white/[0.06] bg-white/[0.02]">
          <span className="w-2.5 h-2.5 rounded-full bg-red-500/50" />
          <span className="w-2.5 h-2.5 rounded-full bg-yellow-500/50" />
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500/50" />
          <span className="ml-2 text-[10px] text-white/20 font-mono tracking-wider">
            regtech-audit — stage-1-static-audit
          </span>
        </div>

        {/* Log output */}
        <div className="p-5 font-mono-jp space-y-1.5 overflow-y-auto" style={{ minHeight: 300, maxHeight: 400 }}>
          {logs.map((log, i) => (
            <div key={i} className="flex gap-2.5 animate-fadeIn" style={{ animationDelay: `${i * 0.02}s` }}>
              <span className="shrink-0 mt-px" style={{
                color: log.type === 'error'   ? '#f87171'
                     : log.type === 'success' ? '#00d4aa'
                     : log.type === 'api'     ? '#4f9cf9'
                     : 'rgba(255,255,255,0.2)'
              }}>
                {log.type === 'error' ? '✗' : log.type === 'success' ? '✓' : log.type === 'api' ? '›' : '·'}
              </span>
              <span style={{
                color: log.type === 'error'   ? '#f87171'
                     : log.type === 'success' ? '#00d4aa'
                     : log.type === 'api'     ? 'rgba(255,255,255,0.65)'
                     : 'rgba(255,255,255,0.3)'
              }}>{log.text}</span>
            </div>
          ))}
          {status === 'running' && (
            <div className="flex gap-2.5">
              <span className="text-white/15">·</span>
              <span className="text-white/30 animate-pulse">▊</span>
            </div>
          )}
          <div ref={logEndRef} />
        </div>
      </div>

      <p className="mt-7 text-[10px] tracking-[0.3em] text-white/12 uppercase animate-fadeUp delay-300">
        Gemini 2.5 Flash · Official FCA FG22/5 · PS22/9
      </p>
    </div>
  )
}
