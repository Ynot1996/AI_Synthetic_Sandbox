import { useEffect, useRef } from 'react'

const SEV_COLOR = { HIGH: '#f87171', MEDIUM: '#facc15', LOW: '#00d4aa' }

export default function TerminalLog({ logs, isRunning, isDebateMode = false }) {
  const ref = useRef(null)
  useEffect(() => {
    if (ref.current) ref.current.scrollTop = ref.current.scrollHeight
  }, [logs])

  const title = isDebateMode
    ? 'regulatory-debate — FCA Examiner · Compliance Officer · Consumers'
    : 'virtual-agent-terminal — 1,000 synthetic users · 90-day run'

  return (
    <div className="glass rounded-2xl overflow-hidden">
      {/* Title bar */}
      <div className="flex items-center gap-2 px-4 py-2.5 border-b border-white/[0.05]"
           style={{ background: 'rgba(255,255,255,0.02)' }}>
        <span className="w-2.5 h-2.5 rounded-full bg-red-500/50" />
        <span className="w-2.5 h-2.5 rounded-full bg-yellow-500/50" />
        <span className="w-2.5 h-2.5 rounded-full bg-emerald-500/50" />
        <span className="ml-2 text-[9px] text-white/20 font-mono tracking-wider truncate">{title}</span>
      </div>

      {/* Log output */}
      <div ref={ref} className="h-56 overflow-y-auto px-4 py-3 font-mono-jp space-y-3">
        {logs.length === 0 ? (
          <p className="text-white/15 text-[10px]">
            {isRunning ? '$ Initialising agents…' : '$ Awaiting simulation — press ▶ Run to start.'}
          </p>
        ) : (
          logs.map((log, i) => {
            const color = isDebateMode && log.color_class
              ? undefined
              : (SEV_COLOR[log.severity] ?? 'rgba(255,255,255,0.5)')
            return (
              <div key={i} className={`animate-fadeIn ${isDebateMode && log.color_class ? log.color_class : ''}`}>
                <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 mb-0.5">
                  <span className="text-white/20">[{log.timestamp}]</span>
                  <span className="font-medium" style={!isDebateMode ? { color } : {}}>
                    {log.persona}
                  </span>
                  {!isDebateMode && (
                    <span className="text-[9px] font-bold uppercase" style={{ color }}>
                      [{log.severity}]
                    </span>
                  )}
                </div>
                <p className="pl-3 text-[10px] leading-relaxed border-l border-white/[0.06]"
                   style={!isDebateMode ? { color } : {}}>
                  "{log.message}"
                </p>
              </div>
            )
          })
        )}
        {isRunning && <span className="text-[#00d4aa] animate-pulse text-xs">█</span>}
      </div>
    </div>
  )
}
