const STATUS = {
  GREEN: { color: '#00d4aa', rag: 'GREEN' },
  AMBER: { color: '#facc15', rag: 'AMBER' },
  RED:   { color: '#f87171', rag: 'RED'   },
}

export default function ConsumerDutyCard({ outcome }) {
  const st  = STATUS[outcome.status] ?? STATUS.AMBER
  const deg = Math.round(outcome.score * 3.6)

  return (
    <div className="glass rounded-xl p-4 flex flex-col gap-3">
      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="text-[9px] text-white/25 font-mono mb-1 tracking-wider">{outcome.rule_ref}</p>
          <p className="text-xs font-medium text-white/80 leading-tight">{outcome.name}</p>
        </div>
        <span className="shrink-0 text-[9px] font-bold uppercase px-2 py-0.5 rounded-full"
              style={{ background: `${st.color}18`, color: st.color, border: `1px solid ${st.color}28` }}>
          {st.rag}
        </span>
      </div>

      {/* Score ring */}
      <div className="flex items-center gap-3">
        <div className="relative w-12 h-12 shrink-0">
          <div className="w-full h-full rounded-full"
               style={{ background: `conic-gradient(${st.color} ${deg}deg, rgba(255,255,255,0.05) ${deg}deg)` }} />
          <div className="absolute inset-[4px] rounded-full flex items-center justify-center"
               style={{ background: '#08090a' }}>
            <span className="text-xs font-semibold" style={{ color: st.color }}>{outcome.score}</span>
          </div>
        </div>
        <p className="text-[10px] text-white/35 leading-relaxed">{outcome.evidence}</p>
      </div>
    </div>
  )
}
