// ─── ConsumerDutyCard ─────────────────────────────────────────────────────────
// Single FCA Consumer Duty outcome card.
// Props:
//   outcome – { outcome_id, name, rule_ref, status, score, evidence }

const STATUS = {
  GREEN: { border: 'border-emerald-500/30', bg: 'bg-emerald-500/8',  text: 'text-emerald-400', ring: '#10b981', badge: 'bg-emerald-500/20 text-emerald-400' },
  AMBER: { border: 'border-yellow-500/30',  bg: 'bg-yellow-500/8',   text: 'text-yellow-400',  ring: '#f59e0b', badge: 'bg-yellow-500/20 text-yellow-400'  },
  RED:   { border: 'border-red-500/30',     bg: 'bg-red-500/8',      text: 'text-red-400',     ring: '#ef4444', badge: 'bg-red-500/20 text-red-400'         },
}

export default function ConsumerDutyCard({ outcome }) {
  const st    = STATUS[outcome.status] ?? STATUS.AMBER
  const deg   = Math.round(outcome.score * 3.6)  // 0-100 → 0-360 deg

  return (
    <div className={`rounded-xl border p-4 flex flex-col gap-3 ${st.border} ${st.bg}`}>
      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="text-[10px] text-gray-500 font-mono mb-0.5">{outcome.rule_ref}</p>
          <p className="text-sm font-semibold text-gray-100 leading-tight">{outcome.name}</p>
        </div>
        <span className={`shrink-0 text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${st.badge}`}>
          {outcome.status}
        </span>
      </div>

      {/* Score ring */}
      <div className="flex items-center gap-3">
        <div className="relative w-14 h-14 shrink-0">
          {/* Outer ring via conic-gradient */}
          <div
            className="w-full h-full rounded-full"
            style={{ background: `conic-gradient(${st.ring} ${deg}deg, #1f2937 ${deg}deg)` }}
          />
          {/* Inner circle (donut hole) */}
          <div className="absolute inset-[5px] rounded-full bg-gray-900 flex items-center justify-center">
            <span className={`text-sm font-bold ${st.text}`}>{outcome.score}</span>
          </div>
        </div>
        <p className="text-[11px] text-gray-400 leading-relaxed">{outcome.evidence}</p>
      </div>
    </div>
  )
}
