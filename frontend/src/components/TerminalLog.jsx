// ─── TerminalLog ──────────────────────────────────────────────────────────────
// Bottom terminal-style panel showing virtual user complaints.
// Props:
//   logs       – array of { timestamp, persona, message, severity }
//   isRunning  – shows blinking cursor when true

import { useEffect, useRef } from 'react'

const SEVERITY_COLOR = {
  HIGH:   'text-red-400',
  MEDIUM: 'text-yellow-400',
  LOW:    'text-emerald-400',
}

export default function TerminalLog({ logs, isRunning }) {
  const ref = useRef(null)

  // Auto-scroll to bottom whenever new logs are added
  useEffect(() => {
    if (ref.current) ref.current.scrollTop = ref.current.scrollHeight
  }, [logs])

  return (
    <div className="bg-black border border-gray-800 rounded-2xl overflow-hidden">
      {/* macOS-style title bar */}
      <div className="flex items-center gap-2.5 px-4 py-2.5 bg-gray-900/80 border-b border-gray-800">
        <span className="w-3 h-3 rounded-full bg-red-500/70" />
        <span className="w-3 h-3 rounded-full bg-yellow-500/70" />
        <span className="w-3 h-3 rounded-full bg-emerald-500/70" />
        <span className="ml-2 text-[11px] text-gray-600 font-mono">
          virtual-agent-terminal — 1,000 synthetic users
        </span>
      </div>

      {/* Log output */}
      <div ref={ref} className="h-52 overflow-y-auto px-4 py-3 font-mono text-xs space-y-4 scroll-smooth">
        {logs.length === 0 ? (
          <p className="text-gray-700">
            {isRunning ? '$ Initialising agents…' : '$ Awaiting simulation. Press ▶ Run to start.'}
          </p>
        ) : (
          logs.map((log, i) => (
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
        {isRunning && <span className="text-emerald-500 animate-pulse">█</span>}
      </div>
    </div>
  )
}
