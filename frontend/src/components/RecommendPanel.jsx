// ─── RecommendPanel ───────────────────────────────────────────────────────────
// AI Fix-It Advisor — 3 prioritised Claude-generated remediation actions.
// Props:
//   recommendations – Recommendation[] | null

const OUTCOME_LABELS = {
  products_services:     'Products & Services',
  price_value:           'Price & Value',
  consumer_understanding:'Consumer Understanding',
  consumer_support:      'Consumer Support',
}

const STATUS_COLOR = {
  GREEN: { text: 'text-emerald-400', bg: 'bg-emerald-500/15', border: 'border-emerald-500/30' },
  AMBER: { text: 'text-yellow-400',  bg: 'bg-yellow-500/15',  border: 'border-yellow-500/30'  },
  RED:   { text: 'text-red-400',     bg: 'bg-red-500/15',     border: 'border-red-500/30'     },
}

const PRIORITY_BADGE = ['', 'bg-red-500/20 text-red-400', 'bg-orange-500/20 text-orange-400', 'bg-yellow-500/20 text-yellow-400']

function StatusPill({ status, label }) {
  const c = STATUS_COLOR[status] ?? STATUS_COLOR.AMBER
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-lg text-[10px] font-bold uppercase border ${c.text} ${c.bg} ${c.border}`}>
      {status}
    </span>
  )
}

export default function RecommendPanel({ recommendations }) {
  if (!recommendations?.length) return null

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5">
      {/* Header */}
      <div className="flex items-center gap-2 mb-4">
        <h2 className="text-[11px] font-semibold uppercase tracking-widest text-gray-500">
          AI Fix-It Advisor
        </h2>
        <span className="text-[10px] text-gray-600">— Claude-generated remediation plan</span>
      </div>

      {/* Recommendation cards */}
      <div className="flex flex-col gap-3">
        {recommendations.map(rec => (
          <div key={rec.priority}
            className="flex items-start gap-4 bg-gray-800/50 border border-gray-700/60 rounded-xl p-4">

            {/* Priority badge */}
            <span className={`shrink-0 w-6 h-6 flex items-center justify-center rounded-full text-xs font-black ${PRIORITY_BADGE[rec.priority] ?? ''}`}>
              {rec.priority}
            </span>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-2 mb-1">
                <span className="text-xs text-gray-500">
                  {OUTCOME_LABELS[rec.outcome_affected] ?? rec.outcome_affected}
                </span>
              </div>
              <p className="text-sm font-semibold text-gray-100 mb-1">{rec.action}</p>
              <p className="text-xs text-gray-400 leading-relaxed">{rec.detail}</p>
            </div>

            {/* Before → After status */}
            <div className="shrink-0 flex flex-col items-center gap-1 text-center">
              <StatusPill status={rec.before_status} />
              <span className="text-gray-600 text-xs leading-none">↓</span>
              <StatusPill status={rec.after_status} />
              <span className="text-[10px] text-gray-500">+{rec.score_delta} pts</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
