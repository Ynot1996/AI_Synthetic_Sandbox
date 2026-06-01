const OUTCOME_LABELS = {
  products_services:     'Products & Services',
  price_value:           'Price & Value',
  consumer_understanding:'Consumer Understanding',
  consumer_support:      'Consumer Support',
}

const STATUS_COLOR = {
  GREEN: '#00d4aa',
  AMBER: '#facc15',
  RED:   '#f87171',
}

const PRIORITY_COLOR = ['', '#f87171', '#fb923c', '#facc15']

function StatusPill({ status }) {
  const color = STATUS_COLOR[status] ?? '#facc15'
  return (
    <span className="inline-flex items-center px-2 py-0.5 rounded-lg text-[9px] font-bold uppercase"
          style={{ background: `${color}15`, color, border: `1px solid ${color}25` }}>
      {status}
    </span>
  )
}

export default function RecommendPanel({ recommendations }) {
  if (!recommendations?.length) return null

  return (
    <div className="glass rounded-2xl p-5">
      <div className="flex items-center gap-3 mb-4">
        <p className="text-[9px] font-medium uppercase tracking-[0.3em] text-white/25">
          AI Fix-It Advisor
        </p>
        <span className="text-[9px] text-white/15">— Gemini-generated remediation plan</span>
      </div>

      <div className="flex flex-col gap-2.5">
        {recommendations.map(rec => (
          <div key={rec.priority}
               className="flex items-start gap-4 rounded-xl p-4 transition-colors hover:bg-white/[0.025]"
               style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>

            <span className="shrink-0 w-5 h-5 flex items-center justify-center rounded-full text-[10px] font-bold mt-0.5"
                  style={{
                    background: `${PRIORITY_COLOR[rec.priority] || '#facc15'}18`,
                    color: PRIORITY_COLOR[rec.priority] || '#facc15',
                    border: `1px solid ${PRIORITY_COLOR[rec.priority] || '#facc15'}28`,
                  }}>
              {rec.priority}
            </span>

            <div className="flex-1 min-w-0">
              <p className="text-[9px] text-white/25 mb-1 tracking-wide">
                {OUTCOME_LABELS[rec.outcome_affected] ?? rec.outcome_affected}
              </p>
              <p className="text-xs font-medium text-white/80 mb-1.5">{rec.action}</p>
              <p className="text-[10px] text-white/40 leading-relaxed">{rec.detail}</p>
            </div>

            <div className="shrink-0 flex flex-col items-center gap-1">
              <StatusPill status={rec.before_status} />
              <span className="text-white/15 text-xs">↓</span>
              <StatusPill status={rec.after_status} />
              <span className="text-[9px] text-white/25 mt-0.5">+{rec.score_delta} pts</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
