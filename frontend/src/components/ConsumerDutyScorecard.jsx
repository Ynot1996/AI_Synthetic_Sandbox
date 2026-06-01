// ─── ConsumerDutyScorecard ────────────────────────────────────────────────────
// Full FCA Consumer Duty panel — 4 outcome cards + overall badge.
// Props:
//   scorecard – { outcomes: DutyOutcome[], overall_score, overall_status }

import ConsumerDutyCard from './ConsumerDutyCard'

const OVERALL_BADGE = {
  GREEN: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40',
  AMBER: 'bg-yellow-500/20  text-yellow-400  border-yellow-500/40',
  RED:   'bg-red-500/20     text-red-400     border-red-500/40',
}

export default function ConsumerDutyScorecard({ scorecard }) {
  if (!scorecard) return null
  const badgeClass = OVERALL_BADGE[scorecard.overall_status] ?? OVERALL_BADGE.AMBER

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-[11px] font-semibold uppercase tracking-widest text-gray-500">
            FCA Consumer Duty Assessment
          </h2>
          <p className="text-[10px] text-gray-600 mt-0.5">PS22/9 · Four Statutory Outcomes</p>
        </div>
        <div className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs font-bold uppercase ${badgeClass}`}>
          <span>Overall</span>
          <span className="text-base font-black">{scorecard.overall_score}</span>
          <span>/ 100</span>
        </div>
      </div>

      {/* 4 outcome cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3">
        {scorecard.outcomes.map(outcome => (
          <ConsumerDutyCard key={outcome.outcome_id} outcome={outcome} />
        ))}
      </div>
    </div>
  )
}
