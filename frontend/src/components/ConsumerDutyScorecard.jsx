import ConsumerDutyCard from './ConsumerDutyCard'

const OVERALL_COLOR = { GREEN: '#00d4aa', AMBER: '#facc15', RED: '#f87171' }

export default function ConsumerDutyScorecard({ scorecard }) {
  if (!scorecard) return null
  const color = OVERALL_COLOR[scorecard.overall_status] ?? '#facc15'

  return (
    <div className="glass rounded-2xl p-5">
      <div className="flex items-center justify-between mb-4">
        <div>
          <p className="text-[9px] font-medium uppercase tracking-[0.3em] text-white/25">
            FCA Consumer Duty Assessment
          </p>
          <p className="text-[9px] text-white/15 mt-0.5 tracking-wide">PS22/9 · Four Statutory Outcomes</p>
        </div>
        <div className="flex items-baseline gap-1.5 px-3 py-1.5 rounded-xl"
             style={{ background: `${color}12`, border: `1px solid ${color}25` }}>
          <span className="text-[9px] uppercase tracking-wider" style={{ color }}>Overall</span>
          <span className="text-xl font-light" style={{ color }}>{scorecard.overall_score}</span>
          <span className="text-[9px] text-white/20">/ 100</span>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3">
        {scorecard.outcomes.map(o => (
          <ConsumerDutyCard key={o.outcome_id} outcome={o} />
        ))}
      </div>
    </div>
  )
}
